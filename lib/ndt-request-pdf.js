/**
 * Generate NDT Request Form as PDF.
 * Uses jsPDF for client-side PDF generation.
 */

import { jsPDF } from "jspdf";
import { WELD_TYPE_LABELS, WELDING_PROCESS_LABELS, NDT_METHOD_LABELS } from "@/lib/constants";
import { getWeldName } from "@/lib/weld-utils";

function partSummary(part) {
  if (!part) return "—";
  const parts = [];
  if (part.partType) parts.push(part.partType);
  if (part.nps) parts.push(part.nps);
  if (part.thickness) parts.push(`– ${part.thickness}`);
  return parts.length ? parts.join(" ") : "—";
}

function welderInfo(weld, personnel) {
  const records = Array.isArray(weld.weldingRecords) && weld.weldingRecords.length > 0
    ? weld.weldingRecords
    : null;
  if (records && records.length > 0) {
    return records.map((rec) => {
      const fromIds = (rec.welderIds || [])
        .map((id) => personnel?.welders?.find((x) => x.id === id)?.name)
        .filter(Boolean)
        .join(", ");
      const custom = (rec.welderName || "").trim();
      const welderNames = [fromIds, custom].filter(Boolean).join(", ");
      const process = (rec.weldingProcesses || [])[0];
      const processLabel = process ? (WELDING_PROCESS_LABELS[process] || process) : "";
      const electrode = (rec.electrodeNumbers || []).filter(Boolean).join(", ");
      const date = rec.date || "";
      return [welderNames, processLabel, electrode, date].filter(Boolean).join(", ");
    }).join(" | ");
  }
  const welderIds = weld.welderIds || [];
  const welderNames = personnel?.welders?.length
    ? welderIds.map((id) => personnel.welders.find((x) => x.id === id)?.name).filter(Boolean).join(", ")
    : weld.welderName || "";
  const process = (weld.weldingProcesses || [])[0];
  const processLabel = process ? (WELDING_PROCESS_LABELS[process] || process) : "";
  const electrode = Array.isArray(weld.electrodeNumbers) ? weld.electrodeNumbers.filter(Boolean).join(", ") : "";
  const date = weld.weldingDate || "";
  return [welderNames, processLabel, electrode, date].filter(Boolean).join(", ") || "—";
}

/**
 * Build weld rows for the NDT request table.
 * One row per weld (not per welding record like Excel).
 */
function buildNdtRequestRows(request, weldPoints, parts, spools, pdfFilename, personnel) {
  const welds = (request.weldIds || [])
    .map((id) => weldPoints.find((w) => w.id === id))
    .filter(Boolean);
  return welds.map((w, i) => {
    const spoolName = spools?.find((s) => s.id === w.spoolId)?.name || "";
    const part1 = parts?.find((p) => p.id === w.partId1);
    const part2 = parts?.find((p) => p.id === w.partId2);
    const weldType = WELD_TYPE_LABELS[w.weldType] || w.weldType || "";
    return {
      sn: i + 1,
      drawing: pdfFilename || "—",
      spool: spoolName || "—",
      weldNumber: getWeldName(w, weldPoints) || "—",
      part1: partSummary(part1),
      part2: partSummary(part2),
      weldType,
      welder: welderInfo(w, personnel) || "—",
      comments: "",
    };
  });
}

/**
 * Generate and download NDT Request Form as PDF.
 */
export function generateNdtRequestPdf(request, options) {
  const {
    weldPoints = [],
    parts = [],
    spools = [],
    pdfFilename = "",
    personnel = {},
  } = options;

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = margin;
  const lineH = 6;
  const fontSmall = 9;
  const fontNorm = 10;
  const fontTitle = 16;

  // Header: MapWeld branding + title
  doc.setFontSize(fontTitle);
  doc.setFont("helvetica", "bold");
  doc.text("MapWeld", margin, y);
  doc.text("NDT REQUEST FORM", pageW - margin, y, { align: "right" });
  y += lineH + 4;

  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // Top section
  const methodLabel = NDT_METHOD_LABELS[request.method] || request.method || "";
  const dateRequested = new Date().toISOString().slice(0, 10);
  const requestNo = request.title || request.id?.slice(-8) || `REQ-${Date.now().toString(36).toUpperCase()}`;

  doc.setFontSize(fontNorm);
  doc.setFont("helvetica", "normal");
  doc.text("Drawing:", margin, y);
  doc.text(pdfFilename || "—", margin + 35, y);
  doc.text("Date requested:", margin + 90, y);
  doc.text(dateRequested, margin + 125, y);
  y += lineH;

  doc.text("Request No:", margin, y);
  doc.text(requestNo, margin + 35, y);
  doc.text("Testing Type:", margin + 90, y);
  doc.text(methodLabel, margin + 125, y);
  y += lineH + 6;

  // Main section: Weld map table — full width, auto row height from wrapped text
  const rows = buildNdtRequestRows(request, weldPoints, parts, spools, pdfFilename, personnel);
  const headers = ["S/N", "Drawing", "Spool", "Weld No", "Part 1", "Part 2", "Weld Type", "Welder Info", "Comments"];
  const tableX = margin;
  const tableW = pageW - 2 * margin;
  const cellPad = 2;
  const minRowH = 6;
  const lineHeight = 4;
  const colCount = headers.length;
  const colWidth = tableW / colCount;

  const rawRows = rows.map((row) => [
    String(row.sn),
    row.drawing || "—",
    row.spool || "—",
    row.weldNumber || "—",
    row.part1 || "—",
    row.part2 || "—",
    row.weldType || "—",
    row.welder || "—",
    row.comments || "—",
  ]);

  function getCellLines(text) {
    const w = Math.max(5, colWidth - cellPad * 2);
    return doc.splitTextToSize(String(text || "—"), w) || ["—"];
  }

  let tableBottomY = y;
  doc.setFontSize(fontSmall);

  // Header row
  doc.setFont("helvetica", "bold");
  let rowY = y + minRowH;
  headers.forEach((h, i) => {
    doc.text(h, tableX + i * colWidth + cellPad, y + 4);
  });
  doc.setDrawColor(0);
  doc.line(tableX, y, tableX + tableW, y);
  doc.line(tableX, rowY, tableX + tableW, rowY);
  for (let c = 0; c <= colCount; c++) {
    doc.line(tableX + c * colWidth, y, tableX + c * colWidth, rowY);
  }
  tableBottomY = rowY;
  y = rowY;

  // Data rows with dynamic height
  doc.setFont("helvetica", "normal");
  rawRows.forEach((cellData) => {
    const rowTop = y;
    let maxLines = 1;
    const lineArrays = cellData.map((text) => {
      const lines = getCellLines(text);
      if (lines.length > maxLines) maxLines = lines.length;
      return lines;
    });
    const rowH = Math.max(minRowH, maxLines * lineHeight);
    cellData.forEach((text, i) => {
      const lines = lineArrays[i];
      const cellX = tableX + i * colWidth + cellPad;
      lines.forEach((line, li) => {
        doc.text(line, cellX, y + 4 + li * lineHeight);
      });
    });
    y += rowH;
    doc.line(tableX, rowTop, tableX + tableW, rowTop);
    doc.line(tableX, y, tableX + tableW, y);
    for (let c = 0; c <= colCount; c++) {
      doc.line(tableX + c * colWidth, rowTop, tableX + c * colWidth, y);
    }
    tableBottomY = y;
  });
  y = tableBottomY;

  y += 10;

  // Bottom section: Signature (Requested By only)
  if (y + 30 > pageH - margin) {
    doc.addPage();
    y = margin;
  }
  doc.setFontSize(fontNorm);
  doc.setFont("helvetica", "bold");
  doc.text("Requested By:", margin, y);
  y += lineH + 8;
  doc.setFont("helvetica", "normal");
  doc.line(margin, y, margin + 60, y);
  doc.setFontSize(fontSmall);
  doc.text("Name", margin, y + 2);
  y += 12;
  doc.line(margin, y, margin + 60, y);
  doc.text("Sign.", margin, y + 2);
  y += 12;
  doc.line(margin, y, margin + 60, y);
  doc.text("Date", margin, y + 2);

  const filename = `NDT-Request-${request.method || "NDT"}-${requestNo.replace(/\s/g, "-")}.pdf`;
  doc.save(filename);
}
