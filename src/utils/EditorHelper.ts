import * as vscode from "vscode";
var XRegExp = require('xregexp');
var path = require("path");
import * as ext from "./ExtensionHelper";
import { DErrorCode } from "./ErrorLogger";
const fs = require("fs");
import * as filesys from "./FilesystemHelper";
import { AActor, UActorComponent } from "../data/headerFunctions.json";


export interface FunctionDefinition {
    comment: string;
    tutorial: string[];
    header: string;
    source: { prototype: string, returnType: string };
    access: string;
    important: boolean;
}

export async function ActiveFileName(editor: vscode.TextEditor): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        if (editor) {
            // non-null assertion operator
            let FilePath = vscode.window.activeTextEditor?.document.fileName;
            let fileName = path.basename(FilePath);
            resolve(fileName);
        }
        else {
            reject("Editor is undefined. Are you currently focused on the terminal area ?");
        }
    });
}

export function InjectHeaders(editor: vscode.TextEditor, lines: string[]): void {
    const position = editor?.selection.active!;
    const headerDefaultRegex = new XRegExp("^#include (.*?).h");
    const headerFileEndRegex = new XRegExp("^#include (.*?).generated.h");

    const isHeader = ext.IsHeaderFile(path.basename(editor.document.fileName));

    // Handling a header file...
    if (isHeader) {
        let startingLine = GetLineMatchingRegexInActiveFile(headerDefaultRegex);
        let finishingLine = GetLineMatchingRegexInActiveFile(headerFileEndRegex);

        Promise.all([startingLine, finishingLine]).then((values) => {
            var newPosition = position.with(values[1], 0);
            var newSelection = new vscode.Selection(newPosition, newPosition);
            editor!.selection = newSelection;
            WriteRequest(lines);
        });
    }
}

/** Writes lines at current cursor position. */
export function WriteRequest(lines: string[]) {
    let editor = vscode.window.activeTextEditor;
    const position = editor?.selection.active!;
    editor?.edit(editBuilder => {
        lines.forEach(line => {
            editBuilder.insert(position, line + "\n");
        });
    });
}

/** Writes lines at current cursor position. */
// export function WriteRequestSimple() {
// 
// }

export enum UE4_ClassTypes {
    UObject, Actor, Enum, Interface, FStruct
}
/** Appends a function at the end of a source file. */
export function AppendFunctionInFile(filepath: string, body: string[]) {
    fs.appendFile(filepath, body, (err: any) => {
        // if (err) { throw err };
        console.log('Saved!');
    });
}

export function GetLineMatchingRegexInActiveFile(ex: RegExp): Promise<number> {
    let editor = vscode.window.activeTextEditor!;
    let LineCount = editor.document.lineCount;
    return new Promise<number>((resolve, reject) => {
        for (let i = 0; i < LineCount; i++) {
            if (ex.test(editor.document.lineAt(i).text)) {
                resolve(i);
            }
        }
        reject(DErrorCode.HEADER_NOT_FOUND);
    });
}

/** Writes prototypes to both header and function */
export function AddFunction(data: filesys.FileData, func: FunctionDefinition, FromHeader: true) {
    if (FromHeader === true) {
        WriteRequest(["// " + func.comment, func.header]);
        //testing
        // vscode.workspace.saveAll().then(() => {
        //     filesys.WriteAtLine(data.sourcepath, 5, ["jeez", "you are a meanie", "Onii-chan <3"]).then(() => { });
        // });
        vscode.workspace.saveAll().then(() => {
            filesys.WriteFunctionToFile(data.sourcepath, func.source, data.stripped_classname);
        });
    }
}