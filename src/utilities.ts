import * as vscode from "vscode";
export function textRangeToRange(
	document: vscode.TextDocument,
	textRange: [number, number],
) {
	return new vscode.Range(
		document.positionAt(textRange[0]),
		document.positionAt(textRange[1]),
	);
}
