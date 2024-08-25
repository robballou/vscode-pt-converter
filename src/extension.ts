// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import {
	ComponentPropTypes,
	createPropsForComponent,
	createTypeForComponent,
} from "proptype-converter";
import { processDocument } from "./processDocument";

class PTConverterActionProvider implements vscode.CodeActionProvider {
	/**
	 * Return the code action to convert just the proptypes...
	 */
	getConvertPropTypesAction(
		key: string,
		value: ComponentPropTypes,
		document: vscode.TextDocument,
	) {
		const convertAction = new vscode.CodeAction(
			`Convert PropTypes: ${key}`,
			vscode.CodeActionKind.RefactorRewrite,
		);
		convertAction.edit = new vscode.WorkspaceEdit();
		const types = createTypeForComponent(key, value);
		this.addTypeEdits(convertAction.edit, types, value, document);

		// rename the file to TS
		const newName = this.getNewFileName(document.uri);
		if (newName) {
			convertAction.edit.renameFile(document.uri, newName);
		}
		return convertAction;
	}

	getConvertPropTypesWithDefaultPropsAction(
		key: string,
		value: ComponentPropTypes,
		document: vscode.TextDocument,
	) {
		if (!value.defaultProps) {
			return null;
		}

		const props = createPropsForComponent(value);
		if (!props) {
			return null;
		}

		const convertAction = new vscode.CodeAction(
			`Convert PropTypes and defaultProps: ${key}`,
			vscode.CodeActionKind.RefactorRewrite,
		);
		convertAction.edit = new vscode.WorkspaceEdit();
		const types = createTypeForComponent(key, value);

		// delete the existing .defaultProps
		if (value.defaultPropsRange) {
			convertAction.edit.delete(
				document.uri,
				textRangeToRange(document, value.defaultPropsRange),
			);
		}

		// replace the functional components first argument with the new props (and defaults)
		if (value.parameterRange) {
			convertAction.edit.replace(
				document.uri,
				textRangeToRange(document, value.parameterRange),
				`${props}: ${key}Props`,
			);
		}

		this.addTypeEdits(convertAction.edit, types, value, document);

		const newName = this.getNewFileName(document.uri);
		if (newName) {
			convertAction.edit.renameFile(document.uri, newName);
		}
		return convertAction;
	}

	addTypeEdits(
		edit: vscode.WorkspaceEdit,
		types: string,
		value: ComponentPropTypes,
		document: vscode.TextDocument,
	) {
		// if we identified the component, we can put the type above it
		if (value.componentRange) {
			edit.delete(document.uri, textRangeToRange(document, value.range));
			edit.insert(
				document.uri,
				document.positionAt(value.componentRange[0]),
				`${types}\n\n`,
			);
		} else {
			edit.replace(
				document.uri,
				textRangeToRange(document, value.range),
				types,
			);
		}
	}

	getNewFileName(currentUri: vscode.TextDocument["uri"]): vscode.Uri | null {
		const fileName = currentUri.fsPath.replace(/\.j(sx?)$/, ".t$1");
		const newName = vscode.Uri.file(fileName);
		return newName.fsPath !== currentUri.fsPath ? newName : null;
	}

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
				const convertAction = this.getConvertPropTypesAction(
					key,
					value,
					document,
				);
				actions.push(convertAction);

				const convertWithDefaultPropsAction =
					this.getConvertPropTypesWithDefaultPropsAction(key, value, document);
				if (convertWithDefaultPropsAction) {
					actions.push(convertWithDefaultPropsAction);
				}
			});
			return actions;
		}

		return [];
	}
}

const languages = [
	"typescript",
	"javascript",
	"javascriptreact",
	"typescriptreact",
];

export function activate(context: vscode.ExtensionContext) {
	console.log("Activating vscode-pt-converter");
	vscode.languages.registerCodeActionsProvider(
		languages.map((language) => ({ scheme: "file", language })),
		new PTConverterActionProvider(),
		{
			providedCodeActionKinds: [vscode.CodeActionKind.RefactorRewrite],
		},
	);

	context.subscriptions.push(
		vscode.commands.registerTextEditorCommand(
			"vscode-pt-converter.convert",
			(textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
				if (languages.includes(textEditor.document.languageId)) {
					const result = processDocument(textEditor.document);
					if (result && result.size > 0) {
						textEditor.edit((edit) => {
							result.forEach((component, name) => {
								commandEditCallback(component, name, edit, textEditor);
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

	context.subscriptions.push(
		vscode.commands.registerTextEditorCommand(
			"vscode-pt-converter.convert-dp",
			(textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
				if (languages.includes(textEditor.document.languageId)) {
					const result = processDocument(textEditor.document);
					if (result && result.size > 0) {
						textEditor.edit((edit) => {
							result.forEach((component, name) => {
								commandEditCallback(component, name, edit, textEditor);

								if (component.defaultProps && component.defaultPropsRange) {
									edit.delete(
										textRangeToRange(
											textEditor.document,
											component.defaultPropsRange,
										),
									);
								}

								const props = createPropsForComponent(component);
								if (props && component.parameterRange) {
									edit.replace(
										textRangeToRange(
											textEditor.document,
											component.parameterRange,
										),
										`${props}: ${name}Props`,
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

function commandEditCallback(
	component: ComponentPropTypes,
	name: string,
	edit: vscode.TextEditorEdit,
	textEditor: vscode.TextEditor,
) {
	const typeText = createTypeForComponent(name, component);
	if (component.componentRange) {
		edit.delete(textRangeToRange(textEditor.document, component.range));
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
