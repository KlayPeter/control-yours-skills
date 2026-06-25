import type { SkillManagerSnapshot, WorkspaceSkillSource } from "@shared/contracts";
import { SectionCard } from "../ui/cards";

import { CapabilityGrid } from "./overview/CapabilityGrid";
import { OverviewStatsGrid } from "./overview/OverviewStatsGrid";
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
  onOpenPath,
  onOpenLogsFromOverview,
  onGoAiWorkspace,
  onGoLocalInstall,
  onGoProjects
}: {
  snapshot: SkillManagerSnapshot;
  installPathConfigured: boolean;
  t: TranslationDictionary;
  onChooseInstallDir: () => AsyncActionResult;
  onGoImport: () => AsyncActionResult;
  onGoStaged: () => AsyncActionResult;
  onOpenSystemSourceModal: (source: WorkspaceSkillSource) => void;
  onImportProject: () => AsyncActionResult;
  onOpenPath: (path: string) => AsyncActionResult;
  onOpenLogsFromOverview: (logId: string) => void;
  onGoAiWorkspace: () => void;
  onGoLocalInstall: () => void;
  onGoProjects: () => void;
}) {
  const systemSkillCount = snapshot.systemSkillSources.reduce((total, source) => total + source.skillCount, 0);
  const detectedSystemSources = snapshot.systemSkillSources.filter((source) => source.exists).length;
  const importedProjectCount = snapshot.importedProjects.length;
  const importedProjectSkillCount = snapshot.importedProjects.reduce((total, project) => total + countSkillsInTree(project.tree), 0);

  return (
    <div className="space-y-6">
      <OverviewStatsGrid
        snapshot={snapshot}
        t={t}
        onGoAiWorkspace={onGoAiWorkspace}
        onGoLocalInstall={onGoLocalInstall}
        onGoProjects={onGoProjects}
        onGoStaged={onGoStaged}
      />

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
