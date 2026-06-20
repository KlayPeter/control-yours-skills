const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const PORT = 3211;
const ALLOWED_PROCESS_NAMES = new Set(["node.exe", "electron.exe"]);
const PROJECT_ROOT = path.resolve(__dirname, "..");
const NEXT_DIR = path.join(PROJECT_ROOT, ".next");
const REQUIRED_SERVER_FILES = path.join(NEXT_DIR, "required-server-files.json");

function log(message) {
  process.stdout.write(`[prepare-dev] ${message}\n`);
}

function fail(message) {
  process.stderr.write(`[prepare-dev] ${message}\n`);
  process.exit(1);
}

function listListeningPids(port) {
  const output = execFileSync("netstat", ["-ano", "-p", "tcp"], {
    encoding: "utf8"
  });

  const pids = new Set();

  for (const rawLine of output.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || !line.includes("LISTENING") || !line.includes(`:${port}`)) {
      continue;
    }

    const columns = line.split(/\s+/);
    const pid = columns.at(-1);
    if (pid && /^\d+$/.test(pid)) {
      pids.add(pid);
    }
  }

  return [...pids];
}

function getProcessName(pid) {
  const output = execFileSync(
    "tasklist",
    ["/FI", `PID eq ${pid}`, "/FO", "CSV", "/NH"],
    {
      encoding: "utf8"
    }
  ).trim();

  if (!output || output.startsWith("INFO:")) {
    return null;
  }

  const [imageName] = output.split(",");
  return imageName.replace(/^"|"$/g, "").toLowerCase();
}

function stopProcess(pid) {
  execFileSync("taskkill", ["/PID", String(pid), "/T", "/F"], {
    stdio: "inherit"
  });
}

function resetIncompleteNextOutput() {
  if (!fs.existsSync(NEXT_DIR)) {
    return;
  }

  const hasServerArtifacts = fs.existsSync(path.join(NEXT_DIR, "server"));
  if (!hasServerArtifacts || fs.existsSync(REQUIRED_SERVER_FILES)) {
    return;
  }

  log("Detected an incomplete .next build output. Removing it so Next.js can rebuild cleanly.");
  fs.rmSync(NEXT_DIR, { recursive: true, force: true });
}

function main() {
  resetIncompleteNextOutput();

  const pids = listListeningPids(PORT);

  if (pids.length === 0) {
    log(`Port ${PORT} is available.`);
    return;
  }

  for (const pid of pids) {
    const processName = getProcessName(pid);

    if (!processName) {
      log(`Process ${pid} already exited while preparing port ${PORT}.`);
      continue;
    }

    if (!ALLOWED_PROCESS_NAMES.has(processName)) {
      fail(
        `Port ${PORT} is already in use by ${processName} (PID ${pid}). Stop that app or change the project port before running npm run dev.`
      );
    }

    log(`Stopping stale ${processName} process on port ${PORT} (PID ${pid}).`);
    stopProcess(pid);
  }

  log(`Port ${PORT} is ready for the Next.js dev server.`);
}

main();
