// Copyright (c) 2020 Debashish Patra, MPL-2.0

// IncludeManager.ts
// Isolated module to let users paste their errors and search database for resolution.

import * as vscode from "vscode";
import { resolve } from "dns";
import * as edit from "../utils/EditorHelper";
import data from "../data/IncludeMapping.json";
import { GetPluginDataFromFolder } from "../utils/FilesystemHelper";
import * as fs from "fs";
var XRegExp = require("xregexp");
import * as path from "path";
import classData from "../data/BuildTemplates.json";
import extendedClassData from "../data/BuildExtension.json";
// Header/Source file generation data...
import Actor_h from "../data/generators/Actor_h.json";
import { rejects } from "assert";


interface ClassCreationKit {
    modulepath: string;
    modulename: string;
    parentclass: string;
    classname: string;
    buildspace: string;
}

export interface PluginPathInfo {
    foldername: string;
    folderpath: string;
    isGameModule: boolean;
}

function Takizawa() {
    let classList = [];

    let arrr = classData.concat(extendedClassData);
    arrr.forEach((ret) => {
        console.log(ret.buildspace);
    });
}
async function ClassSelection(data: ClassCreationKit): Promise<ClassCreationKit> {
    let classList = [];

    let arrr = [classData];
    arrr.concat(extendedClassData);
    arrr.forEach((ret) => {
        ret.forEach((ret2) => {
            console.log(ret2.buildspace);
        });
    });
    return new Promise<ClassCreationKit>((resolve, reject) => {
        // if (!data.isUserExtended) {
        let spaceindex = classData.findIndex((ele) => { ele.buildspace === data.buildspace; });
        if (spaceindex === -1) { reject("Internal Error."); }
        classData[spaceindex].templates.forEach((tmpl) => {
            classList.push(tmpl.id);
        });
        // }
    });
}

/** Returns a list of valid modules including main game module... */
async function ModuleSelection(data: ClassCreationKit): Promise<ClassCreationKit> {
    let pluginDataArray: PluginPathInfo[] = [];
    let workspacePath: string = vscode.workspace.workspaceFolders![0].uri.path.substr(1);
    let pluginPath = path.join(workspacePath, "Plugins");

    return new Promise<ClassCreationKit>((resolve, reject) => {
        fs.readdir(pluginPath, (err, folders) => {
            folders.forEach((folder) => {
                let ret = GetPluginDataFromFolder(path.join(pluginPath, folder))
                // .then((ret) => {
                console.log("Return containes: ", ret);
                pluginDataArray = pluginDataArray.concat(ret);
                console.log("Part 2 containes: ", pluginDataArray);
                // });
            });
            let lst = [];
            console.log("Part 3 containes: ", pluginDataArray);
            pluginDataArray.forEach((ret) => {
                lst.push(ret.foldername);
            });
            lst.push("Game");
            vscode.window.showQuickPick(lst).then((sel) => {
                let index = pluginDataArray.find((i) => { i.foldername === sel; });
                if (index && index.foldername !== "Game") {
                    data.modulename = index.foldername;
                    data.modulepath = index.folderpath;
                    resolve(data);
                }
                else if (index?.foldername === "Game") {
                    reject("Not yet dealt with Game module");
                } else {
                    reject("User did not select any moduel...");
                }
            });
        });
    });

}
export default async function CreateClassModule(): Promise<void> {
    Takizawa();
    console.log("Crank it up");
    let editor = vscode.window.activeTextEditor;
    let loc: string[] = []; // Potential module locations
    let pluginList: Array<PluginPathInfo> = []; // Use for mapping
    let kit: ClassCreationKit = {
        modulepath: "",
        modulename: "",
        parentclass: "",
        classname: "",
        buildspace: ""
    };

    let targetPath: string = path.join(
        vscode.workspace.workspaceFolders![0].uri.path.substr(1),
        "Plugins"); // uri.path had one leading '/' to remove


    NamespaceSelection().then((ret) => { // Gets buildspace and isUserExtended
        ModuleSelection(ret).then((ret2) => { // Gets modulename, modulepath
            // ClassSelection(ret2);
        });
    });
    // let namespace = NamespaceSelection();
    // let modules = ;

    // Promise.all([namespace, modules]).then((res) => {
    //     let locco: string[] = [];
    // 
    //     res[1].forEach((module) => { locco.push(module.foldername); });
    //     // selecting module
    //     vscode.window.showQuickPick(locco).then((sel) => {
    // 
    //     });
    // });
    return new Promise<void>((resolve, reject) => {
        // if (editor === undefined) {
        //     resolve();
        // }
        // 
        // fs.readdir(targetPath, (err, folders) => {
        //     folders.forEach((foldername: string) => {
        //         GetPluginDataFromFolder(path.join(targetPath, foldername)).then((ret) => {
        //             ret.forEach((val) => {
        //                 pluginList.push(val);
        //                 loc.push(val.foldername);
        //             });
        //             // console.log(loc);
        //             vscode.window.showQuickPick(loc).then((retval) => {
        //                 if (retval) {
        //                     pluginList.forEach((val) => {
        //                         if (val.foldername === retval) {
        //                             kit.modulename = val.foldername;
        //                             kit.modulepath = val.folderpath;
        //                         }
        //                     });
        //                     HandleClassSelection(kit).then((retval) => {
        //                         console.log("Request accepted...");
        //                         ValidateRequest(retval).then((ret) => {
        //                             console.log("return for bolean passage block was ", ret);
        //                             HandleClassGeneration(retval);
        //                             resolve();
        //                         });
        //                     });
        //                     resolve(); // Nothing happened. Just return...
        //                 }
        //                 else {
        //                     console.log("None of listed modules was selected. Aborting...");
        //                     resolve();
        //                 }
        //             }, (err) => {
        //                 console.log("No values selected " + err);
        //             });
        //         });
        //     });
        // });
        resolve();
    });
}

interface SymbolData {
    classname: string;
    namespace: string;
    apiname: string;
}


function HandleClassGeneration(kit: ClassCreationKit) {
    // console.log("HandleClassGeneration called...");
    let sourcefilepath = path.join(kit.modulepath, "Private", kit.classname + ".cpp");
    let headerfilepath = path.join(kit.modulepath, "Public", kit.classname + ".h");
    // let sourcelogger = fs.createWriteStream(sourcefilepath, { flags: "w" });
    // sourcelogger.write("Kimochii Oniichan <3");
    // "Actor", "Character", "Interface", "ActorComponent", "Object", "DataAsset"
    switch (kit.parentclass) {
        case "Actor": {
            ParseAndWrite(headerfilepath, Actor_h, GenerateSymbols(kit)); break;
        }
        // case "ActorComponent": { ParseAndWrite(headerfilepath, Actor) break; }
        // case "Character": { ParseAndWrite(headerfilepath, Actor) break; }
        // case "Interface": { ParseAndWrite(headerfilepath, Actor) break; }
        // case "Object": { ParseAndWrite(headerfilepath, Actor) break; }
        // case "DataAsset": { ParseAndWrite(headerfilepath, Actor) break; }
        default: { break; }
    }
    // sourcelogger.close();

    // let headerlogger = fs.createWriteStream(headerfilepath, { flags: "w" });
    // headerlogger.write("Kimochii Oniichan <3");
    // headerlogger.close();
}

/** Generates the symbols from data file ParentClassDefinitions.json */
function GenerateSymbols(kit: ClassCreationKit): SymbolData {
    let retval: SymbolData = {
        classname: kit.classname,           // $1
        namespace: "",                      // $2
        apiname: kit.modulename             // $3
    };

    classData.forEach((val) => {
        // if (val.id === kit.parentclass) {
        //     let str = val.classprefix;
        //     retval.namespace = str.replace("$1", kit.classname);
        //     console.log(retval.namespace);
        // }
    });

    return retval;
}
/** Parses the data JSON file and inserts strings where-ever applicable... */
async function ParseAndWrite(filepath: string, data: string[][], symbols: SymbolData) {
    let logger = fs.createWriteStream(filepath, { flags: "w" });
    data.forEach((entry, i) => {
        // If lines are mentioned to be symbol-free...
        if (i % 2 === 0) {
            entry.forEach((line) => {
                logger.write(line + "\n");
            });
        }
        else {
            entry.forEach((line) => {
                line = line.replace("$1", symbols.classname);
                line = line.replace("$2", symbols.namespace);
                line = line.replace("$3", symbols.apiname);
                console.log("new line: ", line);
                logger.write(line + "\n");
            });
        }
    });
    logger.close();
}

/** Checks for spaces and if any files are being overwritten... */
async function ValidateRequest(kit: ClassCreationKit): Promise<boolean> {
    let inValid = /\s/;
    return new Promise<boolean>((resolve, reject) => {
        new Promise<boolean>((resolve, reject) => {
            if (inValid.test(kit.classname) === true) {
                vscode.window.showErrorMessage("Whitespaces not allowed in classnames !");
                resolve(false);
            }

            // Will return true if (.cpp/.h) not found. Prompts/Alerts users otherwise...
            try {
                fs.accessSync(path.join(kit.modulepath, "Public", kit.classname + ".h"));
                vscode.window.showErrorMessage(path.join(kit.modulename, "Public", kit.classname + ".h ") + "will be overwritten !");
                fs.accessSync(path.join(kit.modulepath, "Private", kit.classname + ".cpp"));
                vscode.window.showErrorMessage(path.join(kit.modulename, "Private", kit.classname + ".cpp ") + "will be overwritten !");
                reject(false);
            }
            catch {
                resolve(true);
            }
        }).then((ret) => {
            // IF no syntax errors, resolves to true...
            resolve(ret);
        }, (err) => {
            // Let user decide if current request overwrites files...
            console.log("Reached decision point...");
            let opt: string[] = ["Abort(default)", "I understand that my previous data will be lost."];
            vscode.window.showQuickPick(opt).then((sel) => {
                if (sel === "I understand that my previous data will be lost.") {
                    resolve(true);
                }
                else { resolve(false); }
            });
        });
    });
}


/** Let user select between buildspaces... 
 * This helps us categorize between built-in and user defined builspaces
*/
async function NamespaceSelection(): Promise<ClassCreationKit> {
    let retval: ClassCreationKit = {
        modulepath: "",
        modulename: "",
        parentclass: "",
        classname: "",
        buildspace: "" // set in this function
    };

    let arr: string[] = [];
    let data = classData.concat(extendedClassData);

    data.forEach((val) => {
        arr.push(val.buildspace);
    });
    return new Promise<ClassCreationKit>((resolve, reject) => {
        vscode.window.showQuickPick(arr).then((ret) => {
            if (ret) {
                retval.buildspace = ret;
            }
            else {
                reject("User did not select any namespace");
            }
        }).then(() => {
            resolve(retval);
        });
    });

}

/** Called after module is selected by user to provide class catalogue. */
async function HandleClassSelection(kit: ClassCreationKit): Promise<ClassCreationKit> {
    let marr: string[] = []; // Classes offered
    marr.push("Actor", "Character", "Interface", "ActorComponent", "Object", "DataAsset");

    return new Promise<ClassCreationKit>((resolve, reject) => {
        vscode.window.showQuickPick(marr).then((retval) => {
            if (retval !== "") {
                kit.parentclass = retval!;
            }
            else {
                resolve(kit);
            }
        }).then(() => {
            // After getting parentclass info...
            const input = vscode.window.showInputBox(); // request classname...
            input.then((value) => {
                if (value !== "") {
                    kit.classname = value!;
                    vscode.window.showWarningMessage("Adding "
                        + value + " of type " + kit.parentclass + " in " + kit.modulename
                        + "... Continue ?");
                }
            }).then(() => {
                // After providing information, request acceptance...
                vscode.window.showQuickPick(["Yes", "No"]).then((retval) => {
                    if (retval === "Yes") {
                        console.log(kit.classname, kit.modulename, kit.modulepath, kit.parentclass);
                        resolve(kit);
                    }
                });
            });
            // resolve(kit);
        });
        // resolve(kit);
    });
}

function IsValidModuleName(name: string) {
    if ((name === "Python") ||
        (name === "Shaders") ||
        (false)) { return false; }
    else { return true; }
}