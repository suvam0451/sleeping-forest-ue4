// Copyright (c) 2020 Debashish Patra, MPL-2.0

// IncludeManager.ts
// Isolated module to handle header inclusion. Refer database at IncludeMapping.json

import * as vscode from "vscode";
import * as edit from "../utils/EditorHelper";
import { QuickPick } from "../modules/VSInterface";
import DefaultData from "../data/IncludeTemplates.json";
import ExtensionData from "../data/extensions/Includes_Ext.json";
import * as _ from "lodash";

export default async function IncludeManager(): Promise<void> {
	let arr = _.concat(DefaultData, ExtensionData);
	let editor = vscode.window.activeTextEditor;
	let marr: string[] = [];
	arr.forEach(element => {
		marr.push(element.id);
	});

	return new Promise<void>((resolve, reject) => {
		if (editor === undefined) {
			resolve();
		}
		// Use createQuickPick for advanced use cases...
		QuickPick(marr, false).then(val => {
			arr.forEach(element => {
				if (val === element.id) {
					let myarr: string[] = element.headers;
					myarr = myarr.map(o => {
						return '#include "' + o + '"';
					});
					edit.InjectHeaders(editor!, myarr);
					resolve();
				}
			});
		});
	});
}
