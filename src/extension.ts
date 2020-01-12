// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
var path = require("path");
var XRegExp = require('xregexp');
// var str = require('string');
import * as UI from "./utils/UserInteraction";
import * as ext from "./utils/ExtensionHelper";
import * as edit from "./utils/EditorHelper";

interface WriteInEditor {
	editor: vscode.TextEditor;
	position: vscode.Position;
	lines: string[];
}

/** Writes lines at current cursor position. */
export function WriteRequest(editor: vscode.TextEditor, position: vscode.Position, lines: string[]) {
	editor?.edit(editBuilder => {
		lines.forEach(line => {
			editBuilder.insert(position, line + "\n");
		});
	});
}
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "wan-chai" is now active!');

	//#region extension.helloWorld
	let disposable = vscode.commands.registerCommand('extension.helloWorld', () => {
		let arr : UI.SelectionStruct[] = [];
		arr.push({data: "100", label: "oniichan"});
		UI.ShowSelectionOptions(arr);
		vscode.window.showInformationMessage('Hello World!');
	});
	context.subscriptions.push(disposable);

	let ShaderCompileCommand = vscode.commands.registerCommand('extension.compileShaders', () => {
		vscode.window.showInformationMessage('Compiling shaders...');
	});
	context.subscriptions.push(ShaderCompileCommand);
	//#endregion

	//#region extension.onConstruction

	let OnConstruction = vscode.commands.registerCommand('extension.onConstruction', () => {
		// Get the editor
		let editor = vscode.window.activeTextEditor;

		if (editor !== null){
			if(editor?.selection.isEmpty ===false){
				vscode.window.showInformationMessage("No cursor detected. Have you focused console by accident ?");
				return;
			}
			
			// non-null assertion operator
			const position = editor?.selection.active!;
			let FilePath = editor?.document.fileName;
			let fileName = path.basename(FilePath);
			// let fileName :string = "";
			// edit.ActiveFileName(editor!).then((retval) => {fileName = retval;});

			// Handle if file was detected to be a header...
			if(ext.IsSourceFile(fileName)){
				vscode.window.showInformationMessage("Header detected.");
				WriteRequest(editor!, position, ["// Called when an instance of this class is placed (in editor) or spawned.",
													"\tvirtual void OnConstruction(const FTransform &Transform) override;"]);
			}
			else if (ext.IsHeaderFile(fileName)) {
				vscode.window.showInformationMessage("Source detected.");
				let mystr = String(fileName);
				let ActorEquivalent = "A" + String(fileName).substring(0, mystr.length- 4);
				WriteRequest(editor!, position, ["void " + ActorEquivalent + "::OnConstruction(const FTransform &Transform) {",
													"\t\n}"]);
		
				var newPosition = position.with(position.line + 1, 1);
				var newSelection = new vscode.Selection(newPosition, newPosition);
				editor!.selection = newSelection;
			}
		}
		else{
			vscode.window.showInformationMessage('You do not have an active UE4 header/source file focused.');
		}
	});
	context.subscriptions.push(OnConstruction);

	//#endregion

	//#region extension.include.procedural
	let include_Procedural = vscode.commands.registerCommand('extension.include.procedural', () => {
		let editor = vscode.window.activeTextEditor;
		edit.InjectHeaders(editor!, [
			"#include \"Components/InstancedStaticMeshCompoent.h\"",
		]);
	});
	context.subscriptions.push(include_Procedural);
	//#endregion

	//#region extension.include.splines
	let include_Splines = vscode.commands.registerCommand('extension.include.spline', () => {
		let editor = vscode.window.activeTextEditor;
		edit.InjectHeaders(editor!, [
			"#include \"Components/SplineComponent.h\"",
			"#include \"Components/SplineMeshComponent.h\""
		]);
	});
	context.subscriptions.push(include_Splines);
	//#endregion
}

// this method is called when your extension is deactivated
export function deactivate() { }
