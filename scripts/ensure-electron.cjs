const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const projectRoot = path.resolve(__dirname, "..");
const electronRoot = path.join(projectRoot, "node_modules", "electron");
const electronInstallScript = path.join(electronRoot, "install.js");
const electronPackageJson = path.join(electronRoot, "package.json");
const electronPathFile = path.join(electronRoot, "path.txt");
const electronDistDir = path.join(electronRoot, "dist");
const electronVersionFile = path.join(electronDistDir, "version");
const electronCacheDir = path.join(projectRoot, ".electron-cache");
const betterSqliteBinding = path.join(
  projectRoot,
  "node_modules",
  "better-sqlite3",
  "build",
  "Release",
  "better_sqlite3.node"
);
const tempDir = path.join(projectRoot, ".tmp");

function log(message) {
  process.stdout.write(`[ensure-electron] ${message}\n`);
}

function fail(message) {
  process.stderr.write(`[ensure-electron] ${message}\n`);
  process.exit(1);
}

function isElectronInstalled() {
  return fs.existsSync(electronPathFile) && fs.existsSync(electronVersionFile);
}

function runCommand(command, args, extraEnv, failureMessage) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      TEMP: tempDir,
      TMP: tempDir,
      ...extraEnv
    }
  });

  if (result.status !== 0) {
    fail(failureMessage);
  }
}

if (!fs.existsSync(electronInstallScript)) {
  fail("Missing node_modules/electron/install.js. Run npm install first.");
}

fs.mkdirSync(electronCacheDir, { recursive: true });
fs.mkdirSync(tempDir, { recursive: true });

if (isElectronInstalled()) {
  log("Electron binary already installed.");
} else {
  log(`Electron binary missing. Installing with cache at ${electronCacheDir}`);
  runCommand(
    process.execPath,
    [electronInstallScript],
    {
      ELECTRON_CACHE: electronCacheDir,
      electron_config_cache: electronCacheDir
    },
    "Electron binary installation failed."
  );
}

if (!isElectronInstalled()) {
  fail("Electron installer finished but the binary is still missing.");
}

if (!fs.existsSync(betterSqliteBinding)) {
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  const electronVersion = JSON.parse(fs.readFileSync(electronPackageJson, "utf8")).version;

  log("better-sqlite3 native binding missing. Rebuilding it for Electron.");
  runCommand(
    npmCommand,
    ["rebuild", "better-sqlite3"],
    {
      ELECTRON_CACHE: electronCacheDir,
      electron_config_cache: electronCacheDir,
      npm_config_runtime: "electron",
      npm_config_target: electronVersion,
      npm_config_disturl: "https://electronjs.org/headers"
    },
    "better-sqlite3 rebuild failed."
  );
}

if (!fs.existsSync(betterSqliteBinding)) {
  fail("better-sqlite3 rebuild finished but the native binding is still missing.");
}

log("Electron binary is ready.");
