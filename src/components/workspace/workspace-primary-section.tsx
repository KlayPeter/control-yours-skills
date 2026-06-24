import type { Dispatch, SetStateAction } from "react";
import type { DropzoneState } from "react-dropzone";
import type {
  InstalledSkillRecord,
  SaveSettingsInput,
  SkillManagerSnapshot,
  WorkspaceSkillProviderKey,
  WorkspaceSkillSource
} from "@shared/contracts";

import { SectionCard } from "../ui/cards";
import { OverviewSection } from "../sections/overview-section";
import { ImportSection } from "../sections/import-section";
import { StagedSection } from "../sections/staged-section";
import { SkillsSection } from "../sections/skills-section";
import { LogsSection } from "../sections/logs-section";
import { SettingsSection } from "../sections/settings-section";

type TranslationDictionary = Record<string, string>;
type WorkspaceSection = "overview" | "import" | "staged" | "skills" | "logs" | "settings";
type AsyncActionResult<T = unknown> = void | Promise<T>;

export function WorkspacePrimarySection({
  section,
  snapshot,
  t,
  installPathConfigured,
  onChooseInstallDir,
  onGoImport,
  onGoStaged,
  remoteUrl,
  onRemoteUrlChange,
  selectedStageIds,
  selectedStagedId,
  selectedSkillId,
  selectedLogId,
  searchValue,
  installedSkills,
  settingsDraft,
  setSettingsDraft,
  dropzone,
  onToggleStageSelection,
  onImportProject,
  onRemoveProject,
  onOpenSystemSourceModal,
  onOpenPath,
  onImportZip,
  onRemoteAction,
  onParseStaged,
  onInstallStaged,
  onRemoveStaged,
  onClearStaged,
  onLoadStagedDetail,
  onOpenStagedDetail,
  onLoadSkillDetail,
  onSelectLog,
  onOpenLogsFromOverview,
  onInstallWorkspaceSkill,
  onSearchValueChange,
  onPickInstallDir,
  onValidateInstallDir,
  onPickTempDir,
  onValidateTempDir,
  onSaveSettings,
  onCreateCategory,
  newCategoryName,
  onNewCategoryNameChange,
  selectedCategory,
  onCategoryChange
}: {
  section: WorkspaceSection;
  snapshot: SkillManagerSnapshot | null;
  t: TranslationDictionary;
  installPathConfigured: boolean;
  onChooseInstallDir: () => AsyncActionResult;
  onGoImport: () => AsyncActionResult;
  onGoStaged: () => AsyncActionResult;
  remoteUrl: string;
  onRemoteUrlChange: (value: string) => void;
  selectedStageIds: string[];
  selectedStagedId: string | null;
  selectedSkillId: string | null;
  selectedLogId: string | null;
  searchValue: string;
  installedSkills: InstalledSkillRecord[];
  settingsDraft: SaveSettingsInput;
  setSettingsDraft: Dispatch<SetStateAction<SaveSettingsInput>>;
  dropzone: DropzoneState;
  onToggleStageSelection: (id: string) => void;
  onImportProject: () => AsyncActionResult;
  onRemoveProject: (projectPath: string) => AsyncActionResult;
  onOpenSystemSourceModal: (source: WorkspaceSkillSource) => void;
  onOpenPath: (path: string) => AsyncActionResult;
  onImportZip: (mode: "staged" | "install") => AsyncActionResult;
  onRemoteAction: (mode: "staged" | "install") => AsyncActionResult;
  onParseStaged: (ids: string[]) => AsyncActionResult;
  onInstallStaged: (ids: string[]) => AsyncActionResult;
  onRemoveStaged: (ids: string[]) => AsyncActionResult;
  onClearStaged: () => AsyncActionResult;
  onLoadStagedDetail: (id: string) => AsyncActionResult;
  onOpenStagedDetail: (id: string) => AsyncActionResult;
  onLoadSkillDetail: (id: string) => AsyncActionResult;
  onSelectLog: (logId: string) => void;
  onOpenLogsFromOverview: (logId: string) => void;
  onInstallWorkspaceSkill: (
    sourceRoot: string,
    skillRootPath: string,
    providerKey: WorkspaceSkillProviderKey
  ) => AsyncActionResult;
  onSearchValueChange: (value: string) => void;
  onPickInstallDir: () => AsyncActionResult;
  onValidateInstallDir: () => AsyncActionResult;
  onPickTempDir: () => AsyncActionResult;
  onValidateTempDir: () => AsyncActionResult;
  onSaveSettings: () => AsyncActionResult;
  onCreateCategory: () => AsyncActionResult;
  newCategoryName: string;
  onNewCategoryNameChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
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
          onInstallWorkspaceSkill={onInstallWorkspaceSkill}
          onRemoveProject={onRemoveProject}
          snapshot={snapshot}
          t={t}
        />
      );
    case "import":
      return (
        <ImportSection
          dropzone={dropzone}
          installPathConfigured={installPathConfigured}
          onCategoryChange={onCategoryChange}
          onImportZip={onImportZip}
          onOpenStagedDetail={onOpenStagedDetail}
          onParseStaged={onParseStaged}
          onRemoveStaged={onRemoveStaged}
          onRemoteAction={onRemoteAction}
          onRemoteUrlChange={onRemoteUrlChange}
          onGoStaged={onGoStaged}
          remoteUrl={remoteUrl}
          selectedCategory={selectedCategory}
          selectedStagedId={selectedStagedId}
          snapshot={snapshot}
          t={t}
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
          selectedStageIds={selectedStageIds}
          selectedStagedId={selectedStagedId}
          snapshot={snapshot}
          t={t}
        />
      );
    case "skills":
      return (
        <SkillsSection
          categories={snapshot.installCategories}
          installedSkills={installedSkills}
          onCategoryChange={onCategoryChange}
          onLoadSkillDetail={onLoadSkillDetail}
          onOpenPath={onOpenPath}
          onSearchValueChange={onSearchValueChange}
          searchValue={searchValue}
          selectedCategory={selectedCategory}
          selectedSkillId={selectedSkillId}
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
