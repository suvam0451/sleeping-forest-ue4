// Copyright (c) 2020 Debashish Patra, MPL-2.0

// IncludeManager.ts
// Isolated module to handle header inclusion. Refer database at IncludeMapping.json

import * as vscode from "vscode";
import * as edit from "../utils/EditorHelper";
import { QuickPick } from "../modules/VSInterface";
import DefaultData from "../data/IncludeTemplates.json";
import ExtensionData from "../data/extensions/IncludeSets.json";
import * as _ from "lodash";
import * as fs from "fs";

export default async function InjectExcludeDefinition(): Promise<
	void
> {
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
		let myconfig = vscode.workspace.getConfiguration("globalnode");
		let myretval;
		let config = vscode.workspace.getConfiguration("files");
		let retval: any = config.get("exclude")!;

		// List of modifications
		// .gitignore copy
		retval["**/Intermediate"] = true;
		retval["**/Saved"] = true;
		retval["**/Binaries"] = true;
		retval["**/Build"] = true;
		// extensions
		retval["**.dll"] = true;
		retval["**.exe"] = true;
		// Engine folders
		retval["**/DerivedDataCache"] = true;
		retval["**/Documentation"] = true;
		retval["**/Programs"] = true; // UHT, UBT, Shader compiler etc. (keep false)
		retval["**/Shaders"] = true; // Shaders are linked via plugin Build.cs files.
		retval["**/FeaturePacks"] = true; // Map packages
		retval["**/Samples"] = true; // Starter Content
		retval["**/Templates"] = true; // Template maps
		retval[".egstore"] = true; // Template maps
		retval["**/Engine/Build"] = true; // Contains binaries
		retval["**/Engine/Extras"] = true; // External app scripts
		retval["**/Engine/Content"] = true; // binary (.uasset, .umap) files
		// Apply config : Whether to exclude editor classes from workspace
		myretval = myconfig.get<boolean>(
			"excludeEditorClassesFromWorkspace",
		)!;
		retval["**/Engine/Source/Editor"] = myretval;

		config.update("exclude", retval, false);
		//#endregion

		config = vscode.workspace.getConfiguration("files");
		retval = config.get("watcherExclude");

		retval["**/Engine/**"] = true;
		config.update("watcherExclude", retval, undefined);

		//#region search.exclude
		config = vscode.workspace.getConfiguration("search");
		retval = config.get("exclude");
		// Added list
		retval["**.py"] = true;
		retval["**.generated.h"] = true;
		retval["**/CoreRedirects.cpp"] = true;
		retval["**/CoreRedirects.h"] = true;

		// Apply config : Whether to exclude editor classes from search
		myretval = myconfig.get<boolean>(
			"hideEditorClassesFromWorkspace",
		)!;
		retval["**/Engine/Source/Editor"] = myretval;
		retval["**.code-workspace"] = true;
		config.update("exclude", retval, undefined);
		//#endregion

		resolve();
	});
}
