// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as ext from "./utils/ExtensionHelper";
import * as edit from "./utils/EditorHelper";
import * as filesys from "./utils/FilesystemHelper";
import * as feedback from "./utils/ErrorLogger";
import { AActor, UActorComponent } from "./data/headerFunctions.json";
import IncludeManager from "./modules/IncludeManager";
import ErrorSearchModule from "./modules/ErrorSearchModule";
import CreateClassModule from "./modules/CreateClassModule";
import InjectExcludeDefinition from "./modules/InjectExclusions";
import * as AssetStream from "./modules/AssetStreamModule";
import * as fs from "fs";
import * as uauto from "./utils/UnrealAutomation";
import InitializerModule from "./modules/InitializerModule";
// import sharp from "sharp";

interface WriteInEditor {
	editor: vscode.TextEditor;
	position: vscode.Position;
	lines: string[];
}

/** Writes lines at current cursor position. */
export function WriteRequest(
	editor: vscode.TextEditor,
	position: vscode.Position,
	lines: string[],
) {
	editor!.edit(editBuilder => {
		lines.forEach(line => {
			editBuilder.insert(position, line + "\n");
		});
	});
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "wan-chai" is now active!');
	//#region extension.helloWorld
	let HelloWorld = vscode.commands.registerCommand("extension.helloWorld", () => {
		let data: filesys.FileData = filesys.GetActiveFileData();
		switch (data.cppvalid) {
			case filesys.ActiveFileExtension.Header: {
				break;
			}
			case filesys.ActiveFileExtension.Header: {
				break;
			}
			default:
				break;
		}
	});
	context.subscriptions.push(HelloWorld);
	//#endregion

	//#region Compiles all shaders, Compiles all blueprints
	let ShaderCompileCommand = vscode.commands.registerCommand("extension.compileShaders", () => {
		uauto.CompileShaders();
		vscode.window.showInformationMessage("Compiling shaders...");
	});
	context.subscriptions.push(ShaderCompileCommand);
	//#endregion

	//#region Compiles all C++ code...
	let CodeCompileCommand = vscode.commands.registerCommand("extension.compileCode", () => {
		uauto.CompileCode();
		vscode.window.showInformationMessage("Compiling Code...");
	});
	context.subscriptions.push(CodeCompileCommand);
	//#endregion

	//#region extension.onConstruction
	let OnConstruction = vscode.commands.registerCommand("extension.onConstruction", () => {
		let data: filesys.FileData = filesys.GetActiveFileData();
		// Get the editor
		let editor = vscode.window.activeTextEditor;
		const position = editor!.selection.active!;

		switch (data.cppvalid) {
			case filesys.ActiveFileExtension.Header: {
				WriteRequest(editor!, position, [AActor.OnConstruction.header]);
				break;
			}
			case filesys.ActiveFileExtension.Source: {
				WriteRequest(editor!, position, [
					"void A" + data.stripped_classname + AActor.OnConstruction.source,
					"{\n\t\n}",
				]);

				var newPosition = position.with(position.line + 1, 1);
				var newSelection = new vscode.Selection(newPosition, newPosition);
				editor!.selection = newSelection;
				break;
			}
			default:
				break;
		}
	});
	context.subscriptions.push(OnConstruction);

	//#endregion

	//#region extension.include.procedural
	let IncludeCommandlet = vscode.commands.registerCommand("extension.includeManager", () => {
		IncludeManager();
	});

	context.subscriptions.push(IncludeCommandlet);
	//#endregion

	//#region
	/** Injects exclusion  */
	let InjectExclusions = vscode.commands.registerCommand(
		"extension.Daedalus.injectExcludes",
		() => {
			InjectExcludeDefinition();
		},
	);

	context.subscriptions.push(InjectExclusions);
	//#endregion

	//#region module:Error search
	let ErrorWiki = vscode.commands.registerCommand("extension.Daedalus.errorLibrary", () => {
		ErrorSearchModule();
	});
	context.subscriptions.push(ErrorWiki);
	//#endregion

	//#region moduele:Class creation
	let Mod_CreateClass = vscode.commands.registerCommand("extension.Daedalus.createClass", () => {
		CreateClassModule().catch(err => {
			console.log("failed: " + err);
		});
	});
	context.subscriptions.push(Mod_CreateClass);
	//#endregion

	let Init_AssetFolder = vscode.commands.registerCommand(
		"extension.Daedalus.initializeAssetFolder",
		() => {
			AssetStream.InitializeStream();
		},
	);
	context.subscriptions.push(Init_AssetFolder);

	let refresh_AssetFolder = vscode.commands.registerCommand(
		"extension.Daedalus.refreshAssetFolders",
		() => {
			AssetStream.RefreshListedStreams();
		},
	);
	context.subscriptions.push(refresh_AssetFolder);

	// #region extension.Daedalus.PopulateSourceFile
	let Daedalus_Populate_Source = vscode.commands.registerCommand(
		"extension.Daedalus.PopulateSourceFile",
		() => {
			let data: filesys.FileData = filesys.GetActiveFileData();
			switch (data.cppvalid) {
				case filesys.ActiveFileExtension.Header: {
					filesys.GetMatchingSource(data).then(
						path => {
							edit.AddFunction(data, AActor.OnConstruction, true);
						},
						(err: feedback.DErrorCode) => {
							feedback.ThrowError(err);
						},
					);
					break;
				}
				case filesys.ActiveFileExtension.Source: {
					filesys.GetMatchingHeader(data).then(
						() => {},
						(err: feedback.DErrorCode) => {
							feedback.ThrowError(err);
						},
					);
					break;
				}
				default:
					break;
			}
		},
	);
	context.subscriptions.push(Daedalus_Populate_Source);
	//#endregion

	let Try_Initialize = vscode.commands.registerCommand("extension.Daedalus.tryInitialize", () => {
		InitializerModule();
	});
	context.subscriptions.push(Try_Initialize);
}

// this method is called when your extension is deactivated
export function deactivate() {}
