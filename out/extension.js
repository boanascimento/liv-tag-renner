"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const os = require("os");
const fs = require("fs");
const ltrSettingPath = os.platform() === "darwin"
    ? "/app/ltrSettings.json"
    : "\\app\\ltrSettings.json";
function activate(context) {
    const runTagDev = vscode.commands.registerCommand("liv-tag-runner.runTagDev", (item) => {
        executeCommand("DEV", item.path);
    });
    context.subscriptions.push(runTagDev);
    const runTagUAT = vscode.commands.registerCommand("liv-tag-runner.runTagUAT", (item) => {
        executeCommand("UAT", item.path);
    });
    context.subscriptions.push(runTagUAT);
    const runAppTagIOS = vscode.commands.registerCommand("liv-tag-runner.runAppTagIOS", (item) => {
        executeAppCommand(item.path, "ios" /* EPlatform.ios */);
    });
    context.subscriptions.push(runAppTagIOS);
    const runAppTagAndroid = vscode.commands.registerCommand("liv-tag-runner.runAppTagAndroid", (item) => {
        executeAppCommand(item.path, "android" /* EPlatform.android */);
    });
    context.subscriptions.push(runAppTagAndroid);
    const runAppTagAndroidOnFarm = vscode.commands.registerCommand("liv-tag-runner.runAppTagAndroidOnFarm", (item) => {
        executeAppCommand(item.path, "android" /* EPlatform.android */, true);
    });
    context.subscriptions.push(runAppTagAndroidOnFarm);
    const runAppTagIosOnFarm = vscode.commands.registerCommand("liv-tag-runner.runAppTagIosOnFarm", (item) => {
        executeAppCommand(item.path, "android" /* EPlatform.android */, true);
    });
    context.subscriptions.push(runAppTagIosOnFarm);
    context.subscriptions.push(lrtPrepare);
}
exports.activate = activate;
/**
 * Executes the command.
 * @param environment Env selected from the user.
 * @param path Path of the lite where the command was activated.
 */
function executeCommand(environment, path) {
    const textEditor = vscode.window.activeTextEditor;
    const tag = textEditor === null || textEditor === void 0 ? void 0 : textEditor.document.getText(textEditor === null || textEditor === void 0 ? void 0 : textEditor.selection);
    const projectName = checkProject(path);
    const terminal = getActiveTerminal();
    if (validateTag(tag)) {
        terminal === null || terminal === void 0 ? void 0 : terminal.show(true);
        if (projectName === "automation-api" /* EProjects.automationApi */) {
            terminal === null || terminal === void 0 ? void 0 : terminal.sendText(`cucumber -t ${tag} -p ${environment === "UAT" ? "local" : "dev"}`);
        }
        else if (projectName === "automation-pj" /* EProjects.automationPj */) {
            terminal === null || terminal === void 0 ? void 0 : terminal.sendText(`cucumber -t ${tag} -p ${environment === "UAT" ? "lpp" : "lpp -p dev"}`);
        }
        else if (projectName === "automation-store" /* EProjects.automationStore */) {
            terminal === null || terminal === void 0 ? void 0 : terminal.sendText(`cucumber -t ${tag} -p ${environment === "UAT" ? "" : " dev"}`);
        }
    }
}
/**
 * Executes the command.
 * @param path Path of the lite where the command was activated.
 * @param platform Platform wich be executed the tag.
 */
function executeAppCommand(path, platform, isOnFarm) {
    const textEditor = vscode.window.activeTextEditor;
    const selectedTag = textEditor === null || textEditor === void 0 ? void 0 : textEditor.document.getText(textEditor === null || textEditor === void 0 ? void 0 : textEditor.selection);
    const tag = selectedTag.trim().includes('@') ? selectedTag : `@${selectedTag}`;
    const projectName = checkProject(path);
    const terminal = getActiveTerminal();
    const settings = getLtrSettingFile();
    if (validateTag(tag)) {
        terminal === null || terminal === void 0 ? void 0 : terminal.show(true);
        if (projectName === "automation-app" /* EProjects.automationApp */) {
            const artefactNumber = settings.artefactReleaseIdFor[platform];
            if (isOnFarm) {
                const deviceInfo = settings.devicefarmIdFor[platform];
                const releaseType = settings.releaseType;
                terminal === null || terminal === void 0 ? void 0 : terminal.sendText(`rake run_tests'[,,${tag},,dynamic_type,labmobile,${platform},${deviceInfo},real,${artefactNumber},${releaseType}]'
			`);
            }
            else {
                terminal === null || terminal === void 0 ? void 0 : terminal.sendText(`rake run_${platform}\\[${tag},${artefactNumber},1,\\]`);
            }
        }
    }
}
/**
 * Checks if the givin string is a valid tag.
 * @param tag Tag selected by the user.
 */
function validateTag(tag) {
    if (tag.indexOf("@") > -1) {
        return true;
    }
    else {
        vscode.window.showWarningMessage("Texto selecionado não é uma tag válida!");
        return false;
    }
}
/**
 * Checks the project to run the correct cmd parameter.
 * @param path Path of the lite where the command was activated.
 */
function checkProject(path) {
    const foldersName = path.split("/");
    const projects = [
        "automation-api",
        "automation-app",
        "automation-pj",
        "automation-store",
    ];
    const projectName = foldersName.find((folderName) => {
        const result = projects.find((project) => {
            return project === folderName ? project : false;
        });
        return result ? result : false;
    });
    return projectName;
}
/**
 * Creates a new terminal or fetches the activated terminal.
 * @returns vscode.Terminal
 */
function getActiveTerminal() {
    const occActionsTerminalName = "LTR actions";
    let occActiveTerminal = vscode.window.terminals.find((activeTerm) => {
        return activeTerm.name === occActionsTerminalName ? activeTerm : false;
    });
    if ((occActiveTerminal === null || occActiveTerminal === void 0 ? void 0 : occActiveTerminal.creationOptions.name) === occActionsTerminalName) {
        return occActiveTerminal;
    }
    else {
        return vscode.window.createTerminal(occActionsTerminalName);
    }
}
/**
 * Creates ltrSettings file
 */
const lrtPrepare = vscode.commands.registerCommand("liv-tag-runner.lrtPrepare", (_item) => {
    var _a;
    const _workspace = vscode.workspace.workspaceFolders[0];
    const fsPath = _workspace.uri.fsPath;
    const wsedit = new vscode.WorkspaceEdit();
    const filePath = vscode.Uri.file(fsPath + "/app/ltrSettings.json");
    const setting = getLtrSettingFile();
    if ((_a = setting === null || setting === void 0 ? void 0 : setting.artefactReleaseIdFor) === null || _a === void 0 ? void 0 : _a.android) {
        vscode.window.showWarningMessage('Arquivo "ltrSettings.json" já existe!');
    }
    else {
        const value = {
            artefactReleaseIdFor: {
                ios: "12345",
                android: "12345",
            },
            devicefarmIdFor: {
                android: "1",
                ios: "1",
            },
            releaseType: "squad_release",
        };
        const textEdit = new vscode.TextEdit(new vscode.Range(1, 1, 1, 1), JSON.stringify(value));
        wsedit.createFile(filePath, { ignoreIfExists: true, overwrite: true });
        wsedit.set(filePath, [textEdit]);
        vscode.workspace.applyEdit(wsedit);
        vscode.window.showInformationMessage('Arquivo "ltrSettings.json" criado!');
    }
});
/**
 * Gets `lrtSetting.json` file data.
 */
function getLtrSettingFile() {
    try {
        const _workspace = vscode.workspace.workspaceFolders[0];
        const data = fs.readFileSync(_workspace.uri.fsPath + ltrSettingPath);
        return JSON.parse(data.toString());
    }
    catch (error) {
        return JSON.parse("{}");
    }
}
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map