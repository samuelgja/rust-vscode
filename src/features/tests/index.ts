import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as toml from "toml";

/**
 * Find all matching test functions via regex, including async tests (e.g., #[anyword::test] or #[test]), and ensure they are not commented out.
 */
function findTests(
  document: vscode.TextDocument
): Array<{ name: string; range: vscode.Range }> {
  const fileText = document.getText();
  const tests: Array<{ name: string; range: vscode.Range }> = [];

  // Regex to match #[test] or #[anyword::test] and function names, skipping commented lines
  const testRegex =
    /^(?:[ \t]*\/\/.*\n)*[ \t]*#\[\s*(?:\w+::)?test\s*\][ \t]*(?:\n[ \t]*)*(?:async\s+)?fn\s+(\w+)/gm;

  let match;
  while ((match = testRegex.exec(fileText)) !== null) {
    const testName = match[1]; // Captured test function name

    // Get the start and end positions of the match
    const start = document.positionAt(match.index);
    const end = document.positionAt(testRegex.lastIndex);
    const range = new vscode.Range(start, end);

    tests.push({ name: testName, range });
  }

  console.log(`Found ${tests.length} tests in ${document.fileName}`);
  console.log(tests);

  return tests;
}

/**
 * This class provides CodeLens for test functions in the editor - find all tests in current document and provide CodeLens for them.
 * It finds all test functions in the current document and provides CodeLens for them (Run Test, Watch Test buttons).
 */
class TestCodeLensProvider implements vscode.CodeLensProvider {
  public provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const codeLenses: vscode.CodeLens[] = [];
    const tests = findTests(document);

    for (const test of tests) {
      const runTestCommand = {
        title: "Run Test",
        command: "extension.rust.tests.runTest",
        arguments: [document.fileName, test.name],
      };
      const watchTestCommand = {
        title: "Watch Test",
        command: "extension.rust.tests.watchTest",
        arguments: [document.fileName, test.name],
      };
      const runReleaseTestCommand = {
        title: "Run Release Test",
        command: "extension.rust.tests.runReleaseTest",
        arguments: [document.fileName, test.name],
      };
      const watchReleaseTestCommand = {
        title: "Watch Release Test",
        command: "extension.rust.tests.watchReleaseTest",
        arguments: [document.fileName, test.name],
      };

      codeLenses.push(new vscode.CodeLens(test.range, runTestCommand));
      codeLenses.push(new vscode.CodeLens(test.range, watchTestCommand));
      codeLenses.push(new vscode.CodeLens(test.range, runReleaseTestCommand));
      codeLenses.push(new vscode.CodeLens(test.range, watchReleaseTestCommand));
    }

    return codeLenses;
  }
}

// Default file pattern to search for Rust test files
const DEFAULT_FILE_PATTERN = "**/*.rs";
let activeTerminal: vscode.Terminal | null = null;

/**
 * This function registers a CodeLens provider for test files. It is used to display the "Run" and "Watch" buttons.
 */
export function registerTestCodeLens(context: vscode.ExtensionContext) {
  const codeLensProvider = new TestCodeLensProvider();

  // Get the user-defined file pattern from the settings, or use the default
  const pattern = vscode.workspace
    .getConfiguration("rust.tests")
    .get("filePattern", DEFAULT_FILE_PATTERN);
  const options = { scheme: "file", pattern };

  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      { ...options, language: "rust" },
      codeLensProvider
    )
  );
}

/**
 * This function registers the test runner commands.
 */
export function registerTestRunner(context: vscode.ExtensionContext) {
  // Utility function to run tests with different options
  async function runTestCommand(
    fileName?: string,
    testName?: string,
    watchMode: boolean = false,
    releaseMode: boolean = false
  ) {
    // Get custom flag
    const customFlag = vscode.workspace
      .getConfiguration("rust.tests")
      .get("customFlag", "")
      .trim();
    const customScriptSetting = vscode.workspace
      .getConfiguration("rust.tests")
      .get("customScript", "cargo test")
      .trim();
    const customScript = customScriptSetting.length
      ? customScriptSetting
      : "cargo test";
    // When this command is called from the command palette, the fileName and testName arguments are not passed
    if (!fileName) {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        fileName = editor.document.fileName;
      }
    }

    if (activeTerminal) {
      activeTerminal.dispose();
      activeTerminal = null;
    }

    activeTerminal = vscode.window.createTerminal("Cargo Test Runner");
    activeTerminal.show();

    // Determine the package info and adjust the command accordingly
    const cargoInfo = await getCargoInfo(fileName);
    if (cargoInfo) {
      const { packageName, targetType, targetName, cargoTomlDir } = cargoInfo;

      // Get the workspace root
      const workspaceFolders = vscode.workspace.workspaceFolders;
      const workspaceRoot =
        workspaceFolders && workspaceFolders.length > 0
          ? workspaceFolders[0].uri.fsPath
          : "";

      let command = customScript;

      const manifestArg = ` --manifest-path "${path.join(
        cargoTomlDir,
        "Cargo.toml"
      )}"`;
      const isCargoTomlDirRoot = cargoTomlDir === workspaceRoot;
      if (!isCargoTomlDirRoot && !watchMode) {
        // Use appropriate change directory command based on OS
        command += manifestArg;
      }
      if (packageName) {
        command += ` --package ${packageName}`;
      }

      if (targetType === "bin") {
        command += ` --bin ${targetName}`;
      } else if (targetType === "lib") {
        command += ` --lib`;
      }

      if (releaseMode) {
        command += " --release";
      }

      // Include any custom flags before the separator
      if (customFlag.length) {
        command += ` ${customFlag}`;
      }

      // Include arguments after `--`
      let testArgs = `--nocapture --exact`;

      if (testName && testName.length) {
        // Use the fully qualified test name
        const fullTestName =
          cargoInfo.testFunctionFullNames[testName] || testName;
        testArgs += ` ${fullTestName} --show-output`;
      }

      command += ` -- ${testArgs}`;

      // For watch mode, adjust the command
      if (watchMode) {
        // Remove "cargo " from the beginning of the command, if present
        let commandWithoutCargo = command.replace(/^cargo\s+/, "").trim();

        command = `cargo watch -x "${commandWithoutCargo}" -d 0.1`;

        if (!isCargoTomlDirRoot) {
          command = `cd "${cargoTomlDir}" && ${command}`;
        }
      }

      activeTerminal.sendText(command, true);
    } else {
      vscode.window.showErrorMessage(
        "Could not find Cargo.toml to determine package information."
      );
    }
  }

  // Function to get package info and collect fully qualified test names
  async function getCargoInfo(filePath: string): Promise<{
    packageName: string;
    targetType: "bin" | "lib";
    targetName: string;
    cargoTomlDir: string;
    testFunctionFullNames: { [key: string]: string };
  } | null> {
    try {
      // Find the nearest Cargo.toml file
      let dir = path.dirname(filePath);
      let cargoTomlPath = "";

      while (true) {
        const potentialCargoToml = path.join(dir, "Cargo.toml");
        if (fs.existsSync(potentialCargoToml)) {
          cargoTomlPath = potentialCargoToml;
          break;
        }
        const parentDir = path.dirname(dir);
        if (parentDir === dir) {
          // Reached root directory
          break;
        }
        dir = parentDir;
      }

      if (!cargoTomlPath) {
        return null;
      }

      const cargoTomlContent = fs.readFileSync(cargoTomlPath, "utf8");
      const cargoConfig = toml.parse(cargoTomlContent);

      const packageName = cargoConfig.package && cargoConfig.package.name;
      const cargoTomlDir = path.dirname(cargoTomlPath);

      const srcDir = path.join(cargoTomlDir, "src");

      // Determine if the crate has a library target
      let hasLib = false;
      if (cargoConfig.lib) {
        hasLib = true;
      } else {
        // Check if src/lib.rs exists
        if (fs.existsSync(path.join(srcDir, "lib.rs"))) {
          hasLib = true;
        }
      }

      // Collect fully qualified test function names
      const testFunctionFullNames = collectTestFunctionFullNames(
        filePath,
        cargoTomlDir
      );

      const relativeFilePath = path
        .relative(cargoTomlDir, filePath)
        .replace(/\\/g, "/");

      let targetType: "bin" | "lib" = "lib";
      let targetName = packageName;

      // List of binary targets
      const binTargets: Array<{ name: string; path: string }> = [];

      if (cargoConfig.bin && Array.isArray(cargoConfig.bin)) {
        for (const bin of cargoConfig.bin) {
          const binName = bin.name;
          const binPath = bin.path
            ? path.join(cargoTomlDir, bin.path)
            : path.join(cargoTomlDir, "src", "main.rs");
          binTargets.push({ name: binName, path: binPath });
        }
      } else {
        // Default binary path is src/main.rs
        const defaultBinPath = path.join(cargoTomlDir, "src", "main.rs");
        if (fs.existsSync(defaultBinPath)) {
          binTargets.push({ name: packageName, path: defaultBinPath });
        }
      }

      let isBin = false;

      // Check if the file is part of a binary target
      for (const bin of binTargets) {
        const binRelativePath = path
          .relative(cargoTomlDir, bin.path)
          .replace(/\\/g, "/");
        if (relativeFilePath === binRelativePath) {
          isBin = true;
          targetType = "bin";
          targetName = bin.name;
          break;
        } else if (relativeFilePath.startsWith("src/")) {
          // The file is in src/ and may be included via mod statements
          isBin = true;
          targetType = "bin";
          targetName = bin.name;
          break;
        }
      }

      if (!hasLib) {
        // If there is no library target, we must use --bin
        targetType = "bin";
        targetName = binTargets[0].name;
      }

      return {
        packageName,
        targetType,
        targetName,
        cargoTomlDir,
        testFunctionFullNames,
      };
    } catch (error) {
      console.error("Error parsing Cargo.toml:", error);
      return null;
    }
  }

  function collectTestFunctionFullNames(
    filePath: string,
    cargoTomlDir: string
  ): { [key: string]: string } {
    const fileContent = fs.readFileSync(filePath, "utf8");
    const testNames: { [key: string]: string } = {};
    const lines = fileContent.split("\n");

    // Compute the file-based module path
    const srcDir = path.join(cargoTomlDir, "src");
    let relativeFilePath = path.relative(srcDir, filePath).replace(/\\/g, "/");
    if (relativeFilePath.startsWith("../")) {
      // The file is not inside src/, so no module path
      relativeFilePath = "";
    }
    // Remove .rs extension and replace '/' with '::'
    let fileModulePath = relativeFilePath
      .replace(/\.rs$/, "")
      .replace(/\/mod$/, "")
      .replace(/\//g, "::");

    // Exclude main.rs and lib.rs from module path
    if (fileModulePath === "main" || fileModulePath === "lib") {
      fileModulePath = "";
    }

    // Split the module path into components
    const moduleStack: Array<{ name: string; braceLevel: number }> = [];
    if (fileModulePath) {
      fileModulePath.split("::").forEach((moduleName) => {
        moduleStack.push({ name: moduleName, braceLevel: -1 }); // Set braceLevel to -1
      });
    }

    let braceLevel = 0;
    let currentModulePath = moduleStack.map((m) => m.name).join("::");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for module declaration
      const moduleMatch = line.match(/^\s*mod\s+(\w+)\s*\{/);
      if (moduleMatch) {
        const moduleName = moduleMatch[1];
        moduleStack.push({ name: moduleName, braceLevel: braceLevel });
        currentModulePath = moduleStack.map((m) => m.name).join("::");
      }

      // Check for test functions
      const testMatch = line.match(/^\s*#\[\s*(?:\w+::)?test\s*\]/);
      if (testMatch) {
        // Next non-empty line should contain the function definition
        let j = i + 1;
        while (j < lines.length && lines[j].trim() === "") {
          j++;
        }
        if (j < lines.length) {
          const fnLine = lines[j];
          const fnMatch = fnLine.match(/^\s*(?:async\s+)?fn\s+(\w+)/);
          if (fnMatch) {
            const testFunctionName = fnMatch[1];
            let fullTestName = testFunctionName;
            if (currentModulePath) {
              fullTestName = `${currentModulePath}::${testFunctionName}`;
            }
            testNames[testFunctionName] = fullTestName;
          }
        }
      }

      // Update braceLevel
      braceLevel += (line.match(/{/g) || []).length;
      braceLevel -= (line.match(/}/g) || []).length;

      // Check if we need to pop modules (only those with non-negative braceLevel)
      while (
        moduleStack.length > 0 &&
        moduleStack[moduleStack.length - 1].braceLevel >= 0 &&
        braceLevel < moduleStack[moduleStack.length - 1].braceLevel + 1
      ) {
        moduleStack.pop();
        currentModulePath = moduleStack.map((m) => m.name).join("::");
      }
    }

    return testNames;
  }

  // Register the commands as before
  const runTest = vscode.commands.registerCommand(
    "extension.rust.tests.runTest",
    async (fileName?: string, testName?: string) => {
      runTestCommand(fileName, testName, false, false);
    }
  );

  const watchTest = vscode.commands.registerCommand(
    "extension.rust.tests.watchTest",
    async (fileName?: string, testName?: string) => {
      runTestCommand(fileName, testName, true, false);
    }
  );

  const runReleaseTest = vscode.commands.registerCommand(
    "extension.rust.tests.runReleaseTest",
    async (fileName?: string, testName?: string) => {
      runTestCommand(fileName, testName, false, true);
    }
  );

  const watchReleaseTest = vscode.commands.registerCommand(
    "extension.rust.tests.watchReleaseTest",
    async (fileName?: string, testName?: string) => {
      runTestCommand(fileName, testName, true, true);
    }
  );

  context.subscriptions.push(runTest);
  context.subscriptions.push(watchTest);
  context.subscriptions.push(runReleaseTest);
  context.subscriptions.push(watchReleaseTest);
}
