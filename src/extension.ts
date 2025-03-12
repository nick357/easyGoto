// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import { findFileAndPosition } from './util';

function getProjectPath(document:vscode.TextDocument): string|undefined {
	const projectPath = vscode.workspace?.getWorkspaceFolder(document.uri)?.uri.fsPath;
	return projectPath;
}

async function provideDefinition(document:vscode.TextDocument, position:vscode.Position, token:vscode.CancellationToken) {
    const line        = document.lineAt(position);
    const projectPath = getProjectPath(document);
    if (!projectPath) {
        return;
    }
    if(new RegExp(`@\{`).test(line.text)){
        let rem = line.text.match(/@\{(.+)\}#\{(.+)\/(.+)\}/);
        if(rem === null){
            return;
        }
        // match 返回数组的第一项是完整的句子，后面元素是1-n个分组匹配到的值
        let [searchString, filePathStr, fileName] = rem.slice(1);
        const result = await findFileAndPosition(searchString, filePathStr, fileName, projectPath);
        // console.log(JSON.stringify(result));
        if (!result) {
            return;
        }
        const goto = new vscode.Position(result.line-1, result.column-1);
        const gotoUri = vscode.Uri.file(path.join(projectPath, result.file));
        return new vscode.Location(gotoUri, goto);
    }
}

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.languages.registerDefinitionProvider( { language: '*' }, {
        provideDefinition
    }));

	const disposable2 = vscode.commands.registerCommand('selfdef.copyLink', (document:vscode.TextDocument, position:vscode.Position, token:vscode.CancellationToken) => {
		const editor = vscode.window.activeTextEditor;
        if(editor) {
            // 获取选中文本
            const doc = editor.document;
            const selection = editor.selection;
            // 获取选中内容
            let selectedText = "None";
            if (!selection.isEmpty) {
                selectedText = doc.getText(selection);
            }
            // 路径
            const absolutePath = doc.fileName;
            const projectPath = getProjectPath(doc)||'';
			let relativePath = path.relative(projectPath, absolutePath);

            // 根路径下的目录添加文件名的第一个字符为路径关键字
            if (!relativePath.includes('/')) {
                relativePath = relativePath[0]+'/'+relativePath;
            }

			let goto = `@{${selectedText}}#{${relativePath}}`;
			vscode.env.clipboard.writeText(goto);
        }
	});
	context.subscriptions.push(disposable2);
}

export function deactivate() {}
