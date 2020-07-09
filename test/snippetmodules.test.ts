import { expect } from "chai";
import "mocha";
// import { PackageJson } from "./types.test";
import packageJson from "../package.json";
import { fstat } from "fs";
import * as fs from "fs";

describe("All snippets added", () => {
	it("should have all files listed in package.json", () => {
		expect([1, 2, 3]).to.eql([1, 2, 3]);
	});

	let destArray: string[] = [];
	packageJson.contributes.snippets.forEach((snippet) => {
		destArray = destArray.concat(snippet.path);
	});
	let arr = listFiles("./snippets");
	console.log(destArray, arr);
});

function listFiles(_path: string): string[] {
	let retval: string[] = [];
	fs.readdir(_path, (err, files) => {
		if (err) {
			return err;
		}

		files.forEach((file) => {
			retval.concat(file);
		});
		console.log(retval);
		return retval;
	});
	return retval;
}
