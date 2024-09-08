import * as vscode from "vscode";

export function getNewFileName(
	currentUri: vscode.TextDocument["uri"],
): vscode.Uri | null {
	const configuration = vscode.workspace.getConfiguration(
		"vscode-pt-converter",
	);
	const alwaysUseTSX = configuration.get("alwaysRenameToTSX");

	let fileName = currentUri.fsPath;
	if (!alwaysUseTSX) {
		fileName = fileName.replace(/\.j(sx?)$/, ".t$1");
	} else {
		fileName = fileName.replace(/\.j(s)x?$/, ".t$1x");
	}

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
			(error) => {
				console.error(error);
				vscode.window.showErrorMessage("Unable to rename the file");
			},
		);
	}
}
