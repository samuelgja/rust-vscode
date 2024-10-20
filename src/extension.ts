import * as vscode from "vscode";
import { registerTestCodeLens, registerTestRunner } from "./features/tests";

export function activate(context: vscode.ExtensionContext) {
  registerTestRunner(context);
  registerTestCodeLens(context);
}

export function deactivate() {}
