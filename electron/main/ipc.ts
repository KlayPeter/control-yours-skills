import { ipcMain } from "electron";

import type {
  AddSyncTargetInput,
  AdoptSyncTargetInput,
  BatchUpdateInstalledSkillsInput,
  CommitFolderImportInput,
  CopyWorkspaceSkillInput,
  ExportInstalledSkillInput,
  ExecuteSyncDecisionInput,
  ExecuteTrustedRemoteInstallInput,
  InstallStagedSourcesInput,
  InstallWorkspaceSkillInput,
  RemoveSyncTargetInput,
  PreviewSyncInput,
  PinSkillSnapshotInput,
  RestoreSkillSnapshotInput,
  SaveSettingsInput,
  SaveSkillMarkdownInput,
  SyncInstalledSkillInput,
  UpdateInstalledSkillCategoryInput,
  UpdateStagedSourceCategoryInput
} from "@shared/contracts";

import type { SkillManagerBackend } from "./skill-manager-backend";
import { isTrustedRendererUrl } from "./ipc-security";

export function registerIpcHandlers(backend: SkillManagerBackend, rendererUrl: string) {
  const registerHandler = <Args extends unknown[], Result>(
    channel: string,
    handler: (...args: Args) => Result
  ) => {
    ipcMain.handle(channel, (event, ...args: Args) => {
      if (!event.senderFrame || !isTrustedRendererUrl(event.senderFrame.url, rendererUrl)) {
        throw new Error("Blocked IPC call from an untrusted renderer.");
      }

      return handler(...args);
    });
  };

  registerHandler("skill-manager:get-snapshot", () => backend.getSnapshot());
  registerHandler("skill-manager:import-local-archive", (filePath: string) =>
    backend.importLocalArchive(filePath)
  );
  registerHandler("skill-manager:import-local-folder", (folderPath: string) =>
    backend.importLocalFolder(folderPath)
  );
  registerHandler("skill-manager:preview-local-folder-import", (folderPath: string) =>
    backend.previewLocalFolderImport(folderPath)
  );
  registerHandler("skill-manager:commit-folder-import", (input: CommitFolderImportInput) =>
    backend.commitFolderImport(input)
  );
  registerHandler("skill-manager:add-remote-source", (url: string) =>
    backend.addRemoteSource(url)
  );
  registerHandler("skill-manager:preview-trusted-remote-install", (stagedSourceId: string) =>
    backend.previewTrustedRemoteInstall(stagedSourceId)
  );
  registerHandler("skill-manager:execute-trusted-remote-install", (input: ExecuteTrustedRemoteInstallInput) =>
    backend.executeTrustedRemoteInstall(input)
  );
  registerHandler("skill-manager:parse-staged-sources", (ids: string[]) =>
    backend.parseStagedSources(ids)
  );
  registerHandler("skill-manager:install-staged-sources", (input: InstallStagedSourcesInput) =>
    backend.installStagedSources(input)
  );
  registerHandler("skill-manager:remove-staged-sources", (ids: string[]) =>
    backend.removeStagedSources(ids)
  );
  registerHandler("skill-manager:clear-staged-sources", () => backend.clearStagedSources());
  registerHandler("skill-manager:get-staged-source-detail", (id: string) =>
    backend.getStagedSourceDetail(id)
  );
  registerHandler("skill-manager:get-installed-skill-detail", (id: string) =>
    backend.getInstalledSkillDetail(id)
  );
  registerHandler("skill-manager:rescan-installed-skill", (id: string) =>
    backend.rescanInstalledSkill(id)
  );
  registerHandler("skill-manager:export-installed-skill", (input: ExportInstalledSkillInput) =>
    backend.exportInstalledSkill(input)
  );
  registerHandler("skill-manager:install-workspace-skill", (input: InstallWorkspaceSkillInput) =>
    backend.installWorkspaceSkill(input)
  );
  registerHandler("skill-manager:copy-workspace-skill", (input: CopyWorkspaceSkillInput) =>
    backend.copyWorkspaceSkillToDirectory(input)
  );
  registerHandler("skill-manager:create-workspace-folder", (input: { parentPath: string; folderName: string }) =>
    backend.createWorkspaceFolder(input)
  );
  registerHandler("skill-manager:create-skill-category", (name: string) =>
    backend.createSkillCategory(name)
  );
  registerHandler("skill-manager:add-sync-target", (input: AddSyncTargetInput) =>
    backend.addSyncTarget(input)
  );
  registerHandler("skill-manager:remove-sync-target", (input: RemoveSyncTargetInput) =>
    backend.removeSyncTarget(input)
  );
  registerHandler("skill-manager:sync-installed-skill", (input: SyncInstalledSkillInput) =>
    backend.syncInstalledSkill(input)
  );
  registerHandler("skill-manager:sync-all-skills", () =>
    backend.syncAllSkills()
  );
  registerHandler("skill-manager:adopt-sync-target", (input: AdoptSyncTargetInput) =>
    backend.adoptSyncTarget(input)
  );
  registerHandler("skill-manager:preview-sync", (input: PreviewSyncInput) =>
    backend.previewSync(input)
  );
  registerHandler("skill-manager:execute-sync-decision", (input: ExecuteSyncDecisionInput) =>
    backend.executeSyncDecision(input)
  );
  registerHandler("skill-manager:list-skill-snapshots", (skillId: string) =>
    backend.listSkillSnapshots(skillId)
  );
  registerHandler("skill-manager:save-skill-markdown", (input: SaveSkillMarkdownInput) =>
    backend.saveSkillMarkdown(input)
  );
  registerHandler("skill-manager:restore-skill-snapshot", (input: RestoreSkillSnapshotInput) =>
    backend.restoreSkillSnapshot(input)
  );
  registerHandler("skill-manager:pin-skill-snapshot", (input: PinSkillSnapshotInput) =>
    backend.pinSkillSnapshot(input)
  );
  registerHandler("skill-manager:update-staged-source-category", (input: UpdateStagedSourceCategoryInput) =>
    backend.updateStagedSourceCategory(input)
  );
  registerHandler("skill-manager:update-installed-skill-category", (input: UpdateInstalledSkillCategoryInput) =>
    backend.updateInstalledSkillCategory(input)
  );
  registerHandler("skill-manager:batch-update-installed-skills", (input: BatchUpdateInstalledSkillsInput) =>
    backend.batchUpdateInstalledSkills(input)
  );
  registerHandler("skill-manager:save-settings", (input: SaveSettingsInput) =>
    backend.saveSettings(input)
  );
  registerHandler("skill-manager:validate-directory", (targetPath: string) =>
    backend.validateDirectory(targetPath)
  );
  registerHandler("skill-manager:open-path", (targetPath: string) =>
    backend.openPath(targetPath)
  );
  registerHandler("skill-manager:pick-archive-file", () => backend.pickArchiveFile());
  registerHandler("skill-manager:pick-directory", (initialPath?: string) =>
    backend.pickDirectory(initialPath)
  );
  registerHandler("skill-manager:copy-skill", (input: { id: string; targetDir: string }) =>
    backend.copySkill(input)
  );
  registerHandler("skill-manager:move-skill", (input: { id: string; targetDir: string }) =>
    backend.moveSkill(input)
  );
}
