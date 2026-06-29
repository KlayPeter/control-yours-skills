import { FolderPlus, FolderSearch, Search } from "lucide-react";
import type { SkillManagerSnapshot, WorkspaceSkillProviderKey, WorkspaceTreeNode, CopyWorkspaceSkillInput } from "@shared/contracts";
import { SectionCard } from "../ui/cards";
import { WorkspaceTree } from "../workspace/workspace-tree";
import { countSkillsInTree } from "@/lib/tree-utils";
import { IconActionButton } from "../ui/buttons";
import { Trash2 } from "lucide-react";
import { OverviewMetric } from "../ui/typography";

type TranslationDictionary = Record<string, string>;
type AsyncActionResult<T = unknown> = void | Promise<T>;

export function ProjectsSection({
  snapshot,
  t,
  onOpenPath,
  onRemoveProject,
  onImportProject,
  onInstallWorkspaceSkill,
  onCopyWorkspaceSkill,
  onCreateWorkspaceFolder,
  searchValue,
  onSearchValueChange
}: {
  snapshot: SkillManagerSnapshot;
  t: TranslationDictionary;
  onOpenPath: (path: string) => AsyncActionResult;
  onRemoveProject: (projectPath: string) => AsyncActionResult;
  onImportProject: () => AsyncActionResult;
  onInstallWorkspaceSkill: (
    sourceRoot: string,
    skillRootPath: string,
    providerKey: WorkspaceSkillProviderKey
  ) => AsyncActionResult;
  onCopyWorkspaceSkill: (input: CopyWorkspaceSkillInput) => AsyncActionResult;
  onCreateWorkspaceFolder: (input: { parentPath: string; folderName: string }) => AsyncActionResult;
  searchValue: string;
  onSearchValueChange: (value: string) => void;
}) {
  const projects = snapshot.importedProjects;
  const totalSkillCount = projects.reduce((sum, project) => sum + countSkillsInTree(project.tree), 0);
  const searchableProjectCount = projects.filter((project) => countSkillsInTree(project.tree) > 0).length;

  // Simple search filter function that filters the tree nodes by name
  const filterTree = (nodes: WorkspaceTreeNode[], search: string): WorkspaceTreeNode[] => {
    if (!search) return nodes;
    const lowerSearch = search.toLowerCase();
    
    return nodes.map(node => {
      if (node.kind === 'skill' && node.name.toLowerCase().includes(lowerSearch)) {
        return node;
      }
      if (node.kind === 'folder') {
        const filteredChildren = filterTree(node.children, search);
        if (filteredChildren.length > 0 || node.name.toLowerCase().includes(lowerSearch)) {
          return { ...node, children: filteredChildren };
        }
      }
      return null;
    }).filter((n): n is WorkspaceTreeNode => n !== null);
  };

  return (
    <div className="space-y-6">
      <SectionCard
        title={t.projectsGuideTitle || "项目导入是做什么的"}
        subtitle={
          t.projectsGuideSubtitle ||
          "把你本地的业务项目接进来后，系统会扫描其中的 Skill 文件夹，让你把项目里的能力纳入统一管理。"
        }
        actions={
          <button className="app-button" onClick={() => void onImportProject()} type="button">
            <FolderPlus className="h-4 w-4" />
            {t.importProjectAction || t.importProject}
          </button>
        }
      >
        <div className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="app-card p-4">
              <div className="flex items-center gap-2 text-sm font-medium app-text">
                <FolderPlus className="h-4 w-4 text-signal" />
                {t.projectsStepImportTitle || "1. 导入项目目录"}
              </div>
              <p className="mt-3 text-sm app-text-soft">
                {t.projectsStepImportBody || "选择一个本地项目根目录，系统会把它加入长期跟踪列表。"}
              </p>
            </div>
            <div className="app-card p-4">
              <div className="flex items-center gap-2 text-sm font-medium app-text">
                <FolderSearch className="h-4 w-4 text-amber-500" />
                {t.projectsStepScanTitle || "2. 扫描项目里的 Skill"}
              </div>
              <p className="mt-3 text-sm app-text-soft">
                {t.projectsStepScanBody || "系统会递归识别包含 SKILL.md 的目录，并把它们展示成可浏览、可安装的树。"}
              </p>
            </div>
            <div className="app-card p-4">
              <div className="flex items-center gap-2 text-sm font-medium app-text">
                <Search className="h-4 w-4 text-emerald-500" />
                {t.projectsStepManageTitle || "3. 统一纳管或分发"}
              </div>
              <p className="mt-3 text-sm app-text-soft">
                {t.projectsStepManageBody || "你可以把项目里的 Skill 安装到中心仓库，或直接复制到其他 Agent 目录。"}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <OverviewMetric label={t.projectsMetricImported || "已导入项目"} value={projects.length} />
            <OverviewMetric label={t.projectsMetricDetectedSkills || "识别到的 Skill"} value={totalSkillCount} />
            <OverviewMetric label={t.projectsMetricActiveProjects || "有 Skill 的项目"} value={searchableProjectCount} />
          </div>
        </div>
      </SectionCard>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 app-text-soft" />
          <input
            type="text"
            placeholder={t.search || "搜索..."}
            value={searchValue}
            onChange={(e) => onSearchValueChange(e.target.value)}
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black/40 pl-10 pr-4 py-2 text-sm app-text focus-visible:ring-2 focus-visible:ring-signal/45 focus-visible:outline-none transition-all"
            spellCheck={false}
          />
        </div>
      </div>

      <div className="space-y-6">
        {projects.length === 0 && (
          <div className="rounded-2xl border border-dashed border-black/15 dark:border-white/15 bg-black/5 dark:bg-black/10 px-4 py-12 text-center text-sm app-text-soft">
            <p>{t.noProjectsImported || "还没有导入任何项目。"}</p>
            <button className="mt-4 app-button" onClick={() => void onImportProject()} type="button">
              <FolderPlus className="h-4 w-4" />
              {t.importProjectAction || t.importProject}
            </button>
          </div>
        )}
        
        {projects.map(project => {
          const filteredTree = filterTree(project.tree, searchValue);
          const skillCount = countSkillsInTree(filteredTree);
          
          if (skillCount === 0 && searchValue) return null; // Hide empty projects during search
          
          return (
            <SectionCard 
              key={project.id} 
              title={project.name}
              subtitle={project.path}
              actions={
                <IconActionButton
                  icon={Trash2}
                  label={t.delete || "移除"}
                  onClick={() => {
                    if (window.confirm(t.confirmDelete || "确定要移除吗？此操作不可撤销。")) {
                      onRemoveProject(project.path);
                    }
                  }}
                  tone="danger"
                />
              }
            >
              <div className="mt-4">
                <WorkspaceTree
                  nodes={filteredTree}
                  projectRoot={project.path}
                  onOpenPath={onOpenPath}
                  onInstallWorkspaceSkill={onInstallWorkspaceSkill}
                  onCopyWorkspaceSkill={onCopyWorkspaceSkill}
                  onCreateWorkspaceFolder={onCreateWorkspaceFolder}
                  importedProjects={snapshot.importedProjects}
                  localInstallDir={snapshot.settings.installDir}
                  installDirTree={snapshot.installDirTree}
                  emptyMessage={t.projectTreeEmpty || "这个项目里还没有识别到可安装的 Skill 文件夹。"}
                />
              </div>
            </SectionCard>
          );
        })}
      </div>
    </div>
  );
}
