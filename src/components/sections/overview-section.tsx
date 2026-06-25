import { Eye, FolderOpen, HardDriveDownload, Search, ShieldAlert, Trash2, UploadCloud } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SkillManagerSnapshot, WorkspaceSkillProviderKey, WorkspaceSkillSource, WorkspaceTreeNode } from "@shared/contracts";

import { SectionCard, CapabilityCard } from "../ui/cards";
import { OverviewMetric, RelativeTimeText } from "../ui/typography";
import { ProviderIcon } from "../ui/icons";
import { IconActionButton } from "../ui/buttons";
import { EmptyState } from "../ui/empty-state";
import { WorkspaceTree } from "../workspace/workspace-tree";

type TranslationDictionary = Record<string, string>;
type AsyncActionResult<T = unknown> = void | Promise<T>;

function providerStatus(source: WorkspaceSkillSource, t: TranslationDictionary) {
  return source.exists ? t.providerFound : t.providerMissing;
}

function countSkillsInTree(nodes: WorkspaceTreeNode[]): number {
  let count = 0;
  for (const node of nodes) {
    if (node.kind === "skill") {
      count++;
    }
    if (node.children && node.children.length > 0) {
      count += countSkillsInTree(node.children);
    }
  }
  return count;
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
  const importedProjectSkillCount = snapshot.importedProjects.reduce((total, project) => total + countSkillsInTree(project.tree), 0);
  const installDirSkillCount = snapshot.installDirTree ? countSkillsInTree(snapshot.installDirTree) : 0;

  return (
    <div className="space-y-6">
      <SectionCard title={t.capabilityOverviewTitle} subtitle={t.capabilityOverviewSubtitle}>
        <div className="grid gap-4 xl:grid-cols-2">
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
                      {t.skillCount}: {countSkillsInTree(project.tree)}
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

      <SectionCard
        title={t.localInstallDirectory || "本地安装目录 (Local Install Directory)"}
        subtitle={t.localInstallDirectorySubtitle || "查看和管理您本地统一归档的技能与分类"}
      >
        {installPathConfigured && snapshot.installDirTree ? (
          <div className="app-card overflow-hidden">
            <div className="flex items-start justify-between gap-4 p-5">
              <div className="min-w-0">
                <p className="font-medium app-text">{snapshot.settings.installDir}</p>
                <p className="mt-2 text-xs app-text-soft">
                  {t.skillCount}: {countSkillsInTree(snapshot.installDirTree)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <IconActionButton icon={FolderOpen} label={t.openFolder} onClick={() => void onOpenPath(snapshot.settings.installDir)} />
              </div>
            </div>
            <div className="border-t border-black/10 dark:border-white/10 px-5 py-4">
              <WorkspaceTree
                emptyMessage={t.projectTreeEmpty}
                nodes={snapshot.installDirTree}
                onInstallWorkspaceSkill={onInstallWorkspaceSkill}
                onOpenPath={onOpenPath}
                projectRoot={snapshot.settings.installDir}
              />
            </div>
          </div>
        ) : (
          <EmptyState title={t.capabilityInstallTitle} description={t.installPathRequiredBody} />
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
                  <p className="mt-2 line-clamp-3 text-sm app-text-soft" title={log.detail || undefined}>{log.detail || t.noExtraDetail}</p>
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
