"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var chai_1 = require("chai");
require("mocha");
// import { PackageJson } from "./types.test";
var package_json_1 = __importDefault(require("../package.json"));
var fs = __importStar(require("fs"));
describe("All snippets added", function () {
    it("should have all files listed in package.json", function () {
        chai_1.expect([1, 2, 3]).to.eql([1, 2, 3]);
    });
    var destArray = [];
    package_json_1["default"].contributes.snippets.forEach(function (snippet) {
        destArray = destArray.concat(snippet.path);
    });
    var arr = listFiles("../snippets");
    console.log(destArray, arr);
});
function listFiles(_path) {
    var retval = [];
    fs.readdir(_path, function (err, files) {
        if (err) {
            return err;
        }
        files.forEach(function (file) {
            retval.concat(file);
        });
        return retval;
    });
    return retval;
}
