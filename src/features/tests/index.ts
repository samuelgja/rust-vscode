import * as vscode from "vscode";
import { parse_file } from "syn"; // Assuming we're using a JS-compatible Rust parser

/**
 * Find all matching test functions via Rust AST, including async tests (e.g., #[tokio::test])
 */
function findTests(
  document: vscode.TextDocument
): Array<{ name: string; range: vscode.Range }> {
  const fileText = document.getText();
  const sourceFile = parse_file(fileText); // Parse the Rust source file
  const tests: Array<{ name: string; range: vscode.Range }> = [];

  // Traverse the Rust AST to find test functions (both #[test] and #[tokio::test])
  function visitTestFn(item: any) {
    // Look for the `#[test]` or `#[tokio::test]` attribute
    const isTest =
      item.attrs &&
      item.attrs.some((attr: any) => {
        const attrPath = attr.path.segments
          .map((segment: any) => segment.ident.name)
          .join("::");
        return attrPath === "test" || attrPath === "tokio::test";
      });

    if (isTest) {
      // Get the function name
      const fnName = item.ident.name;

      // Get the range in the document
      const start = document.positionAt(item.span.start);
      const end = document.positionAt(item.span.end);
      const range = new vscode.Range(start, end);

      // Add the test function to the list
      tests.push({ name: fnName, range });
    }
  }

  // Visit every item (function) in the source file
  sourceFile.items.forEach(visitTestFn);

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
        command: "extension.bun.runTest",
        arguments: [document.fileName, test.name],
      };
      const watchTestCommand = {
        title: "Watch Test",
        command: "extension.bun.watchTest",
        arguments: [document.fileName, test.name],
      };
      const runReleaseTestCommand = {
        title: "Run Release Test",
        command: "extension.bun.runReleaseTest",
        arguments: [document.fileName, test.name],
      };
      const watchReleaseTestCommand = {
        title: "Watch Release Test",
        command: "extension.bun.watchReleaseTest",
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
// default file pattern to search for tests
const DEFAULT_FILE_PATTERN = "**/*.{spec,test}.{js,jsx,ts,tsx}";

/**
 * This function registers a CodeLens provider for test files. It is used to display the "Run" and "Watch" buttons.
 */
export function registerTestCodeLens(context: vscode.ExtensionContext) {
  const codeLensProvider = new TestCodeLensProvider();

  // Get the user-defined file pattern from the settings, or use the default
  // Setting is:
  // bun.test.filePattern
  const pattern = vscode.workspace
    .getConfiguration("bun.test")
    .get("filePattern", DEFAULT_FILE_PATTERN);
  const options = { scheme: "file", pattern };

  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      { ...options, language: "javascript" },
      codeLensProvider
    )
  );
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      { ...options, language: "typescript" },
      codeLensProvider
    )
  );
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      { ...options, language: "javascriptreact" },
      codeLensProvider
    )
  );
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      { ...options, language: "typescriptreact" },
      codeLensProvider
    )
  );
}

// Tracking only one active terminal, so there will be only one terminal running at a time.
// Example: when user clicks "Run Test" button, the previous terminal will be disposed.
let activeTerminal: vscode.Terminal | null = null;

/**
 * This function registers the test runner commands.
 */
export function registerTestRunner(context: vscode.ExtensionContext) {
  // Register the "Run Test" command
  const runTestCommand = vscode.commands.registerCommand(
    "extension.bun.runTest",
    async (
      fileName?: string,
      testName?: string,
      watchMode: boolean = false
    ) => {
      // Get custom flag
      const customFlag = vscode.workspace
        .getConfiguration("bun.test")
        .get("customFlag", "")
        .trim();
      const customScriptSetting = vscode.workspace
        .getConfiguration("bun.test")
        .get("customScript", "bun test")
        .trim();
      const customScript = customScriptSetting.length
        ? customScriptSetting
        : "bun test";
      // When this command is called from the command palette, the fileName and testName arguments are not passed (commands in package.json)
      // so then fileName is taken from the active text editor and it run for the whole file.
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

      activeTerminal = vscode.window.createTerminal("Bun Test Runner");
      activeTerminal.show();
      let command = customScript;
      if (fileName.length) {
        command += ` ${fileName}`;
      }
      if (testName.length) {
        if (customScriptSetting.length) {
          // escape the quotes in the test name
          command += ` -t \\"${testName}\\"`;
        } else {
          command += ` -t "${testName}"`;
        }
      }
      if (watchMode) {
        command += ` --watch`;
      }
      if (customFlag.length) {
        command += ` ${customFlag}`;
      }
      activeTerminal.sendText(command);
    }
  );

  // Register the "Watch Test" command, which just calls the "Run Test" command with the watch flag
  const watchTestCommand = vscode.commands.registerCommand(
    "extension.bun.watchTest",
    async (fileName?: string, testName?: string) => {
      vscode.commands.executeCommand(
        "extension.bun.runTest",
        fileName,
        testName,
        true
      );
    }
  );

  context.subscriptions.push(runTestCommand);
  context.subscriptions.push(watchTestCommand);
}
