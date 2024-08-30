import * as vscode from "vscode";
import {
	ComponentPropTypes,
	createPropsForComponent,
	createTypeForComponent,
} from "proptype-converter";
import { processDocument } from "./processDocument";
import { PTConverterActionProvider } from "./PTConverterActionProvider";
import { textRangeToRange } from "./utilities";
import { renameFile } from "./files";

const languages = [
	"typescript",
	"javascript",
	"javascriptreact",
	"typescriptreact",
];

function isValidDocumentLanguage(document: vscode.TextDocument) {
	return languages.includes(document.languageId);
}

export function activate(context: vscode.ExtensionContext) {
	console.log("Activating vscode-pt-converter");
	vscode.languages.registerCodeActionsProvider(
		languages.map((language) => ({ scheme: "file", language })),
		new PTConverterActionProvider(),
		{
			providedCodeActionKinds: [vscode.CodeActionKind.RefactorRewrite],
		},
	);

	// Add the just-prop-types conversion
	context.subscriptions.push(
		vscode.commands.registerTextEditorCommand(
			"vscode-pt-converter.convert",
			async (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
				if (!isValidDocumentLanguage(textEditor.document)) {
					vscode.window.showErrorMessage(
						`Cannot check this document for PropTypes: ${textEditor.document.languageId}`,
					);
					return;
				}

				const result = processDocument(textEditor.document);
				if (result && result.size > 0) {
					result.forEach((component, name) => {
						commandEditCallback(component, name, edit, textEditor);

						const props = createPropsForComponent(component);
						if (props && component.parameterRange) {
							edit.replace(
								textRangeToRange(textEditor.document, component.parameterRange),
								`${props}: ${name}Props`,
							);
						}
					});

					renameFile(textEditor.document.uri);
				}
			},
		),
	);

	// Add the convert PropTypes & defaultProps command.
	context.subscriptions.push(
		vscode.commands.registerTextEditorCommand(
			"vscode-pt-converter.convert-dp",
			(textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
				if (!isValidDocumentLanguage(textEditor.document)) {
					vscode.window.showErrorMessage(
						`Cannot check this document for PropTypes: ${textEditor.document.languageId}`,
					);
					return;
				}
				const result = processDocument(textEditor.document);
				if (result && result.size > 0) {
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
								textRangeToRange(textEditor.document, component.parameterRange),
								`${props}: ${name}Props`,
							);
						}
					});

					renameFile(textEditor.document.uri);
				}
				return;
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

// This method is called when your extension is deactivated
export function deactivate() {}
