import type { SkillManagerSnapshot, WorkspaceSkillProviderKey, WorkspaceSkillSource } from "@shared/contracts";
import { SectionCard } from "../ui/cards";

import { CapabilityGrid } from "./overview/CapabilityGrid";
import { SystemSkillDirectories } from "./overview/SystemSkillDirectories";
import { ProjectDirectories } from "./overview/ProjectDirectories";
import { LocalInstallDirectory } from "./overview/LocalInstallDirectory";
import { RecentFailures } from "./overview/RecentFailures";
import { countSkillsInTree } from "@/lib/tree-utils";

type TranslationDictionary = Record<string, string>;
type AsyncActionResult<T = unknown> = void | Promise<T>;

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

  return (
    <div className="space-y-6">
      <SectionCard title={t.capabilityOverviewTitle} subtitle={t.capabilityOverviewSubtitle}>
        <CapabilityGrid
          snapshot={snapshot}
          t={t}
          installPathConfigured={installPathConfigured}
          onChooseInstallDir={onChooseInstallDir}
          onOpenPath={onOpenPath}
          onGoImport={onGoImport}
          onGoStaged={onGoStaged}
          onOpenSystemSourceModal={onOpenSystemSourceModal}
          onImportProject={onImportProject}
          systemSkillCount={systemSkillCount}
          detectedSystemSources={detectedSystemSources}
          importedProjectCount={importedProjectCount}
          importedProjectSkillCount={importedProjectSkillCount}
        />
      </SectionCard>

      <SectionCard title={t.workspaceSkillDirectories} subtitle={t.workspaceSkillDirectoriesSubtitle}>
        <SystemSkillDirectories
          snapshot={snapshot}
          t={t}
          onOpenSystemSourceModal={onOpenSystemSourceModal}
          onOpenPath={onOpenPath}
        />
      </SectionCard>

      <SectionCard title={t.projectDirectories} subtitle={t.projectSkillBrowserSubtitle}>
        <ProjectDirectories
          snapshot={snapshot}
          t={t}
          onOpenPath={onOpenPath}
          onRemoveProject={onRemoveProject}
          onInstallWorkspaceSkill={onInstallWorkspaceSkill}
        />
      </SectionCard>

      <SectionCard
        title={t.localInstallDirectory || "本地安装目录 (Local Install Directory)"}
        subtitle={t.localInstallDirectorySubtitle || "查看和管理您本地统一归档的技能与分类"}
      >
        <LocalInstallDirectory
          snapshot={snapshot}
          t={t}
          installPathConfigured={installPathConfigured}
          onOpenPath={onOpenPath}
          onInstallWorkspaceSkill={onInstallWorkspaceSkill}
        />
      </SectionCard>

      <div className="grid gap-6">
        <SectionCard title={t.recentFailures} subtitle={t.recentFailuresSubtitle}>
          <RecentFailures
            snapshot={snapshot}
            t={t}
            onOpenLogsFromOverview={onOpenLogsFromOverview}
          />
        </SectionCard>
      </div>
    </div>
  );
}
