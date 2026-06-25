const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'workspace-app.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');

// 1. Find logic boundaries
const logicStart = lines.findIndex(l => l.includes('const router = useRouter();'));
const logicEnd = lines.findIndex(l => l.includes('const detailPanel = (')) - 1;

// 2. Find aside boundaries
const asideStart = lines.findIndex(l => l.includes('<aside className="app-sidebar">'));
const asideEnd = lines.findIndex(l => l.includes('</aside>'));

// 3. Find navItems boundaries
const navItemsStart = lines.findIndex(l => l.includes('const navItems: Array<{'));
const navItemsEnd = lines.findIndex(l => l.includes('];')) && lines.findIndex((l, i) => i > navItemsStart && l === '];');

if (logicStart > 0 && logicEnd > 0 && asideStart > 0 && asideEnd > 0) {
  const logicLines = lines.slice(logicStart, logicEnd + 1);
  const asideLines = lines.slice(asideStart, asideEnd + 1);
  const navItemsLines = lines.slice(navItemsStart, navItemsEnd + 1);
  
  // === CREATE src/hooks/use-workspace-app-logic.ts ===
  const hookContent = `import { useState, useEffect, useMemo, type Dispatch, type SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { useDropzone, type DropzoneState } from "react-dropzone";
import { useSkillManager } from "@/hooks/use-skill-manager";
import { getSkillManagerApi } from "@/lib/electron-api";
import type { WorkspaceSkillSource, WorkspaceSkillProviderKey, SaveSettingsInput, SkillManagerSnapshot } from "@shared/contracts";
import type { WorkspaceSection } from "../components/workspace-app";
import { translations, type TranslationDictionary } from "@/locales/translations";

let globalSidebarCollapsed = false;

export function useWorkspaceAppLogic(section: WorkspaceSection) {
${logicLines.join('\n')}

  return {
    router,
    snapshot,
    busyLabel,
    notice,
    error,
    isRefreshing,
    selectedSkillId,
    selectedStagedId,
    selectedLogId,
    selectedSkillDetail,
    selectedStagedDetail,
    setNotice,
    setError,
    setSelectedLogId,
    clearSelectedStagedDetail,
    refresh,
    loadSkillDetail,
    loadStagedDetail,
    saveSettings,
    validateDirectory,
    importLocalArchive,
    addRemoteSource,
    parseStagedSources,
    installStagedSources,
    removeStagedSources,
    clearStagedSources,
    openPath,
    pickArchiveFile,
    pickDirectory,
    rescanInstalledSkill,
    createSkillCategory,
    installWorkspaceSkill,
    settingsDraft,
    setSettingsDraft,
    modalState,
    setModalState,
    stagedModalOpen,
    setStagedModalOpen,
    installConfirmContext,
    setInstallConfirmContext,
    moveCopyContext,
    setMoveCopyContext,
    sidebarTab,
    setSidebarTab,
    sidebarCollapsed,
    setSidebarCollapsed,
    t,
    locale,
    selectedLog,
    installPathConfigured,
    headerPath,
    installedSkills,
    dropzone,
    pendingCount,
    failureCount,
    activeTheme,
    toggleStageSelection,
    handleImportProject,
    handleRemoveProject,
    handleCreateCategory,
    handleInstallWorkspaceSkill,
    openSystemSourceModal,
    importZipWithPicker,
    handleRemoteAction,
    openStagedDetailModal,
    handleInstallWithProgress,
    handleInstallManyWithProgress,
    handlePickInstallDir,
    handleQuickChooseInstallDir,
    handleValidateInstallDir,
    handlePickTempDir,
    handleValidateTempDir,
    selectedStageIds,
    setSelectedStageIds,
    searchValue,
    setSearchValue,
    selectedCategoryFilter,
    setSelectedCategoryFilter,
    newCategoryName,
    setNewCategoryName,
    remoteUrl,
    setRemoteUrl,
    primarySectionCategory
  };
}
`;

  fs.writeFileSync(path.join(__dirname, 'src', 'hooks', 'use-workspace-app-logic.ts'), hookContent);

  // === CREATE src/components/workspace/workspace-nav-sidebar.tsx ===
  const sidebarContent = `import Link from "next/link";
import { PanelLeftClose, PanelLeftOpen, LayoutDashboard, Sparkles, HardDriveDownload, FolderOpen, Logs, Settings } from "lucide-react";
import { cn } from "@/lib/cn";
import { SidebarWorkspaceTree } from "./sidebar";
import type { WorkspaceSection } from "../workspace-app";
import type { TranslationDictionary } from "@/locales/translations";
import type { SkillManagerSnapshot, WorkspaceSkillProviderKey } from "@shared/contracts";

${navItemsLines.join('\n').replace('Route', 'any')}

export function navLabel(section: WorkspaceSection, t: TranslationDictionary) {
  switch (section) {
    case "overview": return t.sectionOverview;
    case "ai-workspace": return t.sectionAiWorkspace;
    case "local-install": return t.sectionLocalInstall;
    case "projects": return t.sectionProjects;
    case "staged": return t.sectionStaged;
    case "logs": return t.sectionLogs;
    case "settings": return t.sectionSettings;
  }
}

interface WorkspaceNavSidebarProps {
  section: WorkspaceSection;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (val: boolean) => void;
  t: TranslationDictionary;
  sidebarTab: "projects" | "installDir";
  handleQuickChooseInstallDir: () => void;
  snapshot: SkillManagerSnapshot | null;
  openPath: (path: string) => void;
  handleInstallWorkspaceSkill: (sourceRoot: string, skillRootPath: string, providerKey: WorkspaceSkillProviderKey) => Promise<void>;
}

export function WorkspaceNavSidebar({
  section,
  sidebarCollapsed,
  setSidebarCollapsed,
  t,
  sidebarTab,
  handleQuickChooseInstallDir,
  snapshot,
  openPath,
  handleInstallWorkspaceSkill
}: WorkspaceNavSidebarProps) {
  return (
${asideLines.map(l => '    ' + l.trimStart()).join('\n')}
  );
}
`;
  fs.writeFileSync(path.join(__dirname, 'src', 'components', 'workspace', 'workspace-nav-sidebar.tsx'), sidebarContent);

  // === UPDATE workspace-app.tsx ===
  
  // Replace the aside with <WorkspaceNavSidebar ... />
  const sidebarUsage = `        <WorkspaceNavSidebar
          section={section}
          sidebarCollapsed={logic.sidebarCollapsed}
          setSidebarCollapsed={logic.setSidebarCollapsed}
          t={logic.t}
          sidebarTab={logic.sidebarTab}
          handleQuickChooseInstallDir={logic.handleQuickChooseInstallDir}
          snapshot={logic.snapshot}
          openPath={logic.openPath}
          handleInstallWorkspaceSkill={logic.handleInstallWorkspaceSkill}
        />`;
  lines.splice(asideStart, asideEnd - asideStart + 1, sidebarUsage);
  
  // Replace the hook logic
  const hookUsage = `  const logic = useWorkspaceAppLogic(section);`;
  // We need to re-bind the variables used in the rest of WorkspaceApp.
  const rebind = `
  const {
    snapshot, busyLabel, notice, error, isRefreshing, selectedSkillDetail, selectedStagedDetail,
    modalState, setModalState, stagedModalOpen, setStagedModalOpen, installConfirmContext, setInstallConfirmContext,
    moveCopyContext, setMoveCopyContext, t, locale, selectedLog, installPathConfigured, headerPath,
    dropzone, pendingCount, failureCount, activeTheme, 
    handleInstallWorkspaceSkill, openSystemSourceModal, importZipWithPicker, openStagedDetailModal,
    handleInstallManyWithProgress, rescanInstalledSkill, clearSelectedStagedDetail, parseStagedSources, installStagedSources, openPath
  } = logic;
  `;
  lines.splice(logicStart, logicEnd - logicStart + 1, hookUsage, rebind);
  
  // Remove navItems
  lines.splice(navItemsStart, navItemsEnd - navItemsStart + 1);

  // Add imports
  lines.unshift('import { useWorkspaceAppLogic } from "@/hooks/use-workspace-app-logic";');
  lines.unshift('import { WorkspaceNavSidebar } from "./workspace/workspace-nav-sidebar";');
  
  // Replace some references in workspace-app.tsx to use logic.*
  let newContent = lines.join('\n');
  newContent = newContent.replace(/newCategoryName=\{newCategoryName\}/g, 'newCategoryName={logic.newCategoryName}');
  newContent = newContent.replace(/onNewCategoryNameChange=\{setNewCategoryName\}/g, 'onNewCategoryNameChange={logic.setNewCategoryName}');
  newContent = newContent.replace(/remoteUrl=\{remoteUrl\}/g, 'remoteUrl={logic.remoteUrl}');
  newContent = newContent.replace(/onRemoteUrlChange=\{setRemoteUrl\}/g, 'onRemoteUrlChange={logic.setRemoteUrl}');
  newContent = newContent.replace(/searchValue=\{searchValue\}/g, 'searchValue={logic.searchValue}');
  newContent = newContent.replace(/onSearchValueChange=\{setSearchValue\}/g, 'onSearchValueChange={logic.setSearchValue}');
  newContent = newContent.replace(/selectedStageIds=\{selectedStageIds\}/g, 'selectedStageIds={logic.selectedStageIds}');
  newContent = newContent.replace(/settingsDraft=\{settingsDraft\}/g, 'settingsDraft={logic.settingsDraft}');
  newContent = newContent.replace(/setSettingsDraft=\{setSettingsDraft\}/g, 'setSettingsDraft={logic.setSettingsDraft}');
  newContent = newContent.replace(/selectedStagedId=\{selectedStagedId\}/g, 'selectedStagedId={logic.selectedStagedId}');
  newContent = newContent.replace(/selectedLogId=\{selectedLogId\}/g, 'selectedLogId={logic.selectedLogId}');
  newContent = newContent.replace(/primarySectionCategory/g, 'logic.primarySectionCategory');
  
  fs.writeFileSync(filePath, newContent);
  console.log("Refactoring complete.");
} else {
  console.log("Boundaries not found.", logicStart, logicEnd, asideStart, asideEnd, navItemsStart, navItemsEnd);
}
