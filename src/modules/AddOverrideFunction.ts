// Copyright (c) 2020 Debashish Patra, MPL-2.0

// IncludeManager.ts
// Isolated module to let users paste their errors and search database for resolution.

import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import _ from "lodash";
import { PickFolder, GetVSConfig } from "./VSInterface";
import {
	CreateAndWrite,
	WriteFileAsync,
	WriteJSONToFile,
	ReadJSON,
	CreateDirIfMissing,
} from "../utils/FilesystemHelper";
import settings from "../data/templates/streamSettings.json";
import generator from "../data/templates/pythonGenerator.json";
import assetexportdata from "../data/templates/assetBasicDataTmpl.json";
import * as filesys from "../utils/FilesystemHelper";
import * as vsui from "../modules/VSInterface";
import InitializerModule from "./InitializerModule";
import InjectExcludeDefinition from "./InjectExclusions";
import FuncDefs from "../data/extensions/Functions_Core.json";
import * as vs from "../utils/FileHelper";
import { resolve } from "dns";

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
	console.log(filepath);

	// If not header, quit
	if (/.h$/.test(filepath!) === false) {
		vsui.showInfo(
			"Not a header file. Please use .h files OR contextually call from private:/public:/protected:",
		);
		return new Promise<void>((resolve, reject) => {
			resolve();
		});
	}
	// Append the xyz with
	let modpath = filesys.RelativeToAbsolute("suvam0451.sleeping-forest-ue4", _functionModPath);
	let extradata = filesys.ReadJSON<FunctionTemplate[]>(modpath!);
	let data: FunctionTemplate[] = FuncDefs.concat(extradata);

	let options: string[] = [];
	data.forEach(val => {
		options.push(val.id);
	});

	let pub = vs.RegexMatchLine(filepath!, /^public:$/);
	let prot = vs.RegexMatchLine(filepath!, /^protected:$/);
	let priv = vs.RegexMatchLine(filepath!, /^private:$/);
	let EOC = vs.RegexMatchLine(filepath!, /^};$/);

	Promise.all([pub, prot, priv, EOC]).then(vals => {
		return new Promise<void>((resolve, reject) => {
			console.log(vals[0], vals[1], vals[2], vals[3]);

			vsui.QuickPick(options, false).then(sel => {
				let choice = data.find(o => {
					return sel == o.id;
				});
				if (choice !== undefined) {
					let placeToWrite = vals[3]; // Default to EOC
					vscode.workspace.saveAll(true);
					switch (choice.field) {
						case "public": {
							if (vals[1] !== -1) {
								placeToWrite = vals[1];
							}
							break;
						}
						case "protected": {
							if (vals[2] !== -1) {
								placeToWrite = vals[2];
							}
							break;
						}
						case "private": {
							if (vals[3] !== -1) {
								placeToWrite = vals[3];
							}
							break;
						}
						default: {
							break;
						}
					}
					vs.WriteAtLine(filepath!, placeToWrite, ["\n\t" + choice.signature]);
				}
			});
			resolve();
		});
	});

	// let options: string[] = [];
	// data.forEach(val => {
	// 	options.push(val.id);
	// });
	// console.log(options);
	// vsui.QuickPick(options, false).then(sel => {
	// 	let choice = data.find(o => {
	// 		return sel == o.id;
	// 	});
	// 	if (choice !== undefined) {
	// 		vscode.workspace.saveAll();
	// 		switch (choice.field) {
	// 			case "public": {
	// 				vs.WriteAtLine(filepath!, pub, choice.body);
	// 				break;
	// 			}
	// 			case "protected": {
	// 				vs.WriteAtLine(filepath!, prot, choice.body);
	// 				break;
	// 			}
	// 			case "private": {
	// 				vs.WriteAtLine(filepath!, priv, choice.body);
	// 				break;
	// 			}
	// 		}
	// 	}
	// });
}
