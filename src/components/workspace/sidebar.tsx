import { useState } from "react";
import { ChevronDown, ChevronRight, Folder, FolderOpen, Sparkles } from "lucide-react";
import type { WorkspaceSkillProviderKey, WorkspaceTreeNode } from "@shared/contracts";
import { cn } from "@/lib/cn";
import { ProviderInstallButtons } from "../ui/buttons";

const expandedStateStore = new Map<string, boolean>();

export function SidebarWorkspaceTree({
  rootLabel,
  rootPath,
  nodes,
  onOpenPath,
  onInstallWorkspaceSkill,
  defaultOpen = true
}: {
  rootLabel: string;
  rootPath: string;
  nodes: WorkspaceTreeNode[];
  onOpenPath: (path: string) => void;
  onInstallWorkspaceSkill: (
    sourceRoot: string,
    skillRootPath: string,
    providerKey: WorkspaceSkillProviderKey
  ) => Promise<unknown>;
  defaultOpen?: boolean;
}) {
  const nodeId = `root-${rootPath}`;
  const [open, setOpen] = useState(() => {
    if (expandedStateStore.has(nodeId)) {
      return expandedStateStore.get(nodeId)!;
    }
    expandedStateStore.set(nodeId, defaultOpen);
    return defaultOpen;
  });

  const toggleOpen = () => {
    setOpen((current) => {
      const next = !current;
      expandedStateStore.set(nodeId, next);
      return next;
    });
  };

  return (
    <div className="rounded-[14px] border border-white/10 bg-black/10">
      <button
        className="flex w-full items-center gap-2.5 px-2.5 py-2 text-left"
        onClick={toggleOpen}
        type="button"
      >
        {open ? <ChevronDown className="h-4 w-4 shrink-0 app-text-soft" /> : <ChevronRight className="h-4 w-4 shrink-0 app-text-soft" />}
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] text-app-text-soft bg-black/5 dark:bg-white/5 shadow-[inset_0_0_0_1px_var(--app-border)]">
          <FolderOpen className="h-3.5 w-3.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium app-text" title={rootLabel}>{rootLabel}</span>
          <span className="mt-0.5 block truncate text-[11px] app-text-soft opacity-75" title={rootPath}>{rootPath}</span>
        </span>
      </button>
      {open ? (
        <div className="border-t border-white/10 px-2 py-2">
          <div className="space-y-1">
            {nodes.map((node) => (
              <SidebarWorkspaceTreeNode key={node.id} node={node} projectRoot={rootPath} onOpenPath={onOpenPath} onInstallWorkspaceSkill={onInstallWorkspaceSkill} defaultOpen={defaultOpen} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function SidebarWorkspaceTreeNode({
  node,
  projectRoot,
  onOpenPath,
  onInstallWorkspaceSkill,
  defaultOpen = false
}: {
  node: WorkspaceTreeNode;
  projectRoot: string;
  onOpenPath: (path: string) => void;
  onInstallWorkspaceSkill: (
    sourceRoot: string,
    skillRootPath: string,
    providerKey: WorkspaceSkillProviderKey
  ) => Promise<unknown>;
  defaultOpen?: boolean;
}) {
  const nodeId = `node-${projectRoot}-${node.absolutePath}`;
  const [open, setOpen] = useState(() => {
    if (expandedStateStore.has(nodeId)) {
      return expandedStateStore.get(nodeId)!;
    }
    expandedStateStore.set(nodeId, defaultOpen);
    return defaultOpen;
  });
  const isFolder = node.kind === "folder";

  const toggleOpen = () => {
    setOpen((current) => {
      const next = !current;
      expandedStateStore.set(nodeId, next);
      return next;
    });
  };

  return (
    <div>
      <div className={cn(
        "group relative flex items-center gap-2 rounded-xl transition-all overflow-hidden",
        isFolder 
          ? "px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
          : "px-2 py-2 my-0.5 border border-transparent hover:border-black/5 dark:hover:border-white/5 hover:bg-white dark:hover:bg-white/5 hover:shadow-sm"
      )}>
        <button
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 text-left before:absolute before:inset-0 transition-all duration-150",
            isFolder ? "" : "group-hover:pr-[96px]"
          )}
          onClick={() => {
            if (isFolder) {
              toggleOpen();
            } else {
              onOpenPath(node.absolutePath);
            }
          }}
          type="button"
        >
          {isFolder ? (
            <div className="flex items-center gap-1.5">
              {open ? <ChevronDown className="h-3.5 w-3.5 shrink-0 app-text-soft" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 app-text-soft" />}
              <Folder className="h-3.5 w-3.5 shrink-0 text-blue-500/80 dark:text-blue-400/80" />
            </div>
          ) : (
            <div className="flex items-center justify-center h-6 w-6 rounded-md bg-gradient-to-br from-amber-500/20 to-orange-500/10 dark:from-amber-400/25 dark:to-orange-500/15 shrink-0 border border-amber-500/30 dark:border-amber-400/30 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-300" />
            </div>
          )}
          <span className={cn("truncate app-text", isFolder ? "text-[13px]" : "text-[12px] font-medium")} title={node.name}>{node.name}</span>
        </button>

        {node.kind === "skill" && node.skill ? (
          <div className="absolute right-0 top-0 bottom-0 flex items-center gap-1 pr-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100 z-10">
            <ProviderInstallButtons
              onInstall={(providerKey) => {
                void onInstallWorkspaceSkill(projectRoot, node.skill!.rootPath, providerKey);
              }}
            />
          </div>
        ) : null}
      </div>
      {isFolder && open && node.children.length ? (
        <div className="ml-[8px] border-l border-white/10 pl-[4px]">
          {node.children.map((child) => (
            <SidebarWorkspaceTreeNode key={child.id} node={child} projectRoot={projectRoot} onOpenPath={onOpenPath} onInstallWorkspaceSkill={onInstallWorkspaceSkill} defaultOpen={defaultOpen} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
