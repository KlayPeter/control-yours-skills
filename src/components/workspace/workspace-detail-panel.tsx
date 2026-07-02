import { FolderOpen, RefreshCcw, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import type { InstalledSkillDetail, LogRecord, StagedSourceDetail } from "@shared/contracts";
import { MarkdownViewer } from "@/components/markdown-viewer";
import { SectionCard, DetailList } from "../ui/cards";
import { SourceBadge, StrategyBadge, StatusIndicator } from "../ui/badges";
import { IconActionButton, CopyButton } from "../ui/buttons";
import { RelativeTimeText } from "../ui/typography";

import type { WorkspaceSection } from "../workspace-app";
type TranslationDictionary = Record<string, string>;
type AsyncActionResult<T = unknown> = void | Promise<T>;

function prettifyParsedText(value: string) {
  return value
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, (_, alt: string) => (alt ? `图片预览: ${alt}` : "图片预览"))
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/<\/?[^>]+>/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function DetailMeta({
  label,
  value,
  tone = "default"
}: {
  label: string;
  value: string;
  tone?: "default" | "danger";
}) {
  return (
    <div
      className={cn(
        "app-surface-subtle rounded-2xl px-4 py-3",
        tone === "danger" && "border-ember/20 bg-ember/5"
      )}
    >
      <p className="text-[11px] uppercase tracking-[0.16em] app-text-soft">{label}</p>
      <p className="mt-2 break-words text-sm leading-6 app-text">{value}</p>
    </div>
  );
}

function TextPreview({
  title,
  content,
  emptyMessage
}: {
  title: string;
  content: string | null;
  emptyMessage: string;
}) {
  if (!content) {
    return (
      <div className="app-surface-subtle overflow-hidden rounded-[28px]">
        <div className="border-b border-black/5 px-4 py-3 dark:border-white/10">
          <p className="text-xs uppercase tracking-[0.18em] app-text-soft">{title}</p>
        </div>
        <div className="p-4 text-sm app-text-soft">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className="app-surface-subtle overflow-hidden rounded-[28px]">
      <div className="border-b border-black/5 px-4 py-3 dark:border-white/10">
        <p className="text-xs uppercase tracking-[0.18em] app-text-soft">{title}</p>
      </div>
      <div className="px-4 py-4 sm:px-5">
        <pre className="whitespace-pre-wrap break-words text-sm leading-7 app-text">{content}</pre>
      </div>
    </div>
  );
}

export function logTone(log: LogRecord) {
  if (log.level === "error") {
    return "text-ember";
  }

  if (log.level === "warning") {
    return "text-amber-600 dark:text-amber-400";
  }

  return "text-moss";
}

export function logTypeLabel(log: LogRecord, t: TranslationDictionary) {
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

export function WorkspaceDetailPanel({
  section,
  selectedSkillDetail,
  selectedStagedDetail,
  selectedLog,
  t,
  onOpenPath,
  onRescanInstalledSkill,
  onParseStaged,
  onInstallStaged,
  embedded = false
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
  embedded?: boolean;
}) {
  if (section === "local-install" && selectedSkillDetail) {
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
    const stagedActions = (
      <div className="flex gap-2">
        <IconActionButton
          icon={RefreshCcw}
          label={t.reparse}
          isLoading={selectedStagedDetail.status === "processing"}
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
    );
    const detailItems = [
      { label: t.sourceValue, value: selectedStagedDetail.sourceValue },
      { label: t.archivePath, value: selectedStagedDetail.archivePath || t.archivePathPending },
      { label: t.skillRoot, value: selectedStagedDetail.skillRootPath || t.skillRootPending }
    ];

    if (selectedStagedDetail.selectedCategory) {
      detailItems.push({
        label: t.installCategoryLabel || "安装分类",
        value: selectedStagedDetail.selectedCategory
      });
    }

    if (selectedStagedDetail.suggestedCategory) {
      detailItems.push({
        label: t.recommendedCategory || "推荐分类",
        value:
          `${selectedStagedDetail.suggestedCategory}${selectedStagedDetail.classificationConfidence != null
            ? ` (${Math.round(selectedStagedDetail.classificationConfidence * 100)}%)`
            : ""}`
      });
    }

    if (selectedStagedDetail.analysisMethod) {
      detailItems.push({ label: "识别方式", value: detailLabel });
    }

    if (selectedStagedDetail.readmeUrl) {
      detailItems.push({ label: "README", value: selectedStagedDetail.readmeUrl });
    }

    if (selectedStagedDetail.errorMessage) {
      detailItems.push({ label: t.errorLabel, value: selectedStagedDetail.errorMessage });
    }

    const previewMarkdown = selectedStagedDetail.markdown;
    const previewExcerpt = !previewMarkdown
      ? prettifyParsedText(selectedStagedDetail.readmeExcerpt || "")
      : null;
    const stagedContent = (
      <div className="space-y-5">
        {embedded ? <div className="flex flex-wrap justify-end gap-2">{stagedActions}</div> : null}
        <div className="app-surface-subtle rounded-[28px] p-5 text-sm app-text">
          <div className="flex flex-wrap items-center gap-2">
            <SourceBadge source={selectedStagedDetail.sourceType} t={t} />
            <StrategyBadge strategy={selectedStagedDetail.installStrategy} />
            <StatusIndicator status={selectedStagedDetail.status} t={t} />
          </div>
          {isRemoteSource ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
              {t.remoteSourceAnalysisOnly}
            </div>
          ) : null}
          <p className="mt-4 text-base leading-7 app-text">
            {selectedStagedDetail.detectedDescription || selectedStagedDetail.sourceValue}
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {detailItems.map((item) => (
              <DetailMeta
                key={`${item.label}-${item.value}`}
                label={item.label}
                tone={item.label === t.errorLabel ? "danger" : "default"}
                value={item.value}
              />
            ))}
          </div>
        </div>

        {selectedStagedDetail.analysisSummary ? (
          <div className="app-surface-subtle rounded-[28px] p-5">
            <p className="text-xs uppercase tracking-[0.16em] app-text-soft">用途总结</p>
            <p className="mt-3 text-sm leading-7 app-text">{selectedStagedDetail.analysisSummary}</p>
          </div>
        ) : null}

        {selectedStagedDetail.classificationReason ? (
          <div className="app-surface-subtle rounded-[28px] p-5">
            <p className="text-xs uppercase tracking-[0.16em] app-text-soft">
              {t.recommendedCategory || "推荐分类"}
            </p>
            <p className="mt-3 text-sm leading-7 app-text">{selectedStagedDetail.classificationReason}</p>
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-2">
          <DetailList
            title="需要的工具"
            items={(selectedStagedDetail.installStrategy?.requiredTools || []).map(prettifyParsedText)}
            copyLabel="复制列表"
          />
          <DetailList
            title="安装前准备"
            items={(selectedStagedDetail.installStrategy?.prerequisiteSteps || []).map(prettifyParsedText)}
            copyLabel="复制步骤"
          />
          {selectedStagedDetail.installStrategy?.command ? (
            <div className="xl:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.16em] app-text-soft">识别到的命令</p>
                <CopyButton label="复制命令" value={selectedStagedDetail.installStrategy.command} />
              </div>
              <pre className="app-surface-subtle mt-2 overflow-x-auto whitespace-pre-wrap rounded-[24px] px-4 py-3 text-sm leading-7 app-text">
                {selectedStagedDetail.installStrategy.command}
              </pre>
            </div>
          ) : null}
          <div className="xl:col-span-2">
            <DetailList
              title="手动安装步骤"
              items={(selectedStagedDetail.installStrategy?.manualSteps || []).map(prettifyParsedText)}
              copyLabel="复制步骤"
            />
          </div>
        </div>

        {previewMarkdown ? (
          <MarkdownViewer
            markdown={previewMarkdown}
            emptyMessage={t.noSkillMdPreview}
            title="SKILL.md 预览"
          />
        ) : (
          <TextPreview
            content={previewExcerpt}
            emptyMessage={t.noSkillMdPreview}
            title="README 摘录"
          />
        )}
      </div>
    );

    if (embedded) {
      return <section className="space-y-5">{stagedContent}</section>;
    }

    return (
      <SectionCard
        title={selectedStagedDetail.detectedName || t.stagedSourceDetail}
        subtitle={t.stagedSourceDetailSubtitle}
        actions={stagedActions}
      >
        {stagedContent}
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
