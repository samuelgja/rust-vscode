import * as fs from "fs";
import * as path from "path";
import { parse } from "smol-toml";
import type * as vscodeType from "vscode";

// Import vscode - use try/catch for runtime, but TypeScript will see the type
let vscode: typeof vscodeType;
try {
  vscode = require("vscode");
} catch {
  // In test environments, vscode may not be available
  // We'll handle this in functions that use it
  vscode = undefined as any;
}

/* ───────────────────────── helpers ───────────────────────── */

interface TestInfo {
  name: string;
  range: vscodeType.Range;
}

/** Find all #[test]-annotated (incl. parameterised) functions, incl. async */
function findTests(doc: vscodeType.TextDocument): TestInfo[] {
  const lines = doc.getText().split(/\r?\n/);
  const tests: TestInfo[] = [];

  const attrRe = /^\s*#\[\s*(?:[\w:]+::)*test(?:\([^\]]*\))?\]\s*$/;
  const fnRe = /^\s*(?:async\s+)?fn\s+(\w+)/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*\/\//.test(line) || !attrRe.test(line)) continue;

    for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
      const m = fnRe.exec(lines[j]);
      if (m) {
        const name = m[1];
        const start = doc.positionAt(
          lines.slice(0, i).join("\n").length + (i ? 1 : 0)
        );
        const end = doc.positionAt(lines.slice(0, j + 1).join("\n").length);
        tests.push({ name, range: new vscode!.Range(start, end) });
        break;
      }
    }
  }
  return tests;
}

class TestCodeLensProvider implements vscodeType.CodeLensProvider {
  provideCodeLenses(doc: vscodeType.TextDocument): vscodeType.CodeLens[] {
    const actions: Array<[string, string]> = [
      ["Run Test", "extension.rust.tests.runTest"],
      ["Watch Test", "extension.rust.tests.watchTest"],
      ["Run Release Test", "extension.rust.tests.runReleaseTest"],
      ["Watch Release Test", "extension.rust.tests.watchReleaseTest"],
      ["Profile Test (Samply)", "extension.rust.tests.profileTest"],
    ];
    return findTests(doc).flatMap(({ name, range }) =>
      actions.map(
        ([title, cmd]) =>
          new vscode!.CodeLens(range, {
            title,
            command: cmd,
            arguments: [doc.fileName, name],
          })
      )
    );
  }
}

export function registerTestCodeLens(ctx: vscodeType.ExtensionContext) {
  ctx.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      { scheme: "file", pattern: "**/*.rs", language: "rust" },
      new TestCodeLensProvider()
    )
  );
}

/* ────────────────────── runner core ─────────────────────── */

let activeTerminal: vscodeType.Terminal | null = null;

/** All info needed to build a cargo test command */
export interface CargoInfo {
  packageName?: string;
  targetType: "bin" | "lib" | "test";
  targetName: string;
  cargoTomlDir: string;
  testFunctionFullNames: Record<string, string>;
}

/**
 * Build the `cargo test … -- <args>` part.
 * Shared by normal run/watch and Samply profiling.
 */
export function buildCargoTestCommand(
  info: CargoInfo,
  opts: {
    testName?: string;
    release: boolean;
    extraArgs?: string; // e.g. custom `--features`
    workspaceRoot?: string;
    customScript?: string;
  }
): string {
  // In production, get from vscode config; in tests, use provided or default
  let customScript: string;
  let workspaceRoot: string;

  if (opts.customScript !== undefined || opts.workspaceRoot !== undefined) {
    // Test mode - use provided values
    customScript = opts.customScript ?? "cargo test";
    workspaceRoot = opts.workspaceRoot ?? "";
  } else {
    // Production mode - use vscode config
    if (!vscode) {
      throw new Error("vscode API not available");
    }
    const cfg = vscode.workspace.getConfiguration("rust.tests");
    customScript = cfg.get<string>("customScript", "cargo test").trim();
    workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? "";
  }

  let cmd = customScript.trim();

  if (info.cargoTomlDir !== workspaceRoot) {
    cmd += ` --manifest-path "${path.join(info.cargoTomlDir, "Cargo.toml")}"`;
  }
  if (info.packageName) cmd += ` --package ${info.packageName}`;
  // Integration tests in tests/ don't need --lib or --bin
  if (info.targetType === "bin") cmd += ` --bin ${info.targetName}`;
  else if (info.targetType === "lib") cmd += ` --lib`;
  // targetType === "test" means integration test, no flag needed
  if (opts.release) cmd += " --release";

  if (opts.extraArgs?.trim()) cmd += ` ${opts.extraArgs.trim()}`;

  // For --lib and integration tests: test name goes before -- (just function name, not full path)
  // For --bin tests: full path goes after -- with --exact
  if (opts.testName) {
    if (info.targetType === "lib" || info.targetType === "test") {
      // For lib and integration tests: test name before --
      // Always use just the function name (cargo will pattern match)
      // Cargo test with --lib doesn't accept full module paths, only function names
      const testName = opts.testName;
      cmd += ` ${testName}`;
      return `${cmd} -- --nocapture --show-output`;
    } else {
      // For bin tests: full path after -- with --exact
      const full = info.testFunctionFullNames[opts.testName] ?? opts.testName;
      return `${cmd} -- --nocapture --exact ${full} --show-output`;
    }
  }

  // No specific test, just run all
  return `${cmd} -- --nocapture`;
}

/**
 * Ensure there’s a visible terminal named “Cargo Test Runner”
 * (past one is disposed each invocation).
 */
function createTerminal(name: string): vscodeType.Terminal {
  activeTerminal?.dispose();
  activeTerminal = vscode.window.createTerminal(name);
  activeTerminal.show();
  return activeTerminal;
}

/**
 * Safely single-quote a string for a POSIX shell.
 * Used for `cargo watch -x <subcommand>`.
 */
function shellSingleQuote(s: string): string {
  if (s.length === 0) return "''";
  // turn   foo'bar   into   'foo'\''bar'
  return `'${s.replace(/'/g, `'\\''`)}'`;
}

/* ───────────────────── cargo.toml parsing ────────────────── */

export async function getCargoInfo(
  filePath: string
): Promise<CargoInfo | null> {
  // Ascend tree to locate Cargo.toml
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
  const cfg: Record<string, any> = parse(fs.readFileSync(tomlPath, "utf8"));
  const pkgName: string | undefined = cfg.package?.name;
  const hasLib = !!cfg.lib || fs.existsSync(path.join(cargoDir, "src/lib.rs"));

  // full qualified test names
  const testFunctionFullNames = collectTestFunctionFullNames(
    filePath,
    cargoDir
  );

  // Determine binary / lib / integration test target
  let targetType: "bin" | "lib" | "test" = hasLib ? "lib" : "bin";
  let targetName = pkgName!;
  const bins: Array<{ name: string; path: string }> = [];

  if (Array.isArray(cfg.bin)) {
    cfg.bin.forEach((b: any) =>
      bins.push({
        name: b.name ?? pkgName!,
        path: path.join(cargoDir, b.path ?? "src/main.rs"),
      })
    );
  } else if (fs.existsSync(path.join(cargoDir, "src/main.rs"))) {
    bins.push({ name: pkgName!, path: path.join(cargoDir, "src/main.rs") });
  }

  const rel = path.relative(cargoDir, filePath).replace(/\\/g, "/");

  // Check if this is an integration test in tests/ directory
  if (rel.startsWith("tests/")) {
    targetType = "test";
    targetName = pkgName!;
  } else {
    // Check if this is a binary file
    let isBinaryFile = false;
    for (const b of bins) {
      const bRel = path.relative(cargoDir, b.path).replace(/\\/g, "/");
      // Only use --bin if the file is actually the binary file itself
      if (rel === bRel) {
        targetType = "bin";
        targetName = b.name;
        isBinaryFile = true;
        break;
      }
    }
    // If file is in src/ but not a binary file, treat as lib even if no lib.rs exists
    // This handles cases like harness.rs in binary crates
    if (!isBinaryFile && rel.startsWith("src/")) {
      targetType = "lib";
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

export function collectTestFunctionFullNames(
  filePath: string,
  cargoDir: string
): Record<string, string> {
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  const attrRe = /^\s*#\[\s*(?:[\w:]+::)*test(?:\([^\]]*\))?\]\s*$/;

  const moduleStack: Array<{ name: string; braceLevel: number }> = [];
  const relPath = path.relative(cargoDir, filePath).replace(/\\/g, "/");

  // Handle integration tests in tests/ directory
  if (relPath.startsWith("tests/")) {
    // For integration tests, each file is a separate crate
    // Module path is based on the file name (without .rs) and any subdirectories
    const testRelPath = relPath.replace(/^tests\//, "").replace(/\.rs$/, "");
    testRelPath
      .replace(/\/mod$/, "")
      .replace(/\//g, "::")
      .split("::")
      .filter(Boolean)
      .forEach((n) => moduleStack.push({ name: n, braceLevel: -1 }));
  } else {
    // Handle unit tests in src/ directory
    const srcDir = path.join(cargoDir, "src");
    const srcRelPath = path.relative(srcDir, filePath).replace(/\\/g, "/");
    if (!srcRelPath.startsWith("..")) {
      srcRelPath
        .replace(/\.rs$/, "")
        .replace(/\/mod$/, "")
        .replace(/\//g, "::")
        .split("::")
        .filter(Boolean)
        .forEach((n) => moduleStack.push({ name: n, braceLevel: -1 }));
    }
  }

  const result: Record<string, string> = {};
  let brace = 0;

  lines.forEach((line, idx) => {
    const modM = line.match(/^\s*mod\s+(\w+)\s*\{/);
    if (modM) moduleStack.push({ name: modM[1], braceLevel: brace });

    if (attrRe.test(line)) {
      let j = idx + 1;
      while (j < lines.length && lines[j].trim() === "") j++;
      const fnM = lines[j]?.match(/^\s*(?:async\s+)?fn\s+(\w+)/);
      if (fnM) {
        const full = moduleStack
          .map((m) => m.name)
          .filter(Boolean)
          .join("::");
        result[fnM[1]] = full ? `${full}::${fnM[1]}` : fnM[1];
      }
    }

    brace += (line.match(/{/g) || []).length;
    brace -= (line.match(/}/g) || []).length;
    while (
      moduleStack.length &&
      moduleStack[moduleStack.length - 1].braceLevel >= 0 &&
      brace < moduleStack[moduleStack.length - 1].braceLevel + 1
    ) {
      moduleStack.pop();
    }
  });
  return result;
}

/* ─────────────────────── command impls ───────────────────── */

async function runTestCommand(
  fileName?: string,
  testName?: string,
  watch = false,
  release = false
) {
  if (!fileName) fileName = vscode.window.activeTextEditor?.document.fileName;
  if (!fileName) return;

  const info = await getCargoInfo(fileName);
  if (!info) {
    vscode.window.showErrorMessage("Could not find Cargo.toml");
    return;
  }

  const cargoCmd = buildCargoTestCommand(info, { testName, release });
  const term = createTerminal("Cargo Test Runner");

  if (watch) {
    // Strip leading `cargo ` and safely single-quote for `-x`
    const core = cargoCmd.replace(/^cargo\s+/, "");
    const quotedCore = shellSingleQuote(core);

    const workspaceRoot =
      vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? "";
    const chdir =
      info.cargoTomlDir !== workspaceRoot
        ? `cd "${info.cargoTomlDir}" && `
        : "";

    term.sendText(`${chdir}cargo watch -x ${quotedCore} -d 0.1`, true);
  } else {
    term.sendText(cargoCmd, true);
  }
}

async function runProfileCommand(fileName?: string, testName?: string) {
  if (!fileName) fileName = vscode.window.activeTextEditor?.document.fileName;
  if (!fileName) return;

  const info = await getCargoInfo(fileName);
  if (!info) {
    vscode.window.showErrorMessage("Could not find Cargo.toml");
    return;
  }

  const base = buildCargoTestCommand(info, { testName, release: true });
  const samplyCmd = vscode.workspace
    .getConfiguration("rust.tests")
    .get<string>("samplyScript", "samply record")
    .trim();

  const term = createTerminal("Cargo Test Profiler");
  term.sendText(`${samplyCmd} ${base}`, true);
}

/* ─────────────────────── registration ───────────────────── */

export function registerTestRunner(ctx: vscodeType.ExtensionContext) {
  ctx.subscriptions.push(
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
    ),
    vscode.commands.registerCommand(
      "extension.rust.tests.profileTest",
      (f, t) => runProfileCommand(f, t)
    )
  );
}
