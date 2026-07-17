import { describe, expect, it } from "vitest";

import { isTrustedRendererUrl } from "./ipc-security";

describe("isTrustedRendererUrl", () => {
  it("accepts pages from the configured renderer origin", () => {
    expect(isTrustedRendererUrl("http://127.0.0.1:3211/settings", "http://127.0.0.1:3211")).toBe(true);
  });

  it("rejects external and malformed sender URLs", () => {
    expect(isTrustedRendererUrl("https://example.com", "http://127.0.0.1:3211")).toBe(false);
    expect(isTrustedRendererUrl("not a url", "http://127.0.0.1:3211")).toBe(false);
  });
});
