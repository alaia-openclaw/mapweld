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
 * True if weld has fitter and welder info filled (ready to send for NDT).
 */
export function isWeldReadyForNdt(weld) {
  const s = getWeldSectionCompletion(weld, {});
  return s.fitup && s.welding;
}

/**
 * True if weld has any NDT outcome that indicates reject or repair (repair needed following a reject).
 */
export function isWeldRepairNeeded(weld) {
  const outcomes = weld.ndtResultOutcome || {};
  return Object.values(outcomes).some(
    (v) => v === "rejected" || v === "reject" || v === "repair"
  );
}

/**
 * True if weld already has an accepted result for the given NDT method.
 */
export function isWeldAlreadyAcceptedForMethod(weld, method) {
  const outcomes = weld.ndtResultOutcome || {};
  return outcomes[method] === "accepted";
}

/**
 * Get the required percentage for an NDT method from drawing settings (default 100).
 */
function getPctForMethod(ndtRequirements, method) {
  const req = (ndtRequirements || []).find((r) => r.method === method);
  return req && req.pct != null ? Math.min(100, Math.max(0, Number(req.pct))) : 100;
}

/**
 * Build fromDrawing map for a weld (drawing requirements + weld visualInspection for VT).
 */
function fromDrawingForWeld(ndtRequirements, weld) {
  const fromDrawing = {};
  (ndtRequirements || []).forEach((r) => { fromDrawing[r.method] = true; });
  if (!!(weld && weld.visualInspection)) fromDrawing.VT = true;
  return fromDrawing;
}

/**
 * Check if a weld is eligible for a given NDT method (before applying percentage).
 */
function isEligibleForMethod(weld, method, fromDrawing, overrides, ndtRequired) {
  if (ndtRequired === "no") return false;
  if (overrides[method] === NDT_OVERRIDE_OPTIONS.EXEMPT) return false;
  if (overrides[method] === NDT_OVERRIDE_OPTIONS.REQUIRED) return true;
  if (ndtRequired === "yes" || ndtRequired === "auto") return !!fromDrawing[method];
  return false;
}

/**
 * Stable sort key for welds (matches getWeldName order: page, y, x, id).
 */
function weldSortKey(w) {
  return [
    w.pageNumber ?? 0,
    w.yPercent ?? 0,
    w.xPercent ?? 0,
    w.id ?? "",
  ].join("\t");
}

/**
 * Get the set of weld IDs selected for an NDT method when using percentage.
 * Applies: (1) split by shop/field with minimum pct each, (2) prioritize ready welds,
 * (3) already-accepted welds count toward the quota so remaining need is recomputed.
 */
export function getSelectedWeldIdsForNdtMethod(weldPoints, drawingSettings, method) {
  const ndtRequirements = drawingSettings.ndtRequirements || [];
  const pct = getPctForMethod(ndtRequirements, method);
  if (pct >= 100) return null;

  const eligible = weldPoints.filter((w) => {
    const overrides = w.ndtOverrides || {};
    const ndtRequired = w.ndtRequired || "auto";
    const fromD = fromDrawingForWeld(ndtRequirements, w);
    return isEligibleForMethod(w, method, fromD, overrides, ndtRequired);
  });

  const shop = eligible.filter((w) => (w.weldLocation || "shop") !== "field");
  const field = eligible.filter((w) => w.weldLocation === "field");

  const pick = (list, n) => {
    const sorted = [...list].sort((a, b) => {
      const aReady = isWeldReadyForNdt(a) ? 1 : 0;
      const bReady = isWeldReadyForNdt(b) ? 1 : 0;
      if (bReady !== aReady) return bReady - aReady;
      return weldSortKey(a).localeCompare(weldSortKey(b));
    });
    return sorted.slice(0, n).map((w) => w.id);
  };

  const targetShop = Math.ceil((shop.length * pct) / 100);
  const targetField = Math.ceil((field.length * pct) / 100);
  const shopAccepted = shop.filter((w) => isWeldAlreadyAcceptedForMethod(w, method));
  const fieldAccepted = field.filter((w) => isWeldAlreadyAcceptedForMethod(w, method));
  const remainingShop = Math.max(0, targetShop - shopAccepted.length);
  const remainingField = Math.max(0, targetField - fieldAccepted.length);
  const shopNotAccepted = shop.filter((w) => !isWeldAlreadyAcceptedForMethod(w, method));
  const fieldNotAccepted = field.filter((w) => !isWeldAlreadyAcceptedForMethod(w, method));

  const selectedIds = new Set([
    ...shopAccepted.map((w) => w.id),
    ...pick(shopNotAccepted, remainingShop),
    ...fieldAccepted.map((w) => w.id),
    ...pick(fieldNotAccepted, remainingField),
  ]);
  return selectedIds;
}

/**
 * Optional warnings when NDT selection cannot meet ideal criteria (e.g. shop/field split,
 * ready-first). Selection still meets the minimum %; this is for informational display.
 */
export function getNdtSelectionWarnings(weldPoints, drawingSettings, method) {
  const ndtRequirements = drawingSettings.ndtRequirements || [];
  const pct = getPctForMethod(ndtRequirements, method);
  if (pct >= 100) return [];

  const eligible = weldPoints.filter((w) => {
    const overrides = w.ndtOverrides || {};
    const ndtRequired = w.ndtRequired || "auto";
    const fromD = fromDrawingForWeld(ndtRequirements, w);
    return isEligibleForMethod(w, method, fromD, overrides, ndtRequired);
  });
  const shop = eligible.filter((w) => (w.weldLocation || "shop") !== "field");
  const field = eligible.filter((w) => w.weldLocation === "field");
  const targetShop = Math.ceil((shop.length * pct) / 100);
  const targetField = Math.ceil((field.length * pct) / 100);
  const shopAccepted = shop.filter((w) => isWeldAlreadyAcceptedForMethod(w, method));
  const fieldAccepted = field.filter((w) => isWeldAlreadyAcceptedForMethod(w, method));
  const warnings = [];
  if (shopAccepted.length > targetShop) {
    warnings.push(`${method}: shop welds already accepted (${shopAccepted.length}) exceed ${pct}% target (${targetShop}).`);
  }
  if (fieldAccepted.length > targetField) {
    warnings.push(`${method}: field welds already accepted (${fieldAccepted.length}) exceed ${pct}% target (${targetField}).`);
  }
  const selectedIds = getSelectedWeldIdsForNdtMethod(weldPoints, drawingSettings, method);
  if (selectedIds) {
    const selectedWelds = weldPoints.filter((w) => selectedIds.has(w.id));
    const notReady = selectedWelds.filter((w) => !isWeldReadyForNdt(w));
    if (notReady.length > 0) {
      warnings.push(`${method}: ${notReady.length} selected weld(s) not yet ready (fitter/welder missing).`);
    }
  }
  return warnings;
}

/**
 * Compute which NDT methods are required for a weld.
 * Returns { [method]: boolean } - true if that method is required.
 * When weldPoints is provided and a requirement has pct < 100, selection is based on
 * percentage with shop/field split and prioritization of ready welds.
 */
export function computeNdtSelection(weld, drawingSettings = {}, weldPoints = []) {
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
    if (overrides[m] === NDT_OVERRIDE_OPTIONS.EXEMPT) {
      selection[m] = false;
      return;
    }
    if (overrides[m] === NDT_OVERRIDE_OPTIONS.REQUIRED) {
      selection[m] = true;
      return;
    }
    if (ndtRequired !== "yes" && ndtRequired !== "auto") return;
    if (!fromDrawing[m]) return;

    const pct = getPctForMethod(ndtRequirements, m);
    if (pct >= 100) {
      selection[m] = true;
      return;
    }
    if (weldPoints.length > 0) {
      const selectedIds = getSelectedWeldIdsForNdtMethod(weldPoints, drawingSettings, m);
      selection[m] = selectedIds ? selectedIds.has(weld.id) : true;
    } else {
      selection[m] = true;
    }
  });
  return selection;
}
