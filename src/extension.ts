import * as vscode from "vscode";
import { registerTestRunner, registerTestCodeLens } from "./features/tests";

export function activate(context: vscode.ExtensionContext) {
  registerTestRunner(context);
  registerTestCodeLens(context);
}

export function deactivate() {}
