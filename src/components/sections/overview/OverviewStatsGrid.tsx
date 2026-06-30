import type { SkillManagerSnapshot } from "@shared/contracts";
import { countSkillsInTree } from "@/lib/tree-utils";
import { Folder, HardDriveDownload, Sparkles, Inbox } from "lucide-react";
import { SectionCard } from "../../ui/cards";

interface OverviewStatsGridProps {
  snapshot: SkillManagerSnapshot | null;
  t: Record<string, string>;
  onGoAiWorkspace: () => void;
  onGoLocalInstall: () => void;
  onGoProjects: () => void;
  onGoStaged: () => void;
}

export function OverviewStatsGrid({
  snapshot,
  t,
  onGoAiWorkspace,
  onGoLocalInstall,
  onGoProjects,
  onGoStaged
}: OverviewStatsGridProps) {
  if (!snapshot) return null;

  // Calculate local installs
  const localInstallCount = countSkillsInTree(snapshot.installDirTree);

  // Calculate system skills (AI Workspace)
  const systemSkillCount = snapshot.systemSkillSources.reduce((sum, source) => {
    return sum + countSkillsInTree(source.tree);
  }, 0);

  // Calculate project skills
  const projectSkillCount = snapshot.importedProjects.reduce((sum, project) => {
    return sum + countSkillsInTree(project.tree);
  }, 0);

  // Calculate staged sources
  const stagedCount = snapshot.stagedSources.length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div
        className="cursor-pointer hover:border-signal/50 transition-colors rounded-[28px] overflow-hidden"
        onClick={onGoAiWorkspace}
      >
        <SectionCard title="">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-sm text-muted-foreground">{t.sectionAiWorkspace}</h3>
          </div>
          <div className="flex items-baseline gap-1.5">
            <div className="text-3xl font-semibold tracking-tight">
              {systemSkillCount}
            </div>
            <span className="text-sm font-normal text-muted-foreground">{t.skillsUnit || "个技能"}</span>
          </div>
        </SectionCard>
      </div>

      <div
        className="cursor-pointer hover:border-signal/50 transition-colors rounded-[28px] overflow-hidden"
        onClick={onGoLocalInstall}
      >
        <SectionCard title="">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
              <HardDriveDownload className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-sm text-muted-foreground">{t.sectionLocalInstall}</h3>
          </div>
          <div className="flex items-baseline gap-1.5">
            <div className="text-3xl font-semibold tracking-tight">
              {localInstallCount}
            </div>
            <span className="text-sm font-normal text-muted-foreground">{t.skillsUnit || "个技能"}</span>
          </div>
        </SectionCard>
      </div>

      <div
        className="cursor-pointer hover:border-signal/50 transition-colors rounded-[28px] overflow-hidden"
        onClick={onGoProjects}
      >
        <SectionCard title="">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
              <Folder className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-sm text-muted-foreground">{t.sectionProjects}</h3>
          </div>
          <div className="flex items-baseline gap-1.5">
            <div className="text-3xl font-semibold tracking-tight">
              {projectSkillCount}
            </div>
            <span className="text-sm font-normal text-muted-foreground">{t.skillsUnit || "个技能"}</span>
          </div>
        </SectionCard>
      </div>

      <div
        className="cursor-pointer hover:border-signal/50 transition-colors rounded-[28px] overflow-hidden"
        onClick={onGoStaged}
      >
        <SectionCard title="">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-rose-500/10 rounded-lg text-rose-500">
              <Inbox className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-sm text-muted-foreground">{t.sectionStaged}</h3>
          </div>
          <div className="flex items-baseline gap-1.5">
            <div className="text-3xl font-semibold tracking-tight">
              {stagedCount}
            </div>
            <span className="text-sm font-normal text-muted-foreground">{t.sourcesUnit || "个来源"}</span>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
