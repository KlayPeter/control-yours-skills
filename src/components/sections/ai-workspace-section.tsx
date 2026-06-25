import { Search } from "lucide-react";
import type { SkillManagerSnapshot, WorkspaceSkillSource, WorkspaceTreeNode } from "@shared/contracts";
import { SectionCard } from "../ui/cards";
import { WorkspaceTree } from "../workspace/workspace-tree";
import { countSkillsInTree } from "@/lib/tree-utils";

type TranslationDictionary = Record<string, string>;
type AsyncActionResult<T = unknown> = void | Promise<T>;

export function AiWorkspaceSection({
  snapshot,
  t,
  onOpenSystemSourceModal,
  onOpenPath,
  searchValue,
  onSearchValueChange
}: {
  snapshot: SkillManagerSnapshot;
  t: TranslationDictionary;
  onOpenSystemSourceModal: (source: WorkspaceSkillSource) => void;
  onOpenPath: (path: string) => AsyncActionResult;
  searchValue: string;
  onSearchValueChange: (value: string) => void;
}) {
  const sources = snapshot.systemSkillSources;

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
        {sources.map(source => {
          const filteredTree = filterTree(source.tree, searchValue);
          const skillCount = countSkillsInTree(filteredTree);
          
          if (skillCount === 0 && searchValue) return null; // Hide empty sources during search
          
          return (
            <SectionCard key={source.id} title={source.label}>
              <div className="mt-4">
                <WorkspaceTree
                  nodes={filteredTree}
                  projectRoot={source.path}
                  onOpenPath={onOpenPath}
                  onInstallWorkspaceSkill={() => {}} // Not really installing from AI Workspace to AI Workspace
                  emptyMessage={t.projectTreeEmpty || "暂无技能"}
                />
              </div>
            </SectionCard>
          );
        })}
      </div>
    </div>
  );
}
