import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import type { SkillManagerSnapshot, WorkspaceSkillSource, WorkspaceTreeNode } from "@shared/contracts";
import { SectionCard } from "../ui/cards";
import { WorkspaceTree } from "../workspace/workspace-tree";
import { countSkillsInTree } from "@/lib/tree-utils";
import { ProviderIcon } from "../ui/icons";
import { cn } from "@/lib/cn";

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
  const [activeSourceId, setActiveSourceId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeSourceId && sources.length > 0) {
      const codexSource = sources.find(s => s.label.toLowerCase().includes('.codex'));
      if (codexSource) {
        setActiveSourceId(codexSource.id);
      } else {
        setActiveSourceId(sources[0].id);
      }
    }
  }, [sources, activeSourceId]);

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

  const activeSource = sources.find(s => s.id === activeSourceId) || sources[0];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
        {sources.map((source) => {
          const isActive = activeSourceId === source.id;
          return (
            <button
              key={source.id}
              onClick={() => setActiveSourceId(source.id)}
              className={cn(
                "app-card flex h-full flex-col p-5 text-left transition-all",
                isActive 
                  ? "border-moss/45 bg-moss/10 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
                  : "hover:border-white/20 hover:bg-white/5"
              )}
            >
              <div className="flex items-start justify-between gap-3 w-full">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-sm font-semibold transition-colors",
                    isActive
                      ? "border-moss/30 bg-moss/20 text-moss-light"
                      : "border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 app-text"
                  )}>
                    <ProviderIcon providerKey={source.key} className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className={cn("font-medium truncate", isActive ? "text-moss-light" : "app-text")} title={source.label}>{source.label}</p>
                    <p className="text-sm app-text-soft">
                      {t.skillCount || "总技能数"}: {source.skillCount}
                    </p>
                  </div>
                </div>
                <div
                  title={source.exists ? (t.providerFound || "Found") : (t.providerMissing || "Missing")}
                  className={cn(
                    "h-2.5 w-2.5 rounded-full shrink-0",
                    source.exists
                      ? "bg-moss shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                      : "bg-black/20 dark:bg-white/20"
                  )}
                />
              </div>
            </button>
          );
        })}
      </div>

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
        {activeSource && (
          <SectionCard title={activeSource.label}>
            <div className="mt-4">
              <WorkspaceTree
                nodes={filterTree(activeSource.tree, searchValue)}
                projectRoot={activeSource.path}
                onOpenPath={onOpenPath}
                onInstallWorkspaceSkill={() => {}}
                emptyMessage={t.projectTreeEmpty || "暂无技能"}
              />
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );
}
