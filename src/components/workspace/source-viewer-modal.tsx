import { X, FolderOpen } from "lucide-react";
import { cn } from "@/lib/cn";
import type { WorkspaceSkillSource } from "@shared/contracts";
import { ProviderIcon } from "../ui/icons";
import { IconActionButton } from "../ui/buttons";

type TranslationDictionary = Record<string, string>;

function providerStatus(source: WorkspaceSkillSource, t: TranslationDictionary) {
  return source.exists ? t.providerFound : t.providerMissing;
}

export function SourceViewerModal({
  open,
  title,
  subtitle,
  sources,
  onClose,
  onOpenPath,
  t
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  sources: WorkspaceSkillSource[];
  onClose: () => void;
  onOpenPath: (targetPath: string) => void;
  t: TranslationDictionary;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="app-panel flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-black/10 dark:border-white/10 px-6 py-5">
          <div>
            <h3 className="text-2xl font-semibold tracking-tight app-text">{title}</h3>
            {subtitle ? <p className="mt-2 text-sm leading-6 app-text-soft">{subtitle}</p> : null}
          </div>
          <button
            className="app-icon-button"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[calc(85vh-92px)] overflow-y-auto px-6 py-6">
          <div className="space-y-5">
            {sources.map((source) => (
              <div key={source.id} className="app-card overflow-hidden">
                <div className="p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                          <ProviderIcon providerKey={source.key} className="h-3 w-3" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium app-text">{source.label}</p>
                          <p className="mt-1 break-all text-sm app-text-soft">{source.path}</p>
                        </div>
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

                  {source.skills.length ? (
                    <div className="mt-5 space-y-3">
                    {source.skills.map((skill) => (
                      <div
                        key={skill.id}
                        className="rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 p-4"
                      >
                        <div className="flex flex-col gap-3">
                          <div className="min-w-0">
                            <p className="font-medium app-text">{skill.name}</p>
                            <p className="mt-1 text-sm app-text-soft">
                              {skill.description || t.noDescriptionAvailable}
                            </p>
                            <p className="mt-2 break-all text-xs app-text-soft opacity-75">{skill.relativePath}</p>
                          </div>
                          <div className="flex justify-end border-t border-black/10 dark:border-white/10 pt-3">
                              <IconActionButton
                                icon={FolderOpen}
                                label={t.openFolder}
                                onClick={() => onOpenPath(skill.rootPath)}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-5 rounded-2xl border border-dashed border-black/15 dark:border-white/15 bg-black/5 dark:bg-black/20 px-4 py-6 text-center text-sm app-text-soft">
                      {t.modalNoSkills}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
