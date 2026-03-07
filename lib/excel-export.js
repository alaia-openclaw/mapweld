import * as XLSX from "xlsx-js-style";
import { NDT_METHODS, WELD_TYPE_LABELS, WELDING_PROCESS_LABELS } from "@/lib/constants";
import { getWeldName } from "@/lib/weld-utils";

const YELLOW_FILL = {
  fill: { patternType: "solid", fgColor: { rgb: "FFFF00" } },
};

function isEmpty(val) {
  return val == null || String(val).trim() === "";
}

function getInspectionStatus(weld, drawingSettings) {
  const ndtRequired = weld.ndtRequired || "auto";
  const overrides = weld.ndtOverrides || {};
  const results = weld.ndtResults || {};
  const ndtRequirements = drawingSettings.ndtRequirements || [];
  const visualInspection = weld.visualInspection || false;

  const fromDrawing = {};
  ndtRequirements.forEach((r) => { fromDrawing[r.method] = true; });
  if (visualInspection) fromDrawing.VT = true;

  const status = {};
  NDT_METHODS.forEach((m) => {
    const isExempt = overrides[m] === "exempt";
    const isRequired = overrides[m] === "required" || (ndtRequired !== "no" && fromDrawing[m]);
    if (ndtRequired === "no" || isExempt || !isRequired) {
      status[m] = { value: "N/A", missing: false };
    } else if (results[m]) {
      status[m] = { value: "OK", missing: false };
    } else {
      status[m] = { value: "", missing: true };
    }
  });
  return status;
}

/**
 * Build export rows: one row per welder record (or one row if no welding records).
 * Each row: drawing, spool, weld#, WPS, type, fitter, date, heat1, heat2, welder+process+electrode, VT, MPI, RT, UT
 */
export function buildExportRows(weldPoints, { pdfFilename, spools, personnel, drawingSettings }) {
  const rows = [];
  const highlights = []; // [{ r, c }] 0-based cell refs to highlight yellow

  weldPoints.forEach((w) => {
    const drawingName = pdfFilename || "";
    const spoolName = spools?.find((s) => s.id === w.spoolId)?.name || "";
    const weldNumber = getWeldName(w, weldPoints);
    const wps = w.wps || "";
    const weldType = WELD_TYPE_LABELS[w.weldType] || w.weldType || "";
    const fitterName = w.fitterName || "";
    const fitterDate = w.dateFitUp || "";
    const heat1 = w.heatNumber1 || "";
    const heat2 = w.heatNumber2 || "";
    const inspectionStatus = getInspectionStatus(w, drawingSettings);

    const records = Array.isArray(w.weldingRecords) && w.weldingRecords.length > 0
      ? w.weldingRecords
      : null;

    const baseCols = [
      drawingName,
      spoolName,
      weldNumber,
      wps,
      weldType,
      fitterName,
      fitterDate,
      heat1,
      heat2,
    ];

    const baseMissing = [
      isEmpty(drawingName),
      false, // spool can be empty
      isEmpty(weldNumber),
      isEmpty(wps),
      isEmpty(weldType),
      isEmpty(fitterName),
      isEmpty(fitterDate),
      isEmpty(heat1),
      isEmpty(heat2),
    ];

    if (records && records.length > 0) {
      records.forEach((rec) => {
        const fromIds = (rec.welderIds || [])
          .map((id) => personnel?.welders?.find((x) => x.id === id)?.name)
          .filter(Boolean)
          .join(", ");
        const custom = (rec.welderName || "").trim();
        const welderNames = [fromIds, custom].filter(Boolean).join(", ");
        const process = (rec.weldingProcesses || [])[0];
        const processLabel = process ? (WELDING_PROCESS_LABELS[process] || process) : "";
        const electrode = (rec.electrodeNumbers || []).filter(Boolean).join(", ");
        const welderDetail = [welderNames, processLabel, electrode].filter(Boolean).join(", ");
        const dateWelded = rec.date || "";

        const welderMissing = isEmpty(welderDetail) || isEmpty(dateWelded);

        const row = [
          ...baseCols,
          welderDetail,
          ...NDT_METHODS.map((m) => inspectionStatus[m].value),
        ];
        rows.push(row);

        const rowIdx = rows.length - 1;
        baseMissing.forEach((m, c) => { if (m) highlights.push({ r: rowIdx + 1, c }); });
        if (welderMissing) highlights.push({ r: rowIdx + 1, c: 9 });
        NDT_METHODS.forEach((m, i) => {
          if (inspectionStatus[m].missing) highlights.push({ r: rowIdx + 1, c: 10 + i });
        });
      });
    } else {
      const welderIds = w.welderIds || [];
      const welderNames = personnel?.welders?.length
        ? welderIds.map((id) => personnel.welders.find((x) => x.id === id)?.name).filter(Boolean).join(", ")
        : w.welderName || "";
      const process = (w.weldingProcesses || [])[0];
      const processLabel = process ? (WELDING_PROCESS_LABELS[process] || process) : "";
      const electrode = Array.isArray(w.electrodeNumbers) ? w.electrodeNumbers.filter(Boolean).join(", ") : "";
      const welderDetail = [welderNames, processLabel, electrode].filter(Boolean).join(", ");
      const dateWelded = w.weldingDate || "";
      const welderMissing = isEmpty(welderDetail) || isEmpty(dateWelded);

      const row = [
        ...baseCols,
        welderDetail,
        ...NDT_METHODS.map((m) => inspectionStatus[m].value),
      ];
      rows.push(row);

      const rowIdx = rows.length - 1;
      baseMissing.forEach((m, c) => { if (m) highlights.push({ r: rowIdx + 1, c }); });
      if (welderMissing) highlights.push({ r: rowIdx + 1, c: 9 });
      NDT_METHODS.forEach((m, i) => {
        if (inspectionStatus[m].missing) highlights.push({ r: rowIdx + 1, c: 10 + i });
      });
    }
  });

  return { rows, highlights };
}

/**
 * Export welds to Excel with yellow highlighting for missing cells.
 */
export function exportWeldsToExcel(weldPoints, options) {
  const { pdfFilename, spools, personnel, drawingSettings } = options;
  const { rows, highlights } = buildExportRows(weldPoints, {
    pdfFilename,
    spools,
    personnel,
    drawingSettings,
  });

  const headers = [
    "Drawing Name",
    "Spool Name",
    "Weld Number",
    "WPS",
    "Weld Type",
    "Fitter Name",
    "Fitter Date",
    "Heat #1",
    "Heat #2",
    "Welder, Process, Electrode",
    ...NDT_METHODS,
  ];

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
