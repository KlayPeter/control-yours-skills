import { Eye, FolderOpen, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import type { InstalledSkillRecord, SkillCategoryRecord } from "@shared/contracts";

import { SectionCard } from "../ui/cards";
import { SourceBadge } from "../ui/badges";
import { IconActionButton } from "../ui/buttons";
import { OverviewMetric, RelativeTimeText } from "../ui/typography";
import { EmptyState } from "../ui/empty-state";

type TranslationDictionary = Record<string, string>;
type AsyncActionResult<T = unknown> = void | Promise<T>;

export function SkillsSection({
  t,
  installedSkills,
  selectedSkillId,
  searchValue,
  onSearchValueChange,
  onLoadSkillDetail,
  onOpenPath,
  categories,
  selectedCategory,
  onCategoryChange
}: {
  t: TranslationDictionary;
  installedSkills: InstalledSkillRecord[];
  selectedSkillId: string | null;
  searchValue: string;
  onSearchValueChange: (value: string) => void;
  onLoadSkillDetail: (id: string) => AsyncActionResult;
  onOpenPath: (path: string) => AsyncActionResult;
  categories: SkillCategoryRecord[];
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
}) {
  const activeCategoryCount = categories.filter((category) => category.skillCount > 0).length;
  const sourceTypeCount = new Set(installedSkills.map((skill) => skill.sourceType)).size;

  return (
    <div className="space-y-6">
      <SectionCard title={t.installedSkills} subtitle={t.installedSkillsSubtitle}>
        <div className="mb-5 grid gap-4 md:grid-cols-3">
          <OverviewMetric label={t.overviewMetricInstalled} value={installedSkills.length} />
          <OverviewMetric label={t.installedMetricCategories} value={activeCategoryCount} />
          <OverviewMetric label={t.installedMetricSourceTypes} value={sourceTypeCount} />
        </div>

        <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr),220px]">
          <div className="app-search-shell flex items-center gap-3">
            <Search className="h-4 w-4 app-text-soft" />
            <input
              className="h-10 flex-1 bg-transparent text-sm app-text outline-none placeholder:app-text-soft"
              onChange={(event) => onSearchValueChange(event.target.value)}
              placeholder={t.searchPlaceholder}
              value={searchValue}
            />
          </div>
          <select
            className="app-input h-10 rounded-2xl px-4 text-sm outline-none focus:border-signal/45"
            onChange={(event) => onCategoryChange(event.target.value)}
            value={selectedCategory}
          >
            <option value="">{t.allCategories}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {installedSkills.length ? (
          <div className="space-y-3">
            {installedSkills.map((skill) => (
              <div
                key={skill.id}
                className={cn(
                  "overflow-hidden rounded-[28px] border transition",
                  selectedSkillId === skill.id
                    ? "border-moss/45 bg-moss/10"
                    : "app-surface hover:border-white/20 hover:bg-white/5"
                )}
              >
                <div className="p-5">
                  <button
                    className="min-w-0 flex-1 text-left"
                    onClick={() => void onLoadSkillDetail(skill.id)}
                    type="button"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold tracking-tight app-text">{skill.name}</p>
                      <SourceBadge source={skill.sourceType} t={t} />
                      {skill.category ? <span className="app-tag normal-case tracking-normal">{skill.category}</span> : null}
                    </div>
                    <p className="mt-3 text-sm leading-6 app-text-soft">
                      {skill.description || t.noDescriptionAvailable}
                    </p>
                  </button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-4">
                  <p className="text-xs app-text-soft">
                    <RelativeTimeText value={skill.installedAt} />
                  </p>
                  <div className="flex flex-wrap justify-end gap-2">
                    <IconActionButton
                      icon={FolderOpen}
                      label={t.openFolder}
                      onClick={() => void onOpenPath(skill.installPath)}
                    />
                    <IconActionButton
                      icon={Eye}
                      label={t.view}
                      onClick={() => void onLoadSkillDetail(skill.id)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState description={t.noInstalledSkillsYetDescription} title={t.noInstalledSkillsYet} />
        )}
      </SectionCard>
    </div>
  );
}
