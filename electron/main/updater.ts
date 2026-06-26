import { ipcMain } from "electron";
import { autoUpdater } from "electron-updater";

import type { BrowserWindow } from "electron";

export function setupUpdater(mainWindow: BrowserWindow) {
  // We want to ask the user before downloading
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  // Forward events to the renderer
  autoUpdater.on("update-available", (info) => {
    mainWindow.webContents.send("updater:update-available", info);
  });

  autoUpdater.on("update-not-available", () => {
    mainWindow.webContents.send("updater:update-not-available");
  });

  autoUpdater.on("error", (err) => {
    mainWindow.webContents.send("updater:error", err == null ? "unknown" : (err.stack || err).toString());
  });

  autoUpdater.on("download-progress", (progressObj) => {
    mainWindow.webContents.send("updater:download-progress", progressObj);
  });

  autoUpdater.on("update-downloaded", () => {
    mainWindow.webContents.send("updater:update-downloaded");
  });

  // Handle commands from the renderer
  ipcMain.on("updater:check", () => {
    autoUpdater.checkForUpdates().catch(err => {
      mainWindow.webContents.send("updater:error", (err.stack || err).toString());
    });
  });

  ipcMain.on("updater:download", () => {
    autoUpdater.downloadUpdate().catch(err => {
      mainWindow.webContents.send("updater:error", (err.stack || err).toString());
    });
  });

  ipcMain.on("updater:install", () => {
    autoUpdater.quitAndInstall();
  });
}
