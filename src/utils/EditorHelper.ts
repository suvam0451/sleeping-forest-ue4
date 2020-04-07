import * as vscode from "vscode";
var path = require("path");
import * as filesys from "./FilesystemHelper";
import { vsui, vsed } from "@suvam0451/vscode-geass";
import * as _ from "lodash";

export interface FunctionDefinition {
	comment: string;
	tutorial: string[];
	header: string;
	source: { prototype: string; returnType: string };
	access: string;
	important: boolean;
}

/** Globally removes parts of text from a line using regex */
export function StringRemoveGlobal(inputstr: string, ...symbols: string[]): string {
	_.forEach(symbols, (symbol) => {
		inputstr = _.replace(inputstr, RegExp(symbol, "g"), "");
	});
	return inputstr;
}

/** Globally replaces string with symbols by order of index
 * @param inputstr string input
 * @param symbols organized array of symbols to replace
 */
export function StringReplaceGlobal(inputstr: string, ...symbols: string[]): string {
	_.forEach(symbols, (symbol, idx) => {
		let str = "\\$" + (idx + 1);

		if (symbol !== undefined) {
			inputstr = _.replace(inputstr, RegExp(str, "g"), symbol);
		} else {
			inputstr = _.replace(inputstr, RegExp(str, "g"), "");
		}
	});
	return inputstr;
}

/** Returns number of leading tabs in front of a given line/string. */
export function NumTabs(inputstr: string): number {
	let tabcount = 0;
	while (inputstr.charAt(tabcount) === "\t") {
		tabcount++;
	}
	return tabcount;
}

/** Set number of leading tabs for a line */
export function SetTabs(inputstr: string, num: number, appendNewline: boolean): string {
	let striped = inputstr.trimLeft(); // Trim whitespaces from front
	if (appendNewline) {
		return "\t".repeat(num) + striped + "\n";
	} else {
		return "\t".repeat(num) + striped;
	}
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
	Promise.all([startingLine, finishingLine]).then((values) => {
		if (values[1] !== -1) {
			let request = RemoveDuplicates(lines, values[0][0], values[1]);
			vsed.WriteAtLine_Silent(values[1], request);
		} else {
			let request = RemoveDuplicates(lines, values[0][0], values[0][1]);
			vsed.WriteAtLine_Silent(values[0][0], request);
		}
	});
}

/** Gets the class symbols from one of tthe following signatures.
 * 	Starts from current line and goes upward
 */
export function GetClassSymbol(at: number): string {
	let editor = vscode.window.activeTextEditor;
	let lineEnd = editor?.document.lineAt(at).range.end;

	let exClass: RegExp = /^class .*?_API ([A-Za-z0-9_]+) ?/; // will detect class
	let exStruct: RegExp = /^struct ([A-Za-z_0-9]+) ?/; // will detect structs

	while (at-- > 0) {
		let lineEnd = editor?.document.lineAt(at).text;
		// class TEST_API UCapturedClass : public UObject
		if (exClass.test(lineEnd!)) {
			let exres = lineEnd.match(exClass);
			return exres ? exres[1] : "";
			// struct FCapturedStruct : public FTableRowBase
		} else if (exStruct.test(lineEnd!)) {
			let exres = lineEnd.match(exStruct);
			return exres ? exres[1] : "";
		}
	}
	return "";
}

/**  */
export function ResolveLinesToSlice(
	lines: string[],
	symbols: string[],
	at?: number,
	initialTabOffset?: number,
): string[] {
	// Intitialization
	let retlines: string[] = [];
	at = at ? at : 0;

	// Test these expressions to change offset
	let exBracketBegin = /.*?{ ?\n?$/;
	let exBracketEnd = /.*?} ?\n?$/;

	// Get intiial tab offset
	let taboffset = initialTabOffset === undefined ? 0 : initialTabOffset;
	console.log("taboffset provided is", taboffset);

	_.forEach(lines, (line, i) => {
		let newline = StringReplaceGlobal(line, ...symbols);

		console.log(newline, exBracketEnd.test(newline));
		// update tab offset (end scope)
		if (exBracketEnd.test(newline)) {
			taboffset--;
		}

		if (i === lines.length - 1) {
			// Dont add "/n" to last line
			newline = SetTabs(newline, taboffset, false);
		} else {
			newline = SetTabs(newline, taboffset, true);
		}

		retlines.push(newline);
		// update tab offset (begin scope)
		if (exBracketBegin.test(newline)) {
			taboffset++;
		}
	});
	return retlines;
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
	if (useTabs === undefined) {
		useTabs = true;
	}
	let editor = vscode.window.activeTextEditor;
	let startln = editor?.document.lineAt(at).text;
	let retline = "\n";

	// Get number of tabs
	let tabcount = NumTabs(startln);

	lines.forEach((line) => {
		symbols.forEach((symbol, i) => {
			let str = "\\$" + (i + 1);
			if (symbol !== undefined) {
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

export function InsertLineAsParsedData(lines: string[], at: number, symbols: string[]) {
	let editor = vscode.window.activeTextEditor;
	let startln = editor?.document.lineAt(at).text;
	// Get number of tabs
	let tabcount = NumTabs(startln);

	let retline = "\n";

	lines.forEach((line) => {
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

	vsed.InsertAt(retline, at);
	// vsed.MoveCursorTo(retline);

	// vsed.WriteAtLine_Silent(retline, )
	// InsertLineAt(retline, at);
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
	let tabcount = NumTabs(startline);

	let retline: string = "\n";
	lines.forEach((line) => {
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
		?.edit((editBuilder) => {
			editBuilder.insert(lineEnd!, line + "\n");
		})
		.then(
			() => {
				if (debug === true) {
					vscode.window.showInformationMessage("copied to clipboard.");
				}
			},
			(err) => {
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
