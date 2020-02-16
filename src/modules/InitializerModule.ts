// Copyright (c) 2020 Debashish Patra, MPL-2.0

// IncludeManager.ts
// Isolated module to handle header inclusion. Refer database at IncludeMapping.json

import * as vscode from "vscode";
import * as edit from "../utils/EditorHelper";
import { QuickPick, GetVSConfig } from "../modules/VSInterface";
import DefaultData from "../data/IncludeTemplates.json";
import ExtensionData from "../data/extensions/Includes_Ext.json";
import * as _ from "lodash";
import * as fs from "fs";
import context from "../data/ContextAutofill.json";
import IncludeManager from "../modules/IncludeManager";
import {
	WriteLinesToFile,
	GetMatchingSource,
	GetMatchingSourceSync,
} from "../utils/FilesystemHelper";
import { AddLinesToFile } from "../utils/FileHelper";

interface InitContextData {
	line: number;
	text?: string;
	symbol?: string;
	returntype?: string;
	symboltype?: string;
	cursorpos?: vscode.Position;
}
export default async function InitializerModule(): Promise<void> {
	let editor = vscode.window.activeTextEditor;
	let _file = editor?.document.uri.path;
	_file = _file?.substring(1, _file.length);
	console.log(_file);

	let data: InitContextData = {
		line: -1,
	};

	if (editor) {
		data.cursorpos = editor.selection.active;
		data.line = editor.selection.active.line;
	}

	// vscode.window.activeTextEditor?.selections.toString();

	data.text = editor?.document.lineAt(data.line).text;

	let symbolarray: string[] = [];

	// ---------- JSON data is matched here ------------------------------
	context.forEach(rule => {
		if (RegExp(rule.pattern).test(data.text!)) {
			let exres = data.text!.match(RegExp(rule.pattern));
			if (exres) {
				rule.parsemap.forEach(mapping => {
					symbolarray.push(exres![mapping]);
				});

				switch (rule.action) {
					case "copy": {
						let lineToWrite = edit.ResolveLines(rule.body, symbolarray, data.line);
						vscode.env.clipboard.writeText(lineToWrite);
						vscode.window.showInformationMessage("Initializer copied to clipboard.");
						break;
					}
					case "edit": {
						edit.InsertLineAsParsedData(rule.body, data.line, symbolarray);
						break;
					}
					case "headermodule": {
						IncludeManager();
						break;
					}
					case "fnbodygen": {
						let lineToWrite = edit.ResolveLines(rule.body, symbolarray, data.line, false);
						let classname = edit.GetClassSymbol(data.line);
						lineToWrite = lineToWrite.replace("$x", classname);
						while (/( ?=.*?)[,)]/.test(lineToWrite)) {
							let match = lineToWrite.match(/( ?=.*?)[,)]/);
							if (match) {
								lineToWrite = lineToWrite.replace(match[1], "");
							}
						}
						lineToWrite = lineToWrite.replace(/class /g, "");
						let choice = GetVSConfig<boolean>("SF", "autoAddFunctionsInSource");
						if (choice) {
							GetMatchingSourceSync(_file!).then(ret => {
								// console.log(ret);
								// WriteLinesToFile(ret, [lineToWrite]);
								AddLinesToFile(ret, [lineToWrite]);
							});
						} else {
							vscode.env.clipboard.writeText(lineToWrite);
							vscode.window.showInformationMessage("Function body copied to clipboard.");
						}
					}
					default: {
						break;
					}
				}
			}
		}
	});
	// }

	return new Promise<void>((resolve, reject) => {
		resolve();
	});
}

function GetEOL(editor: vscode.TextEditor, line: number): vscode.Position {
	// let editor = vscode.window.activeTextEditor;
	let text = editor?.document.lineAt(line).range.end;
	return text!;
}
