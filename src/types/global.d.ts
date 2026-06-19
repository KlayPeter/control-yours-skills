import type { SkillManagerApi } from "@shared/contracts";

declare global {
  interface File {
    path?: string;
  }

  interface Window {
    skillManager?: SkillManagerApi;
  }
}

export {};
