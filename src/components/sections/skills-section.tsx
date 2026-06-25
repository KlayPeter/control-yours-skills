import { Eye, FolderOpen, Search, Copy, Move } from "lucide-react";
import { cn } from "@/lib/cn";
import type { InstalledSkillRecord, SkillCategoryRecord, SkillManagerSnapshot, WorkspaceTreeNode } from "@shared/contracts";

import { SectionCard } from "../ui/cards";
import { IconActionButton } from "../ui/buttons";
import { OverviewMetric } from "../ui/typography";
import { EmptyState } from "../ui/empty-state";

type TranslationDictionary = Record<string, string>;
type AsyncActionResult<T = unknown> = void | Promise<T>;

interface GlobalSkillItem {
  id: string;
  name: string;
  description: string | null;
  installPath: string;
  locationLabel: string;
  sourceTypeLabel: string;
  category: string | null;
}

function traverseTree(
  nodes: WorkspaceTreeNode[],
  locationLabel: string,
  sourceTypeLabel: string,
  category: string | null,
  result: GlobalSkillItem[]
) {
  for (const node of nodes) {
    if (node.kind === "skill" && node.skill) {
      result.push({
        id: node.skill.id,
        name: node.skill.name,
        description: node.skill.description,
        installPath: node.skill.rootPath,
        locationLabel,
        sourceTypeLabel,
        category: category
      });
    } else if (node.kind === "folder" && node.children) {
      traverseTree(node.children, locationLabel, sourceTypeLabel, category || node.name, result);
    }
  }
}

function getAllSkills(snapshot: SkillManagerSnapshot): GlobalSkillItem[] {
  const result: GlobalSkillItem[] = [];
  
  if (snapshot.installDirTree) {
    traverseTree(snapshot.installDirTree, "默认安装目录", "Local", null, result);
  }

  if (snapshot.systemSkillSources) {
    for (const source of snapshot.systemSkillSources) {
      if (source.exists && source.tree) {
        traverseTree(source.tree, source.label, "System", null, result);
      }
    }
  }

  if (snapshot.importedProjects) {
    for (const project of snapshot.importedProjects) {
      if (project.tree) {
        traverseTree(project.tree, project.name, "Project", null, result);
      }
    }
  }

  return result;
}

export function SkillsSection({
  t,
  installedSkills,
  selectedSkillId,
  searchValue,
  onSearchValueChange,
  onLoadSkillDetail,
  onOpenPath,
  onCopySkill,
  onMoveSkill,
  categories,
  selectedCategory,
  onCategoryChange,
  snapshot
}: {
  t: TranslationDictionary;
  installedSkills: InstalledSkillRecord[];
  selectedSkillId: string | null;
  searchValue: string;
  onSearchValueChange: (value: string) => void;
  onLoadSkillDetail: (id: string) => AsyncActionResult;
  onOpenPath: (path: string) => AsyncActionResult;
  onCopySkill: (id: string) => AsyncActionResult;
  onMoveSkill: (id: string) => AsyncActionResult;
  categories: SkillCategoryRecord[];
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  snapshot: SkillManagerSnapshot;
}) {
  const allSkills = getAllSkills(snapshot);
  
  let displayedSkills = allSkills;
  
  if (searchValue) {
    const q = searchValue.toLowerCase();
    displayedSkills = displayedSkills.filter(
      (s) => s.name.toLowerCase().includes(q) || (s.description && s.description.toLowerCase().includes(q))
    );
  }
  
  if (selectedCategory) {
    displayedSkills = displayedSkills.filter((s) => s.category === selectedCategory);
  }

  const activeCategoryCount = new Set(allSkills.map(s => s.category).filter(Boolean)).size;
  const locationCount = new Set(allSkills.map(s => s.locationLabel)).size;

  return (
    <div className="space-y-6">
      <SectionCard title="全局搜索库" subtitle="汇总所有目录和项目下的技能，方便跨目录统一搜索和管理。">
        <div className="mb-5 grid gap-4 md:grid-cols-3">
          <OverviewMetric label="总技能数" value={allSkills.length} />
          <OverviewMetric label="有效分类数" value={activeCategoryCount} />
          <OverviewMetric label="来源目录数" value={locationCount} />
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
            {Array.from(new Set(allSkills.map(s => s.category).filter(Boolean))).map((cat) => (
              <option key={cat as string} value={cat as string}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {displayedSkills.length ? (
          <div className="space-y-3">
            {displayedSkills.map((skill) => (
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
                      <span className="app-tag border border-white/10 bg-white/5 text-white/70 tracking-normal normal-case">
                        {skill.locationLabel}
                      </span>
                      {skill.sourceTypeLabel && (
                        <span className="app-tag border border-white/10 bg-white/5 text-white/70 tracking-normal normal-case">
                          {skill.sourceTypeLabel}
                        </span>
                      )}
                      {skill.category ? <span className="app-tag normal-case tracking-normal">{skill.category}</span> : null}
                    </div>
                    <p className="mt-3 text-sm leading-6 app-text-soft">
                      {skill.description || t.noDescriptionAvailable}
                    </p>
                  </button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-[11px] font-mono opacity-60 app-text-soft break-all" title={skill.installPath}>
                      {skill.installPath}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <IconActionButton
                      icon={Copy}
                      label="复制到"
                      onClick={() => onCopySkill(skill.id)}
                    />
                    <IconActionButton
                      icon={Move}
                      label="移动到"
                      onClick={() => onMoveSkill(skill.id)}
                    />
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
