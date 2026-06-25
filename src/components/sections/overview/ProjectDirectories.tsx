import { FolderOpen, Trash2 } from "lucide-react";
import type { SkillManagerSnapshot, WorkspaceSkillProviderKey } from "@shared/contracts";
import { IconActionButton } from "../../ui/buttons";
import { EmptyState } from "../../ui/empty-state";
import { WorkspaceTree } from "../../workspace/workspace-tree";
import { countSkillsInTree } from "@/lib/tree-utils";

type TranslationDictionary = Record<string, string>;
type AsyncActionResult<T = unknown> = void | Promise<T>;

export function ProjectDirectories({
  snapshot,
  t,
  onOpenPath,
  onRemoveProject,
  onInstallWorkspaceSkill
}: {
  snapshot: SkillManagerSnapshot;
  t: TranslationDictionary;
  onOpenPath: (path: string) => AsyncActionResult;
  onRemoveProject: (projectPath: string) => AsyncActionResult;
  onInstallWorkspaceSkill: (
    sourceRoot: string,
    skillRootPath: string,
    providerKey: WorkspaceSkillProviderKey
  ) => AsyncActionResult;
}) {
  return (
    <>
      {snapshot.importedProjects.length > 0 ? (
        <div className="space-y-3">
          {snapshot.importedProjects.map((project) => (
            <div key={project.id} className="app-card overflow-hidden">
              <div className="flex items-start justify-between gap-4 p-5">
                <div className="min-w-0">
                  <p className="font-medium app-text truncate" title={project.name}>{project.name}</p>
                  <p className="mt-2 truncate text-sm leading-6 app-text-soft" title={project.path}>{project.path}</p>
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
    </>
  );
}
