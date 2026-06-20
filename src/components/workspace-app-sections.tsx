"use client";

import Link from "next/link";
import { formatDistanceToNowStrict, formatISO9075 } from "date-fns";
import type { DropzoneState } from "react-dropzone";
import { useEffect, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { Search, ShieldAlert, UploadCloud, X } from "lucide-react";

import type {
  ImportedProjectRecord,
  InstalledSkillDetail,
  InstalledSkillRecord,
  InstallStrategy,
  LogRecord,
  SaveSettingsInput,
  SkillManagerSnapshot,
  SourceStatus,
  StagedSourceDetail,
  StagedSourceRecord,
  WorkspaceSkillSource
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
    return "text-amber-200";
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
    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs uppercase tracking-[0.16em] text-ink-200/70">
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
      ? "Command"
      : strategy.type === "manual"
        ? "Manual"
        : "Archive";

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
  actions?: ReactNode;
  children: ReactNode;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-[28px] border border-white/10 bg-ink-950 shadow-panel">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div>
            <h3 className="text-xl font-semibold text-white">{title}</h3>
            {subtitle ? <p className="mt-1 text-sm text-ink-200/70">{subtitle}</p> : null}
          </div>
          <button
            className="rounded-full border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[calc(85vh-92px)] overflow-y-auto px-6 py-5">
          <div className="space-y-5">
            {sources.map((source) => (
              <div key={source.id} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm font-semibold text-white">
                        {providerMonogram(source.key)}
                      </span>
                      <div>
                        <p className="font-medium text-white">{source.label}</p>
                        <p className="text-sm text-ink-200/65">{source.path}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs uppercase tracking-[0.15em]",
                        source.exists
                          ? "border-moss/20 bg-moss/10 text-moss"
                          : "border-white/10 bg-white/5 text-ink-200/65"
                      )}
                    >
                      {providerStatus(source, t)}
                    </span>
                    <button
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
                      onClick={() => onOpenPath(source.path)}
                      type="button"
                    >
                      {t.openFolder}
                    </button>
                  </div>
                </div>

                {source.skills.length ? (
                  <div className="mt-4 space-y-3">
                    {source.skills.map((skill) => (
                      <div
                        key={skill.id}
                        className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-white">{skill.name}</p>
                            <p className="mt-1 text-sm text-ink-200/70">
                              {skill.description || t.noDescriptionAvailable}
                            </p>
                            <p className="mt-2 text-xs text-ink-200/55">{skill.relativePath}</p>
                          </div>
                          <button
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
                            onClick={() => onOpenPath(skill.rootPath)}
                            type="button"
                          >
                            {t.openFolder}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-dashed border-white/15 bg-black/20 px-4 py-6 text-center text-sm text-ink-200/70">
                    {t.modalNoSkills}
                  </div>
                )}
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
  onOpenSystemSourceModal,
  onOpenProjectModal,
  onImportProject,
  onRemoveProject,
  onOpenPath,
  onOpenSkillsFromOverview,
  onOpenLogsFromOverview
}: {
  snapshot: SkillManagerSnapshot;
  installPathConfigured: boolean;
  t: TranslationDictionary;
  onOpenSystemSourceModal: (source: WorkspaceSkillSource) => void;
  onOpenProjectModal: (project: ImportedProjectRecord) => void;
  onImportProject: () => AsyncActionResult;
  onRemoveProject: (projectPath: string) => AsyncActionResult;
  onOpenPath: (path: string) => AsyncActionResult;
  onOpenSkillsFromOverview: (skillId: string) => AsyncActionResult;
  onOpenLogsFromOverview: (logId: string) => void;
}) {
  return (
    <div className="space-y-6">
      {!installPathConfigured ? (
        <SectionCard title={t.installPathRequired} subtitle={t.installPathRequiredSubtitle}>
          <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-5 text-sm text-amber-100">
            {t.installPathRequiredBody}
          </div>
        </SectionCard>
      ) : null}

      <SectionCard title={t.overviewInstallDir}>
        <div className="rounded-3xl border border-white/10 bg-black/20 p-5 text-sm text-ink-100/85">
          {snapshot.settings.installDir || t.notConfiguredYet}
        </div>
      </SectionCard>

      <SectionCard title={t.workspaceSkillDirectories} subtitle={t.workspaceSkillDirectoriesSubtitle}>
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
          {snapshot.systemSkillSources.map((source) => (
            <div key={source.id} className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm font-semibold text-white">
                    {providerMonogram(source.key)}
                  </div>
                  <div>
                    <p className="font-medium text-white">{source.label}</p>
                    <p className="text-sm text-ink-200/65">
                      {t.skillCount}: {source.skillCount}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "rounded-full border px-2 py-1 text-xs uppercase tracking-[0.15em]",
                    source.exists
                      ? "border-moss/20 bg-moss/10 text-moss"
                      : "border-white/10 bg-white/5 text-ink-200/65"
                  )}
                >
                  {providerStatus(source, t)}
                </span>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-ink-200/70">{source.path}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
                  onClick={() => onOpenSystemSourceModal(source)}
                  type="button"
                >
                  {t.view}
                </button>
                <button
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
                  onClick={() => void onOpenPath(source.path)}
                  type="button"
                >
                  {t.openFolder}
                </button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title={t.projectDirectories}
        subtitle={t.projectDirectoriesSubtitle}
        actions={
          <button
            className="rounded-full bg-signal px-4 py-2 text-sm font-medium text-ink-950 transition hover:brightness-110"
            onClick={() => void onImportProject()}
            type="button"
          >
            {t.importProject}
          </button>
        }
      >
        {snapshot.importedProjects.length ? (
          <div className="space-y-3">
            {snapshot.importedProjects.map((project) => (
              <div key={project.id} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{project.name}</p>
                    <p className="mt-1 text-sm text-ink-200/70">{project.path}</p>
                    <p className="mt-2 text-xs text-ink-200/55">
                      {t.skillCount}: {project.skillCount}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
                      onClick={() => onOpenProjectModal(project)}
                      type="button"
                    >
                      {t.view}
                    </button>
                    <button
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
                      onClick={() => void onOpenPath(project.path)}
                      type="button"
                    >
                      {t.openFolder}
                    </button>
                    <button
                      className="rounded-full border border-ember/25 bg-ember/10 px-3 py-2 text-sm text-ember transition hover:bg-ember/15"
                      onClick={() => void onRemoveProject(project.path)}
                      type="button"
                    >
                      {t.delete}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title={t.projectDirectories} description={t.projectDirectoriesSubtitle} />
        )}
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title={t.recentInstalls} subtitle={t.recentInstallsSubtitle}>
          {snapshot.summary.recentInstalls.length ? (
            <div className="space-y-3">
              {snapshot.summary.recentInstalls.map((skill) => (
                <button
                  key={skill.id}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-left transition hover:border-signal/30 hover:bg-white/5"
                  onClick={() => void onOpenSkillsFromOverview(skill.id)}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{skill.name}</p>
                    <SourceBadge source={skill.sourceType} t={t} />
                  </div>
                  <p className="mt-2 text-sm text-ink-200/75">
                    {skill.description || t.noDescriptionExtractedForSkill}
                  </p>
                  <p className="mt-3 text-xs text-ink-200/55">
                    <RelativeTimeText value={skill.installedAt} />
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState description={t.noInstallRecordsYetDescription} title={t.noInstallRecordsYet} />
          )}
        </SectionCard>

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
                    <p className="font-medium text-white">{log.message}</p>
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm text-ink-200/75">{log.detail || t.noExtraDetail}</p>
                  <p className="mt-3 text-xs text-ink-200/55">
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
  dropzone,
  remoteUrl,
  onRemoteUrlChange,
  onImportZip,
  onRemoteAction,
  snapshot,
  selectedStagedId,
  onLoadStagedDetail,
  onParseStaged,
  onInstallStaged,
  onRemoveStaged
}: {
  t: TranslationDictionary;
  dropzone: DropzoneState;
  remoteUrl: string;
  onRemoteUrlChange: (value: string) => void;
  onImportZip: (mode: "staged" | "install") => AsyncActionResult;
  onRemoteAction: (mode: "staged" | "install") => AsyncActionResult;
  snapshot: SkillManagerSnapshot;
  selectedStagedId: string | null;
  onLoadStagedDetail: (id: string) => AsyncActionResult;
  onParseStaged: (ids: string[]) => AsyncActionResult;
  onInstallStaged: (ids: string[]) => AsyncActionResult;
  onRemoveStaged: (ids: string[]) => AsyncActionResult;
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
              : "border-white/15 bg-black/20 hover:border-white/30 hover:bg-white/5"
          )}
        >
          <input {...dropzone.getInputProps()} />
          <UploadCloud className="mx-auto h-10 w-10 text-signal" />
          <p className="mt-4 text-lg font-medium text-white">{t.localZipDropTitle}</p>
          <p className="mt-2 text-sm text-ink-200/70">{t.localZipDropHelp}</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              className="rounded-full bg-moss px-4 py-2 text-sm font-medium text-ink-950 transition hover:brightness-110"
              onClick={() => void onImportZip("install")}
              type="button"
            >
              {t.installNow}
            </button>
            <button
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
              onClick={() => void onImportZip("install")}
              type="button"
            >
              {t.chooseZip}
            </button>
          </div>
        </div>
      </SectionCard>

      <SectionCard title={t.addRemoteSource} subtitle={t.addRemoteSourceSubtitle}>
        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
          <label className="block text-sm font-medium text-white" htmlFor="remote-url">
            {t.remoteSourceLabel}
          </label>
          <div className="mt-3 flex flex-col gap-3 lg:flex-row">
            <input
              className="h-12 flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition placeholder:text-ink-200/40 focus:border-signal/45"
              id="remote-url"
              onChange={(event) => onRemoteUrlChange(event.target.value)}
              placeholder={t.remoteSourcePlaceholder}
              value={remoteUrl}
            />
            <button
              className="h-12 rounded-2xl border border-white/10 bg-white/5 px-5 text-sm text-white transition hover:bg-white/10"
              onClick={() => void onRemoteAction("staged")}
              type="button"
            >
              {t.analyzeNow || t.parseSelected}
            </button>
          </div>
        </div>
      </SectionCard>

      <SectionCard title={t.stagedSources} subtitle={t.stagedSourcesSubtitle}>
        {snapshot.stagedSources.length ? (
          <div className="space-y-3">
            {snapshot.stagedSources.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "rounded-3xl border p-4 transition",
                  selectedStagedId === item.id
                    ? "border-signal/45 bg-signal/10"
                    : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/5"
                )}
              >
                <button className="w-full text-left" onClick={() => void onLoadStagedDetail(item.id)} type="button">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-white">{item.detectedName || item.sourceValue}</p>
                        <SourceBadge source={item.sourceType} t={t} />
                      </div>
                      <p className="mt-2 text-sm text-ink-200/75">
                        {item.detectedDescription || item.analysisSummary || item.errorMessage || t.waitingForMetadataParsing}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs uppercase tracking-[0.16em]",
                        statusTone(item.status)
                      )}
                    >
                      {statusLabel(item.status, t)}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-ink-200/55">
                    <RelativeTimeText value={item.updatedAt} />
                  </p>
                </button>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
                    onClick={() => void onParseStaged([item.id])}
                    type="button"
                  >
                    {t.reparse}
                  </button>
                  <button
                    className="rounded-full bg-moss px-3 py-2 text-sm font-medium text-ink-950 transition hover:brightness-110"
                    onClick={() => void onInstallStaged([item.id])}
                    type="button"
                  >
                    {t.install}
                  </button>
                  <button
                    className="rounded-full border border-ember/25 bg-ember/10 px-3 py-2 text-sm text-ember transition hover:bg-ember/15"
                    onClick={() => void onRemoveStaged([item.id])}
                    type="button"
                  >
                    {t.delete}
                  </button>
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
  onInstallStaged,
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
  onInstallStaged: (ids: string[]) => AsyncActionResult;
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
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
              href="/import"
            >
              {t.toImport}
            </Link>
            <button
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
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
              className="rounded-full bg-moss px-3 py-2 text-sm font-medium text-ink-950 transition hover:brightness-110"
              onClick={() =>
                void onInstallStaged(
                  selectedStageIds.length
                    ? selectedStageIds
                    : snapshot.stagedSources
                        .filter((item) => item.status !== "installed")
                        .map((item) => item.id)
                )
              }
              type="button"
            >
              {t.installSelected}
            </button>
            <button
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
              onClick={() => void onRemoveStaged(selectedStageIds)}
              type="button"
            >
              {t.removeSelected}
            </button>
            <button
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
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
                    : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/5"
                )}
                onClick={() => void onLoadStagedDetail(item.id)}
                type="button"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <input
                      checked={selectedStageIds.includes(item.id)}
                      className="mt-1 h-4 w-4 rounded border-white/20 bg-black/30"
                      onChange={() => onToggleStageSelection(item.id)}
                      onClick={(event) => event.stopPropagation()}
                      type="checkbox"
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-white">{item.detectedName || item.sourceValue}</p>
                        <SourceBadge source={item.sourceType} t={t} />
                      </div>
                      <p className="mt-2 text-sm text-ink-200/75">
                        {item.detectedDescription || item.errorMessage || t.waitingForMetadataParsing}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs uppercase tracking-[0.16em]",
                      statusTone(item.status)
                    )}
                  >
                    {statusLabel(item.status, t)}
                  </span>
                </div>
                <p className="mt-3 text-xs text-ink-200/55">
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
  onOpenPath
}: {
  t: TranslationDictionary;
  installedSkills: InstalledSkillRecord[];
  selectedSkillId: string | null;
  searchValue: string;
  onSearchValueChange: (value: string) => void;
  onLoadSkillDetail: (id: string) => AsyncActionResult;
  onOpenPath: (path: string) => AsyncActionResult;
}) {
  return (
    <div className="space-y-6">
      <SectionCard title={t.installedSkills} subtitle={t.installedSkillsSubtitle}>
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4">
          <Search className="h-4 w-4 text-ink-200/65" />
          <input
            className="h-12 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-ink-200/40"
            onChange={(event) => onSearchValueChange(event.target.value)}
            placeholder={t.searchPlaceholder}
            value={searchValue}
          />
        </div>

        {installedSkills.length ? (
          <div className="space-y-3">
            {installedSkills.map((skill) => (
              <div
                key={skill.id}
                className={cn(
                  "rounded-3xl border p-4 transition",
                  selectedSkillId === skill.id
                    ? "border-moss/45 bg-moss/10"
                    : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/5"
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <button
                    className="min-w-0 flex-1 text-left"
                    onClick={() => void onLoadSkillDetail(skill.id)}
                    type="button"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-white">{skill.name}</p>
                      <SourceBadge source={skill.sourceType} t={t} />
                    </div>
                    <p className="mt-2 text-sm text-ink-200/75">
                      {skill.description || t.noDescriptionAvailable}
                    </p>
                    <p className="mt-3 text-xs text-ink-200/55">
                      <RelativeTimeText value={skill.installedAt} />
                    </p>
                  </button>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
                      onClick={() => void onOpenPath(skill.installPath)}
                      type="button"
                    >
                      {t.openFolder}
                    </button>
                    <button
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
                      onClick={() => void onLoadSkillDetail(skill.id)}
                      type="button"
                    >
                      {t.view}
                    </button>
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
                    : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/5"
                )}
                onClick={() => onSelectLog(log.id)}
                type="button"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className={cn("font-medium", logTone(log))}>{log.message}</p>
                  <span className="text-xs uppercase tracking-[0.16em] text-ink-200/55">
                    {log.level === "error"
                      ? t.logLevelError
                      : log.level === "warning"
                        ? t.logLevelWarning
                        : t.logLevelInfo}
                  </span>
                </div>
                <p className="mt-2 text-sm text-ink-200/75">{log.detail || t.noExtraDetail}</p>
                <p className="mt-3 text-xs text-ink-200/55">
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
  onOpenPath
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
}) {
  return (
    <div className="space-y-6">
      <SectionCard title={t.settingsTitle} subtitle={t.settingsSubtitle}>
        <div className="space-y-5 rounded-3xl border border-white/10 bg-black/20 p-5">
          <div>
            <label className="block text-sm font-medium text-white" htmlFor="install-dir">
              {t.defaultInstallDirectory}
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
                placeholder={t.installDirPlaceholder}
                value={settingsDraft.installDir}
              />
              <button
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
                onClick={() => void onPickInstallDir()}
                type="button"
              >
                {t.choose}
              </button>
              <button
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
                onClick={() => void onValidateInstallDir()}
                type="button"
              >
                {t.validate}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white" htmlFor="temp-dir">
              {t.tempDirectory}
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
                placeholder={`${t.tempDirPlaceholderPrefix} (${snapshot.runtime.dataRoot || "data"})`}
                value={settingsDraft.tempDir}
              />
              <button
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
                onClick={() => void onPickTempDir()}
                type="button"
              >
                {t.choose}
              </button>
              <button
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
                onClick={() => void onValidateTempDir()}
                type="button"
              >
                {t.validate}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white" htmlFor="conflict-policy">
              {t.conflictPolicy}
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
              <option value="rename">{t.conflictRename}</option>
              <option value="skip">{t.conflictSkip}</option>
              <option value="overwrite">{t.conflictOverwrite}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white" htmlFor="locale">
              {t.interfaceLanguage}
            </label>
            <select
              className="mt-3 h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none focus:border-signal/45"
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

          <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
            <p className="text-sm font-medium text-white">AI</p>
            <p className="mt-1 text-sm text-ink-200/70">
              Configure the AI provider used for remote repository recognition.
            </p>

            <div className="mt-4 grid gap-4">
              <label className="flex items-center gap-3 text-sm text-white">
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
                Enable AI recognition
              </label>

              <div>
                <label className="block text-sm font-medium text-white" htmlFor="ai-provider">
                  Provider
                </label>
                <input
                  className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition focus:border-signal/45"
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
                <label className="block text-sm font-medium text-white" htmlFor="ai-base-url">
                  Base URL
                </label>
                <input
                  className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition focus:border-signal/45"
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
                <label className="block text-sm font-medium text-white" htmlFor="ai-model">
                  Model
                </label>
                <input
                  className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition focus:border-signal/45"
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
                <label className="block text-sm font-medium text-white" htmlFor="ai-api-key">
                  API Key
                </label>
                <input
                  className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition focus:border-signal/45"
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
              className="rounded-full bg-signal px-5 py-2.5 text-sm font-medium text-ink-950 transition hover:brightness-110"
              onClick={() => void onSaveSettings()}
              type="button"
            >
              {t.saveSettings}
            </button>
            <button
              className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white transition hover:bg-white/10"
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
  onOpenProjectModal,
  onOpenSystemSourceModal,
  onOpenPath,
  onImportZip,
  onRemoteAction,
  onParseStaged,
  onInstallStaged,
  onRemoveStaged,
  onClearStaged,
  onLoadStagedDetail,
  onLoadSkillDetail,
  onSelectLog,
  onOpenSkillsFromOverview,
  onOpenLogsFromOverview,
  onSearchValueChange,
  onPickInstallDir,
  onValidateInstallDir,
  onPickTempDir,
  onValidateTempDir,
  onSaveSettings
}: {
  section: WorkspaceSection;
  snapshot: SkillManagerSnapshot | null;
  t: TranslationDictionary;
  installPathConfigured: boolean;
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
  onOpenProjectModal: (project: ImportedProjectRecord) => void;
  onOpenSystemSourceModal: (source: WorkspaceSkillSource) => void;
  onOpenPath: (path: string) => AsyncActionResult;
  onImportZip: (mode: "staged" | "install") => AsyncActionResult;
  onRemoteAction: (mode: "staged" | "install") => AsyncActionResult;
  onParseStaged: (ids: string[]) => AsyncActionResult;
  onInstallStaged: (ids: string[]) => AsyncActionResult;
  onRemoveStaged: (ids: string[]) => AsyncActionResult;
  onClearStaged: () => AsyncActionResult;
  onLoadStagedDetail: (id: string) => AsyncActionResult;
  onLoadSkillDetail: (id: string) => AsyncActionResult;
  onSelectLog: (logId: string) => void;
  onOpenSkillsFromOverview: (skillId: string) => AsyncActionResult;
  onOpenLogsFromOverview: (logId: string) => void;
  onSearchValueChange: (value: string) => void;
  onPickInstallDir: () => AsyncActionResult;
  onValidateInstallDir: () => AsyncActionResult;
  onPickTempDir: () => AsyncActionResult;
  onValidateTempDir: () => AsyncActionResult;
  onSaveSettings: () => AsyncActionResult;
}) {
  if (!snapshot) {
    return (
      <SectionCard title={t.loadingWorkspace} subtitle={t.loadingWorkspaceSubtitle}>
        <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-black/20 p-5 text-sm text-ink-200/70">
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
          onImportProject={onImportProject}
          onOpenLogsFromOverview={onOpenLogsFromOverview}
          onOpenPath={onOpenPath}
          onOpenProjectModal={onOpenProjectModal}
          onOpenSkillsFromOverview={onOpenSkillsFromOverview}
          onOpenSystemSourceModal={onOpenSystemSourceModal}
          onRemoveProject={onRemoveProject}
          snapshot={snapshot}
          t={t}
        />
      );
    case "import":
      return (
        <ImportSection
          dropzone={dropzone}
          onImportZip={onImportZip}
          onInstallStaged={onInstallStaged}
          onLoadStagedDetail={onLoadStagedDetail}
          onParseStaged={onParseStaged}
          onRemoveStaged={onRemoveStaged}
          onRemoteAction={onRemoteAction}
          onRemoteUrlChange={onRemoteUrlChange}
          remoteUrl={remoteUrl}
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
          installedSkills={installedSkills}
          onLoadSkillDetail={onLoadSkillDetail}
          onOpenPath={onOpenPath}
          onSearchValueChange={onSearchValueChange}
          searchValue={searchValue}
          selectedSkillId={selectedSkillId}
          t={t}
        />
      );
    case "logs":
      return <LogsSection onSelectLog={onSelectLog} selectedLogId={selectedLogId} snapshot={snapshot} t={t} />;
    case "settings":
      return (
        <SettingsSection
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
            <button
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
              onClick={() => void onOpenPath(selectedSkillDetail.installPath)}
              type="button"
            >
              {t.openFolder}
            </button>
            <button
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
              onClick={() => void onRescanInstalledSkill(selectedSkillDetail.id)}
              type="button"
            >
              {t.rescan}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-black/20 p-4 text-sm text-ink-100/80">
            <div className="flex flex-wrap items-center gap-2">
              <SourceBadge source={selectedSkillDetail.sourceType} t={t} />
              <span className="rounded-full border border-moss/25 bg-moss/10 px-2.5 py-1 text-xs uppercase tracking-[0.16em] text-moss">
                {t.installedStatus}
              </span>
            </div>
            <p className="mt-3">{selectedSkillDetail.description || t.noDescriptionExtractedForSkill}</p>
            <div className="mt-4 space-y-1 text-xs text-ink-200/60">
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
    return (
      <SectionCard
        title={selectedStagedDetail.detectedName || t.stagedSourceDetail}
        subtitle={t.stagedSourceDetailSubtitle}
        actions={
          <div className="flex gap-2">
            <button
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
              onClick={() => void onParseStaged([selectedStagedDetail.id])}
              type="button"
            >
              {t.reparse}
            </button>
            <button
              className="rounded-full bg-moss px-3 py-2 text-sm font-medium text-ink-950 transition hover:brightness-110"
              onClick={() => void onInstallStaged([selectedStagedDetail.id])}
              type="button"
            >
              {t.install}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4 text-sm text-ink-100/80">
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
            <p className="mt-3">
              {selectedStagedDetail.detectedDescription || selectedStagedDetail.sourceValue}
            </p>
            <div className="mt-4 space-y-1 text-xs text-ink-200/60">
              <p>{t.sourceValue}: {selectedStagedDetail.sourceValue}</p>
              <p>{t.archivePath}: {selectedStagedDetail.archivePath || t.archivePathPending}</p>
              <p>{t.skillRoot}: {selectedStagedDetail.skillRootPath || t.skillRootPending}</p>
              {selectedStagedDetail.analysisMethod ? <p>Analysis: {selectedStagedDetail.analysisMethod}</p> : null}
              {selectedStagedDetail.analysisSummary ? <p>Summary: {selectedStagedDetail.analysisSummary}</p> : null}
              {selectedStagedDetail.readmeUrl ? <p>README: {selectedStagedDetail.readmeUrl}</p> : null}
              {selectedStagedDetail.installStrategy?.command ? (
                <p>Command: {selectedStagedDetail.installStrategy.command}</p>
              ) : null}
              {selectedStagedDetail.installStrategy?.manualSteps.length ? (
                <p>Manual steps: {selectedStagedDetail.installStrategy.manualSteps.join(" | ")}</p>
              ) : null}
              {selectedStagedDetail.errorMessage ? <p>{t.errorLabel}: {selectedStagedDetail.errorMessage}</p> : null}
            </div>
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
        <div className="space-y-4 rounded-3xl border border-white/10 bg-black/20 p-4 text-sm text-ink-100/80">
          <p className={cn("font-medium", logTone(selectedLog))}>
            {selectedLog.level === "error"
              ? t.logLevelError
              : selectedLog.level === "warning"
                ? t.logLevelWarning
                : t.logLevelInfo}
          </p>
          <p>{selectedLog.detail || t.noExtraDetail}</p>
          <div className="space-y-1 text-xs text-ink-200/60">
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
