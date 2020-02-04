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
import extendedClassData from "../data/extensions/Buildspaces.json";
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

	WriteAtLine(at: number, lines: string[]) {
		console.log("Internal function called");
		fs.open(this.filepath, "w", (err, fd) => {
			if (err) {
				// error not handled
			}
			let buffer = new Buffer("expedia");
			fs.writeSync(fd, buffer, at, buffer.length, 10);
			// fs.write(fd, buffer, at, buffer.length, null, (err) => {
			//     if (err) {
			//         // error not handled
			//     }
			//     fs.close(fd, () => {
			//         // success
			//     });
			// });
		});
	}
}
