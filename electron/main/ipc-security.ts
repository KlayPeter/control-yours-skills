export function isTrustedRendererUrl(senderUrl: string, rendererUrl: string) {
  try {
    return new URL(senderUrl).origin === new URL(rendererUrl).origin;
  } catch {
    return false;
  }
}
