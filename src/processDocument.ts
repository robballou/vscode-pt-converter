import * as vscode from "vscode";
import * as ts from "typescript";
import { processSourceFile } from "proptype-converter";

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

	const configuration = vscode.workspace.getConfiguration(
		"vscode-pt-converter",
	);

	return processSourceFile(sourceFile, {
		includeUnknownFunctionArgumentProps: configuration.get(
			"includeUnknownFunctionArgumentProps",
		),
	});
}
