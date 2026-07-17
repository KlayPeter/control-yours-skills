import path from "node:path";
import os from "node:os";

export interface RuntimePaths {
  appRoot: string;
  dataRoot: string;
  databasePath: string;
  installRoot: string;
  tempRoot: string;
  cacheRoot: string;
  logsRoot: string;
  snapshotsRoot: string;
  isDevelopment: boolean;
  homeDir: string;
}

import { app } from "electron";

export function resolveRuntimePaths(userDataPath: string): RuntimePaths {
  const isDevelopment = !app.isPackaged;
  const appRoot = !isDevelopment ? process.resourcesPath : process.cwd();
  const dataRoot = isDevelopment ? path.join(appRoot, "data") : userDataPath;

  return {
    appRoot,
    dataRoot,
    databasePath: path.join(dataRoot, "app.db"),
    installRoot: path.join(dataRoot, "installed-skills"),
    tempRoot: path.join(dataRoot, "temp"),
    cacheRoot: path.join(dataRoot, "cache"),
    logsRoot: path.join(dataRoot, "logs"),
    snapshotsRoot: path.join(dataRoot, "snapshots"),
    isDevelopment,
    homeDir: os.homedir()
  };
}
