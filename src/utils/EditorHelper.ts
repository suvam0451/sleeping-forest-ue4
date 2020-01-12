import * as vscode from "vscode";
var XRegExp = require('xregexp');
var path = require("path");
import * as ext from "./ExtensionHelper";

export async function ActiveFileName(editor: vscode.TextEditor) : Promise<string>{
    return new Promise<string>((resolve, reject) => {
        if(editor) {
            // non-null assertion operator
            let FilePath = vscode.window.activeTextEditor?.document.fileName;
            let fileName = path.basename(FilePath);
            resolve(fileName);}
        else{
            reject("Editor is undefined. Are you currently focused on the terminal area ?");
        }
    });
}

export function InjectHeaders(editor: vscode.TextEditor, lines: string[]) : void {
    let LineCount = editor.document.lineCount;
    const position = editor?.selection.active!;
    const headerDefaultRegex = new XRegExp("^#include (.*?).h");
    const headerFileEndRegex = new XRegExp("^#include (.*?).generated.h");
    // const sourceFileEndRegex = new XRegExp("$#include (.*?).h");
    let HeaderRegionStart = -1;
    let HeaderRegionEnd = 10000;

    // Handling a header file...
    if (ext.IsHeaderFile(path.basename(editor.document.fileName))){
        for(let i = 0; i< LineCount; i++) {
            if(headerDefaultRegex.test(editor.document.lineAt(i).text))
            {
                if(HeaderRegionStart === -1) {
                    HeaderRegionStart = i;
                }
                HeaderRegionEnd = i; // Happens always
            }
            if(headerFileEndRegex.test(editor.document.lineAt(i).text)){
                HeaderRegionEnd = i; break;
            }
        }
    }
    if(HeaderRegionEnd !== 10000)
    {
        var newPosition = position.with(HeaderRegionEnd, 0);
		var newSelection = new vscode.Selection(newPosition, newPosition);
		editor!.selection = newSelection;
        WriteRequest(editor, newPosition, lines);
    }
}

/** Writes lines at current cursor position. */
export function WriteRequest(editor: vscode.TextEditor, position: vscode.Position, lines: string[]) {
	editor?.edit(editBuilder => {
		lines.forEach(line => {
			editBuilder.insert(position, line + "\n");
		});
	});
}