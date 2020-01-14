import * as vscode from "vscode";
import { resolve } from "dns";

export interface SelectionStruct {
    data?: any;
    label: string;
    description?: string;
    detail?: string;
}

export function cancel() {
    return new Error("CANCEL");
}

export async function ShowSelectionOptions(items: SelectionStruct[]): Promise<SelectionStruct> {

    return new Promise<SelectionStruct>((resolve, reject) => {
        // Use createQuickPick for advanced use cases...
        vscode.window.showQuickPick(items).then((value) => {
            console.log(value?.label);
            resolve(value);
        });
    });
}