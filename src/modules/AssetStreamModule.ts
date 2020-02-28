// Copyright (c) 2020 Debashish Patra, MPL-2.0

// IncludeManager.ts
// Isolated module to let users paste their errors and search database for resolution.

import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import _ from "lodash";
import {
	WriteFileAsync,
	WriteJSONToFile,
	ReadJSON,
	CreateDirIfMissing,
} from "../utils/FilesystemHelper";
import settings from "../data/templates/streamSettings.json";
import generator from "../data/templates/pythonGenerator.json";
import assetexportdata from "../data/templates/assetBasicDataTmpl.json";
import * as filesys from "../utils/FilesystemHelper";
import { vsui, vsed, vscfg } from "@suvam0451/vscode-geass";

/** Generates module scaffold files for selected folder */
export async function InitializeStream(): Promise<string> {
	return new Promise<string>((resolve, reject) => {
		vsui.GetAFolder().then(ret => {
			const _normalizedpath = ret.replace(/\\/g, "/");
			try {
				// folders
				CreateDirIfMissing(path.join(ret, "Assets"));
				CreateDirIfMissing(path.join(ret, "Audit"));
				CreateDirIfMissing(path.join(ret, "Binaries"));
				CreateDirIfMissing(path.join(ret, "Source"));
				CreateDirIfMissing(path.join(ret, "Assets", "AnimSequences"));
				CreateDirIfMissing(path.join(ret, "Assets", "TexPacker"));
				CreateDirIfMissing(path.join(ret, "Source", "TextureSets"));

				// files

				let a = WriteFileAsync(path.join(ret, "Audit", "settings.json"), settings, [
					_normalizedpath,
				]);
				let b = WriteFileAsync(path.join(ret, "ExportScript.py"), generator, [_normalizedpath]);
				let c = WriteFileAsync(path.join(ret, "assetdata.json"), assetexportdata, [
					_normalizedpath,
				]);
				let d = WriteFileAsync(path.join(ret, "Audit", "report.txt"), [""], []);

				Promise.all([a, b, c, d]).then(() => {
					vscfg.AppendToVSConfig("SF", "assetFolders", [ret]);
					vsui.Info(
						"A new asset stream is being tracked. Please update workspace file (Inject Excludes).",
					);
					resolve(ret);
				});
			} catch {
				vsui.Error("Failed to initialize stream.");
			}
		});
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

/** Gets called for subfolders in main asset folder. */
export function RefreshStreamForFolder(data: AssetStreamKit) {
	const obj1: Array<IStaticMesh> = []; // Used for DataTable imports (StaticMesh)
	const obj2: Array<IMusic> = []; // Used for DataTable imports (SoundWave)
	const obj3: Array<ITexture> = []; // Used for DataTable imports (Textures)

	if (/TexPacker/.test(data.folderpath)) {
		return;
	}
	fs.readdirSync(data.folderpath).forEach(file => {
		let _path = path.join(data.folderpath, file); // Fullpath to file/folder
		let stats = fs.lstatSync(_path);

		// Handle if directory
		if (stats.isDirectory()) {
			let funcdata = data;
			funcdata.folderpath = _path;
			// RefreshStreamForFolder(funcdata);
		} else {
			let _name = file.match(/^(.*?)\..*?/)![1]; // Gets name without extension
			let _enginePath = data.targetBasePath + "/" + _name + "." + _name; // Path in engine

			if (RegExp(/(.*?).fbx/).test(file)) {
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
		}
	});
	// Async write per folder data to JSON files
	WriteJSONToFile(path.join(data.folderpath, "SM.json"), obj1);
	WriteJSONToFile(path.join(data.folderpath, "Music.json"), obj2);
	WriteJSONToFile(path.join(data.folderpath, "Tex.json"), obj3);
	return;
}

/** Exported module */
export function RefreshListedStreams() {
	let retval = vscfg.GetVSConfig<string[]>("SF", "assetFolders");
	retval.forEach(entry => {
		let _entry = path.join(entry, "Assets");

		const fill = ReadJSON<RootObject>(path.join(entry, "assetdata.json"));
		const settings = ReadJSON<SettingsStruct>(path.join(entry, "Audit", "settings.json"));

		// reset
		fill.StaticMesh.list.length = 0;
		fill.Texture.list.length = 0;
		fill.Audio.list.length = 0;

		fs.readdirSync(_entry).forEach(file => {
			let stats = fs.lstatSync(path.join(_entry, file));
			// Handle if directory
			if (stats.isDirectory()) {
				if (file === "Animations") {
				}
				let funcdata: AssetStreamKit = {
					dataJSON: fill,
					settingJSON: settings,
					folderpath: path.join(_entry, file),
					targetBasePath: settings.targetPath + "/" + file,
				};
				RefreshStreamForFolder(funcdata);
			} else if (RegExp(/(.*?).fbx/i).test(file)) {
				fill["StaticMesh"].list.push({
					name: file.match(/^(.*?)\..*?/)![1],
					path: path.join(entry, "Assets", file),
					targetpath: settings.targetPath,
				});
			} else if (RegExp(/(.*?).(png|jpg)/i).test(file)) {
				fill["Texture"].list.push({
					name: file.match(/^(.*?)\..*?/)![1],
					path: path.join(entry, "Assets", file),
					targetpath: settings.targetPath,
				});
			} else if (RegExp(/(.*?).(wav|mp3)/i).test(file)) {
				fill["Audio"].list.push({
					name: file.match(/^(.*?)\..*?/)![1],
					path: path.join(entry, "Assets", file),
					targetpath: settings.targetPath,
				});
			}
		});
		try {
			WriteJSONToFile(path.join(entry, "assetdata.json"), fill);
		} catch {
			vsui.Error("Writing to assetdata.json failed.");
		}

		// Populate JSON data for root...
		const obj1: Array<IStaticMesh> = [];
		const obj2: Array<IMusic> = [];
		const obj3: Array<ITexture> = [];
		// .fbx
		fill.StaticMesh.list.forEach(el => {
			let enginePath = el.targetpath + "/" + el.name + "." + el.name;
			InjectInDataTable(obj1, AssetType.StaticMesh, enginePath);
		});
		WriteJSONToFile(path.join(entry, "Audit", "SM.json"), obj1);
		// .wav
		fill.Audio.list.forEach(el => {
			let enginePath = el.targetpath + "/" + el.name + "." + el.name;
			InjectInDataTable(obj2, AssetType.SoundWave, enginePath);
		});
		WriteJSONToFile(path.join(entry, "Audit", "Music.json"), obj2);
		// .png
		fill.Audio.list.forEach(el => {
			let enginePath = el.targetpath + "/" + el.name + "." + el.name;
			InjectInDataTable(obj3, AssetType.Textures, enginePath);
		});
		WriteJSONToFile(path.join(entry, "Audit", "Tex.json"), obj3);

		// -----------------------
		// Run binary toolchains
		// -----------------------

		if (settings.run_texturepacker) {
			let args =
				'"' +
				path.join(entry, "Binaries", "texpack.exe") +
				'" "' +
				path.join(entry, "settings2.json") +
				'" "' +
				path.join(entry, "Source", "TextureSets") +
				'" "' +
				path.join(entry, "Assets", "TexPacker") +
				'"';
			RunCmd(args);
		}
	});
}

export function CopyBinaries(os: string, folderpath: string) {
	let _binpath = "";
	let _extdir = "";
	switch (os) {
		case "Linux": {
			vsui.Info(
				"Hey! Linux support is off due to insufficient feedback. You can lend help fo this at discord.",
			);
			_binpath = "bin/linux";
			break;
		}
		case "Darwin": {
			vsui.Info(
				"Hey! MacOS support is off due to insufficient feedback. You can lend help fo this at discord.",
			);
			_binpath = "bin/macos";
			break;
		}
		case "Windows_NT": {
			_binpath = "bin/win64";
			_extdir = path.join(process.env["USERPROFILE"]!, ".vscode-insiders\\extensions");
			break;
		}
		default:
			break;
	}

	if (_extdir !== "") {
		filesys.ScanFolderWithRegex(_extdir, /suvam0451/).then(folder => {
			_extdir = path.join(_extdir, folder, _binpath);
			fs.copyFileSync(
				path.join(_extdir, "texpack.exe"),
				path.join(folderpath, "Binaries", "texpack.exe"),
			);
			// filesys.ScanFolderWithRegex(_extdir, /suvam0451/);
		});

		// fs.copyFileSync()
	}
}

/** Runs cmd in windows with given args */
export function RunCmd(args: string, terminal?: vscode.Terminal) {
	let cmd = "start-process cmd.exe" + " '" + '"/k "' + args + "'";
	if (terminal === undefined) {
		let terminal = vscode.window.createTerminal("suvam0451");
		terminal.sendText(cmd);
	} else {
		terminal.sendText(cmd);
	}
}

export interface IMusic {
	Name: string;
	SoundWave: string;
	SoundWave_Soft: string;
}

export interface IStaticMesh {
	Name: string;
	StaticMesh: string;
	StaticMesh_Soft: string;
}

export interface ITexture {
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
	auto_generate_lods: boolean;
	run_texturepacker: boolean;
	texPacker: {
		alias: {
			normal: ["normal"];
		};
	};
}
