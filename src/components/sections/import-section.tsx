import type { DropzoneState } from "react-dropzone";
import { RefreshCcw, Trash2, UploadCloud } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SkillManagerSnapshot, StagedSourceRecord } from "@shared/contracts";

import { SectionCard } from "../ui/cards";
import { SourceBadge, StatusIndicator } from "../ui/badges";
import { IconActionButton } from "../ui/buttons";
import { OverviewMetric, RelativeTimeText } from "../ui/typography";
import { EmptyState } from "../ui/empty-state";

type TranslationDictionary = Record<string, string>;
type AsyncActionResult<T = unknown> = void | Promise<T>;

export function isRemoteStagedSource(source: Pick<StagedSourceRecord, "sourceType">) {
  return source.sourceType === "githubRepo" || source.sourceType === "remoteZip";
}

export function canInstallStagedSource(source: Pick<StagedSourceRecord, "sourceType" | "status">) {
  return source.status === "ready" && !isRemoteStagedSource(source);
}

export function stagedNextStepLabel(source: StagedSourceRecord, t: TranslationDictionary) {
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
