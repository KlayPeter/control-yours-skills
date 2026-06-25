const fs = require('fs');
const path = require('path');

const hookPath = path.join(__dirname, 'src', 'hooks', 'use-workspace-app-logic.ts');
let hookContent = fs.readFileSync(hookPath, 'utf8');

// Inject readCachedTheme and headerPathValue into hook file
const helpers = `
function readCachedTheme(): "light" | "dark" {
  if (typeof window === "undefined") {
    return "light";
  }
  const cached = window.localStorage.getItem("control-your-skills-theme");
  return cached === "dark" ? "dark" : "light";
}

function headerPathValue(section: WorkspaceSection, snapshot: SkillManagerSnapshot | null, t: TranslationDictionary) {
  if (!snapshot) {
    return t.notConfiguredYet;
  }
  return snapshot.settings.installDir || t.notConfiguredYet;
}
`;
hookContent = hookContent.replace('let globalSidebarCollapsed = false;', helpers + '\nlet globalSidebarCollapsed = false;');

// Export copySkill and moveSkill
hookContent = hookContent.replace('primarySectionCategory\n  };', 'primarySectionCategory,\n    copySkill,\n    moveSkill\n  };');

fs.writeFileSync(hookPath, hookContent);

// Fix WorkspaceNavSidebar routes and icons
const sidebarPath = path.join(__dirname, 'src', 'components', 'workspace', 'workspace-nav-sidebar.tsx');
let sidebarContent = fs.readFileSync(sidebarPath, 'utf8');
sidebarContent = sidebarContent.replace(/Route/g, 'any');
sidebarContent = sidebarContent.replace('FolderOpen, Logs, Settings', 'FolderOpen, Logs, Settings, FolderPlus');
fs.writeFileSync(sidebarPath, sidebarContent);

// Fix workspace-app.tsx rebind block
const appPath = path.join(__dirname, 'src', 'components', 'workspace-app.tsx');
let appContent = fs.readFileSync(appPath, 'utf8');

const oldDestructure = appContent.match(/const \{\s*snapshot, busyLabel[\s\S]*?\} = logic;/)[0];

const newDestructure = `const {
    router, snapshot, busyLabel, notice, error, isRefreshing, selectedSkillId,
    selectedStagedId, selectedLogId, selectedSkillDetail, selectedStagedDetail,
    setNotice, setError, setSelectedLogId, clearSelectedStagedDetail, refresh,
    loadSkillDetail, loadStagedDetail, saveSettings, validateDirectory,
    importLocalArchive, addRemoteSource, parseStagedSources, installStagedSources,
    removeStagedSources, clearStagedSources, openPath, pickArchiveFile,
    pickDirectory, rescanInstalledSkill, createSkillCategory, installWorkspaceSkill,
    settingsDraft, setSettingsDraft, modalState, setModalState, stagedModalOpen,
    setStagedModalOpen, installConfirmContext, setInstallConfirmContext,
    moveCopyContext, setMoveCopyContext, sidebarTab, setSidebarTab, sidebarCollapsed,
    setSidebarCollapsed, t, locale, selectedLog, installPathConfigured, headerPath,
    installedSkills, dropzone, pendingCount, failureCount, activeTheme,
    toggleStageSelection, handleImportProject, handleRemoveProject, handleCreateCategory,
    handleInstallWorkspaceSkill, openSystemSourceModal, importZipWithPicker,
    handleRemoteAction, openStagedDetailModal, handleInstallWithProgress,
    handleInstallManyWithProgress, handlePickInstallDir, handleQuickChooseInstallDir,
    handleValidateInstallDir, handlePickTempDir, handleValidateTempDir,
    selectedStageIds, setSelectedStageIds, searchValue, setSearchValue,
    selectedCategoryFilter, setSelectedCategoryFilter, newCategoryName,
    setNewCategoryName, remoteUrl, setRemoteUrl, primarySectionCategory,
    copySkill, moveSkill
  } = logic;`;

appContent = appContent.replace(oldDestructure, newDestructure);
// We also need to remove headerPathValue, readCachedTheme, navLabel from workspace-app.tsx since they are either moved or obsolete in workspace-app.tsx
appContent = appContent.replace(/function navLabel[\s\S]*?\}\n\n/, '');
appContent = appContent.replace(/function headerPathValue[\s\S]*?\}\n\n/, '');
appContent = appContent.replace(/function readCachedTheme[\s\S]*?\}\n\n\n\n/, '');

fs.writeFileSync(appPath, appContent);

console.log("Fixed bindings and imports.");
