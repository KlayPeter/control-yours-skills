"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownViewerProps {
  markdown: string | null;
  emptyMessage?: string;
  title?: string;
}

export function MarkdownViewer({
  markdown,
  emptyMessage = "当前没有可展示的 SKILL.md 内容。",
  title
}: MarkdownViewerProps) {
  if (!markdown) {
    return (
      <div className="app-surface-subtle overflow-hidden rounded-[28px]">
        {title ? (
          <div className="border-b border-black/5 px-4 py-3 dark:border-white/10">
            <p className="text-xs uppercase tracking-[0.18em] app-text-soft">{title}</p>
          </div>
        ) : null}
        <div className="p-4 text-sm app-text-soft">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className="app-surface-subtle overflow-hidden rounded-[28px]">
      {title ? (
        <div className="border-b border-black/5 px-4 py-3 dark:border-white/10">
          <p className="text-xs uppercase tracking-[0.18em] app-text-soft">{title}</p>
        </div>
      ) : null}
      <div className="p-4 sm:p-5">
        <div className="prose prose-slate max-w-none break-words dark:prose-invert prose-headings:mb-3 prose-headings:mt-8 prose-headings:tracking-tight prose-headings:text-slate-950 dark:prose-headings:text-white prose-p:my-3 prose-p:leading-7 prose-p:text-slate-700 dark:prose-p:text-slate-100/85 prose-li:my-1 prose-li:leading-7 prose-li:text-slate-700 dark:prose-li:text-slate-100/85 prose-strong:text-slate-950 dark:prose-strong:text-white prose-code:text-slate-900 dark:prose-code:text-slate-100 prose-blockquote:border-l-sky-300 prose-blockquote:bg-sky-50/60 prose-blockquote:px-4 prose-blockquote:py-1 prose-blockquote:text-slate-700 dark:prose-blockquote:border-sky-400/30 dark:prose-blockquote:bg-white/[0.04] dark:prose-blockquote:text-slate-200 prose-a:break-all prose-a:text-slate-900 prose-a:underline prose-a:decoration-slate-300 prose-a:underline-offset-4 dark:prose-a:text-sky-200 dark:prose-a:decoration-sky-300/40 prose-pre:overflow-x-auto prose-pre:rounded-2xl prose-pre:border prose-pre:border-black/10 prose-pre:bg-slate-950/5 prose-pre:px-4 prose-pre:py-3 prose-pre:text-slate-800 dark:prose-pre:border-white/10 dark:prose-pre:bg-black/40 dark:prose-pre:text-slate-50 prose-img:rounded-2xl prose-img:border prose-img:border-black/10 dark:prose-img:border-white/10">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
