import { ShieldAlert } from "lucide-react";
import type { SkillManagerSnapshot } from "@shared/contracts";
import { RelativeTimeText } from "../../ui/typography";
import { EmptyState } from "../../ui/empty-state";

type TranslationDictionary = Record<string, string>;

export function RecentFailures({
  snapshot,
  t,
  onOpenLogsFromOverview
}: {
  snapshot: SkillManagerSnapshot;
  t: TranslationDictionary;
  onOpenLogsFromOverview: (logId: string) => void;
}) {
  return (
    <>
      {snapshot.summary.recentFailures.length > 0 ? (
        <div className="space-y-3">
          {snapshot.summary.recentFailures.map((log) => (
            <button
              key={log.id}
              className="w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-left transition-colors hover:border-ember/30 hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-signal/45 focus-visible:outline-none"
              onClick={() => onOpenLogsFromOverview(log.id)}
              type="button"
            >
              <div className="flex items-center gap-3">
                <ShieldAlert className="h-4 w-4 text-ember" />
                <p className="font-medium app-text">{log.message}</p>
              </div>
              <p className="mt-2 line-clamp-3 text-sm app-text-soft" title={log.detail || undefined}>{log.detail || t.noExtraDetail}</p>
              <p className="mt-3 text-xs app-text-soft">
                <RelativeTimeText value={log.createdAt} />
              </p>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState description={t.noRecentFailuresDescription} title={t.noRecentFailures} />
      )}
    </>
  );
}
