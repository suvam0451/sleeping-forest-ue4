// Copyright (c) 2020 Debashish Patra, MPL-2.0

// IncludeManager.ts
// Isolated module to handle header inclusion. Refer database at IncludeMapping.json

import * as vscode from "vscode";
import * as edit from "../utils/EditorHelper";
// import { QuickPick } from "../modules/VSInterface";
import DefaultData from "../data/IncludeTemplates.json";
import ExtensionData from "../data/extensions/Includes_Ext.json";
import * as _ from "lodash";
import * as fs from "fs";
import * as filesys from "../utils/FilesystemHelper";
import * as path from "path";
import * as vs from "../modules/VSInterface";

export default async function InjectExcludeDefinition(): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		let ws = vscode.workspace.workspaceFolders;
		if (ws === undefined) {
			resolve();
		}
		let falsePositive = true;
		let initDir = ws[0].uri.fsPath;
		// console.log();
		let files = fs.readdirSync(initDir);
		_.forEach(files, file => {
			if (/(.*?).uproject$/.test(file)) {
				falsePositive = false;
				// console.log(file);
			}
		});
		if (falsePositive) {
			resolve();
		}

		// Get this extension's settings
		let myretval;

		// files.exclude
		let config_01 = vscode.workspace.getConfiguration("files");
		let retval: any = config_01.get("exclude")!;
		myretval = vs.GetVSConfig<string[]>("SF", "excludedExtensions");
		myretval.forEach(val => {
			retval["**." + val] = true;
		});
		myretval = vs.GetVSConfig<string[]>("SF", "excludeFolders");
		myretval.forEach(val => {
			retval["**/" + val] = true;
		});

		// files.watcherExclude
		let config_02 = vscode.workspace.getConfiguration("files");
		retval = config_02.get("watcherExclude");
		retval["**/Engine/**"] = true;

		// search.exclude
		let config_03 = vscode.workspace.getConfiguration("search");
		retval = config_03.get("exclude");
		myretval = vs.GetVSConfig<string[]>("SF", "searchExclude");
		myretval.forEach(val => {
			retval["**/" + val] = true;
		});

		// update
		config_01.update("exclude", retval, false).then(() => {
			config_02.update("watcherExclude", retval, undefined).then(() => {
				config_03.update("exclude", retval, undefined);
			});
		});

		// Adds Extensions tab to workspace
		let folderpath = filesys.RelativeToAbsolute(
			"suvam0451.sleeping-forest-ue4",
			path.join("data", "extensions"),
		);
		vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders!.length, 0, {
			uri: vscode.Uri.file(folderpath!),
			name: "Extensions",
		});

		// Include asset folders as siderbars in project
		let choice = vs.GetVSConfig<string[]>("SF", "assetFolders");

		choice.forEach((folder, i) => {
			if (fs.existsSync(folder)) {
				vscode.workspace.updateWorkspaceFolders(3 + i, 0, {
					uri: vscode.Uri.file(folder),
					name: "Stream #" + i,
				});
			}
		});
		resolve();
	});
}
