import { describe, expect, it } from "vitest";

import {
  normalizeProgressInfo,
  normalizeUpdateInfo,
  supportsAppUpdates,
  updaterErrorMessage
} from "./app-update";

describe("supportsAppUpdates", () => {
  it("only enables packaged Windows and macOS applications", () => {
    expect(supportsAppUpdates(true, "darwin")).toBe(true);
    expect(supportsAppUpdates(true, "win32")).toBe(true);
    expect(supportsAppUpdates(true, "linux")).toBe(false);
    expect(supportsAppUpdates(false, "darwin")).toBe(false);
    expect(supportsAppUpdates(true, "darwin", false)).toBe(false);
  });
});

describe("normalizeUpdateInfo", () => {
  it("only exposes the version and release date strings", () => {
    expect(
      normalizeUpdateInfo({
        version: "2.4.1",
        releaseDate: "2026-07-27T00:00:00.000Z",
        releaseNotes: { unexpected: true }
      })
    ).toEqual({
      version: "2.4.1",
      releaseDate: "2026-07-27T00:00:00.000Z"
    });
  });
});

describe("normalizeProgressInfo", () => {
  it("clamps invalid progress values", () => {
    expect(
      normalizeProgressInfo({
        total: 100,
        delta: -1,
        transferred: Number.NaN,
        percent: 140,
        bytesPerSecond: 20
      })
    ).toEqual({
      total: 100,
      delta: 0,
      transferred: 0,
      percent: 100,
      bytesPerSecond: 20
    });
  });
});

describe("updaterErrorMessage", () => {
  it("returns a safe message without forwarding stack traces", () => {
    const error = new Error("Download failed");
    error.stack = "sensitive stack";

    expect(updaterErrorMessage(error)).toBe("Download failed");
    expect(updaterErrorMessage({ message: "Invalid metadata" })).toBe("Invalid metadata");
    expect(updaterErrorMessage(null)).toBe("Unknown software update error.");
  });
});
