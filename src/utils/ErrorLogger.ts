// Copyright (c) 2020 Debashish Patra, MPL-2.0

// ErrorLogger.ts
// Used to show information/warning/error messages as pop-ups.

import { vsui } from "@suvam0451/vscode-geass";

export enum DErrorCode {
	HEADER_NOT_FOUND,
	SOURCE_NOT_FOUND,
	FILE_NOT_FOUND,
	NO_ACTIVE_DOCUMENT,
	HEADER_NOT_CONFORMANT,
}
export function ThrowError(err: DErrorCode) {
	switch (err) {
		case DErrorCode.FILE_NOT_FOUND: {
			break;
		}
		case DErrorCode.NO_ACTIVE_DOCUMENT: {
			vsui.Info(
				"It seems your cursor might be in the terminal or sidebars. \
                You need to be focused on a .h/.cpp document to run this.",
			);
			break;
		}
		case DErrorCode.HEADER_NOT_FOUND: {
			vsui.Info("Could not detect the paired source file.");
			break;
		}
		case DErrorCode.HEADER_NOT_FOUND: {
			vsui.Info("Could not detect the paired header file.");
			break;
		}
		case DErrorCode.HEADER_NOT_CONFORMANT: {
			vsui.Info("This file(header) doesn't seem to be UE4 syntax conformant.");
			break;
		}
		default:
			break;
	}
}
