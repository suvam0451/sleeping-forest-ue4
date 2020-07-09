// Copyright (c) 2020 Debashish Patra, MPL-2.0

// IncludeManager.ts
// Isolated module to let users paste their errors and search database for resolution.

import vscode from "vscode";
import path from "path";
import _ from "lodash";
import os from "os";
import * as filesys from "../utils/FilesystemHelper";
import { vscfg, vsui, vsed, vsutil } from "vscode-geass";

const _UE4PythonAPIOutputPath = "data/extensions/UE4PythonAPI.py";

/** Transpiles .usf/.ush files with critstrike conformant metadata to .py file using UE4 pythonAPI.
 *  This allows hassle-free mass material importing.
 *  Most importantly, we have to make sure the aliaspath is correctly configured by the user.
 */
export default async function UE4_HLSL_exporter(): Promise<void> {
	let _binpath = Critstrike_BinPath();
	let ex = /.us[fh]$/;
	let _outfile = vscfg.GetVSConfig<string>("SF", "UE4PythonAPIOutputFile");
	let _aliaspath = vscfg.GetVSConfig<string>("SF", "ShaderSourceDirectoryMapping");

	let _filepath = vscode.window.activeTextEditor.document.uri.fsPath;
	let _pyapi = filesys.RelativeToAbsolute("suvam0451.sleeping-forest-ue4", _UE4PythonAPIOutputPath);

	if (_outfile != "") {
		_pyapi = _outfile;
	}
	if (ex.test(_filepath)) {
		RunTerminal(_binpath + " usftools -i " + _filepath + " -o " + _pyapi + " -a " + _aliaspath);
	} else {
		vsui.Warning("Run this command from a .usf/.ush file.");
	}
}

/** Try not to create more terminals.
 *  It would have a noticeable lag. Instead prompt user to open a separate terminal.
 */
function RunTerminal(command: string) {
	let term = vscode.window.activeTerminal;
	term.sendText(command);
}

function Critstrike_BinPath() {
	let _binpath = "";
	let _extdir = vscode.extensions.getExtension("suvam0451.sleeping-forest-ue4").extensionPath;
	switch (os.type()) {
		case "Linux": {
			_binpath = "bin/linux";
			break;
		}
		case "Darwin": {
			_binpath = "bin/macos";
			break;
		}
		case "Windows_NT": {
			_binpath = "bin/win64/critstrike.exe";
			break;
		}
		default:
			break;
	}
	return path.join(_extdir, _binpath);
}
