// Copyright (c) 2020 Debashish Patra, MPL-2.0

// ErrorSearchModule.ts
// Isolated module to let users paste their errors and search database for resolution.

import * as vscode from "vscode";
import { resolve } from "dns";
import * as edit from "../utils/EditorHelper";
import data from "../data/IncludeMapping.json";

export default async function ErrorSearchModule(): Promise<void> {
    vscode.env.openExternal(vscode.Uri.parse('https://winterwildfire.netlify.com'));
}