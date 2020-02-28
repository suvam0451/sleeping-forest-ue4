// Copyright (c) 2020 Debashish Patra, MPL-2.0

// IncludeManager.ts
// Isolated module to handle header inclusion. Refer database at IncludeMapping.json

import * as vscode from "vscode";
import * as _ from "lodash";
import * as fs from "fs";
import * as filesys from "../utils/FilesystemHelper";
import * as path from "path";
import { vscfg } from "@suvam0451/vscode-geass";

export default async function InjectExcludeDefinition(): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		let ws = vscode.workspace.workspaceFolders;
		if (ws === undefined) {
			resolve();
		}
		let falsePositive = true;
		let initDir = ws[0].uri.fsPath;
		let files = fs.readdirSync(initDir);
		_.forEach(files, file => {
			if (/(.*?).uproject$/.test(file)) {
				falsePositive = false;
			}
		});
		if (falsePositive) {
			resolve();
		}

		// Get this extension's settings
		let myretval;

		// files.exclude
		let config_01 = vscode.workspace.getConfiguration("files");
		let retval_01: any = config_01.get("exclude")!;
		myretval = vscfg.GetVSConfig<string[]>("SF", "excludedExtensions");
		myretval.forEach(val => {
			retval_01["**." + val] = true;
		});

		myretval = vscfg.GetVSConfig<string[]>("SF", "excludeFolders");
		myretval.forEach(val => {
			retval_01["**/" + val] = true;
		});

		// files.watcherExclude
		let config_02 = vscode.workspace.getConfiguration("files");
		let retval_02 = config_02.get("watcherExclude");
		retval_02["**/Engine/**"] = true;

		// search.exclude
		let config_03 = vscode.workspace.getConfiguration("search");
		let retval_03 = config_03.get("exclude");
		myretval = vscfg.GetVSConfig<string[]>("SF", "searchExclude");
		myretval.forEach(val => {
			retval_03["**/" + val] = true;
		});

		// update
		config_01.update("exclude", retval_01, false).then(() => {
			config_02.update("watcherExclude", retval_02, false).then(() => {
				config_03.update("exclude", retval_03, false).then(() => {
					/* 
					---------- After all configs are updated -----------------------
					 */

					let arr: WorkspaceFolderStruct[] = [];
					let _initialOffset = vscode.workspace.workspaceFolders!.length;

					// Adds Extensions tab to workspace
					let folderpath = filesys.RelativeToAbsolute(
						"suvam0451.sleeping-forest-ue4",
						path.join("data", "extensions"),
					);
					arr.push({
						uri: vscode.Uri.file(folderpath!),
						name: "Extensions",
					});

					let AssetFolders = vscfg.GetVSConfig<string[]>("SF", "assetFolders");

					AssetFolders.forEach((folder, i) => {
						if (fs.existsSync(path.join(folder, "Audit"))) {
							arr.push({
								uri: vscode.Uri.file(path.join(folder, "Audit")),
								name: "Stream #" + i,
							});
						}
					});

					// Git submodules
					let SubmoduleList = vscfg.GetVSConfig<string[]>("SF", "GitSubmodules");
					SubmoduleList.forEach((submodule, i) => {
						arr.push({
							uri: vscode.Uri.file(submodule),
							name: "Submodule #" + i,
						});
					});

					// Apply changes (Cleaning if necessary)
					if (_initialOffset > 2) {
						vscode.workspace.updateWorkspaceFolders(2, _initialOffset - 2, ...arr);
					} else {
						vscode.workspace.updateWorkspaceFolders(2, 0, ...arr);
					}
					resolve();
				});
			});
		});
	});
}

interface WorkspaceFolderStruct {
	uri: vscode.Uri;
	name: string;
}
