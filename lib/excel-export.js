import * as XLSX from "xlsx-js-style";
import { NDT_METHODS, WELDING_PROCESS_LABELS, sortNdtMethods } from "@/lib/constants";
import { getWeldName, computeNdtSelection, getMethodListForWeld } from "@/lib/weld-utils";
import { getResolvedWpsCode } from "@/lib/wps-resolution";
import { getResolvedNdtRequirementsForWeld, getWeldLineId } from "@/lib/ndt-resolution";
import { getEffectiveJointSide } from "@/lib/joint-dimensions";

const YELLOW_FILL = {
  fill: { patternType: "solid", fgColor: { rgb: "FFFF00" } },
};

/** Line, System, Drawing file, Page, Spool, SW name, 6× part cols, fitter ×2, WPS */
const BASE_COL_COUNT = 15;

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

function getInspectionStatus(weld, drawingSettings, weldPoints = [], ndtContext = null, ndtMethods = NDT_METHODS) {
  const ndtSelection = computeNdtSelection(weld, drawingSettings, weldPoints, ndtContext);
  const results = weld.ndtResults || {};
  const outcomes = weld.ndtResultOutcome || {};
  const manualOverride = weld.ndtResultManualOverride || {};

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
        outcome === "repair" ? "REPAIR" : "OK";
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
    "Part 1 heat number",
    "Part 2 size",
    "Part 2 schedule",
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
export function buildExportRows(weldPoints, { pdfFilename, spools, parts = [], personnel, drawingSettings, ndtContext = null, drawings = [] }) {
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
    const part1Heat = (part1?.heatNumber ?? w.heatNumber1 ?? "").trim() || "";
    const part2Size = eff2.nps;
    const part2Thickness = eff2.schedule;
    const part2Heat = (part2?.heatNumber ?? w.heatNumber2 ?? "").trim() || "";
    const fitterName = w.fitterName || "";
    const fitterDate = w.dateFitUp || "";
    const wps =
      ndtContext != null && Array.isArray(sys) && Array.isArray(ln) && Array.isArray(sp)
        ? getResolvedWpsCode(w, sys, ln, sp)
        : (w.wps || "");
    const inspectionStatus = getInspectionStatus(w, drawingSettings, weldPoints, ndtContext, ndtMethods);

    const baseCols = [
      lineName,
      systemName,
      drawingFile,
      drawingPage,
      spoolName,
      weldNumber,
      part1Size, part1Thickness, part1Heat,
      part2Size, part2Thickness, part2Heat,
      fitterName, fitterDate, wps,
    ];

    const baseMissing = [
      false,
      false,
      isEmpty(drawingFile),
      false,
      false,
      isEmpty(weldNumber),
      isEmpty(part1Size), isEmpty(part1Thickness), isEmpty(part1Heat),
      isEmpty(part2Size), isEmpty(part2Thickness), isEmpty(part2Heat),
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
  const { pdfFilename, spools, parts, personnel, drawingSettings, ndtContext, projectMeta = {}, drawings = [] } = options;
  const { rows, highlights, maxWelders, ndtMethods } = buildExportRows(weldPoints, {
    pdfFilename,
    spools,
    parts: parts ?? [],
    personnel,
    drawingSettings,
    ndtContext: ndtContext ?? null,
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
