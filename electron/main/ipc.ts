import { ipcMain } from "electron";

import type { InstallStagedSourcesInput, SaveSettingsInput } from "@shared/contracts";

import type { SkillManagerBackend } from "./skill-manager-backend";

export function registerIpcHandlers(backend: SkillManagerBackend) {
  ipcMain.handle("skill-manager:get-snapshot", () => backend.getSnapshot());
  ipcMain.handle("skill-manager:import-local-archive", (_event, filePath: string) =>
    backend.importLocalArchive(filePath)
  );
  ipcMain.handle("skill-manager:add-remote-source", (_event, url: string) =>
    backend.addRemoteSource(url)
  );
  ipcMain.handle("skill-manager:parse-staged-sources", (_event, ids: string[]) =>
    backend.parseStagedSources(ids)
  );
  ipcMain.handle("skill-manager:install-staged-sources", (_event, input: InstallStagedSourcesInput) =>
    backend.installStagedSources(input)
  );
  ipcMain.handle("skill-manager:remove-staged-sources", (_event, ids: string[]) =>
    backend.removeStagedSources(ids)
  );
  ipcMain.handle("skill-manager:clear-staged-sources", () => backend.clearStagedSources());
  ipcMain.handle("skill-manager:get-staged-source-detail", (_event, id: string) =>
    backend.getStagedSourceDetail(id)
  );
  ipcMain.handle("skill-manager:get-installed-skill-detail", (_event, id: string) =>
    backend.getInstalledSkillDetail(id)
  );
  ipcMain.handle("skill-manager:rescan-installed-skill", (_event, id: string) =>
    backend.rescanInstalledSkill(id)
  );
  ipcMain.handle("skill-manager:export-installed-skill", (_event, input) =>
    backend.exportInstalledSkill(input)
  );
  ipcMain.handle("skill-manager:install-workspace-skill", (_event, input) =>
    backend.installWorkspaceSkill(input)
  );
  ipcMain.handle("skill-manager:create-skill-category", (_event, name: string) =>
    backend.createSkillCategory(name)
  );
  ipcMain.handle("skill-manager:save-settings", (_event, input: SaveSettingsInput) =>
    backend.saveSettings(input)
  );
  ipcMain.handle("skill-manager:validate-directory", (_event, targetPath: string) =>
    backend.validateDirectory(targetPath)
  );
  ipcMain.handle("skill-manager:open-path", (_event, targetPath: string) =>
    backend.openPath(targetPath)
  );
  ipcMain.handle("skill-manager:pick-archive-file", () => backend.pickArchiveFile());
  ipcMain.handle("skill-manager:pick-directory", (_event, initialPath?: string) =>
    backend.pickDirectory(initialPath)
  );
}
