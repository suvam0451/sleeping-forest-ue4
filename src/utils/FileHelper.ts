// Copyright (c) 2020 Debashish Patra, MPL-2.0

// ExtensionHelperr.ts
// Used to get information about extensions.

var XRegExp = require("xregexp");
import * as vscode from "vscode";
import * as fs from "fs";
import readline from "readline";
import * as _ from "lodash";
import FuncDefs from "../data/FunctionTemplates.json";
import FuncExts from "../data/extensions/Functions.json";
import { EOF } from "dns";

export async function InjectHeaders(
	filepath: string,
	defs: string[],
): Promise<number> {
	let num = await RegexMatchLine(filepath, /^#include (.*?).h/);
	let num2 = await RegexMatchLine(
		filepath,
		/^#include (.*?).generated.h/,
	);

	defs = _.map(defs, o => {
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

export async function InjectFunctions(
	headerpath: string,
	sourcepath: string,
	arr: string[],
	namespace: string,
): Promise<void> {
	let data = _.concat(FuncDefs, FuncExts);

	// Get header fields
	let pub = await RegexMatchLine(headerpath, /^public:$/);
	let prot = await RegexMatchLine(headerpath, /^protected:$/);
	let priv = await RegexMatchLine(headerpath, /^private:$/);
	let EOC = await RegexMatchLine(headerpath, /^};$/);
	let pubAdd: string[] = [];
	let protAdd: string[] = [];
	let privAdd: string[] = [];
	let srcAdd: string[] = [];

	_.each(arr, fnid => {
		let pnt = _.find(data, o => {
			return o.id === fnid;
		});
		if (pnt) {
			switch (pnt?.field) {
				case "public": {
					pubAdd.push("\t" + pnt.comment);
					pubAdd.push("\t" + pnt.signature + "\n");
					break;
				}
				case "protected": {
					protAdd.push("\t" + pnt.comment);
					protAdd.push("\t" + pnt.signature + "\n");
					break;
				}
				case "private": {
					privAdd.push("\t" + pnt.comment);
					privAdd.push("\t" + pnt.signature + "\n");
					break;
				}
				default: {
					break;
				}
			}
			// Add function body to source
			srcAdd = _.concat(
				srcAdd,
				GeneratedSourceBody(pnt.signature, namespace, pnt.body),
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

/** Use a regex pattern and look match for the first line  */
function RegexMatchLine(
	filepath: string,
	ex: RegExp,
): Promise<number> {
	let retval = -1,
		index = 0;
	let regex = new XRegExp(ex);

	const readInterface = readline.createInterface({
		input: fs.createReadStream(filepath),
		output: process.stdout,
	});
	return new Promise<number>((resolve, reject) => {
		readInterface.on("line", line => {
			if (regex.test(line)) {
				readInterface.close();
				resolve(index);
			}
			index++;
		});
	});
}

/** Writes a list of lines to the file. */
async function WriteAtLine(
	filepath: string,
	at: number,
	lines: string[],
): Promise<void> {
	let content: string = "";
	lines.forEach(str => {
		content += str + "\n";
	});
	content = content.slice(0, content.length - 1); // Remove last newline character
	console.log(content);
	return new Promise<void>((resolve, reject) => {
		let data: string[] = fs
			.readFileSync(filepath)
			.toString()
			.split("\n");
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
		data.forEach(line => {
			stream.write(line + "\n");
		});
		stream.end();
	});
}

/** Writes a list of lines to the file. */
function WriteAtLineSync(
	filepath: string,
	at: number,
	lines: string[],
) {
	let content: string = "";
	lines.forEach(str => {
		content += str + "\n";
	});
	content = content.slice(0, content.length - 1); // Remove last newline character
	let data: string[] = fs
		.readFileSync(filepath)
		.toString()
		.split("\n");
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
	data.forEach(line => {
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

function GeneratedSourceBody(
	signature: string,
	namespace: string,
	fnbody: string[],
): string[] {
	let retval: string[] = [];
	let cls = StringExtract(
		signature,
		/([a-zA-Z<>]*)\((.*?)\) (const)?/,
	);
	let rettype = StringExtract(
		signature,
		/ ([a-zA-Z_]*)<?([a-zA-Z, ]*)>? /,
	);
	retval.push(rettype + " " + namespace + "::" + cls); // AMyActor::BeginPlay() { // body }
	retval.push("{");
	retval = _.concat(
		retval,
		_.map(fnbody, o => {
			return "\t" + o;
		}),
	);
	retval.push("}\n");
	return retval;
}
