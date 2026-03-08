/**
 * Apply NDT report results to weld points.
 * Updates ndtResults[method] and ndtResultOutcome[method] for each weld in the report.
 * Clears ndtResultManualOverride[method] so these results are from report, not manual.
 */
export function applyReportToWelds(report, weldPoints) {
  if (!report?.method || !Array.isArray(report.weldResults) || !Array.isArray(weldPoints))
    return weldPoints;
  const byId = new Map(report.weldResults.map((r) => [r.weldId, r.result]));
  return weldPoints.map((w) => {
    const result = byId.get(w.id);
    if (result == null) return w;
    const manualOverride = { ...(w.ndtResultManualOverride || {}) };
    delete manualOverride[report.method];
    return {
      ...w,
      ndtResults: { ...(w.ndtResults || {}), [report.method]: "ok" },
      ndtResultOutcome: { ...(w.ndtResultOutcome || {}), [report.method]: result },
      ndtResultManualOverride: Object.keys(manualOverride).length ? manualOverride : undefined,
    };
  });
}

/**
 * Remove from welds the NDT results that came from the given report.
 * Skips welds where the result was manually overridden (ndtResultManualOverride[method]).
 */
export function clearReportResultsFromWelds(report, weldPoints) {
  if (!report?.method || !Array.isArray(report.weldResults) || !Array.isArray(weldPoints))
    return weldPoints;
  const weldIdsInReport = new Set(report.weldResults.map((r) => r.weldId));
  const method = report.method;
  return weldPoints.map((w) => {
    if (!weldIdsInReport.has(w.id)) return w;
    if (w.ndtResultManualOverride?.[method]) return w;
    const ndtResults = { ...(w.ndtResults || {}) };
    const ndtResultOutcome = { ...(w.ndtResultOutcome || {}) };
    delete ndtResults[method];
    delete ndtResultOutcome[method];
    return {
      ...w,
      ndtResults: Object.keys(ndtResults).length ? ndtResults : undefined,
      ndtResultOutcome: Object.keys(ndtResultOutcome).length ? ndtResultOutcome : undefined,
    };
  });
}

const NDT_REQUEST_TITLE_PREFIX = "NDT Request - ";

/**
 * Next display name for an NDT request of the given method.
 * Format: "NDT Request - RT - 001". Sequence is per method (RT-001, RT-002, MPI-001, ...).
 */
export function getNextNdtRequestDisplayName(ndtRequests, method) {
  const m = method || "NDT";
  const prefix = `${NDT_REQUEST_TITLE_PREFIX}${m} - `;
  let maxNum = 0;
  (ndtRequests || []).forEach((req) => {
    const title = req.title || "";
    if (title.startsWith(prefix)) {
      const numStr = title.slice(prefix.length).replace(/^\s+|\s+$/g, "");
      const num = parseInt(numStr, 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  });
  const nextNum = maxNum + 1;
  return `${prefix}${String(nextNum).padStart(3, "0")}`;
}

/**
 * True if the weld is already in an NDT request for the given method (planned).
 */
export function isWeldInNdtRequestForMethod(weldId, method, ndtRequests) {
  return (ndtRequests || []).some(
    (req) => req.method === method && (req.weldIds || []).includes(weldId)
  );
}
