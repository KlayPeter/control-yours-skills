"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownViewerProps {
  markdown: string | null;
  emptyMessage?: string;
}

export function MarkdownViewer({
  markdown,
  emptyMessage = "当前没有可展示的 SKILL.md 内容。"
}: MarkdownViewerProps) {
  if (!markdown) {
    return (
      <div className="app-surface-subtle rounded-2xl p-4 text-sm app-text-soft">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="app-surface-subtle rounded-2xl p-4">
      <div className="prose prose-slate dark:prose-invert prose-headings:tracking-tight prose-headings:text-slate-950 dark:prose-headings:text-white prose-p:text-slate-700 dark:prose-p:text-slate-100/85 prose-li:text-slate-700 dark:prose-li:text-slate-100/85 prose-strong:text-slate-950 dark:prose-strong:text-white prose-code:text-slate-900 dark:prose-code:text-slate-100 prose-blockquote:text-slate-700 dark:prose-blockquote:text-slate-200 prose-a:text-slate-900 dark:prose-a:text-sky-200 prose-pre:border prose-pre:border-black/10 dark:prose-pre:border-white/10 prose-pre:bg-slate-950/5 dark:prose-pre:bg-black/40 prose-pre:text-slate-800 dark:prose-pre:text-slate-50 max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      </div>
    </div>
  );
}
