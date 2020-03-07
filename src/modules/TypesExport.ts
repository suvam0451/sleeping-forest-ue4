export interface ClassCreationKit {
	modulepath: string;
	modulename: string;
	classprefix: string;
	parentclass: string;
	classname: string;
	buildspace: string;
	isGameModule: boolean;
	headerpath: string;
	sourcepath: string;
}

export interface PluginPathInfo {
	foldername: string;
	folderpath: string;
	isGameModule: boolean;
}
