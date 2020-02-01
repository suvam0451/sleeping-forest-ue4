// Copyright (c) 2020 Debashish Patra, MPL-2.0

// IncludeManager.ts
// Isolated module to handle header inclusion. Refer database at IncludeMapping.json

import * as vscode from "vscode";
import * as edit from "../utils/EditorHelper";
import { QuickPick } from "../modules/VSInterface";
import DefaultData from "../data/IncludeTemplates.json";
import ExtensionData from "../data//IncludeExtension.json";
import * as _ from "lodash";
import * as fs from "fs";

export default async function InjectExcludeDefinition(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        let initDir = vscode.workspace.workspaceFolders![0].uri.fsPath;
        // console.log();
        let files = fs.readdirSync(initDir);
        _.forEach(files, (file) => {
            let ex = /^(.*?).code-workspace/;
            if (ex.test(file)) {
                // console.log(file);
            }
        });
        let config = vscode.workspace.getConfiguration("files");
        let retval: any = config.get<Object>("exclude")!;
        // let retval2 = retval.get("**/node_modules");
        console.log(retval!);

        retval.hasOwnProperty("")
        let boole: boolean = retval["**/.git"];

        // List of modifications
        // .gitignore copy
        retval["Intermediate"] = true;
        retval["**/Saved"] = true;
        retval["**/Binaries"] = true;
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
        retval["Templates"] = true; // Template maps
        retval[".egstore"] = true; // Template maps
        retval["**/Engine/Build"] = true; // Contains binaries
        retval["**/Engine/Extras"] = true; // External app scripts
        retval["**/Engine/Content"] = true; // binary (.uasset, .umap) files

        config.update("exclude", retval, false);


        resolve();
    });
}