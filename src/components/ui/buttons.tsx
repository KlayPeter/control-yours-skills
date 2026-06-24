import { useState } from "react";
import type { Search } from "lucide-react";
import { cn } from "@/lib/cn";
import type { WorkspaceSkillProviderKey } from "@shared/contracts";
import { ProviderIcon } from "./icons";

export function CopyButton({
  value,
  label = "复制"
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      className="app-button px-3 text-xs"
      onClick={() => {
        void navigator.clipboard.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      }}
      type="button"
    >
      {copied ? "已复制" : label}
    </button>
  );
}

export function IconActionButton({
  icon: Icon,
  label,
  onClick,
  tone = "default"
}: {
  icon: typeof Search;
  label: string;
  onClick: () => void;
  tone?: "default" | "danger" | "success";
}) {
  return (
    <button
      aria-label={label}
      className={cn(
        "app-icon-button rounded-2xl",
        tone === "danger" && "border-ember/25 bg-ember/10 text-ember hover:border-ember/40 hover:bg-ember/15",
        tone === "success" && "border-moss/25 bg-moss/10 text-moss hover:border-moss/40 hover:bg-moss/15"
      )}
      onClick={onClick}
      title={label}
      type="button"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export function ProviderInstallButtons({
  onInstall
}: {
  onInstall: (providerKey: WorkspaceSkillProviderKey) => void;
}) {
  const providers: WorkspaceSkillProviderKey[] = ["codex", "claude", "agents"];

  return (
    <div className="flex shrink-0 items-center gap-1">
      {providers.map((providerKey) => (
        <button
          key={providerKey}
          aria-label={`Install for ${providerKey}`}
          className="flex h-7 w-7 items-center justify-center rounded app-text-soft hover:bg-black/10 dark:hover:bg-white/10 hover:app-text transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onInstall(providerKey);
          }}
          title={`Install for ${providerKey}`}
          type="button"
        >
          <ProviderIcon providerKey={providerKey} className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
