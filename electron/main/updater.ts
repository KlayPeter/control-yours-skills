import { app, ipcMain } from "electron";
import { autoUpdater } from "electron-updater";

import type { BrowserWindow } from "electron";
import {
  normalizeProgressInfo,
  normalizeUpdateInfo,
  supportsAppUpdates,
  updaterErrorMessage
} from "./utils/app-update";

const AUTO_CHECK_DELAY_MS = 10_000;

let activeWindow: BrowserWindow | null = null;
let initialized = false;
let checkInFlight: Promise<unknown> | null = null;
let notifyRendererOnError = false;

function isSupported() {
  return supportsAppUpdates(app.isPackaged, process.platform);
}

function sendToRenderer(channel: string, ...args: unknown[]) {
  if (!activeWindow || activeWindow.isDestroyed() || activeWindow.webContents.isDestroyed()) {
    return;
  }

  activeWindow.webContents.send(channel, ...args);
}

function reportError(error: unknown) {
  const message = updaterErrorMessage(error);
  console.error(`[updater] ${message}`);

  if (notifyRendererOnError) {
    sendToRenderer("updater:error", message);
  }

  notifyRendererOnError = false;
}

function ensureSupported() {
  if (isSupported()) {
    return true;
  }

  if (notifyRendererOnError) {
    sendToRenderer(
      "updater:error",
      "Software updates are only available in packaged Windows and macOS builds."
    );
  }
  notifyRendererOnError = false;
  return false;
}

function checkForUpdates(notifyOnError: boolean) {
  notifyRendererOnError ||= notifyOnError;

  if (!ensureSupported() || checkInFlight) {
    return;
  }

  checkInFlight = autoUpdater
    .checkForUpdates()
    .catch(reportError)
    .finally(() => {
      checkInFlight = null;
    });
}

export function setupUpdater(mainWindow: BrowserWindow) {
  activeWindow = mainWindow;
  mainWindow.once("closed", () => {
    if (activeWindow === mainWindow) {
      activeWindow = null;
    }
  });

  if (initialized) {
    return;
  }
  initialized = true;

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("update-available", (info) => {
    notifyRendererOnError = false;
    sendToRenderer("updater:update-available", normalizeUpdateInfo(info));
  });

  autoUpdater.on("update-not-available", () => {
    notifyRendererOnError = false;
    sendToRenderer("updater:update-not-available");
  });

  autoUpdater.on("error", reportError);

  autoUpdater.on("download-progress", (progress) => {
    sendToRenderer("updater:download-progress", normalizeProgressInfo(progress));
  });

  autoUpdater.on("update-downloaded", () => {
    notifyRendererOnError = false;
    sendToRenderer("updater:update-downloaded");
  });

  ipcMain.handle("updater:get-runtime-info", () => ({
    currentVersion: app.getVersion(),
    supported: isSupported(),
    autoCheckEnabled: isSupported()
  }));

  ipcMain.on("updater:check", () => {
    checkForUpdates(true);
  });

  ipcMain.on("updater:download", () => {
    notifyRendererOnError = true;
    if (!ensureSupported()) {
      return;
    }
    void autoUpdater.downloadUpdate().catch(reportError);
  });

  ipcMain.on("updater:install", () => {
    notifyRendererOnError = true;
    if (!ensureSupported()) {
      return;
    }

    try {
      autoUpdater.quitAndInstall();
    } catch (error) {
      reportError(error);
    }
  });

  if (isSupported()) {
    const timer = setTimeout(() => checkForUpdates(false), AUTO_CHECK_DELAY_MS);
    timer.unref();
  }
}
