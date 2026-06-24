import { Search } from "lucide-react";

export function EmptyState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="app-empty-state">
      <div className="app-empty-orb mx-auto flex h-14 w-14 items-center justify-center rounded-[22px] border border-white/10 app-text-soft">
        <Search className="h-5 w-5" />
      </div>
      <p className="mt-5 text-lg font-semibold tracking-tight app-text">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 app-text-soft">{description}</p>
    </div>
  );
}
