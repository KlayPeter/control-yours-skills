import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, HardDrive, FolderDown } from "lucide-react";
import type { WorkspaceSkillProviderKey } from "@shared/contracts";
import { ProviderIcon } from "../ui/icons";

export function SkillInstallMenu({
  onInstall,
  onCopyLocal,
  onCopyProject,
  onOpenChange,
}: {
  onInstall: (providerKey: WorkspaceSkillProviderKey) => void;
  onCopyLocal: () => void;
  onCopyProject: () => void;
  onOpenChange?: (isOpen: boolean) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  const providers: { key: WorkspaceSkillProviderKey; label: string }[] = [
    { key: "codex", label: "Codex (.codex)" },
    { key: "claude", label: "Claude (.claude)" },
    { key: "agents", label: "Agents (agents)" }
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        aria-label="更多操作"
        className="flex h-7 w-7 items-center justify-center rounded app-text-soft hover:bg-black/10 dark:hover:bg-white/10 hover:app-text transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        title="安装或复制技能"
        type="button"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 top-full mt-1 flex flex-col items-center gap-1 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-lg z-[100] p-1"
          onClick={(e) => e.stopPropagation()}
        >
          {providers.map((provider) => (
            <button
              key={provider.key}
              className="flex h-8 w-8 items-center justify-center rounded app-text hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              title={`安装到系统: ${provider.label}`}
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                onInstall(provider.key);
              }}
            >
              <ProviderIcon providerKey={provider.key} className="h-4 w-4 shrink-0" />
            </button>
          ))}
          <div className="h-px w-5 bg-black/10 dark:bg-white/10 my-1" />
          <button
            className="flex h-8 w-8 items-center justify-center rounded app-text hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title="复制分发: 复制到本地配置目录"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              onCopyLocal();
            }}
          >
            <HardDrive className="h-4 w-4 shrink-0" />
          </button>
          <button
            className="flex h-8 w-8 items-center justify-center rounded app-text hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title="复制分发: 复制到导入的项目"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              onCopyProject();
            }}
          >
            <FolderDown className="h-4 w-4 shrink-0" />
          </button>
        </div>
      )}
    </div>
  );
}
