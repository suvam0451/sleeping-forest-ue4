// Copyright (c) 2020 Debashish Patra, MPL-2.0

// IncludeManager.ts
// Isolated module to let users paste their errors and search database for resolution.

import * as vscode from "vscode";
import { resolve } from "dns";
import * as edit from "../utils/EditorHelper";
import data from "../data/IncludeMapping.json";
import { GetPluginDataFromFolder, PluginPathInfo } from "../utils/FilesystemHelper";
import * as fs from "fs";
var XRegExp = require("xregexp");
import * as path from "path";

interface ClassCreationKit {
    modulepath: string;
    modulename: string;
    requestedType: string;
    requestedName: string;
}

export default async function CreateClassModule(): Promise<void> {
    console.log("Crank it up");
    let editor = vscode.window.activeTextEditor;
    let loc: string[] = []; // Potential module locations
    let pluginList: Array<PluginPathInfo> = []; // Use for mapping
    let kit: ClassCreationKit = {
        modulepath: "",
        modulename: "",
        requestedType: "",
        requestedName: ""
    };

    let targetPath: string = path.join(
        vscode.workspace.workspaceFolders![0].uri.path.substr(1),
        "Plugins"); // uri.path had one leading '/' to remove

    return new Promise<void>((resolve, reject) => {
        if (editor === undefined) {
            resolve();
        }


        fs.readdir(targetPath, (err, folders) => {
            folders.forEach((foldername: string) => {

                GetPluginDataFromFolder(path.join(targetPath, foldername)).then((ret) => {
                    ret.forEach((val) => {
                        if (IsValidModuleName(val.foldername) === true) {
                            pluginList.push(val);
                            loc.push(val.foldername);
                        }
                    });

                    console.log(loc);
                    vscode.window.showQuickPick(loc).then((retval) => {
                        if (retval) {
                            pluginList.forEach((val) => {
                                if (val.foldername === retval) {
                                    kit.modulename = val.foldername;
                                    kit.modulepath = val.folderpath;
                                    HandleClassSelection(kit);
                                }
                            });

                        }
                        else {
                            // Handle this warning...
                        }
                    }).then(() => {
                        resolve();
                    });
                });
            });
        });
        resolve();
    });
}

/** Called after module is selected by user to provide class catalogue. */
async function HandleClassSelection(kit: ClassCreationKit): Promise<ClassCreationKit> {
    let marr: string[] = []; // Classes offered
    let className = "";
    marr.push("Actor", "Character", "Interface", "ActorComponent");

    vscode.window.showQuickPick(marr).then((retval) => {
        if (retval !== "") {
            className = retval!;
        }
        // console.log("Request to add: " + retval + " in " + modulepath);
    }).then(() => {
        return new Promise<ClassCreationKit>((resolve, reject) => {
            const input = vscode.window.showInputBox();
            input.then((value) => {
                if (value !== "") {
                    kit.requestedName = value!;
                    vscode.window.showWarningMessage("Request: Add "
                        + value + " of type " + kit.requestedName + " in " + kit.modulename
                        + ". Press yes to confirm.");
                }
            });

            resolve(kit);
        });

    });
    return new Promise<ClassCreationKit>((resolve, reject) => {
        resolve(kit);
    });
}

function IsValidModuleName(name: string) {
    if ((name === "Python") ||
        (name === "Shaders") ||
        (false)) { return false; }
    else { return true; }
}

/** Final step, checks if file can be created.  */
// function RequestValidation(modulepath: string, request: string): boolean {

//     if (fs.existsSync(modulepath) &&
//         fs.existsSync(path.join(modulepath, "Source")))
//         return false;
// }