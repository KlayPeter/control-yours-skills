import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import type { InstalledSkillRecord, InstallStrategy, SourceStatus, StagedSourceRecord } from "@shared/contracts";

type TranslationDictionary = Record<string, string>;

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

export function StatusIndicator({
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

export function SourceBadge({
  source,
  t
}: {
  source: StagedSourceRecord["sourceType"] | InstalledSkillRecord["sourceType"];
  t: TranslationDictionary;
}) {
  const label =
    source === "localZip"
      ? t.sourceBadgeLocalZip
      : source === "localFolder"
        ? t.sourceBadgeLocalFolder
      : source === "githubRepo"
        ? t.sourceBadgeGithubRepo
        : source === "localDir"
          ? t.sourceBadgeLocalDirectory
          : t.sourceBadgeRemoteZip;

  return (
    <span className="app-surface-subtle rounded-full px-2.5 py-1 text-xs uppercase tracking-[0.16em] app-text-soft">
      {label}
    </span>
  );
}

export function StrategyBadge({ strategy }: { strategy: InstallStrategy | null }) {
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
