import { Search } from "lucide-react";
import type { SkillManagerSnapshot, WorkspaceSkillProviderKey, WorkspaceTreeNode, CopyWorkspaceSkillInput } from "@shared/contracts";
import { SectionCard } from "../ui/cards";
import { WorkspaceTree } from "../workspace/workspace-tree";
import { countSkillsInTree } from "@/lib/tree-utils";
import { IconActionButton } from "../ui/buttons";
import { Trash2 } from "lucide-react";

type TranslationDictionary = Record<string, string>;
type AsyncActionResult<T = unknown> = void | Promise<T>;

export function ProjectsSection({
  snapshot,
  t,
  onOpenPath,
  onRemoveProject,
  onInstallWorkspaceSkill,
  onCopyWorkspaceSkill,
  onCreateWorkspaceFolder,
  searchValue,
  onSearchValueChange
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
  onCopyWorkspaceSkill: (input: CopyWorkspaceSkillInput) => AsyncActionResult;
  onCreateWorkspaceFolder: (input: { parentPath: string; folderName: string }) => AsyncActionResult;
  searchValue: string;
  onSearchValueChange: (value: string) => void;
}) {
  const projects = snapshot.importedProjects;

  // Simple search filter function that filters the tree nodes by name
  const filterTree = (nodes: WorkspaceTreeNode[], search: string): WorkspaceTreeNode[] => {
    if (!search) return nodes;
    const lowerSearch = search.toLowerCase();
    
    return nodes.map(node => {
      if (node.kind === 'skill' && node.name.toLowerCase().includes(lowerSearch)) {
        return node;
      }
      if (node.kind === 'folder') {
        const filteredChildren = filterTree(node.children, search);
        if (filteredChildren.length > 0 || node.name.toLowerCase().includes(lowerSearch)) {
          return { ...node, children: filteredChildren };
        }
      }
      return null;
    }).filter((n): n is WorkspaceTreeNode => n !== null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 app-text-soft" />
          <input
            type="text"
            placeholder={t.search || "搜索..."}
            value={searchValue}
            onChange={(e) => onSearchValueChange(e.target.value)}
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black/40 pl-10 pr-4 py-2 text-sm app-text focus-visible:ring-2 focus-visible:ring-signal/45 focus-visible:outline-none transition-all"
            spellCheck={false}
          />
        </div>
      </div>

      <div className="space-y-6">
        {projects.length === 0 && (
          <div className="rounded-2xl border border-dashed border-black/15 dark:border-white/15 bg-black/5 dark:bg-black/10 px-4 py-12 text-center text-sm app-text-soft">
            {t.noProjectsImported || "暂无导入的项目。请从概览页面导入。"}
          </div>
        )}
        
        {projects.map(project => {
          const filteredTree = filterTree(project.tree, searchValue);
          const skillCount = countSkillsInTree(filteredTree);
          
          if (skillCount === 0 && searchValue) return null; // Hide empty projects during search
          
          return (
            <SectionCard 
              key={project.id} 
              title={project.name}
              subtitle={project.path}
              actions={
                <IconActionButton
                  icon={Trash2}
                  label={t.delete || "移除"}
                  onClick={() => {
                    if (window.confirm(t.confirmDelete || "确定要移除吗？此操作不可撤销。")) {
                      onRemoveProject(project.path);
                    }
                  }}
                  tone="danger"
                />
              }
            >
              <div className="mt-4">
                <WorkspaceTree
                  nodes={filteredTree}
                  projectRoot={project.path}
                  onOpenPath={onOpenPath}
                  onInstallWorkspaceSkill={onInstallWorkspaceSkill}
                  onCopyWorkspaceSkill={onCopyWorkspaceSkill}
                  onCreateWorkspaceFolder={onCreateWorkspaceFolder}
                  importedProjects={snapshot.importedProjects}
                  localInstallDir={snapshot.settings.installDir}
                  installDirTree={snapshot.installDirTree}
                  emptyMessage={t.projectTreeEmpty || "这个项目里还没有识别到可安装的 Skill 文件夹。"}
                />
              </div>
            </SectionCard>
          );
        })}
      </div>
    </div>
  );
}
