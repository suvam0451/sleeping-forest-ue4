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

		console.log(settings);
		console.log(settings["targetPath"]);
		let files = fs.readdirSync(path.join(entry, "Assets"));
		files.forEach(file => {
			if (RegExp(/(.*?).fbx/).test(file)) {
				fill["StaticMesh"].list.push({
					name: file.substr(0, file.length - 4),
					path: path.join(entry, "Assets", file),
					targetpath: settings["targetPath"],
				});
			} else if (RegExp(/(.*?).(png|jpg)/).test(file)) {
				// fill.Texture.list.push(file);
				fill["Texture"].list.push({
					name: file.substr(0, file.length - 4),
					path: path.join(entry, "Assets", file),
					targetpath: settings["targetPath"],
				});
			} else if (RegExp(/(.*?).(wav|mp3)/).test(file)) {
				fill.Texture.list.push(file);
				fill["Audio"].list.push({
					name: file.substr(0, file.length - 4),
					path: path.join(entry, "Assets", file),
					targetpath: settings["targetPath"],
				});
			}
		});
		console.log(fill);
		const jsonString = JSON.stringify(fill, null, 2);
		fs.writeFileSync(path.join(entry, "assetdata.json"), jsonString);
	});
	// console.log(retval);
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
