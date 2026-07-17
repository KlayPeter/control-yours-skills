"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, FileDiff, X } from "lucide-react";

import type { ExecuteSyncDecisionInput, SyncPreview } from "@shared/contracts";

type AsyncActionResult<T = unknown> = void | Promise<T>;

export function SyncPreviewDialog({
  preview,
  onClose,
  onExecute
}: {
  preview: SyncPreview;
  onClose: () => void;
  onExecute: (input: ExecuteSyncDecisionInput) => AsyncActionResult;
}) {
  const [submitting, setSubmitting] = useState(false);
  const isPush = preview.direction === "push";

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onExecute({
        skillId: preview.skillId,
        syncTargetId: preview.syncTargetId,
        action: isPush ? "overwrite-target" : "adopt-target",
        expectedSourceHash: preview.sourceHash,
        expectedTargetHash: preview.targetHash,
        expectedTargetPath: preview.targetPath
      });
      onClose();
    } catch {
      // The shared action layer presents the error and the dialog stays open for review.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="app-panel fixed left-1/2 top-1/2 z-[111] flex max-h-[88vh] w-[min(920px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden shadow-2xl">
          <div className="flex items-start justify-between gap-4 border-b border-black/10 p-5 dark:border-white/10">
            <div className="min-w-0">
              <Dialog.Title className="flex items-center gap-2 text-lg font-semibold app-text">
                <FileDiff className="h-5 w-5 text-signal" />
                {isPush ? "推送差异预览" : "采纳目标版本预览"}
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm app-text-soft">
                {preview.skillName} · {preview.targetLabel}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="app-icon-button" type="button" aria-label="关闭同步预览">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="overflow-y-auto p-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <DiffMetric label="新增" value={preview.summary.added} tone="text-emerald-600 dark:text-emerald-400" />
              <DiffMetric label="修改" value={preview.summary.modified} tone="text-amber-600 dark:text-amber-400" />
              <DiffMetric label="删除" value={preview.summary.deleted} tone="text-ember" />
              <DiffMetric label="未变化" value={preview.summary.unchanged} tone="app-text-soft" />
            </div>

            <div className="mt-5 rounded-2xl border border-black/10 bg-black/5 p-4 text-xs dark:border-white/10 dark:bg-white/5">
              <p className="app-text-soft">{isPush ? "中心仓库 → 目标目录" : "目标目录 → 中心仓库"}</p>
              <p className="mt-2 break-all font-mono app-text">{preview.sourcePath}</p>
              <p className="my-1 app-text-soft">↕</p>
              <p className="break-all font-mono app-text">{preview.targetPath}</p>
            </div>

            <div className="mt-5 space-y-3">
              {preview.entries.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-black/15 p-6 text-center text-sm app-text-soft dark:border-white/15">
                  双方内容一致，没有需要应用的文件变化。
                </div>
              ) : (
                preview.entries.map((entry) => (
                  <details key={entry.path} className="rounded-2xl border border-black/10 dark:border-white/10">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm">
                      <span className="min-w-0 truncate font-mono app-text" title={entry.path}>{entry.path}</span>
                      <span className="shrink-0 rounded-full border border-black/10 px-2 py-0.5 text-[11px] app-text-soft dark:border-white/10">
                        {entry.change === "added" ? "新增" : entry.change === "deleted" ? "删除" : "修改"}
                      </span>
                    </summary>
                    <div className="border-t border-black/10 p-3 dark:border-white/10">
                      {entry.kind === "binary" ? (
                        <p className="text-xs app-text-soft">二进制文件仅展示变更状态，不展示内容。</p>
                      ) : entry.patch ? (
                        <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-black/90 p-3 text-xs leading-5 text-slate-100">{entry.patch}</pre>
                      ) : (
                        <p className="text-xs app-text-soft">文件过大，已省略文本差异。</p>
                      )}
                      {entry.truncated ? <p className="mt-2 text-xs text-amber-600">差异内容已截断。</p> : null}
                    </div>
                  </details>
                ))
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-black/10 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
            <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              执行前会再次校验双方内容，并自动保存被覆盖目录的安全快照。
            </div>
            <div className="flex justify-end gap-2">
              <button className="app-button" onClick={onClose} type="button" disabled={submitting}>取消</button>
              <button
                className="app-button-primary"
                onClick={() => void handleConfirm()}
                type="button"
                disabled={submitting || preview.entries.length === 0}
              >
                {submitting ? "正在执行…" : isPush ? "确认覆盖目标" : "确认采纳目标"}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function DiffMetric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-black/5 p-3 dark:border-white/10 dark:bg-white/5">
      <p className="text-xs app-text-soft">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}
