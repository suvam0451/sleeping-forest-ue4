// Copyright (c) 2020 Debashish Patra, MPL-2.0

// IncludeManager.ts
// Isolated module to let users paste their errors and search database for resolution.

import * as vscode from "vscode";
import { resolve } from "dns";
import * as edit from "../utils/EditorHelper";
import { GetPluginDataFromFolder } from "../utils/FilesystemHelper";
import * as fs from "fs";
var XRegExp = require("xregexp");
import * as path from "path";
import classData from "../data/BuildTemplates.json";
import extendedClassData from "../data/BuildExtension.json";
// Header/Source file generation data...
import Default_Actor_h from "../data/generators/Default_Actor_h.json";
import Default_Actor_cpp from "../data/generators/Default_Actor_cpp.json";
import { rejects } from "assert";
import IncludeManager from "./IncludeManager";
import { InjectHeaders, InjectFunctions } from "../utils/FileHelper";
import * as _ from "lodash";
import { QuickPick, InputBox, PickFolder } from "./VSInterface";
import { WriteAtLine } from "../utils/FilesystemHelper";
import FileHandler from "../classes/FileHandler";
import * as filesys from "../utils/FilesystemHelper";
import settings from "../data/templates/streamSettings.json";
import generator from "../data/templates/pythonGenerator.json";

export function InitializeStream() {
    PickFolder().then((ret) => {
        // console.log(ret);
        if (!fs.existsSync(path.join(ret, "Assets"))) {
            fs.mkdirSync(path.join(ret, "Assets"));
        }

        // fs.writeFileSync(path.join(ret, "settings.json"), "");
        // fs.writeFileSync(path.join(ret, "ExportScript.py"), "");
        filesys.ConfirmFileExists(path.join(ret, "settings.json"));
        filesys.ConfirmFileExists(path.join(ret, "ExportScript.py"));
        // let fit = settings;
        try {
            let writer = fs.createWriteStream(path.join(ret, "settings.json"));
            settings.forEach((line) => {
                line = line.replace("$1", ret);
                line = line.replace(/\\/g, "/");
                writer.write(line + "\n");
            });
            writer.close();

            writer = fs.createWriteStream(path.join(ret, "ExportScript.py"));
            generator.forEach((line) => {
                line = line.replace("$1", ret);
                line = line.replace(/\\/g, "/");
                writer.write(line + "\n");
            });
            writer.close();
        }
        catch{
            console.log("failed to create file");
        }
    });
}
