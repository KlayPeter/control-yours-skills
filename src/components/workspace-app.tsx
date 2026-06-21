"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { useDropzone } from "react-dropzone";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FolderOpen,
  HardDriveDownload,
  LayoutDashboard,
  LoaderCircle,
  Logs,
  PanelLeftOpen,
  RefreshCcw,
  Settings2,
  UploadCloud,
  X
} from "lucide-react";

import type { ImportedProjectRecord, Locale, SaveSettingsInput, WorkspaceSkillSource } from "@shared/contracts";

import {
  SourceViewerModal,
  WorkspaceDetailPanel,
  WorkspacePrimarySection
} from "@/components/workspace-app-sections";
import { useSkillManager } from "@/hooks/use-skill-manager";
import { cn } from "@/lib/cn";

type WorkspaceSection = "overview" | "import" | "staged" | "skills" | "logs" | "settings";
type TranslationDictionary = Record<string, string>;

interface WorkspaceAppProps {
  section: WorkspaceSection;
  initialSkillId?: string;
}

const navItems: Array<{
  section: WorkspaceSection;
  href: Route;
  icon: typeof LayoutDashboard;
}> = [
  { section: "overview", href: "/", icon: LayoutDashboard },
  { section: "import", href: "/import", icon: UploadCloud },
  { section: "skills", href: "/skills", icon: HardDriveDownload },
  { section: "logs", href: "/logs", icon: Logs },
  { section: "settings", href: "/settings", icon: Settings2 }
];

const zhCnTranslations: TranslationDictionary = {
  appName: "Control Your Skills",
  appTitle: "技能管理台",
  appDescription: "在一个界面里导入、查看、安装和整理本地技能。",
  workspaceHeader: "工作区",
  runtime: "运行环境",
  runtimeDevData: "开发数据：仓库 data/",
  runtimeProdData: "生产数据：Electron userData",
  runtimeFrontend: "前端",
  runtimeInstallDir: "安装目录",
  unavailable: "不可用",
  notConfiguredYet: "尚未配置",
  loadingWorkspace: "正在加载工作区",
  loadingWorkspaceSubtitle: "正在读取当前技能数据",
  loadingWorkspaceBody: "请稍候，正在准备工作区快照。",
  refresh: "刷新",
  openInstallFolder: "打开安装目录",
  defaultInstallDirectoryLabel: "默认安装目录：",
  sectionOverview: "概览",
  sectionImport: "导入",
  sectionStaged: "暂存区",
  sectionSkills: "已安装技能",
  sectionLogs: "日志",
  sectionSettings: "设置",
  overviewInstallDir: "安装目录",
  workspaceSkillDirectories: "工作区技能目录",
  workspaceSkillDirectoriesSubtitle: "检测当前机器上的 Codex、Claude 和 Agents 技能目录。",
  projectDirectories: "已导入项目",
  projectDirectoriesSubtitle: "当前工作区正在跟踪的项目技能目录。",
  recentInstalls: "最近安装",
  recentInstallsSubtitle: "最近成功安装的技能。",
  recentFailures: "最近失败",
  recentFailuresSubtitle: "最近的解析或安装失败记录。",
  noInstallRecordsYet: "还没有安装记录",
  noInstallRecordsYetDescription: "首次成功安装技能后，这里会出现记录。",
  noRecentFailures: "最近没有失败",
  noRecentFailuresDescription: "当前没有新的失败记录。",
  noDescriptionAvailable: "暂无描述。",
  view: "查看",
  delete: "删除",
  importProject: "导入项目",
  openFolder: "打开目录",
  skillCount: "技能数",
  localZipImport: "导入本地 ZIP",
  localZipImportSubtitle: "从本地 ZIP 压缩包导入技能。",
  localZipDropTitle: "把 ZIP 拖到这里，或使用下面的按钮选择",
  localZipDropHelp: "应用会自动识别压缩包里的 SKILL.md。",
  chooseZip: "选择 ZIP",
  importToStaged: "导入到暂存区",
  installNow: "立即安装",
  addRemoteSource: "添加远程来源",
  addRemoteSourceSubtitle: "支持 GitHub 仓库地址和其他可识别的远程链接。",
  remoteSourceLabel: "远程地址",
  remoteSourcePlaceholder: "https://github.com/... 或 https://example.com/skill.zip",
  analyzeNow: "立即识别",
  addToStaged: "加入暂存区",
  enterRemoteSourceUrl: "请先输入远程来源地址。",
  stagedSources: "暂存来源",
  stagedSourcesSubtitle: "识别结果会显示在这里，成功后可继续安装。",
  toImport: "前往导入",
  parseSelected: "解析所选",
  installSelected: "安装所选",
  removeSelected: "移除所选",
  clearStaging: "清空暂存区",
  stagingAreaEmpty: "暂存区为空",
  stagingAreaEmptyDescription: "先导入 ZIP 或添加远程来源。",
  waitingForMetadataParsing: "等待解析元数据。",
  installedSkills: "已安装技能",
  installedSkillsSubtitle: "浏览当前工作区中已安装的技能。",
  searchPlaceholder: "按名称、slug 或描述搜索",
  noInstalledSkillsYet: "还没有已安装技能",
  noInstalledSkillsYetDescription: "成功安装后，这里会显示技能。",
  operationLogs: "操作日志",
  operationLogsSubtitle: "最近的系统、设置、暂存和安装事件。",
  noLogsYet: "还没有日志",
  noLogsYetDescription: "执行操作后，这里会显示日志。",
  noExtraDetail: "没有更多详情。",
  settingsTitle: "设置",
  settingsSubtitle: "配置安装路径和默认行为。",
  defaultInstallDirectory: "默认安装目录",
  installDirPlaceholder: "选择已安装技能的存放位置",
  tempDirectory: "临时目录",
  tempDirPlaceholderPrefix: "可选临时目录",
  choose: "选择",
  validate: "验证",
  conflictPolicy: "冲突策略",
  conflictRename: "重命名",
  conflictSkip: "跳过",
  conflictOverwrite: "覆盖",
  interfaceLanguage: "界面语言",
  languageChinese: "中文",
  languageEnglish: "英文",
  saveSettings: "保存设置",
  installPathRequired: "需要安装路径",
  installPathRequiredSubtitle: "安装技能前请先设置安装目录",
  installPathRequiredBody: "请先进入设置，配置默认安装目录。",
  installDirectoryWritable: "安装目录可写。",
  installDirectoryInvalid: "安装目录无效或不可写。",
  tempDirectoryEmptyNotice: "临时目录为空，将使用默认运行时目录。",
  tempDirectoryWritable: "临时目录可写。",
  tempDirectoryInvalid: "临时目录无效或不可写。",
  droppedFilePathUnavailable: "当前环境无法获取拖入文件的路径。",
  sourceBadgeLocalZip: "本地 ZIP",
  sourceBadgeGithubRepo: "GitHub 仓库",
  sourceBadgeRemoteZip: "远程 ZIP",
  statusInstalled: "已安装",
  statusReady: "就绪",
  statusError: "错误",
  statusProcessing: "处理中",
  statusPending: "待处理",
  installedSkillDetail: "已安装技能详情",
  installedSkillRecordMissing: "记录仍在，但磁盘上的文件已缺失。",
  rescan: "重新扫描",
  installedStatus: "已安装",
  installPath: "安装路径",
  installedAt: "安装时间",
  noDescriptionExtractedForSkill: "暂未提取到描述。",
  stagedSourceDetail: "暂存来源详情",
  stagedSourceDetailSubtitle: "安装前先查看解析结果和预览。",
  reparse: "重新解析",
  install: "安装",
  sourceValue: "来源值",
  archivePath: "压缩包路径",
  archivePathPending: "尚未生成",
  skillRoot: "技能根目录",
  skillRootPending: "尚未识别",
  errorLabel: "错误",
  noSkillMdPreview: "暂时没有可预览的 SKILL.md。",
  logDetail: "日志详情",
  logType: "类型",
  relatedId: "关联 ID",
  none: "无",
  time: "时间",
  logLevelInfo: "信息",
  logLevelWarning: "警告",
  logLevelError: "错误",
  modalInstalledSkills: "已安装技能",
  modalNoSkills: "未检测到技能",
  providerFound: "已找到",
  providerMissing: "缺失",
  browserFallbackNotice: "当前页面未运行在 Electron 桌面壳中。"
};

const enTranslations: TranslationDictionary = {
  appName: "Control Your Skills",
  appTitle: "Skill Workspace",
  appDescription: "Import, inspect, install, and organize local skills in one place.",
  workspaceHeader: "Workspace",
  runtime: "Runtime",
  runtimeDevData: "Dev data: repository data/",
  runtimeProdData: "Prod data: Electron userData",
  runtimeFrontend: "Frontend",
  runtimeInstallDir: "Install directory",
  unavailable: "Unavailable",
  notConfiguredYet: "Not configured yet",
  loadingWorkspace: "Loading workspace",
  loadingWorkspaceSubtitle: "Reading your current skill data",
  loadingWorkspaceBody: "Please wait while the workspace snapshot is being prepared.",
  refresh: "Refresh",
  openInstallFolder: "Open install folder",
  defaultInstallDirectoryLabel: "Default install directory:",
  sectionOverview: "Overview",
  sectionImport: "Import",
  sectionStaged: "Staged",
  sectionSkills: "Installed skills",
  sectionLogs: "Logs",
  sectionSettings: "Settings",
  overviewInstallDir: "Install directory",
  workspaceSkillDirectories: "Workspace skill directories",
  workspaceSkillDirectoriesSubtitle: "Detected Codex, Claude, and Agents skill locations on this machine.",
  projectDirectories: "Imported projects",
  projectDirectoriesSubtitle: "Projects whose skill folders are being tracked in this workspace.",
  recentInstalls: "Recent installs",
  recentInstallsSubtitle: "The most recently installed skills.",
  recentFailures: "Recent failures",
  recentFailuresSubtitle: "Recent parse or install failures.",
  noInstallRecordsYet: "No install records yet",
  noInstallRecordsYetDescription: "Installed skills will appear here after the first successful install.",
  noRecentFailures: "No recent failures",
  noRecentFailuresDescription: "There are no new failure records right now.",
  noDescriptionAvailable: "No description available.",
  view: "View",
  delete: "Delete",
  importProject: "Import project",
  openFolder: "Open folder",
  skillCount: "Skill count",
  localZipImport: "Import local ZIP",
  localZipImportSubtitle: "Import a skill package from a local ZIP archive.",
  localZipDropTitle: "Drop a ZIP here, or choose one below",
  localZipDropHelp: "The app will detect the SKILL.md inside the archive automatically.",
  chooseZip: "Choose ZIP",
  importToStaged: "Import to staged",
  installNow: "Install now",
  addRemoteSource: "Add remote source",
  addRemoteSourceSubtitle: "Supports GitHub repositories and other recognizable remote links.",
  remoteSourceLabel: "Remote URL",
  remoteSourcePlaceholder: "https://github.com/... or https://example.com/skill.zip",
  analyzeNow: "Analyze now",
  addToStaged: "Add to staged",
  enterRemoteSourceUrl: "Enter a remote source URL first.",
  stagedSources: "Staged sources",
  stagedSourcesSubtitle: "Recognition results appear here and can be installed after they succeed.",
  toImport: "Go to import",
  parseSelected: "Parse selected",
  installSelected: "Install selected",
  removeSelected: "Remove selected",
  clearStaging: "Clear staging",
  stagingAreaEmpty: "Staging area is empty",
  stagingAreaEmptyDescription: "Import a ZIP or add a remote source to start.",
  waitingForMetadataParsing: "Waiting for metadata parsing.",
  installedSkills: "Installed skills",
  installedSkillsSubtitle: "Browse skills already installed in this workspace.",
  searchPlaceholder: "Search by name, slug, or description",
  noInstalledSkillsYet: "No installed skills yet",
  noInstalledSkillsYetDescription: "Installed skills will show up here after a successful install.",
  operationLogs: "Operation logs",
  operationLogsSubtitle: "Recent system, settings, staging, and install events.",
  noLogsYet: "No logs yet",
  noLogsYetDescription: "Logs will appear after operations run.",
  noExtraDetail: "No extra detail.",
  settingsTitle: "Settings",
  settingsSubtitle: "Configure install paths and default behavior.",
  defaultInstallDirectory: "Default install directory",
  installDirPlaceholder: "Choose where installed skills should be stored",
  tempDirectory: "Temporary directory",
  tempDirPlaceholderPrefix: "Optional temp directory",
  choose: "Choose",
  validate: "Validate",
  conflictPolicy: "Conflict policy",
  conflictRename: "Rename",
  conflictSkip: "Skip",
  conflictOverwrite: "Overwrite",
  interfaceLanguage: "Interface language",
  languageChinese: "Chinese",
  languageEnglish: "English",
  saveSettings: "Save settings",
  installPathRequired: "Install path required",
  installPathRequiredSubtitle: "Set an install directory before installing skills",
  installPathRequiredBody: "Open Settings and configure the default install directory first.",
  installDirectoryWritable: "Install directory is writable.",
  installDirectoryInvalid: "Install directory is invalid or not writable.",
  tempDirectoryEmptyNotice: "Temporary directory is empty; the default runtime path will be used.",
  tempDirectoryWritable: "Temporary directory is writable.",
  tempDirectoryInvalid: "Temporary directory is invalid or not writable.",
  droppedFilePathUnavailable: "The dropped file path is unavailable in this environment.",
  sourceBadgeLocalZip: "Local ZIP",
  sourceBadgeGithubRepo: "GitHub repo",
  sourceBadgeRemoteZip: "Remote ZIP",
  statusInstalled: "Installed",
  statusReady: "Ready",
  statusError: "Error",
  statusProcessing: "Processing",
  statusPending: "Pending",
  installedSkillDetail: "Installed skill detail",
  installedSkillRecordMissing: "The record exists, but files are missing on disk.",
  rescan: "Rescan",
  installedStatus: "Installed",
  installPath: "Install path",
  installedAt: "Installed at",
  noDescriptionExtractedForSkill: "No description extracted yet.",
  stagedSourceDetail: "Staged source detail",
  stagedSourceDetailSubtitle: "Review recognition results, installation guidance, and preview content.",
  reparse: "Reparse",
  install: "Install",
  sourceValue: "Source value",
  archivePath: "Archive path",
  archivePathPending: "Not created yet",
  skillRoot: "Skill root",
  skillRootPending: "Not detected yet",
  errorLabel: "Error",
  noSkillMdPreview: "No SKILL.md preview is available yet.",
  logDetail: "Log detail",
  logType: "Type",
  relatedId: "Related ID",
  none: "None",
  time: "Time",
  logLevelInfo: "Info",
  logLevelWarning: "Warning",
  logLevelError: "Error",
  modalInstalledSkills: "Installed skills",
  modalNoSkills: "No skills detected",
  providerFound: "Found",
  providerMissing: "Missing",
  browserFallbackNotice: "This page is not running inside the Electron desktop shell."
};

const translations: Record<Locale, TranslationDictionary> = {
  "zh-CN": zhCnTranslations,
  en: enTranslations
};

function sectionTitle(section: WorkspaceSection, t: TranslationDictionary) {
  switch (section) {
    case "overview":
      return t.sectionOverview;
    case "import":
      return t.sectionImport;
    case "staged":
      return t.sectionStaged;
    case "skills":
      return t.sectionSkills;
    case "logs":
      return t.sectionLogs;
    case "settings":
      return t.sectionSettings;
  }
}

function navLabel(section: WorkspaceSection, t: TranslationDictionary) {
  return sectionTitle(section, t);
}

export function WorkspaceApp({ section, initialSkillId }: WorkspaceAppProps) {
  const router = useRouter();
  const {
    snapshot,
    busyLabel,
    notice,
    error,
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
    rescanInstalledSkill
  } = useSkillManager(initialSkillId);
  const [remoteUrl, setRemoteUrl] = useState("");
  const [selectedStageIds, setSelectedStageIds] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [settingsDraft, setSettingsDraft] = useState<SaveSettingsInput>({
    installDir: "",
    tempDir: "",
    projectDirs: [],
    conflictPolicy: "rename",
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

  const locale = snapshot?.settings.locale || settingsDraft.locale;
  const t = translations[locale];
  const selectedLog = snapshot?.logs.find((item) => item.id === selectedLogId) || null;
  const installPathConfigured = Boolean(snapshot?.settings.installDir.trim());
  const installedSkills = useMemo(() => {
    if (!snapshot) {
      return [];
    }

    const term = searchValue.trim().toLowerCase();
    if (!term) {
      return snapshot.installedSkills;
    }

    return snapshot.installedSkills.filter((skill) => {
      return (
        skill.name.toLowerCase().includes(term) ||
        skill.slug.toLowerCase().includes(term) ||
        skill.description?.toLowerCase().includes(term)
      );
    });
  }, [searchValue, snapshot]);

  useEffect(() => {
    if (!snapshot) {
      return;
    }

    setSettingsDraft({
      installDir: snapshot.settings.installDir || "",
      tempDir: snapshot.settings.tempDir || "",
      projectDirs: snapshot.settings.projectDirs || [],
      conflictPolicy: snapshot.settings.conflictPolicy,
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
    onDropAccepted: (files) => {
      void (async () => {
        const file = files[0];
        if (!file?.path) {
          setError(t.droppedFilePathUnavailable);
          return;
        }

        await importLocalArchive(file.path);
        router.push("/staged");
      })();
    }
  });

  const pendingCount = snapshot?.stagedSources.filter((item) => item.status === "pending").length || 0;
  const failureCount = snapshot?.summary.failedCount || 0;

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

  const openProjectModal = (project: ImportedProjectRecord) => {
    setModalState({
      title: project.name,
      subtitle: project.path,
      sources: project.sources
    });
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
      await installStagedSources([created.id]);
      router.push("/skills");
      return;
    }

    if (created) {
      await loadStagedDetail(created.id);
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
    await installStagedSources([stagedId]);
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
  const showDetailLayout =
    Boolean(detailPanel) && (section === "skills" || section === "staged" || section === "logs");

  return (
    <div className="app-shell app-grid min-h-screen bg-ink-950 text-ink-100">
      <SourceViewerModal
        onClose={() => setModalState(null)}
        onOpenPath={(targetPath) => void openPath(targetPath)}
        open={Boolean(modalState)}
        sources={modalState?.sources || []}
        subtitle={modalState?.subtitle}
        t={t}
        title={modalState?.title || t.modalInstalledSkills}
      />

      {section === "import" && stagedModalOpen && selectedStagedDetail ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-[28px] border border-white/10 bg-ink-950 shadow-panel">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
              <div>
                <h3 className="text-xl font-semibold text-white">
                  {selectedStagedDetail.detectedName || t.stagedSourceDetail}
                </h3>
                <p className="mt-1 text-sm text-ink-200/70">{t.stagedSourceDetailSubtitle}</p>
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

      <div className="grid min-h-screen grid-cols-1 xl:grid-cols-[292px,minmax(0,1fr)]">
        <aside className="app-sidebar">
          <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-signal/16 via-transparent to-ember/8 p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-white/10 bg-black/20 text-white shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
                <PanelLeftOpen className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-signal/80">{t.appName}</p>
                <h1 className="mt-1 text-[1.45rem] font-semibold tracking-tight text-white">{t.appTitle}</h1>
              </div>
            </div>
          </div>

          <nav className="mt-6 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.section === section;
              return (
                <Link
                  key={item.section}
                  className={cn(
                    "group flex items-center justify-between rounded-[24px] border px-4 py-3.5 text-sm transition duration-200",
                    active
                      ? "border-signal/30 bg-signal/15 text-white shadow-[0_16px_36px_rgba(78,180,255,0.12)]"
                      : "border-white/10 bg-white/[0.04] text-ink-200/80 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.07]"
                  )}
                  href={item.href}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-2xl border transition",
                        active
                          ? "border-white/10 bg-white/10"
                          : "border-white/10 bg-black/20 text-ink-200/70 group-hover:border-white/20 group-hover:text-white"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="font-medium">{navLabel(item.section, t)}</span>
                  </span>
                  {item.section === "staged" && pendingCount ? (
                    <span className="rounded-full bg-signal/15 px-2 py-0.5 text-xs text-signal">
                      {pendingCount}
                    </span>
                  ) : null}
                  {item.section === "logs" && failureCount ? (
                    <span className="rounded-full bg-ember/15 px-2 py-0.5 text-xs text-ember">
                      {failureCount}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-h-screen flex-col">
          <header className="app-topbar">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-ink-200/50">{t.workspaceHeader}</p>
                <h2 className="mt-2 text-[2rem] font-semibold tracking-tight text-white">
                  {sectionTitle(section, t)}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-3">
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
                  <RefreshCcw className="h-4 w-4" />
                </button>
                <button
                  aria-label={t.openInstallFolder}
                  className="app-icon-button rounded-2xl"
                  onClick={() => void openPath(snapshot?.settings.installDir || "")}
                  title={t.openInstallFolder}
                  type="button"
                >
                  <FolderOpen className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="inline-flex max-w-full items-center gap-3 rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm text-ink-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <span className="truncate">{snapshot?.settings.installDir || t.notConfiguredYet}</span>
              </div>
              {busyLabel ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-signal/30 bg-signal/10 px-4 py-2 text-sm text-signal">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  {busyLabel}
                </div>
              ) : null}
            </div>
          </header>

          <main className="flex-1 p-6">
            {showDetailLayout ? (
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr),minmax(360px,0.85fr)]">
                <div>
                  <WorkspacePrimarySection
                    dropzone={dropzone}
                    installPathConfigured={installPathConfigured}
                    installedSkills={installedSkills}
                    onClearStaged={clearStagedSources}
                    onImportProject={handleImportProject}
                    onImportZip={importZipWithPicker}
                    onLoadSkillDetail={loadSkillDetail}
                    onLoadStagedDetail={loadStagedDetail}
                    onOpenStagedDetail={openStagedDetailModal}
                    onOpenLogsFromOverview={(logId) => {
                      setSelectedLogId(logId);
                      router.push("/logs");
                    }}
                    onOpenPath={openPath}
                    onOpenProjectModal={openProjectModal}
                    onOpenSkillsFromOverview={async (skillId) => {
                      await loadSkillDetail(skillId);
                      router.push("/skills");
                    }}
                    onOpenSystemSourceModal={openSystemSourceModal}
                    onParseStaged={parseStagedSources}
                    onPickInstallDir={handlePickInstallDir}
                    onPickTempDir={handlePickTempDir}
                    onRemoteAction={handleRemoteAction}
                    onRemoteUrlChange={setRemoteUrl}
                    onRemoveProject={handleRemoveProject}
                    onRemoveStaged={removeStagedSources}
                    onSaveSettings={() => saveSettings(settingsDraft)}
                    onSearchValueChange={setSearchValue}
                    onSelectLog={setSelectedLogId}
                    onToggleStageSelection={toggleStageSelection}
                    onValidateInstallDir={handleValidateInstallDir}
                    onValidateTempDir={handleValidateTempDir}
                    remoteUrl={remoteUrl}
                    searchValue={searchValue}
                    section={section}
                    selectedLogId={selectedLogId}
                    selectedSkillId={selectedSkillId}
                    selectedStageIds={selectedStageIds}
                    selectedStagedId={selectedStagedId}
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
                  onImportProject={handleImportProject}
                  onImportZip={importZipWithPicker}
                  onLoadSkillDetail={loadSkillDetail}
                  onLoadStagedDetail={loadStagedDetail}
                  onOpenStagedDetail={openStagedDetailModal}
                  onOpenLogsFromOverview={(logId) => {
                    setSelectedLogId(logId);
                    router.push("/logs");
                  }}
                  onOpenPath={openPath}
                  onOpenProjectModal={openProjectModal}
                  onOpenSkillsFromOverview={async (skillId) => {
                    await loadSkillDetail(skillId);
                    router.push("/skills");
                  }}
                  onOpenSystemSourceModal={openSystemSourceModal}
                  onParseStaged={parseStagedSources}
                  onPickInstallDir={handlePickInstallDir}
                  onPickTempDir={handlePickTempDir}
                  onRemoteAction={handleRemoteAction}
                  onRemoteUrlChange={setRemoteUrl}
                  onRemoveProject={handleRemoveProject}
                  onRemoveStaged={removeStagedSources}
                  onSaveSettings={() => saveSettings(settingsDraft)}
                  onSearchValueChange={setSearchValue}
                  onSelectLog={setSelectedLogId}
                  onToggleStageSelection={toggleStageSelection}
                  onValidateInstallDir={handleValidateInstallDir}
                  onValidateTempDir={handleValidateTempDir}
                  remoteUrl={remoteUrl}
                  searchValue={searchValue}
                  section={section}
                  selectedLogId={selectedLogId}
                  selectedSkillId={selectedSkillId}
                  selectedStageIds={selectedStageIds}
                  selectedStagedId={selectedStagedId}
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
    </div>
  );
}
