import { NDT_METHODS, NDT_OVERRIDE_OPTIONS, sortNdtMethods } from "./constants";
import { isWeldJointDimensionallyComplete, weldHasBothPartsLinked } from "./joint-dimensions";
import {
  getResolvedNdtRequirementsForWeld,
  getPctFromResolvedRequirements,
  weldIncludedInPctSample,
  getWeldLineId,
} from "./ndt-resolution";
import { getResolvedWpsCode } from "./wps-resolution";

export function getMethodListForWeld(weld, drawingSettings = {}, resolvedReqs = null) {
  const requirementMethods = (resolvedReqs ?? drawingSettings?.ndtRequirements ?? []).map((r) => r.method);
  const overrideMethods = Object.keys(weld?.ndtOverrides || {});
  const resultMethods = Object.keys(weld?.ndtResults || {});
  const outcomeMethods = Object.keys(weld?.ndtResultOutcome || {});
  return sortNdtMethods([
    ...NDT_METHODS,
    ...requirementMethods,
    ...overrideMethods,
    ...resultMethods,
    ...outcomeMethods,
  ]);
}

/**
 * Optional structure scope for WPS inheritance (same shape as NDT context).
 * @typedef {{ systems?: object[]; lines?: object[]; spools?: object[] }} WeldStructureScope
 */

/**
 * Section completion for a weld (from stored weld object).
 * ndtSelection = { [method]: boolean } for this weld (from computeNdtSelection).
 * When `structureScope` is provided with systems/lines/spools, WPS "general" uses weld → line → system resolution.
 */
export function getWeldSectionCompletion(weld, ndtSelection = {}, structureScope = null) {
  const sys = structureScope?.systems;
  const ln = structureScope?.lines;
  const sp = structureScope?.spools;
  const parts = Array.isArray(structureScope?.parts) ? structureScope.parts : [];
  const useInheritance =
    structureScope != null &&
    Array.isArray(sys) &&
    Array.isArray(ln) &&
    Array.isArray(sp);
  const wpsEffective = useInheritance
    ? getResolvedWpsCode(weld, sys, ln, sp, structureScope?.drawingSettings ?? {})
    : (weld.wps ?? "").trim();
  const general = wpsEffective !== "";
  const part1 = parts.find((p) => p?.id === weld?.partId1) ?? null;
  const part2 = parts.find((p) => p?.id === weld?.partId2) ?? null;
  const baseFitupFields =
    (weld.fitterName ?? "").trim() !== "" &&
    (weld.dateFitUp ?? "").trim() !== "" &&
    ((weld.heatNumber1 ?? "").trim() !== "" || (weld.heatNumber2 ?? "").trim() !== "");
  const jointComplete =
    weldHasBothPartsLinked(weld) && isWeldJointDimensionallyComplete(weld, part1, part2);
  const fitup = baseFitupFields && jointComplete;
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
  const outcomes = weld.ndtResultOutcome || {};
  const methods = sortNdtMethods([
    ...NDT_METHODS,
    ...Object.keys(ndtSelection || {}),
    ...Object.keys(overrides),
    ...Object.keys(results),
    ...Object.keys(weld?.ndtResultOutcome || {}),
  ]);
  const inspection = methods.every((m) => {
    const needDone =
      overrides[m] === NDT_OVERRIDE_OPTIONS.REQUIRED ||
      (overrides[m] !== NDT_OVERRIDE_OPTIONS.EXEMPT && ndtSelection[m]);
    if (!needDone) return true;
    if (!results[m]) return false;
    return outcomes[m] === "accepted";
  });
  return { general, fitup, welding, inspection };
}

/**
 * Overall status for display (map outline, etc.).
 * "complete" = all sections complete, "incomplete" = some data but not all, "not_started" = minimal data.
 */
export function getWeldOverallStatus(weld, ndtSelection = {}, structureScope = null) {
  const s = getWeldSectionCompletion(weld, ndtSelection, structureScope);
  const allComplete = s.general && s.fitup && s.welding && s.inspection;
  if (allComplete) return "complete";
  const sys = structureScope?.systems;
  const ln = structureScope?.lines;
  const sp = structureScope?.spools;
  const useInheritance =
    structureScope != null &&
    Array.isArray(sys) &&
    Array.isArray(ln) &&
    Array.isArray(sp);
  const wpsEffective = useInheritance
    ? getResolvedWpsCode(weld, sys, ln, sp, structureScope?.drawingSettings ?? {})
    : (weld.wps ?? "").trim();
  const jd = weld?.jointDimensions;
  const hasJointOverride =
    [jd?.side1?.nps, jd?.side1?.schedule, jd?.side2?.nps, jd?.side2?.schedule].some(
      (x) => String(x ?? "").trim() !== ""
    );
  const anyStarted =
    wpsEffective !== "" ||
    (weld.fitterName ?? "").trim() !== "" ||
    (weld.dateFitUp ?? "").trim() !== "" ||
    (weld.heatNumber1 ?? "").trim() !== "" ||
    (weld.heatNumber2 ?? "").trim() !== "" ||
    weld?.partId1 ||
    weld?.partId2 ||
    hasJointOverride ||
    ((weld.weldingRecords || []).length > 0) ||
    Object.keys(weld.ndtOverrides || {}).length > 0 ||
    Object.keys(weld.ndtResults || {}).length > 0;
  return anyStarted ? "incomplete" : "not_started";
}

/** 0–100: even split across general / fit-up / welding / inspection (see getWeldSectionCompletion). */
export function getWeldProgressPercent(weld, ndtSelection = {}, structureScope = null) {
  const s = getWeldSectionCompletion(weld, ndtSelection, structureScope);
  const done = [s.general, s.fitup, s.welding, s.inspection].filter(Boolean).length;
  return (done / 4) * 100;
}

/**
 * Assign `weldNumber` per drawing (shop vs field separately), ordered by page then y/x/id.
 * Mutates weld objects in place. New drawings restart at 1.
 */
export function assignWeldNumbersPerDrawing(weldPoints) {
  if (!Array.isArray(weldPoints)) return;
  const byDrawing = new Map();
  weldPoints.forEach((w) => {
    const key = w.drawingId ?? "__null__";
    if (!byDrawing.has(key)) byDrawing.set(key, []);
    byDrawing.get(key).push(w);
  });
  for (const group of byDrawing.values()) {
    const byType = { shop: [], field: [] };
    group.forEach((w) => {
      const loc = w.weldLocation === "field" ? "field" : "shop";
      byType[loc].push(w);
    });
    ["shop", "field"].forEach((locKey) => {
      byType[locKey]
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
        })
        .forEach((w, i) => {
          w.weldNumber = i + 1;
        });
    });
  }
}

/**
 * Compute weld display name (SW1, FW2, etc.).
 * Uses stable weldNumber when present; otherwise falls back to position-based order within the same drawing.
 */
export function getWeldName(weld, weldPoints = []) {
  if (!weld) return weld?.id ?? "";

  const prefix = weld.weldLocation === "field" ? "FW" : "SW";

  if (weld.weldNumber != null) {
    return `${prefix}${weld.weldNumber}`;
  }

  const drawingKey = weld.drawingId ?? null;
  const peers = weldPoints.filter((w) => (w.drawingId ?? null) === drawingKey);
  if (!peers.length) return weld.id ?? "";

  const ordered = [...peers].sort((a, b) => {
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

  const idx = ordered.findIndex((w) => w.id === weld.id);
  return idx >= 0 ? `${prefix}${idx + 1}` : weld.id ?? "";
}

/**
 * Weld number (SW1, …) plus context line (drawing · page · line · spool) for compact two-line UI.
 * @param {object} weld
 * @param {{ drawings?: object[]; lines?: object[]; spools?: object[]; weldPoints?: object[] }} context
 * @returns {{ primary: string; secondary: string }}
 */
export function getWeldDisambiguatedLabelParts(weld, context) {
  if (!weld) return { primary: "", secondary: "" };
  const { drawings = [], lines = [], spools = [], weldPoints = [] } = context || {};
  const dwg = weld.drawingId ? drawings.find((d) => d.id === weld.drawingId) : null;
  const drawingLabel =
    (dwg?.filename || "").trim() || (dwg?.title || "").trim() || (weld.drawingId ? "Drawing" : "—");
  const pageNum = weld.pageNumber != null ? (weld.pageNumber ?? 0) + 1 : null;
  const pageLabel = pageNum != null ? String(pageNum) : "—";

  const lineId = getWeldLineId(weld, spools);
  const line = lineId ? lines.find((l) => l.id === lineId) : null;
  const lineLabel = (line?.name || "").trim() || lineId || "—";

  const sp = weld.spoolId ? spools.find((s) => s.id === weld.spoolId) : null;
  const spoolLabel = sp ? (sp.name || "").trim() || sp.id : "—";

  const name = getWeldName(weld, weldPoints);

  return {
    primary: name,
    secondary: `${drawingLabel} · p.${pageLabel} · ${lineLabel} · ${spoolLabel}`,
  };
}

/**
 * Drawing · page · line · spool · weld name — for lists where the short name alone is ambiguous.
 * @param {object} weld
 * @param {{ drawings?: object[]; lines?: object[]; spools?: object[]; weldPoints?: object[] }} context
 */
export function getWeldDisambiguatedLabel(weld, context) {
  const { primary, secondary } = getWeldDisambiguatedLabelParts(weld, context);
  if (!primary && !secondary) return "";
  if (!secondary) return primary;
  return `${secondary} · ${primary}`;
}

/**
 * True if weld has fitter and welder info filled (ready to send for NDT).
 */
export function isWeldReadyForNdt(weld, structureScope = null) {
  const s = getWeldSectionCompletion(weld, {}, structureScope);
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
 * location: 'shop' | 'field' – uses pctShop / pctField when set, else pct for both.
 */
function getPctForMethod(ndtRequirements, method, location) {
  const req = (ndtRequirements || []).find((r) => r.method === method);
  if (!req) return 100;
  const raw =
    location === "field"
      ? req.pctField ?? req.pct ?? 100
      : req.pctShop ?? req.pct ?? 100;
  return Math.min(100, Math.max(0, Number(raw)));
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
 * @typedef {object} NdtScopeContext
 * @property {object[]} systems
 * @property {object[]} lines
 * @property {object[]} spools
 */

/**
 * Get the set of weld IDs selected for an NDT method when using percentage.
 * Applies: (1) split by shop/field with minimum pct each, (2) prioritize ready welds,
 * (3) already-accepted welds count toward the quota so remaining need is recomputed.
 * Optional `ndtContext` enables per-system / per-line merged NDT %.
 */
export function getSelectedWeldIdsForNdtMethod(weldPoints, drawingSettings, method, ndtContext = null) {
  const systems = ndtContext?.systems;
  const lines = ndtContext?.lines;
  const spools = ndtContext?.spools;
  const hasScope = Array.isArray(systems) && Array.isArray(lines) && Array.isArray(spools);

  function resolvedFor(w) {
    return hasScope
      ? getResolvedNdtRequirementsForWeld(w, drawingSettings, systems, lines, spools)
      : drawingSettings.ndtRequirements || [];
  }

  const eligible = weldPoints.filter((w) => {
    const overrides = w.ndtOverrides || {};
    const ndtRequired = w.ndtRequired || "auto";
    const res = resolvedFor(w);
    const fromD = fromDrawingForWeld(res, w);
    return isEligibleForMethod(w, method, fromD, overrides, ndtRequired);
  });

  const shop = eligible.filter((w) => (w.weldLocation || "shop") !== "field");
  const field = eligible.filter((w) => w.weldLocation === "field");

  const pick = (list, n) => {
    const sorted = [...list].sort((a, b) => {
      const aReady = isWeldReadyForNdt(a, ndtContext) ? 1 : 0;
      const bReady = isWeldReadyForNdt(b, ndtContext) ? 1 : 0;
      if (bReady !== aReady) return bReady - aReady;
      return weldSortKey(a).localeCompare(weldSortKey(b));
    });
    return sorted.slice(0, n).map((w) => w.id);
  };

  const pctFor = (weld, location) =>
    getPctFromResolvedRequirements(resolvedFor(weld), method, location);
  const shopAllFull = !shop.length || shop.every((w) => pctFor(w, "shop") >= 100);
  const fieldAllFull = !field.length || field.every((w) => pctFor(w, "field") >= 100);

  if (shopAllFull && fieldAllFull) return null;

  function pickIdsForGroup(group, location) {
    if (!group.length) return [];

    const pcts = group.map((w) => pctFor(w, location));
    const firstPct = pcts[0] ?? 100;
    const isHomogeneous = pcts.every((p) => p === firstPct);
    const positivePcts = [...new Set(pcts.filter((p) => p > 0))];
    const hasExcludedZeroPct = pcts.some((p) => p <= 0);
    const isRedistributableExclusionPattern = hasExcludedZeroPct && positivePcts.length === 1;

    if (isHomogeneous && firstPct >= 100) return group.map((w) => w.id);

    const accepted = group.filter((w) => isWeldAlreadyAcceptedForMethod(w, method));
    const notAccepted = group.filter((w) => !isWeldAlreadyAcceptedForMethod(w, method));

    if (isHomogeneous) {
      const target = Math.ceil((group.length * firstPct) / 100);
      const remaining = Math.max(0, target - accepted.length);
      return [...accepted.map((w) => w.id), ...pick(notAccepted, remaining)];
    }

    // If a subset is explicitly excluded with 0%, preserve the original group quota
    // and redistribute picks across non-zero rows instead of under-selecting.
    if (isRedistributableExclusionPattern) {
      const activePct = positivePcts[0];
      const selectable = group.filter((w) => pctFor(w, location) > 0);
      const selectableAccepted = selectable.filter((w) => isWeldAlreadyAcceptedForMethod(w, method));
      const selectableNotAccepted = selectable.filter((w) => !isWeldAlreadyAcceptedForMethod(w, method));
      const target = Math.ceil((group.length * activePct) / 100);
      const remaining = Math.max(0, target - selectableAccepted.length);
      return [...selectableAccepted.map((w) => w.id), ...pick(selectableNotAccepted, remaining)];
    }

    return [
      ...accepted.map((w) => w.id),
      ...notAccepted
        .filter((w) => weldIncludedInPctSample(w.id, method, pctFor(w, location)))
        .map((w) => w.id),
    ];
  }

  const shopPickIds = pickIdsForGroup(shop, "shop");
  const fieldPickIds = pickIdsForGroup(field, "field");

  return new Set([...shopPickIds, ...fieldPickIds]);
}

/**
 * Optional warnings when NDT selection cannot meet ideal criteria (e.g. shop/field split,
 * ready-first). Selection still meets the minimum %; this is for informational display.
 */
export function getNdtSelectionWarnings(weldPoints, drawingSettings, method, ndtContext = null) {
  const ndtRequirements = drawingSettings.ndtRequirements || [];
  const pctShop = getPctForMethod(ndtRequirements, method, "shop");
  const pctField = getPctForMethod(ndtRequirements, method, "field");
  if (pctShop >= 100 && pctField >= 100) return [];

  const systems = ndtContext?.systems;
  const lines = ndtContext?.lines;
  const spools = ndtContext?.spools;
  const hasScope = Array.isArray(systems) && Array.isArray(lines) && Array.isArray(spools);

  function resolvedFor(w) {
    return hasScope
      ? getResolvedNdtRequirementsForWeld(w, drawingSettings, systems, lines, spools)
      : ndtRequirements;
  }

  const eligible = weldPoints.filter((w) => {
    const overrides = w.ndtOverrides || {};
    const ndtRequired = w.ndtRequired || "auto";
    const fromD = fromDrawingForWeld(resolvedFor(w), w);
    return isEligibleForMethod(w, method, fromD, overrides, ndtRequired);
  });
  const shop = eligible.filter((w) => (w.weldLocation || "shop") !== "field");
  const field = eligible.filter((w) => w.weldLocation === "field");
  const targetShop = Math.ceil((shop.length * pctShop) / 100);
  const targetField = Math.ceil((field.length * pctField) / 100);
  const shopAccepted = shop.filter((w) => isWeldAlreadyAcceptedForMethod(w, method));
  const fieldAccepted = field.filter((w) => isWeldAlreadyAcceptedForMethod(w, method));
  const warnings = [];
  if (!hasScope && shopAccepted.length > targetShop) {
    warnings.push(`${method}: shop welds already accepted (${shopAccepted.length}) exceed ${pctShop}% target (${targetShop}).`);
  }
  if (!hasScope && fieldAccepted.length > targetField) {
    warnings.push(`${method}: field welds already accepted (${fieldAccepted.length}) exceed ${pctField}% target (${targetField}).`);
  }
  const selectedIds = getSelectedWeldIdsForNdtMethod(weldPoints, drawingSettings, method, ndtContext);
  if (selectedIds) {
    const selectedWelds = weldPoints.filter((w) => selectedIds.has(w.id));
    const notReady = selectedWelds.filter((w) => !isWeldReadyForNdt(w, ndtContext));
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
export function computeNdtSelection(weld, drawingSettings = {}, weldPoints = [], ndtContext = null) {
  const overrides = weld.ndtOverrides || {};
  const ndtRequired = weld.ndtRequired || "auto";
  const visualInspection = !!weld.visualInspection;

  const systems = ndtContext?.systems;
  const lines = ndtContext?.lines;
  const spools = ndtContext?.spools;
  const hasScope = Array.isArray(systems) && Array.isArray(lines) && Array.isArray(spools);

  const resolvedReqs = hasScope
    ? getResolvedNdtRequirementsForWeld(weld, drawingSettings, systems, lines, spools)
    : drawingSettings.ndtRequirements || [];

  const methods = getMethodListForWeld(weld, drawingSettings, resolvedReqs);
  if (ndtRequired === "no") {
    const off = {};
    methods.forEach((m) => {
      off[m] = false;
    });
    return off;
  }

  const fromDrawing = {};
  resolvedReqs.forEach((r) => {
    fromDrawing[r.method] = true;
  });
  if (visualInspection) fromDrawing.VT = true;

  const selection = {};
  methods.forEach((m) => {
    selection[m] = false;
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

    const location = weld.weldLocation === "field" ? "field" : "shop";
    const pct = getPctFromResolvedRequirements(resolvedReqs, m, location);
    if (pct >= 100) {
      selection[m] = true;
      return;
    }
    if (weldPoints.length > 0) {
      const selectedIds = getSelectedWeldIdsForNdtMethod(weldPoints, drawingSettings, m, ndtContext);
      selection[m] = selectedIds ? selectedIds.has(weld.id) : true;
    } else {
      selection[m] = true;
    }
  });
  return selection;
}

/** Mean weld progress (0–100) for all welds linked to this spool. */
export function getSpoolProgressPercent(spoolId, weldPoints = [], drawingSettings = {}, ndtContext = null) {
  if (!spoolId) return 0;
  const welds = weldPoints.filter((w) => w.spoolId === spoolId);
  if (welds.length === 0) return 0;
  let sum = 0;
  for (const w of welds) {
    const ndtSel = computeNdtSelection(w, drawingSettings, weldPoints, ndtContext);
    sum += getWeldProgressPercent(w, ndtSel, ndtContext);
  }
  return sum / welds.length;
}

/** Mean weld progress (0–100) for welds resolved to this line (direct lineId or via spool). */
export function getLineProgressPercent(lineId, weldPoints = [], spools = [], drawingSettings = {}, ndtContext = null) {
  if (!lineId) return 0;
  const welds = weldPoints.filter((w) => getWeldLineId(w, spools) === lineId);
  if (welds.length === 0) return 0;
  let sum = 0;
  for (const w of welds) {
    const ndtSel = computeNdtSelection(w, drawingSettings, weldPoints, ndtContext);
    sum += getWeldProgressPercent(w, ndtSel, ndtContext);
  }
  return sum / welds.length;
}

/** 100 if the part has a non-empty heat number (label fill on map), else 0. */
export function getPartHeatProgressPercent(part) {
  if (!part) return 0;
  return (part.heatNumber ?? "").trim() !== "" ? 100 : 0;
}
