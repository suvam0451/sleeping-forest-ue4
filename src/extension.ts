// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import IncludeManager from "./modules/IncludeManager";
import ErrorSearchModule from "./modules/ErrorSearchModule";
import CreateClassModule from "./modules/CreateClassModule";
import InjectExcludeDefinition from "./modules/InjectExclusions";
import * as AssetStream from "./modules/AssetStreamModule";
import * as uauto from "./utils/UnrealAutomation";
import InitializerModule from "./modules/InitializerModule";
import { AddOverrideFunction } from "./modules/AddOverrideFunction";
import os from "os";

// entry point
export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "wan-chai" is now active!');

	//#region Compiles all shaders, Compiles all blueprints
	let ShaderCompileCommand = vscode.commands.registerCommand("extension.sf.compileShaders", () => {
		uauto.CompileShaders();
		vscode.window.showInformationMessage("Compiling shaders...");
	});
	context.subscriptions.push(ShaderCompileCommand);
	//#endregion

	//#region Compiles all C++ code...
	let CodeCompileCommand = vscode.commands.registerCommand("extension.sf.compileCode", () => {
		uauto.CompileCode();
		vscode.window.showInformationMessage("Compiling Code...");
	});
	context.subscriptions.push(CodeCompileCommand);
	//#endregion

	//#region extension.include.procedural
	let IncludeCommandlet = vscode.commands.registerCommand("extension.sf.includeManager", () => {
		IncludeManager();
	});

	context.subscriptions.push(IncludeCommandlet);
	//#endregion

	//#region
	/** Injects exclusion  */
	let InjectExclusions = vscode.commands.registerCommand("extension.sf.injectExcludes", () => {
		InjectExcludeDefinition();
	});

	context.subscriptions.push(InjectExclusions);
	//#endregion

	//#region module:Error search
	let ErrorWiki = vscode.commands.registerCommand("extension.sf.errorLibrary", () => {
		ErrorSearchModule();
	});
	context.subscriptions.push(ErrorWiki);
	//#endregion

	//#region moduele:Class creation
	let CreateClass = vscode.commands.registerCommand("extension.sf.createClass", () => {
		CreateClassModule().catch(err => {
			console.log("failed: " + err);
		});
	});
	context.subscriptions.push(CreateClass);
	//#endregion

	let InitializeAssetFolder = vscode.commands.registerCommand(
		"extension.sf.initializeAssetFolder",
		() => {
			AssetStream.InitializeStream().then(ret => {
				AssetStream.CopyBinaries(os.type(), ret);
			});
		},
	);
	context.subscriptions.push(InitializeAssetFolder);

	let RefreshAssetFolder = vscode.commands.registerCommand(
		"extension.sf.refreshAssetFolders",
		() => {
			AssetStream.RefreshListedStreams();
		},
	);
	context.subscriptions.push(RefreshAssetFolder);

	let TryInitialize = vscode.commands.registerCommand("extension.sf.tryInitialize", () => {
		InitializerModule();
	});
	context.subscriptions.push(TryInitialize);

	let AddOverride = vscode.commands.registerCommand("extension.sf.addOverride", () => {
		AddOverrideFunction();
	});
	context.subscriptions.push(AddOverride);
}

// this method is called when your extension is deactivated
export function deactivate() {}
