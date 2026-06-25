const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'workspace-app.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');

const logicStart = lines.findIndex(l => l.includes('const router = useRouter();'));
const logicEnd = lines.findIndex(l => l.includes('const detailPanel = (')) - 1;

const asideStart = lines.findIndex(l => l.includes('<aside className="app-sidebar">'));
const asideEnd = lines.findIndex(l => l.includes('</aside>'));

const navItemsStart = lines.findIndex(l => l.includes('const navItems: Array<{'));
const navItemsEnd = lines.findIndex(l => l.includes('];')) && lines.findIndex((l, i) => i > navItemsStart && l === '];');

if (logicStart > 0 && logicEnd > 0 && asideStart > 0 && asideEnd > 0) {
  const sidebarUsage = `        <WorkspaceNavSidebar
          section={section}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          t={t}
          sidebarTab={sidebarTab}
          handleQuickChooseInstallDir={handleQuickChooseInstallDir}
          snapshot={snapshot}
          openPath={openPath}
          handleInstallWorkspaceSkill={handleInstallWorkspaceSkill}
          setSidebarTab={setSidebarTab}
          pendingCount={pendingCount}
          failureCount={failureCount}
          handleImportProject={handleImportProject}
        />`;
  lines.splice(asideStart, asideEnd - asideStart + 1, sidebarUsage);
  
  const hookUsage = `  const logic = useWorkspaceAppLogic(section, initialSkillId);`;
  const rebind = `
  const {
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
  } = logic;
  `;
  lines.splice(logicStart, logicEnd - logicStart + 1, hookUsage, rebind);
  
  lines.splice(navItemsStart, navItemsEnd - navItemsStart + 1);

  lines.unshift('import { useWorkspaceAppLogic } from "@/hooks/use-workspace-app-logic";');
  lines.unshift('import { WorkspaceNavSidebar } from "./workspace/workspace-nav-sidebar";');
  
  // Remove functions that were moved
  let newContent = lines.join('\n');
  newContent = newContent.replace(/function navLabel[\s\S]*?\}\n\n/, '');
  newContent = newContent.replace(/function headerPathValue[\s\S]*?\}\n\n/, '');
  newContent = newContent.replace(/function readCachedTheme[\s\S]*?\}\n\n/, '');
  
  // Remove unused unusedVars to satisfy ESLint
  const unusedVars = [
    'selectedSkillId', 'selectedStagedId', 'loadSkillDetail', 'validateDirectory',
    'importLocalArchive', 'addRemoteSource', 'pickArchiveFile', 'createSkillCategory', 
    'locale', 'installedSkills', 'activeTheme', 'openStagedDetailModal', 'handleInstallWithProgress'
  ];
  unusedVars.forEach(v => {
    const regex = new RegExp('\\b' + v + '\\b\\s*,?', 'g');
    newContent = newContent.replace(regex, '');
  });
  
  fs.writeFileSync(filePath, newContent);
  console.log("Refactoring complete.");
} else {
  console.log("Boundaries not found.");
}
