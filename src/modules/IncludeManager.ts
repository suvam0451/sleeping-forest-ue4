// Copyright (c) 2020 Debashish Patra, MPL-2.0

// IncludeManager.ts
// Isolated module to handle header inclusion. Refer database at IncludeMapping.json

import * as vscode from "vscode";
import { resolve } from "dns";
import * as edit from "../utils/EditorHelper";
import data from "../data/IncludeMapping.json";

export default async function IncludeManager(): Promise<void> {
    let editor = vscode.window.activeTextEditor;
    let marr: string[] = [];
    marr.push("Spline", "Procedural");
    let list: string[] = [];
    return new Promise<void>((resolve, reject) => {
        if (editor === undefined) { resolve(); }
        // Use createQuickPick for advanced use cases...
        vscode.window.showQuickPick(marr).then((retval) => {
            switch (retval) {
                case "Procedural": { list = data.Procedural; break; }
                case "Spline": { list = data.Spline; break; }
                default: { break; }
            }
            edit.InjectHeaders(editor!, list);
            resolve();
        });
    });
}