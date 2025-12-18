import { describe, test, expect, beforeEach, afterEach, mock } from "bun:test";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// Mock vscode module before importing index
mock.module("vscode", () => ({
  workspace: {
    getConfiguration: () => ({
      get: <T>(_key: string, defaultValue: T): T => defaultValue,
    }),
    workspaceFolders: [{ uri: { fsPath: "" } }],
  },
  window: {
    createTerminal: () => ({
      show: () => {},
      sendText: () => {},
      dispose: () => {},
    }),
    showErrorMessage: () => {},
    activeTextEditor: undefined,
  },
  commands: {
    registerCommand: () => ({ dispose: () => {} }),
  },
  languages: {
    registerCodeLensProvider: () => ({ dispose: () => {} }),
  },
  Range: class Range {
    constructor(public start: any, public end: any) {}
  },
  CodeLens: class CodeLens {
    constructor(public range: any, public command: any) {}
  },
  ExtensionContext: class ExtensionContext {
    subscriptions: any[] = [];
  },
}));

import {
  collectTestFunctionFullNames,
  getCargoInfo,
  buildCargoTestCommand,
  type CargoInfo,
} from "./index";

// Helper to create temporary test directories
let tempDirs: string[] = [];

function createTempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rust-test-"));
  tempDirs.push(dir);
  return dir;
}

function createFile(dir: string, filePath: string, content: string): string {
  const fullPath = path.join(dir, filePath);
  const dirPath = path.dirname(fullPath);
  fs.mkdirSync(dirPath, { recursive: true });
  fs.writeFileSync(fullPath, content, "utf8");
  return fullPath;
}

afterEach(() => {
  // Clean up temp directories
  for (const dir of tempDirs) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  }
  tempDirs = [];
});

describe("collectTestFunctionFullNames", () => {
  test("should handle test in lib.rs", () => {
    const cargoDir = createTempDir();
    const filePath = createFile(
      cargoDir,
      "src/lib.rs",
      `
#[test]
fn test_something() {
    assert!(true);
}
`
    );

    const result = collectTestFunctionFullNames(filePath, cargoDir);
    expect(result).toEqual({
      test_something: "lib::test_something",
    });
  });

  test("should handle test in main.rs", () => {
    const cargoDir = createTempDir();
    const filePath = createFile(
      cargoDir,
      "src/main.rs",
      `
#[test]
fn test_main() {
    assert!(true);
}
`
    );

    const result = collectTestFunctionFullNames(filePath, cargoDir);
    expect(result).toEqual({
      test_main: "main::test_main",
    });
  });

  test("should handle test in mod.rs", () => {
    const cargoDir = createTempDir();
    const filePath = createFile(
      cargoDir,
      "src/replay/mod.rs",
      `
#[test]
fn test_replay() {
    assert!(true);
}
`
    );

    const result = collectTestFunctionFullNames(filePath, cargoDir);
    expect(result).toEqual({
      test_replay: "replay::test_replay",
    });
  });

  test("should handle test in module_name.rs (like harness.rs)", () => {
    const cargoDir = createTempDir();
    const filePath = createFile(
      cargoDir,
      "src/replay/harness.rs",
      `
#[test]
fn test_harness() {
    assert!(true);
}
`
    );

    const result = collectTestFunctionFullNames(filePath, cargoDir);
    expect(result).toEqual({
      test_harness: "replay::harness::test_harness",
    });
  });

  test("should handle test in nested mod.rs submodule", () => {
    const cargoDir = createTempDir();
    const filePath = createFile(
      cargoDir,
      "src/replay/harness/mod.rs",
      `
#[test]
fn test_nested() {
    assert!(true);
}
`
    );

    const result = collectTestFunctionFullNames(filePath, cargoDir);
    expect(result).toEqual({
      test_nested: "replay::harness::test_nested",
    });
  });

  test("should handle test in module_name.rs with nested mod", () => {
    const cargoDir = createTempDir();
    const filePath = createFile(
      cargoDir,
      "src/replay/harness.rs",
      `
mod tests {
    #[test]
    fn test_replay_harness_hash_chain_verification() {
        assert!(true);
    }
}
`
    );

    const result = collectTestFunctionFullNames(filePath, cargoDir);
    expect(result).toEqual({
      test_replay_harness_hash_chain_verification:
        "replay::harness::tests::test_replay_harness_hash_chain_verification",
    });
  });

  test("should handle test in tests/ folder (integration test)", () => {
    const cargoDir = createTempDir();
    const filePath = createFile(
      cargoDir,
      "tests/integration_test.rs",
      `
#[test]
fn test_integration() {
    assert!(true);
}
`
    );

    const result = collectTestFunctionFullNames(filePath, cargoDir);
    expect(result).toEqual({
      test_integration: "integration_test::test_integration",
    });
  });

  test("should handle test in tests/ subdirectory", () => {
    const cargoDir = createTempDir();
    const filePath = createFile(
      cargoDir,
      "tests/integration/api_test.rs",
      `
#[test]
fn test_api() {
    assert!(true);
}
`
    );

    const result = collectTestFunctionFullNames(filePath, cargoDir);
    expect(result).toEqual({
      test_api: "integration::api_test::test_api",
    });
  });

  test("should handle async test", () => {
    const cargoDir = createTempDir();
    const filePath = createFile(
      cargoDir,
      "src/lib.rs",
      `
#[tokio::test]
async fn test_async() {
    assert!(true);
}
`
    );

    const result = collectTestFunctionFullNames(filePath, cargoDir);
    expect(result).toEqual({
      test_async: "lib::test_async",
    });
  });

  test("should handle multiple tests in same file", () => {
    const cargoDir = createTempDir();
    const filePath = createFile(
      cargoDir,
      "src/lib.rs",
      `
#[test]
fn test_one() {
    assert!(true);
}

#[test]
fn test_two() {
    assert!(true);
}
`
    );

    const result = collectTestFunctionFullNames(filePath, cargoDir);
    expect(result).toEqual({
      test_one: "lib::test_one",
      test_two: "lib::test_two",
    });
  });
});

describe("getCargoInfo", () => {
  test("should detect lib target for lib.rs", async () => {
    const cargoDir = createTempDir();
    createFile(
      cargoDir,
      "Cargo.toml",
      `
[package]
name = "my_lib"
`
    );
    createFile(cargoDir, "src/lib.rs", "");

    const filePath = createFile(
      cargoDir,
      "src/lib.rs",
      `
#[test]
fn test_lib() {
    assert!(true);
}
`
    );

    const info = await getCargoInfo(filePath);
    expect(info).not.toBeNull();
    expect(info!.targetType).toBe("lib");
    expect(info!.packageName).toBe("my_lib");
  });

  test("should detect bin target for main.rs", async () => {
    const cargoDir = createTempDir();
    createFile(
      cargoDir,
      "Cargo.toml",
      `
[package]
name = "my_bin"
`
    );
    const filePath = createFile(
      cargoDir,
      "src/main.rs",
      `
#[test]
fn test_main() {
    assert!(true);
}
`
    );

    const info = await getCargoInfo(filePath);
    expect(info).not.toBeNull();
    expect(info!.targetType).toBe("bin");
    expect(info!.targetName).toBe("my_bin");
  });

  test("should detect lib target for module in src/ (not main.rs)", async () => {
    const cargoDir = createTempDir();
    createFile(
      cargoDir,
      "Cargo.toml",
      `
[package]
name = "my_bin"
`
    );
    createFile(cargoDir, "src/main.rs", "");
    createFile(cargoDir, "src/lib.rs", ""); // Add lib.rs so it's treated as lib
    const filePath = createFile(
      cargoDir,
      "src/replay/harness.rs",
      `
#[test]
fn test_harness() {
    assert!(true);
}
`
    );

    const info = await getCargoInfo(filePath);
    expect(info).not.toBeNull();
    // Even in a binary crate, modules in src/ should use --lib
    expect(info!.targetType).toBe("lib");
  });

  test("should detect test target for tests/ directory", async () => {
    const cargoDir = createTempDir();
    createFile(
      cargoDir,
      "Cargo.toml",
      `
[package]
name = "my_lib"
`
    );
    createFile(cargoDir, "src/lib.rs", "");
    const filePath = createFile(
      cargoDir,
      "tests/integration_test.rs",
      `
#[test]
fn test_integration() {
    assert!(true);
}
`
    );

    const info = await getCargoInfo(filePath);
    expect(info).not.toBeNull();
    expect(info!.targetType).toBe("test");
  });

  test("should handle binary crate with custom bin", async () => {
    const cargoDir = createTempDir();
    createFile(
      cargoDir,
      "Cargo.toml",
      `
[package]
name = "my_app"

[[bin]]
name = "node"
path = "src/main.rs"
`
    );
    const filePath = createFile(
      cargoDir,
      "src/main.rs",
      `
#[test]
fn test_node() {
    assert!(true);
}
`
    );

    const info = await getCargoInfo(filePath);
    expect(info).not.toBeNull();
    expect(info!.targetType).toBe("bin");
    expect(info!.targetName).toBe("node");
  });

  test("should return null when Cargo.toml not found", async () => {
    const cargoDir = createTempDir();
    const filePath = createFile(
      cargoDir,
      "some/deep/path/file.rs",
      `
#[test]
fn test() {
    assert!(true);
}
`
    );

    const info = await getCargoInfo(filePath);
    expect(info).toBeNull();
  });
});

describe("buildCargoTestCommand", () => {
  const baseInfo: CargoInfo = {
    packageName: "my_package",
    targetType: "lib",
    targetName: "my_package",
    cargoTomlDir: "/path/to/crate",
    testFunctionFullNames: {
      test_something: "test_something",
    },
  };

  test("should build command for lib test with test name before --", () => {
    const cmd = buildCargoTestCommand(baseInfo, {
      testName: "test_something",
      release: false,
      workspaceRoot: "/path/to/workspace",
      customScript: "cargo test",
    });

    expect(cmd).toContain("--package my_package");
    expect(cmd).toContain("--lib");
    expect(cmd).toContain("test_something");
    // Test name should be before --
    expect(cmd).toMatch(/test_something\s+--\s+--nocapture/);
    expect(cmd).not.toContain("--exact");
    expect(cmd).toContain("--show-output");
  });

  test("should build command for bin test with full path after --", () => {
    const binInfo: CargoInfo = {
      ...baseInfo,
      targetType: "bin",
      targetName: "my_bin",
      testFunctionFullNames: {
        test_main: "tests::test_main",
      },
    };

    const cmd = buildCargoTestCommand(binInfo, {
      testName: "test_main",
      release: false,
      workspaceRoot: "/path/to/workspace",
      customScript: "cargo test",
    });

    expect(cmd).toContain("--bin my_bin");
    expect(cmd).toContain("--exact");
    expect(cmd).toContain("tests::test_main");
    // Full path should be after --
    expect(cmd).toMatch(/--\s+--nocapture --exact tests::test_main/);
  });

  test("should build command for integration test (no --lib or --bin)", () => {
    const testInfo: CargoInfo = {
      ...baseInfo,
      targetType: "test",
      testFunctionFullNames: {
        test_integration: "test_integration",
      },
    };

    const cmd = buildCargoTestCommand(testInfo, {
      testName: "test_integration",
      release: false,
      workspaceRoot: "/path/to/workspace",
      customScript: "cargo test",
    });

    expect(cmd).not.toContain("--lib");
    expect(cmd).not.toContain("--bin");
    expect(cmd).toContain("test_integration");
    expect(cmd).toMatch(/test_integration\s+--\s+--nocapture/);
    expect(cmd).not.toContain("--exact");
  });

  test("should include --release flag when requested", () => {
    const cmd = buildCargoTestCommand(baseInfo, {
      testName: "test_something",
      release: true,
      workspaceRoot: "/path/to/workspace",
      customScript: "cargo test",
    });

    expect(cmd).toContain("--release");
  });

  test("should include extra args when provided", () => {
    const cmd = buildCargoTestCommand(baseInfo, {
      testName: "test_something",
      release: false,
      extraArgs: "--features test-feature",
      workspaceRoot: "/path/to/workspace",
      customScript: "cargo test",
    });

    expect(cmd).toContain("--features test-feature");
  });

  test("should include manifest-path when cargoDir differs from workspace", () => {
    const cmd = buildCargoTestCommand(baseInfo, {
      testName: "test_something",
      release: false,
      workspaceRoot: "/path/to/workspace",
      customScript: "cargo test",
    });

    expect(cmd).toContain('--manifest-path "/path/to/crate/Cargo.toml"');
  });

  test("should not include manifest-path when cargoDir equals workspace", () => {
    const cmd = buildCargoTestCommand(baseInfo, {
      testName: "test_something",
      release: false,
      workspaceRoot: "/path/to/crate",
      customScript: "cargo test",
    });

    expect(cmd).not.toContain("--manifest-path");
  });

  test("should build command without test name (run all)", () => {
    const cmd = buildCargoTestCommand(baseInfo, {
      release: false,
      workspaceRoot: "/path/to/workspace",
      customScript: "cargo test",
    });

    expect(cmd).toContain("--lib");
    expect(cmd).toMatch(/--\s+--nocapture$/);
    expect(cmd).not.toContain("test_something");
  });

  test("should handle custom script", () => {
    const cmd = buildCargoTestCommand(baseInfo, {
      testName: "test_something",
      release: false,
      workspaceRoot: "/path/to/workspace",
      customScript: "cargo test --no-fail-fast",
    });

    expect(cmd).toMatch(/^cargo test --no-fail-fast/);
  });

  test("should handle nextest command structure", () => {
    const cmd = buildCargoTestCommand(
      baseInfo,
      {
        testName: "test_null_literal",
        release: false,
        workspaceRoot: "/path/to/workspace",
        customScript: "cargo nextest",
      }
    );

    // Should include "run" subcommand
    expect(cmd).toContain("cargo nextest run");
    // Should have --package and --lib
    expect(cmd).toContain("--package my_package");
    expect(cmd).toContain("--lib");
    // Should have test name
    expect(cmd).toContain("test_null_literal");
    // Nextest uses --nocapture directly, not after --
    expect(cmd).toContain("--nocapture");
    expect(cmd).not.toContain("-- --nocapture");
    expect(cmd).not.toContain("--show-output");
  });

  test("should handle nextest with run already in script", () => {
    const cmd = buildCargoTestCommand(
      baseInfo,
      {
        testName: "test_something",
        release: false,
        workspaceRoot: "/path/to/workspace",
        customScript: "cargo nextest run",
      }
    );

    // Should not duplicate "run"
    expect(cmd).toMatch(/cargo nextest run/);
    const runCount = (cmd.match(/run/g) || []).length;
    expect(runCount).toBe(1);
  });
});

describe("Integration scenarios", () => {
  test("should handle harness.rs with tests module (real scenario)", async () => {
    const cargoDir = createTempDir();
    createFile(
      cargoDir,
      "Cargo.toml",
      `
[package]
name = "oh_coin_node"

[[bin]]
name = "node"
path = "src/main.rs"
`
    );
    createFile(cargoDir, "src/main.rs", "");

    const filePath = createFile(
      cargoDir,
      "src/replay/harness.rs",
      `
mod tests {
    #[test]
    fn test_replay_harness_hash_chain_verification() {
        assert!(true);
    }
}
`
    );

    const info = await getCargoInfo(filePath);
    expect(info).not.toBeNull();
    expect(info!.targetType).toBe("lib"); // Module in src/ should use --lib

    const fullNames = collectTestFunctionFullNames(filePath, cargoDir);
    expect(fullNames).toEqual({
      test_replay_harness_hash_chain_verification:
        "replay::harness::tests::test_replay_harness_hash_chain_verification",
    });

    const cmd = buildCargoTestCommand(info!, {
      testName: "test_replay_harness_hash_chain_verification",
      release: false,
      workspaceRoot: cargoDir,
      customScript: "cargo test",
    });

    // Should use --lib and test name (not full path) for nested module tests
    // Cargo test with --lib uses pattern matching on function names, not full paths
    expect(cmd).toContain("--lib");
    expect(cmd).toContain("test_replay_harness_hash_chain_verification");
    expect(cmd).toMatch(
      /test_replay_harness_hash_chain_verification\s+--\s+--nocapture --show-output/
    );
    expect(cmd).not.toContain("--exact");
    expect(cmd).not.toContain("replay::harness::tests::");
  });

  test("should handle test in tests/ folder", async () => {
    const cargoDir = createTempDir();
    createFile(
      cargoDir,
      "Cargo.toml",
      `
[package]
name = "my_lib"
`
    );
    createFile(cargoDir, "src/lib.rs", "");

    const filePath = createFile(
      cargoDir,
      "tests/integration_test.rs",
      `
#[test]
fn test_integration() {
    assert!(true);
}
`
    );

    const info = await getCargoInfo(filePath);
    expect(info).not.toBeNull();
    expect(info!.targetType).toBe("test");

    const cmd = buildCargoTestCommand(info!, {
      testName: "test_integration",
      release: false,
      workspaceRoot: cargoDir,
      customScript: "cargo test",
    });

    // Should not have --lib or --bin
    expect(cmd).not.toContain("--lib");
    expect(cmd).not.toContain("--bin");
    expect(cmd).toContain("test_integration");
    expect(cmd).toMatch(/test_integration\s+--\s+--nocapture --show-output/);
  });
});
