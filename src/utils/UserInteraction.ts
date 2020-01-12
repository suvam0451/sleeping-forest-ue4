import * as vscode from "vscode";

export interface SelectionStruct {
    data?: any;
    label: string;
    description?: string;
    detail?: string;
}

export function cancel() {
    return new Error("CANCEL");
}

export async function ShowSelectionOptions(items: SelectionStruct[]) : Promise<SelectionStruct>
{
    // Use createQuickPick for advanced use cases...
    let quickPick = await vscode.window.showQuickPick(items);
    return new Promise<SelectionStruct>((resolve, reject) => {
        if (quickPick) {
            return resolve(quickPick);
        }
        else{
            return reject(new Error("CANCEL"));
        }
    });
}