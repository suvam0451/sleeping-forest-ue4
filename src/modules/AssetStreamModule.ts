// Copyright (c) 2020 Debashish Patra, MPL-2.0

// IncludeManager.ts
// Isolated module to let users paste their errors and search database for resolution.

import * as vscode from "vscode";
import * as fs from "fs";
var XRegExp = require("xregexp");
import * as path from "path";
import _ from "lodash";
import { PickFolder, GetVSConfig } from "./VSInterface";
import {
	CreateAndWrite,
	WriteFileAsync,
	WriteJSONToFile,
	ReadJSON,
} from "../utils/FilesystemHelper";
import settings from "../data/templates/streamSettings.json";
import generator from "../data/templates/pythonGenerator.json";
import assetexportdata from "../data/templates/assetBasicDataTmpl.json";

/** Generates module scaffold files for selected folder */
export async function InitializeStream(): Promise<void> {
	PickFolder().then(ret => {
		const _normalizedpath = ret.replace(/\\/g, "/");
		try {
			// folders
			CreateAndWrite(path.join(ret, "Assets"), true);
			CreateAndWrite(path.join(ret, "Assets", "AnimSequences"), true);
			// files
			WriteFileAsync(path.join(ret, "settings.json"), settings, [_normalizedpath]);
			WriteFileAsync(path.join(ret, "ExportScript.py"), generator, [_normalizedpath]);
			WriteFileAsync(path.join(ret, "assetdata.json"), assetexportdata, [_normalizedpath]);
		} catch {
			console.log("failed to create file(s)/folder(s)");
		}
	});
}

// Data structure to be passed between folders...
interface AssetStreamKit {
	dataJSON: RootObject;
	settingJSON: SettingsStruct;
	folderpath: string;
	targetBasePath: string;
	isAnimationFolder?: boolean;
}

enum AssetType {
	StaticMesh,
	SoundWave,
	Textures,
}

// export function InjectInDataTable<T extends [{ Name: string }]>(
export function InjectInDataTable(obj: any, type: AssetType, path: string): any {
	let retval: any = {
		Name: "Row_" + obj.length.toString(),
		StaticMesh_Soft: path,
	};
	switch (type) {
		case AssetType.StaticMesh: {
			retval["StaticMesh"] = ("StaticMesh'" + path + "'").replace(" ", "_");
			obj.push(retval);
			break;
		}
		case AssetType.SoundWave: {
			retval["SoundWave"] = ("SoundWave'" + path + "'").replace(" ", "_");
			obj.push(retval);
			break;
		}
		case AssetType.Textures: {
			retval["Texture"] = ("Texture2D'" + path + "'").replace(" ", "_");
			obj.push(retval);
			break;
		}
		default:
			break;
	}
	return obj;
}
export function RefreshStreamForFolder(data: AssetStreamKit) {
	const obj1: Array<SM_JSONInterface> = []; // Used for DataTable imports (StaticMesh)
	const obj2: Array<Music_JSONInterface> = []; // Used for DataTable imports (SoundWave)
	const obj3: Array<T_JSONInterface> = []; // Used for DataTable imports (Textures)
	fs.readdirSync(data.folderpath).forEach(file => {
		let _name = file.match(/^(.*?)\..*?/)![1]; // Gets name without extension
		let _path = path.join(data.folderpath, file); // Fullpath to file/folder
		let _enginePath = data.targetBasePath + "/" + _name + "." + _name; // Path in engine

		let stats = fs.lstatSync(path.join(data.folderpath, file));
		// Handle if directory
		if (stats.isDirectory()) {
			let funcdata = data;
			funcdata.folderpath = _path;
			RefreshStreamForFolder(funcdata);
		} else if (RegExp(/(.*?).fbx/).test(file)) {
			data.dataJSON.StaticMesh.list.push({
				name: _name,
				path: _path,
				targetpath: data.targetBasePath,
			});
			// Push to per-folder database
			InjectInDataTable(obj1, AssetType.StaticMesh, _enginePath);
		} else if (RegExp(/(.*?).(png|jpg)/).test(file)) {
			data.dataJSON.Texture.list.push({
				name: _name,
				path: _path,
				targetpath: data.targetBasePath,
			});
			// Push to per-folder database
			InjectInDataTable(obj2, AssetType.Textures, _enginePath);
		} else if (RegExp(/(.*?).(wav|mp3)/).test(file)) {
			data.dataJSON.Audio.list.push({
				name: _name,
				path: _path,
				targetpath: data.targetBasePath,
			});
			// Push to per-folder database
			InjectInDataTable(obj2, AssetType.SoundWave, _enginePath);
		}
	});
	// Async write per folder data to JSON files
	WriteJSONToFile(path.join(data.folderpath, "SM.json"), obj1);
	WriteJSONToFile(path.join(data.folderpath, "Music.json"), obj2);
	WriteJSONToFile(path.join(data.folderpath, "Tex.json"), obj3);
	return;
}

export function RefreshListedStreams() {
	// let config = vscode.workspace.getConfiguration("globalnode");
	// let retval = config.get<string[]>("assetFolders")!;
	let retval = GetVSConfig<string[]>("globalnode", "assetFolders");
	// let retval: any = config.get("exclude")!;
	retval.forEach(entry => {
		let _entry = path.join(entry, "Assets");

		const fill = ReadJSON<RootObject>(path.join(entry, "assetdata.json"));
		const settings = ReadJSON<SettingsStruct>(path.join(entry, "settings.json"));

		// reset
		fill.StaticMesh.list.length = 0;
		fill.Texture.list.length = 0;
		fill.Audio.list.length = 0;

		fs.readdirSync(_entry).forEach(file => {
			let stats = fs.lstatSync(path.join(_entry, file));
			// Handle if directory
			if (stats.isDirectory()) {
				if (file == "Animations") {
				}
				let funcdata: AssetStreamKit = {
					dataJSON: fill,
					settingJSON: settings,
					folderpath: path.join(_entry, file),
					targetBasePath: settings.targetPath + "/" + file,
				};
				RefreshStreamForFolder(funcdata);
			} else if (RegExp(/(.*?).fbx/).test(file)) {
				fill["StaticMesh"].list.push({
					name: file.match(/^(.*?)\..*?/)![1],
					path: path.join(entry, "Assets", file),
					targetpath: settings.targetPath,
				});
			} else if (RegExp(/(.*?).(png|jpg)/).test(file)) {
				fill["Texture"].list.push({
					name: file.match(/^(.*?)\..*?/)![1],
					path: path.join(entry, "Assets", file),
					targetpath: settings.targetPath,
				});
			} else if (RegExp(/(.*?).(wav|mp3)/).test(file)) {
				fill["Audio"].list.push({
					name: file.match(/^(.*?)\..*?/)![1],
					path: path.join(entry, "Assets", file),
					targetpath: settings.targetPath,
				});
			}
		});
		WriteJSONToFile(path.join(entry, "assetdata.json"), fill);

		// Populate JSON data for root...
		const obj1: Array<SM_JSONInterface> = [];
		const obj2: Array<Music_JSONInterface> = [];
		const obj3: Array<T_JSONInterface> = [];
		// .fbx
		fill.StaticMesh.list.forEach(el => {
			let enginePath = el.targetpath + "/" + el.name + "." + el.name;
			InjectInDataTable(obj1, AssetType.StaticMesh, enginePath);
		});
		WriteJSONToFile(path.join(entry, "SM.json"), obj1);
		// .wav
		fill.Audio.list.forEach(el => {
			let enginePath = el.targetpath + "/" + el.name + "." + el.name;
			InjectInDataTable(obj2, AssetType.SoundWave, enginePath);
		});
		WriteJSONToFile(path.join(entry, "Music.json"), obj2);
		// .png
		fill.Audio.list.forEach(el => {
			let enginePath = el.targetpath + "/" + el.name + "." + el.name;
			InjectInDataTable(obj3, AssetType.Textures, enginePath);
		});
		WriteJSONToFile(path.join(entry, "Tex.json"), obj3);
	});
}

export interface Music_JSONInterface {
	Name: string;
	SoundWave: string;
	SoundWave_Soft: string;
}

export interface SM_JSONInterface {
	Name: string;
	StaticMesh: string;
	StaticMesh_Soft: string;
}

export interface T_JSONInterface {
	Name: string;
	Texture: string;
	Texture_Soft: string;
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
