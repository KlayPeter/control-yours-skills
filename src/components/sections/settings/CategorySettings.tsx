import type { Dispatch, SetStateAction } from "react";
import type { SaveSettingsInput } from "@shared/contracts";
import { cn } from "@/lib/cn";

type AsyncActionResult<T = unknown> = void | Promise<T>;

export function CategorySettings({
  settingsDraft,
  setSettingsDraft,
  onCreateCategory,
  newCategoryName,
  onNewCategoryNameChange
}: {
  settingsDraft: SaveSettingsInput;
  setSettingsDraft: Dispatch<SetStateAction<SaveSettingsInput>>;
  onCreateCategory: () => AsyncActionResult;
  newCategoryName: string;
  onNewCategoryNameChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium app-text" htmlFor="new-category">技能分类</label>
      <div className="mt-2 flex flex-col gap-2 xl:flex-row">
        <input
          id="new-category"
          className="app-input h-10 flex-1 rounded-2xl px-4 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-signal/45"
          onChange={(event) => onNewCategoryNameChange(event.target.value)}
          placeholder="例如 video"
          value={newCategoryName}
          autoComplete="off"
        />
        <button
          className="app-button rounded-2xl px-4 py-2 focus-visible:ring-2 focus-visible:ring-signal/45 focus-visible:outline-none"
          onClick={() => void onCreateCategory()}
          type="button"
        >
          创建分类
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {settingsDraft.skillCategories.length > 0 ? (
          settingsDraft.skillCategories.map((category) => (
            <button
              key={category}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition focus-visible:ring-2 focus-visible:ring-signal/45 focus-visible:outline-none",
                settingsDraft.defaultSkillCategory === category
                  ? "border-signal/40 bg-signal/15 text-signal"
                  : "app-surface-subtle app-text-soft"
              )}
              onClick={() =>
                setSettingsDraft((current) => ({
                  ...current,
                  defaultSkillCategory: category
                }))
              }
              type="button"
            >
              {category}
            </button>
          ))
        ) : (
          <p className="text-sm app-text-soft">还没有分类，创建后就可以把 skill 放到对应目录。</p>
        )}
      </div>
    </div>
  );
}
