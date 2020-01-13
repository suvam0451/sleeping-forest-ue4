// Copyright (c) 2020 Debashish Patra, MPL-2.0

// ExtensionHelperr.ts
// Used to get information about extensions.

var XRegExp = require('xregexp');
import * as vscode from "vscode";

export function IsSourceFile(filename: string): boolean {
    const regex1 = new XRegExp("(.*?).cpp$");
    return regex1.test(filename);
}

export function IsHeaderFile(filename: string): boolean {
    const regex1 = new XRegExp("(.*?).h$");
    return regex1.test(filename);
}