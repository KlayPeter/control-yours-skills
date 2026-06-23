"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { useDropzone } from "react-dropzone";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  FolderPlus,
  FolderOpen,
  HardDriveDownload,
  LayoutDashboard,
  LoaderCircle,
  Logs,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCcw,
  Settings2,
  UploadCloud,
  X
} from "lucide-react";

import type {
  Locale,
  SaveSettingsInput,
  WorkspaceSkillProviderKey,
  WorkspaceSkillSource,
  WorkspaceTreeNode
} from "@shared/contracts";

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
  workspaceSkillDirectories: "系统技能目录",
  workspaceSkillDirectoriesSubtitle: "自动识别这台电脑上的 Codex、Claude 和 Agents 技能目录。",
  projectDirectories: "已导入项目",
  projectDirectoriesSubtitle: "当前工作区正在跟踪的项目技能目录。",
  recentInstalls: "最近安装",
  recentInstallsSubtitle: "最近成功安装的技能。",
  recentFailures: "最近失败",
  recentFailuresSubtitle: "最近的解析或安装失败记录。",
  capabilityOverviewTitle: "这个应用可以帮你做什么",
  capabilityOverviewSubtitle: "先把能力看清楚，再决定从哪一步开始。你可以配置安装目录、导入和暂存 skill、识别系统目录，以及扫描项目里的 skill 文件夹。",
  capabilityInstallTitle: "配置安装目录",
  capabilityInstallBody: "选择一个默认安装目录，后续导入、本地安装和分类管理都会围绕这里展开。",
  capabilityImportTitle: "导入和暂存 skill",
  capabilityImportBody: "支持本地 ZIP 直接导入，也支持 GitHub 仓库和远程 ZIP 先识别再查看说明。",
  capabilitySystemTitle: "识别系统 Skill",
  capabilitySystemBody: "自动扫描 .codex、.claude、.agents 等系统技能目录，方便统一查看和导出。",
  capabilityProjectTitle: "扫描项目 Skill",
  capabilityProjectBody: "导入本地项目后，会继续识别项目目录里的 Skill 文件夹，方便整理和安装。",
  capabilityStatusConfigured: "已配置",
  capabilityStatusNeedsSetup: "待配置",
  overviewMetricInstalled: "已安装 Skill",
  overviewMetricStaged: "暂存来源",
  overviewMetricSystem: "系统目录",
  overviewMetricProjects: "已导入项目",
  projectSkillBrowserSubtitle: "按项目直接浏览识别到的 Skill 文件夹，减少重复查看和弹窗跳转。",
  projectTreeEmpty: "这个项目里还没有识别到可安装的 Skill 文件夹。",
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
  addRemoteSourceSubtitle: "当前支持 GitHub 仓库地址和直链 ZIP。远程来源会先做识别与说明，暂不直接一键安装。",
  remoteSourceLabel: "远程地址",
  remoteSourcePlaceholder: "https://github.com/owner/repo 或 https://example.com/skill.zip",
  analyzeNow: "立即识别",
  addToStaged: "加入暂存区",
  enterRemoteSourceUrl: "请先输入远程来源地址。",
  stagedSources: "暂存来源",
  stagedSourcesSubtitle: "识别结果会显示在这里；本地 ZIP 可直接安装，远程来源当前提供说明和手动步骤。",
  importQueueTitle: "导入后的下一步",
  importQueueSubtitle: "这里不再重复列出全部暂存来源，只保留当前状态摘要。逐条查看、安装或清理请前往暂存区。",
  importQueueInstallable: "可直接安装",
  importQueueManual: "待查看说明",
  importQueueErrors: "需要处理",
  importQueueFootnote: "导入页负责把来源送进暂存区，真正的逐条处理集中在“暂存区”，这样导入、预览、安装三步会更清楚。",
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
  quickStartTitle: "开始使用",
  quickStartSubtitle: "第一次使用时，按这三步走会最顺。",
  quickStartStepInstallTitle: "1. 先设置安装目录",
  quickStartStepInstallBody: "选一个专门存放已安装 skill 的目录，后续导入和导出都会更稳定。",
  quickStartStepImportTitle: "2. 导入第一个 skill",
  quickStartStepImportBody: "推荐先从本地 ZIP 开始，导入后可以先预览再决定是否安装。",
  quickStartStepReviewTitle: "3. 查看暂存结果并安装",
  quickStartStepReviewBody: "解析成功后去暂存区确认内容，再执行安装。",
  quickStartStatusDone: "已完成",
  quickStartStatusTodo: "待完成",
  quickStartChooseInstallDir: "选择安装目录",
  quickStartGoImport: "前往导入",
  quickStartGoStaged: "查看暂存区",
  quickStartStagedDisabled: "导入一个 skill 后，这里会出现可安装结果。",
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
  remoteSourceAnalysisOnly: "远程来源当前只做识别和说明，不会直接安装。",
  stagedNextInstall: "下一步：可以直接安装，或先看详情确认内容。",
  stagedNextManual: "下一步：打开详情查看说明和手动安装步骤。",
  stagedNextError: "下一步：重新解析，或移除这个来源。",
  stagedNextProcessing: "下一步：等待解析完成后再继续。",
  stagedNextPending: "下一步：先触发解析，再决定是否安装。",
  stagedNextInstalled: "下一步：这个来源已经安装完成。",
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
  workspaceSkillDirectories: "System skill directories",
  workspaceSkillDirectoriesSubtitle: "Automatically detect Codex, Claude, and Agents skill directories on this machine.",
  projectDirectories: "Imported projects",
  projectDirectoriesSubtitle: "Projects whose skill folders are being tracked in this workspace.",
  recentInstalls: "Recent installs",
  recentInstallsSubtitle: "The most recently installed skills.",
  recentFailures: "Recent failures",
  recentFailuresSubtitle: "Recent parse or install failures.",
  capabilityOverviewTitle: "What this app helps you do",
  capabilityOverviewSubtitle: "Start by understanding the core capabilities: choose an install directory, import and stage skills, inspect system skill folders, and scan projects for skill directories.",
  capabilityInstallTitle: "Choose an install directory",
  capabilityInstallBody: "Set the default directory where imported skills will be installed and organized.",
  capabilityImportTitle: "Import and stage skills",
  capabilityImportBody: "Import local ZIP packages directly, or analyze GitHub repositories and remote ZIP files before deciding what to do next.",
  capabilitySystemTitle: "Inspect system skills",
  capabilitySystemBody: "Automatically scan .codex, .claude, and .agents directories so you can review and export existing skills.",
  capabilityProjectTitle: "Scan project skills",
  capabilityProjectBody: "Import local projects to detect skill folders already living inside the repository structure.",
  capabilityStatusConfigured: "Configured",
  capabilityStatusNeedsSetup: "Needs setup",
  overviewMetricInstalled: "Installed skills",
  overviewMetricStaged: "Staged sources",
  overviewMetricSystem: "System folders",
  overviewMetricProjects: "Imported projects",
  projectSkillBrowserSubtitle: "Browse detected skill folders directly inside each imported project without jumping between duplicate views.",
  projectTreeEmpty: "No installable skill folders have been detected in this project yet.",
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
  addRemoteSourceSubtitle: "Currently supports GitHub repository URLs and direct ZIP downloads. Remote sources are analyzed first and are not installed in one click yet.",
  remoteSourceLabel: "Remote URL",
  remoteSourcePlaceholder: "https://github.com/owner/repo or https://example.com/skill.zip",
  analyzeNow: "Analyze now",
  addToStaged: "Add to staged",
  enterRemoteSourceUrl: "Enter a remote source URL first.",
  stagedSources: "Staged sources",
  stagedSourcesSubtitle: "Recognition results appear here. Local ZIP sources can be installed directly, while remote sources currently provide guidance and manual steps.",
  importQueueTitle: "What happens after import",
  importQueueSubtitle: "This page now keeps only a compact staging summary. For item-by-item review, install, or cleanup, use the staged section.",
  importQueueInstallable: "Ready to install",
  importQueueManual: "Needs manual review",
  importQueueErrors: "Needs attention",
  importQueueFootnote: "The import page is now focused on bringing sources into staging. Detailed review and follow-up actions live in the staged section.",
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
  quickStartTitle: "Get started",
  quickStartSubtitle: "For a first run, this three-step path is the smoothest one.",
  quickStartStepInstallTitle: "1. Choose an install directory",
  quickStartStepInstallBody: "Pick a dedicated folder for installed skills so imports and exports stay predictable.",
  quickStartStepImportTitle: "2. Import your first skill",
  quickStartStepImportBody: "Starting with a local ZIP is the easiest path because you can preview it before installing.",
  quickStartStepReviewTitle: "3. Review staged results and install",
  quickStartStepReviewBody: "Once parsing succeeds, open the staged area, confirm the details, and install.",
  quickStartStatusDone: "Done",
  quickStartStatusTodo: "To do",
  quickStartChooseInstallDir: "Choose install dir",
  quickStartGoImport: "Go to import",
  quickStartGoStaged: "Open staged",
  quickStartStagedDisabled: "This step becomes available after you import a skill.",
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
  remoteSourceAnalysisOnly: "Remote sources are currently analyzed for review only and are not installed directly.",
  stagedNextInstall: "Next: install this source directly, or open the detail view first.",
  stagedNextManual: "Next: open the detail view for guidance and manual installation steps.",
  stagedNextError: "Next: re-parse this source or remove it from staging.",
  stagedNextProcessing: "Next: wait for parsing to finish before taking action.",
  stagedNextPending: "Next: parse the source before deciding whether to install it.",
  stagedNextInstalled: "Next: this source has already been installed.",
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

function headerPathValue(section: WorkspaceSection, snapshot: ReturnType<typeof useSkillManager>["snapshot"], t: TranslationDictionary) {
  if (!snapshot) {
    return t.notConfiguredYet;
  }

  return snapshot.settings.installDir || t.notConfiguredYet;
}

function readCachedTheme(): "light" | "dark" {
  if (typeof window === "undefined") {
    return "light";
  }

  const cached = window.localStorage.getItem("control-your-skills-theme");
  return cached === "dark" ? "dark" : "light";
}

function SidebarWorkspaceTree({
  rootLabel,
  rootPath,
  nodes,
  onOpenPath
}: {
  rootLabel: string;
  rootPath: string;
  nodes: WorkspaceTreeNode[];
  onOpenPath: (path: string) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/10">
      <button
        className="flex w-full items-center gap-3 px-3 py-3 text-left"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        {open ? <ChevronDown className="h-4 w-4 app-text-soft" /> : <ChevronRight className="h-4 w-4 app-text-soft" />}
        <span className="app-sidebar-project-icon">
          <FolderOpen className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium app-text">{rootLabel}</span>
          <span className="mt-1 block truncate text-xs app-text-soft">{rootPath}</span>
        </span>
      </button>
      {open ? (
        <div className="border-t border-white/10 px-2 py-2">
          <div className="space-y-1">
            {nodes.map((node) => (
              <SidebarWorkspaceTreeNode key={node.id} node={node} onOpenPath={onOpenPath} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SidebarWorkspaceTreeNode({
  node,
  onOpenPath
}: {
  node: WorkspaceTreeNode;
  onOpenPath: (path: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const isFolder = node.kind === "folder";

  return (
    <div>
      <div className="flex items-center gap-2 rounded-xl px-2 py-2 hover:bg-white/5">
        <button
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          onClick={() => {
            if (isFolder) {
              setOpen((current) => !current);
            } else {
              onOpenPath(node.absolutePath);
            }
          }}
          type="button"
        >
          {isFolder ? (
            open ? <ChevronDown className="h-3.5 w-3.5 app-text-soft" /> : <ChevronRight className="h-3.5 w-3.5 app-text-soft" />
          ) : (
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-moss/15 text-[9px] text-moss">S</span>
          )}
          <span className="truncate text-sm app-text">{node.name}</span>
        </button>
        <span className="shrink-0 text-xs app-text-soft">{isFolder ? "Folder" : "Skill"}</span>
      </div>
      {isFolder && open && node.children.length ? (
        <div className="ml-4 border-l border-white/10 pl-2">
          {node.children.map((child) => (
            <SidebarWorkspaceTreeNode key={child.id} node={child} onOpenPath={onOpenPath} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

let globalSidebarCollapsed = false;

export function WorkspaceApp({ section, initialSkillId }: WorkspaceAppProps) {
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
    installWorkspaceSkill
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
    await installWorkspaceSkill({
      sourceRoot,
      skillRootPath,
      providerKey
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
      await installStagedSources([created.id], settingsDraft.defaultSkillCategory || undefined);
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
  const primarySectionCategory = section === "import" ? settingsDraft.defaultSkillCategory : selectedCategoryFilter;

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

      <div className={cn(
        "grid min-h-screen grid-cols-1 xl:h-screen xl:overflow-hidden transition-all duration-300",
        sidebarCollapsed ? "xl:grid-cols-[84px,minmax(0,1fr)]" : "xl:grid-cols-[292px,minmax(0,1fr)]"
      )}>
        <aside className="app-sidebar">
          <div className="app-sidebar-inner">
            <div className={cn("flex items-center gap-3 px-2", sidebarCollapsed && "justify-center px-0")}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] app-surface-subtle app-text shadow-[0_12px_24px_rgba(15,23,42,0.18)]">
                <PanelLeftOpen className="h-4 w-4" />
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0 flex-1 transition-opacity duration-300">
                  <p className="truncate text-sm font-semibold app-text">{t.appName}</p>
                  <p className="mt-0.5 truncate text-xs app-text-soft">{t.appTitle}</p>
                </div>
              )}
            </div>

            <nav className={cn("mt-6 space-y-1.5", sidebarCollapsed && "px-1")}>
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = item.section === section;
                return (
                  <Link
                    key={item.section}
                    className={cn(
                      "app-sidebar-nav-item",
                      active && "app-sidebar-nav-item-active",
                      sidebarCollapsed && "justify-center px-0"
                    )}
                    href={item.href}
                    title={sidebarCollapsed ? navLabel(item.section, t) : undefined}
                  >
                    <span className={cn("flex min-w-0 items-center gap-3", sidebarCollapsed && "justify-center")}>
                      <span className={cn("app-sidebar-nav-icon", active && "app-sidebar-nav-icon-active", sidebarCollapsed && "h-10 w-10 rounded-[12px]")}>
                        <Icon className="h-4 w-4" />
                      </span>
                      {!sidebarCollapsed && <span className="truncate font-medium">{navLabel(item.section, t)}</span>}
                    </span>
                    {!sidebarCollapsed && item.section === "staged" && pendingCount ? (
                      <span className="app-sidebar-count app-sidebar-count-signal">{pendingCount}</span>
                    ) : null}
                    {!sidebarCollapsed && item.section === "logs" && failureCount ? (
                      <span className="app-sidebar-count app-sidebar-count-danger">{failureCount}</span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>

            {!sidebarCollapsed && (
            <section className="mt-8 flex min-h-0 flex-1 flex-col border-t pt-5 transition-opacity" style={{ borderColor: "var(--app-border)" }}>
              <div className="flex items-center justify-between gap-3 px-2">
                <p className="text-xs font-medium tracking-[0.08em] app-text-soft">{t.projectDirectories}</p>
                <button
                  aria-label={t.importProject}
                  className="app-sidebar-ghost-button"
                  onClick={() => void handleImportProject()}
                  title={t.importProject}
                  type="button"
                >
                  <FolderPlus className="h-4 w-4" />
                </button>
              </div>

              <div className="app-scrollbar-hidden mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                {snapshot?.importedProjects.length ? (
                  snapshot.importedProjects.map((project) => (
                    <SidebarWorkspaceTree
                      key={project.id}
                      nodes={project.tree}
                      onOpenPath={(targetPath) => {
                        void openPath(targetPath);
                      }}
                      rootLabel={project.name}
                      rootPath={project.path}
                    />
                  ))
                ) : (
                  <div className="px-3 py-2 text-[12px] opacity-60 app-text-soft">尚未导入项目</div>
                )}
              </div>
            </section>
            )}

            <div className={cn("mt-auto flex pt-4", sidebarCollapsed ? "justify-center" : "justify-end px-2")}>
              <button
                type="button"
                className={cn(
                  "app-icon-button shrink-0 hidden xl:flex transition-transform",
                  sidebarCollapsed ? "h-10 w-10 rounded-[16px]" : "h-8 w-8 rounded-[12px]"
                )}
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                title={sidebarCollapsed ? "展开侧边栏" : "折叠侧边栏"}
              >
                {sidebarCollapsed ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-col xl:h-screen xl:overflow-y-auto">
          <header className="app-topbar">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] app-text-soft">{t.workspaceHeader}</p>
                <h2 className="mt-2 text-[2rem] font-semibold tracking-tight app-text">
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
                  <RefreshCcw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
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
              <div className="app-surface-subtle inline-flex max-w-full items-center gap-3 rounded-[24px] px-4 py-3.5 text-sm app-text-soft shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
                <span className="truncate">{headerPath}</span>
              </div>
              {busyLabel ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-signal/30 bg-signal/10 px-4 py-2 text-sm text-signal">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  {busyLabel}
                </div>
              ) : null}
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
                    onGoImport={() => router.push("/import")}
                    onGoStaged={() => router.push("/staged")}
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
                    onOpenSystemSourceModal={openSystemSourceModal}
                    onInstallStaged={installStagedSources}
                    onParseStaged={parseStagedSources}
                    onPickInstallDir={handlePickInstallDir}
                    onPickTempDir={handlePickTempDir}
                    onRemoteAction={handleRemoteAction}
                    onRemoteUrlChange={setRemoteUrl}
                    onInstallWorkspaceSkill={handleInstallWorkspaceSkill}
                    onRemoveProject={handleRemoveProject}
                    onRemoveStaged={removeStagedSources}
                    onCreateCategory={handleCreateCategory}
                    onCategoryChange={setSelectedCategoryFilter}
                    onSaveSettings={() => saveSettings(settingsDraft)}
                    onSearchValueChange={setSearchValue}
                    onSelectLog={setSelectedLogId}
                    onToggleStageSelection={toggleStageSelection}
                    onValidateInstallDir={handleValidateInstallDir}
                    onValidateTempDir={handleValidateTempDir}
                    newCategoryName={newCategoryName}
                    remoteUrl={remoteUrl}
                    searchValue={searchValue}
                    section={section}
                    selectedCategory={primarySectionCategory}
                    selectedLogId={selectedLogId}
                    selectedSkillId={selectedSkillId}
                    selectedStageIds={selectedStageIds}
                    selectedStagedId={selectedStagedId}
                    onNewCategoryNameChange={setNewCategoryName}
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
                  onGoImport={() => router.push("/import")}
                  onGoStaged={() => router.push("/staged")}
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
                  onOpenSystemSourceModal={openSystemSourceModal}
                  onInstallStaged={installStagedSources}
                  onParseStaged={parseStagedSources}
                  onPickInstallDir={handlePickInstallDir}
                  onPickTempDir={handlePickTempDir}
                  onRemoteAction={handleRemoteAction}
                  onRemoteUrlChange={setRemoteUrl}
                  onInstallWorkspaceSkill={handleInstallWorkspaceSkill}
                  onRemoveProject={handleRemoveProject}
                  onRemoveStaged={removeStagedSources}
                  onCreateCategory={handleCreateCategory}
                  onCategoryChange={setSelectedCategoryFilter}
                  onSaveSettings={() => saveSettings(settingsDraft)}
                  onSearchValueChange={setSearchValue}
                  onSelectLog={setSelectedLogId}
                  onToggleStageSelection={toggleStageSelection}
                  onValidateInstallDir={handleValidateInstallDir}
                  onValidateTempDir={handleValidateTempDir}
                  newCategoryName={newCategoryName}
                  remoteUrl={remoteUrl}
                  searchValue={searchValue}
                  section={section}
                  selectedCategory={primarySectionCategory}
                  selectedLogId={selectedLogId}
                  selectedSkillId={selectedSkillId}
                  selectedStageIds={selectedStageIds}
                  selectedStagedId={selectedStagedId}
                  onNewCategoryNameChange={setNewCategoryName}
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
