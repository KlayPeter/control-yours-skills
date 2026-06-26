import Link from "next/link";
import { Eye, Plus, RefreshCcw, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SkillManagerSnapshot, StagedSourceRecord } from "@shared/contracts";

import { SectionCard } from "../ui/cards";
import { SourceBadge, StatusIndicator } from "../ui/badges";
import { IconActionButton } from "../ui/buttons";
import { OverviewMetric, RelativeTimeText } from "../ui/typography";
import { EmptyState } from "../ui/empty-state";
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

  return t.stagedNextPending;
}

type TranslationDictionary = Record<string, string>;
type AsyncActionResult<T = unknown> = void | Promise<T>;

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
  onUpdateStagedCategory,
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
  onUpdateStagedCategory: (input: { id: string; category: string | null }) => AsyncActionResult;
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
  const suggestedCategories = snapshot.stagedSources
    .map((item) => item.suggestedCategory)
    .filter((category): category is string => Boolean(category));
  const availableCategories = [...new Set([
    ...snapshot.settings.skillCategories,
    ...snapshot.installCategories.map((category) => category.name),
    ...suggestedCategories
  ])].sort((left, right) => left.localeCompare(right));

  return (
    <div className="space-y-6">
      <SectionCard
        title={t.stagedSources}
        subtitle={t.stagedSourcesSubtitle}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              className="app-button"
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={"/local-install" as any}
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
              onClick={() => {
                if (window.confirm(t.confirmDelete || "确定要删除吗？此操作不可撤销。")) {
                  void onRemoveStaged(selectedStageIds);
                }
              }}
              type="button"
            >
              {t.removeSelected}
            </button>
            <button
              className={cn("app-button", snapshot.stagedSources.length === 0 && "cursor-not-allowed opacity-60")}
              disabled={snapshot.stagedSources.length === 0}
              onClick={() => {
                if (window.confirm(t.confirmClearAll || "确定要清空全部暂存项吗？")) {
                  void onClearStaged();
                }
              }}
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
                      {item.suggestedCategory ? (
                        <div className="mt-3 rounded-2xl border border-moss/20 bg-moss/10 px-3 py-2 text-xs app-text-soft">
                          <p className="font-medium app-text">
                            {(t.recommendedCategory || "推荐分类")}: {item.suggestedCategory}
                            {item.classificationConfidence != null
                              ? ` (${Math.round(item.classificationConfidence * 100)}%)`
                              : ""}
                          </p>
                          {item.classificationReason ? <p className="mt-1">{item.classificationReason}</p> : null}
                        </div>
                      ) : null}
                      <p className="mt-3 text-xs uppercase tracking-[0.16em] text-signal">
                        {stagedNextStepLabel(item, t)}
                      </p>
                    </div>
                  </div>
                  <StatusIndicator status={item.status} t={t} />
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                  <div className="flex min-w-[220px] flex-1 flex-col gap-2">
                    <label className="text-xs uppercase tracking-[0.16em] app-text-soft">
                      {t.installCategoryLabel || "安装分类"}
                    </label>
                    <select
                      className="app-input h-10 rounded-2xl px-3 text-sm"
                      onChange={(event) =>
                        void onUpdateStagedCategory({
                          id: item.id,
                          category: event.target.value || null
                        })
                      }
                      value={item.selectedCategory ?? ""}
                    >
                      <option value="">
                        {item.suggestedCategory
                          ? `${t.followSuggestedCategory || "跟随推荐"} (${item.suggestedCategory})`
                          : t.unclassifiedOption || "暂不分类"}
                      </option>
                      {availableCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs app-text-soft">
                      <RelativeTimeText value={item.updatedAt} />
                    </p>
                  </div>
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
                      onClick={() => {
                        if (window.confirm(t.confirmDelete || "确定要删除吗？此操作不可撤销。")) {
                          void onRemoveStaged([item.id]);
                        }
                      }}
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
