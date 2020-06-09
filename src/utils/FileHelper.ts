// Copyright (c) 2020 Debashish Patra, MPL-2.0

// ExtensionHelperr.ts
// Used to get information about extensions.

import * as fs from "fs";
import * as _ from "lodash";
import FuncDefs from "../data/extensions/Functions_Core.json";
import * as filesys from "../utils/FilesystemHelper";
import { vsfs } from "@suvam0451/vscode-geass";

const _functionModPath = "data/extensions/Functions_Ext.json";

export async function InjectHeaders(filepath: string, defs: string[]): Promise<number> {
	let num = await vsfs.RegexMatchLine(filepath, /^#include (.*?).h/);
	let num2 = await vsfs.RegexMatchLine(filepath, /^#include (.*?).generated.h/);

	defs = _.map(defs, (o) => {
		return '#include "' + o + '"';
	});

	return new Promise<number>((resolve, reject) => {
		WriteAtLine(filepath, num, defs).then(
			() => {
				resolve(0);
			},
			() => {
				// rejection not handled
			},
		);
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
	console.log(data);

	// Get header fields
	let pub = await vsfs.RegexMatchLine(headerpath, /^public:$/);
	let prot = await vsfs.RegexMatchLine(headerpath, /^protected:$/);
	let priv = await vsfs.RegexMatchLine(headerpath, /^private:$/);
	let EOC = await vsfs.RegexMatchLine(headerpath, /^};$/);
	let pubAdd: string[] = [];
	let protAdd: string[] = [];
	let privAdd: string[] = [];
	let srcAdd: string[] = [];

	console.log(arr);

	await arr.forEach((function_id) => {
		console.log("target", function_id);

		let matched_object = data.find((elem) => elem.id == function_id);
		console.log("matched object was -->", matched_object);

		if (matched_object) {
			// TODO: remove this after fixing bugs
			console.log("Function signatures were found...");
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
		WriteAtLine(headerpath, EOC, privAdd).then(() => {
			WriteAtLine(headerpath, priv, protAdd).then(() => {
				WriteAtLine(headerpath, prot, pubAdd);
				WriteAtLine(sourcepath, EOC, srcAdd);
				resolve();
			});
		});
	});
}

// ---------------------------------------------------------------------
//                INTERNAL FUNCTIONS
// ---------------------------------------------------------------------

/** Writes a list of lines to the file. */
export async function WriteAtLine(filepath: string, at: number, lines: string[]): Promise<void> {
	let content: string = "";
	lines.forEach((str) => {
		content += str + "\n";
	});
	content = content.slice(0, content.length - 1); // Remove last newline character
	return new Promise<void>((resolve, reject) => {
		let data: string[] = fs.readFileSync(filepath).toString().split("\n");
		data.splice(at, 0, content); // data.splice(at, 0, content);

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
