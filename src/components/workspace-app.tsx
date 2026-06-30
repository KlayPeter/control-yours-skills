"use client";

import { useState, useRef, useEffect } from "react";

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
import { AutoUpdaterDialog } from "./workspace/auto-updater-dialog";
import { cn } from "@/lib/cn";
import { WorkspaceNavSidebar, navLabel } from "./workspace/workspace-nav-sidebar";
import { useWorkspaceAppLogic } from "@/hooks/use-workspace-app-logic";
export type { TranslationDictionary } from "@/locales/translations";

export type WorkspaceSection =
  | "overview"
  | "ai-workspace"
  | "local-install"
  | "sync-status"
  | "projects"
  | "staged"
  | "logs"
  | "settings";

interface WorkspaceAppProps {
  section: WorkspaceSection;
  initialSkillId?: string;
}



export function WorkspaceApp({ section, initialSkillId }: WorkspaceAppProps) {
  const logic = useWorkspaceAppLogic(section, initialSkillId);
  const {
    router, snapshot, busyLabel, notice, error, isRefreshing, selectedSkillDetail,
    selectedStagedDetail, setNotice, setError, clearSelectedStagedDetail, refresh,
    openPath, installWorkspaceSkill, copyWorkspaceSkillToDirectory, createWorkspaceFolder,
    settingsDraft, setSettingsDraft, modalState, setModalState, stagedModalOpen,
    setStagedModalOpen, installConfirmContext, setInstallConfirmContext,
    moveCopyContext, setMoveCopyContext, sidebarTab, setSidebarTab, sidebarCollapsed,
    setSidebarCollapsed, t, selectedLog, installPathConfigured, headerPath,
    dropzone, pendingCount, failureCount, activeTheme,
    handleImportProject, handleRemoveProject, handleCreateCategory,
    handleInstallWorkspaceSkill, openSystemSourceModal, importZipWithPicker, importFolderWithPicker,
    handleRemoteAction, openStagedDetailModal, handleInstallWithProgress,
    handleInstallManyWithProgress, handlePickInstallDir, handleQuickChooseInstallDir,
    handleValidateInstallDir, handlePickTempDir, handleValidateTempDir,
    searchValue, setSearchValue,
    selectedCategoryFilter, setSelectedCategoryFilter, newCategoryName,
    setNewCategoryName, remoteUrl, setRemoteUrl, primarySectionCategory,
    copySkill, moveSkill,
    selectedSkillId, selectedStagedId, selectedLogId, installedSkills, selectedStageIds,
    setSelectedLogId, loadStagedDetail, installStagedSources, parseStagedSources,
    removeStagedSources, clearStagedSources, toggleStageSelection, saveSettings,
    rescanInstalledSkill, pickDirectory, addSyncTarget, removeSyncTarget,
    syncInstalledSkill, syncAllSkills, adoptSyncTarget,
    updateStagedSourceCategory, updateInstalledSkillCategory
  } = logic;

  // Auto refresh when section changes
  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  const [sidebarWidth, setSidebarWidth] = useState(340);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ isDragging: false });

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragRef.current.isDragging = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!dragRef.current.isDragging) return;
      let newWidth = moveEvent.clientX;
      if (newWidth < 180) {
        setSidebarCollapsed(true);
        // snap width to match the collapsed size, but don't strictly enforce it unless we need to.
        newWidth = 84;
      } else {
        setSidebarCollapsed(false);
        if (newWidth > 600) newWidth = 600;
        setSidebarWidth(newWidth);
      }
    };

    const onMouseUp = () => {
      setIsDragging(false);
      dragRef.current.isDragging = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const detailPanel = (
    <WorkspaceDetailPanel
      onInstallStaged={installStagedSources}
      onOpenPath={openPath}
      onParseStaged={parseStagedSources}
      onRescanInstalledSkill={rescanInstalledSkill}
      section={section}
      selectedLog={selectedLog}
      selectedSkillDetail={selectedSkillDetail}
      selectedStagedDetail={selectedStagedDetail}
      t={t}
    />
  );
  const showDetailLayout = false; // Disabled for now as per user request

  return (
    <div className="app-shell app-grid min-h-screen app-text">
      <AutoUpdaterDialog />
      <SourceViewerModal
        onClose={() => setModalState(null)}
        onOpenPath={(targetPath) => void openPath(targetPath)}
        open={Boolean(modalState)}
        sources={modalState?.sources || []}
        subtitle={modalState?.subtitle}
        t={t}
        title={modalState?.title || t.modalInstalledSkills}
      />

      {section === "local-install" && stagedModalOpen && selectedStagedDetail ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => {
          setStagedModalOpen(false);
          clearSelectedStagedDetail();
        }}>
          <div className="app-panel flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-black/10 dark:border-white/10 px-6 py-5">
              <div>
                <h3 className="text-xl font-semibold app-text">
                  {selectedStagedDetail.detectedName || t.stagedSourceDetail}
                </h3>
                <p className="mt-1 text-sm app-text-soft">{t.stagedSourceDetailSubtitle}</p>
              </div>
              <button
                className="app-icon-button"
                onClick={() => {
                  setStagedModalOpen(false);
                  clearSelectedStagedDetail();
                }}
                type="button"
              >
                ×
              </button>
            </div>

            <div className="max-h-[calc(85vh-92px)] overflow-y-auto px-6 py-5">
              <WorkspaceDetailPanel
                onInstallStaged={handleInstallManyWithProgress}
                onOpenPath={openPath}
                onParseStaged={parseStagedSources}
                onRescanInstalledSkill={rescanInstalledSkill}
                section="staged"
                selectedLog={null}
                selectedSkillDetail={null}
                selectedStagedDetail={selectedStagedDetail}
                t={t}
              />
            </div>
          </div>
        </div>
      ) : null}


      <div className="pointer-events-none fixed bottom-5 right-5 z-40 flex w-[min(24rem,calc(100vw-2.5rem))] flex-col gap-3">
        {notice ? (
          <div className="pointer-events-auto overflow-hidden rounded-2xl border border-moss/30 bg-ink-950/95 shadow-2xl backdrop-blur">
            <div className="flex items-start gap-3 px-4 py-3 text-sm text-moss">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="min-w-0 flex-1">{notice}</div>
              <button
                aria-label="Dismiss notification"
                className="rounded-full p-1 text-moss/70 transition hover:bg-white/10 hover:text-moss"
                onClick={() => setNotice(null)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="pointer-events-auto overflow-hidden rounded-2xl border border-ember/30 bg-ink-950/95 shadow-2xl backdrop-blur">
            <div className="flex items-start gap-3 px-4 py-3 text-sm text-ember">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="min-w-0 flex-1">{error}</div>
              <button
                aria-label="Dismiss error"
                className="rounded-full p-1 text-ember/70 transition hover:bg-white/10 hover:text-ember"
                onClick={() => setError(null)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div 
        className={cn(
          "grid min-h-screen grid-cols-1 xl:h-screen xl:overflow-hidden",
          !isDragging && "transition-all duration-300"
        )}
        style={{
          gridTemplateColumns: sidebarCollapsed 
            ? "84px minmax(0,1fr)" 
            : `${sidebarWidth}px minmax(0,1fr)`
        }}
      >
        <div className="relative xl:h-full">
          <WorkspaceNavSidebar
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
          onCopyWorkspaceSkill={copyWorkspaceSkillToDirectory}
          onCreateWorkspaceFolder={createWorkspaceFolder}
        />
        <div 
          className="absolute top-0 -right-2 h-full w-4 cursor-col-resize hover:bg-black/10 dark:hover:bg-white/10 active:bg-blue-500/50 z-[100] transition-colors"
          onMouseDown={startResizing}
        />
      </div>

      <div className="flex min-h-screen flex-col xl:h-screen xl:overflow-y-auto">
          <header className="app-topbar drag-region">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] app-text-soft">{t.workspaceHeader}</p>
                <h2 className="mt-2 text-[2rem] font-semibold tracking-tight app-text">
                  {navLabel(section, t)}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {busyLabel ? (
                  <div className="mr-2 inline-flex items-center gap-2 rounded-full border border-signal/30 bg-signal/10 px-3 py-1.5 text-sm text-signal animate-in fade-in zoom-in duration-200">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    {busyLabel}
                  </div>
                ) : null}
                <button
                  aria-label={t.refresh}
                  className="app-icon-button rounded-2xl"
                  onClick={() => {
                    setNotice(null);
                    setError(null);
                    void refresh();
                  }}
                  title={t.refresh}
                  type="button"
                >
                  <RefreshCcw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 p-5">
            {showDetailLayout ? (
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr),minmax(360px,0.85fr)]">
                <div>
                  <WorkspacePrimarySection
                  dropzone={dropzone}
                  installPathConfigured={installPathConfigured}
                  installedSkills={installedSkills}
                  onClearStaged={clearStagedSources}
                  onChooseInstallDir={handleQuickChooseInstallDir}
                  onGoImport={() => router.push("/staged" as import("next").Route)}
                  onGoStaged={() => router.push("/staged" as import("next").Route)}
                  onGoAiWorkspace={() => router.push("/ai-workspace" as import("next").Route)}
                  onGoLocalInstall={() => router.push("/local-install" as import("next").Route)}
                  onGoProjects={() => router.push("/projects" as import("next").Route)}
                  onGoSyncStatus={() => router.push("/sync-status" as import("next").Route)}
                  onImportProject={handleImportProject}
                  onImportZip={importZipWithPicker}
                  onImportFolder={importFolderWithPicker}
                  onLoadStagedDetail={loadStagedDetail}
                  onOpenStagedDetail={openStagedDetailModal}
                  onInstallStagedWithProgress={handleInstallWithProgress}
                  onOpenLogsFromOverview={(logId) => {
                    setSelectedLogId(logId);
                    router.push("/logs");
                  }}
                  onOpenPath={openPath}
                  onOpenSystemSourceModal={openSystemSourceModal}
                  onInstallStaged={installStagedSources}
                  onParseStaged={parseStagedSources}
                  onPickInstallDir={handlePickInstallDir}
                  onPickTempDir={handlePickTempDir}
                  onRemoteAction={handleRemoteAction}
                  onRemoteUrlChange={setRemoteUrl}
                  onCopySkill={(id) => setMoveCopyContext({ id, action: "copy" })}
                  onMoveSkill={(id) => setMoveCopyContext({ id, action: "move" })}
                  remoteUrl={remoteUrl}
                  onInstallWorkspaceSkill={handleInstallWorkspaceSkill}
                  onRemoveProject={handleRemoveProject}
                  onRemoveStaged={removeStagedSources}
                  onCreateCategory={handleCreateCategory}
                  onAddSyncTarget={addSyncTarget}
                  onRemoveSyncTarget={removeSyncTarget}
                  onSyncInstalledSkill={syncInstalledSkill}
                  onSyncAllSkills={syncAllSkills}
                  onAdoptSyncTarget={adoptSyncTarget}
                  onUpdateStagedSourceCategory={updateStagedSourceCategory}
                  onUpdateInstalledSkillCategory={updateInstalledSkillCategory}
                  onCopyWorkspaceSkill={copyWorkspaceSkillToDirectory}
                  onCreateWorkspaceFolder={createWorkspaceFolder}
                  onSaveSettings={() => saveSettings(settingsDraft)}
                  onSearchValueChange={setSearchValue}
                  searchValue={searchValue}
                  onSelectLog={setSelectedLogId}
                  onToggleStageSelection={toggleStageSelection}
                  onCategoryChange={setSelectedCategoryFilter}
                  onValidateInstallDir={handleValidateInstallDir}
                  onValidateTempDir={handleValidateTempDir}
                  section={section}
                  selectedCategory={primarySectionCategory}
                  selectedLogId={selectedLogId}
                  selectedSkillId={selectedSkillId}
                  selectedStageIds={selectedStageIds}
                  selectedStagedId={selectedStagedId}
                  onNewCategoryNameChange={setNewCategoryName}
                  newCategoryName={newCategoryName}
                  setSettingsDraft={setSettingsDraft}
                  settingsDraft={settingsDraft}
                  snapshot={snapshot}
                  t={t}
                />
                </div>
                <div>{detailPanel}</div>
              </div>
            ) : (
              <div>
                <WorkspacePrimarySection
                  dropzone={dropzone}
                  installPathConfigured={installPathConfigured}
                  installedSkills={installedSkills}
                  onClearStaged={clearStagedSources}
                  onChooseInstallDir={handleQuickChooseInstallDir}
                  onGoImport={() => router.push("/staged" as import("next").Route)}
                  onGoStaged={() => router.push("/staged" as import("next").Route)}
                  onGoAiWorkspace={() => router.push("/ai-workspace" as import("next").Route)}
                  onGoLocalInstall={() => router.push("/local-install" as import("next").Route)}
                  onGoProjects={() => router.push("/projects" as import("next").Route)}
                  onGoSyncStatus={() => router.push("/sync-status" as import("next").Route)}
                  onImportProject={handleImportProject}
                  onImportZip={importZipWithPicker}
                  onImportFolder={importFolderWithPicker}
                  onLoadStagedDetail={loadStagedDetail}
                  onOpenStagedDetail={openStagedDetailModal}
                  onInstallStagedWithProgress={handleInstallWithProgress}
                  onOpenLogsFromOverview={(logId) => {
                    setSelectedLogId(logId);
                    router.push("/logs");
                  }}
                  onOpenPath={openPath}
                  onOpenSystemSourceModal={openSystemSourceModal}
                  onInstallStaged={installStagedSources}
                  onParseStaged={parseStagedSources}
                  onPickInstallDir={handlePickInstallDir}
                  onPickTempDir={handlePickTempDir}
                  onRemoteAction={handleRemoteAction}
                  onRemoteUrlChange={setRemoteUrl}
                  onCopySkill={(id) => setMoveCopyContext({ id, action: "copy" })}
                  onMoveSkill={(id) => setMoveCopyContext({ id, action: "move" })}
                  remoteUrl={remoteUrl}
                  onInstallWorkspaceSkill={handleInstallWorkspaceSkill}
                  onRemoveProject={handleRemoveProject}
                  onRemoveStaged={removeStagedSources}
                  onCreateCategory={handleCreateCategory}
                  onAddSyncTarget={addSyncTarget}
                  onRemoveSyncTarget={removeSyncTarget}
                  onSyncInstalledSkill={syncInstalledSkill}
                  onSyncAllSkills={syncAllSkills}
                  onAdoptSyncTarget={adoptSyncTarget}
                  onUpdateStagedSourceCategory={updateStagedSourceCategory}
                  onUpdateInstalledSkillCategory={updateInstalledSkillCategory}
                  onCopyWorkspaceSkill={copyWorkspaceSkillToDirectory}
                  onCreateWorkspaceFolder={createWorkspaceFolder}
                  onSaveSettings={() => saveSettings(settingsDraft)}
                  onSearchValueChange={setSearchValue}
                  searchValue={searchValue}
                  onSelectLog={setSelectedLogId}
                  onToggleStageSelection={toggleStageSelection}
                  onCategoryChange={setSelectedCategoryFilter}
                  onValidateInstallDir={handleValidateInstallDir}
                  onValidateTempDir={handleValidateTempDir}
                  section={section}
                  selectedCategory={primarySectionCategory}
                  selectedLogId={selectedLogId}
                  selectedSkillId={selectedSkillId}
                  selectedStageIds={selectedStageIds}
                  selectedStagedId={selectedStagedId}
                  onNewCategoryNameChange={setNewCategoryName}
                  newCategoryName={newCategoryName}
                  setSettingsDraft={setSettingsDraft}
                  settingsDraft={settingsDraft}
                  snapshot={snapshot}
                  t={t}
                />
              </div>
            )}
          </main>
        </div>
      </div>
      {installConfirmContext ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm transition-opacity dark:bg-black/60" onClick={() => setInstallConfirmContext(null)}>
          <div className="app-panel flex w-full max-w-[320px] flex-col overflow-hidden p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold tracking-tight app-text mb-2">确认安装技能</h3>
            <p className="text-sm leading-relaxed app-text-soft mb-6">
              即将为 <strong className="app-text font-semibold">{installConfirmContext.providerKey}</strong> 环境安装此技能。
            </p>
            
            <label className="group mb-8 flex cursor-pointer items-center gap-2.5">
              <input 
                type="checkbox" 
                className="h-4 w-4 cursor-pointer rounded border-black/20 bg-black/5 text-slate-900 transition-colors focus:ring-slate-900/30 dark:border-white/20 dark:bg-white/5 dark:text-slate-100"
                id="skip-install-confirm-checkbox"
              />
              <span className="text-sm app-text-soft transition-colors group-hover:app-text">不再提醒，下次直接安装</span>
            </label>

            <div className="flex justify-end gap-3 mt-2">
              <button 
                className="app-button" 
                onClick={() => setInstallConfirmContext(null)}
              >
                取消
              </button>
              <button 
                className="app-button-primary" 
                onClick={() => {
                  const cb = document.getElementById("skip-install-confirm-checkbox") as HTMLInputElement;
                  if (cb?.checked) {
                    localStorage.setItem("skip-install-confirm", "true");
                  }
                  void installWorkspaceSkill({
                    sourceRoot: installConfirmContext.sourceRoot, 
                    skillRootPath: installConfirmContext.skillRootPath, 
                    providerKey: installConfirmContext.providerKey
                  });
                  setInstallConfirmContext(null);
                }}
              >
                确认安装
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {moveCopyContext && snapshot ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm transition-opacity dark:bg-black/60" onClick={() => setMoveCopyContext(null)}>
          <div className="app-panel flex w-full max-w-[400px] flex-col overflow-hidden p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold tracking-tight app-text mb-2">
              {moveCopyContext.action === "copy" ? "复制到" : "移动到"}
            </h3>
            <p className="text-sm leading-relaxed app-text-soft mb-4">
              请选择目标目录
            </p>
            
            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto mb-6">
              {snapshot.systemSkillSources.map((source) => (
                <button
                  key={source.id}
                  className="app-button flex items-center justify-start text-left w-full h-auto py-2 px-3"
                  onClick={() => {
                    const action = moveCopyContext.action === "copy" ? copySkill : moveSkill;
                    void action({ id: moveCopyContext.id, targetDir: source.path });
                    setMoveCopyContext(null);
                  }}
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium">{source.key}</span>
                    <span className="text-xs text-opacity-60 truncate">{source.path}</span>
                  </div>
                </button>
              ))}
              {snapshot.installCategories.map((category) => (
                <button
                  key={category.id}
                  className="app-button flex items-center justify-start text-left w-full h-auto py-2 px-3"
                  onClick={() => {
                    const action = moveCopyContext.action === "copy" ? copySkill : moveSkill;
                    void action({ id: moveCopyContext.id, targetDir: category.path });
                    setMoveCopyContext(null);
                  }}
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium">分类: {category.name}</span>
                    <span className="text-xs text-opacity-60 truncate">{category.path}</span>
                  </div>
                </button>
              ))}
              <button
                className="app-button flex items-center justify-center text-left w-full mt-2"
                onClick={async () => {
                  const result = await pickDirectory();
                  if (result?.data) {
                    const action = moveCopyContext.action === "copy" ? copySkill : moveSkill;
                    void action({ id: moveCopyContext.id, targetDir: result.data });
                    setMoveCopyContext(null);
                  }
                }}
              >
                选择其他目录...
              </button>
            </div>

            <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-white/10">
              <button 
                className="app-button" 
                onClick={() => setMoveCopyContext(null)}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
