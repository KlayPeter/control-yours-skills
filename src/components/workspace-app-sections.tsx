"use client";

import Link from "next/link";
import { formatDistanceToNowStrict, formatISO9075 } from "date-fns";
import type { DropzoneState } from "react-dropzone";
import { useEffect, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import {
  ChevronDown,
  ChevronRight,
  Eye,
  FolderOpen,
  HardDriveDownload,
  LoaderCircle,
  Plus,
  RefreshCcw,
  Search,
  ShieldAlert,
  SunMoon,
  Trash2,
  UploadCloud,
  X
} from "lucide-react";

import type {
  InstalledSkillDetail,
  InstalledSkillRecord,
  InstallStrategy,
  LogRecord,
  SaveSettingsInput,
  SkillCategoryRecord,
  SkillManagerSnapshot,
  SourceStatus,
  StagedSourceDetail,
  StagedSourceRecord,
  WorkspaceSkillProviderKey,
  WorkspaceSkillSource,
  WorkspaceTreeNode
} from "@shared/contracts";

import { MarkdownViewer } from "@/components/markdown-viewer";
import { cn } from "@/lib/cn";

type TranslationDictionary = Record<string, string>;
type WorkspaceSection = "overview" | "import" | "staged" | "skills" | "logs" | "settings";
type AsyncActionResult<T = unknown> = void | Promise<T>;

function formatAbsoluteTime(value: string) {
  return formatISO9075(new Date(value));
}

function RelativeTimeText({ value }: { value: string }) {
  const absoluteTime = formatAbsoluteTime(value);
  const [displayValue, setDisplayValue] = useState(absoluteTime);

  useEffect(() => {
    setDisplayValue(
      `${formatDistanceToNowStrict(new Date(value), { addSuffix: true })} | ${absoluteTime}`
    );
  }, [absoluteTime, value]);

  return <>{displayValue}</>;
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

function statusLabel(status: SourceStatus, t: TranslationDictionary) {
  switch (status) {
    case "installed":
      return t.statusInstalled;
    case "ready":
      return t.statusReady;
    case "error":
      return t.statusError;
    case "processing":
      return t.statusProcessing;
    default:
      return t.statusPending;
  }
}

function StatusIndicator({
  status,
  t
}: {
  status: SourceStatus;
  t: TranslationDictionary;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs uppercase tracking-[0.16em]",
        statusTone(status)
      )}
    >
      {status === "processing" ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : null}
      {statusLabel(status, t)}
    </span>
  );
}

function providerMonogram(key: WorkspaceSkillSource["key"]) {
  switch (key) {
    case "codex":
      return "CX";
    case "claude":
      return "CL";
    case "agents":
      return "AG";
  }
}

function providerStatus(source: WorkspaceSkillSource, t: TranslationDictionary) {
  return source.exists ? t.providerFound : t.providerMissing;
}

function logTone(log: LogRecord) {
  if (log.level === "error") {
    return "text-ember";
  }

  if (log.level === "warning") {
    return "text-amber-600 dark:text-amber-400";
  }

  return "text-moss";
}

function logTypeLabel(log: LogRecord, t: TranslationDictionary) {
  if (log.type === "settings") {
    return t.sectionSettings;
  }

  if (log.type === "staged") {
    return t.sectionStaged;
  }

  if (log.type === "install") {
    return t.sectionSkills;
  }

  return t.runtime;
}

function SourceBadge({
  source,
  t
}: {
  source: StagedSourceRecord["sourceType"] | InstalledSkillRecord["sourceType"];
  t: TranslationDictionary;
}) {
  const label =
    source === "localZip"
      ? t.sourceBadgeLocalZip
      : source === "githubRepo"
        ? t.sourceBadgeGithubRepo
        : t.sourceBadgeRemoteZip;

  return (
    <span className="app-surface-subtle rounded-full px-2.5 py-1 text-xs uppercase tracking-[0.16em] app-text-soft">
      {label}
    </span>
  );
}

function StrategyBadge({ strategy }: { strategy: InstallStrategy | null }) {
  if (!strategy) {
    return null;
  }

  const label =
    strategy.type === "command"
      ? "Guide"
      : strategy.type === "manual"
        ? "Guide"
        : "Archive";

  return (
    <span className="app-surface-subtle rounded-full px-2.5 py-1 text-xs uppercase tracking-[0.16em] app-text-soft">
      {label}
    </span>
  );
}

function DetailList({
  title,
  items,
  copyLabel
}: {
  title: string;
  items: string[];
  copyLabel?: string;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.16em] app-text-soft">{title}</p>
        <CopyButton label={copyLabel || "复制"} value={items.join("\n")} />
      </div>
      <div className="mt-2 space-y-2">
        {items.map((item, index) => (
          <p key={`${title}-${index}`} className="app-surface-subtle rounded-2xl px-3 py-2 text-sm app-text">
            {item}
          </p>
        ))}
      </div>
    </div>
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
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="app-panel p-6 sm:p-7">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <h2 className="text-xl font-semibold tracking-tight app-text">{title}</h2>
          {subtitle ? <p className="mt-2 max-w-2xl text-sm leading-6 app-text-soft">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2 lg:justify-end">{actions}</div> : null}
      </div>
      {children}
    </section>
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
    <div className="app-empty-state">
      <div className="app-empty-orb mx-auto flex h-14 w-14 items-center justify-center rounded-[22px] border border-white/10 app-text-soft">
        <Search className="h-5 w-5" />
      </div>
      <p className="mt-5 text-lg font-semibold tracking-tight app-text">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 app-text-soft">{description}</p>
    </div>
  );
}

function OverviewMetric({
  label,
  value
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="app-card p-4">
      <p className="text-xs uppercase tracking-[0.16em] app-text-soft">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight app-text">{value}</p>
    </div>
  );
}

function CapabilityCard({
  title,
  body,
  status,
  icon: Icon,
  primaryAction,
  secondaryAction
}: {
  title: string;
  body: string;
  status: string;
  icon: typeof Search;
  primaryAction?: {
    label: string;
    onClick: () => AsyncActionResult;
    disabled?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick: () => AsyncActionResult;
    disabled?: boolean;
  };
}) {
  return (
    <div className="app-card flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 app-text">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium app-text">{title}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.16em] app-text-soft">{status}</p>
          </div>
        </div>
      </div>
      <p className="mt-4 flex-1 text-sm leading-6 app-text-soft">{body}</p>
      {primaryAction || secondaryAction ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {primaryAction ? (
            <button
              className={cn(
                primaryAction.disabled
                  ? "cursor-not-allowed rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm app-text-soft"
                  : "app-button-primary"
              )}
              disabled={primaryAction.disabled}
              onClick={() => void primaryAction.onClick()}
              type="button"
            >
              {primaryAction.label}
            </button>
          ) : null}
          {secondaryAction ? (
            <button
              className={cn(
                "app-button",
                secondaryAction.disabled && "cursor-not-allowed opacity-60"
              )}
              disabled={secondaryAction.disabled}
              onClick={() => void secondaryAction.onClick()}
              type="button"
            >
              {secondaryAction.label}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function CopyButton({
  value,
  label = "复制"
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      className="app-button px-3 text-xs"
      onClick={() => {
        void navigator.clipboard.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      }}
      type="button"
    >
      {copied ? "已复制" : label}
    </button>
  );
}

function IconActionButton({
  icon: Icon,
  label,
  onClick,
  tone = "default"
}: {
  icon: typeof Search;
  label: string;
  onClick: () => void;
  tone?: "default" | "danger" | "success";
}) {
  return (
    <button
      aria-label={label}
      className={cn(
        "app-icon-button rounded-2xl",
        tone === "danger" && "border-ember/25 bg-ember/10 text-ember hover:border-ember/40 hover:bg-ember/15",
        tone === "success" && "border-moss/25 bg-moss/10 text-moss hover:border-moss/40 hover:bg-moss/15"
      )}
      onClick={onClick}
      title={label}
      type="button"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function ProviderInstallButtons({
  onInstall
}: {
  onInstall: (providerKey: WorkspaceSkillProviderKey) => void;
}) {
  const providers: WorkspaceSkillProviderKey[] = ["codex", "claude", "agents"];

  return (
    <div className="flex flex-wrap gap-2">
      {providers.map((providerKey) => (
        <button
          key={providerKey}
          className="app-button px-3 text-xs"
          onClick={() => onInstall(providerKey)}
          type="button"
        >
          {providerMonogram(providerKey)}
        </button>
      ))}
    </div>
  );
}

function WorkspaceTree({
  nodes,
  projectRoot,
  onOpenPath,
  onInstallWorkspaceSkill,
  emptyMessage
}: {
  nodes: WorkspaceTreeNode[];
  projectRoot: string;
  onOpenPath: (path: string) => AsyncActionResult;
  onInstallWorkspaceSkill: (
    sourceRoot: string,
    skillRootPath: string,
    providerKey: WorkspaceSkillProviderKey
  ) => AsyncActionResult;
  emptyMessage: string;
}) {
  if (nodes.length === 0) {
    return <div className="rounded-2xl border border-dashed border-white/15 bg-black/10 px-4 py-6 text-sm app-text-soft">{emptyMessage}</div>;
  }

  return (
    <div className="space-y-2">
      {nodes.map((node) => (
        <WorkspaceTreeNodeRow
          key={node.id}
          node={node}
          onInstallWorkspaceSkill={onInstallWorkspaceSkill}
          onOpenPath={onOpenPath}
          projectRoot={projectRoot}
        />
      ))}
    </div>
  );
}

function WorkspaceTreeNodeRow({
  node,
  projectRoot,
  onOpenPath,
  onInstallWorkspaceSkill
}: {
  node: WorkspaceTreeNode;
  projectRoot: string;
  onOpenPath: (path: string) => AsyncActionResult;
  onInstallWorkspaceSkill: (
    sourceRoot: string,
    skillRootPath: string,
    providerKey: WorkspaceSkillProviderKey
  ) => AsyncActionResult;
}) {
  const [open, setOpen] = useState(true);
  const isFolder = node.kind === "folder";

  return (
    <div className="rounded-2xl border border-white/10 bg-black/10">
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          className={cn(
            "flex min-w-0 flex-1 items-center gap-3 text-left",
            !isFolder && "cursor-default"
          )}
          onClick={() => {
            if (isFolder) {
              setOpen((current) => !current);
            }
          }}
          type="button"
        >
          {isFolder ? (
            open ? <ChevronDown className="h-4 w-4 app-text-soft" /> : <ChevronRight className="h-4 w-4 app-text-soft" />
          ) : (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-moss/15 text-[10px] text-moss">S</span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium app-text">{node.name}</p>
            <p className="mt-1 truncate text-xs app-text-soft">{node.relativePath}</p>
            {node.description ? <p className="mt-1 line-clamp-2 text-xs app-text-soft">{node.description}</p> : null}
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-2">
          <IconActionButton icon={FolderOpen} label="打开目录" onClick={() => void onOpenPath(node.absolutePath)} />
          {node.kind === "skill" && node.skill ? (
            <ProviderInstallButtons
              onInstall={(providerKey) => {
                void onInstallWorkspaceSkill(projectRoot, node.skill!.rootPath, providerKey);
              }}
            />
          ) : null}
        </div>
      </div>
      {isFolder && open && node.children.length ? (
        <div className="border-t border-white/10 px-3 py-3">
          <div className="space-y-2 pl-4">
            {node.children.map((child) => (
              <WorkspaceTreeNodeRow
                key={child.id}
                node={child}
                onInstallWorkspaceSkill={onInstallWorkspaceSkill}
                onOpenPath={onOpenPath}
                projectRoot={projectRoot}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function SourceViewerModal({
  open,
  title,
  subtitle,
  sources,
  onClose,
  onOpenPath,
  t
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  sources: WorkspaceSkillSource[];
  onClose: () => void;
  onOpenPath: (targetPath: string) => void;
  t: TranslationDictionary;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="app-panel flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-black/10 dark:border-white/10 px-6 py-5">
          <div>
            <h3 className="text-2xl font-semibold tracking-tight app-text">{title}</h3>
            {subtitle ? <p className="mt-2 text-sm leading-6 app-text-soft">{subtitle}</p> : null}
          </div>
          <button
            className="app-icon-button"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[calc(85vh-92px)] overflow-y-auto px-6 py-6">
          <div className="space-y-5">
            {sources.map((source) => (
              <div key={source.id} className="app-card overflow-hidden">
                <div className="p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-sm font-semibold app-text">
                          {providerMonogram(source.key)}
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium app-text">{source.label}</p>
                          <p className="mt-1 break-all text-sm app-text-soft">{source.path}</p>
                        </div>
                      </div>
                    </div>
                    <div
                      title={providerStatus(source, t)}
                      className={cn(
                        "h-2.5 w-2.5 rounded-full shrink-0",
                        source.exists
                          ? "bg-moss shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                          : "bg-black/20 dark:bg-white/20"
                      )}
                    />
                  </div>

                  {source.skills.length ? (
                    <div className="mt-5 space-y-3">
                    {source.skills.map((skill) => (
                      <div
                        key={skill.id}
                        className="rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 p-4"
                      >
                        <div className="flex flex-col gap-3">
                          <div className="min-w-0">
                            <p className="font-medium app-text">{skill.name}</p>
                            <p className="mt-1 text-sm app-text-soft">
                              {skill.description || t.noDescriptionAvailable}
                            </p>
                            <p className="mt-2 break-all text-xs app-text-soft opacity-75">{skill.relativePath}</p>
                          </div>
                          <div className="flex justify-end border-t border-black/10 dark:border-white/10 pt-3">
                              <IconActionButton
                                icon={FolderOpen}
                                label={t.openFolder}
                                onClick={() => onOpenPath(skill.rootPath)}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-5 rounded-2xl border border-dashed border-black/15 dark:border-white/15 bg-black/5 dark:bg-black/20 px-4 py-6 text-center text-sm app-text-soft">
                      {t.modalNoSkills}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function OverviewSection({
  snapshot,
  installPathConfigured,
  t,
  onChooseInstallDir,
  onGoImport,
  onGoStaged,
  onOpenSystemSourceModal,
  onImportProject,
  onRemoveProject,
  onOpenPath,
  onOpenLogsFromOverview,
  onInstallWorkspaceSkill
}: {
  snapshot: SkillManagerSnapshot;
  installPathConfigured: boolean;
  t: TranslationDictionary;
  onChooseInstallDir: () => AsyncActionResult;
  onGoImport: () => AsyncActionResult;
  onGoStaged: () => AsyncActionResult;
  onOpenSystemSourceModal: (source: WorkspaceSkillSource) => void;
  onImportProject: () => AsyncActionResult;
  onRemoveProject: (projectPath: string) => AsyncActionResult;
  onOpenPath: (path: string) => AsyncActionResult;
  onOpenLogsFromOverview: (logId: string) => void;
  onInstallWorkspaceSkill: (
    sourceRoot: string,
    skillRootPath: string,
    providerKey: WorkspaceSkillProviderKey
  ) => AsyncActionResult;
}) {
  const systemSkillCount = snapshot.systemSkillSources.reduce((total, source) => total + source.skillCount, 0);
  const detectedSystemSources = snapshot.systemSkillSources.filter((source) => source.exists).length;
  const importedProjectCount = snapshot.importedProjects.length;
  const importedProjectSkillCount = snapshot.importedProjects.reduce((total, project) => total + project.skillCount, 0);

  return (
    <div className="space-y-6">
      <SectionCard title={t.capabilityOverviewTitle} subtitle={t.capabilityOverviewSubtitle}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <OverviewMetric label={t.overviewMetricInstalled} value={snapshot.summary.installedCount} />
          <OverviewMetric label={t.overviewMetricStaged} value={snapshot.summary.stagedCount} />
          <OverviewMetric label={t.overviewMetricSystem} value={`${detectedSystemSources}/${snapshot.systemSkillSources.length}`} />
          <OverviewMetric label={t.overviewMetricProjects} value={importedProjectCount} />
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          <CapabilityCard
            body={
              installPathConfigured
                ? `${t.capabilityInstallBody} ${snapshot.settings.installDir}`
                : `${t.capabilityInstallBody} ${t.installPathRequiredBody}`
            }
            icon={HardDriveDownload}
            primaryAction={{
              label: t.quickStartChooseInstallDir,
              onClick: onChooseInstallDir
            }}
            secondaryAction={
              installPathConfigured
                ? {
                    label: t.openInstallFolder,
                    onClick: () => onOpenPath(snapshot.settings.installDir)
                  }
                : undefined
            }
            status={installPathConfigured ? t.capabilityStatusConfigured : t.capabilityStatusNeedsSetup}
            title={t.capabilityInstallTitle}
          />
          <CapabilityCard
            body={t.capabilityImportBody}
            icon={UploadCloud}
            primaryAction={{
              label: t.quickStartGoImport,
              onClick: onGoImport
            }}
            secondaryAction={{
              label: t.quickStartGoStaged,
              onClick: onGoStaged,
              disabled: snapshot.stagedSources.length === 0
            }}
            status={`${snapshot.summary.readyCount} ${t.statusReady}`}
            title={t.capabilityImportTitle}
          />
          <CapabilityCard
            body={`${t.capabilitySystemBody} ${systemSkillCount} ${t.skillCount}`}
            icon={FolderOpen}
            primaryAction={
              snapshot.systemSkillSources[0]
                ? {
                    label: t.view,
                    onClick: () => onOpenSystemSourceModal(snapshot.systemSkillSources[0])
                  }
                : undefined
            }
            status={`${detectedSystemSources}/${snapshot.systemSkillSources.length} ${t.providerFound}`}
            title={t.capabilitySystemTitle}
          />
          <CapabilityCard
            body={`${t.capabilityProjectBody} ${importedProjectSkillCount} ${t.skillCount}`}
            icon={Search}
            primaryAction={{
              label: t.importProject,
              onClick: onImportProject
            }}
            secondaryAction={
              importedProjectCount > 0
                ? {
                    label: t.openFolder,
                    onClick: () => onOpenPath(snapshot.importedProjects[0].path)
                  }
                : undefined
            }
            status={`${importedProjectCount} ${t.projectDirectories}`}
            title={t.capabilityProjectTitle}
          />
        </div>
      </SectionCard>

      <SectionCard title={t.workspaceSkillDirectories} subtitle={t.workspaceSkillDirectoriesSubtitle}>
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
          {snapshot.systemSkillSources.map((source) => (
            <div key={source.id} className="app-card flex h-full flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-sm font-semibold app-text">
                    {providerMonogram(source.key)}
                  </div>
                  <div>
                    <p className="font-medium app-text">{source.label}</p>
                    <p className="text-sm app-text-soft">
                      {t.skillCount}: {source.skillCount}
                    </p>
                  </div>
                </div>
                <div
                  title={providerStatus(source, t)}
                  className={cn(
                    "h-2.5 w-2.5 rounded-full shrink-0",
                    source.exists
                      ? "bg-moss shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                      : "bg-black/20 dark:bg-white/20"
                  )}
                />
              </div>
              <p className="mt-4 flex-1 break-all text-sm leading-6 app-text-soft">{source.path}</p>
              <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-black/10 dark:border-white/10 pt-4">
                <IconActionButton icon={Eye} label={t.view} onClick={() => onOpenSystemSourceModal(source)} />
                <IconActionButton
                  icon={FolderOpen}
                  label={t.openFolder}
                  onClick={() => void onOpenPath(source.path)}
                />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title={t.projectDirectories}
        subtitle={t.projectSkillBrowserSubtitle}
      >
        {snapshot.importedProjects.length ? (
          <div className="space-y-3">
            {snapshot.importedProjects.map((project) => (
              <div key={project.id} className="app-card overflow-hidden">
                <div className="p-5">
                  <div className="min-w-0">
                    <p className="font-medium app-text">{project.name}</p>
                    <p className="mt-2 break-all text-sm leading-6 app-text-soft">{project.path}</p>
                    <p className="mt-2 text-xs app-text-soft">
                      {t.skillCount}: {project.skillCount}
                    </p>
                  </div>
                </div>
                <div className="border-t border-white/10 px-5 py-4">
                  <WorkspaceTree
                    emptyMessage={t.projectTreeEmpty}
                    nodes={project.tree}
                    onInstallWorkspaceSkill={onInstallWorkspaceSkill}
                    onOpenPath={onOpenPath}
                    projectRoot={project.path}
                  />
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white/10 bg-black/10 px-5 py-4">
                  <IconActionButton icon={FolderOpen} label={t.openFolder} onClick={() => void onOpenPath(project.path)} />
                  <IconActionButton icon={Trash2} label={t.delete} onClick={() => void onRemoveProject(project.path)} tone="danger" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title={t.projectDirectories} description={t.projectDirectoriesSubtitle} />
        )}
      </SectionCard>

      <div className="grid gap-6">
        <SectionCard title={t.recentFailures} subtitle={t.recentFailuresSubtitle}>
          {snapshot.summary.recentFailures.length ? (
            <div className="space-y-3">
              {snapshot.summary.recentFailures.map((log) => (
                <button
                  key={log.id}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-left transition hover:border-ember/30 hover:bg-white/5"
                  onClick={() => onOpenLogsFromOverview(log.id)}
                  type="button"
                >
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="h-4 w-4 text-ember" />
                    <p className="font-medium app-text">{log.message}</p>
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm app-text-soft">{log.detail || t.noExtraDetail}</p>
                  <p className="mt-3 text-xs app-text-soft">
                    <RelativeTimeText value={log.createdAt} />
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState description={t.noRecentFailuresDescription} title={t.noRecentFailures} />
          )}
        </SectionCard>
      </div>
    </div>
  );
}

export function ImportSection({
  t,
  installPathConfigured,
  dropzone,
  remoteUrl,
  onRemoteUrlChange,
  onImportZip,
  onRemoteAction,
  snapshot,
  selectedStagedId,
  onOpenStagedDetail,
  onParseStaged,
  onRemoveStaged,
  selectedCategory,
  onCategoryChange
}: {
  t: TranslationDictionary;
  installPathConfigured: boolean;
  dropzone: DropzoneState;
  remoteUrl: string;
  onRemoteUrlChange: (value: string) => void;
  onImportZip: (mode: "staged" | "install") => AsyncActionResult;
  onRemoteAction: (mode: "staged" | "install") => AsyncActionResult;
  snapshot: SkillManagerSnapshot;
  selectedStagedId: string | null;
  onOpenStagedDetail: (id: string) => AsyncActionResult;
  onParseStaged: (ids: string[]) => AsyncActionResult;
  onRemoveStaged: (ids: string[]) => AsyncActionResult;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionCard title={t.localZipImport} subtitle={t.localZipImportSubtitle}>
        <div
          {...dropzone.getRootProps()}
          className={cn(
            "rounded-[28px] border border-dashed p-8 text-center transition",
            dropzone.isDragActive
              ? "border-signal bg-signal/10"
              : "border-black/15 dark:border-white/15 bg-transparent hover:border-black/30 dark:hover:border-white/30 hover:bg-black/5 dark:hover:bg-white/5"
          )}
        >
          <input {...dropzone.getInputProps()} />
          <UploadCloud className="mx-auto h-10 w-10 text-signal" />
          <p className="mt-4 text-lg font-medium app-text">{t.localZipDropTitle}</p>
          <p className="mt-2 text-sm app-text-soft">{t.localZipDropHelp}</p>
          {!installPathConfigured ? (
            <p className="mt-3 text-sm text-amber-200">{t.installPathRequiredBody}</p>
          ) : null}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              className="app-button"
              onClick={() => void onImportZip("staged")}
              type="button"
            >
              {t.chooseZip}
            </button>
            <button
              className={cn(
                "rounded-2xl px-4 py-2 text-sm font-medium transition",
                installPathConfigured
                  ? "app-button-primary"
                  : "cursor-not-allowed border border-white/10 bg-white/5 app-text-soft"
              )}
              disabled={!installPathConfigured}
              onClick={() => void onImportZip("install")}
              type="button"
            >
              {t.installNow}
            </button>
          </div>
        </div>
      </SectionCard>

      <SectionCard title={t.addRemoteSource} subtitle={t.addRemoteSourceSubtitle}>
        <div className="app-surface-subtle rounded-3xl p-4">
          <label className="block text-sm font-medium app-text" htmlFor="remote-url">
            {t.remoteSourceLabel}
          </label>
          <div className="mt-3 flex flex-col gap-3 lg:flex-row">
            <input
              className="app-input h-12 flex-1 rounded-2xl px-4 text-sm outline-none transition focus:border-signal/45"
              id="remote-url"
              onChange={(event) => onRemoteUrlChange(event.target.value)}
              placeholder={t.remoteSourcePlaceholder}
              value={remoteUrl}
            />
            <button
              className="app-button"
              onClick={() => void onRemoteAction("staged")}
              type="button"
            >
              {t.analyzeNow || t.parseSelected}
            </button>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="安装分类" subtitle="新导入的 skill 默认会安装到这里。">
        <div className="app-surface-subtle rounded-3xl p-4">
          <select
            className="app-input h-10 w-full rounded-2xl px-4 text-sm outline-none focus:border-signal/45"
            onChange={(event) => onCategoryChange(event.target.value)}
            value={selectedCategory}
          >
            <option value="">默认根目录</option>
            {snapshot.installCategories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </SectionCard>

      <SectionCard title={t.stagedSources} subtitle={t.stagedSourcesSubtitle}>
        {snapshot.stagedSources.length ? (
          <div className="space-y-3">
            {snapshot.stagedSources.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "overflow-hidden rounded-[28px] border transition",
                  selectedStagedId === item.id
                    ? "border-signal/45 bg-signal/10"
                    : "app-surface hover:border-white/20 hover:bg-white/5"
                )}
              >
                <button className="w-full px-5 py-5 text-left" onClick={() => void onOpenStagedDetail(item.id)} type="button">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium app-text">{item.detectedName || item.sourceValue}</p>
                        <SourceBadge source={item.sourceType} t={t} />
                      </div>
                      <p className="mt-2 text-sm app-text-soft">
                        {item.detectedDescription || item.analysisSummary || item.errorMessage || t.waitingForMetadataParsing}
                      </p>
                    </div>
                    <StatusIndicator status={item.status} t={t} />
                  </div>
                </button>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-4">
                  <p className="text-xs app-text-soft">
                    <RelativeTimeText value={item.updatedAt} />
                  </p>
                  <div className="flex flex-wrap justify-end gap-2">
                    <IconActionButton
                      icon={RefreshCcw}
                      label={t.reparse}
                      onClick={() => void onParseStaged([item.id])}
                    />
                    <IconActionButton
                      icon={Eye}
                      label={t.view}
                      onClick={() => void onOpenStagedDetail(item.id)}
                      tone="success"
                    />
                    <IconActionButton
                      icon={Trash2}
                      label={t.delete}
                      onClick={() => void onRemoveStaged([item.id])}
                      tone="danger"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState description={t.stagingAreaEmptyDescription} title={t.stagingAreaEmpty} />
        )}
      </SectionCard>
    </div>
  );
}

export function StagedSection({
  snapshot,
  t,
  selectedStageIds,
  selectedStagedId,
  onToggleStageSelection,
  onLoadStagedDetail,
  onParseStaged,
  onRemoveStaged,
  onClearStaged
}: {
  snapshot: SkillManagerSnapshot;
  t: TranslationDictionary;
  selectedStageIds: string[];
  selectedStagedId: string | null;
  onToggleStageSelection: (id: string) => void;
  onLoadStagedDetail: (id: string) => AsyncActionResult;
  onParseStaged: (ids: string[]) => AsyncActionResult;
  onRemoveStaged: (ids: string[]) => AsyncActionResult;
  onClearStaged: () => AsyncActionResult;
}) {
  return (
    <div className="space-y-6">
      <SectionCard
        title={t.stagedSources}
        subtitle={t.stagedSourcesSubtitle}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              className="app-button"
              href="/import"
            >
              {t.toImport}
            </Link>
            <button
              className="app-button"
              onClick={() =>
                void onParseStaged(
                  selectedStageIds.length ? selectedStageIds : snapshot.stagedSources.map((item) => item.id)
                )
              }
              type="button"
            >
              {t.parseSelected}
            </button>
            <button
              className="app-button"
              onClick={() => void onRemoveStaged(selectedStageIds)}
              type="button"
            >
              {t.removeSelected}
            </button>
            <button
              className="app-button"
              onClick={() => void onClearStaged()}
              type="button"
            >
              {t.clearStaging}
            </button>
          </div>
        }
      >
        {snapshot.stagedSources.length ? (
          <div className="space-y-3">
            {snapshot.stagedSources.map((item) => (
              <button
                key={item.id}
                className={cn(
                  "w-full rounded-3xl border p-4 text-left transition",
                  selectedStagedId === item.id
                    ? "border-signal/45 bg-signal/10"
                    : "app-surface hover:border-white/20 hover:bg-white/5"
                )}
                onClick={() => void onLoadStagedDetail(item.id)}
                type="button"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <input
                      checked={selectedStageIds.includes(item.id)}
                      className="mt-1 h-4 w-4 rounded app-input"
                      onChange={() => onToggleStageSelection(item.id)}
                      onClick={(event) => event.stopPropagation()}
                      type="checkbox"
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium app-text">{item.detectedName || item.sourceValue}</p>
                        <SourceBadge source={item.sourceType} t={t} />
                      </div>
                      <p className="mt-2 text-sm app-text-soft">
                        {item.detectedDescription || item.errorMessage || t.waitingForMetadataParsing}
                      </p>
                    </div>
                  </div>
                  <StatusIndicator status={item.status} t={t} />
                </div>
                <p className="mt-3 text-xs app-text-soft">
                  <RelativeTimeText value={item.updatedAt} />
                </p>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState description={t.stagingAreaEmptyDescription} title={t.stagingAreaEmpty} />
        )}
      </SectionCard>
    </div>
  );
}

export function SkillsSection({
  t,
  installedSkills,
  selectedSkillId,
  searchValue,
  onSearchValueChange,
  onLoadSkillDetail,
  onOpenPath,
  categories,
  selectedCategory,
  onCategoryChange
}: {
  t: TranslationDictionary;
  installedSkills: InstalledSkillRecord[];
  selectedSkillId: string | null;
  searchValue: string;
  onSearchValueChange: (value: string) => void;
  onLoadSkillDetail: (id: string) => AsyncActionResult;
  onOpenPath: (path: string) => AsyncActionResult;
  categories: SkillCategoryRecord[];
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionCard title={t.installedSkills}>
        <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr),220px]">
          <div className="app-search-shell flex items-center gap-3">
            <Search className="h-4 w-4 app-text-soft" />
            <input
              className="h-10 flex-1 bg-transparent text-sm app-text outline-none placeholder:app-text-soft"
              onChange={(event) => onSearchValueChange(event.target.value)}
              placeholder={t.searchPlaceholder}
              value={searchValue}
            />
          </div>
          <select
            className="app-input h-10 rounded-2xl px-4 text-sm outline-none focus:border-signal/45"
            onChange={(event) => onCategoryChange(event.target.value)}
            value={selectedCategory}
          >
            <option value="">全部分类</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {installedSkills.length ? (
          <div className="space-y-3">
            {installedSkills.map((skill) => (
              <div
                key={skill.id}
                className={cn(
                  "overflow-hidden rounded-[28px] border transition",
                  selectedSkillId === skill.id
                    ? "border-moss/45 bg-moss/10"
                    : "app-surface hover:border-white/20 hover:bg-white/5"
                )}
              >
                <div className="p-5">
                  <button
                    className="min-w-0 flex-1 text-left"
                    onClick={() => void onLoadSkillDetail(skill.id)}
                    type="button"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold tracking-tight app-text">{skill.name}</p>
                      <SourceBadge source={skill.sourceType} t={t} />
                      {skill.category ? <span className="app-tag normal-case tracking-normal">{skill.category}</span> : null}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-ink-200/72">
                      {skill.description || t.noDescriptionAvailable}
                    </p>
                  </button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-4">
                  <p className="text-xs app-text-soft">
                    <RelativeTimeText value={skill.installedAt} />
                  </p>
                  <div className="flex flex-wrap justify-end gap-2">
                    <IconActionButton
                      icon={FolderOpen}
                      label={t.openFolder}
                      onClick={() => void onOpenPath(skill.installPath)}
                    />
                    <IconActionButton
                      icon={Eye}
                      label={t.view}
                      onClick={() => void onLoadSkillDetail(skill.id)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState description={t.noInstalledSkillsYetDescription} title={t.noInstalledSkillsYet} />
        )}
      </SectionCard>
    </div>
  );
}

export function LogsSection({
  snapshot,
  t,
  selectedLogId,
  onSelectLog
}: {
  snapshot: SkillManagerSnapshot;
  t: TranslationDictionary;
  selectedLogId: string | null;
  onSelectLog: (logId: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionCard title={t.operationLogs} subtitle={t.operationLogsSubtitle}>
        {snapshot.logs.length ? (
          <div className="space-y-3">
            {snapshot.logs.map((log) => (
              <button
                key={log.id}
                className={cn(
                  "w-full rounded-3xl border p-4 text-left transition",
                  selectedLogId === log.id
                    ? "border-ember/45 bg-ember/10"
                    : "border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:border-black/20 dark:hover:border-white/20 hover:bg-black/10 dark:hover:bg-white/10"
                )}
                onClick={() => onSelectLog(log.id)}
                type="button"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className={cn("font-medium", logTone(log))}>{log.message}</p>
                  <span className="text-xs uppercase tracking-[0.16em] opacity-50 app-text-soft">
                    {log.level === "error"
                      ? t.logLevelError
                      : log.level === "warning"
                        ? t.logLevelWarning
                        : t.logLevelInfo}
                  </span>
                </div>
                <p className="mt-2 text-sm opacity-80 app-text-soft">{log.detail || t.noExtraDetail}</p>
                <p className="mt-3 text-xs opacity-50 app-text-soft">
                  <RelativeTimeText value={log.createdAt} />
                </p>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState description={t.noLogsYetDescription} title={t.noLogsYet} />
        )}
      </SectionCard>
    </div>
  );
}

export function SettingsSection({
  snapshot,
  t,
  settingsDraft,
  setSettingsDraft,
  onPickInstallDir,
  onValidateInstallDir,
  onPickTempDir,
  onValidateTempDir,
  onSaveSettings,
  onOpenPath,
  onCreateCategory,
  newCategoryName,
  onNewCategoryNameChange
}: {
  snapshot: SkillManagerSnapshot;
  t: TranslationDictionary;
  settingsDraft: SaveSettingsInput;
  setSettingsDraft: Dispatch<SetStateAction<SaveSettingsInput>>;
  onPickInstallDir: () => AsyncActionResult;
  onValidateInstallDir: () => AsyncActionResult;
  onPickTempDir: () => AsyncActionResult;
  onValidateTempDir: () => AsyncActionResult;
  onSaveSettings: () => AsyncActionResult;
  onOpenPath: (path: string) => AsyncActionResult;
  onCreateCategory: () => AsyncActionResult;
  newCategoryName: string;
  onNewCategoryNameChange: (value: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionCard title={t.settingsTitle} subtitle={t.settingsSubtitle}>
        <div className="app-surface space-y-4 rounded-3xl p-4">
          <div>
            <label className="block text-sm font-medium app-text" htmlFor="install-dir">
              {t.defaultInstallDirectory}
            </label>
            <div className="mt-2 flex flex-col gap-2 xl:flex-row">
              <input
                className="app-input h-10 flex-1 rounded-2xl px-4 text-sm outline-none transition focus:border-signal/45"
                id="install-dir"
                onChange={(event) =>
                  setSettingsDraft((current) => ({
                    ...current,
                    installDir: event.target.value
                  }))
                }
                placeholder={t.installDirPlaceholder}
                value={settingsDraft.installDir}
              />
              <button
                className="app-button rounded-2xl px-4 py-2"
                onClick={() => void onPickInstallDir()}
                type="button"
              >
                {t.choose}
              </button>
              <button
                className="app-button rounded-2xl px-4 py-2"
                onClick={() => void onValidateInstallDir()}
                type="button"
              >
                {t.validate}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium app-text" htmlFor="temp-dir">
              {t.tempDirectory}
            </label>
            <div className="mt-2 flex flex-col gap-2 xl:flex-row">
              <input
                className="app-input h-10 flex-1 rounded-2xl px-4 text-sm outline-none transition focus:border-signal/45"
                id="temp-dir"
                onChange={(event) =>
                  setSettingsDraft((current) => ({
                    ...current,
                    tempDir: event.target.value
                  }))
                }
                placeholder={`${t.tempDirPlaceholderPrefix} (${snapshot.runtime.dataRoot || "data"})`}
                value={settingsDraft.tempDir}
              />
              <button
                className="app-button rounded-2xl px-4 py-2"
                onClick={() => void onPickTempDir()}
                type="button"
              >
                {t.choose}
              </button>
              <button
                className="app-button rounded-2xl px-4 py-2"
                onClick={() => void onValidateTempDir()}
                type="button"
              >
                {t.validate}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium app-text">技能分类</label>
            <div className="mt-2 flex flex-col gap-2 xl:flex-row">
              <input
                className="app-input h-10 flex-1 rounded-2xl px-4 text-sm outline-none transition focus:border-signal/45"
                onChange={(event) => onNewCategoryNameChange(event.target.value)}
                placeholder="例如 video"
                value={newCategoryName}
              />
              <button
                className="app-button rounded-2xl px-4 py-2"
                onClick={() => void onCreateCategory()}
                type="button"
              >
                创建分类
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {settingsDraft.skillCategories.length ? (
                settingsDraft.skillCategories.map((category) => (
                  <button
                    key={category}
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm transition",
                      settingsDraft.defaultSkillCategory === category
                        ? "border-signal/40 bg-signal/15 text-signal"
                        : "app-surface-subtle app-text-soft"
                    )}
                    onClick={() =>
                      setSettingsDraft((current) => ({
                        ...current,
                        defaultSkillCategory: category
                      }))
                    }
                    type="button"
                  >
                    {category}
                  </button>
                ))
              ) : (
                <p className="text-sm app-text-soft">还没有分类，创建后就可以把 skill 放到对应目录。</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium app-text">主题</label>
            <div className="mt-2 flex items-center gap-2">
              <button
                className={cn(
                  "inline-flex h-10 items-center gap-2 rounded-2xl border px-4 text-sm transition",
                  settingsDraft.theme === "light"
                    ? "border-transparent shadow-md"
                    : "app-surface-subtle app-text-soft hover:bg-black/5"
                )}
                style={
                  settingsDraft.theme === "light"
                    ? { background: "var(--app-text)", color: "var(--app-bg-start)" }
                    : undefined
                }
                onClick={() => setSettingsDraft((current) => ({ ...current, theme: "light" }))}
                type="button"
              >
                <SunMoon className="h-4 w-4" />
                浅色
              </button>
              <button
                className={cn(
                  "inline-flex h-10 items-center gap-2 rounded-2xl border px-4 text-sm transition",
                  settingsDraft.theme === "dark"
                    ? "border-transparent shadow-md"
                    : "app-surface-subtle app-text-soft hover:bg-black/5"
                )}
                style={
                  settingsDraft.theme === "dark"
                    ? { background: "var(--app-text)", color: "var(--app-bg-start)" }
                    : undefined
                }
                onClick={() => setSettingsDraft((current) => ({ ...current, theme: "dark" }))}
                type="button"
              >
                <SunMoon className="h-4 w-4" />
                深色
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium app-text" htmlFor="conflict-policy">
              {t.conflictPolicy}
            </label>
            <select
              className="app-input mt-2 h-10 w-full rounded-2xl px-4 text-sm outline-none focus:border-signal/45"
              id="conflict-policy"
              onChange={(event) =>
                setSettingsDraft((current) => ({
                  ...current,
                  conflictPolicy: event.target.value as SaveSettingsInput["conflictPolicy"]
                }))
              }
              value={settingsDraft.conflictPolicy}
            >
              <option value="rename">{t.conflictRename}</option>
              <option value="skip">{t.conflictSkip}</option>
              <option value="overwrite">{t.conflictOverwrite}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium app-text" htmlFor="locale">
              {t.interfaceLanguage}
            </label>
            <select
              className="app-input mt-2 h-10 w-full rounded-2xl px-4 text-sm outline-none focus:border-signal/45"
              id="locale"
              onChange={(event) =>
                setSettingsDraft((current) => ({
                  ...current,
                  locale: event.target.value as SaveSettingsInput["locale"]
                }))
              }
              value={settingsDraft.locale}
            >
              <option value="zh-CN">{t.languageChinese}</option>
              <option value="en">{t.languageEnglish}</option>
            </select>
          </div>

          <div className="app-surface-subtle rounded-3xl p-4">
            <p className="text-sm font-medium app-text">AI</p>
            <p className="mt-1 text-sm app-text-soft">
              配置用于远程仓库识别和总结的 AI 服务。
            </p>

            <div className="mt-4 grid gap-4">
              <label className="flex items-center gap-3 text-sm app-text">
                <input
                  checked={settingsDraft.ai.enabled}
                  className="h-4 w-4 rounded border-white/20 bg-black/30"
                  onChange={(event) =>
                    setSettingsDraft((current) => ({
                      ...current,
                      ai: {
                        ...current.ai,
                        enabled: event.target.checked
                      }
                    }))
                  }
                  type="checkbox"
                />
                启用 AI 识别
              </label>

              <div>
                <label className="block text-sm font-medium app-text" htmlFor="ai-provider">
                  提供方
                </label>
                <input
                  className="app-input mt-2 h-10 w-full rounded-2xl px-4 text-sm outline-none transition focus:border-signal/45"
                  id="ai-provider"
                  onChange={(event) =>
                    setSettingsDraft((current) => ({
                      ...current,
                      ai: {
                        ...current.ai,
                        provider: event.target.value as SaveSettingsInput["ai"]["provider"]
                      }
                    }))
                  }
                  value={settingsDraft.ai.provider}
                />
              </div>

              <div>
                <label className="block text-sm font-medium app-text" htmlFor="ai-base-url">
                  接口地址
                </label>
                <input
                  className="app-input mt-2 h-10 w-full rounded-2xl px-4 text-sm outline-none transition focus:border-signal/45"
                  id="ai-base-url"
                  onChange={(event) =>
                    setSettingsDraft((current) => ({
                      ...current,
                      ai: {
                        ...current.ai,
                        baseUrl: event.target.value
                      }
                    }))
                  }
                  value={settingsDraft.ai.baseUrl}
                />
              </div>

              <div>
                <label className="block text-sm font-medium app-text" htmlFor="ai-model">
                  模型
                </label>
                <input
                  className="app-input mt-2 h-10 w-full rounded-2xl px-4 text-sm outline-none transition focus:border-signal/45"
                  id="ai-model"
                  onChange={(event) =>
                    setSettingsDraft((current) => ({
                      ...current,
                      ai: {
                        ...current.ai,
                        model: event.target.value
                      }
                    }))
                  }
                  value={settingsDraft.ai.model}
                />
              </div>

              <div>
                <label className="block text-sm font-medium app-text" htmlFor="ai-api-key">
                  API Key
                </label>
                <input
                  className="app-input mt-2 h-10 w-full rounded-2xl px-4 text-sm outline-none transition focus:border-signal/45"
                  id="ai-api-key"
                  onChange={(event) =>
                    setSettingsDraft((current) => ({
                      ...current,
                      ai: {
                        ...current.ai,
                        apiKey: event.target.value
                      }
                    }))
                  }
                  type="password"
                  value={settingsDraft.ai.apiKey}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
              <button
                className="app-button-primary px-5"
                onClick={() => void onSaveSettings()}
                type="button"
              >
                {t.saveSettings}
              </button>
              <button
                className="app-button px-5"
                onClick={() => void onOpenPath(settingsDraft.installDir)}
                type="button"
              >
              {t.openInstallFolder}
            </button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

export function WorkspacePrimarySection({
  section,
  snapshot,
  t,
  installPathConfigured,
  onChooseInstallDir,
  onGoImport,
  onGoStaged,
  remoteUrl,
  onRemoteUrlChange,
  selectedStageIds,
  selectedStagedId,
  selectedSkillId,
  selectedLogId,
  searchValue,
  installedSkills,
  settingsDraft,
  setSettingsDraft,
  dropzone,
  onToggleStageSelection,
  onImportProject,
  onRemoveProject,
  onOpenSystemSourceModal,
  onOpenPath,
  onImportZip,
  onRemoteAction,
  onParseStaged,
  onRemoveStaged,
  onClearStaged,
  onLoadStagedDetail,
  onOpenStagedDetail,
  onLoadSkillDetail,
  onSelectLog,
  onOpenLogsFromOverview,
  onInstallWorkspaceSkill,
  onSearchValueChange,
  onPickInstallDir,
  onValidateInstallDir,
  onPickTempDir,
  onValidateTempDir,
  onSaveSettings,
  onCreateCategory,
  newCategoryName,
  onNewCategoryNameChange,
  selectedCategory,
  onCategoryChange
}: {
  section: WorkspaceSection;
  snapshot: SkillManagerSnapshot | null;
  t: TranslationDictionary;
  installPathConfigured: boolean;
  onChooseInstallDir: () => AsyncActionResult;
  onGoImport: () => AsyncActionResult;
  onGoStaged: () => AsyncActionResult;
  remoteUrl: string;
  onRemoteUrlChange: (value: string) => void;
  selectedStageIds: string[];
  selectedStagedId: string | null;
  selectedSkillId: string | null;
  selectedLogId: string | null;
  searchValue: string;
  installedSkills: InstalledSkillRecord[];
  settingsDraft: SaveSettingsInput;
  setSettingsDraft: Dispatch<SetStateAction<SaveSettingsInput>>;
  dropzone: DropzoneState;
  onToggleStageSelection: (id: string) => void;
  onImportProject: () => AsyncActionResult;
  onRemoveProject: (projectPath: string) => AsyncActionResult;
  onOpenSystemSourceModal: (source: WorkspaceSkillSource) => void;
  onOpenPath: (path: string) => AsyncActionResult;
  onImportZip: (mode: "staged" | "install") => AsyncActionResult;
  onRemoteAction: (mode: "staged" | "install") => AsyncActionResult;
  onParseStaged: (ids: string[]) => AsyncActionResult;
  onRemoveStaged: (ids: string[]) => AsyncActionResult;
  onClearStaged: () => AsyncActionResult;
  onLoadStagedDetail: (id: string) => AsyncActionResult;
  onOpenStagedDetail: (id: string) => AsyncActionResult;
  onLoadSkillDetail: (id: string) => AsyncActionResult;
  onSelectLog: (logId: string) => void;
  onOpenLogsFromOverview: (logId: string) => void;
  onInstallWorkspaceSkill: (
    sourceRoot: string,
    skillRootPath: string,
    providerKey: WorkspaceSkillProviderKey
  ) => AsyncActionResult;
  onSearchValueChange: (value: string) => void;
  onPickInstallDir: () => AsyncActionResult;
  onValidateInstallDir: () => AsyncActionResult;
  onPickTempDir: () => AsyncActionResult;
  onValidateTempDir: () => AsyncActionResult;
  onSaveSettings: () => AsyncActionResult;
  onCreateCategory: () => AsyncActionResult;
  newCategoryName: string;
  onNewCategoryNameChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
}) {
  if (!snapshot) {
    return (
      <SectionCard title={t.loadingWorkspace} subtitle={t.loadingWorkspaceSubtitle}>
        <div className="app-surface rounded-3xl p-5 text-sm app-text-soft">
          {t.loadingWorkspaceBody}
        </div>
      </SectionCard>
    );
  }

  switch (section) {
    case "overview":
      return (
        <OverviewSection
          installPathConfigured={installPathConfigured}
          onChooseInstallDir={onChooseInstallDir}
          onGoImport={onGoImport}
          onGoStaged={onGoStaged}
          onImportProject={onImportProject}
          onOpenLogsFromOverview={onOpenLogsFromOverview}
          onOpenPath={onOpenPath}
          onOpenSystemSourceModal={onOpenSystemSourceModal}
          onInstallWorkspaceSkill={onInstallWorkspaceSkill}
          onRemoveProject={onRemoveProject}
          snapshot={snapshot}
          t={t}
        />
      );
    case "import":
      return (
        <ImportSection
          dropzone={dropzone}
          installPathConfigured={installPathConfigured}
          onCategoryChange={onCategoryChange}
          onImportZip={onImportZip}
          onOpenStagedDetail={onOpenStagedDetail}
          onParseStaged={onParseStaged}
          onRemoveStaged={onRemoveStaged}
          onRemoteAction={onRemoteAction}
          onRemoteUrlChange={onRemoteUrlChange}
          remoteUrl={remoteUrl}
          selectedCategory={selectedCategory}
          selectedStagedId={selectedStagedId}
          snapshot={snapshot}
          t={t}
        />
      );
    case "staged":
      return (
        <StagedSection
          onClearStaged={onClearStaged}
          onLoadStagedDetail={onLoadStagedDetail}
          onParseStaged={onParseStaged}
          onRemoveStaged={onRemoveStaged}
          onToggleStageSelection={onToggleStageSelection}
          selectedStageIds={selectedStageIds}
          selectedStagedId={selectedStagedId}
          snapshot={snapshot}
          t={t}
        />
      );
    case "skills":
      return (
        <SkillsSection
          categories={snapshot.installCategories}
          installedSkills={installedSkills}
          onCategoryChange={onCategoryChange}
          onLoadSkillDetail={onLoadSkillDetail}
          onOpenPath={onOpenPath}
          onSearchValueChange={onSearchValueChange}
          searchValue={searchValue}
          selectedCategory={selectedCategory}
          selectedSkillId={selectedSkillId}
          t={t}
        />
      );
    case "logs":
      return <LogsSection onSelectLog={onSelectLog} selectedLogId={selectedLogId} snapshot={snapshot} t={t} />;
    case "settings":
      return (
        <SettingsSection
          newCategoryName={newCategoryName}
          onCreateCategory={onCreateCategory}
          onNewCategoryNameChange={onNewCategoryNameChange}
          onOpenPath={onOpenPath}
          onPickInstallDir={onPickInstallDir}
          onPickTempDir={onPickTempDir}
          onSaveSettings={onSaveSettings}
          onValidateInstallDir={onValidateInstallDir}
          onValidateTempDir={onValidateTempDir}
          setSettingsDraft={setSettingsDraft}
          settingsDraft={settingsDraft}
          snapshot={snapshot}
          t={t}
        />
      );
  }
}

export function WorkspaceDetailPanel({
  section,
  selectedSkillDetail,
  selectedStagedDetail,
  selectedLog,
  t,
  onOpenPath,
  onRescanInstalledSkill,
  onParseStaged,
  onInstallStaged
}: {
  section: WorkspaceSection;
  selectedSkillDetail: InstalledSkillDetail | null;
  selectedStagedDetail: StagedSourceDetail | null;
  selectedLog: LogRecord | null;
  t: TranslationDictionary;
  onOpenPath: (path: string) => AsyncActionResult;
  onRescanInstalledSkill: (id: string) => AsyncActionResult;
  onParseStaged: (ids: string[]) => AsyncActionResult;
  onInstallStaged: (ids: string[]) => AsyncActionResult;
}) {
  if (section === "skills" && selectedSkillDetail) {
    return (
      <SectionCard
        title={selectedSkillDetail.name}
        subtitle={selectedSkillDetail.exists ? t.installedSkillDetail : t.installedSkillRecordMissing}
        actions={
          <div className="flex gap-2">
            <IconActionButton
              icon={FolderOpen}
              label={t.openFolder}
              onClick={() => void onOpenPath(selectedSkillDetail.installPath)}
            />
            <IconActionButton
              icon={RefreshCcw}
              label={t.rescan}
              onClick={() => void onRescanInstalledSkill(selectedSkillDetail.id)}
            />
          </div>
        }
      >
        <div className="space-y-4">
          <div className="app-surface-subtle rounded-3xl p-4 text-sm app-text">
            <div className="flex flex-wrap items-center gap-2">
              <SourceBadge source={selectedSkillDetail.sourceType} t={t} />
              <span className="rounded-full border border-moss/25 bg-moss/10 px-2.5 py-1 text-xs uppercase tracking-[0.16em] text-moss">
                {t.installedStatus}
              </span>
            </div>
            <p className="mt-3">{selectedSkillDetail.description || t.noDescriptionExtractedForSkill}</p>
            <div className="mt-4 space-y-1 text-xs app-text-soft">
              {selectedSkillDetail.category ? <p>分类: {selectedSkillDetail.category}</p> : null}
              <p>{t.installPath}: {selectedSkillDetail.installPath}</p>
              <p>
                {t.installedAt}: <RelativeTimeText value={selectedSkillDetail.installedAt} />
              </p>
            </div>
          </div>
          <MarkdownViewer markdown={selectedSkillDetail.markdown} />
        </div>
      </SectionCard>
    );
  }

  if (section === "staged" && selectedStagedDetail) {
    const isRemoteSource =
      selectedStagedDetail.sourceType === "githubRepo" || selectedStagedDetail.sourceType === "remoteZip";
    const detailLabel = selectedStagedDetail.analysisMethod === "rules+ai" ? "AI 总结" : "规则识别";

    return (
      <SectionCard
        title={selectedStagedDetail.detectedName || t.stagedSourceDetail}
        subtitle={t.stagedSourceDetailSubtitle}
        actions={
          <div className="flex gap-2">
            <IconActionButton
              icon={RefreshCcw}
              label={t.reparse}
              onClick={() => void onParseStaged([selectedStagedDetail.id])}
            />
            {!isRemoteSource ? (
              <IconActionButton
                icon={Plus}
                label={t.install}
                onClick={() => void onInstallStaged([selectedStagedDetail.id])}
                tone="success"
              />
            ) : null}
          </div>
        }
      >
        <div className="space-y-4">
          <div className="app-surface-subtle rounded-3xl p-4 text-sm app-text">
            <div className="flex flex-wrap items-center gap-2">
              <SourceBadge source={selectedStagedDetail.sourceType} t={t} />
              <StrategyBadge strategy={selectedStagedDetail.installStrategy} />
              <span
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs uppercase tracking-[0.16em]",
                  statusTone(selectedStagedDetail.status)
                )}
              >
                {statusLabel(selectedStagedDetail.status, t)}
              </span>
            </div>
            {isRemoteSource ? (
              <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                {t.remoteSourceAnalysisOnly}
              </div>
            ) : null}
            <p className="mt-3 text-base app-text">
              {selectedStagedDetail.detectedDescription || selectedStagedDetail.sourceValue}
            </p>
            <div className="mt-4 space-y-2 text-xs app-text-soft">
              <p>{t.sourceValue}: {selectedStagedDetail.sourceValue}</p>
              <p>{t.archivePath}: {selectedStagedDetail.archivePath || t.archivePathPending}</p>
              <p>{t.skillRoot}: {selectedStagedDetail.skillRootPath || t.skillRootPending}</p>
              {selectedStagedDetail.analysisMethod ? <p>识别方式: {detailLabel}</p> : null}
              {selectedStagedDetail.readmeUrl ? <p>README: {selectedStagedDetail.readmeUrl}</p> : null}
              {selectedStagedDetail.errorMessage ? <p>{t.errorLabel}: {selectedStagedDetail.errorMessage}</p> : null}
            </div>
          </div>

          {selectedStagedDetail.analysisSummary ? (
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-ink-200/50">用途总结</p>
              <p className="mt-3 text-sm leading-6 text-ink-100/85">{selectedStagedDetail.analysisSummary}</p>
            </div>
          ) : null}

          <div className="grid gap-4">
            <DetailList title="需要的工具" items={selectedStagedDetail.installStrategy?.requiredTools || []} copyLabel="复制列表" />
            <DetailList title="安装前准备" items={selectedStagedDetail.installStrategy?.prerequisiteSteps || []} copyLabel="复制步骤" />
            {selectedStagedDetail.installStrategy?.command ? (
              <div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-ink-200/50">识别到的命令</p>
                  <CopyButton label="复制命令" value={selectedStagedDetail.installStrategy.command} />
                </div>
                <pre className="mt-2 overflow-x-auto rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-ink-100/90">
                  {selectedStagedDetail.installStrategy.command}
                </pre>
              </div>
            ) : null}
            <DetailList title="手动安装步骤" items={selectedStagedDetail.installStrategy?.manualSteps || []} copyLabel="复制步骤" />
          </div>

          <MarkdownViewer
            markdown={selectedStagedDetail.markdown || selectedStagedDetail.readmeExcerpt}
            emptyMessage={t.noSkillMdPreview}
          />
        </div>
      </SectionCard>
    );
  }

  if (section === "logs" && selectedLog) {
    return (
      <SectionCard title={t.logDetail} subtitle={selectedLog.message}>
        <div className="app-surface-subtle space-y-4 rounded-3xl p-4 text-sm app-text">
          <p className={cn("font-medium", logTone(selectedLog))}>
            {selectedLog.level === "error"
              ? t.logLevelError
              : selectedLog.level === "warning"
                ? t.logLevelWarning
                : t.logLevelInfo}
          </p>
          <p>{selectedLog.detail || t.noExtraDetail}</p>
          <div className="space-y-1 text-xs app-text-soft">
            <p>{t.logType}: {logTypeLabel(selectedLog, t)}</p>
            <p>{t.relatedId}: {selectedLog.relatedId || t.none}</p>
            <p>
              {t.time}: <RelativeTimeText value={selectedLog.createdAt} />
            </p>
          </div>
        </div>
      </SectionCard>
    );
  }

  return null;
}
