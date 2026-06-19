"use client";

import Link from "next/link";
import type { Route } from "next";
import { useMemo, useState } from "react";
import { formatDistanceToNowStrict, formatISO9075 } from "date-fns";
import { useDropzone } from "react-dropzone";
import {
  ArrowRight,
  CheckCircle2,
  Database,
  FolderOpen,
  HardDriveDownload,
  LayoutDashboard,
  ListTodo,
  LoaderCircle,
  Logs,
  RefreshCcw,
  Search,
  Settings2,
  ShieldAlert,
  Sparkles,
  UploadCloud
} from "lucide-react";

import type {
  InstalledSkillRecord,
  LogRecord,
  SaveSettingsInput,
  SourceStatus,
  StagedSourceRecord
} from "@shared/contracts";

import { useSkillManager } from "@/hooks/use-skill-manager";
import { cn } from "@/lib/cn";
import { isDesktopApiAvailable } from "@/lib/electron-api";
import { MarkdownViewer } from "@/components/markdown-viewer";

type WorkspaceSection = "overview" | "import" | "staged" | "skills" | "logs" | "settings";

interface WorkspaceAppProps {
  section: WorkspaceSection;
  initialSkillId?: string;
}

const navItems: Array<{
  section: WorkspaceSection;
  href: Route;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { section: "overview", href: "/", label: "总览", icon: LayoutDashboard },
  { section: "import", href: "/import", label: "导入", icon: UploadCloud },
  { section: "staged", href: "/staged", label: "暂存区", icon: ListTodo },
  { section: "skills", href: "/skills", label: "已安装", icon: HardDriveDownload },
  { section: "logs", href: "/logs", label: "日志", icon: Logs },
  { section: "settings", href: "/settings", label: "设置", icon: Settings2 }
];

function formatRelativeTime(value: string) {
  return `${formatDistanceToNowStrict(new Date(value), { addSuffix: true })} · ${formatISO9075(
    new Date(value)
  )}`;
}

function sectionTitle(section: WorkspaceSection) {
  switch (section) {
    case "overview":
      return "总览";
    case "import":
      return "导入";
    case "staged":
      return "暂存区";
    case "skills":
      return "已安装";
    case "logs":
      return "日志";
    case "settings":
      return "设置";
    default:
      return "Skill Manager";
  }
}

function statusTone(status: SourceStatus) {
  if (status === "installed") {
    return "text-moss bg-moss/15 border-moss/25";
  }

  if (status === "ready") {
    return "text-signal bg-signal/15 border-signal/25";
  }

  if (status === "error") {
    return "text-ember bg-ember/15 border-ember/25";
  }

  if (status === "processing") {
    return "text-amber-200 bg-amber-300/10 border-amber-300/20";
  }

  return "text-ink-100/80 bg-white/5 border-white/10";
}

function SectionCard({
  title,
  subtitle,
  actions,
  children
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-5 shadow-panel backdrop-blur">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {subtitle ? <p className="text-sm text-ink-200/75">{subtitle}</p> : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

function StatCard({
  label,
  value,
  accent
}: {
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
      <p className="text-sm uppercase tracking-[0.22em] text-ink-200/65">{label}</p>
      <div className={cn("mt-4 text-3xl font-semibold tracking-tight", accent)}>{value}</div>
    </div>
  );
}

function EmptyState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-white/15 bg-black/20 px-5 py-8 text-center">
      <p className="text-base font-medium text-white">{title}</p>
      <p className="mt-2 text-sm text-ink-200/70">{description}</p>
    </div>
  );
}

function SourceBadge({ source }: { source: StagedSourceRecord["sourceType"] | InstalledSkillRecord["sourceType"] }) {
  const label =
    source === "localZip" ? "Local ZIP" : source === "githubRepo" ? "GitHub Repo" : "Remote ZIP";

  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs uppercase tracking-[0.16em] text-ink-200/70">
      {label}
    </span>
  );
}

function logTone(log: LogRecord) {
  if (log.level === "error") {
    return "text-ember";
  }

  if (log.level === "warning") {
    return "text-amber-200";
  }

  return "text-moss";
}

export function WorkspaceApp({ section, initialSkillId }: WorkspaceAppProps) {
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
    refresh,
    loadSkillDetail,
    loadStagedDetail,
    saveSettings,
    validateDirectory,
    importLocalArchive,
    addRemoteSource,
    parseStagedSources,
    installStagedSources,
    clearStagedSources,
    openPath,
    pickArchiveFile,
    pickDirectory,
    rescanInstalledSkill
  } = useSkillManager(initialSkillId);
  const [remoteUrl, setRemoteUrl] = useState("");
  const [selectedStageIds, setSelectedStageIds] = useState<string[]>([]);
  const [lastImportedId, setLastImportedId] = useState<string | null>(null);
  const [settingsDraft, setSettingsDraft] = useState<SaveSettingsInput | null>(null);
  const [searchValue, setSearchValue] = useState("");

  const isDesktop = isDesktopApiAvailable();
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
        skill.description?.toLowerCase().includes(term) ||
        skill.slug.toLowerCase().includes(term)
      );
    });
  }, [searchValue, snapshot]);

  if (snapshot && !settingsDraft) {
    setSettingsDraft({
      installDir: snapshot.settings.installDir,
      tempDir: snapshot.settings.tempDir,
      conflictPolicy: snapshot.settings.conflictPolicy
    });
  }

  const selectedLog = snapshot?.logs.find((log) => log.id === selectedLogId) || null;

  const onDrop = async (files: File[]) => {
    const firstFile = files[0];
    if (!firstFile?.path) {
      setError("当前拖拽未暴露本地路径，请改用“选择 ZIP 文件”按钮。");
      return;
    }

    const imported = await importLocalArchive(firstFile.path);
    if (imported) {
      setLastImportedId(imported.id);
    }
  };

  const dropzone = useDropzone({
    onDropAccepted: (acceptedFiles) => {
      void onDrop(acceptedFiles);
    },
    accept: {
      "application/zip": [".zip"]
    },
    multiple: false
  });

  const toggleStageSelection = (id: string) => {
    setSelectedStageIds((current) =>
      current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id]
    );
  };

  const pending = snapshot?.stagedSources.filter((item) => item.status === "pending").length || 0;
  const failures = snapshot?.summary.failedCount || 0;

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="已安装" value={snapshot?.summary.installedCount || 0} accent="text-moss" />
        <StatCard label="暂存待处理" value={snapshot?.summary.stagedCount || 0} accent="text-signal" />
        <StatCard label="可安装" value={snapshot?.summary.readyCount || 0} accent="text-white" />
        <StatCard label="失败记录" value={snapshot?.summary.failedCount || 0} accent="text-ember" />
      </div>

      <SectionCard
        title="当前工作台状态"
        subtitle="围绕 MVP 主链路的运行时信息和最近活动"
        actions={
          <button
            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-ink-100/80 transition hover:bg-white/10"
            onClick={() => void refresh()}
            type="button"
          >
            刷新快照
          </button>
        }
      >
        <div className="grid gap-4 lg:grid-cols-[1.4fr,1fr]">
          <div className="space-y-3 rounded-3xl border border-white/10 bg-black/20 p-4">
            <p className="text-sm uppercase tracking-[0.18em] text-ink-200/65">运行环境</p>
            <div className="space-y-2 text-sm text-ink-100/80">
              <p>模式：{snapshot?.runtime.isDevelopment ? "Development / repo data" : "Production / userData"}</p>
              <p>安装目录：{snapshot?.settings.installDir}</p>
              <p>数据库：{snapshot?.runtime.databasePath}</p>
              <p>日志目录：{snapshot?.runtime.logsRoot}</p>
            </div>
          </div>
          <div className="space-y-3 rounded-3xl border border-white/10 bg-black/20 p-4">
            <p className="text-sm uppercase tracking-[0.18em] text-ink-200/65">快捷入口</p>
            <div className="grid gap-3">
              <Link
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-white/10"
                href="/import"
              >
                打开导入工作区 <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-white/10"
                href="/staged"
              >
                处理暂存区来源 <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-white/10"
                href="/skills"
              >
                浏览已安装 Skill <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="最近安装" subtitle="展示最近写入安装目录的 Skill">
          {snapshot?.summary.recentInstalls.length ? (
            <div className="space-y-3">
              {snapshot.summary.recentInstalls.map((skill) => (
                <button
                  key={skill.id}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-left transition hover:border-signal/30 hover:bg-white/5"
                  onClick={() => void loadSkillDetail(skill.id)}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{skill.name}</p>
                    <SourceBadge source={skill.sourceType} />
                  </div>
                  <p className="mt-2 text-sm text-ink-200/75">
                    {skill.description || "当前 Skill 尚未提供简介。"}
                  </p>
                  <p className="mt-3 text-xs text-ink-200/55">{formatRelativeTime(skill.installedAt)}</p>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState title="还没有安装记录" description="从导入页选择一个 ZIP 或把远程来源加入暂存区开始。" />
          )}
        </SectionCard>

        <SectionCard title="最近失败" subtitle="帮助快速定位导入、解析或安装失败原因">
          {snapshot?.summary.recentFailures.length ? (
            <div className="space-y-3">
              {snapshot.summary.recentFailures.map((log) => (
                <button
                  key={log.id}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-left transition hover:border-ember/30 hover:bg-white/5"
                  onClick={() => setSelectedLogId(log.id)}
                  type="button"
                >
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="h-4 w-4 text-ember" />
                    <p className="font-medium text-white">{log.message}</p>
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm text-ink-200/75">{log.detail || "无额外错误细节。"}</p>
                  <p className="mt-3 text-xs text-ink-200/55">{formatRelativeTime(log.createdAt)}</p>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState title="暂无失败记录" description="当前导入链路状态良好，失败日志会在这里集中显示。" />
          )}
        </SectionCard>
      </div>
    </div>
  );

  const renderImport = () => (
    <div className="space-y-6">
      <SectionCard title="本地 ZIP 导入" subtitle="优先打通本地 ZIP 的最短闭环：导入、识别、安装、浏览。">
        <div
          {...dropzone.getRootProps()}
          className={cn(
            "rounded-[28px] border border-dashed p-8 text-center transition",
            dropzone.isDragActive
              ? "border-signal bg-signal/10"
              : "border-white/15 bg-black/20 hover:border-white/30 hover:bg-white/5"
          )}
        >
          <input {...dropzone.getInputProps()} />
          <UploadCloud className="mx-auto h-10 w-10 text-signal" />
          <p className="mt-4 text-lg font-medium text-white">拖入 ZIP 文件，或使用下方按钮选择</p>
          <p className="mt-2 text-sm text-ink-200/70">
            当前支持根目录或单层子目录中包含 <code>SKILL.md</code> 的 Skill 压缩包
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              className="rounded-full bg-signal px-4 py-2 text-sm font-medium text-ink-950 transition hover:brightness-110"
              onClick={async () => {
                const result = await pickArchiveFile();
                if (result.ok && result.data) {
                  const imported = await importLocalArchive(result.data);
                  if (imported) {
                    setLastImportedId(imported.id);
                  }
                }
              }}
              type="button"
            >
              选择 ZIP 文件
            </button>
            {lastImportedId ? (
              <button
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
                onClick={() => void installStagedSources([lastImportedId])}
                type="button"
              >
                安装刚导入项
              </button>
            ) : null}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="远程来源录入" subtitle="将 GitHub 仓库或直接 ZIP 下载地址先放入暂存区，再执行解析和批量安装。">
        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
          <label className="block text-sm font-medium text-white" htmlFor="remote-url">
            GitHub 仓库 / ZIP 地址
          </label>
          <div className="mt-3 flex flex-col gap-3 lg:flex-row">
            <input
              className="h-12 flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition placeholder:text-ink-200/40 focus:border-signal/45"
              id="remote-url"
              onChange={(event) => setRemoteUrl(event.target.value)}
              placeholder="https://github.com/owner/repo 或 https://example.com/skill.zip"
              value={remoteUrl}
            />
            <button
              className="h-12 rounded-2xl bg-ember px-5 text-sm font-medium text-ink-950 transition hover:brightness-110"
              onClick={async () => {
                if (!remoteUrl.trim()) {
                  setError("请输入一个远程地址。");
                  return;
                }

                await addRemoteSource(remoteUrl);
                setRemoteUrl("");
              }}
              type="button"
            >
              加入暂存区
            </button>
          </div>
          <p className="mt-3 text-sm text-ink-200/65">
            MVP 阶段支持 GitHub 仓库整体 ZIP 下载，以及直接以 <code>.zip</code> 结尾的远程下载地址。
          </p>
        </div>
      </SectionCard>
    </div>
  );

  const renderStaged = () => (
    <div className="space-y-6">
      <SectionCard
        title="暂存来源列表"
        subtitle="从这里统一解析、安装、删除，避免远程来源一步直装带来的不确定性。"
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
              onClick={() => void parseStagedSources(selectedStageIds.length ? selectedStageIds : snapshot?.stagedSources.map((item) => item.id) || [])}
              type="button"
            >
              批量解析
            </button>
            <button
              className="rounded-full bg-moss px-3 py-2 text-sm font-medium text-ink-950 transition hover:brightness-110"
              onClick={() => void installStagedSources(selectedStageIds.length ? selectedStageIds : snapshot?.stagedSources.filter((item) => item.status === "ready").map((item) => item.id) || [])}
              type="button"
            >
              批量安装
            </button>
            <button
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
              onClick={() => void clearStagedSources()}
              type="button"
            >
              清空暂存区
            </button>
          </div>
        }
      >
        {snapshot?.stagedSources.length ? (
          <div className="space-y-3">
            {snapshot.stagedSources.map((item) => (
              <button
                key={item.id}
                className={cn(
                  "w-full rounded-3xl border p-4 text-left transition",
                  selectedStagedId === item.id
                    ? "border-signal/45 bg-signal/10"
                    : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/5"
                )}
                onClick={() => void loadStagedDetail(item.id)}
                type="button"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <input
                      checked={selectedStageIds.includes(item.id)}
                      className="mt-1 h-4 w-4 rounded border-white/20 bg-black/30"
                      onChange={() => toggleStageSelection(item.id)}
                      onClick={(event) => event.stopPropagation()}
                      type="checkbox"
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-white">{item.detectedName || item.sourceValue}</p>
                        <SourceBadge source={item.sourceType} />
                      </div>
                      <p className="mt-2 text-sm text-ink-200/75">
                        {item.detectedDescription || item.errorMessage || "等待解析后展示 Skill 摘要。"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs uppercase tracking-[0.16em]",
                      statusTone(item.status)
                    )}
                  >
                    {item.status}
                  </span>
                </div>
                <p className="mt-3 text-xs text-ink-200/55">{formatRelativeTime(item.updatedAt)}</p>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState title="暂存区还是空的" description="从导入页加入本地 ZIP 或远程来源后，这里会统一展示处理状态。" />
        )}
      </SectionCard>
    </div>
  );

  const renderSkills = () => (
    <div className="space-y-6">
      <SectionCard title="已安装 Skill 列表" subtitle="支持搜索、浏览来源、查看安装路径和打开对应目录。">
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4">
          <Search className="h-4 w-4 text-ink-200/65" />
          <input
            className="h-12 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-ink-200/40"
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="搜索名称、slug 或描述"
            value={searchValue}
          />
        </div>
        {installedSkills.length ? (
          <div className="space-y-3">
            {installedSkills.map((skill) => (
              <button
                key={skill.id}
                className={cn(
                  "w-full rounded-3xl border p-4 text-left transition",
                  selectedSkillId === skill.id
                    ? "border-moss/45 bg-moss/10"
                    : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/5"
                )}
                onClick={() => void loadSkillDetail(skill.id)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-white">{skill.name}</p>
                      <SourceBadge source={skill.sourceType} />
                    </div>
                    <p className="mt-2 text-sm text-ink-200/75">
                      {skill.description || "当前 Skill 尚未提供描述。"}
                    </p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-moss" />
                </div>
                <p className="mt-3 text-xs text-ink-200/55">{formatRelativeTime(skill.installedAt)}</p>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState title="还没有已安装 Skill" description="把本地 ZIP 安装进默认目录后，这里会立刻出现详细记录。" />
        )}
      </SectionCard>
    </div>
  );

  const renderLogs = () => (
    <div className="space-y-6">
      <SectionCard title="操作日志" subtitle="聚合设置保存、暂存处理、安装成功与失败记录，便于定位问题。">
        {snapshot?.logs.length ? (
          <div className="space-y-3">
            {snapshot.logs.map((log) => (
              <button
                key={log.id}
                className={cn(
                  "w-full rounded-3xl border p-4 text-left transition",
                  selectedLogId === log.id
                    ? "border-ember/45 bg-ember/10"
                    : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/5"
                )}
                onClick={() => setSelectedLogId(log.id)}
                type="button"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className={cn("font-medium", logTone(log))}>{log.message}</p>
                  <span className="text-xs uppercase tracking-[0.16em] text-ink-200/55">{log.level}</span>
                </div>
                <p className="mt-2 text-sm text-ink-200/75">{log.detail || "无额外详情"}</p>
                <p className="mt-3 text-xs text-ink-200/55">{formatRelativeTime(log.createdAt)}</p>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState title="日志还是空的" description="保存设置、导入 ZIP、解析来源和安装 Skill 后，这里会自动补全记录。" />
        )}
      </SectionCard>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <SectionCard title="默认目录与安装策略" subtitle="采用开发环境仓库 data/，生产环境 userData 的双模式存储策略。">
        {settingsDraft ? (
          <div className="space-y-5 rounded-3xl border border-white/10 bg-black/20 p-5">
            <div>
              <label className="block text-sm font-medium text-white" htmlFor="install-dir">
                默认安装目录
              </label>
              <div className="mt-3 flex flex-col gap-3 xl:flex-row">
                <input
                  className="h-12 flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition placeholder:text-ink-200/40 focus:border-signal/45"
                  id="install-dir"
                  onChange={(event) =>
                    setSettingsDraft((current) =>
                      current ? { ...current, installDir: event.target.value } : current
                    )
                  }
                  value={settingsDraft.installDir}
                />
                <button
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
                  onClick={async () => {
                    const result = await pickDirectory(settingsDraft.installDir);
                    if (result.ok && result.data) {
                      setSettingsDraft((current) =>
                        current ? { ...current, installDir: result.data || current.installDir } : current
                      );
                    }
                  }}
                  type="button"
                >
                  选择目录
                </button>
                <button
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
                  onClick={async () => {
                    const result = await validateDirectory(settingsDraft.installDir);
                    setNotice(result.writable ? "安装目录可用。" : result.error || "安装目录不可用。");
                  }}
                  type="button"
                >
                  检查目录
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white" htmlFor="temp-dir">
                临时缓存目录
              </label>
              <div className="mt-3 flex flex-col gap-3 xl:flex-row">
                <input
                  className="h-12 flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition placeholder:text-ink-200/40 focus:border-signal/45"
                  id="temp-dir"
                  onChange={(event) =>
                    setSettingsDraft((current) =>
                      current ? { ...current, tempDir: event.target.value } : current
                    )
                  }
                  value={settingsDraft.tempDir}
                />
                <button
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
                  onClick={async () => {
                    const result = await pickDirectory(settingsDraft.tempDir);
                    if (result.ok && result.data) {
                      setSettingsDraft((current) =>
                        current ? { ...current, tempDir: result.data || current.tempDir } : current
                      );
                    }
                  }}
                  type="button"
                >
                  选择目录
                </button>
                <button
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
                  onClick={async () => {
                    const result = await validateDirectory(settingsDraft.tempDir);
                    setNotice(result.writable ? "临时目录可用。" : result.error || "临时目录不可用。");
                  }}
                  type="button"
                >
                  检查目录
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white" htmlFor="conflict-policy">
                冲突处理策略
              </label>
              <select
                className="mt-3 h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none focus:border-signal/45"
                id="conflict-policy"
                onChange={(event) =>
                  setSettingsDraft((current) =>
                    current
                      ? {
                          ...current,
                          conflictPolicy: event.target.value as SaveSettingsInput["conflictPolicy"]
                        }
                      : current
                  )
                }
                value={settingsDraft.conflictPolicy}
              >
                <option value="rename">重命名安装</option>
                <option value="skip">跳过冲突项</option>
                <option value="overwrite">覆盖已有目录</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                className="rounded-full bg-signal px-5 py-2.5 text-sm font-medium text-ink-950 transition hover:brightness-110"
                onClick={() => void saveSettings(settingsDraft)}
                type="button"
              >
                保存设置
              </button>
              <button
                className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white transition hover:bg-white/10"
                onClick={() => void openPath(snapshot?.settings.installDir || settingsDraft.installDir)}
                type="button"
              >
                打开安装目录
              </button>
            </div>
          </div>
        ) : null}
      </SectionCard>
    </div>
  );

  const renderPrimarySection = () => {
    if (!snapshot) {
      return (
        <SectionCard title="正在加载工作台" subtitle="准备读取设置、暂存记录和已安装 Skill 清单。">
          <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-black/20 p-5 text-sm text-ink-200/70">
            <LoaderCircle className="h-5 w-5 animate-spin text-signal" />
            正在初始化本地数据快照...
          </div>
        </SectionCard>
      );
    }

    switch (section) {
      case "overview":
        return renderOverview();
      case "import":
        return renderImport();
      case "staged":
        return renderStaged();
      case "skills":
        return renderSkills();
      case "logs":
        return renderLogs();
      case "settings":
        return renderSettings();
      default:
        return null;
    }
  };

  const renderDetailPanel = () => {
    if (!snapshot) {
      return null;
    }

    if (section === "skills" && selectedSkillDetail) {
      return (
        <SectionCard
          title={selectedSkillDetail.name}
          subtitle={selectedSkillDetail.exists ? "已安装 Skill 详情" : "安装记录存在，但本地文件缺失"}
          actions={
            <div className="flex gap-2">
              <button
                className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
                onClick={() => void openPath(selectedSkillDetail.installPath)}
                type="button"
              >
                打开目录
              </button>
              <button
                className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
                onClick={() => void rescanInstalledSkill(selectedSkillDetail.id)}
                type="button"
              >
                重扫
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4 text-sm text-ink-100/80">
              <div className="flex flex-wrap items-center gap-2">
                <SourceBadge source={selectedSkillDetail.sourceType} />
                <span className="rounded-full border border-moss/25 bg-moss/10 px-2.5 py-1 text-xs uppercase tracking-[0.16em] text-moss">
                  installed
                </span>
              </div>
              <p className="mt-3">{selectedSkillDetail.description || "当前 Skill 没有提取到描述。"} </p>
              <div className="mt-4 space-y-1 text-xs text-ink-200/60">
                <p>安装路径：{selectedSkillDetail.installPath}</p>
                <p>SKILL.md：{selectedSkillDetail.skillMdPath}</p>
                <p>安装时间：{formatRelativeTime(selectedSkillDetail.installedAt)}</p>
              </div>
            </div>
            <MarkdownViewer markdown={selectedSkillDetail.markdown} />
          </div>
        </SectionCard>
      );
    }

    if (section === "staged" && selectedStagedDetail) {
      return (
        <SectionCard
          title={selectedStagedDetail.detectedName || "暂存项详情"}
          subtitle="查看解析结果、错误信息和 SKILL.md 预览"
          actions={
            <div className="flex gap-2">
              <button
                className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
                onClick={() => void parseStagedSources([selectedStagedDetail.id])}
                type="button"
              >
                重新解析
              </button>
              <button
                className="rounded-full bg-moss px-3 py-2 text-sm font-medium text-ink-950 transition hover:brightness-110"
                onClick={() => void installStagedSources([selectedStagedDetail.id])}
                type="button"
              >
                安装
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4 text-sm text-ink-100/80">
              <div className="flex flex-wrap items-center gap-2">
                <SourceBadge source={selectedStagedDetail.sourceType} />
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs uppercase tracking-[0.16em]",
                    statusTone(selectedStagedDetail.status)
                  )}
                >
                  {selectedStagedDetail.status}
                </span>
              </div>
              <p className="mt-3">{selectedStagedDetail.detectedDescription || selectedStagedDetail.sourceValue}</p>
              <div className="mt-4 space-y-1 text-xs text-ink-200/60">
                <p>来源地址：{selectedStagedDetail.sourceValue}</p>
                <p>归档文件：{selectedStagedDetail.archivePath || "尚未生成"}</p>
                <p>Skill 根目录：{selectedStagedDetail.skillRootPath || "尚未识别"}</p>
                {selectedStagedDetail.errorMessage ? <p>错误信息：{selectedStagedDetail.errorMessage}</p> : null}
              </div>
            </div>
            <MarkdownViewer markdown={selectedStagedDetail.markdown} emptyMessage="当前暂存项还没有可展示的 SKILL.md 预览。" />
          </div>
        </SectionCard>
      );
    }

    if (section === "logs" && selectedLog) {
      return (
        <SectionCard title="日志详情" subtitle={selectedLog.message}>
          <div className="space-y-4 rounded-3xl border border-white/10 bg-black/20 p-4 text-sm text-ink-100/80">
            <p className={cn("font-medium", logTone(selectedLog))}>{selectedLog.level.toUpperCase()}</p>
            <p>{selectedLog.detail || "没有更多细节。"} </p>
            <div className="space-y-1 text-xs text-ink-200/60">
              <p>类型：{selectedLog.type}</p>
              <p>关联对象：{selectedLog.relatedId || "无"}</p>
              <p>时间：{formatRelativeTime(selectedLog.createdAt)}</p>
            </div>
          </div>
        </SectionCard>
      );
    }

    return (
      <SectionCard title="工作台说明" subtitle="当前页的关键提示和建议操作">
        <div className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-black/20 p-4 text-sm text-ink-100/80">
            <div className="flex items-center gap-2 text-white">
              <Sparkles className="h-4 w-4 text-signal" />
              <p className="font-medium">当前阶段聚焦 MVP 主链路</p>
            </div>
            <p className="mt-3">
              先完成「导入 -&gt; 暂存 -&gt; 安装 -&gt; 浏览」闭环，再继续强化冲突处理、卸载与更复杂的远程来源。
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/20 p-4 text-sm text-ink-100/80">
            <p className="font-medium text-white">建议下一步</p>
            <ul className="mt-3 space-y-2 text-ink-200/75">
              <li>1. 在导入页放入一个本地 ZIP，确认识别和暂存正常。</li>
              <li>2. 在暂存区执行解析或安装，查看状态流转。</li>
              <li>3. 在已安装页验证 `SKILL.md` 详情与目录打开能力。</li>
            </ul>
          </div>
          {!isDesktop ? (
            <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">
              当前页面运行在浏览器回退模式，桌面能力（文件对话框、本地目录打开、SQLite 数据）只有在 Electron 桌面壳里可用。
            </div>
          ) : null}
        </div>
      </SectionCard>
    );
  };

  return (
    <div className="min-h-screen bg-ink-950 text-ink-100">
      <div className="grid min-h-screen grid-cols-1 xl:grid-cols-[272px,minmax(0,1fr)]">
        <aside className="border-b border-white/10 bg-black/25 p-5 backdrop-blur xl:border-b-0 xl:border-r">
          <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-signal/18 via-transparent to-ember/10 p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-signal/80">Control Your Skills</p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white">Skill Manager</h1>
            <p className="mt-2 text-sm text-ink-200/70">
              面向本地优先工作流的桌面 Skill 安装与管理台。
            </p>
          </div>

          <nav className="mt-6 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.section === section;
              return (
                <Link
                  key={item.section}
                  className={cn(
                    "flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition",
                    isActive
                      ? "border-signal/30 bg-signal/15 text-white"
                      : "border-white/10 bg-white/5 text-ink-200/80 hover:bg-white/10"
                  )}
                  href={item.href}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  {item.section === "staged" && pending ? (
                    <span className="rounded-full bg-signal/15 px-2 py-0.5 text-xs text-signal">{pending}</span>
                  ) : null}
                  {item.section === "logs" && failures ? (
                    <span className="rounded-full bg-ember/15 px-2 py-0.5 text-xs text-ember">{failures}</span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 space-y-3 rounded-[28px] border border-white/10 bg-black/20 p-4 text-sm text-ink-200/75">
            <div className="flex items-center gap-2 text-white">
              <Database className="h-4 w-4 text-signal" />
              数据与运行
            </div>
            <p>开发数据：仓库下 `data/`</p>
            <p>生产数据：Electron `userData`</p>
            <p>当前安装目录：{snapshot?.settings.installDir || "加载中..."}</p>
          </div>
        </aside>

        <div className="flex min-h-screen flex-col">
          <header className="border-b border-white/10 bg-black/20 px-6 py-4 backdrop-blur">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-ink-200/55">MVP Workspace</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">{sectionTitle(section)}</h2>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
                  onClick={() => {
                    setNotice(null);
                    setError(null);
                    void refresh();
                  }}
                  type="button"
                >
                  <span className="flex items-center gap-2">
                    <RefreshCcw className="h-4 w-4" />
                    刷新
                  </span>
                </button>
                <button
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
                  onClick={() => void openPath(snapshot?.settings.installDir || "")}
                  type="button"
                >
                  <span className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4" />
                    打开安装目录
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 xl:grid-cols-[1.4fr,auto] xl:items-center">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-ink-200/80">
                <span className="text-ink-200/55">当前默认安装目录：</span> {snapshot?.settings.installDir || "加载中..."}
              </div>
              {busyLabel ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-signal/30 bg-signal/10 px-4 py-2 text-sm text-signal">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  {busyLabel}
                </div>
              ) : null}
            </div>

            {notice ? (
              <div className="mt-3 rounded-2xl border border-moss/20 bg-moss/10 px-4 py-3 text-sm text-moss">
                {notice}
              </div>
            ) : null}
            {error ? (
              <div className="mt-3 rounded-2xl border border-ember/20 bg-ember/10 px-4 py-3 text-sm text-ember">
                {error}
              </div>
            ) : null}
          </header>

          <div className="grid flex-1 gap-6 p-6 2xl:grid-cols-[minmax(0,1.35fr),400px]">
            <main className="space-y-6">{renderPrimarySection()}</main>
            <aside className="space-y-6">{renderDetailPanel()}</aside>
          </div>
        </div>
      </div>
    </div>
  );
}
