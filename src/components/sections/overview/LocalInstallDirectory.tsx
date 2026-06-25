import { FolderOpen } from "lucide-react";
import type { SkillManagerSnapshot, WorkspaceSkillProviderKey } from "@shared/contracts";
import { IconActionButton } from "../../ui/buttons";
import { EmptyState } from "../../ui/empty-state";
import { WorkspaceTree } from "../../workspace/workspace-tree";
import { countSkillsInTree } from "@/lib/tree-utils";

type TranslationDictionary = Record<string, string>;
type AsyncActionResult<T = unknown> = void | Promise<T>;

export function LocalInstallDirectory({
  snapshot,
  t,
  installPathConfigured,
  onOpenPath,
  onInstallWorkspaceSkill
}: {
  snapshot: SkillManagerSnapshot;
  t: TranslationDictionary;
  installPathConfigured: boolean;
  onOpenPath: (path: string) => AsyncActionResult;
  onInstallWorkspaceSkill: (
    sourceRoot: string,
    skillRootPath: string,
    providerKey: WorkspaceSkillProviderKey
  ) => AsyncActionResult;
}) {
  return (
    <>
      {installPathConfigured && snapshot.installDirTree ? (
        <div className="app-card overflow-hidden">
          <div className="flex items-start justify-between gap-4 p-5">
            <div className="min-w-0">
              <p className="font-medium app-text truncate" title={snapshot.settings.installDir}>{snapshot.settings.installDir}</p>
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
    </>
  );
}
