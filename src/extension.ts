// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { createTypeForComponent } from "proptype-converter";
import { processDocument } from "./processDocument";

class PTConverterActionProvider implements vscode.CodeActionProvider {
	provideCodeActions(
		document: vscode.TextDocument,
		range: vscode.Range | vscode.Selection,
		context: vscode.CodeActionContext,
		token: vscode.CancellationToken,
	): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
		if (context.triggerKind !== vscode.CodeActionTriggerKind.Invoke) {
			return [];
		}

		const result = processDocument(document);
		if (result && result.size > 0) {
			const actions: vscode.ProviderResult<vscode.CodeAction[]> = [];
			result.forEach((value, key) => {
				const convertAction = new vscode.CodeAction(
					`Convert PropTypes: ${key}`,
					vscode.CodeActionKind.RefactorRewrite,
				);
				convertAction.edit = new vscode.WorkspaceEdit();
				const types = createTypeForComponent(key, value);

				// if we identified the component, we can put the type above it
				if (value.componentRange) {
					convertAction.edit.delete(
						document.uri,
						textRangeToRange(document, value.range),
					);
					convertAction.edit.insert(
						document.uri,
						document.positionAt(value.componentRange[0]),
						`${types}\n\n`,
					);
				} else {
					convertAction.edit.replace(
						document.uri,
						textRangeToRange(document, value.range),
						types,
					);
				}
				actions.push(convertAction);
			});
			return actions;
		}

		return [];
	}
}

export function activate(context: vscode.ExtensionContext) {
	vscode.languages.registerCodeActionsProvider(
		[
			{ scheme: "file", language: "typescript" },
			{ scheme: "file", language: "javascript" },
		],
		new PTConverterActionProvider(),
		{
			providedCodeActionKinds: [vscode.CodeActionKind.RefactorRewrite],
		},
	);

	context.subscriptions.push(
		vscode.commands.registerTextEditorCommand(
			"vscode-pt-converter.convert",
			(textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
				const validDocumentTypes = ["javascript", "typescript"];
				if (validDocumentTypes.includes(textEditor.document.languageId)) {
					const result = processDocument(textEditor.document);
					if (result && result.size > 0) {
						textEditor.edit((edit) => {
							result.forEach((component, name) => {
								const typeText = createTypeForComponent(name, component);
								if (component.componentRange) {
									edit.delete(
										textRangeToRange(textEditor.document, component.range),
									);
									edit.insert(
										textEditor.document.positionAt(component.componentRange[0]),
										`${typeText}\n\n`,
									);
								} else {
									edit.replace(
										textRangeToRange(textEditor.document, component.range),
										typeText,
									);
								}
							});
						});
					}
					return;
				}

				vscode.window.showErrorMessage(
					`Cannot check this document for PropTypes: ${textEditor.document.languageId}`,
				);
			},
		),
	);
}

function textRangeToRange(
	document: vscode.TextDocument,
	textRange: [number, number],
) {
	return new vscode.Range(
		document.positionAt(textRange[0]),
		document.positionAt(textRange[1]),
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
