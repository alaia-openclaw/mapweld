import * as XLSX from "xlsx-js-style";
import {
  NDT_METHODS,
  WELDING_PROCESS_LABELS,
  sortNdtMethods,
  PART_TYPES,
  PART_TYPE_LABELS,
} from "@/lib/constants";
import { getWeldName, computeNdtSelection, getMethodListForWeld } from "@/lib/weld-utils";
import { getResolvedWpsCode } from "@/lib/wps-resolution";
import { getResolvedNdtRequirementsForWeld, getWeldLineId } from "@/lib/ndt-resolution";
import { getEffectiveJointSide } from "@/lib/joint-dimensions";
import { getCategories } from "@/lib/part-catalog";

const YELLOW_FILL = {
  fill: { patternType: "solid", fgColor: { rgb: "FFFF00" } },
};

/** Line, System, Drawing file, Page, Spool, SW name, 8× part cols (incl. descriptions), fitter ×2, WPS */
const BASE_COL_COUNT = 17;

const FLANGE_CATALOG_CATEGORY_IDS = new Set([
  "asme-b16-5",
  "asme-b16-47-a",
  "asme-b16-47-b",
  "asme-orifice",
  "api-6b",
  "api-6bx",
  "asme-reducing",
  "asme-compact",
  "hub-and-clamp",
  "en-1092-1",
  "bs-10",
]);

function exportFamilyFromCatalogCategory(catalogCategoryId) {
  const id = String(catalogCategoryId ?? "").trim();
  if (!id) return "";
  if (id === "pipe") return "Pipe";
  if (id === "fittings-butt-weld") return "Fitting";
  if (FLANGE_CATALOG_CATEGORY_IDS.has(id)) return "Flange";
  const cat = getCategories().find((c) => c.id === id);
  const label = (cat?.label ?? "").trim();
  if (/flange/i.test(label)) return "Flange";
  if (/fitting/i.test(label)) return "Fitting";
  if (/^pipe$/i.test(label)) return "Pipe";
  return label || id;
}

function resolvePartTypeDetail(part) {
  const pt = String(part?.partType ?? "").trim();
  if (!pt) return "";
  const match = Object.entries(PART_TYPES).find(([, v]) => v === pt);
  if (match) return PART_TYPE_LABELS[match[0]] || pt;
  return pt;
}

/**
 * Human-readable part line for exports, e.g. "Pipe, seamless", "Flange, Weldneck Flange", "Fitting, 90° Elbow".
 * @param {object | null | undefined} part
 * @returns {string}
 */
export function getPartExportDescription(part) {
  if (!part || typeof part !== "object") return "";
  const family = exportFamilyFromCatalogCategory(part.catalogCategory);
  const detail = resolvePartTypeDetail(part);
  const vari = String(part.variation ?? "").trim();
  const main = [];
  if (family && detail && detail.trim().toLowerCase() !== family.trim().toLowerCase()) {
    main.push(family, detail);
  } else if (family) main.push(family);
  else if (detail) main.push(detail);
  let out = main.join(", ");
  if (vari) out = out ? `${out}, ${vari}` : vari;
  return out;
}

function collectExportNdtMethods(weldPoints, drawingSettings, ndtContext) {
  const systems = ndtContext?.systems;
  const lines = ndtContext?.lines;
  const spools = ndtContext?.spools;
  const hasScope =
    Array.isArray(systems) && Array.isArray(lines) && Array.isArray(spools);

  const set = new Set(NDT_METHODS);
  (drawingSettings?.ndtRequirements || []).forEach((r) => {
    if (r?.method) set.add(r.method);
  });

  for (const w of weldPoints || []) {
    const resolvedReqs = hasScope
      ? getResolvedNdtRequirementsForWeld(w, drawingSettings, systems, lines, spools)
      : null;
    getMethodListForWeld(w, drawingSettings, resolvedReqs).forEach((m) => set.add(m));
  }
  return sortNdtMethods([...set]);
}

function getLineAndSystemLabels(weld, systems, lines, spools) {
  const lineId = getWeldLineId(weld, spools || []);
  const line = lineId ? (lines || []).find((x) => x.id === lineId) : null;
  const lineName = (line?.name ?? "").trim();
  const system = line?.systemId ? (systems || []).find((s) => s.id === line.systemId) : null;
  const systemName = (system?.name ?? "").trim();
  return { lineName, systemName };
}

function getDrawingExportMeta(weld, drawings = []) {
  const dwg = (drawings || []).find((d) => d.id === weld.drawingId);
  const fileStem = (dwg?.filename || "").replace(/\.pdf$/i, "").trim();
  const page = (weld.pageNumber ?? 0) + 1;
  return { drawingFile: fileStem, drawingPage: page };
}

function isEmpty(val) {
  return val == null || String(val).trim() === "";
}

function getInspectionStatus(
  weld,
  drawingSettings,
  weldPoints = [],
  ndtContext = null,
  ndtMethods = NDT_METHODS,
  ndtReports = []
) {
  const ndtSelection = computeNdtSelection(weld, drawingSettings, weldPoints, ndtContext);
  const results = weld.ndtResults || {};
  const outcomes = weld.ndtResultOutcome || {};
  const manualOverride = weld.ndtResultManualOverride || {};
  const reports = Array.isArray(ndtReports) ? ndtReports : [];

  function reportLabelForMethod(method) {
    const matches = reports.filter((report) => {
      if (report?.method !== method) return false;
      return (report?.weldResults || []).some((row) => row?.weldId === weld?.id);
    });
    if (matches.length === 0) return "";
    const sorted = [...matches].sort((a, b) => {
      const da = Date.parse(a?.reportDate || a?.createdAt || 0) || 0;
      const db = Date.parse(b?.reportDate || b?.createdAt || 0) || 0;
      return db - da;
    });
    const latest = sorted[0];
    return (latest?.title || latest?.id || "").trim();
  }

  const status = {};
  ndtMethods.forEach((m) => {
    const isRequired = !!ndtSelection[m];
    if (!isRequired) {
      status[m] = { value: "N/A", missing: false };
    } else if (results[m] || outcomes[m]) {
      const outcome = outcomes[m];
      const value =
        outcome === "rejected" || outcome === "reject" ? "REJECTED" :
        outcome === "omitted_or_inconclusive" ? "OMITTED" :
        outcome === "repair" ? "REPAIR" : (reportLabelForMethod(m) || "OK");
      const manual = !!manualOverride[m];
      status[m] = { value: value + (manual ? " (m)" : ""), missing: false };
    } else {
      status[m] = { value: "", missing: true };
    }
  });
  return status;
}

function extractWelderRecord(rec, personnel) {
  const wqrs = personnel?.wqrs || [];
  const wqrCodes = (rec.wqrIds || [])
    .map((id) => wqrs.find((x) => x.id === id)?.code)
    .filter(Boolean);
  const custom = (rec.welderName || "").trim();
  const process = (rec.weldingProcesses || [])[0];
  let name = "";
  if (wqrCodes.length > 0) name = wqrCodes.join(", ");
  else if (custom) name = custom;
  else if ((rec.welderIds || []).length > 0) name = "Custom welder";
  return {
    name,
    date: rec.date || "",
    process: process ? (WELDING_PROCESS_LABELS[process] || process) : "",
    electrode: (rec.electrodeNumbers || []).filter(Boolean).join(", "),
  };
}

export function buildWeldsSheetHeaders(maxWelders, ndtMethods = NDT_METHODS) {
  const base = [
    "Line",
    "System",
    "Drawing file",
    "Drawing page",
    "Spool Number",
    "SW name",
    "Part 1 size",
    "Part 1 schedule",
    "Part 1 description",
    "Part 1 heat number",
    "Part 2 size",
    "Part 2 schedule",
    "Part 2 description",
    "Part 2 heat number",
    "Fitter name",
    "Fitter date",
    "WPS",
  ];

  const welderHeaders = [];
  for (let i = 1; i <= maxWelders; i++) {
    const suffix = maxWelders > 1 ? ` ${i}` : "";
    welderHeaders.push(
      `Welder${suffix} name`,
      `Welder${suffix} date`,
      `Welder${suffix} process`,
      `Welder${suffix} electrode`,
    );
  }

  return [...base, ...welderHeaders, ...ndtMethods.map((m) => `${m} report`)];
}

/**
 * Build export rows: one row per weld.
 * Welder columns are expanded horizontally (Welder 1…N name/date/process/electrode).
 * NDT report columns follow after all welder columns.
 */
export function buildExportRows(
  weldPoints,
  { pdfFilename, spools, parts = [], personnel, drawingSettings, ndtContext = null, drawings = [], ndtReports = [] }
) {
  // First pass: determine max welder count across all welds
  const maxWelders = Math.max(
    1,
    ...weldPoints.map((w) =>
      Array.isArray(w.weldingRecords) ? w.weldingRecords.length : 0
    )
  );

  const ndtMethods = collectExportNdtMethods(weldPoints, drawingSettings, ndtContext);
  const ndtOffset = BASE_COL_COUNT + maxWelders * 4;
  const rows = [];
  const highlights = [];

  const sys = ndtContext?.systems;
  const ln = ndtContext?.lines;
  const sp = ndtContext?.spools;

  weldPoints.forEach((w) => {
    const { drawingFile, drawingPage } = getDrawingExportMeta(w, drawings);
    const { lineName, systemName } =
      Array.isArray(sys) && Array.isArray(ln) && Array.isArray(sp)
        ? getLineAndSystemLabels(w, sys, ln, sp)
        : { lineName: "", systemName: "" };
    const spoolName = spools?.find((s) => s.id === w.spoolId)?.name || "";
    const weldNumber = getWeldName(w, weldPoints);
    const part1 = parts?.find((p) => p.id === w.partId1) || null;
    const part2 = parts?.find((p) => p.id === w.partId2) || null;
    const eff1 = getEffectiveJointSide(w, part1, 1);
    const eff2 = getEffectiveJointSide(w, part2, 2);
    const part1Size = eff1.nps;
    const part1Thickness = eff1.schedule;
    const part1Description = getPartExportDescription(part1);
    const part1Heat = (part1?.heatNumber ?? w.heatNumber1 ?? "").trim() || "";
    const part2Size = eff2.nps;
    const part2Thickness = eff2.schedule;
    const part2Description = getPartExportDescription(part2);
    const part2Heat = (part2?.heatNumber ?? w.heatNumber2 ?? "").trim() || "";
    const fitterName = w.fitterName || "";
    const fitterDate = w.dateFitUp || "";
    const wps =
      ndtContext != null && Array.isArray(sys) && Array.isArray(ln) && Array.isArray(sp)
        ? getResolvedWpsCode(w, sys, ln, sp, ndtContext?.drawingSettings ?? {})
        : (w.wps || "");
    const inspectionStatus = getInspectionStatus(
      w,
      drawingSettings,
      weldPoints,
      ndtContext,
      ndtMethods,
      ndtReports
    );

    const baseCols = [
      lineName,
      systemName,
      drawingFile,
      drawingPage,
      spoolName,
      weldNumber,
      part1Size, part1Thickness, part1Description, part1Heat,
      part2Size, part2Thickness, part2Description, part2Heat,
      fitterName, fitterDate, wps,
    ];

    const baseMissing = [
      false,
      false,
      isEmpty(drawingFile),
      false,
      false,
      isEmpty(weldNumber),
      isEmpty(part1Size), isEmpty(part1Thickness), part1 ? isEmpty(part1Description) : false, isEmpty(part1Heat),
      isEmpty(part2Size), isEmpty(part2Thickness), part2 ? isEmpty(part2Description) : false, isEmpty(part2Heat),
      isEmpty(fitterName), isEmpty(fitterDate), isEmpty(wps),
    ];

    // Extract welder records; use legacy single-welder fields as fallback
    const records = Array.isArray(w.weldingRecords) && w.weldingRecords.length > 0
      ? w.weldingRecords.map((rec) => extractWelderRecord(rec, personnel))
      : [];

    // Flatten all welder slots into columns (pad missing slots with empty strings)
    const welderCols = [];
    const welderMissingCols = [];
    for (let i = 0; i < maxWelders; i++) {
      const rec = records[i];
      const name = rec?.name ?? "";
      const date = rec?.date ?? "";
      const process = rec?.process ?? "";
      const electrode = rec?.electrode ?? "";
      welderCols.push(name, date, process, electrode);
      // Only flag as missing if this slot has data in at least 1 field or it's the first slot
      const slotExpected = i === 0 || rec != null;
      welderMissingCols.push(
        slotExpected && isEmpty(name),
        slotExpected && isEmpty(date),
        false, // process optional
        false, // electrode optional
      );
    }

    const row = [...baseCols, ...welderCols, ...ndtMethods.map((m) => inspectionStatus[m].value)];
    rows.push(row);

    const rowIdx = rows.length - 1;
    baseMissing.forEach((m, c) => { if (m) highlights.push({ r: rowIdx, c }); });
    welderMissingCols.forEach((m, i) => { if (m) highlights.push({ r: rowIdx, c: BASE_COL_COUNT + i }); });
    ndtMethods.forEach((m, i) => {
      if (inspectionStatus[m].missing) highlights.push({ r: rowIdx, c: ndtOffset + i });
    });
  });

  return { rows, highlights, maxWelders, ndtMethods };
}

function formatMetaDate(value) {
  if (value == null || String(value).trim() === "") return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString();
}

function buildSheetMetaRows(projectMeta = {}, drawingSettings = {}, pdfFilename = "") {
  const name = (projectMeta?.projectName ?? "").trim() || (pdfFilename || "").replace(/\.pdf$/i, "") || "—";
  const weldingSpec = (drawingSettings?.weldingSpec ?? "").trim();
  return [
    ["Project", name],
    ["Export date", new Date().toLocaleString()],
    ["Client", (projectMeta?.client ?? "").trim()],
    ["Spec", (projectMeta?.spec ?? "").trim()],
    ["Revision", (projectMeta?.revision ?? "").trim()],
    ["Project date", formatMetaDate(projectMeta?.date)],
    ["Welding spec", weldingSpec],
  ];
}

/**
 * Export welds to Excel — one row per weld, welder columns expand horizontally.
 */
export function exportWeldsToExcel(weldPoints, options) {
  const {
    pdfFilename,
    spools,
    parts,
    personnel,
    drawingSettings,
    ndtContext,
    ndtReports = [],
    projectMeta = {},
    drawings = [],
  } = options;
  const { rows, highlights, maxWelders, ndtMethods } = buildExportRows(weldPoints, {
    pdfFilename,
    spools,
    parts: parts ?? [],
    personnel,
    drawingSettings,
    ndtContext: ndtContext ?? null,
    ndtReports,
    drawings: drawings ?? [],
  });

  const metaRows = buildSheetMetaRows(projectMeta, drawingSettings, pdfFilename);
  const blankRow = [""];
  const headers = buildWeldsSheetHeaders(maxWelders, ndtMethods);
  const data = [...metaRows, blankRow, headers, ...rows];
  const dataStartRow0 = metaRows.length + 2; // blank + header row (0-based index of first data row)

  const ws = XLSX.utils.aoa_to_sheet(data);

  highlights.forEach(({ r, c }) => {
    const ref = XLSX.utils.encode_cell({ r: r + dataStartRow0, c });
    if (ws[ref]) {
      ws[ref].s = ws[ref].s ? { ...ws[ref].s, ...YELLOW_FILL } : YELLOW_FILL;
    }
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Welds");
  const filename = (pdfFilename || "welds").replace(/\.pdf$/i, "") + "-welds.xlsx";
  XLSX.writeFile(wb, filename);
}
