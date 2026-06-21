import { contextBridge, ipcRenderer } from "electron";

import type { SkillManagerApi } from "@shared/contracts";

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
  pickDirectory: (initialPath) => ipcRenderer.invoke("skill-manager:pick-directory", initialPath)
};

contextBridge.exposeInMainWorld("skillManager", api);
