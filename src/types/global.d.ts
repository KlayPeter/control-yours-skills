import type { SkillManagerApi, AppUpdaterApi } from "@shared/contracts";

declare global {
  interface File {
    path?: string;
  }

  interface Window {
    skillManager?: SkillManagerApi;
    appUpdater?: AppUpdaterApi;
  }
}

export {};
