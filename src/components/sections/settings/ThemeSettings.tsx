import type { Dispatch, SetStateAction } from "react";
import { SunMoon } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SaveSettingsInput } from "@shared/contracts";

export function ThemeSettings({
  settingsDraft,
  setSettingsDraft
}: {
  settingsDraft: SaveSettingsInput;
  setSettingsDraft: Dispatch<SetStateAction<SaveSettingsInput>>;
}) {
  return (
    <div>
      <span className="block text-sm font-medium app-text">主题</span>
      <div className="mt-2 flex items-center gap-2">
        <button
          className={cn(
            "inline-flex h-10 items-center gap-2 rounded-2xl border px-4 text-sm transition focus-visible:ring-2 focus-visible:ring-signal/45 focus-visible:outline-none",
            settingsDraft.theme === "light"
              ? "border-transparent shadow-md"
              : "app-surface-subtle app-text-soft hover:bg-black/5"
          )}
          style={
            settingsDraft.theme === "light"
              ? { background: "var(--app-text)", color: "var(--app-bg-start)" }
              : undefined
          }
          onClick={() => setSettingsDraft((current) => ({ ...current, theme: "light" }))}
          type="button"
        >
          <SunMoon className="h-4 w-4" aria-hidden="true" />
          浅色
        </button>
        <button
          className={cn(
            "inline-flex h-10 items-center gap-2 rounded-2xl border px-4 text-sm transition focus-visible:ring-2 focus-visible:ring-signal/45 focus-visible:outline-none",
            settingsDraft.theme === "dark"
              ? "border-transparent shadow-md"
              : "app-surface-subtle app-text-soft hover:bg-black/5"
          )}
          style={
            settingsDraft.theme === "dark"
              ? { background: "var(--app-text)", color: "var(--app-bg-start)" }
              : undefined
          }
          onClick={() => setSettingsDraft((current) => ({ ...current, theme: "dark" }))}
          type="button"
        >
          <SunMoon className="h-4 w-4" aria-hidden="true" />
          深色
        </button>
      </div>
    </div>
  );
}
