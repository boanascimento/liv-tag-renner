import * as vscode from "vscode";
import { EPlatform, EProjects } from "./enums";
import { ILTRSettings, Platform } from "./types";
import * as os from "os";
import * as fs from "fs";

const ltrSettingPath =
  os.platform() === "darwin"
    ? "/app/ltrSettings.json"
    : "\\app\\ltrSettings.json";

export function activate(context: vscode.ExtensionContext) {
  const runTagDev = vscode.commands.registerCommand(
    "liv-tag-runner.runTagDev",
    (item) => {
      executeCommand("DEV", item.path);
    }
  );
  context.subscriptions.push(runTagDev);

  const runTagUAT = vscode.commands.registerCommand(
    "liv-tag-runner.runTagUAT",
    (item) => {
      executeCommand("UAT", item.path);
    }
  );
  context.subscriptions.push(runTagUAT);

  const runAppTagIOS = vscode.commands.registerCommand(
    "liv-tag-runner.runAppTagIOS",
    (item) => {
      executeAppCommand(item.path, EPlatform.ios);
    }
  );
  context.subscriptions.push(runAppTagIOS);

  const runAppTagAndroid = vscode.commands.registerCommand(
    "liv-tag-runner.runAppTagAndroid",
    (item) => {
      executeAppCommand(item.path, EPlatform.android);
    }
  );
  context.subscriptions.push(runAppTagAndroid);

  const runAppTagAndroidOnFarm = vscode.commands.registerCommand(
    "liv-tag-runner.runAppTagAndroidOnFarm",
    (item) => {
      executeAppCommand(item.path, EPlatform.android, true);
    }
  );
  context.subscriptions.push(runAppTagAndroidOnFarm);

  const runAppTagIosOnFarm = vscode.commands.registerCommand(
    "liv-tag-runner.runAppTagIosOnFarm",
    (item) => {
      executeAppCommand(item.path, EPlatform.android, true);
    }
  );
  context.subscriptions.push(runAppTagIosOnFarm);

  context.subscriptions.push(lrtPrepare);
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
      terminal?.sendText(
        `cucumber -t ${tag} -p ${environment === "UAT" ? "local" : "dev"}`
      );
    } else if (projectName === EProjects.automationPj) {
      terminal?.sendText(
        `cucumber -t ${tag} -p ${environment === "UAT" ? "lpp" : "lpp -p dev"}`
      );
    } else if (projectName === EProjects.automationStore) {
      terminal?.sendText(
        `cucumber -t ${tag} -p ${environment === "UAT" ? "" : " dev"}`
      );
    }
  }
}

/**
 * Executes the command.
 * @param path Path of the lite where the command was activated.
 * @param platform Platform wich be executed the tag.
 */
function executeAppCommand(
  path: string,
  platform: Platform,
  isOnFarm?: boolean
) {
  const textEditor = vscode.window.activeTextEditor;
	const selectedTag = textEditor?.document.getText(textEditor?.selection) as string;
  const tag = selectedTag.trim().includes('@') ? selectedTag : `@${selectedTag}`;
  const projectName = checkProject(path);
  const terminal = getActiveTerminal();
  const settings = getLtrSettingFile();
  if (validateTag(tag)) {
    terminal?.show(true);
    if (projectName === EProjects.automationApp) {
			const artefactNumber = settings.artefactReleaseIdFor[platform];
			
      if (isOnFarm) {
				const deviceInfo = settings.devicefarmIdFor[platform];
				const releaseType = settings.releaseType;

        terminal?.sendText(`rake run_tests'[,,${tag},,dynamic_type,labmobile,${platform},${deviceInfo},real,${artefactNumber},${releaseType}]'
			`);
      } else {
        terminal?.sendText(
          `rake run_${platform}\\[${tag},${artefactNumber},1,\\]`
        );
      }
    }
  }
}

/**
 * Checks if the givin string is a valid tag.
 * @param tag Tag selected by the user.
 */
function validateTag(tag: string): boolean {
  if (tag.indexOf("@") > -1) {
    return true;
  } else {
    vscode.window.showWarningMessage("Texto selecionado não é uma tag válida!");
    return false;
  }
}

/**
 * Checks the project to run the correct cmd parameter.
 * @param path Path of the lite where the command was activated.
 */
function checkProject(path: string): string {
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
  } else {
    return vscode.window.createTerminal(occActionsTerminalName);
  }
}

/**
 * Creates ltrSettings file
 */
const lrtPrepare = vscode.commands.registerCommand(
  "liv-tag-runner.lrtPrepare",
  (_item) => {
    const _workspace = vscode.workspace.workspaceFolders![0];
    const fsPath = _workspace.uri.fsPath;
    const wsedit = new vscode.WorkspaceEdit();
    const filePath = vscode.Uri.file(fsPath + "/app/ltrSettings.json");
    const setting = getLtrSettingFile();

    if (setting?.artefactReleaseIdFor?.android) {
      vscode.window.showWarningMessage('Arquivo "ltrSettings.json" já existe!');
    } else {
      const value: ILTRSettings = {
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
      const textEdit = new vscode.TextEdit(
        new vscode.Range(1, 1, 1, 1),
        JSON.stringify(value)
      );
      wsedit.createFile(filePath, { ignoreIfExists: true, overwrite: true });
      wsedit.set(filePath, [textEdit]);
      vscode.workspace.applyEdit(wsedit);
      vscode.window.showInformationMessage(
        'Arquivo "ltrSettings.json" criado!'
      );
    }
  }
);

/**
 * Gets `lrtSetting.json` file data.
 */
function getLtrSettingFile(): ILTRSettings {
  try {
    const _workspace = vscode.workspace.workspaceFolders![0];
    const data = fs.readFileSync(_workspace.uri.fsPath + ltrSettingPath);
    return JSON.parse(data.toString());
  } catch (error) {
    return JSON.parse("{}");
  }
}

// this method is called when your extension is deactivated
export function deactivate() {}
