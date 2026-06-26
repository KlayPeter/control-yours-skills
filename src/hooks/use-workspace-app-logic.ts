import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { useSkillManager } from "@/hooks/use-skill-manager";
import { getSkillManagerApi } from "@/lib/electron-api";
import type { WorkspaceSkillSource, WorkspaceSkillProviderKey, SaveSettingsInput, SkillManagerSnapshot } from "@shared/contracts";
import type { WorkspaceSection } from "../components/workspace-app";
import { translations, type TranslationDictionary } from "@/locales/translations";

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

let globalSidebarCollapsed = false;

export function useWorkspaceAppLogic(section: WorkspaceSection, initialSkillId?: string) {
  const router = useRouter();
  const {
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
    importLocalFolder,
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
    updateInstalledSkillCategory,
    installWorkspaceSkill,
    copyWorkspaceSkillToDirectory,
    createWorkspaceFolder,
    copySkill,
    moveSkill
  } = useSkillManager(initialSkillId);
  const [remoteUrl, setRemoteUrl] = useState("");
  const [selectedStageIds, setSelectedStageIds] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("");
  const [settingsDraft, setSettingsDraft] = useState<SaveSettingsInput>({
    installDir: "",
    tempDir: "",
    projectDirs: [],
    skillCategories: [],
    defaultSkillCategory: "",
    conflictPolicy: "rename",
    theme: readCachedTheme(),
    locale: "zh-CN",
    ai: {
      enabled: true,
      provider: "deepseek",
      baseUrl: "https://api.deepseek.com",
      apiKey: "",
      model: "deepseek-v4-pro"
    }
  });
  const [modalState, setModalState] = useState<{
    title: string;
    subtitle?: string;
    sources: WorkspaceSkillSource[];
  } | null>(null);
  const [stagedModalOpen, setStagedModalOpen] = useState(false);
  const [installConfirmContext, setInstallConfirmContext] = useState<{
    sourceRoot: string;
  skillRootPath: string;
    providerKey: WorkspaceSkillProviderKey;
  } | null>(null);
  const [moveCopyContext, setMoveCopyContext] = useState<{
    id: string;
    action: "copy" | "move";
  } | null>(null);
  const [sidebarTab, setSidebarTab] = useState<"projects" | "installDir">("projects");
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(globalSidebarCollapsed);

  const setSidebarCollapsed = (val: boolean) => {
    globalSidebarCollapsed = val;
    setSidebarCollapsedState(val);
  };

  const locale = snapshot?.settings.locale || settingsDraft.locale;
  const t = translations[locale];
  const selectedLog = snapshot?.logs.find((item) => item.id === selectedLogId) || null;
  const installPathConfigured = Boolean(snapshot?.settings.installDir.trim());
  const headerPath = headerPathValue(section, snapshot, t);
  const installedSkills = useMemo(() => {
    if (!snapshot) {
      return [];
    }

    const term = searchValue.trim().toLowerCase();
    return snapshot.installedSkills.filter((skill) => {
      const matchesCategory = !selectedCategoryFilter || skill.category === selectedCategoryFilter;
      if (!matchesCategory) {
        return false;
      }

      if (!term) {
        return true;
      }

      return (
        skill.name.toLowerCase().includes(term) ||
        skill.slug.toLowerCase().includes(term) ||
        skill.description?.toLowerCase().includes(term)
      );
    });
  }, [searchValue, selectedCategoryFilter, snapshot]);

  useEffect(() => {
    if (!snapshot) {
      return;
    }

    setSettingsDraft({
      installDir: snapshot.settings.installDir || "",
      tempDir: snapshot.settings.tempDir || "",
      projectDirs: snapshot.settings.projectDirs || [],
      skillCategories: snapshot.settings.skillCategories || [],
      defaultSkillCategory: snapshot.settings.defaultSkillCategory || "",
      conflictPolicy: snapshot.settings.conflictPolicy,
      theme: snapshot.settings.theme,
      locale: snapshot.settings.locale,
      ai: snapshot.settings.ai
    });
  }, [snapshot]);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setNotice(null);
    }, 2600);

    return () => window.clearTimeout(timeoutId);
  }, [notice, setNotice]);

  useEffect(() => {
    if (!error) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setError(null);
    }, 4200);

    return () => window.clearTimeout(timeoutId);
  }, [error, setError]);

  const dropzone = useDropzone({
    accept: {
      "application/zip": [".zip"]
    },
    multiple: false,
    onDropAccepted: (files, event) => {
      void (async () => {
        let realPath = "";
        
        // 1. Try extracting from raw DragEvent dataTransfer
        const dragEvent = event as unknown as { dataTransfer?: { files?: Array<{ path?: string }> } };
        if (dragEvent?.dataTransfer?.files?.[0]?.path) {
          realPath = dragEvent.dataTransfer.files[0].path;
        }
        
        // 2. Try extracting from raw ChangeEvent target (input click)
        const changeEvent = event as unknown as { target?: { files?: { path?: string }[] } };
        if (!realPath && changeEvent?.target?.files?.[0]?.path) {
          realPath = changeEvent.target.files[0].path;
        }

        // 3. Fallback to API / manipulated file
        if (!realPath) {
          const file = files[0];
          const api = getSkillManagerApi();
          const lastKnown = api.getLastKnownFilePath ? api.getLastKnownFilePath() : "";
          const apiResult = api.getPathForFile ? api.getPathForFile(file) : undefined;
          const fallbackPath = (file as unknown as { path?: string }).path;
          realPath = lastKnown || apiResult || fallbackPath || "";
        }

        if (!realPath) {
          setError(t.droppedFilePathUnavailable);
          return;
        }

        await importLocalArchive(realPath);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.push("/staged" as any);
      })();
    }
  });

  const pendingCount = snapshot?.stagedSources.filter((item) => item.status === "pending").length || 0;
  const failureCount = snapshot?.summary.failedCount || 0;
  const activeTheme = snapshot ? snapshot.settings.theme : settingsDraft.theme;

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.documentElement.dataset.theme = activeTheme;

    window.localStorage.setItem("control-your-skills-theme", activeTheme);
  }, [activeTheme]);

  const toggleStageSelection = (id: string) => {
    setSelectedStageIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const updateProjectDirs = async (projectDirs: string[]) => {
    const nextSettings = {
      ...settingsDraft,
      projectDirs: [...new Set(projectDirs.map((item) => item.trim()).filter(Boolean))]
    };
    setSettingsDraft(nextSettings);
    await saveSettings(nextSettings);
  };

  const handleImportProject = async () => {
    const initialPath =
      settingsDraft.projectDirs[settingsDraft.projectDirs.length - 1] || snapshot?.runtime.homeDir;
    const result = await pickDirectory(initialPath);
    if (result.ok && result.data) {
      await updateProjectDirs([...settingsDraft.projectDirs, result.data]);
    }
  };

  const handleRemoveProject = async (projectPath: string) => {
    await updateProjectDirs(settingsDraft.projectDirs.filter((item) => item !== projectPath));
  };

  const handleCreateCategory = async () => {
    const categoryName = newCategoryName.trim();
    if (!categoryName) {
      return;
    }

    const created = await createSkillCategory(categoryName);
    if (!created) {
      return;
    }

    setSettingsDraft((current) => {
      const nextCategories = [...new Set([...current.skillCategories, created.name])];
      return {
        ...current,
        skillCategories: nextCategories,
        defaultSkillCategory: current.defaultSkillCategory || created.name
      };
    });
    setNewCategoryName("");
  };

  const handleInstallWorkspaceSkill = async (
    sourceRoot: string,
    skillRootPath: string,
    providerKey: WorkspaceSkillProviderKey
  ) => {
    const skip = localStorage.getItem("skip-install-confirm") === "true";
    if (skip) {
      await installWorkspaceSkill({ sourceRoot, skillRootPath, providerKey });
    } else {
      setInstallConfirmContext({ sourceRoot, skillRootPath, providerKey });
    }
  };

  const openSystemSourceModal = (source: WorkspaceSkillSource) => {
    setModalState({
      title: source.label,
      subtitle: source.path,
      sources: [source]
    });
  };

  const importZipWithPicker = async (mode: "staged" | "install") => {
    const result = await pickArchiveFile();
    if (!result.ok || !result.data) {
      return;
    }

    const created = await importLocalArchive(result.data);
    if (mode === "install" && created) {
      await installStagedSources([created.id], settingsDraft.defaultSkillCategory || undefined);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push("/local-install" as any);
      return;
    }

    if (created) {
      await loadStagedDetail(created.id);
      setStagedModalOpen(true);
    }
  };

  const importFolderWithPicker = async (mode: "staged" | "install") => {
    const initialPath =
      settingsDraft.projectDirs[settingsDraft.projectDirs.length - 1] ||
      snapshot?.settings.installDir ||
      snapshot?.runtime.homeDir;
    const result = await pickDirectory(initialPath);
    if (!result.ok || !result.data) {
      return;
    }

    const imported = await importLocalFolder(result.data);
    if (!imported) {
      return;
    }

    if (mode === "install" && imported.records.length > 0) {
      await installStagedSources(
        imported.records.map((record) => record.id),
        settingsDraft.defaultSkillCategory || undefined
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push("/local-install" as any);
      return;
    }

    if (imported.records[0]) {
      await loadStagedDetail(imported.records[0].id);
      setStagedModalOpen(true);
    }
  };

  const handleRemoteAction = async () => {
    if (!remoteUrl.trim()) {
      setError(t.enterRemoteSourceUrl);
      return;
    }

    const created = await addRemoteSource(remoteUrl.trim());
    setRemoteUrl("");

    if (!created) {
      return;
    }

    await refresh();
    await loadStagedDetail(created.id);
    setStagedModalOpen(true);

    try {
      await parseStagedSources([created.id]);
      await loadStagedDetail(created.id);
    } catch (parseError) {
      const message = parseError instanceof Error ? parseError.message : t.operationFailed;
      setError(message);
      await loadStagedDetail(created.id);
      return;
    }

  };

  const openStagedDetailModal = async (stagedId: string) => {
    await loadStagedDetail(stagedId);
    setStagedModalOpen(true);
  };

  const handleInstallWithProgress = async (stagedId: string) => {
    await installStagedSources([stagedId], settingsDraft.defaultSkillCategory || undefined);
    await refresh();
  };

  const handleInstallManyWithProgress = async (ids: string[]) => {
    if (ids.length === 0) {
      return;
    }

    await handleInstallWithProgress(ids[0]);
  };

  const handlePickInstallDir = async () => {
    const result = await pickDirectory(settingsDraft.installDir);
    if (result.ok && result.data) {
      setSettingsDraft((current) => ({
        ...current,
        installDir: result.data || current.installDir
      }));
    }
  };

  const handleQuickChooseInstallDir = async () => {
    const initialPath = settingsDraft.installDir || snapshot?.runtime.homeDir;
    const result = await pickDirectory(initialPath);
    if (!result.ok || !result.data) {
      return;
    }

    const nextSettings = {
      ...settingsDraft,
      installDir: result.data
    };
    setSettingsDraft(nextSettings);
    await saveSettings(nextSettings);
  };

  const handleValidateInstallDir = async () => {
    const result = await validateDirectory(settingsDraft.installDir);
    setNotice(result.writable ? t.installDirectoryWritable : result.error || t.installDirectoryInvalid);
  };

  const handlePickTempDir = async () => {
    const result = await pickDirectory(settingsDraft.tempDir || snapshot?.runtime.dataRoot);
    if (result.ok && result.data) {
      setSettingsDraft((current) => ({
        ...current,
        tempDir: result.data || current.tempDir
      }));
    }
  };

  const handleValidateTempDir = async () => {
    if (!settingsDraft.tempDir.trim()) {
      setNotice(t.tempDirectoryEmptyNotice);
      return;
    }

    const result = await validateDirectory(settingsDraft.tempDir);
    setNotice(result.writable ? t.tempDirectoryWritable : result.error || t.tempDirectoryInvalid);
  };

  const primarySectionCategory = section === "local-install" ? settingsDraft.defaultSkillCategory : selectedCategoryFilter;

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
    importLocalFolder,
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
    updateInstalledSkillCategory,
    installWorkspaceSkill,
    copyWorkspaceSkillToDirectory,
    createWorkspaceFolder,
    copySkill,
    moveSkill,
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
    importFolderWithPicker,
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
