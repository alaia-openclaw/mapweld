import { NDT_METHODS, NDT_OVERRIDE_OPTIONS } from "./constants";

/**
 * Section completion for a weld (from stored weld object).
 * ndtSelection = { [method]: boolean } for this weld (from computeNdtSelection).
 */
export function getWeldSectionCompletion(weld, ndtSelection = {}) {
  const general =
    (weld.wps ?? "").trim() !== "";
  const fitup =
    (weld.fitterName ?? "").trim() !== "" &&
    (weld.dateFitUp ?? "").trim() !== "" &&
    ((weld.heatNumber1 ?? "").trim() !== "" || (weld.heatNumber2 ?? "").trim() !== "");
  const records = weld.weldingRecords || [];
  const welding =
    records.length > 0 &&
    records.every(
      (r) =>
        (((r.welderIds || []).length > 0 || (r.welderName ?? "").trim() !== "" || (r.weldingProcesses || []).length > 0)) &&
        (r.date ?? "").trim() !== ""
    );
  const overrides = weld.ndtOverrides || {};
  const results = weld.ndtResults || {};
  const inspection = NDT_METHODS.every((m) => {
    const needDone =
      overrides[m] === NDT_OVERRIDE_OPTIONS.REQUIRED ||
      (overrides[m] !== NDT_OVERRIDE_OPTIONS.EXEMPT && ndtSelection[m]);
    return !needDone || !!results[m];
  });
  return { general, fitup, welding, inspection };
}

/**
 * Overall status for display (map outline, etc.).
 * "complete" = all sections complete, "incomplete" = some data but not all, "not_started" = minimal data.
 */
export function getWeldOverallStatus(weld, ndtSelection = {}) {
  const s = getWeldSectionCompletion(weld, ndtSelection);
  const allComplete = s.general && s.fitup && s.welding && s.inspection;
  if (allComplete) return "complete";
  const anyStarted =
    (weld.wps ?? "").trim() !== "" ||
    (weld.fitterName ?? "").trim() !== "" ||
    (weld.dateFitUp ?? "").trim() !== "" ||
    (weld.heatNumber1 ?? "").trim() !== "" ||
    (weld.heatNumber2 ?? "").trim() !== "" ||
    ((weld.weldingRecords || []).length > 0) ||
    Object.keys(weld.ndtOverrides || {}).length > 0 ||
    Object.keys(weld.ndtResults || {}).length > 0;
  return anyStarted ? "incomplete" : "not_started";
}

/**
 * Compute weld display name (SW1, FW2, etc.).
 * Uses stable weldNumber when present; otherwise falls back to position-based order.
 */
export function getWeldName(weld, weldPoints = []) {
  if (!weld) return weld?.id ?? "";

  const prefix = weld.weldLocation === "field" ? "FW" : "SW";

  if (weld.weldNumber != null) {
    return `${prefix}${weld.weldNumber}`;
  }

  if (!weldPoints.length) return weld.id ?? "";

  const isField = weld.weldLocation === "field";
  const sameType = weldPoints
    .filter((w) => (w.weldLocation === "field") === isField)
    .sort((a, b) => {
      const pa = a.pageNumber ?? 0;
      const pb = b.pageNumber ?? 0;
      if (pa !== pb) return pa - pb;
      const ya = a.yPercent ?? 0;
      const yb = b.yPercent ?? 0;
      if (ya !== yb) return ya - yb;
      const xa = a.xPercent ?? 0;
      const xb = b.xPercent ?? 0;
      if (xa !== xb) return xa - xb;
      return (a.id ?? "").localeCompare(b.id ?? "");
    });

  const idx = sameType.findIndex((w) => w.id === weld.id);
  return idx >= 0 ? `${prefix}${idx + 1}` : weld.id ?? "";
}

/**
 * Compute which NDT methods are required for a weld.
 * Returns { [method]: boolean } - true if that method is required.
 */
export function computeNdtSelection(weld, drawingSettings = {}) {
  const overrides = weld.ndtOverrides || {};
  const ndtRequirements = drawingSettings.ndtRequirements || [];
  const ndtRequired = weld.ndtRequired || "auto";
  const visualInspection = !!weld.visualInspection;

  if (ndtRequired === "no") return { VT: false, MPI: false, RT: false, UT: false };

  const fromDrawing = {};
  ndtRequirements.forEach((r) => { fromDrawing[r.method] = true; });
  if (visualInspection) fromDrawing.VT = true;

  const selection = { VT: false, MPI: false, RT: false, UT: false };
  NDT_METHODS.forEach((m) => {
    if (overrides[m] === NDT_OVERRIDE_OPTIONS.EXEMPT) selection[m] = false;
    else if (overrides[m] === NDT_OVERRIDE_OPTIONS.REQUIRED) selection[m] = true;
    else if (ndtRequired === "yes" || ndtRequired === "auto") selection[m] = !!fromDrawing[m];
  });
  return selection;
}
