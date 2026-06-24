import type { ReactNode } from "react";
import type { Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { CopyButton } from "./buttons";

type AsyncActionResult<T = unknown> = void | Promise<T>;

export function DetailList({
  title,
  items,
  copyLabel
}: {
  title: string;
  items: string[];
  copyLabel?: string;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.16em] app-text-soft">{title}</p>
        <CopyButton label={copyLabel || "复制"} value={items.join("\n")} />
      </div>
      <div className="mt-2 space-y-2">
        {items.map((item, index) => (
          <p key={`${title}-${index}`} className="app-surface-subtle rounded-2xl px-3 py-2 text-sm app-text">
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}

export function SectionCard({
  title,
  subtitle,
  actions,
  children
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="app-panel p-6 sm:p-7">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <h2 className="text-xl font-semibold tracking-tight app-text">{title}</h2>
          {subtitle ? <p className="mt-2 max-w-2xl text-sm leading-6 app-text-soft">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2 lg:justify-end">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function CapabilityCard({
  title,
  body,
  status,
  icon: Icon,
  primaryAction,
  secondaryAction
}: {
  title: string;
  body: string;
  status: string;
  icon: typeof Search;
  primaryAction?: {
    label: string;
    onClick: () => AsyncActionResult;
    disabled?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick: () => AsyncActionResult;
    disabled?: boolean;
  };
}) {
  return (
    <div className="app-card flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 app-text">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium app-text">{title}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.16em] app-text-soft">{status}</p>
          </div>
        </div>
      </div>
      <p className="mt-4 flex-1 text-sm leading-6 app-text-soft">{body}</p>
      {primaryAction || secondaryAction ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {primaryAction ? (
            <button
              className={cn(
                primaryAction.disabled
                  ? "cursor-not-allowed rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm app-text-soft"
                  : "app-button-primary"
              )}
              disabled={primaryAction.disabled}
              onClick={() => void primaryAction.onClick()}
              type="button"
            >
              {primaryAction.label}
            </button>
          ) : null}
          {secondaryAction ? (
            <button
              className={cn(
                "app-button",
                secondaryAction.disabled && "cursor-not-allowed opacity-60"
              )}
              disabled={secondaryAction.disabled}
              onClick={() => void secondaryAction.onClick()}
              type="button"
            >
              {secondaryAction.label}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
