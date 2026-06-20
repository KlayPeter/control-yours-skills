import { execFile } from "node:child_process";
import os from "node:os";
import { promisify } from "node:util";

import type { DetectedTool, EnvironmentInfo } from "@shared/contracts";

const execFileAsync = promisify(execFile);
const KNOWN_TOOLS = ["git", "node", "npm", "pnpm", "yarn", "python", "py", "uv", "pip", "curl", "tar", "gh"];

async function detectTool(name: string): Promise<DetectedTool> {
  const command = process.platform === "win32" ? "where.exe" : "which";

  try {
    const { stdout } = await execFileAsync(command, [name], { windowsHide: true });
    const firstLine = stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean);

    return {
      name,
      available: Boolean(firstLine),
      command: firstLine || null
    };
  } catch {
    return {
      name,
      available: false,
      command: null
    };
  }
}

export async function detectEnvironment(): Promise<EnvironmentInfo> {
  const tools = await Promise.all(KNOWN_TOOLS.map((tool) => detectTool(tool)));

  return {
    os: process.platform,
    arch: os.arch(),
    shell: process.platform === "win32" ? "powershell" : process.env.SHELL || "unknown",
    tools
  };
}

export function hasRequiredTools(environment: EnvironmentInfo, tools: string[]) {
  return tools.every((tool) => environment.tools.some((entry) => entry.name === tool && entry.available));
}
