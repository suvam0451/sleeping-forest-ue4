// Copyright (c) 2020 Debashish Patra, MPL-2.0

// IncludeManager.ts
// Isolated module to handle header inclusion. Refer database at IncludeMapping.json

import * as vscode from "vscode";
import * as edit from "../utils/EditorHelper";
import * as _ from "lodash";
import context from "../data/ContextAutofill.json";
import IncludeManager from "../modules/IncludeManager";
import { GetMatchingSourceSync } from "../utils/FilesystemHelper";
import { AddLinesToFile } from "../utils/FileHelper";
import { AddOverrideFunction } from "../modules/AddOverrideFunction";
import { vsui, vsed, vscfg } from "@suvam0451/vscode-geass";

interface InitContextData {
	line: number;
	text?: string;
	symbol?: string;
	returntype?: string;
	symboltype?: string;
	cursorpos?: vscode.Position;
}

interface Kill {
	id: string;
	body: string[];
	desc: string;
	action: string;
	pattern: string;
	parsemap: number[];
	filepattern?: string | undefined;
}
export default async function InitializerModule(): Promise<void> {
	let editor = vscode.window.activeTextEditor;
	let _file = editor?.document.uri.path;
	_file = _file?.substring(1, _file.length);

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
	let datalist: Kill[] = context;
	// let holla = context;
	datalist.forEach(rule => {
		if (RegExp(rule.pattern).test(data.text!)) {
			let exres = data.text!.match(RegExp(rule.pattern));
			if (exres) {
				rule.parsemap.forEach(mapping => {
					symbolarray.push(exres![mapping]);
				});

				switch (rule.action) {
					case "copy": {
						if (vsed.RegexTestActiveFile(rule.filepattern)) {
							let lineToWrite = edit.ResolveLines(rule.body, symbolarray, data.line);
							vscode.env.clipboard.writeText(lineToWrite);
							vsui.Info("Initializer copied to clipboard.");
						}
						break;
					}
					case "edit": {
						if (vsed.RegexTestActiveFile(rule.filepattern)) {
							edit.InsertLineAsParsedData(rule.body, data.line, symbolarray);
						}
						break;
					}
					case "replace": {
						if (vsed.RegexTestActiveFile(rule.filepattern)) {
							let outstr = StitchStringArray(rule.body, true);
							let secondstr = ResolveSymbols(outstr, symbolarray);
							ReplaceCurrentLine(secondstr);
						}
						break;
					}
					case "headermodule": {
						IncludeManager();
						break;
					}
					case "fnbodygen": {
						if (vsed.RegexTestActiveFile(rule.filepattern)) {
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
							let choice = vscfg.GetVSConfig<boolean>("SF", "autoAddFunctionsInSource");
							if (choice) {
								GetMatchingSourceSync(_file!).then(ret => {
									AddLinesToFile(ret, [lineToWrite]);
								});
							} else {
								vscode.env.clipboard.writeText(lineToWrite);
								vscode.window.showInformationMessage("Function body copied to clipboard.");
							}
						}
						break;
					}
					case "overridelib": {
						if (vsed.RegexTestActiveFile(rule.filepattern)) {
							AddOverrideFunction();
						} else {
							vsui.Info("Not a header file. Please use .h files.");
						}
						break;
					}
					case "replace_super": {
						ReplaceSuper();
						break;
					}
					default: {
						break;
					}
				}
			}
		}
	});

	return new Promise<void>((resolve, reject) => {
		resolve();
	});
}

function ReplaceSuper() {
	let editor = vscode.window.activeTextEditor;
	let testline = editor.selection.active.line - 1;
	let mytext = editor.document.lineAt(testline).text;
	if (/::(.*?) ?{/.test(mytext)) {
		let exres = mytext.match(/::(.*?) ?{/);
		let mystr = exres[1].replace(/ const/, "");
		mystr = mystr.replace(/\((.*?)\)/, "");
		let str = "Super::" + mystr + "("; // starting Super::Tick(

		if (/( [a-zA-Z]*\,?)[\)|\,]/.test(mytext)) {
			let exres2 = mytext.match(/( [a-zA-Z]*\,?)[\)|\,]/g);
			for (let i = 0; i < exres2.length; i++) {
				let element = exres2[i];
				if (i === 0) {
					element = element.trim();
				}
				str = str.concat(element);
			}
			str = str.concat(";");
		} else {
			str = str.concat(");");
		}

		vsed.WriteAtLine_Silent(testline + 1, ["\t" + str]);
	} else {
		vsui.Info("Function syntax incompatible.");
	}
}
function GetEOL(editor: vscode.TextEditor, line: number): vscode.Position {
	// let editor = vscode.window.activeTextEditor;
	let text = editor?.document.lineAt(line).range.end;
	return text!;
}

/** Simple replaces te current line with the new stitched string */
export function ReplaceCurrentLine(_In: string) {
	let editor = vscode.window.activeTextEditor;
	let pos = editor?.selection.active.line;
	let startingloc = editor?.document.lineAt(pos);
	editor?.edit(editBuilder => {
		editBuilder.replace(startingloc.range, _In);
	});
}

export function StitchStringArray(newval: string[], preserveTabs?: boolean): string {
	let editor = vscode.window.activeTextEditor;
	let pos = editor?.selection.active.line;
	let startingloc = editor?.document.lineAt(pos);
	let numtabs = preserveTabs === true ? NumberOfTabs(startingloc.text) : 0;
	let retstr = "";
	newval.forEach(str => {
		retstr = retstr.concat("\t".repeat(numtabs), str, "\n");
	});
	retstr = retstr.trimRight(); // get rid of ending \n ONLY
	// editor
	// 	?.edit(editBuilder => {
	// 		editBuilder.replace(startingloc.range, retstr);
	// 	});
	return retstr;
}

function NumberOfTabs(_In: string): number {
	var count = 0;
	var index = 0;
	while (_In.charAt(index++) === "\t") {
		count++;
	}
	return count;
}

function ResolveSymbolsInMultiple(_In: string[], symbols: string[]): string[] {
	symbols.forEach((symbol, i) => {
		let str = "\\$" + (i + 1);
		if (symbol !== undefined) {
			_In[i] = _In[i].replace(RegExp(str, "g"), symbol);
		} else {
			_In[i] = _In[i].replace(RegExp(str, "g"), "");
		}
	});
	return _In;
}

/** Replaces $x with values from symbols array. Takes a single string.
 * 	Use StitchStringArray to process an array.
 * @param _In
 * @param symbols sumbol array
 */
function ResolveSymbols(_In: string, symbols: string[]): string {
	symbols.forEach((symbol, i) => {
		let str = "\\$" + (i + 1);
		if (symbol !== undefined) {
			_In = _In.replace(RegExp(str, "g"), symbol);
		} else {
			_In = _In.replace(RegExp(str, "g"), "");
		}
	});
	return _In;
}
