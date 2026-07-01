import fs from "node:fs";
import path from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import net from "node:net";

import { app } from "electron";

function isPortAvailable(port: number) {
  return new Promise<boolean>((resolve) => {
    const server = net.createServer();

    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });

    server.listen(port, "127.0.0.1");
  });
}

async function findAvailablePort(startPort: number) {
  let port = startPort;

  while (!(await isPortAvailable(port))) {
    port += 1;
  }

  return port;
}

function waitForServer(url: string, timeoutMs: number) {
  const start = Date.now();

  return new Promise<void>((resolve, reject) => {
    const attempt = () => {
      const request = fetch(url)
        .then((response) => {
          if (response.ok) {
            resolve();
            return;
          }

          if (Date.now() - start >= timeoutMs) {
            reject(new Error(`Timed out waiting for renderer server at ${url}`));
            return;
          }

          setTimeout(attempt, 250);
        })
        .catch(() => {
          if (Date.now() - start >= timeoutMs) {
            reject(new Error(`Timed out waiting for renderer server at ${url}`));
            return;
          }

          setTimeout(attempt, 250);
        });

      void request;
    };

    attempt();
  });
}

function resolveStandaloneRoot() {
  return app.isPackaged
    ? path.join(process.resourcesPath, "app.asar.unpacked", "build", "app")
    : path.join(app.getAppPath(), "build", "app");
}

export interface ProductionRendererHandle {
  child: ChildProcess;
  url: string;
}

export async function startProductionRenderer(): Promise<ProductionRendererHandle> {
  const standaloneRoot = resolveStandaloneRoot();
  const serverEntrypoint = path.join(standaloneRoot, "server.js");

  if (!fs.existsSync(serverEntrypoint)) {
    throw new Error(`Packaged renderer server is missing: ${serverEntrypoint}`);
  }

  const port = await findAvailablePort(3211);
  const host = "127.0.0.1";
  const url = `http://${host}:${port}`;
  const { utilityProcess } = require("electron");
  const child: any = utilityProcess.fork(serverEntrypoint, [], {
    cwd: standaloneRoot,
    stdio: "pipe",
    env: {
      ...process.env,
      NODE_ENV: "production",
      HOSTNAME: host,
      PORT: String(port)
    }
  });

  child.stdout?.on("data", (d: any) => console.log("CHILD STDOUT", d.toString()));
  child.stderr?.on("data", (d: any) => console.error("CHILD STDERR", d.toString()));
  child.on("exit", (code: any) => console.log("CHILD EXITED WITH", code));

  await waitForServer(url, 20_000);

  return {
    child,
    url
  };
}
