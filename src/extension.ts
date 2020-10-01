import * as vscode from 'vscode';


const enum EProjects {
	automationApi = 'automation-api',
	automationPj = 'automation-pj',
	automationStore = 'automation-store'
};

export function activate(context: vscode.ExtensionContext) {
	let runTagDev = vscode.commands.registerCommand('liv-tag-runner.runTagDev', (item) => {
		executeCommand('DEV', item.path);
	});
	context.subscriptions.push(runTagDev);

	let runTagUAT = vscode.commands.registerCommand('liv-tag-runner.runTagUAT', (item) => {
		executeCommand('UAT', item.path);
	});
	context.subscriptions.push(runTagUAT);
}

/**
 * Executes the command.
 * @param environment Env selected from the user.
 * @param path Path of the lite where the command was activated.
 */
function executeCommand(environment: string, path: string) {
	const textEditor = vscode.window.activeTextEditor;
	const tag = textEditor?.document.getText(textEditor?.selection) as string;
	const projectName = checkProject(path);
	const terminal = getActiveTerminal();
	if (validateTag(tag)) {
			terminal?.show(true);
		if (projectName === EProjects.automationApi) {
			terminal?.sendText(`cucumber -t ${tag} -p ${environment === 'UAT' ? 'local' : 'dev'}`);
		} else if (projectName === EProjects.automationPj) {
			terminal?.sendText(`cucumber -t ${tag} -p ${environment === 'UAT' ? 'lpp' : 'lpp -p dev'}`);
		} else if (projectName === EProjects.automationStore) {
			terminal?.sendText(`cucumber -t ${tag} -p ${environment === 'UAT' ? 'pts' : 'pts -p dev'}`);
		}
	}
}

/**
 * Checks if the givin string is a valid tag.
 * @param tag Tag selected by the user.
 */
function validateTag(tag: string): boolean {
	if (tag.indexOf('@') > -1) {
		return true;
	} else {
		vscode.window.showWarningMessage('Texto selecionado não é uma tag válida!');
		return false;
	}
}

/**
 * Checks the project to run the correct cmd parameter.
 * @param path Path of the lite where the command was activated.
 */
function checkProject(path: string): string {
	const foldersName = path.split('/');
	const projects = [
		'automation-api',
		'automation-pj',
		'automation-store'
	];
	const projectName = foldersName.find(folderName => {
		const result = projects.find(project => {
			return project === folderName ? project : false;
		});
		return result ? result : false;
	}) as string;
	return projectName;
}

/**
 * Creates a new terminal or fetches the activated terminal.
 * @returns vscode.Terminal
 */
function getActiveTerminal(): vscode.Terminal {
	const occActionsTerminalName = "LTR actions";
	let occActiveTerminal = vscode.window.terminals.find((activeTerm) => {
		return activeTerm.name === occActionsTerminalName ? activeTerm : false;
	});
	if (occActiveTerminal?.creationOptions.name === occActionsTerminalName) {
		return occActiveTerminal;
	} else { return vscode.window.createTerminal(occActionsTerminalName); }
}

// this method is called when your extension is deactivated
export function deactivate() { }
