"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNowStrict, formatISO9075 } from "date-fns";
import { useDropzone } from "react-dropzone";
import {
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
  StagedSourceRecord,
  WorkspaceSkillProviderKey,
  WorkspaceSkillSource
} from "@shared/contracts";

import { MarkdownViewer } from "@/components/markdown-viewer";
import { useSkillManager } from "@/hooks/use-skill-manager";
import { cn } from "@/lib/cn";
import { isDesktopApiAvailable } from "@/lib/electron-api";

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
  { section: "overview", href: "/", label: "Overview", icon: LayoutDashboard },
  { section: "import", href: "/import", label: "Import", icon: UploadCloud },
  { section: "staged", href: "/staged", label: "Staging", icon: ListTodo },
  { section: "skills", href: "/skills", label: "Installed", icon: HardDriveDownload },
  { section: "logs", href: "/logs", label: "Logs", icon: Logs },
  { section: "settings", href: "/settings", label: "Settings", icon: Settings2 }
];

function formatRelativeTime(value: string) {
  return `${formatDistanceToNowStrict(new Date(value), { addSuffix: true })} | ${formatISO9075(
    new Date(value)
  )}`;
}

function sectionTitle(section: WorkspaceSection) {
  switch (section) {
    case "overview":
      return "Overview";
    case "import":
      return "Import";
    case "staged":
      return "Staging";
    case "skills":
      return "Installed Skills";
    case "logs":
      return "Logs";
    case "settings":
      return "Settings";
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

function providerMonogram(key: WorkspaceSkillProviderKey) {
  switch (key) {
    case "codex":
      return "CX";
    case "claude":
      return "CL";
    case "agent":
      return "AG";
    case "agents":
      return "AS";
    default:
      return "SK";
  }
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

function WorkspaceSourcesGrid({
  sources,
  selectedKey,
  onSelect
}: {
  sources: WorkspaceSkillSource[];
  selectedKey: WorkspaceSkillProviderKey | null;
  onSelect: (key: WorkspaceSkillProviderKey) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {sources.map((source) => {
        const active = source.key === selectedKey;
        return (
          <button
            key={source.key}
            className={cn(
              "rounded-3xl border p-4 text-left transition",
              active
                ? "border-signal/40 bg-signal/10"
                : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/5"
            )}
            onClick={() => onSelect(source.key)}
            type="button"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm font-semibold text-white">
                  {providerMonogram(source.key)}
                </div>
                <div>
                  <p className="font-medium text-white">{source.label}</p>
                  <p className="text-sm text-ink-200/65">{source.directoryName}</p>
                </div>
              </div>
              <span
                className={cn(
                  "rounded-full border px-2 py-1 text-xs uppercase tracking-[0.15em]",
                  source.exists
                    ? "border-moss/20 bg-moss/10 text-moss"
                    : "border-white/10 bg-white/5 text-ink-200/60"
                )}
              >
                {source.exists ? "Found" : "Missing"}
              </span>
            </div>
            <p className="mt-4 text-sm text-ink-200/75">
              {source.exists
                ? `${source.skillCount} skill${source.skillCount === 1 ? "" : "s"} detected under this directory.`
                : "Directory not found in the current project root."}
            </p>
          </button>
        );
      })}
    </div>
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
    selectedWorkspaceSourceKey,
    selectedSkillDetail,
    selectedStagedDetail,
    setNotice,
    setError,
    setSelectedLogId,
    setSelectedWorkspaceSourceKey,
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
    conflictPolicy: "rename"
  });

  const isDesktop = isDesktopApiAvailable();
  const selectedLog = snapshot?.logs.find((item) => item.id === selectedLogId) || null;
  const selectedWorkspaceSource =
    snapshot?.workspaceSkillSources.find((source) => source.key === selectedWorkspaceSourceKey) || null;
  const installPathConfigured = Boolean(snapshot?.settings.installDir.trim());

  useEffect(() => {
    if (!snapshot) {
      return;
    }

    setSettingsDraft({
      installDir: snapshot.settings.installDir,
      tempDir: snapshot.settings.tempDir,
      conflictPolicy: snapshot.settings.conflictPolicy
    });
  }, [snapshot]);

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

  const dropzone = useDropzone({
    accept: {
      "application/zip": [".zip"]
    },
    multiple: false,
    onDropAccepted: (files) => {
      void (async () => {
        const file = files[0];
        if (!file?.path) {
          setError("The dropped file path is not available. Use the file picker instead.");
          return;
        }

        await importLocalArchive(file.path);
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

  const workspaceSourcesContent = snapshot ? (
    <WorkspaceSourcesGrid
      onSelect={setSelectedWorkspaceSourceKey}
      selectedKey={selectedWorkspaceSourceKey}
      sources={snapshot.workspaceSkillSources}
    />
  ) : null;

  const renderOverview = () => (
    <div className="space-y-6">
      {!installPathConfigured ? (
        <SectionCard
          title="Install path required"
          subtitle="The app now starts with an empty install directory by design."
        >
          <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-5 text-sm text-amber-100">
            Choose a default install directory in Settings before you try to install any staged skills. Workspace
            discovery and ZIP parsing can still be used before that.
          </div>
        </SectionCard>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard accent="text-moss" label="Installed" value={snapshot?.summary.installedCount || 0} />
        <StatCard accent="text-signal" label="Staged" value={snapshot?.summary.stagedCount || 0} />
        <StatCard accent="text-white" label="Ready" value={snapshot?.summary.readyCount || 0} />
        <StatCard accent="text-ember" label="Errors" value={snapshot?.summary.failedCount || 0} />
      </div>

      <SectionCard
        title="Workspace skill directories"
        subtitle="Click a provider to inspect the skills already living under project folders like .codex or .claude."
      >
        {workspaceSourcesContent}
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Recent installs" subtitle="The newest records written into the installed skills database.">
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
                  <p className="mt-2 text-sm text-ink-200/75">{skill.description || "No description extracted yet."}</p>
                  <p className="mt-3 text-xs text-ink-200/55">{formatRelativeTime(skill.installedAt)}</p>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              description="Import a ZIP or install staged remote sources to populate this list."
              title="No install records yet"
            />
          )}
        </SectionCard>

        <SectionCard title="Recent failures" subtitle="Useful for debugging broken ZIPs, download issues, or path errors.">
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
                  <p className="mt-2 line-clamp-3 text-sm text-ink-200/75">{log.detail || "No extra log detail."}</p>
                  <p className="mt-3 text-xs text-ink-200/55">{formatRelativeTime(log.createdAt)}</p>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              description="Once parse or install errors occur, the newest ones will appear here."
              title="No recent failures"
            />
          )}
        </SectionCard>
      </div>
    </div>
  );

  const renderImport = () => (
    <div className="space-y-6">
      <SectionCard
        title="Project-native skill directories"
        subtitle="Recognize skills already placed under folders such as .codex, .claude, .agent, or .agents."
      >
        {workspaceSourcesContent}
      </SectionCard>

      <SectionCard
        title="Import local ZIP"
        subtitle="The most reliable MVP path is still local ZIP -> staging -> install -> browse."
      >
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
          <p className="mt-4 text-lg font-medium text-white">Drop a ZIP file here or use the picker below</p>
          <p className="mt-2 text-sm text-ink-200/70">
            The current MVP recognizes a skill when it finds <code>SKILL.md</code> in the archive root or in a
            single nested directory.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              className="rounded-full bg-signal px-4 py-2 text-sm font-medium text-ink-950 transition hover:brightness-110"
              onClick={async () => {
                const result = await pickArchiveFile();
                if (result.ok && result.data) {
                  await importLocalArchive(result.data);
                }
              }}
              type="button"
            >
              Choose ZIP
            </button>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Add remote sources"
        subtitle="GitHub repositories and direct ZIP URLs are added into staging first, then parsed and installed in batches."
      >
        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
          <label className="block text-sm font-medium text-white" htmlFor="remote-url">
            GitHub repository or ZIP URL
          </label>
          <div className="mt-3 flex flex-col gap-3 lg:flex-row">
            <input
              className="h-12 flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition placeholder:text-ink-200/40 focus:border-signal/45"
              id="remote-url"
              onChange={(event) => setRemoteUrl(event.target.value)}
              placeholder="https://github.com/owner/repo or https://example.com/skill.zip"
              value={remoteUrl}
            />
            <button
              className="h-12 rounded-2xl bg-ember px-5 text-sm font-medium text-ink-950 transition hover:brightness-110"
              onClick={async () => {
                if (!remoteUrl.trim()) {
                  setError("Please enter a GitHub repository URL or a direct ZIP URL.");
                  return;
                }

                await addRemoteSource(remoteUrl);
                setRemoteUrl("");
              }}
              type="button"
            >
              Add to staging
            </button>
          </div>
          <p className="mt-3 text-sm text-ink-200/65">
            This MVP supports full GitHub repository ZIP downloads and remote URLs ending in <code>.zip</code>.
          </p>
        </div>
      </SectionCard>
    </div>
  );

  const renderStaged = () => (
    <div className="space-y-6">
      <SectionCard
        title="Staged sources"
        subtitle="Parse, install, or remove items from one place before they touch the install directory."
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
              onClick={() =>
                void parseStagedSources(
                  selectedStageIds.length ? selectedStageIds : snapshot?.stagedSources.map((item) => item.id) || []
                )
              }
              type="button"
            >
              Parse selected
            </button>
            <button
              className="rounded-full bg-moss px-3 py-2 text-sm font-medium text-ink-950 transition hover:brightness-110"
              onClick={() =>
                void installStagedSources(
                  selectedStageIds.length
                    ? selectedStageIds
                    : snapshot?.stagedSources.filter((item) => item.status === "ready").map((item) => item.id) || []
                )
              }
              type="button"
            >
              Install selected
            </button>
            <button
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
              onClick={() => void removeStagedSources(selectedStageIds)}
              type="button"
            >
              Remove selected
            </button>
            <button
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
              onClick={() => void clearStagedSources()}
              type="button"
            >
              Clear staging
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
                        {item.detectedDescription || item.errorMessage || "Waiting for metadata parsing."}
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
          <EmptyState description="Add ZIP files or remote sources first." title="The staging area is empty" />
        )}
      </SectionCard>
    </div>
  );

  const renderSkills = () => (
    <div className="space-y-6">
      <SectionCard title="Installed skills" subtitle="Search, inspect, and open local install folders.">
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4">
          <Search className="h-4 w-4 text-ink-200/65" />
          <input
            className="h-12 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-ink-200/40"
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search by name, slug, or description"
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
                    <p className="mt-2 text-sm text-ink-200/75">{skill.description || "No description available."}</p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-moss" />
                </div>
                <p className="mt-3 text-xs text-ink-200/55">{formatRelativeTime(skill.installedAt)}</p>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState description="Installed skills will appear here after a successful install." title="No installed skills yet" />
        )}
      </SectionCard>
    </div>
  );

  const renderLogs = () => (
    <div className="space-y-6">
      <SectionCard title="Operation logs" subtitle="Every parse, install, and settings action writes a searchable log trail.">
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
                <p className="mt-2 text-sm text-ink-200/75">{log.detail || "No extra detail"}</p>
                <p className="mt-3 text-xs text-ink-200/55">{formatRelativeTime(log.createdAt)}</p>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState description="Logs will appear here as soon as you start importing or installing skills." title="No logs yet" />
        )}
      </SectionCard>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <SectionCard
        title="Default install path and temp path"
        subtitle="The install path now starts empty. You choose it explicitly before any install happens."
      >
        <div className="space-y-5 rounded-3xl border border-white/10 bg-black/20 p-5">
          <div>
            <label className="block text-sm font-medium text-white" htmlFor="install-dir">
              Default install directory
            </label>
            <div className="mt-3 flex flex-col gap-3 xl:flex-row">
              <input
                className="h-12 flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition placeholder:text-ink-200/40 focus:border-signal/45"
                id="install-dir"
                onChange={(event) =>
                  setSettingsDraft((current) => ({
                    ...current,
                    installDir: event.target.value
                  }))
                }
                placeholder="Choose where installed skills should be copied"
                value={settingsDraft.installDir}
              />
              <button
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
                onClick={async () => {
                  const result = await pickDirectory(settingsDraft.installDir);
                  if (result.ok && result.data) {
                    setSettingsDraft((current) => ({
                      ...current,
                      installDir: result.data || current.installDir
                    }));
                  }
                }}
                type="button"
              >
                Choose
              </button>
              <button
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
                onClick={async () => {
                  const result = await validateDirectory(settingsDraft.installDir);
                  setNotice(result.writable ? "Install directory is writable." : result.error || "Install directory is invalid.");
                }}
                type="button"
              >
                Validate
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white" htmlFor="temp-dir">
              Temp directory
            </label>
            <div className="mt-3 flex flex-col gap-3 xl:flex-row">
              <input
                className="h-12 flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition placeholder:text-ink-200/40 focus:border-signal/45"
                id="temp-dir"
                onChange={(event) =>
                  setSettingsDraft((current) => ({
                    ...current,
                    tempDir: event.target.value
                  }))
                }
                placeholder={`Leave empty to use the internal temp path (${snapshot?.runtime.dataRoot || "data"})`}
                value={settingsDraft.tempDir}
              />
              <button
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
                onClick={async () => {
                  const result = await pickDirectory(settingsDraft.tempDir || snapshot?.runtime.dataRoot);
                  if (result.ok && result.data) {
                    setSettingsDraft((current) => ({
                      ...current,
                      tempDir: result.data || current.tempDir
                    }));
                  }
                }}
                type="button"
              >
                Choose
              </button>
              <button
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
                onClick={async () => {
                  if (!settingsDraft.tempDir.trim()) {
                    setNotice("Temp directory is empty, so the internal runtime temp path will be used.");
                    return;
                  }

                  const result = await validateDirectory(settingsDraft.tempDir);
                  setNotice(result.writable ? "Temp directory is writable." : result.error || "Temp directory is invalid.");
                }}
                type="button"
              >
                Validate
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white" htmlFor="conflict-policy">
              Conflict policy
            </label>
            <select
              className="mt-3 h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none focus:border-signal/45"
              id="conflict-policy"
              onChange={(event) =>
                setSettingsDraft((current) => ({
                  ...current,
                  conflictPolicy: event.target.value as SaveSettingsInput["conflictPolicy"]
                }))
              }
              value={settingsDraft.conflictPolicy}
            >
              <option value="rename">Rename on conflict</option>
              <option value="skip">Skip conflicting installs</option>
              <option value="overwrite">Overwrite existing directories</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              className="rounded-full bg-signal px-5 py-2.5 text-sm font-medium text-ink-950 transition hover:brightness-110"
              onClick={() => void saveSettings(settingsDraft)}
              type="button"
            >
              Save settings
            </button>
            <button
              className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white transition hover:bg-white/10"
              onClick={() => void openPath(settingsDraft.installDir)}
              type="button"
            >
              Open install folder
            </button>
          </div>
        </div>
      </SectionCard>
    </div>
  );

  const renderPrimarySection = () => {
    if (!snapshot) {
      return (
        <SectionCard title="Loading workspace" subtitle="Reading settings, staged sources, installed skills, and project directories.">
          <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-black/20 p-5 text-sm text-ink-200/70">
            <LoaderCircle className="h-5 w-5 animate-spin text-signal" />
            Building your local skill manager snapshot...
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

  const renderWorkspaceSourceDetail = () => {
    if (!selectedWorkspaceSource) {
      return (
        <SectionCard title="Project skill directories" subtitle="Choose a provider card to inspect local skills under hidden project folders.">
          <EmptyState
            description="This panel shows the skills detected under directories like .codex or .claude."
            title="No provider selected"
          />
        </SectionCard>
      );
    }

    return (
      <SectionCard
        title={`${selectedWorkspaceSource.label} skills`}
        subtitle={selectedWorkspaceSource.exists ? selectedWorkspaceSource.path : `${selectedWorkspaceSource.directoryName} is not present in this project.`}
        actions={
          <button
            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
            onClick={() => void openPath(selectedWorkspaceSource.path)}
            type="button"
          >
            Open folder
          </button>
        }
      >
        {selectedWorkspaceSource.exists ? (
          selectedWorkspaceSource.skills.length ? (
            <div className="space-y-3">
              {selectedWorkspaceSource.skills.map((skill) => (
                <div key={skill.id} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{skill.name}</p>
                      <p className="mt-1 text-sm text-ink-200/70">{skill.description || "No description found in SKILL.md."}</p>
                    </div>
                    <button
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white transition hover:bg-white/10"
                      onClick={() => void openPath(skill.rootPath)}
                      type="button"
                    >
                      Open skill
                    </button>
                  </div>
                  <div className="mt-3 space-y-1 text-xs text-ink-200/55">
                    <p>Relative path: {skill.relativePath}</p>
                    <p>SKILL.md: {skill.skillMdPath}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              description="The directory exists, but no SKILL.md files were found under the supported scan depth."
              title="No skills detected"
            />
          )
        ) : (
          <EmptyState description="Create this directory in the project root to expose provider-specific skills here." title="Directory missing" />
        )}
      </SectionCard>
    );
  };

  const renderDetailPanel = () => {
    if (!snapshot) {
      return null;
    }

    if ((section === "overview" || section === "import") && snapshot.workspaceSkillSources.length > 0) {
      return renderWorkspaceSourceDetail();
    }

    if (section === "skills" && selectedSkillDetail) {
      return (
        <SectionCard
          title={selectedSkillDetail.name}
          subtitle={selectedSkillDetail.exists ? "Installed skill detail" : "Record exists, but files are missing on disk"}
          actions={
            <div className="flex gap-2">
              <button
                className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
                onClick={() => void openPath(selectedSkillDetail.installPath)}
                type="button"
              >
                Open folder
              </button>
              <button
                className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
                onClick={() => void rescanInstalledSkill(selectedSkillDetail.id)}
                type="button"
              >
                Rescan
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
              <p className="mt-3">{selectedSkillDetail.description || "No description extracted for this skill."}</p>
              <div className="mt-4 space-y-1 text-xs text-ink-200/60">
                <p>Install path: {selectedSkillDetail.installPath}</p>
                <p>SKILL.md: {selectedSkillDetail.skillMdPath}</p>
                <p>Installed: {formatRelativeTime(selectedSkillDetail.installedAt)}</p>
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
          title={selectedStagedDetail.detectedName || "Staged source detail"}
          subtitle="Inspect parse results, source metadata, and previewed markdown before installing."
          actions={
            <div className="flex gap-2">
              <button
                className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
                onClick={() => void parseStagedSources([selectedStagedDetail.id])}
                type="button"
              >
                Re-parse
              </button>
              <button
                className="rounded-full bg-moss px-3 py-2 text-sm font-medium text-ink-950 transition hover:brightness-110"
                onClick={() => void installStagedSources([selectedStagedDetail.id])}
                type="button"
              >
                Install
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
                <p>Source value: {selectedStagedDetail.sourceValue}</p>
                <p>Archive path: {selectedStagedDetail.archivePath || "Not generated yet"}</p>
                <p>Skill root: {selectedStagedDetail.skillRootPath || "Not detected yet"}</p>
                {selectedStagedDetail.errorMessage ? <p>Error: {selectedStagedDetail.errorMessage}</p> : null}
              </div>
            </div>
            <MarkdownViewer markdown={selectedStagedDetail.markdown} emptyMessage="No SKILL.md preview is available for this staged item yet." />
          </div>
        </SectionCard>
      );
    }

    if (section === "logs" && selectedLog) {
      return (
        <SectionCard title="Log detail" subtitle={selectedLog.message}>
          <div className="space-y-4 rounded-3xl border border-white/10 bg-black/20 p-4 text-sm text-ink-100/80">
            <p className={cn("font-medium", logTone(selectedLog))}>{selectedLog.level.toUpperCase()}</p>
            <p>{selectedLog.detail || "No extra detail."}</p>
            <div className="space-y-1 text-xs text-ink-200/60">
              <p>Type: {selectedLog.type}</p>
              <p>Related ID: {selectedLog.relatedId || "None"}</p>
              <p>Time: {formatRelativeTime(selectedLog.createdAt)}</p>
            </div>
          </div>
        </SectionCard>
      );
    }

    return (
      <SectionCard title="Workspace notes" subtitle="A quick guide for the current MVP flow.">
        <div className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-black/20 p-4 text-sm text-ink-100/80">
            <div className="flex items-center gap-2 text-white">
              <Sparkles className="h-4 w-4 text-signal" />
              <p className="font-medium">Main MVP path</p>
            </div>
            <p className="mt-3">
              Import -&gt; stage -&gt; install -&gt; browse. The new project directory cards complement that flow by
              exposing local hidden-provider skill folders.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/20 p-4 text-sm text-ink-100/80">
            <p className="font-medium text-white">Recommended next steps</p>
            <ul className="mt-3 space-y-2 text-ink-200/75">
              <li>1. Configure the install directory in Settings if it is still empty.</li>
              <li>2. Click a provider card such as Codex to inspect project-local skills.</li>
              <li>3. Drop a ZIP archive into Import and verify the staging flow.</li>
            </ul>
          </div>
          {!isDesktop ? (
            <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">
              This page is running in browser fallback mode. File dialogs, SQLite data, and folder opening only work inside the Electron desktop shell.
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
            <p className="mt-2 text-sm text-ink-200/70">A desktop workbench for local-first skill import, inspection, and installation.</p>
          </div>

          <nav className="mt-6 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.section === section;
              return (
                <Link
                  key={item.section}
                  className={cn(
                    "flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition",
                    active
                      ? "border-signal/30 bg-signal/15 text-white"
                      : "border-white/10 bg-white/5 text-ink-200/80 hover:bg-white/10"
                  )}
                  href={item.href}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  {item.section === "staged" && pendingCount ? (
                    <span className="rounded-full bg-signal/15 px-2 py-0.5 text-xs text-signal">{pendingCount}</span>
                  ) : null}
                  {item.section === "logs" && failureCount ? (
                    <span className="rounded-full bg-ember/15 px-2 py-0.5 text-xs text-ember">{failureCount}</span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 space-y-3 rounded-[28px] border border-white/10 bg-black/20 p-4 text-sm text-ink-200/75">
            <div className="flex items-center gap-2 text-white">
              <Database className="h-4 w-4 text-signal" />
              Runtime
            </div>
            <p>Dev data: repository `data/`</p>
            <p>Prod data: Electron `userData`</p>
            <p>Frontend port: `3211`</p>
            <p>Install dir: {snapshot?.settings.installDir || "Not configured yet"}</p>
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
                    Refresh
                  </span>
                </button>
                <button
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
                  onClick={() => void openPath(snapshot?.settings.installDir || "")}
                  type="button"
                >
                  <span className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4" />
                    Open install folder
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 xl:grid-cols-[1.4fr,auto] xl:items-center">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-ink-200/80">
                <span className="text-ink-200/55">Default install directory:</span>{" "}
                {snapshot?.settings.installDir || "Not configured yet"}
              </div>
              {busyLabel ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-signal/30 bg-signal/10 px-4 py-2 text-sm text-signal">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  {busyLabel}
                </div>
              ) : null}
            </div>

            {notice ? (
              <div className="mt-3 rounded-2xl border border-moss/20 bg-moss/10 px-4 py-3 text-sm text-moss">{notice}</div>
            ) : null}
            {error ? (
              <div className="mt-3 rounded-2xl border border-ember/20 bg-ember/10 px-4 py-3 text-sm text-ember">{error}</div>
            ) : null}
          </header>

          <div className="grid flex-1 gap-6 p-6 2xl:grid-cols-[minmax(0,1.35fr),420px]">
            <main className="space-y-6">{renderPrimarySection()}</main>
            <aside className="space-y-6">{renderDetailPanel()}</aside>
          </div>
        </div>
      </div>
    </div>
  );
}
