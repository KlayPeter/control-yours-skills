import { cn } from "@/lib/cn";
import type { SkillManagerSnapshot } from "@shared/contracts";
import { SectionCard } from "../ui/cards";
import { RelativeTimeText } from "../ui/typography";
import { EmptyState } from "../ui/empty-state";
import { logTone } from "../workspace/workspace-detail-panel";

type TranslationDictionary = Record<string, string>;

export function LogsSection({
  snapshot,
  t,
  selectedLogId,
  onSelectLog
}: {
  snapshot: SkillManagerSnapshot;
  t: TranslationDictionary;
  selectedLogId: string | null;
  onSelectLog: (logId: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionCard title={t.operationLogs} subtitle={t.operationLogsSubtitle}>
        {snapshot.logs.length ? (
          <div className="space-y-3">
            {snapshot.logs.map((log) => (
              <button
                key={log.id}
                className={cn(
                  "w-full rounded-3xl border p-4 text-left transition",
                  selectedLogId === log.id
                    ? "border-ember/45 bg-ember/10"
                    : "border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:border-black/20 dark:hover:border-white/20 hover:bg-black/10 dark:hover:bg-white/10"
                )}
                onClick={() => onSelectLog(log.id)}
                type="button"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className={cn("font-medium", logTone(log))}>{log.message}</p>
                  <span className="text-xs uppercase tracking-[0.16em] opacity-50 app-text-soft">
                    {log.level === "error"
                      ? t.logLevelError
                      : log.level === "warning"
                        ? t.logLevelWarning
                        : t.logLevelInfo}
                  </span>
                </div>
                <p className="mt-2 text-sm opacity-80 app-text-soft">{log.detail || t.noExtraDetail}</p>
                <p className="mt-3 text-xs opacity-50 app-text-soft">
                  <RelativeTimeText value={log.createdAt} />
                </p>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState description={t.noLogsYetDescription} title={t.noLogsYet} />
        )}
      </SectionCard>
    </div>
  );
}
