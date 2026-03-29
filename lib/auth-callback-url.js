/**
 * NextAuth open redirect protection: only allow same-site relative paths.
 * @param {string | undefined} raw
 * @param {string} [fallback]
 */
export function safeAuthCallbackUrl(raw, fallback = "/app") {
  if (typeof raw !== "string" || raw.length === 0) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//")) return fallback;
  if (raw.includes("\\") || raw.includes("\0")) return fallback;
  return raw;
}
