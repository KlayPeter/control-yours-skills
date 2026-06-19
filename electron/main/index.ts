import path from "node:path";

import { app, BrowserWindow } from "electron";

import { registerIpcHandlers } from "./ipc";
import { SkillManagerBackend } from "./skill-manager-backend";

const RENDERER_URL = "http://127.0.0.1:3000";

function createWindow() {
  const window = new BrowserWindow({
    width: 1560,
    height: 980,
    minWidth: 1180,
    minHeight: 760,
    backgroundColor: "#09111f",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  void window.loadURL(RENDERER_URL);

  if (process.env.NODE_ENV !== "production") {
    window.webContents.openDevTools({ mode: "detach" });
  }
}

async function bootstrap() {
  await app.whenReady();

  const backend = new SkillManagerBackend(app.getPath("userData"));
  registerIpcHandlers(backend);
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

void bootstrap();
