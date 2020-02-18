// Copyright (c) 2020 Debashish Patra, MPL-2.0

// IncludeManager.ts
// Isolated module to handle header inclusion. Refer database at IncludeMapping.json

import * as vscode from "vscode";
import { resolve } from "dns";
import * as edit from "../utils/EditorHelper";

export async function QuickPick(
	arr: string[],
	doCompare: boolean,
	compareTo?: string,
): Promise<string> {
	return new Promise<string>((resolve, reject) => {
		vscode.window.showQuickPick(arr).then(
			retval => {
				if (doCompare) {
					retval === compareTo && doCompare ? resolve(retval) : reject("MISMATCH");
				} else {
					resolve(retval);
				}
			},
			() => {
				reject("ABORT");
			},
		);
	});
}

export async function PickFolder(): Promise<string> {
	let opt: vscode.OpenDialogOptions = {};
	opt.canSelectFiles = false;
	opt.canSelectFolders = true;

	return new Promise<string>((resolve, reject) => {
		vscode.window.showOpenDialog(opt).then(success => {
			console.log(success![0].fsPath);
			resolve(success![0].fsPath);
		});
	});
}

/** Gets vs config */
export function GetVSConfig<T>(namespace: string, key: string): T {
	let config = vscode.workspace.getConfiguration(namespace);
	let retval = config.get<T>(key)!;
	console.log(retval);
	return retval;
}

/** Gets vs config and updates it. Must be a list of strings */
export function AppendToVSConfig(namespace: string, key: string, vals: string): boolean {
	let config = vscode.workspace.getConfiguration(namespace);
	let retval = config.get<string[]>(key)!;
	if (retval == undefined) {
		console.log("Shotto Mattee");
	}

	// If already included, get out
	retval.forEach(val => {
		if (val == vals) {
			return true;
		}
	});

	// Otherwise add and update
	retval.push(vals);
	config.update(key, retval, undefined);
	return false;
}
