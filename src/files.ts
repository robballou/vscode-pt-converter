import * as vscode from "vscode";

export function getNewFileName(
	currentUri: vscode.TextDocument["uri"],
): vscode.Uri | null {
	const fileName = currentUri.fsPath.replace(/\.j(sx?)$/, ".t$1");
	const newName = vscode.Uri.file(fileName);
	return newName.fsPath !== currentUri.fsPath ? newName : null;
}

export function renameFile(uri: vscode.Uri) {
	const newName = getNewFileName(uri);
	if (newName) {
		vscode.workspace.fs.rename(uri, newName).then(
			() => {
				vscode.window.showInformationMessage("File was renamed to TypeScript");
			},
			() => {
				vscode.window.showErrorMessage("Unable to rename the file");
			},
		);
	}
}
