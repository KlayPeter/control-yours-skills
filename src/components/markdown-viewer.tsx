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
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-ink-200/70">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="prose prose-invert prose-headings:tracking-tight prose-p:text-ink-100/85 prose-li:text-ink-100/85 max-w-none rounded-2xl border border-white/10 bg-black/20 p-4">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
}
