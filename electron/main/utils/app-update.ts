import type { ProgressInfo, UpdateInfo } from "@shared/contracts";

export function supportsAppUpdates(
  isPackaged: boolean,
  platform: NodeJS.Platform,
  macSignatureValid = true
) {
  return (
    isPackaged &&
    (platform === "win32" || (platform === "darwin" && macSignatureValid))
  );
}

export function normalizeUpdateInfo(info: unknown): UpdateInfo {
  const record =
    typeof info === "object" && info !== null ? (info as Record<string, unknown>) : {};

  return {
    version: typeof record.version === "string" ? record.version : "",
    releaseDate: typeof record.releaseDate === "string" ? record.releaseDate : ""
  };
}

function finiteNonNegative(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function normalizeProgressInfo(info: unknown): ProgressInfo {
  const record =
    typeof info === "object" && info !== null ? (info as Record<string, unknown>) : {};

  return {
    total: finiteNonNegative(record.total),
    delta: finiteNonNegative(record.delta),
    transferred: finiteNonNegative(record.transferred),
    percent: Math.min(100, finiteNonNegative(record.percent)),
    bytesPerSecond: finiteNonNegative(record.bytesPerSecond)
  };
}

export function updaterErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.trim()
  ) {
    return error.message;
  }

  return "Unknown software update error.";
}
