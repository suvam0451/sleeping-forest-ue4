// Copyright (c) 2020 Debashish Patra, MPL-2.0

// ExtensionHelperr.ts
// Used to get information about extensions.

import fs from "fs";
import _ from "lodash";
import FuncDefs from "../data/extensions/Functions_Core.json";
import * as filesys from "../utils/FilesystemHelper";
import { vsfs, vsed } from "vscode-geass";

const _functionModPath = "data/extensions/Functions_Ext.json";

export async function InjectHeaders(filepath: string, defs: string[]): Promise<void> {
	let num = await vsfs.RegexMatchLine(filepath, /^#include (.*?).h/);
	let num2 = await vsfs.RegexMatchLine(filepath, /^#include (.*?).generated.h/);

	defs = _.map(defs, (o) => {
		return '#include "' + o + '"';
	});

	return new Promise((resolve, reject) => {
		vsed.WriteAtLine_Silent(num + 1, defs); // Add lines below that line
		resolve();
	});
}

interface FunctionTemplate {
	id: string;
	comment: string;
	signature: string;
	field: string;
	body: string[];
}

/** Looks for the function IDs by name and fille the signature and body from it. */
export async function InjectFunctions(
	headerpath: string,
	sourcepath: string,
	arr: string[],
	namespace: string,
): Promise<void> {
	// Append the xyz with
	let modpath = filesys.RelativeToAbsolute("suvam0451.sleeping-forest-ue4", _functionModPath);
	let extradata = filesys.ReadJSON<FunctionTemplate[]>(modpath!);

	// Functions --> (Core + Ext)
	let data = FuncDefs.concat(extradata);

	// Get header fields
	let pub = await vsfs.RegexMatchLine(headerpath, /^public:$/);
	let prot = await vsfs.RegexMatchLine(headerpath, /^protected:$/);
	let priv = await vsfs.RegexMatchLine(headerpath, /^private:$/);
	let EOC = await vsfs.RegexMatchLine(headerpath, /^};$/);
	let pubAdd: string[] = [];
	let protAdd: string[] = [];
	let privAdd: string[] = [];
	let srcAdd: string[] = [];

	await arr.forEach((function_id) => {
		let matched_object = data.find((elem) => elem.id == function_id);

		if (matched_object) {
			switch (matched_object?.field) {
				case "public": {
					pubAdd.push("\t" + matched_object.comment);
					pubAdd.push("\t" + matched_object.signature + "\n");
					break;
				}
				case "protected": {
					protAdd.push("\t" + matched_object.comment);
					protAdd.push("\t" + matched_object.signature + "\n");
					break;
				}
				case "private": {
					privAdd.push("\t" + matched_object.comment);
					privAdd.push("\t" + matched_object.signature + "\n");
					break;
				}
				default: {
					break;
				}
			}
			// Add function body to source
			srcAdd = _.concat(
				srcAdd,
				GeneratedSourceBody(matched_object.signature, namespace, matched_object.body),
			);
		}
	});

	return new Promise<void>((resolve, reject) => {
		// Private --> Protected --> Public to avoid line re-calculation
		WriteAtLineAsync(headerpath, EOC, privAdd).then(() => {
			WriteAtLineAsync(headerpath, priv, protAdd).then(() => {
				WriteAtLineAsync(headerpath, prot, pubAdd);
				WriteAtLineAsync(sourcepath, EOC, srcAdd);
				resolve();
			});
		});
	});
}

// ---------------------------------------------------------------------
//                INTERNAL FUNCTIONS
// ---------------------------------------------------------------------

/** Writes to a file, starting at given line number.
 * **NOTE: Use vsed.WriteAtLines if working with the active file.**
 */
export async function WriteAtLineAsync(
	filepath: string,
	at: number,
	lines: string[],
): Promise<void> {
	let content = lines.reduce((prev, curr) => prev + "\n" + curr);
	content = content.slice(0, content.length - 1); // Remove last newline character
	return new Promise<void>((resolve, reject) => {
		try {
			let data: string[] = fs.readFileSync(filepath).toString().split("\n");
			data.splice(at, 0, content); // Adds content at "at", 0 items removed

			// Using filestream
			let stream = fs
				.createWriteStream(filepath)
				.on("error", () => {
					console.log("Some error occured...");
				})
				.on("finish", () => {
					resolve();
				});
			data.forEach((line) => {
				stream.write(line + "\n");
			});
			stream.end();
			resolve();
		} catch {
			reject("404");
		}
	});
}
/** Writes a list of lines to the file. */
function WriteAtLineSync(filepath: string, at: number, lines: string[]) {
	let content: string = "";
	lines.forEach((str) => {
		content += str + "\n";
	});
	content = content.slice(0, content.length - 1); // Remove last newline character
	let data: string[] = fs.readFileSync(filepath).toString().split("\n");
	data.splice(at, 0, content); // data.splice(at, 0, content);
	// Using filestream
	let stream = fs
		.createWriteStream(filepath)
		.on("error", () => {
			console.log("Some error occured...");
		})
		.on("finish", () => {
			return;
		});
	data.forEach((line) => {
		stream.write(line + "\n");
	});
	stream.end();
}

function StringExtract(str: string, ex: RegExp): string {
	let res = str.match(ex);
	console.log(res);
	if (res && res.length > 0) {
		return res[0].trim();
	} else {
		return "";
	}
}

function GeneratedSourceBody(signature: string, namespace: string, fnbody: string[]): string[] {
	let retval: string[] = [];
	let cls = StringExtract(signature, /([a-zA-Z<>]*)\((.*?)\) (const)?/);
	let rettype = StringExtract(signature, / ([a-zA-Z_]*)<?([a-zA-Z, ]*)>? /);
	retval.push(rettype + " " + namespace + "::" + cls); // AMyActor::BeginPlay() { // body }
	retval.push("{");
	retval = _.concat(
		retval,
		_.map(fnbody, (o) => {
			return "\t" + o;
		}),
	);
	retval.push("}\n");
	return retval;
}

/** Appends a function at the end of a file.
 * 	@param filepath path to the file to be written
 * 	@param body list of strings to write
 */
export function AddLinesToFile(filepath: string, body: string[]) {
	_.forEach(body, (line) => {
		fs.appendFile(filepath, line, (err: any) => {});
	});
}

/** Appends a function at the end of a file. (WriteStream)
 * 	@param filepath path to the file to be written
 * 	@param body list of strings to write
 */
export function AddLinesAtEndUsingStream(filepath: string, body: string[]) {
	var stream = fs.createWriteStream(filepath, { flags: "a" });
	_.forEach(body, (line) => {
		stream.write(line);
	});
	stream.end();
}
