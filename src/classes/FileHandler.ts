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
// Header/Source file generation data...
import Default_Actor_h from "../data/generators/Default_Actor_h.json";
import { rejects } from "assert";
// import { InjectHeaders } from "../utils/EditorHelper";
import { InjectHeaders } from "../utils/FileHelper";
import * as _ from "lodash";
import { WriteAtLine } from "../utils/FilesystemHelper";

export default class FileHandler {
	filepath: string;

	constructor(path: string) {
		this.filepath = path;
	}
}
