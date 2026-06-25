import { Eye, FolderOpen } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SkillManagerSnapshot, WorkspaceSkillSource } from "@shared/contracts";
import { ProviderIcon } from "../../ui/icons";
import { IconActionButton } from "../../ui/buttons";

type TranslationDictionary = Record<string, string>;
type AsyncActionResult<T = unknown> = void | Promise<T>;

function providerStatus(source: WorkspaceSkillSource, t: TranslationDictionary) {
  return source.exists ? t.providerFound : t.providerMissing;
}

export function SystemSkillDirectories({
  snapshot,
  t,
  onOpenSystemSourceModal,
  onOpenPath
}: {
  snapshot: SkillManagerSnapshot;
  t: TranslationDictionary;
  onOpenSystemSourceModal: (source: WorkspaceSkillSource) => void;
  onOpenPath: (path: string) => AsyncActionResult;
}) {
  return (
    <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
      {snapshot.systemSkillSources.map((source) => (
        <div key={source.id} className="app-card flex h-full flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-sm font-semibold app-text">
                <ProviderIcon providerKey={source.key} className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="font-medium app-text truncate" title={source.label}>{source.label}</p>
                <p className="text-sm app-text-soft">
                  {t.skillCount}: {source.skillCount}
                </p>
              </div>
            </div>
            <div
              title={providerStatus(source, t)}
              className={cn(
                "h-2.5 w-2.5 rounded-full shrink-0",
                source.exists
                  ? "bg-moss shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                  : "bg-black/20 dark:bg-white/20"
              )}
            />
          </div>
          <p className="mt-4 flex-1 truncate text-sm leading-6 app-text-soft" title={source.path}>{source.path}</p>
          <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-black/10 dark:border-white/10 pt-4">
            <IconActionButton icon={Eye} label={t.view} onClick={() => onOpenSystemSourceModal(source)} />
            <IconActionButton
              icon={FolderOpen}
              label={t.openFolder}
              onClick={() => void onOpenPath(source.path)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
