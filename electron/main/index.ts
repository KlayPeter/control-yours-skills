import path from "node:path";

import { app, BrowserWindow } from "electron";

import { registerIpcHandlers } from "./ipc";
import { startProductionRenderer } from "./production-server";
import { SkillManagerBackend } from "./skill-manager-backend";
import { setupUpdater } from "./updater";

const isDevelopment = process.env.NODE_ENV !== "production";

function createWindow(rendererUrl: string) {
  const iconPath = path.join(app.getAppPath(), "build", "icon.png");

  const window = new BrowserWindow({
    width: 1560,
    height: 980,
    minWidth: 1180,
    minHeight: 760,
    backgroundColor: "#09111f",
    autoHideMenuBar: true,
    titleBarStyle: "hiddenInset",
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  void window.loadURL(rendererUrl);

  if (isDevelopment) {
    window.webContents.openDevTools({ mode: "detach" });
  }

  return window;
}

async function bootstrap() {
  await app.whenReady();

  const productionRenderer = isDevelopment ? null : await startProductionRenderer();
  const rendererUrl = isDevelopment
    ? process.env.ELECTRON_RENDERER_URL || "http://127.0.0.1:3211"
    : productionRenderer!.url;

  const backend = new SkillManagerBackend(app.getPath("userData"));
  registerIpcHandlers(backend);

  const iconPath = path.join(app.getAppPath(), "build", "icon.png");
  if (process.platform === "darwin") {
    app.dock?.setIcon(iconPath);
  }

  const mainWindow = createWindow(rendererUrl);

  // Setup updater
  setupUpdater(mainWindow);

  if (productionRenderer) {
    app.on("before-quit", () => {
      productionRenderer.child.kill();
    });
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const w = createWindow(rendererUrl);
      setupUpdater(w);
    }
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

void bootstrap();
