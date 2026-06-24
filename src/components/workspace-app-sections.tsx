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
  X,
  Bot,
  Cpu,
  Sparkles
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
    return "text-amber-700 dark:text-amber-200 bg-amber-300/12 dark:bg-amber-300/10 border-amber-400/30 dark:border-amber-300/20";
  }

  return "text-slate-700 dark:text-slate-200 bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10";
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

function isRemoteStagedSource(source: Pick<StagedSourceRecord, "sourceType">) {
  return source.sourceType === "githubRepo" || source.sourceType === "remoteZip";
}

function canInstallStagedSource(source: Pick<StagedSourceRecord, "sourceType" | "status">) {
  return source.status === "ready" && !isRemoteStagedSource(source);
}

function stagedNextStepLabel(source: StagedSourceRecord, t: TranslationDictionary) {
  if (source.status === "installed") {
    return t.stagedNextInstalled;
  }

  if (canInstallStagedSource(source)) {
    return t.stagedNextInstall;
  }

  if (source.status === "error") {
    return t.stagedNextError;
  }

  if (source.status === "processing") {
    return t.stagedNextProcessing;
  }

  if (source.status === "ready" && isRemoteStagedSource(source)) {
    return t.stagedNextManual;
  }

  return t.stagedNextPending;
}

function OpenAIIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" fillRule="evenodd" height="1em" style={{flex:"none",lineHeight:1}} viewBox="0 0 24 24" width="1em" xmlns="http://www.w3.org/2000/svg">
      <title>OpenAI</title>
      <path d="M9.205 8.658v-2.26c0-.19.072-.333.238-.428l4.543-2.616c.619-.357 1.356-.523 2.117-.523 2.854 0 4.662 2.212 4.662 4.566 0 .167 0 .357-.024.547l-4.71-2.759a.797.797 0 00-.856 0l-5.97 3.473zm10.609 8.8V12.06c0-.333-.143-.57-.429-.737l-5.97-3.473 1.95-1.118a.433.433 0 01.476 0l4.543 2.617c1.309.76 2.189 2.378 2.189 3.948 0 1.808-1.07 3.473-2.76 4.163zM7.802 12.703l-1.95-1.142c-.167-.095-.239-.238-.239-.428V5.899c0-2.545 1.95-4.472 4.591-4.472 1 0 1.927.333 2.712.928L8.23 5.067c-.285.166-.428.404-.428.737v6.898zM12 15.128l-2.795-1.57v-3.33L12 8.658l2.795 1.57v3.33L12 15.128zm1.796 7.23c-1 0-1.927-.332-2.712-.927l4.686-2.712c.285-.166.428-.404.428-.737v-6.898l1.974 1.142c.167.095.238.238.238.428v5.233c0 2.545-1.974 4.472-4.614 4.472zm-5.637-5.303l-4.544-2.617c-1.308-.761-2.188-2.378-2.188-3.948A4.482 4.482 0 014.21 6.327v5.423c0 .333.143.571.428.738l5.947 3.449-1.95 1.118a.432.432 0 01-.476 0zm-.262 3.9c-2.688 0-4.662-2.021-4.662-4.519 0-.19.024-.38.047-.57l4.686 2.71c.286.167.571.167.856 0l5.97-3.448v2.26c0 .19-.07.333-.237.428l-4.543 2.616c-.619.357-1.356.523-2.117.523zm5.899 2.83a5.947 5.947 0 005.827-4.756C22.287 18.339 24 15.84 24 13.296c0-1.665-.713-3.282-1.998-4.448.119-.5.19-.999.19-1.498 0-3.401-2.759-5.946-5.946-.642 0-1.26.095-1.88.31A5.962 5.962 0 0010.205 0a5.947 5.947 0 00-5.827 4.757C1.713 5.447 0 7.945 0 10.49c0 1.666.713 3.283 1.998 4.448-.119.5-.19 1-.19 1.499 0 3.401 2.759 5.946 5.946 5.946.642 0 1.26-.095 1.88-.309a5.96 5.96 0 004.162 1.713z" />
    </svg>
  );
}

function ClaudeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} height="1em" style={{flex:"none",lineHeight:1}} viewBox="0 0 24 24" width="1em" xmlns="http://www.w3.org/2000/svg">
      <title>Claude</title>
      <path d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z" fill="#D97757" fillRule="nonzero"></path>
    </svg>
  );
}

export function ProviderIcon({ providerKey, className }: { providerKey: WorkspaceSkillSource["key"]; className?: string }) {
  switch (providerKey) {
    case "codex":
      return <OpenAIIcon className={className} />;
    case "claude":
      return <ClaudeIcon className={className} />;
    case "agents":
      return <Sparkles className={className} />;
    default:
      return null;
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

export function ProviderInstallButtons({
  onInstall
}: {
  onInstall: (providerKey: WorkspaceSkillProviderKey) => void;
}) {
  const providers: WorkspaceSkillProviderKey[] = ["codex", "claude", "agents"];

  return (
    <div className="flex shrink-0 items-center gap-1">
      {providers.map((providerKey) => (
        <button
          key={providerKey}
          aria-label={`Install for ${providerKey}`}
          className="flex h-7 w-7 items-center justify-center rounded app-text-soft hover:bg-black/10 dark:hover:bg-white/10 hover:app-text transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onInstall(providerKey);
          }}
          title={`Install for ${providerKey}`}
          type="button"
        >
          <ProviderIcon providerKey={providerKey} className="h-4 w-4" />
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
    return <div className="rounded-2xl border border-dashed border-black/15 dark:border-white/15 bg-black/5 dark:bg-black/10 px-4 py-6 text-sm app-text-soft">{emptyMessage}</div>;
  }

  return (
    <div className="space-y-1">
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
    <div>
      <div className="group relative flex items-center gap-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg px-2 -mx-2 transition-colors overflow-hidden">
        <button
          className={cn(
            "flex min-w-0 flex-1 items-center gap-3 text-left before:absolute before:inset-0",
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
            open ? <ChevronDown className="h-4 w-4 shrink-0 app-text-soft" /> : <ChevronRight className="h-4 w-4 shrink-0 app-text-soft" />
          ) : (
            <div className="w-4 shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium app-text" title={node.name}>{node.name}</p>
            {node.description ? <p className="mt-1 line-clamp-2 text-[11px] app-text-soft" title={node.description}>{node.description}</p> : null}
          </div>
        </button>
        <div className="absolute right-0 top-0 bottom-0 flex items-center gap-2 px-1 bg-slate-100 dark:bg-slate-800 opacity-0 transition-opacity duration-150 group-hover:opacity-100 z-10">
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
        <div className="ml-[8px] border-l border-black/10 dark:border-white/10 pl-[4px]">
          <div className="space-y-1">
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
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                          <ProviderIcon providerKey={source.key} className="h-3 w-3" />
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
                    <ProviderIcon providerKey={source.key} className="h-6 w-6" />
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
                <div className="flex items-start justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <p className="font-medium app-text">{project.name}</p>
                    <p className="mt-2 break-all text-sm leading-6 app-text-soft">{project.path}</p>
                    <p className="mt-2 text-xs app-text-soft">
                      {t.skillCount}: {project.skillCount}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <IconActionButton icon={FolderOpen} label={t.openFolder} onClick={() => void onOpenPath(project.path)} />
                    <IconActionButton icon={Trash2} label={t.delete} onClick={() => void onRemoveProject(project.path)} tone="danger" />
                  </div>
                </div>
                <div className="border-t border-black/10 dark:border-white/10 px-5 py-4">
                  <WorkspaceTree
                    emptyMessage={t.projectTreeEmpty}
                    nodes={project.tree}
                    onInstallWorkspaceSkill={onInstallWorkspaceSkill}
                    onOpenPath={onOpenPath}
                    projectRoot={project.path}
                  />
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
                  <p className="mt-2 line-clamp-3 text-sm app-text-soft" title={log.detail}>{log.detail || t.noExtraDetail}</p>
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
  onGoStaged,
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
  onGoStaged: () => AsyncActionResult;
  snapshot: SkillManagerSnapshot;
  selectedStagedId: string | null;
  onOpenStagedDetail: (id: string) => AsyncActionResult;
  onParseStaged: (ids: string[]) => AsyncActionResult;
  onRemoveStaged: (ids: string[]) => AsyncActionResult;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
}) {
  const installableCount = snapshot.stagedSources.filter(canInstallStagedSource).length;
  const manualReviewCount = snapshot.stagedSources.filter(
    (item) => item.status === "ready" && isRemoteStagedSource(item)
  ).length;
  const errorCount = snapshot.stagedSources.filter((item) => item.status === "error").length;
  const latestStagedSource = snapshot.stagedSources[0] || null;

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
            <p className="mt-3 text-sm text-amber-700 dark:text-amber-200">{t.installPathRequiredBody}</p>
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

      <SectionCard title={t.importQueueTitle} subtitle={t.importQueueSubtitle}>
        {snapshot.stagedSources.length ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <OverviewMetric label={t.importQueueInstallable} value={installableCount} />
              <OverviewMetric label={t.importQueueManual} value={manualReviewCount} />
              <OverviewMetric label={t.importQueueErrors} value={errorCount} />
            </div>

            {latestStagedSource ? (
              <div
                className={cn(
                  "overflow-hidden rounded-[28px] border transition",
                  selectedStagedId === latestStagedSource.id
                    ? "border-signal/45 bg-signal/10"
                    : "app-surface"
                )}
              >
                <button
                  className="w-full px-5 py-5 text-left"
                  onClick={() => void onOpenStagedDetail(latestStagedSource.id)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium app-text">{latestStagedSource.detectedName || latestStagedSource.sourceValue}</p>
                        <SourceBadge source={latestStagedSource.sourceType} t={t} />
                      </div>
                      <p className="mt-2 text-sm app-text-soft">
                        {latestStagedSource.detectedDescription ||
                          latestStagedSource.analysisSummary ||
                          latestStagedSource.errorMessage ||
                          t.waitingForMetadataParsing}
                      </p>
                      <p className="mt-3 text-xs uppercase tracking-[0.16em] text-signal">
                        {stagedNextStepLabel(latestStagedSource, t)}
                      </p>
                    </div>
                    <StatusIndicator status={latestStagedSource.status} t={t} />
                  </div>
                </button>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-4">
                  <p className="text-xs app-text-soft">
                    <RelativeTimeText value={latestStagedSource.updatedAt} />
                  </p>
                  <div className="flex flex-wrap justify-end gap-2">
                    <button className="app-button" onClick={() => void onGoStaged()} type="button">
                      {t.quickStartGoStaged}
                    </button>
                    <IconActionButton
                      icon={RefreshCcw}
                      label={t.reparse}
                      onClick={() => void onParseStaged([latestStagedSource.id])}
                    />
                    <IconActionButton
                      icon={Trash2}
                      label={t.delete}
                      onClick={() => void onRemoveStaged([latestStagedSource.id])}
                      tone="danger"
                    />
                  </div>
                </div>
              </div>
            ) : null}

            <div className="rounded-3xl border border-dashed border-white/15 bg-black/10 px-4 py-4 text-sm app-text-soft">
              {t.importQueueFootnote}
            </div>
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
  installPathConfigured,
  selectedStageIds,
  selectedStagedId,
  onToggleStageSelection,
  onLoadStagedDetail,
  onParseStaged,
  onInstallStaged,
  onRemoveStaged,
  onClearStaged
}: {
  snapshot: SkillManagerSnapshot;
  t: TranslationDictionary;
  installPathConfigured: boolean;
  selectedStageIds: string[];
  selectedStagedId: string | null;
  onToggleStageSelection: (id: string) => void;
  onLoadStagedDetail: (id: string) => AsyncActionResult;
  onParseStaged: (ids: string[]) => AsyncActionResult;
  onInstallStaged: (ids: string[]) => AsyncActionResult;
  onRemoveStaged: (ids: string[]) => AsyncActionResult;
  onClearStaged: () => AsyncActionResult;
}) {
  const selectedSources = snapshot.stagedSources.filter((item) => selectedStageIds.includes(item.id));
  const selectedInstallableIds = selectedSources.filter(canInstallStagedSource).map((item) => item.id);
  const installableCount = snapshot.stagedSources.filter(canInstallStagedSource).length;
  const manualReviewCount = snapshot.stagedSources.filter(
    (item) => item.status === "ready" && isRemoteStagedSource(item)
  ).length;
  const errorCount = snapshot.stagedSources.filter((item) => item.status === "error").length;

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
              className={cn("app-button", (!installPathConfigured || selectedInstallableIds.length === 0) && "cursor-not-allowed opacity-60")}
              disabled={!installPathConfigured || selectedInstallableIds.length === 0}
              onClick={() => void onInstallStaged(selectedInstallableIds)}
              type="button"
            >
              {t.installSelected}
            </button>
            <button
              className={cn("app-button", selectedStageIds.length === 0 && "cursor-not-allowed opacity-60")}
              disabled={selectedStageIds.length === 0}
              onClick={() => void onRemoveStaged(selectedStageIds)}
              type="button"
            >
              {t.removeSelected}
            </button>
            <button
              className={cn("app-button", snapshot.stagedSources.length === 0 && "cursor-not-allowed opacity-60")}
              disabled={snapshot.stagedSources.length === 0}
              onClick={() => void onClearStaged()}
              type="button"
            >
              {t.clearStaging}
            </button>
          </div>
        }
      >
        {snapshot.stagedSources.length ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <OverviewMetric label={t.overviewMetricStaged} value={snapshot.stagedSources.length} />
              <OverviewMetric label={t.importQueueInstallable} value={installableCount} />
              <OverviewMetric label={t.importQueueManual} value={manualReviewCount} />
              <OverviewMetric label={t.importQueueErrors} value={errorCount} />
            </div>

            {!installPathConfigured ? (
              <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                {t.installPathRequiredBody}
              </div>
            ) : null}

            {snapshot.stagedSources.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "rounded-3xl border p-4 transition",
                  selectedStagedId === item.id
                    ? "border-signal/45 bg-signal/10"
                    : "app-surface hover:border-white/20 hover:bg-white/5"
                )}
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
                      <p className="mt-3 text-xs uppercase tracking-[0.16em] text-signal">
                        {stagedNextStepLabel(item, t)}
                      </p>
                    </div>
                  </div>
                  <StatusIndicator status={item.status} t={t} />
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                  <p className="text-xs app-text-soft">
                    <RelativeTimeText value={item.updatedAt} />
                  </p>
                  <div className="flex flex-wrap justify-end gap-2">
                    {canInstallStagedSource(item) ? (
                      <IconActionButton
                        icon={Plus}
                        label={t.install}
                        onClick={() => void onInstallStaged([item.id])}
                        tone="success"
                      />
                    ) : null}
                    <IconActionButton
                      icon={Eye}
                      label={t.view}
                      onClick={() => void onLoadStagedDetail(item.id)}
                      tone="success"
                    />
                    <IconActionButton
                      icon={RefreshCcw}
                      label={t.reparse}
                      onClick={() => void onParseStaged([item.id])}
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
  const activeCategoryCount = categories.filter((category) => category.skillCount > 0).length;
  const sourceTypeCount = new Set(installedSkills.map((skill) => skill.sourceType)).size;

  return (
    <div className="space-y-6">
      <SectionCard title={t.installedSkills} subtitle={t.installedSkillsSubtitle}>
        <div className="mb-5 grid gap-4 md:grid-cols-3">
          <OverviewMetric label={t.overviewMetricInstalled} value={installedSkills.length} />
          <OverviewMetric label={t.installedMetricCategories} value={activeCategoryCount} />
          <OverviewMetric label={t.installedMetricSourceTypes} value={sourceTypeCount} />
        </div>

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
            <option value="">{t.allCategories}</option>
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
                    <p className="mt-3 text-sm leading-6 app-text-soft">
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
  onInstallStaged,
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
  onInstallStaged: (ids: string[]) => AsyncActionResult;
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
          onGoStaged={onGoStaged}
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
          onInstallStaged={onInstallStaged}
          installPathConfigured={installPathConfigured}
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
            <div className="app-surface-subtle rounded-3xl p-4">
              <p className="text-xs uppercase tracking-[0.16em] app-text-soft">用途总结</p>
              <p className="mt-3 text-sm leading-6 app-text">{selectedStagedDetail.analysisSummary}</p>
            </div>
          ) : null}

          <div className="grid gap-4">
            <DetailList title="需要的工具" items={selectedStagedDetail.installStrategy?.requiredTools || []} copyLabel="复制列表" />
            <DetailList title="安装前准备" items={selectedStagedDetail.installStrategy?.prerequisiteSteps || []} copyLabel="复制步骤" />
            {selectedStagedDetail.installStrategy?.command ? (
              <div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.16em] app-text-soft">识别到的命令</p>
                  <CopyButton label="复制命令" value={selectedStagedDetail.installStrategy.command} />
                </div>
                <pre className="app-surface-subtle mt-2 overflow-x-auto rounded-2xl px-4 py-3 text-sm app-text">
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
