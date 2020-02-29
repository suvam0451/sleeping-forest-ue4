// Copyright (c) 2020 Debashish Patra, MPL-2.0

// ErrorSearchModule.ts
// Isolated module to let users paste their errors and search database for resolution.

import { vsfs } from "@suvam0451/vscode-geass";

export default async function ErrorSearchModule(): Promise<void> {
	let num = vsfs.RegexMatchLine("D:\\Suvam\\gitlab\\downtown\\README.md", /A video game/);
	// .then(retval => {
	// 	console.log(retval);
	// });

	// console.log(num);
	// vscode.env.openExternal(vscode.Uri.parse("https://winterwildfire.netlify.com"));
}
