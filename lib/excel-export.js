import * as XLSX from "xlsx-js-style";
import { NDT_METHODS, WELDING_PROCESS_LABELS } from "@/lib/constants";
import { getWeldName, computeNdtSelection } from "@/lib/weld-utils";

const YELLOW_FILL = {
  fill: { patternType: "solid", fgColor: { rgb: "FFFF00" } },
};

const HEADERS = [
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
  "Welder name",
  "Welder date",
  "Welding process",
  "Electrode heat number",
  ...NDT_METHODS.map((m) => `${m} report`),
];

const NDT_OFFSET = 16; // first NDT column index

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
      status[m] = { value: "N/A", missing: false, manual: false };
    } else if (results[m] || outcomes[m]) {
      const outcome = outcomes[m];
      const value =
        outcome === "rejected" || outcome === "reject" ? "REJECTED" :
        outcome === "omitted_or_inconclusive" ? "OMITTED" :
        outcome === "repair" ? "REPAIR" : "OK";
      const manual = !!manualOverride[m];
      status[m] = { value: value + (manual ? " (m)" : ""), missing: false, manual };
    } else {
      status[m] = { value: "", missing: true, manual: false };
    }
  });
  return status;
}

/**
 * Build export rows: one row per weld, duplicated per welder (SW1 - welder 1, SW1 - welder 2).
 * Columns: Dwg Number, Spool Number, SW name, Part 1 size/thickness/heat, Part 2 size/thickness/heat,
 * Fitter name, Fitter date, WPS, Welder name, Welder date, Welding process, Electrode heat number,
 * VT report, MPI report, RT report, UT report.
 */
export function buildExportRows(weldPoints, { pdfFilename, spools, parts = [], personnel, drawingSettings }) {
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
      drawingName,
      spoolName,
      weldNumber,
      part1Size,
      part1Thickness,
      part1Heat,
      part2Size,
      part2Thickness,
      part2Heat,
      fitterName,
      fitterDate,
      wps,
    ];

    const baseMissing = [
      isEmpty(drawingName),
      false,
      isEmpty(weldNumber),
      isEmpty(part1Size),
      isEmpty(part1Thickness),
      isEmpty(part1Heat),
      isEmpty(part2Size),
      isEmpty(part2Thickness),
      isEmpty(part2Heat),
      isEmpty(fitterName),
      isEmpty(fitterDate),
      isEmpty(wps),
    ];

    const records = Array.isArray(w.weldingRecords) && w.weldingRecords.length > 0
      ? w.weldingRecords
      : null;

    if (records && records.length > 0) {
      records.forEach((rec) => {
        const fromIds = (rec.welderIds || [])
          .map((id) => personnel?.welders?.find((x) => x.id === id)?.name)
          .filter(Boolean)
          .join(", ");
        const custom = (rec.welderName || "").trim();
        const welderName = [fromIds, custom].filter(Boolean).join(", ");
        const welderDate = rec.date || "";
        const process = (rec.weldingProcesses || [])[0];
        const weldingProcess = process ? (WELDING_PROCESS_LABELS[process] || process) : "";
        const electrodeHeat = (rec.electrodeNumbers || []).filter(Boolean).join(", ");

        const row = [
          ...baseCols,
          welderName,
          welderDate,
          weldingProcess,
          electrodeHeat,
          ...NDT_METHODS.map((m) => inspectionStatus[m].value),
        ];
        rows.push(row);

        const rowIdx = rows.length - 1;
        baseMissing.forEach((m, c) => { if (m) highlights.push({ r: rowIdx + 1, c }); });
        if (isEmpty(welderName)) highlights.push({ r: rowIdx + 1, c: 12 });
        if (isEmpty(welderDate)) highlights.push({ r: rowIdx + 1, c: 13 });
        if (isEmpty(weldingProcess)) highlights.push({ r: rowIdx + 1, c: 14 });
        if (isEmpty(electrodeHeat)) highlights.push({ r: rowIdx + 1, c: 15 });
        NDT_METHODS.forEach((m, i) => {
          if (inspectionStatus[m].missing) highlights.push({ r: rowIdx + 1, c: NDT_OFFSET + i });
        });
      });
    } else {
      const welderName = "";
      const welderDate = "";
      const weldingProcess = "";
      const electrodeHeat = "";

      const row = [
        ...baseCols,
        welderName,
        welderDate,
        weldingProcess,
        electrodeHeat,
        ...NDT_METHODS.map((m) => inspectionStatus[m].value),
      ];
      rows.push(row);

      const rowIdx = rows.length - 1;
      baseMissing.forEach((m, c) => { if (m) highlights.push({ r: rowIdx + 1, c }); });
      highlights.push({ r: rowIdx + 1, c: 12 });
      highlights.push({ r: rowIdx + 1, c: 13 });
      NDT_METHODS.forEach((m, i) => {
        if (inspectionStatus[m].missing) highlights.push({ r: rowIdx + 1, c: NDT_OFFSET + i });
      });
    }
  });

  return { rows, highlights };
}

/**
 * Export welds to Excel with yellow highlighting for missing cells.
 */
export function exportWeldsToExcel(weldPoints, options) {
  const { pdfFilename, spools, parts, personnel, drawingSettings } = options;
  const { rows, highlights } = buildExportRows(weldPoints, {
    pdfFilename,
    spools,
    parts: parts ?? [],
    personnel,
    drawingSettings,
  });

  const data = [HEADERS, ...rows];
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
