/**
 * Log non-fatal caught errors in development (pointer capture, optional APIs, etc.).
 */
export function warnIfDev(scope, error) {
  if (process.env.NODE_ENV !== "development") return;
  console.warn(`[MapWeld:${scope}]`, error);
}
