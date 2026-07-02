import { FolderOpen, RefreshCcw, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import type { EnvironmentInfo, InstalledSkillDetail, LogRecord, StagedSourceDetail } from "@shared/contracts";
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

function osLabel(os: string) {
  if (os === "win32") {
    return "Windows";
  }

  if (os === "darwin") {
    return "macOS";
  }

  if (os === "linux") {
    return "Linux";
  }

  return os;
}

function shellLabel(environment: EnvironmentInfo | null | undefined) {
  if (!environment) {
    return "终端";
  }

  return environment.os === "win32" ? "PowerShell" : "Terminal";
}

function toolAvailable(environment: EnvironmentInfo | null | undefined, name: string) {
  return environment?.tools.some((tool) => tool.name === name && tool.available) ?? false;
}

function buildInstallGuideSteps(detail: StagedSourceDetail, environment: EnvironmentInfo | null | undefined) {
  const strategy = detail.installStrategy;
  const commandLines = (strategy?.command || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const manualSteps = (strategy?.manualSteps || [])
    .map(prettifyParsedText)
    .filter(Boolean)
    .filter((step) => !/^repository command found:/i.test(step));
  const steps: Array<{
    title: string;
    body: string;
    command?: string;
    tone?: "default" | "highlight";
  }> = [];

  if (detail.sourceType === "githubRepo") {
    steps.push({
      title: "先获取仓库",
      body: "先把这个 GitHub 仓库 clone 到本地，或者下载 ZIP 后解压；后续命令默认都在仓库目录里完成。"
    });
  } else if (detail.sourceType === "remoteZip") {
    steps.push({
      title: "先下载并解压",
      body: "先把远程 ZIP 下载到本地，再在解压出来的目录里继续后续安装。"
    });
  }

  if (commandLines.length > 0) {
    steps.push({
      title: "打开执行环境",
      body: strategy?.workingDirectory
        ? `打开本机的 ${shellLabel(environment)}，进入 ${strategy.workingDirectory} 后再执行下面的命令。`
        : `打开本机的 ${shellLabel(environment)}，进入仓库目录后再执行下面的命令。`
    });
  }

  commandLines.forEach((command, index) => {
    steps.push({
      title: `运行命令 ${index + 1}`,
      body: `在 ${shellLabel(environment)} 中执行这条命令。执行完成后再继续下一步。`,
      command,
      tone: "highlight"
    });
  });

  manualSteps.forEach((step, index) => {
    steps.push({
      title: commandLines.length > 0 ? `完成安装动作 ${index + 1}` : `安装步骤 ${index + 1}`,
      body: step
    });
  });

  if (steps.length === 0) {
    steps.push({
      title: "手动阅读安装说明",
      body: "当前没有识别出足够明确的安装步骤，请先查看 README 或 SKILL.md 的安装章节，再决定如何放入本地技能目录。"
    });
  }

  return steps;
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

function GuideStepCard({
  index,
  title,
  body,
  command,
  tone = "default"
}: {
  index: number;
  title: string;
  body: string;
  command?: string;
  tone?: "default" | "highlight";
}) {
  return (
    <div
      className={cn(
        "rounded-[24px] border px-4 py-4",
        tone === "highlight"
          ? "border-sky-300/60 bg-sky-50/80 dark:border-sky-400/20 dark:bg-sky-400/10"
          : "app-surface-subtle"
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">
          {index}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold app-text">{title}</p>
          <p className="mt-2 text-sm leading-7 app-text-soft">{body}</p>
          {command ? (
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-2xl bg-slate-950 px-4 py-3 text-sm leading-7 text-slate-50 dark:bg-black/50">
              {command}
            </pre>
          ) : null}
        </div>
      </div>
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
  embedded = false,
  environment = null
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
  environment?: EnvironmentInfo | null;
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
    const missingTools = (selectedStagedDetail.installStrategy?.requiredTools || []).filter(
      (tool) => !toolAvailable(environment, tool)
    );
    const installGuideSteps = buildInstallGuideSteps(selectedStagedDetail, environment);
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
            {environment ? (
              <span className="rounded-full border border-sky-300/50 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-200">
                当前环境: {osLabel(environment.os)} / {shellLabel(environment)}
              </span>
            ) : null}
          </div>
          {isRemoteSource ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
              {t.remoteSourceAnalysisOnly}
            </div>
          ) : null}
          <div className="mt-4">
            <p className="text-xs uppercase tracking-[0.16em] app-text-soft">技能说明</p>
            <p className="mt-3 text-base leading-7 app-text">
              {selectedStagedDetail.detectedDescription || selectedStagedDetail.sourceValue}
            </p>
          </div>
          {selectedStagedDetail.analysisSummary ? (
            <div className="mt-4 rounded-2xl border border-black/5 bg-white/55 px-4 py-4 dark:border-white/10 dark:bg-white/[0.03]">
              <p className="text-xs uppercase tracking-[0.16em] app-text-soft">解析结论</p>
              <p className="mt-2 text-sm leading-7 app-text">{selectedStagedDetail.analysisSummary}</p>
            </div>
          ) : null}
        </div>

        <div className="app-panel overflow-hidden p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-sky-600 dark:text-sky-200">保姆级安装步骤</p>
              <h3 className="mt-2 text-xl font-semibold tracking-tight app-text">按当前环境一步一步来</h3>
              <p className="mt-2 text-sm leading-6 app-text-soft">
                {environment
                  ? `下面的步骤已经按 ${osLabel(environment.os)} 和 ${shellLabel(environment)} 的使用场景整理。`
                  : "下面的步骤已经按当前识别结果整理。"}
              </p>
            </div>
            {selectedStagedDetail.installStrategy?.workingDirectory ? (
              <div className="rounded-2xl border border-black/5 bg-white/55 px-4 py-3 text-sm app-text dark:border-white/10 dark:bg-white/[0.03]">
                <p className="text-[11px] uppercase tracking-[0.16em] app-text-soft">执行位置</p>
                <p className="mt-2 break-words">{selectedStagedDetail.installStrategy.workingDirectory}</p>
              </div>
            ) : null}
          </div>

          {missingTools.length > 0 ? (
            <div className="mt-5 rounded-[24px] border border-amber-300/60 bg-amber-50/90 px-4 py-4 dark:border-amber-400/20 dark:bg-amber-500/10">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">开始前先补齐工具</p>
              <p className="mt-2 text-sm leading-7 text-amber-700 dark:text-amber-100/90">
                当前机器还没检测到这些命令: {missingTools.join(", ")}。先完成“安装前准备”里的工具安装，再继续后面的命令步骤。
              </p>
            </div>
          ) : selectedStagedDetail.installStrategy?.requiredTools?.length ? (
            <div className="mt-5 rounded-[24px] border border-emerald-300/60 bg-emerald-50/90 px-4 py-4 dark:border-emerald-400/20 dark:bg-emerald-500/10">
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">当前环境已具备主要命令</p>
              <p className="mt-2 text-sm leading-7 text-emerald-700 dark:text-emerald-100/90">
                已检测到: {(selectedStagedDetail.installStrategy?.requiredTools || []).join(", ")}。可以直接按下面的步骤继续。
              </p>
            </div>
          ) : null}

          <div className="mt-5 space-y-4">
            {installGuideSteps.map((step, index) => (
              <GuideStepCard
                key={`${step.title}-${index}`}
                body={step.body}
                command={step.command}
                index={index + 1}
                title={step.title}
                tone={step.tone}
              />
            ))}
          </div>
        </div>

        <div className="app-surface-subtle rounded-[28px] p-5 text-sm app-text">
          <p className="text-xs uppercase tracking-[0.16em] app-text-soft">解析明细</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
              title="原始手动步骤"
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
