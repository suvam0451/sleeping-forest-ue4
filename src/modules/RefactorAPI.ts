// Copyright (c) 2020 Debashish Patra, MPL-2.0

// IncludeManager.ts
// Isolated module to handle header inclusion. Refer database at IncludeMapping.json

import * as vscode from "vscode";
import * as _ from "lodash";
import * as fs from "fs";
import * as filesys from "../utils/FilesystemHelper";
import * as path from "path";
import { vscfg, vsui } from "@suvam0451/vscode-geass";

export default function RefactorAPI() {
	vsui
		.QuickPick(
			["4.24 --> 4.25 | UProperty --> FProperty", "4.24 <-- 4.25 | FProperty --> UProperty"],
			false,
		)
		.then(ret => {
			switch (ret) {
				case "4.24 --> 4.25 | UProperty --> FProperty": {
					RegexReplaceEachLine(/(UProperty)\(.*?\)/, ["FProperty"]);
					break;
				}
				case "4.24 <-- 4.25 | FProperty --> UProperty": {
					RegexReplaceEachLine(/(FProperty)\(.*?\)/, ["UProperty"]);
					break;
				}
				// Cast to CastField
			}
		});
}

export async function RegexReplaceEachLine(ex: RegExp, replace: string[]) {
	let editor = vscode.window.activeTextEditor;

	for (let i = 0; i < editor.document.lineCount; i++) {
		let line = editor.document.lineAt(i).text;
		let range = editor.document.lineAt(i).range;

		let range_array: vscode.Range[] = [];
		let edit_array: string[] = [];

		if (ex.test(line)) {
			let match = line.match(ex);
			replace.forEach((symbol, j) => {
				line = line.replace(match[j + 1], symbol);
			});
			range_array.push(range);
			edit_array.push(line);
		}

		for (let i = 0; i < range_array.length; i++) {
			await editor
				.edit(editbuilder => {
					editbuilder.replace(range_array[i], edit_array[i]);
				})
				.then(() => {
					vscode.workspace.saveAll();
				});
		}
	}
}
