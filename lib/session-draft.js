/**
 * Persist the current drawing to sessionStorage so it survives page reloads
 * and navigation within the tab. Cleared when the browser tab is closed.
 */

const SESSION_DRAFT_KEY = "weld-dashboard-draft";

/**
 * @returns {{ ok: true, skipped?: boolean } | { ok: false, reason: 'quota' | 'blocked' | 'unknown', message?: string }}
 */
export function saveDraftToSession(data) {
  if (!data) return { ok: true, skipped: true };
  const hasDrawingsWithPdf =
    Array.isArray(data.drawings)
    && data.drawings.some((dwg) => typeof dwg?.pdfBase64 === "string" && dwg.pdfBase64.length > 0);
  if (!hasDrawingsWithPdf && !data.pdfBase64) return { ok: true, skipped: true };
  try {
    sessionStorage.setItem(SESSION_DRAFT_KEY, JSON.stringify(data));
    return { ok: true };
  } catch (e) {
    const name = e?.name || "";
    if (name === "QuotaExceededError" || name === "NS_ERROR_DOM_QUOTA_REACHED") {
      return { ok: false, reason: "quota", message: e?.message };
    }
    if (name === "SecurityError") {
      return { ok: false, reason: "blocked", message: e?.message };
    }
    return { ok: false, reason: "unknown", message: e?.message || String(e) };
  }
}

export function loadDraftFromSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[MapWeld:loadDraftFromSession]", e);
    return null;
  }
}

export function clearDraftFromSession() {
  try {
    sessionStorage.removeItem(SESSION_DRAFT_KEY);
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[MapWeld:clearDraftFromSession]", e);
  }
}
