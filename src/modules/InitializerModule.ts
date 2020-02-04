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

interface InitContextData {
	line: number;
	text?: string;
	symbol?: string;
	returntype?: string;
	symboltype?: string;
	cursorpos?: vscode.Position;
}
export default async function InitializerModule(): Promise<void> {
	let editor = vscode.window.activeTextEditor;
	let data: InitContextData = {
		line: -1,
	};

	if (editor) {
		data.cursorpos = editor.selection.active;
		data.line = editor.selection.active.line;
	}

	// vscode.window.activeTextEditor?.selections.toString();

	data.text = editor?.document.lineAt(data.line).text;

	// console.log(data.text);
	// console.log(RegExp(/(.*?)Component /).test(myline!));
	// USceneComponent *SceneRoot;
	if (
		/(.*?)U([a-zA-Z_]*?)Component(\*| ){2}(.*?);/.test(data.text!)
	) {
		console.log("match found...");
		// test for Components (for ucdo)
		let match = data.text?.match(/([a-zA-Z_]*)(\*| ){2}(.*?);/);
		// console.log(match);
		if (match?.length === 4) {
			data.symboltype = match[1];
			data.symbol = match[3];
			// console.log(data);
			let retval =
				data.symbol +
				" = " +
				"CreateDefaultSubobject<" +
				data.symboltype +
				'>("' +
				data.symbol +
				'")';
			vscode.env.clipboard.writeText(retval);
			vscode.window.showInformationMessage(
				"Initializer copied to clipboard.",
			);
		}
	} else if (
		/.*?bool ([a-zA-Z_0-9]*)[ =]{3}.*?(Sweep)?(Multi|Single)/.test(
			data.text!,
		)
	) {
		let res = data.text!.match(
			/.*?bool ([a-zA-Z_0-9]*)[ =]{3}.*?(Sweep)?(Multi|Single)/,
		);
		if (res && res[3] === "Multi") {
			let retval = `
    if (${res[1]}) {
        for (auto it : HitRes) {
            UE_LOG(LogTemp, Warning, TEXT("Impact at: %s caused by %s"), *it.GetActor()->GetActorLocation().ToString(), *it.GetActor()->GetFName().ToString());
            // DrawDebugLine(this->GetWorld(), FVector(), it.GetActor()->GetActorLocation(), FColor::Green, false, 4.0f, 0, 0.5f);
            // DrawDebugPoint(this->GetWorld(), it.Location, 10.0f, FColor::Red, false, 4.0f, 0);
        }
    }`;
			let num = GetEOL(editor!, data.line);
			editor?.edit(editBuilder => {
				editBuilder.insert(num, retval + "\n");
			});
			// vscode.window.activeTextEditor?.edit();
			vscode.env.clipboard.writeText(retval);
			vscode.window.showInformationMessage(
				"Initializer copied to clipboard.",
			);
		}
	}

	return new Promise<void>((resolve, reject) => {
		resolve();
	});
}

function GetEOL(
	editor: vscode.TextEditor,
	line: number,
): vscode.Position {
	// let editor = vscode.window.activeTextEditor;
	let text = editor?.document.lineAt(line).range.end;
	return text!;
}
