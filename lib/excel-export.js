import * as XLSX from "xlsx-js-style";
import { NDT_METHODS, WELDING_PROCESS_LABELS } from "@/lib/constants";
import { getWeldName, computeNdtSelection } from "@/lib/weld-utils";

const YELLOW_FILL = {
  fill: { patternType: "solid", fgColor: { rgb: "FFFF00" } },
};

const BASE_COL_COUNT = 12; // columns before welder blocks

function isEmpty(val) {
  return val == null || String(val).trim() === "";
}

function getInspectionStatus(weld, drawingSettings, weldPoints = []) {
  const ndtSelection = computeNdtSelection(weld, drawingSettings, weldPoints);
  const results = weld.ndtResults || {};
  const outcomes = weld.ndtResultOutcome || {};
  const manualOverride = weld.ndtResultManualOverride || {};

  const status = {};
  NDT_METHODS.forEach((m) => {
    const isRequired = ndtSelection[m];
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
  const fromIds = (rec.welderIds || [])
    .map((id) => personnel?.welders?.find((x) => x.id === id)?.name)
    .filter(Boolean)
    .join(", ");
  const custom = (rec.welderName || "").trim();
  const process = (rec.weldingProcesses || [])[0];
  return {
    name: [fromIds, custom].filter(Boolean).join(", "),
    date: rec.date || "",
    process: process ? (WELDING_PROCESS_LABELS[process] || process) : "",
    electrode: (rec.electrodeNumbers || []).filter(Boolean).join(", "),
  };
}

function buildHeaders(maxWelders) {
  const base = [
    "Dwg Number",
    "Spool Number",
    "SW name",
    "Part 1 size",
    "Part 1 thickness",
    "Part 1 heat number",
    "Part 2 size",
    "Part 2 thickness",
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

  return [...base, ...welderHeaders, ...NDT_METHODS.map((m) => `${m} report`)];
}

/**
 * Build export rows: one row per weld.
 * Welder columns are expanded horizontally (Welder 1…N name/date/process/electrode).
 * NDT report columns follow after all welder columns.
 */
export function buildExportRows(weldPoints, { pdfFilename, spools, parts = [], personnel, drawingSettings }) {
  // First pass: determine max welder count across all welds
  const maxWelders = Math.max(
    1,
    ...weldPoints.map((w) =>
      Array.isArray(w.weldingRecords) ? w.weldingRecords.length : 0
    )
  );

  const ndtOffset = BASE_COL_COUNT + maxWelders * 4;
  const rows = [];
  const highlights = [];

  weldPoints.forEach((w) => {
    const drawingName = pdfFilename || "";
    const spoolName = spools?.find((s) => s.id === w.spoolId)?.name || "";
    const weldNumber = getWeldName(w, weldPoints);
    const part1 = parts?.find((p) => p.id === w.partId1) || null;
    const part1Size = part1?.nps ?? "";
    const part1Thickness = part1?.thickness ?? "";
    const part1Heat = (part1?.heatNumber ?? w.heatNumber1 ?? "").trim() || "";
    const part2 = parts?.find((p) => p.id === w.partId2) || null;
    const part2Size = part2?.nps ?? "";
    const part2Thickness = part2?.thickness ?? "";
    const part2Heat = (part2?.heatNumber ?? w.heatNumber2 ?? "").trim() || "";
    const fitterName = w.fitterName || "";
    const fitterDate = w.dateFitUp || "";
    const wps = w.wps || "";
    const inspectionStatus = getInspectionStatus(w, drawingSettings, weldPoints);

    const baseCols = [
      drawingName, spoolName, weldNumber,
      part1Size, part1Thickness, part1Heat,
      part2Size, part2Thickness, part2Heat,
      fitterName, fitterDate, wps,
    ];

    const baseMissing = [
      isEmpty(drawingName), false, isEmpty(weldNumber),
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

    const row = [...baseCols, ...welderCols, ...NDT_METHODS.map((m) => inspectionStatus[m].value)];
    rows.push(row);

    const rowIdx = rows.length - 1;
    baseMissing.forEach((m, c) => { if (m) highlights.push({ r: rowIdx + 1, c }); });
    welderMissingCols.forEach((m, i) => { if (m) highlights.push({ r: rowIdx + 1, c: BASE_COL_COUNT + i }); });
    NDT_METHODS.forEach((m, i) => {
      if (inspectionStatus[m].missing) highlights.push({ r: rowIdx + 1, c: ndtOffset + i });
    });
  });

  return { rows, highlights, maxWelders };
}

/**
 * Export welds to Excel — one row per weld, welder columns expand horizontally.
 */
export function exportWeldsToExcel(weldPoints, options) {
  const { pdfFilename, spools, parts, personnel, drawingSettings } = options;
  const { rows, highlights, maxWelders } = buildExportRows(weldPoints, {
    pdfFilename,
    spools,
    parts: parts ?? [],
    personnel,
    drawingSettings,
  });

  const headers = buildHeaders(maxWelders);
  const data = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(data);

  highlights.forEach(({ r, c }) => {
    const ref = XLSX.utils.encode_cell({ r, c });
    if (ws[ref]) {
      ws[ref].s = ws[ref].s ? { ...ws[ref].s, ...YELLOW_FILL } : YELLOW_FILL;
    }
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Welds");
  const filename = (pdfFilename || "welds").replace(/\.pdf$/i, "") + "-welds.xlsx";
  XLSX.writeFile(wb, filename);
}
