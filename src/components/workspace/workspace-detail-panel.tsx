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
              <StatusIndicator status={selectedStagedDetail.status} t={t} />
            </div>
            {isRemoteSource ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
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
