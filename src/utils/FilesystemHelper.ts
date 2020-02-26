// Copyright (c) 2020 Debashish Patra, MPL-2.0

// FileSystemHelaper.ts
// Used to get filepaths, searching and indexing.

var XRegExp = require("xregexp");
var path = require("path");
import * as vscode from "vscode";
import * as feedback from "./ErrorLogger";
import * as fs from "fs";
import * as _ from "lodash";

export interface FunctionAnatomy {
	prototype: string;
	returnType: string;
}

export interface PluginPathInfo {
	foldername: string;
	folderpath: string;
	isGameModule: boolean;
}

export interface SingleFileData {
	name: string;
	extension: string;
	path: string;
}

export enum ActiveFileExtension {
	None,
	Header,
	Source,
	BothFound,
}
export interface FileData {
	cppvalid: ActiveFileExtension;
	fullpath: string;
	filename: string;
	folderpath: string;
	stripped_classname: string;
	headerpath: string;
	sourcepath: string;
}

/** Gets the .h counterpart if standard convention was respected. */
export async function GetMatchingHeader(data: FileData): Promise<void> {
	const regex = new XRegExp("^" + data.stripped_classname + ".h$");
	return new Promise<void>((resolve, reject) => {
		const a = ScanFolderWithRegex(data.folderpath, regex);
		const b = ScanFolderWithRegex(path.join(data.folderpath, "../", "Public"), regex);

		Promise.all([a, b]).then(values => {
			if (values[0] !== "") {
				data.headerpath = path.join(data.folderpath, values[0]);
				resolve();
			} else if (values[1] !== "") {
				data.headerpath = path.join(data.folderpath, "../Public", values[1]);
				resolve();
			} else {
				reject(feedback.DErrorCode.HEADER_NOT_FOUND);
			}
		});
	});
}

// export function GetMatchingSourceSync(headerpath: )

/** Get the source file for given header file
 * @param path fullpath to header file
 */
export async function GetMatchingSourceSync(path: string): Promise<string> {
	let _name = path.match(/([a-zA-Z._-]*)$/)![1];
	let _folder = path.substr(0, path.length - _name.length - 1);
	let _stripped = path.match(/([a-zA-Z._-]*)$/)![1];
	let data: FileData = {
		filename: _name,
		folderpath: _folder,
		stripped_classname: _stripped,
		cppvalid: ActiveFileExtension.Header,
		fullpath: path,
		headerpath: path,
		sourcepath: "",
	};
	return new Promise<string>((resolve, reject) => {
		GetMatchingSource(data, _name).then(
			ret => {
				resolve(ret);
			},
			err => {
				console.log("Could not find source file: ", err);
			},
		);
	});
}

/** Gets the .cpp counterpart if standard convention was respected. */
export async function GetMatchingSource(data: FileData, filename?: string): Promise<string> {
	let regex: RegExp = /^&/;
	if (filename === undefined) {
		regex = new XRegExp("^" + data.stripped_classname + ".cpp$");
	} else {
		let _name = filename.replace(".h", ".cpp");
		console.log(_name);
		regex = new XRegExp("^" + _name);
	}

	return new Promise<string>((resolve, reject) => {
		console.log("Searching in: ", data.folderpath);
		console.log("Searching in: ", path.join(data.folderpath, "../", "Private"));
		const a = ScanFolderWithRegex(data.folderpath, regex);
		const b = ScanFolderWithRegex(path.join(data.folderpath, "../", "Private"), regex);

		Promise.all([a, b]).then(values => {
			console.log("Regex results: ", a, b);
			if (values[0] !== "") {
				console.log("found in same folder.");
				data.sourcepath = path.join(data.folderpath, values[0]);
				resolve(path.join(data.folderpath, values[0]));
			} else if (values[1] !== "") {
				console.log("found in one folder outside.");
				data.sourcepath = path.join(data.folderpath, "../", "Private", values[1]);
				resolve(path.join(data.folderpath, "../", "Private", values[1]));
			} else {
				reject(feedback.DErrorCode.SOURCE_NOT_FOUND);
			}
		});
	});
}

/** Scan a folder with specified regex to find matches. Empty string if none found. */
export async function ScanFolderWithRegex(dir: string, ex: RegExp): Promise<string> {
	return new Promise<string>((resolve, reject) => {
		fs.readdir(dir, (err: any, files: any) => {
			if (err) {
				resolve("");
			}
			files.forEach((file: string) => {
				if (ex.test(file)) {
					// console.log("yeet", file);
					resolve(file);
				}
			});
			resolve("");
		});
	});
}

/** Writes a function definition. (Expects the name of clas to be provided) */
export async function WriteFunctionToFile(
	filepath: string,
	funcBody: FunctionAnatomy,
	classname: string,
): Promise<void> {
	console.log("Filestream started execution...");

	let mine = "\n" + funcBody.returnType + " A" + classname + funcBody.prototype;
	return new Promise<void>((resolve, reject) => {
		fs.appendFile(filepath, mine, (err: any) => {
			console.log("Probably file is being blocked...");
		});

		let placeholderBody =
			'\t// UE_LOG(LogTemp, Warning, TEXT("A property was changed in right panel."))';
		// Let users have a bracket style preference...
		let PreferredBrackets = "\n{\n" + placeholderBody + "\n}";

		fs.appendFile(filepath, PreferredBrackets, (err: any) => {
			if (err) {
			} // handle error
			console.log("Filenot found!");
		});
		resolve();
	});
}

export async function WriteAtLine(
	filepath: string,
	at: number,
	lines: string[],
	freshFile?: boolean,
): Promise<void> {
	// Handle request for starting from black
	if (freshFile && freshFile === true) {
		fs.writeFileSync(filepath, "");
	}

	// Handle FILE DOES NOT EXIST
	if (!fs.existsSync(filepath)) {
		fs.writeFileSync(filepath, "");
	}

	let content: string = "";
	lines.forEach((str, i) => {
		if (i === content.length - 1) {
			content += str;
		} else {
			content += str + "\n";
		}
	});
	return new Promise<void>((resolve, reject) => {
		let data: string[] = fs
			.readFileSync(filepath)
			.toString()
			.split("\n");
		data.splice(at, 0, content);
		console.log(data);
		// Using filestream
		let stream = fs
			.createWriteStream(filepath)
			.on("error", () => {
				console.log("Some error occured...");
			})
			.on("finish", () => {
				resolve();
			});
		data.forEach((line, i) => {
			if (i === data.length - 1) {
				stream.write(line);
			} else {
				stream.write(line + "\n");
			}
		});
		stream.end();
	});
}

/** Scans a folder for a .uplugin file and valid Source folder. Returns list of plugin
 * paths as would be detected in the engine.
 * @param folder : Potential plugin folder with .uplugin */
export function GetPluginDataFromFolder(folder: string): PluginPathInfo[] {
	let targetpath = path.join(folder, "Source");
	let retval: PluginPathInfo[] = [];
	try {
		let folders = fs.readdirSync(targetpath);
		// Every folder in a valid plug-in foler is assumed to be a module...
		_.each(folders, folder => {
			if (fs.statSync(path.join(targetpath, folder)).isDirectory() === true) {
				retval.push({
					foldername: folder,
					folderpath: path.join(targetpath, folder),
					isGameModule: false,
				});
			}
		});
		// Filter out specific folders...
		_.filter(retval, o => {
			o.foldername !== "Python" && o.foldername !== "Shaders";
		});
		return retval;
	} catch {
		return retval;
	}
}

export function GetFolderList(targetpath: string): string[] {
	let retval: string[] = [];
	try {
		let folders = fs.readdirSync(targetpath);
		// Every folder in a valid plug-in foler is assumed to be a module...
		_.each(folders, folder => {
			if (fs.statSync(path.join(targetpath, folder)).isDirectory() === true) {
				retval.push(folder);
			}
		});
		return retval;
	} catch {
		return retval;
	}
}

export function ConfirmFileExists(targetfilepath: string): number {
	if (fs.existsSync(targetfilepath)) {
		return 0;
	} else {
		fs.writeFileSync(targetfilepath, "");
		return 0;
	}
}

/** Uses a WriteStream to write an array of strings to a file. OVERWRITES content. */
export function WriteLinesToFile(filepath: string, lines: string[]) {
	let writer = fs.createWriteStream(filepath);
	lines.forEach(line => {
		writer.write(line + "\n");
	});
	writer.close();
}

/** Creates dir/file if missing
 * @param mainpath path to file/folder
 * @param isDir whether given path is dir or file
 * @param data array of string to use for writing (optional)
 * @param symbols array of symbols to parse @data ,Ignored if null
 */
export function CreateAndWrite(
	mainpath: string,
	isDir: boolean,
	data?: string[],
	symbols?: string[],
) {
	if (!fs.existsSync(mainpath)) {
		if (isDir || typeof data === "undefined") {
			fs.mkdirSync(mainpath);
			return;
		} else {
			// fs.mkdirSync(mainpath);
			if (typeof symbols === "undefined") {
				WriteLinesToFile(mainpath, data);
			} else {
				data = data.map(line => {
					symbols.forEach((symbol, i) => {
						let str = "\\$" + (i + 1).toString();
						line = line.replace(RegExp(str, "g"), symbol);
					});
					return line;
				});
				WriteLinesToFile(mainpath, data);
			}
		}
	}
}

/** Creates a directory if it does not exist */
export function CreateDirIfMissing(pathIn: string) {
	if (!fs.existsSync(pathIn)) {
		fs.mkdirSync(pathIn);
	}
}
/** Creates dir/file if missing
 * @param mainpath path to file/folder
 * @param isDir whether given path is dir or file
 * @param data array of string to use for writing (optional)
 * @param symbols array of symbols to parse @data ,Ignored if null
 */
export async function WriteFileAsync(
	mainpath: string,
	data?: string[],
	symbols?: string[],
): Promise<void> {
	if (!fs.existsSync(mainpath)) {
		if (typeof data === "undefined") {
			WriteLinesToFile(mainpath, []);
		} else {
			if (typeof symbols === "undefined") {
				WriteLinesToFile(mainpath, data);
			} else {
				data = data.map(line => {
					symbols.forEach((symbol, i) => {
						let str = "\\$" + (i + 1).toString();
						line = line.replace(RegExp(str, "g"), symbol);
					});
					return line;
				});
				WriteLinesToFile(mainpath, data);
			}
		}
	}
}

/** Ouch */
export async function WriteJSONToFile(filepath: string, data: any) {
	const str = JSON.stringify(data, null, 2);
	fs.writeFile(filepath, str, () => {});
}

export function ReadJSON<T>(filepath: string): T {
	return JSON.parse(fs.readFileSync(filepath).toString());
}

/** Returns the absolute path for a given relative path during development
 * APPLIES ONLY IF USING WEBPACK !!!
 * dev builds use "src", published builds use "out"
 */
export function RelativeToAbsolute(
	extensionName: string,
	relativepath?: string,
): string | undefined {
	let mine = vscode.extensions.getExtension(extensionName);
	let extpath = mine?.extensionPath;

	if (extpath !== undefined) {
		let modpath = "";

		// Typescript is output to out folder in published extension
		if (/.vscode/.test(extpath)) {
			modpath = path.join(extpath!, "out", relativepath);
		} else {
			modpath = path.join(extpath!, "src", relativepath);
		}
		return modpath;
	} else {
		return undefined;
	}
}
