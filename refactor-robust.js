const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/workspace-app.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Replace imports
const newImports = `"use client";

import {
  AlertCircle,
  CheckCircle2,
  FolderOpen,
  LoaderCircle,
  RefreshCcw,
  X
} from "lucide-react";

import { SourceViewerModal } from "./workspace/source-viewer-modal";
import { WorkspaceDetailPanel } from "./workspace/workspace-detail-panel";
import { WorkspacePrimarySection } from "./workspace/workspace-primary-section";
import { cn } from "@/lib/cn";
import { WorkspaceNavSidebar } from "./workspace/workspace-nav-sidebar";
import { useWorkspaceAppLogic } from "@/hooks/use-workspace-app-logic";
export type { TranslationDictionary } from "@/locales/translations";

export type WorkspaceSection = "overview" | "ai-workspace" | "local-install" | "projects" | "staged" | "logs" | "settings";

interface WorkspaceAppProps {
  section: WorkspaceSection;
  initialSkillId?: string;
}`;
content = content.replace(/^"use client";[\s\S]*?interface WorkspaceAppProps \{[\s\S]*?\}/m, newImports);

// 2. Remove translations and helper functions
content = content.replace(/const navItems[\s\S]*?let globalSidebarCollapsed = false;/m, '');

// 3. Replace WorkspaceApp logic with hook
const logicStart = content.indexOf('export function WorkspaceApp');
const logicEnd = content.indexOf('const detailPanel = (');
if (logicStart > -1 && logicEnd > -1) {
  const hookUsage = `export function WorkspaceApp({ section, initialSkillId }: WorkspaceAppProps) {
  const logic = useWorkspaceAppLogic(section, initialSkillId);
  const {
    router, snapshot, busyLabel, notice, error, isRefreshing, selectedSkillDetail,
    selectedStagedDetail, setNotice, setError, clearSelectedStagedDetail, refresh,
    openPath, installWorkspaceSkill,
    settingsDraft, setSettingsDraft, modalState, setModalState, stagedModalOpen,
    setStagedModalOpen, installConfirmContext, setInstallConfirmContext,
    moveCopyContext, setMoveCopyContext, sidebarTab, setSidebarTab, sidebarCollapsed,
    setSidebarCollapsed, t, selectedLog, installPathConfigured, headerPath,
    dropzone, pendingCount, failureCount, activeTheme,
    handleImportProject, handleRemoveProject, handleCreateCategory,
    handleInstallWorkspaceSkill, openSystemSourceModal, importZipWithPicker,
    handleRemoteAction, openStagedDetailModal, handleInstallWithProgress,
    handleInstallManyWithProgress, handlePickInstallDir, handleQuickChooseInstallDir,
    handleValidateInstallDir, handlePickTempDir, handleValidateTempDir,
    searchValue, setSearchValue,
    selectedCategoryFilter, setSelectedCategoryFilter, newCategoryName,
    setNewCategoryName, remoteUrl, setRemoteUrl, primarySectionCategory,
    copySkill, moveSkill,
    selectedSkillId, selectedStagedId, selectedLogId, installedSkills, selectedStageIds,
    setSelectedLogId, loadStagedDetail, installStagedSources, parseStagedSources,
    removeStagedSources, clearStagedSources, toggleStageSelection, saveSettings
  } = logic;

  `;
  content = content.substring(0, logicStart) + hookUsage + content.substring(logicEnd);
}

// 4. Replace sidebar with WorkspaceNavSidebar
const sidebarStart = content.indexOf('<aside className="app-sidebar">');
const sidebarEnd = content.indexOf('</aside>') + 8;
if (sidebarStart > -1 && sidebarEnd > -1) {
  const newSidebar = `<WorkspaceNavSidebar
          section={section}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          t={t}
          sidebarTab={sidebarTab}
          setSidebarTab={setSidebarTab}
          pendingCount={pendingCount}
          failureCount={failureCount}
          handleImportProject={handleImportProject}
          handleQuickChooseInstallDir={handleQuickChooseInstallDir}
          snapshot={snapshot}
          openPath={openPath}
          handleInstallWorkspaceSkill={handleInstallWorkspaceSkill}
        />`;
  content = content.substring(0, sidebarStart) + newSidebar + content.substring(sidebarEnd);
}

// 5. Fix WorkspacePrimarySection props
content = content.replace(/onRemoteUrlChange=\{setRemoteUrl\}/g, 'onRemoteUrlChange={setRemoteUrl}\n                  remoteUrl={remoteUrl}');
content = content.replace(/onSearchValueChange=\{setSearchValue\}/g, 'onSearchValueChange={setSearchValue}\n                  searchValue={searchValue}');
content = content.replace(/onNewCategoryNameChange=\{setNewCategoryName\}/g, 'onNewCategoryNameChange={setNewCategoryName}\n                  newCategoryName={newCategoryName}\n                  setSettingsDraft={setSettingsDraft}\n                  settingsDraft={settingsDraft}\n                  selectedSkillId={selectedSkillId}\n                  selectedStageIds={selectedStageIds}\n                  selectedStagedId={selectedStagedId}\n                  selectedLogId={selectedLogId}');

fs.writeFileSync(file, content);
console.log('Robust refactoring complete');
