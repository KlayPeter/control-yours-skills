import Link from "next/link";
import { PanelLeftClose, PanelLeftOpen, LayoutDashboard, Sparkles, HardDriveDownload, FolderOpen, Logs, Settings, FolderPlus } from "lucide-react";
import { cn } from "@/lib/cn";
import { LogoIcon } from "@/components/ui/logo-icon";
import { SidebarWorkspaceTree } from "./sidebar";
import type { WorkspaceSection } from "../workspace-app";
import type { TranslationDictionary } from "@/locales/translations";
import type { SkillManagerSnapshot, WorkspaceSkillProviderKey } from "@shared/contracts";

const navItems: Array<{
  section: WorkspaceSection;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  href: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any; // using any to bypass strict typeof for lucide icons
}> = [
  { section: "overview", href: "/", icon: LayoutDashboard },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { section: "ai-workspace", href: "/ai-workspace" as any, icon: Sparkles },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { section: "local-install", href: "/local-install" as any, icon: HardDriveDownload },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { section: "projects", href: "/projects" as any, icon: FolderOpen },
  { section: "logs", href: "/logs", icon: Logs },
  { section: "settings", href: "/settings", icon: Settings }
];

export function navLabel(section: WorkspaceSection, t: TranslationDictionary) {
  switch (section) {
    case "overview": return t.sectionOverview;
    case "ai-workspace": return t.sectionAiWorkspace;
    case "local-install": return t.sectionLocalInstall;
    case "projects": return t.sectionProjects;
    case "staged": return t.sectionStaged;
    case "logs": return t.sectionLogs;
    case "settings": return t.sectionSettings;
  }
}

interface WorkspaceNavSidebarProps {
  section: WorkspaceSection;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (val: boolean) => void;
  t: TranslationDictionary;
  sidebarTab: "projects" | "installDir";
  handleQuickChooseInstallDir: () => void;
  snapshot: SkillManagerSnapshot | null;
  openPath: (path: string) => void;
  handleInstallWorkspaceSkill: (sourceRoot: string, skillRootPath: string, providerKey: WorkspaceSkillProviderKey) => Promise<void>;
  onCopyWorkspaceSkill: (input: { sourceRoot: string; skillRootPath: string; targetDirectory: string }) => Promise<void>;
  onCreateWorkspaceFolder: (input: { parentPath: string; folderName: string }) => Promise<void>;
  setSidebarTab: (val: "projects" | "installDir") => void;
  pendingCount: number;
  failureCount: number;
  handleImportProject: () => void;
}

export function WorkspaceNavSidebar({
  section,
  sidebarCollapsed,
  setSidebarCollapsed,
  t,
  sidebarTab,
  handleQuickChooseInstallDir,
  snapshot,
  openPath,
  handleInstallWorkspaceSkill,
  setSidebarTab,
  pendingCount,
  failureCount,
  handleImportProject,
  onCopyWorkspaceSkill,
  onCreateWorkspaceFolder
}: WorkspaceNavSidebarProps) {
  return (
    <aside className="app-sidebar">
      <div className="app-sidebar-inner">
        <div className={cn("flex flex-col", sidebarCollapsed ? "items-center gap-4 px-0" : "gap-5 px-2")}>
          <div className={cn("flex items-center w-full", sidebarCollapsed && "justify-center")}>
            <button
              type="button"
              className={cn(
                "flex shrink-0 items-center justify-center app-text transition-all",
                sidebarCollapsed ? "h-10 w-10 rounded-[16px] app-surface-subtle shadow-[0_12px_24px_rgba(15,23,42,0.18)]" : "h-8 w-8 rounded-[12px] hover:bg-black/5 dark:hover:bg-white/5 -ml-1"
              )}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? "展开侧边栏" : "折叠侧边栏"}
            >
              {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
          </div>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3 min-w-0 flex-1 transition-opacity duration-300">
              <LogoIcon className="h-10 w-10 app-text shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold app-text">{t.appName}</p>
                <p className="mt-0.5 truncate text-[11px] app-text-soft leading-none">{t.appTitle}</p>
              </div>
            </div>
          )}
        </div>

        <nav className={cn("mt-6 space-y-1.5", sidebarCollapsed && "px-1")}>
          {navItems.filter(item => item.section !== "settings").map((item) => {
            const Icon = item.icon;
            const active = item.section === section;
            return (
              <Link
                key={item.section}
                className={cn(
                  "app-sidebar-nav-item",
                  active && "app-sidebar-nav-item-active",
                  sidebarCollapsed && "justify-center px-0"
                )}
                href={item.href}
                title={sidebarCollapsed ? navLabel(item.section, t) : undefined}
              >
                <span className={cn("flex min-w-0 items-center gap-3", sidebarCollapsed && "justify-center")}>
                  <span className={cn("app-sidebar-nav-icon", active && "app-sidebar-nav-icon-active", sidebarCollapsed && "h-10 w-10 rounded-[12px]")}>
                    <Icon className="h-4 w-4" />
                  </span>
                  {!sidebarCollapsed && <span className="truncate font-medium">{navLabel(item.section, t)}</span>}
                </span>
                {!sidebarCollapsed && item.section === "staged" && pendingCount ? (
                  <span className="app-sidebar-count app-sidebar-count-signal">{pendingCount}</span>
                ) : null}
                {!sidebarCollapsed && item.section === "logs" && failureCount ? (
                  <span className="app-sidebar-count app-sidebar-count-danger">{failureCount}</span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        {!sidebarCollapsed && (
          <section className="mt-8 flex min-h-0 flex-1 flex-col border-t pt-5 transition-opacity" style={{ borderColor: "var(--app-border)" }}>
            <div className="flex items-center justify-between gap-3 px-2">
              <div className="flex items-center gap-2">
                <button 
                  className={cn("text-xs font-medium tracking-[0.08em] transition-all", sidebarTab === "projects" ? "app-text" : "app-text-soft opacity-40 hover:opacity-100 hover:app-text")}
                  onClick={() => setSidebarTab("projects")}
                >
                  已导入项目
                </button>
                <span className="text-xs text-black/10 dark:text-white/10">|</span>
                <button 
                  className={cn("text-xs font-medium tracking-[0.08em] transition-all", sidebarTab === "installDir" ? "app-text" : "app-text-soft opacity-40 hover:opacity-100 hover:app-text")}
                  onClick={() => setSidebarTab("installDir")}
                >
                  本地安装
                </button>
              </div>
              {sidebarTab === "projects" ? (
                <button
                  aria-label={t.importProject}
                  className="app-sidebar-ghost-button"
                  onClick={() => void handleImportProject()}
                  title={t.importProject}
                  type="button"
                >
                  <FolderPlus className="h-4 w-4" />
                </button>
              ) : (
                <button
                  aria-label={t.quickStartChooseInstallDir}
                  className="app-sidebar-ghost-button"
                  onClick={() => void handleQuickChooseInstallDir()}
                  title={t.quickStartChooseInstallDir}
                  type="button"
                >
                  <FolderOpen className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="app-scrollbar-hidden mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
              {sidebarTab === "projects" ? (
                snapshot?.importedProjects.length ? (
                  snapshot.importedProjects.map((project, index) => (
                    <SidebarWorkspaceTree
                      key={project.id}
                      defaultOpen={index === 0}
                      nodes={project.tree}
                      onOpenPath={(targetPath) => {
                        void openPath(targetPath);
                      }}
                      onInstallWorkspaceSkill={handleInstallWorkspaceSkill}
                      onCopyWorkspaceSkill={onCopyWorkspaceSkill}
                      onCreateWorkspaceFolder={onCreateWorkspaceFolder}
                      importedProjects={snapshot?.importedProjects}
                      localInstallDir={snapshot?.settings?.installDir}
                      installDirTree={snapshot?.installDirTree}
                      rootLabel={project.name}
                      rootPath={project.path}
                    />
                  ))
                ) : (
                  <div className="px-3 py-2 text-[12px] opacity-60 app-text-soft">尚未导入项目</div>
                )
              ) : (
                snapshot?.installDirTree && snapshot.installDirTree.length > 0 ? (
                  <SidebarWorkspaceTree
                    nodes={snapshot.installDirTree}
                    onOpenPath={(targetPath) => {
                      void openPath(targetPath);
                    }}
                    onInstallWorkspaceSkill={handleInstallWorkspaceSkill}
                    onCopyWorkspaceSkill={onCopyWorkspaceSkill}
                    onCreateWorkspaceFolder={onCreateWorkspaceFolder}
                    importedProjects={snapshot.importedProjects}
                    localInstallDir={snapshot.settings.installDir}
                    installDirTree={snapshot.installDirTree}
                    rootLabel="安装目录"
                    rootPath={snapshot.settings.installDir}
                  />
                ) : (
                  <div className="px-3 py-2 text-[12px] opacity-60 app-text-soft">
                    {!snapshot?.settings.installDir ? "未配置安装目录" : "安装目录为空"}
                  </div>
                )
              )}
            </div>
          </section>
        )}

        <div className={cn("mt-auto flex flex-col pt-4", sidebarCollapsed && "px-1")}>
          {navItems.filter(item => item.section === "settings").map((item) => {
            const Icon = item.icon;
            const active = item.section === section;
            return (
              <Link
                key={item.section}
                className={cn(
                  "app-sidebar-nav-item",
                  active && "app-sidebar-nav-item-active",
                  sidebarCollapsed && "justify-center px-0"
                )}
                href={item.href}
                title={sidebarCollapsed ? navLabel(item.section, t) : undefined}
              >
                <span className={cn("flex min-w-0 items-center gap-3", sidebarCollapsed && "justify-center")}>
                  <span className={cn("app-sidebar-nav-icon", active && "app-sidebar-nav-icon-active", sidebarCollapsed && "h-10 w-10 rounded-[12px]")}>
                    <Icon className="h-4 w-4" />
                  </span>
                  {!sidebarCollapsed && <span className="truncate font-medium">{navLabel(item.section, t)}</span>}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
