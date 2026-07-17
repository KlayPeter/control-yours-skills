"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, FileDiff, Github, ShieldCheck, X } from "lucide-react";

import type { TrustedRemoteInstallPreview } from "@shared/contracts";
import { getSkillManagerApi } from "@/lib/electron-api";

type AsyncActionResult<T = unknown> = void | Promise<T>;

function DiffMetric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="app-surface-subtle rounded-2xl p-3 text-center">
      <p className={`text-2xl font-semibold ${tone}`}>{value}</p>
      <p className="mt-1 text-xs app-text-soft">{label}</p>
    </div>
  );
}

export function TrustedRemoteInstallDialog({
  stagedSourceId,
  onChanged
}: {
  stagedSourceId: string;
  onChanged: () => AsyncActionResult;
}) {
  const api = useMemo(() => getSkillManagerApi(), []);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<TrustedRemoteInstallPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPreview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.previewTrustedRemoteInstall(stagedSourceId);
      if (!result.ok || !result.data) {
        throw new Error(result.error || "无法生成可信安装预览。");
      }
      setPreview(result.data);
    } catch (previewError) {
      setPreview(null);
      setError(previewError instanceof Error ? previewError.message : "无法生成可信安装预览。");
    } finally {
      setLoading(false);
    }
  }, [api, stagedSourceId]);

  useEffect(() => {
    if (open) void loadPreview();
  }, [loadPreview, open]);

  const handleConfirm = async () => {
    if (!preview) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await api.executeTrustedRemoteInstall({
        stagedSourceId: preview.stagedSourceId,
        action: preview.action,
        expectedInstalledSkillId: preview.installedSkillId,
        expectedTargetPath: preview.targetPath,
        expectedSourceHash: preview.sourceHash,
        expectedTargetHash: preview.targetHash
      });
      if (!result.ok || !result.data) {
        throw new Error(result.error || "可信安装执行失败。");
      }
      await Promise.resolve().then(() => onChanged()).catch(() => undefined);
      setOpen(false);
    } catch (installError) {
      setError(installError instanceof Error ? installError.message : "可信安装执行失败。");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="app-button-primary px-3" type="button">
          <ShieldCheck className="h-4 w-4" /> 可信安装 / 更新
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[230] bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="app-panel fixed left-1/2 top-1/2 z-[231] flex max-h-[90vh] w-[min(920px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden shadow-2xl">
          <div className="flex items-start justify-between gap-4 border-b border-black/10 p-5 dark:border-white/10">
            <div className="min-w-0">
              <Dialog.Title className="flex items-center gap-2 text-lg font-semibold app-text">
                <Github className="h-5 w-5" /> GitHub 可信安装审查
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm app-text-soft">
                仅下载公开仓库归档并复制 SKILL.md 目录，不执行仓库中的安装命令。
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button aria-label="关闭可信安装预览" className="app-icon-button" type="button">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="overflow-y-auto p-5">
            {loading ? <div className="py-16 text-center text-sm app-text-soft">正在下载公开归档并生成差异预览…</div> : null}
            {error ? (
              <div className="rounded-2xl border border-red-300/50 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">{error}</div>
            ) : null}

            {preview ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] app-text-soft">{preview.action === "update" ? "更新已有技能" : "安装新技能"}</p>
                    <h3 className="mt-2 text-xl font-semibold app-text">{preview.skillName}</h3>
                    <p className="mt-1 text-sm app-text-soft">{preview.description || "未提取到描述"}</p>
                  </div>
                  <span className="rounded-full border border-emerald-300/60 bg-emerald-50 px-3 py-1 text-xs text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">HTTPS · GitHub · 只复制文件</span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <DiffMetric label="新增" value={preview.summary.added} tone="text-emerald-600 dark:text-emerald-400" />
                  <DiffMetric label="修改" value={preview.summary.modified} tone="text-amber-600 dark:text-amber-400" />
                  <DiffMetric label="删除" value={preview.summary.deleted} tone="text-red-600 dark:text-red-400" />
                  <DiffMetric label="未变化" value={preview.summary.unchanged} tone="app-text-soft" />
                </div>

                <div className="mt-5 rounded-2xl border border-black/10 bg-black/5 p-4 text-xs dark:border-white/10 dark:bg-white/5">
                  <p className="break-all font-mono app-text">{preview.repositoryUrl}</p>
                  <p className="my-2 app-text-soft">↓ 安装到</p>
                  <p className="break-all font-mono app-text">{preview.targetPath}</p>
                </div>

                <div className="mt-5 space-y-3">
                  {preview.entries.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-black/15 p-6 text-center text-sm app-text-soft dark:border-white/15">本地内容已是最新版本。</div>
                  ) : preview.entries.map((entry) => (
                    <details className="rounded-2xl border border-black/10 dark:border-white/10" key={entry.path}>
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm">
                        <span className="min-w-0 truncate font-mono app-text" title={entry.path}>{entry.path}</span>
                        <span className="shrink-0 rounded-full border border-black/10 px-2 py-0.5 text-[11px] app-text-soft dark:border-white/10">{entry.change === "added" ? "新增" : entry.change === "deleted" ? "删除" : "修改"}</span>
                      </summary>
                      <div className="border-t border-black/10 p-3 dark:border-white/10">
                        {entry.kind === "binary" ? (
                          <p className="text-xs app-text-soft">二进制文件仅展示变更状态。</p>
                        ) : entry.patch ? (
                          <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-black/90 p-3 text-xs leading-5 text-slate-100">{entry.patch}</pre>
                        ) : (
                          <p className="text-xs app-text-soft">文件过大，已省略文本差异。</p>
                        )}
                        {entry.truncated ? <p className="mt-2 text-xs text-amber-600">差异内容已截断。</p> : null}
                      </div>
                    </details>
                  ))}
                </div>
              </>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 border-t border-black/10 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
            <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              执行时会重新校验仓库和本地哈希；更新前自动保存可回滚快照。
            </div>
            <div className="flex justify-end gap-2">
              <button className="app-button" disabled={submitting} onClick={() => setOpen(false)} type="button">取消</button>
              {error && !preview ? <button className="app-button" disabled={loading} onClick={() => void loadPreview()} type="button">重试</button> : null}
              <button className="app-button-primary" disabled={!preview || submitting || preview.entries.length === 0} onClick={() => void handleConfirm()} type="button">
                <FileDiff className="h-4 w-4" /> {submitting ? "正在校验并执行…" : preview?.action === "update" ? "确认更新" : "确认安装"}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
