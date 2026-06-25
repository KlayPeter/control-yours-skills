import { useState } from "react";
import { ChevronDown, ChevronRight, FolderOpen, Folder, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import type { WorkspaceSkillProviderKey, WorkspaceTreeNode } from "@shared/contracts";
import { IconActionButton, ProviderInstallButtons } from "../ui/buttons";

type AsyncActionResult<T = unknown> = void | Promise<T>;

export function WorkspaceTree({
  nodes,
  projectRoot,
  onOpenPath,
  onInstallWorkspaceSkill,
  emptyMessage
}: {
  nodes: WorkspaceTreeNode[];
  projectRoot: string;
  onOpenPath: (path: string) => AsyncActionResult;
  onInstallWorkspaceSkill: (
    sourceRoot: string,
    skillRootPath: string,
    providerKey: WorkspaceSkillProviderKey
  ) => AsyncActionResult;
  emptyMessage: string;
}) {
  if (nodes.length === 0) {
    return <div className="rounded-2xl border border-dashed border-black/15 dark:border-white/15 bg-black/5 dark:bg-black/10 px-4 py-6 text-sm app-text-soft">{emptyMessage}</div>;
  }

  return (
    <div className="space-y-1">
      {nodes.map((node) => (
        <WorkspaceTreeNodeRow
          key={node.id}
          node={node}
          onInstallWorkspaceSkill={onInstallWorkspaceSkill}
          onOpenPath={onOpenPath}
          projectRoot={projectRoot}
        />
      ))}
    </div>
  );
}

export function WorkspaceTreeNodeRow({
  node,
  projectRoot,
  onOpenPath,
  onInstallWorkspaceSkill
}: {
  node: WorkspaceTreeNode;
  projectRoot: string;
  onOpenPath: (path: string) => AsyncActionResult;
  onInstallWorkspaceSkill: (
    sourceRoot: string,
    skillRootPath: string,
    providerKey: WorkspaceSkillProviderKey
  ) => AsyncActionResult;
}) {
  const [open, setOpen] = useState(true);
  const isFolder = node.kind === "folder";

  return (
    <div>
      <div className="group relative flex items-center gap-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg px-2 -mx-2 transition-colors overflow-hidden">
        <button
          className={cn(
            "flex min-w-0 flex-1 items-center gap-3 text-left before:absolute before:inset-0",
            !isFolder && "cursor-default"
          )}
          onClick={() => {
            if (isFolder) {
              setOpen((current) => !current);
            }
          }}
          type="button"
        >
          {isFolder ? (
            <div className="flex items-center gap-2">
              {open ? <ChevronDown className="h-4 w-4 shrink-0 app-text-soft" /> : <ChevronRight className="h-4 w-4 shrink-0 app-text-soft" />}
              <Folder className="h-4 w-4 shrink-0 text-blue-500/80 dark:text-blue-400/80" />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-4 shrink-0" />
              <Sparkles className="h-4 w-4 shrink-0 text-amber-500/80 dark:text-amber-400/80" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className={cn("truncate text-[13px] app-text", isFolder ? "font-semibold" : "font-medium")} title={node.name}>{node.name}</p>
            {node.description ? <p className="mt-1 line-clamp-2 text-[11px] app-text-soft" title={node.description}>{node.description}</p> : null}
          </div>
        </button>
        <div className="absolute right-0 top-0 bottom-0 flex items-center gap-2 px-1 bg-slate-100 dark:bg-slate-800 opacity-0 transition-opacity duration-150 group-hover:opacity-100 z-10">
          <IconActionButton icon={FolderOpen} label="打开目录" onClick={() => void onOpenPath(node.absolutePath)} />
          {node.kind === "skill" && node.skill ? (
            <ProviderInstallButtons
              onInstall={(providerKey) => {
                void onInstallWorkspaceSkill(projectRoot, node.skill!.rootPath, providerKey);
              }}
            />
          ) : null}
        </div>
      </div>
      {isFolder && open && node.children.length ? (
        <div className="ml-[8px] border-l border-black/10 dark:border-white/10 pl-[4px]">
          <div className="space-y-1">
            {node.children.map((child) => (
              <WorkspaceTreeNodeRow
                key={child.id}
                node={child}
                onInstallWorkspaceSkill={onInstallWorkspaceSkill}
                onOpenPath={onOpenPath}
                projectRoot={projectRoot}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
