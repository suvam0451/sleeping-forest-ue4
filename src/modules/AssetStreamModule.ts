// Copyright (c) 2020 Debashish Patra, MPL-2.0

// IncludeManager.ts
// Isolated module to let users paste their errors and search database for resolution.

import * as vscode from "vscode";
import { resolve } from "dns";
import * as edit from "../utils/EditorHelper";
import { GetPluginDataFromFolder } from "../utils/FilesystemHelper";
import * as fs from "fs";
var XRegExp = require("xregexp");
import * as path from "path";
import classData from "../data/BuildTemplates.json";
import extendedClassData from "../data/extensions/Buildspaces.json";
// Header/Source file generation data...
import Default_Actor_h from "../data/generators/Default_Actor_h.json";
import Default_Actor_cpp from "../data/generators/Default_Actor_cpp.json";
import { rejects } from "assert";
import IncludeManager from "./IncludeManager";
import { InjectHeaders, InjectFunctions } from "../utils/FileHelper";
import * as _ from "lodash";
import { QuickPick, InputBox, PickFolder } from "./VSInterface";
import { WriteAtLine } from "../utils/FilesystemHelper";
import FileHandler from "../classes/FileHandler";
import * as filesys from "../utils/FilesystemHelper";
import settings from "../data/templates/streamSettings.json";
import generator from "../data/templates/pythonGenerator.json";
import assetexportdata from "../data/templates/assetBasicDataTmpl.json";

export function InitializeStream() {
	let data: string[] = [];
	PickFolder().then(ret => {
		if (!fs.existsSync(path.join(ret, "Assets"))) {
			fs.mkdirSync(path.join(ret, "Assets"));
		}

		try {
			// Write the settings file
			data = _.map(settings, line => {
				line = line.replace("$1", ret);
				return line.replace(/\\/g, "/"); // Path format normalized
			});
			WriteAtLine(path.join(ret, "settings.json"), 0, data, true);

			// Write the asset export file
			data = _.map(generator, line => {
				line = line.replace("$1", ret);
				return line.replace(/\\/g, "/"); // Path format normalized
			});
			WriteAtLine(path.join(ret, "ExportScript.py"), 0, data, true);

			// Write the data file(s)
			data = _.map(assetexportdata, line => {
				line = line.replace("$1", ret);
				return line.replace(/\\/g, "/"); // Path format normalized
			});
			WriteAtLine(path.join(ret, "assetdata.json"), 0, data, true);
		} catch {
			console.log("failed to create file(s)");
		}
	});
}

// Data structure to be passed between folders...
interface AssetStreamKit {
	dataJSON: RootObject;
	settingJSON: SettingsStruct;
	folderpath: string;
	targetBasePath: string;
}

export function RefreshStreamForFolder(data: AssetStreamKit) {
	let files = fs.readdirSync(data.folderpath);
	files.forEach(file => {
		let stats = fs.lstatSync(path.join(data.folderpath, file));
		// Handle if directory
		if (stats.isDirectory()) {
			let funcdata: AssetStreamKit = {
				dataJSON: data.dataJSON,
				settingJSON: data.settingJSON,
				folderpath: path.join(data.folderpath, file),
				targetBasePath: data.targetBasePath + "/" + file,
			};
			RefreshStreamForFolder(funcdata);
		} else if (RegExp(/(.*?).fbx/).test(file)) {
			data.dataJSON["StaticMesh"].list.push({
				name: file.match(/^(.*?)\..*?/)![1],
				path: path.join(data.folderpath, file),
				targetpath: data.targetBasePath,
			});
		} else if (RegExp(/(.*?).(png|jpg)/).test(file)) {
			data.dataJSON["Texture"].list.push({
				name: file.match(/^(.*?)\..*?/)![1],
				path: path.join(data.folderpath, file),
				targetpath: data.targetBasePath,
			});
		} else if (RegExp(/(.*?).(wav|mp3)/).test(file)) {
			data.dataJSON["Audio"].list.push({
				name: file.match(/^(.*?)\..*?/)![1],
				path: path.join(data.folderpath, file),
				targetpath: data.targetBasePath,
			});
		}
	});
	return;
}
export function RefreshListedStreams() {
	let config = vscode.workspace.getConfiguration("globalnode");
	let retval = config.get<string[]>("assetFolders")!;
	// let retval: any = config.get("exclude")!;
	retval.forEach(entry => {
		let fill: RootObject = JSON.parse(
			fs.readFileSync(path.join(entry, "assetdata.json")).toString(),
		);
		let settings: SettingsStruct = JSON.parse(
			fs.readFileSync(path.join(entry, "settings.json")).toString(),
		);
		// reset
		fill["StaticMesh"].list.length = 0;
		fill["Texture"].list.length = 0;
		fill["Audio"].list.length = 0;

		let files = fs.readdirSync(path.join(entry, "Assets"));
		files.forEach(file => {
			let stats = fs.lstatSync(path.join(entry, "Assets", file));
			// Handle if directory
			if (stats.isDirectory()) {
				let funcdata: AssetStreamKit = {
					dataJSON: fill,
					settingJSON: settings,
					folderpath: path.join(entry, "Assets", file),
					targetBasePath: settings["targetPath"] + "/" + file,
				};
				RefreshStreamForFolder(funcdata);
			} else if (RegExp(/(.*?).fbx/).test(file)) {
				fill["StaticMesh"].list.push({
					name: file.match(/^(.*?)\..*?/)![1],
					path: path.join(entry, "Assets", file),
					targetpath: settings["targetPath"],
				});
			} else if (RegExp(/(.*?).(png|jpg)/).test(file)) {
				fill["Texture"].list.push({
					name: file.match(/^(.*?)\..*?/)![1],
					path: path.join(entry, "Assets", file),
					targetpath: settings["targetPath"],
				});
			} else if (RegExp(/(.*?).(wav|mp3)/).test(file)) {
				fill["Audio"].list.push({
					name: file.match(/^(.*?)\..*?/)![1],
					path: path.join(entry, "Assets", file),
					targetpath: settings["targetPath"],
				});
			}
		});
		// console.log(fill);
		const jsonString = JSON.stringify(fill, null, 2);
		fs.writeFileSync(path.join(entry, "assetdata.json"), jsonString);
	});
}

// Interafce declaration
export interface StaticMeshList {
	name: string;
	path: string;
	targetpath: string;
}

export interface StaticMesh {
	label: string;
	list: StaticMeshList[];
}

export interface Texture {
	label: string;
	list: any[];
}

export interface Audio {
	label: string;
	list: any[];
}

export interface RootObject {
	StaticMesh: StaticMesh;
	Texture: Texture;
	Audio: Audio;
}

export interface SettingsStruct {
	targetPath: string;
	createMaterials: boolean;
	importTexturesForMesh: boolean;
}
