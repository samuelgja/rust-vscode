import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as toml from "toml";

/**
 * Find all matching test functions via regex, including async tests
 */
function findTests(
  document: vscode.TextDocument
): Array<{ name: string; range: vscode.Range }> {
  const text = document.getText();
  const lines = text.split(/\r?\n/);
  const tests: Array<{ name: string; range: vscode.Range }> = [];

  // matches #[test], #[foo::test(...)] on its own line
  const attrRe = /^\s*#\[\s*(?:[\w:]+::)*test(?:\([^\]]*\))?\]\s*$/;
  // next non‑commented line containing `fn name`
  const fnRe = /^\s*(?:async\s+)?fn\s+(\w+)/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*\/\//.test(line)) continue; // skip commented attrs
    if (!attrRe.test(line)) continue;

    // scan ahead a few lines to find the fn
    for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
      const m = fnRe.exec(lines[j]);
      if (m) {
        const name = m[1];
        const startOffset =
          lines.slice(0, i).join("\n").length + (i > 0 ? 1 : 0);
        const endOffset = lines.slice(0, j + 1).join("\n").length;
        const start = document.positionAt(startOffset);
        const end = document.positionAt(endOffset);
        tests.push({ name, range: new vscode.Range(start, end) });
        break;
      }
    }
  }
  return tests;
}

class TestCodeLensProvider implements vscode.CodeLensProvider {
  public provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const codeLenses: vscode.CodeLens[] = [];
    for (const test of findTests(document)) {
      for (const [title, cmd] of [
        ["Run Test", "extension.rust.tests.runTest"],
        ["Watch Test", "extension.rust.tests.watchTest"],
        ["Run Release Test", "extension.rust.tests.runReleaseTest"],
        ["Watch Release Test", "extension.rust.tests.watchReleaseTest"],
      ] as const) {
        codeLenses.push(
          new vscode.CodeLens(test.range, {
            title,
            command: cmd,
            arguments: [document.fileName, test.name],
          })
        );
      }
    }
    return codeLenses;
  }
}

export function registerTestCodeLens(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      { scheme: "file", pattern: "**/*.rs", language: "rust" },
      new TestCodeLensProvider()
    )
  );
}

let activeTerminal: vscode.Terminal | null = null;

export function registerTestRunner(context: vscode.ExtensionContext) {
  async function runTestCommand(
    fileName?: string,
    testName?: string,
    watchMode = false,
    releaseMode = false
  ) {
    if (!fileName) {
      const editor = vscode.window.activeTextEditor;
      if (editor) fileName = editor.document.fileName;
      else return;
    }

    activeTerminal?.dispose();
    activeTerminal = vscode.window.createTerminal("Cargo Test Runner");
    activeTerminal.show();

    const info = await getCargoInfo(fileName);
    if (!info) {
      vscode.window.showErrorMessage("Could not find Cargo.toml");
      return;
    }

    let cmd = vscode.workspace
      .getConfiguration("rust.tests")
      .get<string>("customScript", "cargo test")
      .trim();

    const {
      packageName,
      targetType,
      targetName,
      cargoTomlDir,
      testFunctionFullNames,
    } = info;

    // manifest-path if not root, and package
    const workspaceFolders = vscode.workspace.workspaceFolders || [];
    const workspaceRoot =
      workspaceFolders.length > 0 ? workspaceFolders[0].uri.fsPath : "";
    if (cargoTomlDir !== workspaceRoot) {
      cmd += ` --manifest-path "${path.join(cargoTomlDir, "Cargo.toml")}"`;
    }
    if (packageName) cmd += ` --package ${packageName}`;
    if (targetType === "bin") cmd += ` --bin ${targetName}`;
    else if (targetType === "lib") cmd += ` --lib`;
    if (releaseMode) cmd += " --release";

    // collect test args
    let args = "--nocapture --exact";
    if (testName) {
      const full = testFunctionFullNames[testName] || testName;
      args += ` ${full} --show-output`;
    }
    cmd += ` -- ${args}`;

    if (watchMode) {
      let core = cmd.replace(/^cargo\s+/, "");
      cmd = `cargo watch -x "${core}" -d 0.1`;
      if (cargoTomlDir !== workspaceRoot) {
        cmd = `cd "${cargoTomlDir}" && ${cmd}`;
      }
    }

    activeTerminal.sendText(cmd, true);
  }

  async function getCargoInfo(filePath: string) {
    // locate Cargo.toml
    let dir = path.dirname(filePath);
    let tomlPath = "";
    while (true) {
      const p = path.join(dir, "Cargo.toml");
      if (fs.existsSync(p)) {
        tomlPath = p;
        break;
      }
      const up = path.dirname(dir);
      if (up === dir) break;
      dir = up;
    }
    if (!tomlPath) return null;

    const cargoDir = path.dirname(tomlPath);
    const cfg = toml.parse(fs.readFileSync(tomlPath, "utf8"));
    const pkgName = cfg.package?.name;
    const hasLib =
      !!cfg.lib || fs.existsSync(path.join(cargoDir, "src/lib.rs"));

    // collect full test names
    const testFunctionFullNames = collectTestFunctionFullNames(
      filePath,
      cargoDir
    );

    // determine bin vs lib
    let targetType: "bin" | "lib" = hasLib ? "lib" : "bin";
    let targetName = pkgName!;
    const bins: Array<{ name: string; path: string }> = [];
    if (Array.isArray(cfg.bin)) {
      for (const b of cfg.bin) {
        bins.push({
          name: b.name,
          path: b.path
            ? path.join(cargoDir, b.path)
            : path.join(cargoDir, "src/main.rs"),
        });
      }
    } else if (fs.existsSync(path.join(cargoDir, "src/main.rs"))) {
      bins.push({ name: pkgName!, path: path.join(cargoDir, "src/main.rs") });
    }

    const rel = path.relative(cargoDir, filePath).replace(/\\/g, "/");
    for (const b of bins) {
      const bRel = path.relative(cargoDir, b.path).replace(/\\/g, "/");
      if (rel === bRel || rel.startsWith("src/")) {
        targetType = "bin";
        targetName = b.name;
        break;
      }
    }

    return {
      packageName: pkgName,
      targetType,
      targetName,
      cargoTomlDir: cargoDir,
      testFunctionFullNames,
    };
  }

  function collectTestFunctionFullNames(
    filePath: string,
    cargoTomlDir: string
  ): { [key: string]: string } {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split(/\r?\n/);
    // *** CHANGED: now matches parameterized attributes too ***
    const attrRe = /^\s*#\[\s*(?:[\w:]+::)*test(?:\([^\]]*\))?\]\s*$/;

    const moduleStack: Array<{ name: string; braceLevel: number }> = [];
    const srcDir = path.join(cargoTomlDir, "src");
    let relPath = path.relative(srcDir, filePath).replace(/\\/g, "/");
    let fileMod = "";
    if (!relPath.startsWith("..")) {
      fileMod = relPath
        .replace(/\.rs$/, "")
        .replace(/\/mod$/, "")
        .replace(/\//g, "::");
      if (fileMod === "main" || fileMod === "lib") fileMod = "";
      else
        fileMod
          .split("::")
          .forEach((n) => moduleStack.push({ name: n, braceLevel: -1 }));
    }

    let brace = 0;
    const result: { [key: string]: string } = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const modM = line.match(/^\s*mod\s+(\w+)\s*\{/);
      if (modM) {
        moduleStack.push({ name: modM[1], braceLevel: brace });
      }

      // <-- only this testMatch is different now -->
      if (attrRe.test(line)) {
        // next non-empty line is fn
        let j = i + 1;
        while (j < lines.length && lines[j].trim() === "") j++;
        if (j < lines.length) {
          const fnM = lines[j].match(/^\s*(?:async\s+)?fn\s+(\w+)/);
          if (fnM) {
            const name = fnM[1];
            const full = [...moduleStack.map((m) => m.name)]
              .filter((n) => n)
              .join("::");
            result[name] = full ? `${full}::${name}` : name;
          }
        }
      }

      // update brace count and pop modules
      brace += (line.match(/{/g) || []).length;
      brace -= (line.match(/}/g) || []).length;
      while (
        moduleStack.length &&
        moduleStack[moduleStack.length - 1].braceLevel >= 0 &&
        brace < moduleStack[moduleStack.length - 1].braceLevel + 1
      ) {
        moduleStack.pop();
      }
    }

    return result;
  }

  // register commands:
  context.subscriptions.push(
    vscode.commands.registerCommand("extension.rust.tests.runTest", (f, t) =>
      runTestCommand(f, t, false, false)
    ),
    vscode.commands.registerCommand("extension.rust.tests.watchTest", (f, t) =>
      runTestCommand(f, t, true, false)
    ),
    vscode.commands.registerCommand(
      "extension.rust.tests.runReleaseTest",
      (f, t) => runTestCommand(f, t, false, true)
    ),
    vscode.commands.registerCommand(
      "extension.rust.tests.watchReleaseTest",
      (f, t) => runTestCommand(f, t, true, true)
    )
  );
}
