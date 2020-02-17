// Copyright (c) 2020 Debashish Patra, MPL-2.0

// IncludeManager.ts
// Isolated module to handle header inclusion. Refer database at IncludeMapping.json

import * as vscode from "vscode";
import * as edit from "../utils/EditorHelper";
import { QuickPick } from "../modules/VSInterface";
import DefaultData from "../data/IncludeTemplates.json";
import ExtensionData from "../data/extensions/Includes_Ext.json";
import * as _ from "lodash";
import * as fs from "fs";
import * as filesys from "../utils/FilesystemHelper";
import * as path from "path";
import * as vs from "../modules/VSInterface";

export default async function InjectExcludeDefinition(): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		let initDir = vscode.workspace.workspaceFolders![0].uri.fsPath;
		// console.log();
		let files = fs.readdirSync(initDir);
		_.forEach(files, file => {
			let ex = /^(.*?).code-workspace/;
			if (ex.test(file)) {
				// console.log(file);
			}
		});

		// Get this extension's settings
		let myretval;

		// files.exclude
		let config = vscode.workspace.getConfiguration("files");
		let retval: any = config.get("exclude")!;
		myretval = vs.GetVSConfig<string[]>("SF", "excludedExtensions");
		myretval.forEach(val => {
			retval["**." + val] = true;
		});
		myretval = vs.GetVSConfig<string[]>("SF", "excludeFolders");
		myretval.forEach(val => {
			retval["**/" + val] = true;
		});
		config.update("exclude", retval, false);

		// files.watcherExclude
		config = vscode.workspace.getConfiguration("files");
		retval = config.get("watcherExclude");
		retval["**/Engine/**"] = true;
		config.update("watcherExclude", retval, undefined);

		// search.exclude
		config = vscode.workspace.getConfiguration("search");
		retval = config.get("exclude");
		myretval = vs.GetVSConfig<string[]>("SF", "searchExclude");
		myretval.forEach(val => {
			retval["**/" + val] = true;
		});
		config.update("exclude", retval, undefined);

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
