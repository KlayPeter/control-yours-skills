import path from "node:path";

export interface RuntimePaths {
  appRoot: string;
  dataRoot: string;
  databasePath: string;
  installRoot: string;
  tempRoot: string;
  cacheRoot: string;
  logsRoot: string;
  isDevelopment: boolean;
}

export function resolveRuntimePaths(userDataPath: string): RuntimePaths {
  const appRoot = process.cwd();
  const isDevelopment = process.env.NODE_ENV !== "production";
  const dataRoot = isDevelopment ? path.join(appRoot, "data") : userDataPath;

  return {
    appRoot,
    dataRoot,
    databasePath: path.join(dataRoot, "app.db"),
    installRoot: path.join(dataRoot, "installed-skills"),
    tempRoot: path.join(dataRoot, "temp"),
    cacheRoot: path.join(dataRoot, "cache"),
    logsRoot: path.join(dataRoot, "logs"),
    isDevelopment
  };
}
