import {
	ComponentPropTypes,
	createPropsForComponent,
	createTypeForComponent,
} from "proptype-converter";
import * as vscode from "vscode";
import { getNewFileName } from "./files";
import { textRangeToRange } from "./utilities";
import { processDocument } from "./processDocument";

/**
 * The PropType CodeAction
 */
export class PTConverterActionProvider implements vscode.CodeActionProvider {
	/**
	 * Return the code action to convert just the PropTypes...
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
		const props = createPropsForComponent(value);
		this.addTypeEdits(convertAction.edit, types, value, document);

		// replace the functional components first argument with the new props (and defaults)
		if (props && value.parameterRange) {
			convertAction.edit.replace(
				document.uri,
				textRangeToRange(document, value.parameterRange),
				`${props}: ${key}Props`,
			);
		}

		// rename the file to TS
		const newName = getNewFileName(document.uri);
		if (newName) {
			convertAction.edit.renameFile(document.uri, newName);
		}
		return convertAction;
	}

	/**
	 * Convert both PropTypes and DefaultProps
	 *
	 * Only available when defaultProps have been detected.
	 */
	getConvertPropTypesWithDefaultPropsAction(
		key: string,
		value: ComponentPropTypes,
		document: vscode.TextDocument,
	) {
		if (!value.defaultProps) {
			return null;
		}

		const convertAction = new vscode.CodeAction(
			`Convert PropTypes and defaultProps: ${key}`,
			vscode.CodeActionKind.RefactorRewrite,
		);

		const props = createPropsForComponent(value);
		const types = createTypeForComponent(key, value);
		convertAction.edit = new vscode.WorkspaceEdit();

		// delete the existing .defaultProps
		if (value.defaultPropsRange) {
			convertAction.edit.delete(
				document.uri,
				textRangeToRange(document, value.defaultPropsRange),
			);
		}

		// replace the functional components first argument with the new props (and defaults)
		if (props && value.parameterRange) {
			convertAction.edit.replace(
				document.uri,
				textRangeToRange(document, value.parameterRange),
				`${props}: ${key}Props`,
			);
		}

		this.addTypeEdits(convertAction.edit, types, value, document);

		// rename the file to TS
		const newName = getNewFileName(document.uri);
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
		if (!result || result.size === 0) {
			return [];
		}

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
}
