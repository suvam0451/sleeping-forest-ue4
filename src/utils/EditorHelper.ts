import * as vscode from "vscode";
var XRegExp = require("xregexp");
var path = require("path");
import * as ext from "./ExtensionHelper";
import { DErrorCode } from "./ErrorLogger";
const fs = require("fs");
import * as filesys from "./FilesystemHelper";
import { AActor, UActorComponent } from "../data/headerFunctions.json";
import { vsui, vsed } from "@suvam0451/vscode-geass";
import { start } from "repl";
import { resolve } from "dns";

export interface FunctionDefinition {
	comment: string;
	tutorial: string[];
	header: string;
	source: { prototype: string; returnType: string };
	access: string;
	important: boolean;
}

export async function ActiveFileName(editor: vscode.TextEditor): Promise<string> {
	// vscode.extensions.all
	return new Promise<string>((resolve, reject) => {
		if (editor) {
			// non-null assertion operator
			let FilePath = vscode.window.activeTextEditor?.document.fileName;
			let fileName = path.basename(FilePath);
			resolve(fileName);
		} else {
			reject("Editor is undefined. Are you currently focused on the terminal area ?");
		}
	});
}

export function InjectHeaders(lines: string[]) {
	let startingLine = vsed.MatchRegexInFile_Bounds(/^#include (.*?).h/); // returns range of match
	let finishingLine = vsed.MatchRegexInFile(/^#include (.*?).generated.h/); // single match/false (.cpp/.h)

	let arr = vsed.MatchRegexInFile_Bounds(/^#include (.*?).h/);
	console.log(arr[0], arr[1]);
	Promise.all([startingLine, finishingLine]).then(values => {
		if (values[1] !== -1) {
			let request = RemoveDuplicates(lines, values[0][0], values[1]);
			vsed.WriteAtLine_Silent(values[1], request);
		} else {
			let request = RemoveDuplicates(lines, values[0][0], values[0][1]);
			vsed.WriteAtLine_Silent(values[0][0], request);
		}
	});
}

/**  */
export function GetClassSymbol(at: number): string {
	let editor = vscode.window.activeTextEditor;
	let lineEnd = editor?.document.lineAt(at).range.end;

	while (at-- > 0) {
		let lineEnd = editor?.document.lineAt(at).text;
		// class TEST_API UProceduralMultiSpline : public UActorComponent
		if (/^class .*?_API/.test(lineEnd!)) {
			let exres = lineEnd?.match(/^class .*?_API (.*?) /);
			if (exres) {
				return exres[1];
			} else {
				return "";
			}
		}
	}
	return "";
}

/** Accepts an array of strings(lines) and uses another array of string(symbols) to
 * 	- Resolve the string
 * 	- Optionally resolve tabs */
export function ResolveLines(
	lines: string[],
	symbols: string[],
	at?: number,
	useTabs?: boolean,
): string {
	at = at ? at : 0;
	useTabs = useTabs === undefined ? true : useTabs;
	let editor = vscode.window.activeTextEditor;
	let startln = editor?.document.lineAt(at).text;
	let retline = "\n";

	// Get number of tabs
	let tabcount = 0;
	while (startln!.charAt(tabcount) === "\t") {
		tabcount++;
	}

	lines.forEach(line => {
		symbols.forEach((symbol, i) => {
			let str = "\\$" + (i + 1);
			if (symbol != undefined) {
				// console.log(str);

				line = line.replace(RegExp(str, "g"), symbol);
			} else {
				line = line.replace(RegExp(str, "g"), "");
			}
		});
		// caliberate tab offset (scope end)
		if (/.*?}$/.test(line)) {
			tabcount--;
		}
		if (useTabs) {
			retline = retline.concat("\t".repeat(tabcount) + line + "\n");
		} else {
			retline = retline.concat(line + "\n");
		}

		// caliberate tab offset (scope begin)
		if (/.*?{$/.test(line)) {
			tabcount++;
		}
	});
	return retline;
}

/** Replaces symbols numerically for an array of strings
 * @param lines array of lines
 * @param symbols organized array of symbols to replace
 */
export function ReplaceSymbols(lines: string[], symbols: string[]): string[] {
	// console.log("awol", lines);
	lines.forEach(line => {
		symbols.forEach((symbol, i) => {
			let str = "$" + (i + 1);
			line = line.replace(RegExp(str, "g"), symbol);
		});
	});
	// console.log("after patch", lines);
	return lines;
}
export function InsertLineAsParsedData(lines: string[], at: number, symbols: string[]) {
	let editor = vscode.window.activeTextEditor;
	let startln = editor?.document.lineAt(at).text;
	// Get number of tabs
	let tabcount = 0;
	while (startln!.charAt(tabcount) === "\t") {
		tabcount++;
	}

	let retline = "\n";

	lines.forEach(line => {
		symbols.forEach((symbol, i) => {
			let str = "\\$" + (i + 1);
			line = line.replace(RegExp(str, "g"), symbol);
		});
		// caliberate tab offset (scope end)
		if (/.*?}$/.test(line)) {
			tabcount--;
		}
		retline = retline.concat("\t".repeat(tabcount) + line + "\n");

		// caliberate tab offset (scope begin)
		if (/.*?{$/.test(line)) {
			tabcount++;
		}
	});

	InsertLineAt(retline, at);
}

/** Insert multiple lines at given line
 * @param lines Array of strings to insert (Brackets auto-evaluated)
 * @param at Position at which string is inserted. { Default: 0 }
 */
export function InsertLinesAt(lines: string[], at: number, debug?: boolean) {
	at = at ? at : 0;
	let editor = vscode.window.activeTextEditor;
	let lineEnd = editor?.document.lineAt(at).range.end;
	let startline = editor?.document.lineAt(at).text;

	// Get number of tabs
	let tabcount = 0;
	while (startline!.charAt(tabcount) === "\t") {
		console.log(startline?.charAt(tabcount));
		tabcount++;
	}
	// console.log(tabcount);
	let retline: string = "\n";
	lines.forEach(line => {
		// caliberate tab offset (scope end)
		if (/.*?}$/.test(line)) {
			tabcount--;
		}
		retline = retline.concat("\t".repeat(tabcount) + line + "\n");

		// caliberate tab offset (scope begin)
		if (/.*?{$/.test(line)) {
			tabcount++;
		}
	});
	// console.log(retline);
	InsertLineAt(retline, at);
}

/** Insert a single string at given line(optionally specify tabstops)
 * @param line the line to be inserted
 * @param at The position at which the string has to be inserted. Default = 0;
 * @param tabs Number of tabs to append. Default: Considers number of tabs in second parameter
 * @param debug Whether to show info message. Defaut: false
 */
export function InsertLineAt(line: string, at: number, tabs?: number, debug?: boolean) {
	at = at ? at : 0;
	debug = debug ? debug : false;
	let editor = vscode.window.activeTextEditor;
	let lineEnd = editor?.document.lineAt(at).range.end;
	editor
		?.edit(editBuilder => {
			editBuilder.insert(lineEnd!, line + "\n");
		})
		.then(
			() => {
				if (debug === true) {
					vscode.window.showInformationMessage("copied to clipboard.");
				}
			},
			err => {
				if (debug === true) {
					vscode.window.showInformationMessage("failed to write to editor : ", err);
				}
			},
		);
}

export function RemoveDuplicates(data: string[], start: number, end: number): string[] {
	let editor = vscode.window.activeTextEditor;
	const position = editor?.selection.active!;

	for (let i = start; i < end; i++) {
		for (let j = 0; j < data.length; j++) {
			if (editor!.document.lineAt(i).text === data[j]) {
				data.splice(j, 1);
			}
		}
	}
	console.log(data);
	return data;
}

export enum UE4_ClassTypes {
	UObject,
	Actor,
	Enum,
	Interface,
	FStruct,
}

/** Writes prototypes to both header and function */
export function AddFunction(data: filesys.FileData, func: FunctionDefinition, FromHeader: true) {
	if (FromHeader === true) {
		vsed.WriteAtCursor(["// " + func.comment, func.header]);
		vscode.workspace.saveAll().then(() => {
			filesys.WriteFunctionToFile(data.sourcepath, func.source, data.stripped_classname);
		});
	}
}
