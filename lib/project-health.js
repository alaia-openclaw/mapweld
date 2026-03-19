/**
 * Project data-quality / completeness checks (pure functions, no React).
 * Used by ProjectHealthPage to guide users toward a complete, consistent project.
 */

import { computeNdtSelection, getWeldSectionCompletion } from "./weld-utils";
import { NDT_METHODS, NDT_OVERRIDE_OPTIONS, sortNdtMethods, NDT_METHOD_LABELS } from "./constants";

/** @typedef {'general' | 'drawings' | 'systems_lines' | 'welds' | 'spools' | 'parts' | 'library' | 'ndt'} HealthCategory */
/** @typedef {'error' | 'warning' | 'info'} HealthSeverity */

/**
 * @typedef {object} HealthIssue
 * @property {string} id
 * @property {HealthCategory} category
 * @property {HealthSeverity} severity
 * @property {string} title
 * @property {string} detail
 * @property {string} [entityType]
 * @property {string} [entityId]
 * @property {Record<string, string>} [relatedIds]
 */

function getMethodListForWeld(weld, drawingSettings = {}) {
  const requirementMethods = (drawingSettings?.ndtRequirements || []).map((r) => r.method);
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
 * @param {object} snapshot
 * @param {object[]} [snapshot.weldPoints]
 * @param {object[]} [snapshot.drawings]
 * @param {object[]} [snapshot.spools]
 * @param {object[]} [snapshot.parts]
 * @param {object[]} [snapshot.lines]
 * @param {object[]} [snapshot.systems]
 * @param {object} [snapshot.personnel]
 * @param {object[]} [snapshot.wpsLibrary]
 * @param {object[]} [snapshot.electrodeLibrary]
 * @param {object} [snapshot.drawingSettings]
 * @param {object} [snapshot.projectMeta]
 * @param {object[]} [snapshot.partMarkers]
 * @param {object[]} [snapshot.spoolMarkers]
 * @param {object[]} [snapshot.lineMarkers]
 * @returns {HealthIssue[]}
 */
export function collectProjectHealthIssues(snapshot = {}) {
  /** @type {HealthIssue[]} */
  const issues = [];
  const weldPoints = Array.isArray(snapshot.weldPoints) ? snapshot.weldPoints : [];
  const drawings = Array.isArray(snapshot.drawings) ? snapshot.drawings : [];
  const spools = Array.isArray(snapshot.spools) ? snapshot.spools : [];
  const parts = Array.isArray(snapshot.parts) ? snapshot.parts : [];
  const lines = Array.isArray(snapshot.lines) ? snapshot.lines : [];
  const systems = Array.isArray(snapshot.systems) ? snapshot.systems : [];
  const personnel = snapshot.personnel && typeof snapshot.personnel === "object"
    ? snapshot.personnel
    : { fitters: [], welders: [], wqrs: [] };
  const wpsLibrary = Array.isArray(snapshot.wpsLibrary) ? snapshot.wpsLibrary : [];
  const electrodeLibrary = Array.isArray(snapshot.electrodeLibrary) ? snapshot.electrodeLibrary : [];
  const drawingSettings = snapshot.drawingSettings && typeof snapshot.drawingSettings === "object"
    ? snapshot.drawingSettings
    : { ndtRequirements: [], weldingSpec: "" };
  const projectMeta = snapshot.projectMeta && typeof snapshot.projectMeta === "object"
    ? snapshot.projectMeta
    : {};
  const partMarkers = Array.isArray(snapshot.partMarkers) ? snapshot.partMarkers : [];
  const spoolMarkers = Array.isArray(snapshot.spoolMarkers) ? snapshot.spoolMarkers : [];
  const lineMarkers = Array.isArray(snapshot.lineMarkers) ? snapshot.lineMarkers : [];

  const drawingIdSet = new Set(drawings.map((d) => d?.id).filter(Boolean));
  const spoolIdSet = new Set(spools.map((s) => s?.id).filter(Boolean));
  const partIdSet = new Set(parts.map((p) => p?.id).filter(Boolean));
  const lineIdSet = new Set(lines.map((l) => l?.id).filter(Boolean));
  const systemIdSet = new Set(systems.map((s) => s?.id).filter(Boolean));

  const welderById = new Map((personnel.welders || []).filter(Boolean).map((w) => [w.id, w]));
  const wqrById = new Map((personnel.wqrs || []).filter(Boolean).map((w) => [w.id, w]));
  const fitterNamesLower = new Set(
    (personnel.fitters || [])
      .map((f) => (f?.name || "").trim().toLowerCase())
      .filter(Boolean)
  );

  const wpsCodesLower = new Set(
    wpsLibrary.map((e) => (e?.code || "").trim().toLowerCase()).filter(Boolean)
  );
  const electrodeCodesLower = new Set(
    electrodeLibrary.map((e) => (e?.code || "").trim().toLowerCase()).filter(Boolean)
  );
  const hasWpsLibrary = wpsCodesLower.size > 0;
  const hasElectrodeLibrary = electrodeCodesLower.size > 0;

  // --- General ---
  if (!(projectMeta.projectName || "").trim()) {
    issues.push({
      id: "general::projectName",
      category: "general",
      severity: "info",
      title: "Project name not set",
      detail: "Add a project name under Parameters → Project for clearer exports and file names.",
    });
  }
  if (!(projectMeta.client || "").trim()) {
    issues.push({
      id: "general::client",
      category: "general",
      severity: "info",
      title: "Client not set",
      detail: "Optional: set client in Parameters → Project.",
    });
  }
  if (!(projectMeta.spec || "").trim()) {
    issues.push({
      id: "general::spec",
      category: "general",
      severity: "info",
      title: "Specification not set",
      detail: "Optional: set spec / standard in Parameters → Project.",
    });
  }

  const ndtReqs = drawingSettings.ndtRequirements || [];
  if (!Array.isArray(ndtReqs) || ndtReqs.length === 0) {
    issues.push({
      id: "general::ndtRequirements",
      category: "general",
      severity: "info",
      title: "No drawing NDT requirements",
      detail: "Parameters → Default NDT has no methods. Weld NDT expectations may be unclear.",
    });
  }
  if (!(drawingSettings.weldingSpec || "").trim()) {
    issues.push({
      id: "general::weldingSpec",
      category: "general",
      severity: "info",
      title: "Welding spec not set",
      detail: "Optional: add welding specification under Parameters → Default NDT.",
    });
  }

  if (weldPoints.length > 0) {
    if (!(personnel.fitters || []).length) {
      issues.push({
        id: "general::noFitters",
        category: "general",
        severity: "warning",
        title: "No fitters in personnel",
        detail: "You have welds but no fitters listed under Parameters → Personnel.",
      });
    }
    if (!(personnel.welders || []).length) {
      issues.push({
        id: "general::noWelders",
        category: "general",
        severity: "warning",
        title: "No welders in personnel",
        detail: "You have welds but no welders listed under Parameters → Personnel.",
      });
    }
  }

  // --- Drawings / PDF ---
  drawings.forEach((dwg) => {
    const id = dwg?.id || "unknown";
    const hasB64 = typeof dwg?.pdfBase64 === "string" && dwg.pdfBase64.trim().length > 0;
    const hasBlob = typeof dwg?.blobUrl === "string" && dwg.blobUrl.length > 0;
    if (!hasB64 && !hasBlob) {
      issues.push({
        id: `drawings::noPdf::${id}`,
        category: "drawings",
        severity: "error",
        title: `Drawing has no PDF data`,
        detail: `${dwg?.filename || id}: add a PDF or reload the project file. Saved .weldproject files should include embedded PDFs.`,
        entityType: "drawing",
        entityId: id,
      });
    }
  });

  // --- Systems & lines ---
  systems.forEach((sys) => {
    const id = sys?.id || "";
    if (!(sys?.name || "").trim()) {
      issues.push({
        id: `systems_lines::systemName::${id}`,
        category: "systems_lines",
        severity: "warning",
        title: "System has no name",
        detail: "Name systems in the Lines side panel for clearer hierarchy.",
        entityType: "system",
        entityId: id,
      });
    }
  });

  lines.forEach((line) => {
    const id = line?.id || "";
    const sysId = line?.systemId ?? null;
    if (!(line?.name || "").trim()) {
      issues.push({
        id: `systems_lines::lineName::${id}`,
        category: "systems_lines",
        severity: "warning",
        title: "Line has no name",
        detail: "Assign a line name in the Lines panel.",
        entityType: "line",
        entityId: id,
      });
    }
    if (sysId && !systemIdSet.has(sysId)) {
      issues.push({
        id: `systems_lines::lineBadSystem::${id}`,
        category: "systems_lines",
        severity: "error",
        title: "Line linked to missing system",
        detail: `Line ${(line.name || "").trim() || id} references a system that does not exist.`,
        entityType: "line",
        entityId: id,
        relatedIds: { systemId: sysId },
      });
    }
    const dIds = Array.isArray(line?.drawingIds) ? line.drawingIds : [];
    if (dIds.length === 0) {
      issues.push({
        id: `systems_lines::lineNoDrawings::${id}`,
        category: "systems_lines",
        severity: "warning",
        title: "Line not linked to any drawing",
        detail: `Line ${(line.name || "").trim() || id} has empty drawing links.`,
        entityType: "line",
        entityId: id,
      });
    }
  });

  const spoolNamesByLine = new Map();
  spools.forEach((s) => {
    const lid = s?.lineId || "__none__";
    const n = (s?.name || "").trim().toLowerCase();
    if (!n) return;
    if (!spoolNamesByLine.has(lid)) spoolNamesByLine.set(lid, new Map());
    const m = spoolNamesByLine.get(lid);
    m.set(n, (m.get(n) || 0) + 1);
  });
  spoolNamesByLine.forEach((nameCounts, lid) => {
    nameCounts.forEach((count, nameLower) => {
      if (count > 1) {
        issues.push({
          id: `systems_lines::dupSpoolName::${lid}::${nameLower}`,
          category: "systems_lines",
          severity: "info",
          title: "Duplicate spool names",
          detail: `Multiple spools share the name "${nameLower}"${lid === "__none__" ? "" : " on the same line"}. Consider unique names for clarity.`,
        });
      }
    });
  });

  const lineNamesBySystem = new Map();
  lines.forEach((line) => {
    const sid = line?.systemId || "__none__";
    const n = (line?.name || "").trim().toLowerCase();
    if (!n) return;
    if (!lineNamesBySystem.has(sid)) lineNamesBySystem.set(sid, new Map());
    const m = lineNamesBySystem.get(sid);
    m.set(n, (m.get(n) || 0) + 1);
  });
  lineNamesBySystem.forEach((nameCounts, sid) => {
    nameCounts.forEach((count, nameLower) => {
      if (count > 1) {
        issues.push({
          id: `systems_lines::dupLineName::${sid}::${nameLower}`,
          category: "systems_lines",
          severity: "info",
          title: "Duplicate line names",
          detail: `Multiple lines share the name "${nameLower}" in the same system scope.`,
        });
      }
    });
  });

  // Markers → drawing / line existence
  partMarkers.forEach((m) => {
    const did = m?.drawingId;
    if (did && !drawingIdSet.has(did)) {
      issues.push({
        id: `drawings::orphanPartMarker::${m.id}`,
        category: "drawings",
        severity: "error",
        title: "Part marker on unknown drawing",
        detail: `Marker ${m.id} references missing drawing ${did}.`,
        entityType: "partMarker",
        entityId: m.id,
      });
    }
  });
  spoolMarkers.forEach((m) => {
    const did = m?.drawingId;
    if (did && !drawingIdSet.has(did)) {
      issues.push({
        id: `drawings::orphanSpoolMarker::${m.id}`,
        category: "drawings",
        severity: "error",
        title: "Spool marker on unknown drawing",
        detail: `Marker ${m.id} references missing drawing ${did}.`,
        entityType: "spoolMarker",
        entityId: m.id,
      });
    }
  });
  lineMarkers.forEach((m) => {
    const did = m?.drawingId;
    if (did && !drawingIdSet.has(did)) {
      issues.push({
        id: `drawings::orphanLineMarker::${m.id}`,
        category: "drawings",
        severity: "error",
        title: "Line marker on unknown drawing",
        detail: `Marker ${m.id} references missing drawing ${did}.`,
        entityType: "lineMarker",
        entityId: m.id,
      });
    }
    const lid = m?.lineId;
    if (lid && !lineIdSet.has(lid)) {
      issues.push({
        id: `systems_lines::orphanLineMarker::${m.id}`,
        category: "systems_lines",
        severity: "error",
        title: "Line marker references missing line",
        detail: `Marker ${m.id} points to unknown line ${lid}.`,
        entityType: "lineMarker",
        entityId: m.id,
      });
    }
  });

  // --- Welds (sections + invalid refs) ---
  weldPoints.forEach((w) => {
    const wid = w?.id || "";
    const ndtSel = computeNdtSelection(w, drawingSettings, weldPoints);
    const section = getWeldSectionCompletion(w, ndtSel);

    if (w?.drawingId && !drawingIdSet.has(w.drawingId)) {
      issues.push({
        id: `welds::badDrawing::${wid}`,
        category: "welds",
        severity: "error",
        title: "Weld on unknown drawing",
        detail: `Weld references drawing id that does not exist.`,
        entityType: "weld",
        entityId: wid,
        relatedIds: { drawingId: w.drawingId },
      });
    }
    if (w?.spoolId && !spoolIdSet.has(w.spoolId)) {
      issues.push({
        id: `welds::badSpool::${wid}`,
        category: "welds",
        severity: "error",
        title: "Weld linked to missing spool",
        detail: "Assign a valid spool or clear the spool link.",
        entityType: "weld",
        entityId: wid,
        relatedIds: { spoolId: w.spoolId },
      });
    }
    if (w?.partId1 && !partIdSet.has(w.partId1)) {
      issues.push({
        id: `welds::badPart1::${wid}`,
        category: "welds",
        severity: "error",
        title: "Weld part 1 references missing part",
        detail: "Part id no longer exists in the project.",
        entityType: "weld",
        entityId: wid,
      });
    }
    if (w?.partId2 && !partIdSet.has(w.partId2)) {
      issues.push({
        id: `welds::badPart2::${wid}`,
        category: "welds",
        severity: "error",
        title: "Weld part 2 references missing part",
        detail: "Part id no longer exists in the project.",
        entityType: "weld",
        entityId: wid,
      });
    }

    if (!section.general) {
      issues.push({
        id: `welds::noWps::${wid}`,
        category: "welds",
        severity: "warning",
        title: "Weld missing WPS",
        detail: "Set a WPS on the weld (General section).",
        entityType: "weld",
        entityId: wid,
      });
    }
    if (!section.fitup) {
      issues.push({
        id: `welds::fitup::${wid}`,
        category: "welds",
        severity: "warning",
        title: "Fit-up incomplete",
        detail: "Fitter name, fit-up date, and at least one heat number are required for a complete fit-up.",
        entityType: "weld",
        entityId: wid,
      });
    }
    if (!section.welding) {
      issues.push({
        id: `welds::welding::${wid}`,
        category: "welds",
        severity: "warning",
        title: "Welding records incomplete",
        detail: "Each record needs welder (or name) / process and a date.",
        entityType: "weld",
        entityId: wid,
      });
    }

    // Library: WPS
    const wpsTrim = (w.wps || "").trim();
    if (hasWpsLibrary && wpsTrim && !wpsCodesLower.has(wpsTrim.toLowerCase())) {
      issues.push({
        id: `library::wps::${wid}`,
        category: "library",
        severity: "warning",
        title: "WPS not in project library",
        detail: `WPS "${wpsTrim}" is not listed under Parameters → WPS library.`,
        entityType: "weld",
        entityId: wid,
      });
    }

    const fitterTrim = (w.fitterName || "").trim();
    if (fitterTrim && fitterNamesLower.size > 0 && !fitterNamesLower.has(fitterTrim.toLowerCase())) {
      issues.push({
        id: `library::fitter::${wid}`,
        category: "library",
        severity: "info",
        title: "Fitter not in personnel list",
        detail: `Fitter "${fitterTrim}" does not match any Parameters → Personnel fitter name.`,
        entityType: "weld",
        entityId: wid,
      });
    }

    (w.weldingRecords || []).forEach((rec, recIdx) => {
      (rec.welderIds || []).forEach((welderId) => {
        if (welderId && !welderById.has(welderId)) {
          issues.push({
            id: `library::badWelder::${wid}::${recIdx}::${welderId}`,
            category: "library",
            severity: "error",
            title: "Welder id not in personnel",
            detail: `Welding record references unknown welder id.`,
            entityType: "weld",
            entityId: wid,
            relatedIds: { welderId },
          });
        }
      });
      (rec.wqrIds || []).forEach((wqrId) => {
        if (wqrId && !wqrById.has(wqrId)) {
          issues.push({
            id: `library::badWqr::${wid}::${recIdx}::${wqrId}`,
            category: "library",
            severity: "error",
            title: "WQR id not in personnel",
            detail: `Welding record references unknown WQR id.`,
            entityType: "weld",
            entityId: wid,
            relatedIds: { wqrId },
          });
        }
      });
      const nums = rec.electrodeNumbers || [];
      nums.forEach((code) => {
        const c = (code || "").trim();
        if (hasElectrodeLibrary && c && !electrodeCodesLower.has(c.toLowerCase())) {
          issues.push({
            id: `library::electrode::${wid}::${recIdx}::${c}`,
            category: "library",
            severity: "warning",
            title: "Electrode not in library",
            detail: `"${c}" is not in Parameters → Electrode library.`,
            entityType: "weld",
            entityId: wid,
          });
        }
      });
    });
  });

  // --- NDT: required methods missing results ---
  weldPoints.forEach((w) => {
    const wid = w?.id || "";
    const ndtSel = computeNdtSelection(w, drawingSettings, weldPoints);
    const overrides = w.ndtOverrides || {};
    const results = w.ndtResults || {};
    const methods = getMethodListForWeld(w, drawingSettings);
    methods.forEach((method) => {
      const needDone =
        overrides[method] === NDT_OVERRIDE_OPTIONS.REQUIRED ||
        (overrides[method] !== NDT_OVERRIDE_OPTIONS.EXEMPT && ndtSel[method]);
      if (!needDone) return;
      if (!results[method]) {
        const label = NDT_METHOD_LABELS[method] || method;
        issues.push({
          id: `ndt::missingResult::${wid}::${method}`,
          category: "ndt",
          severity: "warning",
          title: `NDT result missing (${label})`,
          detail: `Weld requires ${label} but has no recorded result yet.`,
          entityType: "weld",
          entityId: wid,
          relatedIds: { method },
        });
      }
    });
  });

  // Spools
  const spoolIdsWithMarkers = new Set(spoolMarkers.map((m) => m.spoolId).filter(Boolean));
  const spoolIdsFromWelds = new Set(weldPoints.map((w) => w.spoolId).filter(Boolean));
  const spoolIdsFromParts = new Set(parts.map((p) => p.spoolId).filter(Boolean));

  spools.forEach((s) => {
    const sid = s?.id || "";
    if (!(s?.name || "").trim()) {
      issues.push({
        id: `spools::name::${sid}`,
        category: "spools",
        severity: "warning",
        title: "Spool has no name",
        detail: "Name spools in the Spools panel for traceability.",
        entityType: "spool",
        entityId: sid,
      });
    }
    const lid = s?.lineId ?? null;
    if (!lid || !lineIdSet.has(lid)) {
      issues.push({
        id: `spools::line::${sid}`,
        category: "spools",
        severity: "warning",
        title: "Spool not linked to a line",
        detail: "Link the spool to a line for drawing / line hierarchy.",
        entityType: "spool",
        entityId: sid,
      });
    }
    const stage = s?.lifecycleStage || "not_started";
    const hasActivity =
      spoolIdsWithMarkers.has(sid) ||
      spoolIdsFromWelds.has(sid) ||
      spoolIdsFromParts.has(sid);
    if (hasActivity && stage === "not_started") {
      issues.push({
        id: `spools::lifecycle::${sid}`,
        category: "spools",
        severity: "info",
        title: "Spool lifecycle still “not started”",
        detail: "This spool has markers or assigned welds/parts but lifecycle has not been advanced.",
        entityType: "spool",
        entityId: sid,
      });
    }
  });

  // Parts
  parts.forEach((p) => {
    const pid = p?.id || "";
    if (!(p?.heatNumber || "").trim()) {
      issues.push({
        id: `parts::heat::${pid}`,
        category: "parts",
        severity: "info",
        title: "Part heat number empty",
        detail: "Add a heat number when traceability is required.",
        entityType: "part",
        entityId: pid,
      });
    }
    if (p?.spoolId == null || p.spoolId === "") {
      issues.push({
        id: `parts::noSpool::${pid}`,
        category: "parts",
        severity: "info",
        title: "Part not assigned to a spool",
        detail: "Optional: assign a spool in the Parts panel.",
        entityType: "part",
        entityId: pid,
      });
    } else if (!spoolIdSet.has(p.spoolId)) {
      issues.push({
        id: `parts::badSpool::${pid}`,
        category: "parts",
        severity: "error",
        title: "Part linked to missing spool",
        detail: "Spool id no longer exists.",
        entityType: "part",
        entityId: pid,
      });
    }
    const hasCatalog =
      (p?.partType || "").trim() && (p?.nps || "").trim() && (p?.thickness || "").trim();
    if (!hasCatalog) {
      issues.push({
        id: `parts::catalog::${pid}`,
        category: "parts",
        severity: "info",
        title: "Part catalog fields incomplete",
        detail: "Type, NPS, and thickness help identify the component.",
        entityType: "part",
        entityId: pid,
      });
    }
  });

  return issues;
}

/**
 * @param {HealthIssue[]} issues
 * @returns {Record<HealthCategory, { error: number, warning: number, info: number }>}
 */
export function countIssuesByCategory(issues) {
  /** @type {Record<string, { error: number, warning: number, info: number }>} */
  const out = {};
  const cats = ["general", "drawings", "systems_lines", "welds", "spools", "parts", "library", "ndt"];
  cats.forEach((c) => {
    out[c] = { error: 0, warning: 0, info: 0 };
  });
  issues.forEach((i) => {
    if (!out[i.category]) out[i.category] = { error: 0, warning: 0, info: 0 };
    if (out[i.category][i.severity] != null) out[i.category][i.severity] += 1;
  });
  return out;
}
