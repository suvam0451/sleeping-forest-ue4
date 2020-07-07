import vscode from "vscode";
import IncludeManager from "./modules/IncludeManager";
import CreateClassModule from "./modules/ClassGenerator";
import InjectExcludeDefinition from "./modules/InjectExclusions";
import { RefreshListedStreams, InitializeStream, CopyBinaries } from "./modules/AssetStreamModule";
import { CompileShaders, CompileCode } from "./utils/UnrealAutomation";
import InitializerModule from "./modules/InitializerModule";
import { AddOverrideFunction } from "./modules/AddOverrideFunction";
import RefactorAPI from "./modules/RefactorAPI";
import os from "os";
import UE4_HLSL_exporter from "./modules/HLSLParser";
import { vsui } from "vscode-geass";

type SubscriptionMap = {
	donemsg?: string;
	path: string;
	fn: () => Promise<void>;
};

// entry point
export function activate(context: vscode.ExtensionContext) {
	// cs --> critstrike project	  (GO)
	// sf --> sleeping forest project (TS)
	let subscriptionMap: SubscriptionMap[] = [
		{ path: "extension.cs.ParseHLSLForUE4", fn: UE4_HLSL_exporter },
		{ path: "extension.sf.includeManager", fn: IncludeManager },
		{ path: "extension.sf.injectExcludes", fn: InjectExcludeDefinition },
		{ path: "extension.sf.tryInitialize", fn: InitializerModule },
		{ path: "extension.sf.addOverride", fn: AddOverrideFunction },
		{ path: "extension.sf.RefactorAPI", fn: RefactorAPI },
		{ path: "extension.sf.refreshAssetFolders", fn: RefreshListedStreams },
		{ path: "extension.sf.compileShaders", fn: CompileShaders },
		{ path: "extension.sf.compileCode", fn: CompileCode },
		{ path: "extension.sf.createClass", fn: CreateClassModule },
	];

	let _subscriptions = subscriptionMap.map((ret) => {
		return vscode.commands.registerCommand(ret.path, () => {
			ret.fn().then(
				() => {
					ret.donemsg ? vsui.Info(ret.donemsg) : true;
				},
				(err) => {
					vsui.Error(err);
				},
			);
		});
	});

	context.subscriptions.push(
		vscode.commands.registerCommand("extension.sf.initializeAssetFolder", () => {
			InitializeStream().then((ret) => {
				CopyBinaries(os.type(), ret);
			});
		}),
	);

	context.subscriptions.push(..._subscriptions);
	console.log('Congratulations, your extension "sleeping-forest" is now active!');
}

// this method is called when your extension is deactivated
export function deactivate() {}
