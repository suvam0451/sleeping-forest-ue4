// Copyright (c) 2020 Debashish Patra, MPL-2.0

// IncludeManager.ts
// Isolated module to let users paste their errors and search database for resolution.

import * as vscode from "vscode";
import _ from "lodash";
import * as filesys from "../utils/FilesystemHelper";
import FuncDefs from "../data/extensions/Functions_Core.json";
import * as vs from "../utils/FileHelper";
import { vsui, vsed, vsfs } from "vscode-geass";
import { ADDRGETNETWORKPARAMS } from "dns";

const _functionModPath = "data/extensions/Functions_Ext.json";

interface FunctionTemplate {
	id: string;
	comment: string;
	signature: string;
	field: string;
	body: string[];
}

/**  */
export async function AddOverrideFunction(): Promise<void> {
	let filepath = vscode.window.activeTextEditor?.document.uri.fsPath;
	vscode.workspace.saveAll();

	// Append the xyz with
	let modpath = filesys.RelativeToAbsolute("suvam0451.sleeping-forest-ue4", _functionModPath);
	let extradata = filesys.ReadJSON<FunctionTemplate[]>(modpath!);
	let data: FunctionTemplate[] = FuncDefs.concat(extradata);
	console.log(data);
	console.log(modpath);

	let options: string[] = [];
	data.forEach((o) => {
		options.push(o.id);
	});

	let pub = vsfs.RegexMatchLine(filepath, /^public:$/);
	let prot = vsfs.RegexMatchLine(filepath, /^protected:$/);
	let priv = vsfs.RegexMatchLine(filepath, /^private:$/);
	let EOC = vsfs.RegexMatchLine(filepath, /^};$/);

	Promise.all([pub, prot, priv, EOC]).then((vals) => {
		return new Promise<void>((resolve, reject) => {
			vsui.QuickPickAsync(options, false).then((sel) => {
				let choice = data.find((o) => {
					return sel === o.id;
				});
				if (choice !== undefined) {
					let placeToWrite = vals[3]; // Default to EOC
					vscode.workspace.saveAll(true);
					switch (choice.field) {
						case "public": {
							placeToWrite = vals[1] !== -1 ? vals[1] : vals[3];
							break;
						}
						case "protected": {
							placeToWrite = vals[2] !== -1 ? vals[2] : vals[3];
							break;
						}
						case "private": {
							placeToWrite = vals[3];
							break;
						}
						default: {
							break;
						}
					}
					vs.WriteAtLineAsync(filepath!, placeToWrite, ["\n\t" + choice.signature]);
				}
			});
			resolve();
		});
	});
}
