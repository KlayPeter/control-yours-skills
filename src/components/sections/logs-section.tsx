import { useState } from "react";
import { cn } from "@/lib/cn";
import type { SkillManagerSnapshot, LogRecord } from "@shared/contracts";
import { X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
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
  const [visibleCount, setVisibleCount] = useState(20);
  const visibleLogs = snapshot.logs.slice(0, visibleCount);
  
  const [popupLog, setPopupLog] = useState<LogRecord | null>(null);

  const handleLogClick = (log: LogRecord) => {
    onSelectLog(log.id);
    setPopupLog(log);
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <p className="text-sm app-text-soft">{t.operationLogsSubtitle || "记录了系统中所有的增删改查动作，方便回溯和审计。"}</p>
      </div>

      {snapshot.logs.length ? (
        <div className="relative">
          <div className="space-y-0 pb-4">
            {visibleLogs.map((log) => {
              const isSelected = selectedLogId === log.id;
              
              let dotColor = "bg-blue-500 ring-blue-500/40";
              let badgeColor = "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400";
              
              if (log.level === "error") {
                dotColor = "bg-red-500 ring-red-500/40";
                badgeColor = "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400";
              }
              else if (log.level === "warning") {
                dotColor = "bg-amber-500 ring-amber-500/40";
                badgeColor = "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400";
              }
              else if (logTone(log).includes("emerald") || logTone(log).includes("moss")) {
                dotColor = "bg-emerald-500 ring-emerald-500/40";
                badgeColor = "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400";
              }

              return (
                <div 
                  key={log.id} 
                  className={cn(
                    "group flex items-center rounded-md px-3 py-2 cursor-pointer transition-colors border",
                    isSelected 
                      ? "bg-black/5 dark:bg-white/10 border-black/10 dark:border-white/10 shadow-sm" 
                      : "border-transparent hover:bg-black/5 dark:hover:bg-white/5"
                  )}
                  onClick={() => handleLogClick(log)}
                >
                  {/* Time */}
                  <div className="flex-none w-[110px] text-[11px] text-zinc-600 dark:text-zinc-400 font-mono shrink-0">
                    <RelativeTimeText value={log.createdAt} />
                  </div>
                  
                  {/* Dot */}
                  <div className="flex-none w-6 flex justify-center shrink-0 mr-1">
                    <div className={cn("h-2 w-2 rounded-full ring-[3px]", dotColor)} />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-mono uppercase leading-none font-bold", badgeColor)}>
                      {log.type}
                    </span>
                    <span className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 truncate">{log.message}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {visibleCount < snapshot.logs.length && (
            <div className="relative z-10 flex justify-center mt-4">
              <button
                type="button"
                className="app-button !rounded-full !px-6 !py-2 bg-white dark:bg-[#1A1A1A] border border-black/10 dark:border-white/10 shadow-sm hover:shadow"
                onClick={() => setVisibleCount((prev) => prev + 20)}
              >
                加载更多记录 ({snapshot.logs.length - visibleCount})
              </button>
            </div>
          )}
        </div>
      ) : (
        <EmptyState description={t.noLogsYetDescription} title={t.noLogsYet} />
      )}

      {/* Detail Dialog */}
      <Dialog.Root open={!!popupLog} onOpenChange={(open) => { if (!open) setPopupLog(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 dark:bg-black/80 z-50 backdrop-blur-sm transition-opacity" />
          <Dialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[90vw] max-w-2xl bg-white dark:bg-[#121212] rounded-3xl p-6 shadow-2xl z-50 border border-black/10 dark:border-white/10 max-h-[85vh] flex flex-col focus:outline-none">
            {popupLog && (
              <>
                <div className="flex justify-between items-start mb-6 gap-4">
                  <div>
                    <Dialog.Title className={cn("text-lg font-bold leading-snug", logTone(popupLog))}>
                      {popupLog.message}
                    </Dialog.Title>
                    <Dialog.Description className="mt-1.5 text-[11px] text-zinc-500 font-mono">
                      Log ID: {popupLog.id}
                    </Dialog.Description>
                  </div>
                  <Dialog.Close asChild>
                    <button className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                      <X className="w-4 h-4 text-zinc-500" />
                    </button>
                  </Dialog.Close>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-5 pb-2">
                  <div className="grid grid-cols-2 gap-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800/50">
                    <div>
                      <p className="text-[11px] text-zinc-500 mb-1 uppercase tracking-wider font-semibold">记录时间</p>
                      <p className="font-mono text-[13px] text-zinc-900 dark:text-zinc-100">
                        {new Date(popupLog.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-zinc-500 mb-1 uppercase tracking-wider font-semibold">日志级别</p>
                      <p className={cn(
                        "font-mono text-[13px] uppercase font-bold",
                        popupLog.level === "error" ? "text-red-600 dark:text-red-400" :
                        popupLog.level === "warning" ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                      )}>
                        {popupLog.level}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-zinc-500 mb-1 uppercase tracking-wider font-semibold">来源模块</p>
                      <p className="font-mono text-[13px] uppercase font-bold text-zinc-900 dark:text-zinc-100">
                        {popupLog.type}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-zinc-500 mb-1 uppercase tracking-wider font-semibold">关联实体 ID</p>
                      <p className="font-mono text-[13px] text-zinc-900 dark:text-zinc-100 truncate" title={popupLog.relatedId || "N/A"}>
                        {popupLog.relatedId || "无"}
                      </p>
                    </div>
                  </div>

                  {popupLog.detail && (
                    <div>
                      <p className="text-[11px] text-zinc-500 mb-2 uppercase tracking-wider font-semibold">执行详情 (Detail Payload)</p>
                      <pre className="text-[12px] leading-relaxed text-zinc-800 dark:text-zinc-300 font-mono bg-zinc-100 dark:bg-zinc-900 p-4 rounded-2xl overflow-x-auto border border-zinc-200 dark:border-zinc-800 whitespace-pre-wrap break-all">
                        {popupLog.detail}
                      </pre>
                    </div>
                  )}
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
