// Copyright (c) 2020 Debashish Patra, MPL-2.0

// FileSystemHelaper.ts
// Used to get filepaths, searching and indexing.

var path = require("path");
import * as vscode from "vscode";
import * as _ from "lodash";

export async function CompileShaders() {
	let projectpath =
		vscode.workspace.workspaceFolders![0].uri.fsPath +
		"/" +
		vscode.workspace.workspaceFolders![0].name +
		".uproject";
	let enginePath = vscode.workspace.workspaceFolders![1].uri.fsPath;
	let terminal = vscode.window.createTerminal("Compiling Shaders");
	let UATPath = path.join(enginePath, "./Engine/Build/BatchFiles/RunUAT.bat");
	// const terminal = vscode.window.createTerminal(`Ext Terminal #${NEXT_TERM_ID++}`);
	let args =
		" '" +
		'"/k "' +
		UATPath +
		'"' +
		" BuildCookRun -project=" +
		projectpath +
		" -platform=" +
		"Win64" +
		" -cook" +
		"'";
	let cmd = "start-process cmd.exe" + args;
	terminal.sendText(cmd);
}

export async function CompileCode() {
	let projectpath =
		vscode.workspace.workspaceFolders![0].uri.fsPath +
		"/" +
		vscode.workspace.workspaceFolders![0].name +
		".uproject";
	let enginePath = vscode.workspace.workspaceFolders![1].uri.fsPath;
	let terminal = vscode.window.createTerminal("Compiling Shaders");
	let UATPath = path.join(enginePath, "./Engine/Build/BatchFiles/RunUAT.bat");
	// Send to terminal
	let args =
		" '" +
		'"/k "' +
		UATPath +
		'"' +
		" BuildCookRun -project=" +
		projectpath +
		" -platform=" +
		"Win64" +
		" -build" +
		"'";
	let cmd = "start-process cmd.exe" + args;
	terminal.sendText(cmd);
}

export function RunCmd(terminal: vscode.Terminal, args: string) {
	let cmd = "start-process cmd.exe" + args;
	terminal.sendText(cmd);
}
