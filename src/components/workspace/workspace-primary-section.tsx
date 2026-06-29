import type { Dispatch, SetStateAction } from "react";
import type { DropzoneState } from "react-dropzone";
import type {
  InstalledSkillRecord,
  SaveSettingsInput,
  SkillManagerSnapshot,
  WorkspaceSkillProviderKey,
  WorkspaceSkillSource,
  CopyWorkspaceSkillInput
} from "@shared/contracts";

import { SectionCard } from "../ui/cards";
import { OverviewSection } from "../sections/overview-section";
import dynamic from 'next/dynamic';

const StagedSection = dynamic(() => import('../sections/staged-section').then(mod => mod.StagedSection));
const LogsSection = dynamic(() => import('../sections/logs-section').then(mod => mod.LogsSection));
const SettingsSection = dynamic(() => import('../sections/settings-section').then(mod => mod.SettingsSection));
const AiWorkspaceSection = dynamic(() => import('../sections/ai-workspace-section').then(mod => mod.AiWorkspaceSection));
const LocalInstallSection = dynamic(() => import('../sections/local-install-section').then(mod => mod.LocalInstallSection));
const ProjectsSection = dynamic(() => import('../sections/projects-section').then(mod => mod.ProjectsSection));
const SyncStatusSection = dynamic(() => import('../sections/sync-status-section').then(mod => mod.SyncStatusSection));
const ConflictsSection = dynamic(() => import('../sections/conflicts-section').then(mod => mod.ConflictsSection));

import type { WorkspaceSection } from "../workspace-app";
type TranslationDictionary = Record<string, string>;
type AsyncActionResult<T = unknown> = void | Promise<T>;

export function WorkspacePrimarySection({
  section,
  snapshot,
  t,
  installedSkills,
  installPathConfigured,
  onChooseInstallDir,
  onGoImport,
  onGoStaged,
  onGoAiWorkspace,
  onGoLocalInstall,
  onGoProjects,
  onGoSyncStatus,
  onGoConflicts,
  remoteUrl,
  onRemoteUrlChange,
  selectedStageIds,
  selectedStagedId,
  selectedLogId,
  searchValue,
  settingsDraft,
  setSettingsDraft,
  dropzone,
  onToggleStageSelection,
  onImportProject,
  onRemoveProject,
  onOpenSystemSourceModal,
  onOpenPath,
  onImportZip,
  onImportFolder,
  onRemoteAction,
  onParseStaged,
  onInstallStaged,
  onRemoveStaged,
  onClearStaged,
  onLoadStagedDetail,
  onOpenStagedDetail,
  onInstallStagedWithProgress,
  onSelectLog,
  onOpenLogsFromOverview,
  onInstallWorkspaceSkill,
  onCopyWorkspaceSkill,
  onCreateWorkspaceFolder,
  onCopySkill,
  onMoveSkill,
  onCategoryChange,
  selectedCategory,
  selectedSkillId,
  onSearchValueChange,
  onPickInstallDir,
  onValidateInstallDir,
  onPickTempDir,
  onValidateTempDir,
  onSaveSettings,
  onCreateCategory,
  onAddSyncTarget,
  onRemoveSyncTarget,
  onSyncInstalledSkill,
  onSyncAllSkills,
  onAdoptSyncTarget,
  onUpdateStagedSourceCategory,
  onUpdateInstalledSkillCategory,
  newCategoryName,
  onNewCategoryNameChange
}: {
  section: WorkspaceSection;
  snapshot: SkillManagerSnapshot | null;
  t: TranslationDictionary;
  installedSkills: InstalledSkillRecord[];
  installPathConfigured: boolean;
  onChooseInstallDir: () => AsyncActionResult;
  onGoImport: () => AsyncActionResult;
  onGoStaged: () => AsyncActionResult;
  onGoAiWorkspace: () => void;
  onGoLocalInstall: () => void;
  onGoProjects: () => void;
  onGoSyncStatus: () => void;
  onGoConflicts: () => void;
  onCopySkill: (id: string) => void;
  onMoveSkill: (id: string) => void;
  onCategoryChange: (value: string) => void;
  selectedCategory: string;
  remoteUrl: string;
  onRemoteUrlChange: (value: string) => void;
  selectedStageIds: string[];
  selectedStagedId: string | null;
  selectedSkillId: string | null;
  selectedLogId: string | null;
  searchValue: string;
  settingsDraft: SaveSettingsInput;
  setSettingsDraft: Dispatch<SetStateAction<SaveSettingsInput>>;
  dropzone: DropzoneState;
  onToggleStageSelection: (id: string) => void;
  onImportProject: () => AsyncActionResult;
  onRemoveProject: (projectPath: string) => AsyncActionResult;
  onOpenSystemSourceModal: (source: WorkspaceSkillSource) => void;
  onOpenPath: (path: string) => AsyncActionResult;
  onImportZip: (mode: "staged" | "install") => AsyncActionResult;
  onImportFolder: (mode: "staged" | "install") => AsyncActionResult;
  onRemoteAction: (mode: "staged" | "install") => AsyncActionResult;
  onParseStaged: (ids: string[]) => AsyncActionResult;
  onInstallStaged: (ids: string[]) => AsyncActionResult;
  onRemoveStaged: (ids: string[]) => AsyncActionResult;
  onClearStaged: () => Promise<number | undefined>;
  onLoadStagedDetail: (id: string) => AsyncActionResult;
  onOpenStagedDetail: (id: string) => void;
  onInstallStagedWithProgress: (id: string) => Promise<void>;
  onSelectLog: (logId: string) => void;
  onOpenLogsFromOverview: (logId: string) => void;
  onInstallWorkspaceSkill: (
    sourceRoot: string,
    skillRootPath: string,
    providerKey: WorkspaceSkillProviderKey
  ) => AsyncActionResult;
  onCopyWorkspaceSkill: (input: CopyWorkspaceSkillInput) => AsyncActionResult;
  onCreateWorkspaceFolder: (input: { parentPath: string; folderName: string }) => AsyncActionResult;
  onSearchValueChange: (value: string) => void;
  onPickInstallDir: () => AsyncActionResult;
  onValidateInstallDir: () => AsyncActionResult;
  onPickTempDir: () => AsyncActionResult;
  onValidateTempDir: () => AsyncActionResult;
  onSaveSettings: () => AsyncActionResult;
  onCreateCategory: () => AsyncActionResult;
  onAddSyncTarget: (input: { skillId: string; scope: "project" | "system"; providerKey: WorkspaceSkillProviderKey; label: string; path: string }) => AsyncActionResult;
  onRemoveSyncTarget: (input: { syncTargetId: string; skillId?: string }) => AsyncActionResult;
  onSyncInstalledSkill: (input: { skillId: string; syncTargetId?: string }) => AsyncActionResult;
  onSyncAllSkills: () => AsyncActionResult;
  onAdoptSyncTarget: (input: { syncTargetId: string; skillId?: string }) => AsyncActionResult;
  onUpdateStagedSourceCategory: (input: { id: string; category: string | null }) => AsyncActionResult;
  onUpdateInstalledSkillCategory: (input: { id: string; category: string | null }) => AsyncActionResult;
  newCategoryName: string;
  onNewCategoryNameChange: (value: string) => void;
}) {
  if (!snapshot) {
    return (
      <SectionCard title={t.loadingWorkspace} subtitle={t.loadingWorkspaceSubtitle}>
        <div className="app-surface rounded-3xl p-5 text-sm app-text-soft">
          {t.loadingWorkspaceBody}
        </div>
      </SectionCard>
    );
  }

  switch (section) {
    case "overview":
      return (
        <OverviewSection
          installPathConfigured={installPathConfigured}
          onChooseInstallDir={onChooseInstallDir}
          onGoImport={onGoImport}
          onGoStaged={onGoStaged}
          onImportProject={onImportProject}
          onOpenLogsFromOverview={onOpenLogsFromOverview}
          onOpenPath={onOpenPath}
          onOpenSystemSourceModal={onOpenSystemSourceModal}
          onGoAiWorkspace={onGoAiWorkspace}
          onGoLocalInstall={onGoLocalInstall}
          onGoProjects={onGoProjects}
          onGoSyncStatus={onGoSyncStatus}
          onGoConflicts={onGoConflicts}
          snapshot={snapshot}
          t={t}
        />
      );
    case "ai-workspace":
      return (
        <AiWorkspaceSection
          snapshot={snapshot}
          t={t}
          onOpenSystemSourceModal={onOpenSystemSourceModal}
          onOpenPath={onOpenPath}
          onInstallWorkspaceSkill={onInstallWorkspaceSkill}
          onCopyWorkspaceSkill={onCopyWorkspaceSkill}
          onCreateWorkspaceFolder={onCreateWorkspaceFolder}
          searchValue={searchValue}
          onSearchValueChange={onSearchValueChange}
        />
      );
    case "local-install":
      return (
        <LocalInstallSection
          dropzone={dropzone}
          installPathConfigured={installPathConfigured}
          onImportZip={onImportZip}
          onImportFolder={onImportFolder}
          onRemoteAction={onRemoteAction}
          onRemoteUrlChange={onRemoteUrlChange}
          remoteUrl={remoteUrl}
          snapshot={snapshot}
          t={t}
          onOpenPath={onOpenPath}
          onInstallWorkspaceSkill={onInstallWorkspaceSkill}
          onCopyWorkspaceSkill={onCopyWorkspaceSkill}
          onCreateWorkspaceFolder={onCreateWorkspaceFolder}
          onAddSyncTarget={onAddSyncTarget}
          onRemoveSyncTarget={onRemoveSyncTarget}
          onSyncInstalledSkill={onSyncInstalledSkill}
          onSyncAllSkills={onSyncAllSkills}
          onUpdateInstalledSkillCategory={onUpdateInstalledSkillCategory}
          searchValue={searchValue}
          onSearchValueChange={onSearchValueChange}
        />
      );
    case "sync-status":
      return (
        <SyncStatusSection
          snapshot={snapshot}
          t={t}
          searchValue={searchValue}
          onSearchValueChange={onSearchValueChange}
          onOpenPath={onOpenPath}
          onSyncInstalledSkill={onSyncInstalledSkill}
          onAdoptSyncTarget={onAdoptSyncTarget}
        />
      );
    case "conflicts":
      return (
        <ConflictsSection
          snapshot={snapshot}
          t={t}
          searchValue={searchValue}
          onSearchValueChange={onSearchValueChange}
          onOpenPath={onOpenPath}
          onSyncInstalledSkill={onSyncInstalledSkill}
          onAdoptSyncTarget={onAdoptSyncTarget}
        />
      );
    case "projects":
      return (
        <ProjectsSection
          snapshot={snapshot}
          t={t}
          onOpenPath={onOpenPath}
          onRemoveProject={onRemoveProject}
          onImportProject={onImportProject}
          onInstallWorkspaceSkill={onInstallWorkspaceSkill}
          onCopyWorkspaceSkill={onCopyWorkspaceSkill}
          onCreateWorkspaceFolder={onCreateWorkspaceFolder}
          searchValue={searchValue}
          onSearchValueChange={onSearchValueChange}
        />
      );
    case "staged":
      return (
        <StagedSection
          onClearStaged={onClearStaged}
          onInstallStaged={onInstallStaged}
          installPathConfigured={installPathConfigured}
          onLoadStagedDetail={onLoadStagedDetail}
          onParseStaged={onParseStaged}
          onRemoveStaged={onRemoveStaged}
          onToggleStageSelection={onToggleStageSelection}
          onUpdateStagedCategory={onUpdateStagedSourceCategory}
          selectedStageIds={selectedStageIds}
          selectedStagedId={selectedStagedId}
          snapshot={snapshot}
          t={t}
        />
      );
    case "logs":
      return <LogsSection onSelectLog={onSelectLog} selectedLogId={selectedLogId} snapshot={snapshot} t={t} />;
    case "settings":
      return (
        <SettingsSection
          newCategoryName={newCategoryName}
          onCreateCategory={onCreateCategory}
          onNewCategoryNameChange={onNewCategoryNameChange}
          onOpenPath={onOpenPath}
          onPickInstallDir={onPickInstallDir}
          onPickTempDir={onPickTempDir}
          onSaveSettings={onSaveSettings}
          onValidateInstallDir={onValidateInstallDir}
          onValidateTempDir={onValidateTempDir}
          setSettingsDraft={setSettingsDraft}
          settingsDraft={settingsDraft}
          snapshot={snapshot}
          t={t}
        />
      );
  }
}
