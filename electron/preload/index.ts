import { contextBridge, ipcRenderer, webUtils } from "electron";

import type { SkillManagerApi } from "@shared/contracts";

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
  createSkillCategory: (name) => ipcRenderer.invoke("skill-manager:create-skill-category", name),
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
