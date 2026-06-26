import { contextBridge, ipcRenderer, webUtils } from "electron";

import type { SkillManagerApi, AppUpdaterApi } from "@shared/contracts";

let lastKnownFilePath = "";

window.addEventListener("drop", (e) => {
  const file = e.dataTransfer?.files[0];
  if (file) {
    lastKnownFilePath = webUtils.getPathForFile(file);
  }
}, true);

window.addEventListener("change", (e) => {
  const target = e.target as HTMLInputElement;
  if (target?.type === "file" && target.files?.[0]) {
    lastKnownFilePath = webUtils.getPathForFile(target.files[0]);
  }
}, true);

const api: SkillManagerApi = {
  getSnapshot: () => ipcRenderer.invoke("skill-manager:get-snapshot"),
  importLocalArchive: (filePath) => ipcRenderer.invoke("skill-manager:import-local-archive", filePath),
  importLocalFolder: (folderPath) => ipcRenderer.invoke("skill-manager:import-local-folder", folderPath),
  addRemoteSource: (url) => ipcRenderer.invoke("skill-manager:add-remote-source", url),
  parseStagedSources: (ids) => ipcRenderer.invoke("skill-manager:parse-staged-sources", ids),
  installStagedSources: (input) => ipcRenderer.invoke("skill-manager:install-staged-sources", input),
  removeStagedSources: (ids) => ipcRenderer.invoke("skill-manager:remove-staged-sources", ids),
  clearStagedSources: () => ipcRenderer.invoke("skill-manager:clear-staged-sources"),
  getStagedSourceDetail: (id) => ipcRenderer.invoke("skill-manager:get-staged-source-detail", id),
  getInstalledSkillDetail: (id) =>
    ipcRenderer.invoke("skill-manager:get-installed-skill-detail", id),
  rescanInstalledSkill: (id) => ipcRenderer.invoke("skill-manager:rescan-installed-skill", id),
  exportInstalledSkill: (input) => ipcRenderer.invoke("skill-manager:export-installed-skill", input),
  installWorkspaceSkill: (input) => ipcRenderer.invoke("skill-manager:install-workspace-skill", input),
  copyWorkspaceSkillToDirectory: (input) => ipcRenderer.invoke("skill-manager:copy-workspace-skill", input),
  createWorkspaceFolder: (input) => ipcRenderer.invoke("skill-manager:create-workspace-folder", input),
  createSkillCategory: (name) => ipcRenderer.invoke("skill-manager:create-skill-category", name),
  updateInstalledSkillCategory: (input) => ipcRenderer.invoke("skill-manager:update-installed-skill-category", input),
  saveSettings: (input) => ipcRenderer.invoke("skill-manager:save-settings", input),
  validateDirectory: (targetPath) => ipcRenderer.invoke("skill-manager:validate-directory", targetPath),
  openPath: (targetPath) => ipcRenderer.invoke("skill-manager:open-path", targetPath),
  pickArchiveFile: () => ipcRenderer.invoke("skill-manager:pick-archive-file"),
  pickDirectory: (initialPath?: string) => ipcRenderer.invoke("skill-manager:pick-directory", initialPath),
  copySkill: (input) => ipcRenderer.invoke("skill-manager:copy-skill", input),
  moveSkill: (input) => ipcRenderer.invoke("skill-manager:move-skill", input),
  getPathForFile: (file) => webUtils.getPathForFile(file),
  getLastKnownFilePath: () => lastKnownFilePath
};

contextBridge.exposeInMainWorld("skillManager", api);

const updaterApi: AppUpdaterApi = {
  check: () => ipcRenderer.send("updater:check"),
  download: () => ipcRenderer.send("updater:download"),
  install: () => ipcRenderer.send("updater:install"),
  onUpdateAvailable: (callback) => {
    const handler = (_event: any, info: any) => callback(info);
    ipcRenderer.on("updater:update-available", handler);
    return () => ipcRenderer.removeListener("updater:update-available", handler);
  },
  onUpdateNotAvailable: (callback) => {
    const handler = () => callback();
    ipcRenderer.on("updater:update-not-available", handler);
    return () => ipcRenderer.removeListener("updater:update-not-available", handler);
  },
  onDownloadProgress: (callback) => {
    const handler = (_event: any, info: any) => callback(info);
    ipcRenderer.on("updater:download-progress", handler);
    return () => ipcRenderer.removeListener("updater:download-progress", handler);
  },
  onUpdateDownloaded: (callback) => {
    const handler = () => callback();
    ipcRenderer.on("updater:update-downloaded", handler);
    return () => ipcRenderer.removeListener("updater:update-downloaded", handler);
  },
  onError: (callback) => {
    const handler = (_event: any, error: any) => callback(error);
    ipcRenderer.on("updater:error", handler);
    return () => ipcRenderer.removeListener("updater:error", handler);
  }
};

contextBridge.exposeInMainWorld("appUpdater", updaterApi);
