const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const nextRoot = path.join(projectRoot, ".next");
const standaloneRoot = path.join(nextRoot, "standalone");
const standaloneServer = path.join(standaloneRoot, "server.js");
const staticRoot = path.join(nextRoot, "static");
const releaseAppRoot = path.join(projectRoot, "build", "app");
const releaseStaticRoot = path.join(releaseAppRoot, ".next", "static");
const releasePublicRoot = path.join(releaseAppRoot, "public");
const projectPublicRoot = path.join(projectRoot, "public");

function fail(message) {
  process.stderr.write(`[prepare-release] ${message}\n`);
  process.exit(1);
}

function log(message) {
  process.stdout.write(`[prepare-release] ${message}\n`);
}

function ensureExists(targetPath, description) {
  if (!fs.existsSync(targetPath)) {
    fail(`Missing ${description}: ${targetPath}`);
  }
}

function resetReleaseAppRoot() {
  fs.rmSync(releaseAppRoot, { recursive: true, force: true });
  fs.mkdirSync(releaseAppRoot, { recursive: true });
}

function copyDirectory(source, destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, { recursive: true, force: true });
}

function main() {
  ensureExists(standaloneServer, "Next standalone server output");
  ensureExists(staticRoot, "Next static asset output");

  resetReleaseAppRoot();

  log("Copying Next standalone server bundle.");
  copyDirectory(standaloneRoot, releaseAppRoot);

  log("Copying Next static assets.");
  copyDirectory(staticRoot, releaseStaticRoot);

  if (fs.existsSync(projectPublicRoot)) {
    log("Copying public assets.");
    copyDirectory(projectPublicRoot, releasePublicRoot);
  }

  log(`Release app bundle prepared at ${releaseAppRoot}`);
}

main();
