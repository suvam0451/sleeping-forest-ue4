// Copyright (c) 2020 Debashish Patra, MPL-2.0

// IncludeManager.ts
// Isolated module to let users paste their errors and search database for resolution.

import * as vscode from "vscode";
import { GetPluginDataFromFolder } from "../utils/FilesystemHelper";
import * as fs from "fs";
import * as path from "path";
import classData from "../data/BuildTemplates.json";
// Header/Source file generation data...
import Default_Actor_h from "../data/generators/Default_Actor_h.json";
import Default_Actor_cpp from "../data/generators/Default_Actor_cpp.json";
import { InjectHeaders, InjectFunctions } from "../utils/FileHelper";
import * as _ from "lodash";
import * as filesys from "../utils/FilesystemHelper";
import { vsui } from "@suvam0451/vscode-geass";
import { ClassCreationKit, PluginPathInfo } from "./TypesExport";
const _buildspaceModPath = "data/extensions/Buildspaces_Ext.json";

/** ENTRY POINT of module */
export default async function CreateClassModule(): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		NamespaceSelection().then(ret => {
			// Gets { buildspace }
			ModuleSelection(ret).then(ret2 => {
				// Gets { modulename, modulepath }
				ClassSelection(ret2).then(ret3 => {
					// Gets { parentclass, classname }
					GenerateFileData(ret3).then(ret4 => {
						// Gets { headerpath,  sourcepath }
						ValidateRequest(ret4).then(ret5 => {
							if (ret5) {
								HandleClassGeneration(ret4).then(() => {
									// This needs to be purged
								});
							}
						});
					});
				});
			});
		});
		resolve();
	});
}

/** Generates header(.h)/soure(.cpp) paths based on module type and previous data */
async function GenerateFileData(data: ClassCreationKit): Promise<ClassCreationKit> {
	return new Promise<ClassCreationKit>((resolve, reject) => {
		if (!data.isGameModule) {
			// UE4 plug-ins follow Private/Public folder structure
			data.headerpath = path.join(data.modulepath, "Public", data.classname + ".h");
			data.sourcepath = path.join(data.modulepath, "Private", data.classname + ".cpp");
			resolve(data);
		} else {
			// Gamemodule have files in same path
			data.headerpath = path.join(data.modulepath, data.classname + ".h");
			data.sourcepath = path.join(data.modulepath, data.classname + ".cpp");
			resolve(data);
		}
	});
}

/** Handls available class selection and prompts for classname
 * fills: { classname, parentclass }
 */
async function ClassSelection(data: ClassCreationKit): Promise<ClassCreationKit> {
	let classList: string[] = [];

	let modpath = filesys.RelativeToAbsolute("suvam0451.sleeping-forest-ue4", _buildspaceModPath);
	let extradata = filesys.ReadJSON<Buildspace[]>(modpath!);

	let json: Buildspace[] = _.concat(classData, extradata);
	let bs = _.find(json, { buildspace: data.buildspace });
	if (typeof bs !== "undefined") {
		_.each(bs.templates, tmpl => {
			classList.push(tmpl.id);
		});
	}
	return new Promise<ClassCreationKit>((resolve, reject) => {
		vsui.QuickPick(classList, false).then(sel => {
			data.parentclass = sel;
			vsui
				.GetString()
				.then(ret => {
					data.classname = ret;
					vscode.window.showWarningMessage(
						"Adding " + // user receipt
							ret +
							" of type " +
							data.parentclass +
							" in " +
							data.modulename +
							"... Continue ?",
					);
				})
				.then(() => {
					vsui.QuickPick(["Yes", "No"], true, "Yes").then(() => {
						resolve(data);
					});
				});
		});
	});
}

/** Returns a list of valid modules including main game module... */
async function ModuleSelection(data: ClassCreationKit): Promise<ClassCreationKit> {
	let pluginDataArray: PluginPathInfo[] = [];
	let workspacePath: string = vscode.workspace.workspaceFolders![0].uri.path.substr(1);
	let pluginPath = path.join(workspacePath, "Plugins");
	let gamefoldername = "";

	return new Promise<ClassCreationKit>((resolve, reject) => {
		let arr: string[] = [];
		try {
			// let lst = fs.readdirSync(pluginPath);
			let lst = filesys.GetFolderList(pluginPath);
			lst.forEach(folder => {
				let ret = GetPluginDataFromFolder(path.join(pluginPath, folder));
				pluginDataArray = pluginDataArray.concat(ret);
			});

			let wspath = vscode.workspace.workspaceFolders![0].uri.fsPath;
			// Just pick the first folder
			gamefoldername = filesys.GetFolderList(path.join(wspath, "Source"))[0];
			// Push the "Game" folder data...
			pluginDataArray.push({
				foldername: "Game",
				folderpath: path.join(wspath, "Source", gamefoldername),
				isGameModule: true,
			});
			// let arr =_.concat(arr, pluginDataArray);
			_.each(pluginDataArray, ret => {
				arr.push(ret.foldername);
			});
		} catch {
			reject("Throw not implemented...");
		}
		// arr.push("Game");
		vsui.QuickPick(arr, false).then(sel => {
			let index = pluginDataArray.find(i => i.foldername === sel);
			if (typeof index !== "undefined") {
				switch (index.foldername) {
					case "Game": {
						data.modulename = gamefoldername; // Not "Game"
						data.modulepath = index.folderpath; // Needs update
						data.isGameModule = true;
						break;
					}
					default: {
						data.modulename = index.foldername;
						data.modulepath = index.folderpath;
						data.isGameModule = false;
						break;
					}
				}
				resolve(data);
			}
		});
	});
}

interface SymbolData {
	classname: string;
	apiname: string;
	prefix: string;
	parentclass: string;
}

/** Maps JSON data to possible combinations of buildspaces and selected parentclass. */
async function HandleClassGeneration(kit: ClassCreationKit): Promise<void> {
	let sym = GenerateSymbols(kit);
	await ParseAndWrite(kit.headerpath, Default_Actor_h, sym);
	await ParseAndWrite(kit.sourcepath, Default_Actor_cpp, sym);

	// Append the xyz with
	let modpath = filesys.RelativeToAbsolute("suvam0451.sleeping-forest-ue4", _buildspaceModPath);
	let extradata = filesys.ReadJSON<Buildspace[]>(modpath!);
	let data = classData.concat(extradata);

	return new Promise<void>((resolve, reject) => {
		data.forEach(bs => {
			if (bs.buildspace === kit.buildspace) {
				bs.templates.forEach(tmpl => {
					if (tmpl.id === kit.parentclass) {
						InjectHeaders(kit.headerpath, tmpl.Headers).then(() => {
							InjectFunctions(
								kit.headerpath,
								kit.sourcepath,
								tmpl.Functions,
								sym.prefix + sym.classname,
							);
							resolve();
						});
						resolve();
					}
				});
			}
		});
		resolve();
	});
}

/** Generates the symbol map for given id and buildspace
 * @1 : namespace {AActor, UObject}
 */
function GenerateSymbols(kit: ClassCreationKit): SymbolData {
	let retval: SymbolData = {
		classname: kit.classname, // ${1 : classname}
		apiname: kit.modulename.toUpperCase(), // ${2 : apiname}
		parentclass: "", // ${3 : parentclass}
		prefix: "", // ${4 : classprefix }
	};

	let modpath = filesys.RelativeToAbsolute("suvam0451.sleeping-forest-ue4", _buildspaceModPath);
	let extradata = filesys.ReadJSON<Buildspace[]>(modpath!);

	let data = classData.concat(extradata);
	data.forEach(val => {
		if (val.buildspace === kit.buildspace) {
			val.templates.forEach(each => {
				if (each.id === kit.parentclass) {
					retval.parentclass = each.parent!;
					retval.prefix = each.classprefix;
					return retval;
				}
			});
		}
	});

	return retval;
}

/** Parses the data JSON file and inserts strings where-ever applicable... */
async function ParseAndWrite(filepath: string, data: string[], symbols: SymbolData): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		let logger = fs.createWriteStream(filepath, { flags: "w" });
		data.forEach(line => {
			line = line.replace("$1", symbols.classname);
			line = line.replace("$1", symbols.classname); // Some bug causes 2nd symbol to not get replaced
			line = line.replace("$2", symbols.apiname);
			line = line.replace("$3", symbols.parentclass);
			line = line.replace("$4", symbols.prefix);
			line = line.replace("$4", symbols.prefix); // Some bug causes 2nd symbol to not get replaced
			logger.write(line + "\n");
		});
		logger.end(() => {
			resolve();
		});
	});
}

/** Checks for spaces and if any files are being overwritten...
 * Whitespace check: spaces
 * Overwrite checks: in module
 */
async function ValidateRequest(kit: ClassCreationKit): Promise<boolean> {
	let inValid = /\s/;
	return new Promise<boolean>((resolve, reject) => {
		new Promise<boolean>((resolve, reject) => {
			if (inValid.test(kit.classname) === true) {
				vscode.window.showErrorMessage("Whitespaces not allowed in classnames !");
				resolve(false);
			}

			// Will return true if (.cpp/.h) not found. Prompts/Alerts users otherwise...
			try {
				fs.accessSync(kit.headerpath);
				vscode.window.showErrorMessage(
					path.join(kit.modulename, kit.classname + ".h") + "will be overwritten !",
				);
				fs.accessSync(kit.sourcepath);
				vscode.window.showErrorMessage(
					path.join(kit.modulename, kit.classname + ".cpp") + "will be overwritten !",
				);
				reject(false);
			} catch {
				resolve(true);
			}
		}).then(
			ret => {
				// IF no syntax errors, resolves to true...
				resolve(ret);
			},
			err => {
				// Let user decide if current request overwrites files...
				let opt: string[] = ["Abort(default)", "I understand that my previous data will be lost."];
				vscode.window.showQuickPick(opt).then(sel => {
					if (sel === "I understand that my previous data will be lost.") {
						resolve(true);
					} else {
						resolve(false);
					}
				});
			},
		);
	});
}

/** Let user select between buildspaces...
 * This helps us categorize between built-in and user defined builspaces
 */
async function NamespaceSelection(): Promise<ClassCreationKit> {
	let retval: ClassCreationKit = {
		modulepath: "",
		modulename: "",
		parentclass: "",
		classname: "",
		classprefix: "",
		buildspace: "", // set in this function
		isGameModule: true,
		headerpath: "",
		sourcepath: "",
	};

	let modpath = filesys.RelativeToAbsolute("suvam0451.sleeping-forest-ue4", _buildspaceModPath);
	let extradata = filesys.ReadJSON<Buildspace[]>(modpath!);

	let arr: string[] = [];
	let data = classData.concat(extradata);

	data.forEach(val => {
		arr.push(val.buildspace);
	});
	return new Promise<ClassCreationKit>((resolve, reject) => {
		vscode.window
			.showQuickPick(arr)
			.then(ret => {
				if (ret) {
					retval.buildspace = ret;
				} else {
					reject("USER_ABORT");
				}
			})
			.then(() => {
				resolve(retval);
			});
	});
}

interface Buildspace {
	buildspace: string;
	templates: {
		id: string;
		classprefix: string;
		parent: string;
		Headers: string[];
		Functions: string[];
	}[];
}
