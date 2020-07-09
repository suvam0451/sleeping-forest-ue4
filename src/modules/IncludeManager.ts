// Copyright (c) 2020 Debashish Patra, MPL-2.0

// IncludeManager.ts
// Isolated module to handle header inclusion. Refer database at IncludeMapping.json

import * as vscode from "vscode";
import * as edit from "../utils/EditorHelper";
import DefaultData from "../data/IncludeTemplates.json";
import * as _ from "lodash";
import * as path from "path";
import * as filesys from "../utils/FilesystemHelper";
import { vsui } from "vscode-geass";

interface IncludeJSON {
	id: string;
	headers: string[];
}

export default async function IncludeManager(): Promise<void> {
	let modpath = filesys.RelativeToAbsolute(
		"suvam0451.sleeping-forest-ue4",
		path.join("data", "extensions", "Includes_Ext.json"),
	);

	if (modpath !== undefined) {
		let extdata = filesys.ReadJSON<IncludeExtension[]>(modpath);

		let arr: IncludeJSON[] = _.concat(DefaultData, extdata);
		let editor = vscode.window.activeTextEditor;
		let marr: string[] = [];
		arr.forEach((element) => {
			marr.push(element.id);
		});

		return new Promise<void>((resolve, reject) => {
			if (editor === undefined) {
				resolve();
			}
			// Use createQuickPick for advanced use cases...
			vsui.QuickPickAsync(marr, false).then((val) => {
				arr.forEach((element) => {
					if (val === element.id) {
						let myarr: string[] = element.headers;
						myarr = myarr.map((o) => {
							return '#include "' + o + '"';
						});
						edit.InjectHeaders(myarr);
						resolve();
					}
				});
			});
		});
	} else {
		// Handle extension not properly installed
	}
}

interface IncludeExtension {
	id: string;
	headers: string[];
}
