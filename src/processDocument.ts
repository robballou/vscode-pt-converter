import * as vscode from "vscode";
import * as ts from "typescript";
import { processSourceFile } from "./propTypeConverter";

export function processDocument(document: vscode.TextDocument) {
	const sourceFile = ts.createSourceFile(
		document.fileName,
		document.getText(),
		ts.ScriptTarget.ES2015,
		true,
	);

	if (!sourceFile) {
		return null;
	}

	return processSourceFile(sourceFile);
}
