const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'workspace-app.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');

// Find start of hook logic
const startIndex = lines.findIndex(line => line.includes('export function WorkspaceApp({ section, initialSkillId }: WorkspaceAppProps) {')) + 1;
// Find end of hook logic (before detailPanel)
const endIndex = lines.findIndex(line => line.includes('const detailPanel = (')) - 1;

if (startIndex > 0 && endIndex > 0) {
    const logicLines = lines.slice(startIndex, endIndex + 1);
    
    // Write hook file
    const hookContent = `
import { useState, useEffect, useMemo, type Dispatch, type SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { useSkillManager } from "@/hooks/use-skill-manager";
import { getSkillManagerApi } from "@/lib/electron-api";
import type { WorkspaceSkillSource, WorkspaceSkillProviderKey } from "@shared/contracts";
import type { WorkspaceSection } from "../components/workspace-app";
import { translations, type TranslationDictionary } from "@/locales/translations";

let globalSidebarCollapsed = false;

export function useWorkspaceAppLogic(section: WorkspaceSection, searchValue: string, selectedCategoryFilter: string | null) {
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
    newCategoryName,
    setNewCategoryName,
    remoteUrl,
    setRemoteUrl
  };
}
`;
    fs.writeFileSync(path.join(__dirname, 'src', 'hooks', 'use-workspace-app-logic.ts'), hookContent);
    
    // Now I won't replace workspace-app.tsx with the script just yet because it needs many prop bindings.
    console.log("Extracted logic lines:", logicLines.length);
}
