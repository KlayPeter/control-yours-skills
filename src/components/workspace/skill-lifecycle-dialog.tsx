"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { FilePenLine, History, Pin, PinOff, RefreshCcw, RotateCcw, Save, X } from "lucide-react";

import type { InstalledSkillDetail, InstalledSkillRecord, SkillSnapshotRecord } from "@shared/contracts";
import { getSkillManagerApi } from "@/lib/electron-api";
import { MarkdownViewer } from "@/components/markdown-viewer";

type AsyncActionResult<T = unknown> = void | Promise<T>;

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function snapshotReason(reason: string) {
  if (reason === "before-edit") return "编辑前";
  if (reason === "before-restore") return "回滚前";
  if (reason === "before-overwrite") return "同步覆盖前";
  return reason;
}

export function SkillLifecycleDialog({
  skill,
  onChanged
}: {
  skill: InstalledSkillRecord;
  onChanged: () => AsyncActionResult;
}) {
  const api = useMemo(() => getSkillManagerApi(), []);
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<InstalledSkillDetail | null>(null);
  const [snapshots, setSnapshots] = useState<SkillSnapshotRecord[]>([]);
  const [draft, setDraft] = useState("");
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setBusy("正在读取内容与版本");
    setError(null);
    try {
      const [detailResult, snapshotsResult] = await Promise.all([
        api.getInstalledSkillDetail(skill.id),
        api.listSkillSnapshots(skill.id)
      ]);
      if (!detailResult.ok || !detailResult.data) {
        throw new Error(detailResult.error || "无法读取技能内容。");
      }
      if (!snapshotsResult.ok || !snapshotsResult.data) {
        throw new Error(snapshotsResult.error || "无法读取版本历史。");
      }
      setDetail(detailResult.data);
      setDraft(detailResult.data.markdown || "");
      setSnapshots(snapshotsResult.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "读取技能版本失败。");
    } finally {
      setBusy(null);
    }
  }, [api, skill.id]);

  useEffect(() => {
    if (open) {
      void load();
    }
  }, [load, open]);

  const refreshSnapshots = async () => {
    const result = await api.listSkillSnapshots(skill.id);
    if (!result.ok || !result.data) {
      throw new Error(result.error || "无法刷新版本历史。");
    }
    setSnapshots(result.data);
  };

  const handleSave = async () => {
    if (!detail || draft === (detail.markdown || "")) return;
    setBusy("正在保存 SKILL.md");
    setError(null);
    setNotice(null);
    try {
      const result = await api.saveSkillMarkdown({
        skillId: detail.id,
        markdown: draft,
        expectedHash: detail.contentHash
      });
      if (!result.ok || !result.data) {
        throw new Error(result.error || "保存失败。");
      }
      setDetail(result.data);
      setDraft(result.data.markdown || "");
      await refreshSnapshots().catch(() => setError("内容已保存，但版本列表刷新失败；请重新载入。"));
      setNotice("已保存，并自动保留编辑前版本。");
      Promise.resolve().then(() => onChanged()).catch(() => undefined);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "保存失败。");
    } finally {
      setBusy(null);
    }
  };

  const handleRestore = async (snapshot: SkillSnapshotRecord) => {
    if (!detail) return;
    if (!window.confirm(`确认恢复到 ${formatDate(snapshot.createdAt)} 的版本？当前版本会先自动备份。`)) {
      return;
    }
    setBusy("正在安全回滚");
    setError(null);
    setNotice(null);
    try {
      const result = await api.restoreSkillSnapshot({
        snapshotId: snapshot.id,
        expectedCurrentHash: detail.contentHash
      });
      if (!result.ok || !result.data) {
        throw new Error(result.error || "回滚失败。");
      }
      setDetail(result.data);
      setDraft(result.data.markdown || "");
      await refreshSnapshots().catch(() => setError("内容已回滚，但版本列表刷新失败；请重新载入。"));
      setNotice("已恢复所选版本，回滚前内容也已保留。");
      Promise.resolve().then(() => onChanged()).catch(() => undefined);
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : "回滚失败。");
    } finally {
      setBusy(null);
    }
  };

  const handlePin = async (snapshot: SkillSnapshotRecord) => {
    setBusy(snapshot.isPinned ? "正在取消保留" : "正在永久保留");
    setError(null);
    try {
      const result = await api.pinSkillSnapshot({ snapshotId: snapshot.id, pinned: !snapshot.isPinned });
      if (!result.ok || !result.data) {
        throw new Error(result.error || "更新版本保留状态失败。");
      }
      setSnapshots((current) =>
        current
          .map((item) => (item.id === result.data?.id ? result.data : item))
          .filter((item): item is SkillSnapshotRecord => Boolean(item))
          .sort((left, right) => Number(right.isPinned) - Number(left.isPinned) || right.createdAt.localeCompare(left.createdAt))
      );
    } catch (pinError) {
      setError(pinError instanceof Error ? pinError.message : "更新版本保留状态失败。");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          className="app-button shrink-0 px-2"
          onClick={(event) => event.stopPropagation()}
          title="编辑内容与版本历史"
          type="button"
        >
          <FilePenLine className="h-4 w-4" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[210] bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[220] flex max-h-[92vh] w-[min(1100px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-2xl outline-none dark:border-white/10 dark:bg-[#161616]">
          <div className="flex items-start justify-between gap-4 border-b border-black/10 px-6 py-5 dark:border-white/10">
            <div>
              <Dialog.Title className="text-xl font-semibold app-text">{skill.name} · 内容与版本</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm app-text-soft">
                编辑中心仓库的 SKILL.md；保存和回滚前都会自动创建安全快照。
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button aria-label="关闭内容与版本" className="app-icon-button rounded-2xl" type="button">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr),340px]">
            <section className="flex min-h-[520px] min-w-0 flex-col border-b border-black/10 p-5 dark:border-white/10 lg:border-b-0 lg:border-r">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-2">
                  <button className={!preview ? "app-button-primary px-4" : "app-button px-4"} onClick={() => setPreview(false)} type="button">编辑</button>
                  <button className={preview ? "app-button-primary px-4" : "app-button px-4"} onClick={() => setPreview(true)} type="button">预览</button>
                </div>
                <div className="flex gap-2">
                  <button className="app-button px-3" disabled={Boolean(busy)} onClick={() => void load()} type="button">
                    <RefreshCcw className="h-4 w-4" /> 重新载入
                  </button>
                  <button
                    className="app-button-primary px-4"
                    disabled={Boolean(busy) || !detail || !draft.trim() || draft === (detail.markdown || "")}
                    onClick={() => void handleSave()}
                    type="button"
                  >
                    <Save className="h-4 w-4" /> 保存
                  </button>
                </div>
              </div>

              {error ? <div className="mb-3 rounded-2xl border border-red-300/50 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">{error}</div> : null}
              {notice ? <div className="mb-3 rounded-2xl border border-emerald-300/50 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">{notice}</div> : null}
              {busy ? <p className="mb-3 text-sm app-text-soft">{busy}…</p> : null}

              <div className="min-h-0 flex-1 overflow-auto">
                {preview ? (
                  <MarkdownViewer markdown={draft} title="SKILL.md 预览" />
                ) : (
                  <textarea
                    aria-label="编辑 SKILL.md"
                    className="app-input h-full min-h-[430px] w-full resize-none rounded-2xl p-4 font-mono text-sm leading-6 outline-none focus-visible:ring-2 focus-visible:ring-signal/45"
                    disabled={!detail || Boolean(busy)}
                    onChange={(event) => setDraft(event.target.value)}
                    spellCheck={false}
                    value={draft}
                  />
                )}
              </div>
            </section>

            <aside className="min-h-0 overflow-y-auto p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 app-text-soft" />
                  <h3 className="text-sm font-semibold app-text">版本历史</h3>
                </div>
                <span className="text-xs app-text-soft">{snapshots.length} 个</span>
              </div>
              <p className="mt-2 text-xs leading-5 app-text-soft">置顶版本不会被数量或容量策略自动清理。</p>

              <div className="mt-4 space-y-3">
                {snapshots.length === 0 ? (
                  <div className="app-surface-subtle rounded-2xl p-4 text-sm app-text-soft">首次编辑或同步覆盖后，这里会出现快照。</div>
                ) : snapshots.map((snapshot) => (
                  <div className="app-surface-subtle rounded-2xl p-4" key={snapshot.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium app-text">{snapshotReason(snapshot.reason)}</p>
                        <p className="mt-1 text-xs app-text-soft">{formatDate(snapshot.createdAt)}</p>
                      </div>
                      {snapshot.isPinned ? <Pin className="h-4 w-4 text-signal" /> : null}
                    </div>
                    <p className="mt-3 font-mono text-[11px] app-text-soft">{snapshot.contentHash?.slice(0, 12) || "无哈希"} · {formatBytes(snapshot.sizeBytes)}</p>
                    <div className="mt-3 flex gap-2">
                      <button className="app-button flex-1 justify-center px-3" disabled={Boolean(busy)} onClick={() => void handleRestore(snapshot)} type="button">
                        <RotateCcw className="h-4 w-4" /> 恢复
                      </button>
                      <button className="app-button px-3" disabled={Boolean(busy)} onClick={() => void handlePin(snapshot)} title={snapshot.isPinned ? "取消永久保留" : "永久保留"} type="button">
                        {snapshot.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
