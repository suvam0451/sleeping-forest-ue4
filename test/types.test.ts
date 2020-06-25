export interface PackageJson {
	name: string;
	displayName: string;
	description: string;
	version: string;
	license: string;
	icon: string;
	activationEvents: string[];
	contributes: {
		commands: {
			command: string;
			title: string;
			when?: string;
		}[];
		languages: any;
		grammar: any;
		snippets: {
			language: string;
			path: string;
		}[];
	};
}
