/**
 * Persist the current drawing to sessionStorage so it survives page reloads
 * and navigation within the tab. Cleared when the browser tab is closed.
 */

const SESSION_DRAFT_KEY = "weld-dashboard-draft";

export function saveDraftToSession(data) {
  if (!data) return;
  const hasDrawingsWithPdf = Array.isArray(data.drawings)
    && data.drawings.some((dwg) => typeof dwg?.pdfBase64 === "string" && dwg.pdfBase64.length > 0);
  if (!hasDrawingsWithPdf && !data.pdfBase64) return;
  try {
    sessionStorage.setItem(SESSION_DRAFT_KEY, JSON.stringify(data));
  } catch (e) {
    // QuotaExceeded or private window
  }
}

export function loadDraftFromSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearDraftFromSession() {
  try {
    sessionStorage.removeItem(SESSION_DRAFT_KEY);
  } catch {
    /* ignore */
  }
}
