import { jsPDF } from "jspdf";
import { NDT_METHOD_LABELS, NDT_REQUEST_STATUS_LABELS } from "@/lib/constants";
import { getWeldName } from "@/lib/weld-utils";
import { getResolvedWpsCode } from "@/lib/wps-resolution";
import { getWeldLineId } from "@/lib/ndt-resolution";
import { getEffectiveJointSide } from "@/lib/joint-dimensions";

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function drawingLabelForWeld(weld, drawings = []) {
  const drawing = drawings.find((d) => d.id === weld?.drawingId);
  const file = (drawing?.filename || "").trim() || (drawing?.title || "").trim();
  return file || "—";
}

function getPartDescription(part) {
  if (!part) return "";
  const pieces = [];
  if (part.partType) pieces.push(String(part.partType).trim());
  if (part.variation) pieces.push(String(part.variation).trim());
  return pieces.filter(Boolean).join(", ");
}

function getWeldingDetails(weld, personnel = {}) {
  const records = Array.isArray(weld?.weldingRecords) ? weld.weldingRecords : [];
  if (records.length > 0) {
    return records
      .map((record) => {
        const namesFromIds = (record.welderIds || [])
          .map((id) => personnel?.welders?.find((welder) => welder.id === id)?.name)
          .filter(Boolean)
          .join(", ");
        const customName = (record.welderName || "").trim();
        const welderNames = [namesFromIds, customName].filter(Boolean).join(", ") || "—";
        const process = (record.weldingProcesses || []).filter(Boolean).join(", ") || "—";
        const electrodes = (record.electrodeNumbers || []).filter(Boolean).join(", ") || "—";
        const date = (record.date || "").trim() || "—";
        return `${welderNames} | ${process} | ${electrodes} | ${date}`;
      })
      .join(" ; ");
  }

  const fallbackNames = (weld?.welderIds || [])
    .map((id) => personnel?.welders?.find((welder) => welder.id === id)?.name)
    .filter(Boolean)
    .join(", ");
  const fallbackName = fallbackNames || (weld?.welderName || "").trim() || "—";
  const fallbackProcess = (weld?.weldingProcesses || []).filter(Boolean).join(", ") || "—";
  const fallbackElectrodes = (weld?.electrodeNumbers || []).filter(Boolean).join(", ") || "—";
  const fallbackDate = (weld?.weldingDate || "").trim() || "—";
  return `${fallbackName} | ${fallbackProcess} | ${fallbackElectrodes} | ${fallbackDate}`;
}

function collectDrawingSummary(welds, drawings) {
  const names = [...new Set(welds.map((w) => drawingLabelForWeld(w, drawings)).filter(Boolean))];
  if (names.length === 0) return "—";
  if (names.length <= 2) return names.join(", ");
  return `${names.slice(0, 2).join(", ")} +${names.length - 2} more`;
}

function buildNdtRequestRows(request, options) {
  const {
    weldPoints = [],
    parts = [],
    drawings = [],
    lines = [],
    systems = [],
    spools = [],
    personnel = {},
    drawingSettings = {},
  } = options || {};
  const welds = (request?.weldIds || [])
    .map((id) => weldPoints.find((w) => w.id === id))
    .filter(Boolean);
  return welds.map((weld, idx) => {
    const spool = (spools || []).find((s) => s.id === weld.spoolId) || null;
    const lineId = getWeldLineId(weld, spools || []);
    const line = lineId ? (lines || []).find((l) => l.id === lineId) : null;
    const system = line?.systemId ? (systems || []).find((s) => s.id === line.systemId) : null;
    const part1 = (parts || []).find((p) => p.id === weld.partId1) || null;
    const part2 = (parts || []).find((p) => p.id === weld.partId2) || null;
    const eff1 = getEffectiveJointSide(weld, part1, 1);
    const eff2 = getEffectiveJointSide(weld, part2, 2);
    const heat1 = (part1?.heatNumber ?? weld.heatNumber1 ?? "").trim() || "—";
    const heat2 = (part2?.heatNumber ?? weld.heatNumber2 ?? "").trim() || "—";
    const wps = getResolvedWpsCode(weld, systems, lines, spools, drawingSettings) || (weld.wps || "—");
    const drawing = drawingLabelForWeld(weld, drawings);
    const page = weld.pageNumber != null ? String((weld.pageNumber ?? 0) + 1) : "—";
    return {
      sn: idx + 1,
      line: line?.name || "—",
      system: system?.name || "—",
      drawing,
      page,
      spool: spool?.name || spool?.id || "—",
      weld: getWeldName(weld, weldPoints) || "—",
      part1: `${eff1.nps || "—"} / ${eff1.schedule || "—"} · ${getPartDescription(part1) || "—"}`,
      heat1,
      part2: `${eff2.nps || "—"} / ${eff2.schedule || "—"} · ${getPartDescription(part2) || "—"}`,
      heat2,
      wps: wps || "—",
      weldingDetails: getWeldingDetails(weld, personnel),
    };
  });
}

function requestFileName(request) {
  const requestNo = (request?.title || request?.id || "NDT").replace(/\s+/g, "-");
  return `NDT-Request-${request?.method || "NDT"}-${requestNo}.pdf`;
}

export function buildNdtRequestPdfBlob(request, options = {}) {
  const {
    weldPoints = [],
    drawings = [],
  } = options;
  // #region agent log
  fetch("http://127.0.0.1:7422/ingest/05cf4936-8dd3-4ab1-89bc-af4409f2819b",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"85b471"},body:JSON.stringify({sessionId:"85b471",runId:"run-ndt-request-pdf",hypothesisId:"H5",location:"lib/ndt-request-pdf.js:buildNdtRequestPdfBlob:start",message:"Entered buildNdtRequestPdfBlob",data:{requestId:request?.id||null,method:request?.method||null,weldIdsCount:(request?.weldIds||[]).length,weldPointsCount:(weldPoints||[]).length,drawingsCount:(drawings||[]).length},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  const rows = buildNdtRequestRows(request, options);
  const welds = (request?.weldIds || [])
    .map((id) => weldPoints.find((w) => w.id === id))
    .filter(Boolean);

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 10;
  const cellPad = 1.4;
  const lineH = 3.6;
  const minRowH = 6;

  const cols = [
    { key: "sn", label: "S/N", width: 9 },
    { key: "line", label: "Line", width: 18 },
    { key: "system", label: "System", width: 18 },
    { key: "drawing", label: "Drawing", width: 28 },
    { key: "page", label: "Pg", width: 8 },
    { key: "spool", label: "Spool", width: 18 },
    { key: "weld", label: "Weld", width: 13 },
    { key: "part1", label: "Part 1 (size/sch/desc)", width: 44 },
    { key: "heat1", label: "Heat 1", width: 16 },
    { key: "part2", label: "Part 2 (size/sch/desc)", width: 34 },
    { key: "heat2", label: "Heat 2", width: 16 },
    { key: "wps", label: "WPS", width: 12 },
    { key: "weldingDetails", label: "Welding details (welder | process | electrode | date)", width: 40 },
  ];

  function drawHeaderBlock() {
    let y = margin;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("NDT REQUEST FORM", margin, y);
    doc.setFontSize(9);
    doc.text("MapWeld", pageW - margin, y, { align: "right" });
    y += 5;
    doc.setDrawColor(120);
    doc.line(margin, y, pageW - margin, y);
    y += 5;

    const method = NDT_METHOD_LABELS[request?.method] || request?.method || "—";
    const requestNo = request?.title || request?.id || "—";
    const createdDate = formatDate(request?.createdAt);
    const exportedDate = formatDate(new Date().toISOString());
    const status = NDT_REQUEST_STATUS_LABELS[request?.status] || request?.status || "Draft";
    const drawingScope = collectDrawingSummary(welds, drawings);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    const left = [
      ["Request No", requestNo],
      ["Method", method],
      ["Status", status],
      ["Request date", createdDate],
      ["Export date", exportedDate],
    ];
    const right = [
      ["Weld count", String(rows.length)],
      ["Drawing scope", drawingScope],
    ];
    left.forEach(([k, v], i) => {
      const yy = y + i * 4.4;
      doc.setFont("helvetica", "bold");
      doc.text(`${k}:`, margin, yy);
      doc.setFont("helvetica", "normal");
      doc.text(v || "—", margin + 24, yy);
    });
    right.forEach(([k, v], i) => {
      const yy = y + i * 4.4;
      doc.setFont("helvetica", "bold");
      doc.text(`${k}:`, margin + 110, yy);
      doc.setFont("helvetica", "normal");
      doc.text(v || "—", margin + 136, yy);
    });
    return y + 23;
  }

  function drawTableHeader(y) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.4);
    let x = margin;
    cols.forEach((col) => {
      doc.rect(x, y, col.width, minRowH);
      doc.text(col.label, x + cellPad, y + 4);
      x += col.width;
    });
    return y + minRowH;
  }

  function cellLines(text, colWidth) {
    const maxW = Math.max(5, colWidth - cellPad * 2);
    const lines = doc.splitTextToSize(String(text || "—"), maxW);
    return lines?.length ? lines : ["—"];
  }

  let y = drawHeaderBlock();
  y = drawTableHeader(y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  for (const row of rows) {
    const prepared = cols.map((col) => cellLines(row[col.key], col.width));
    const rowH = Math.max(
      minRowH,
      prepared.reduce((max, lines) => Math.max(max, lines.length * lineH + 1.8), 0)
    );
    if (y + rowH > pageH - margin) {
      doc.addPage();
      y = margin;
      y = drawTableHeader(y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.2);
    }
    let x = margin;
    prepared.forEach((lines, idx) => {
      const w = cols[idx].width;
      doc.rect(x, y, w, rowH);
      lines.forEach((line, i) => {
        doc.text(line, x + cellPad, y + 3.6 + i * lineH);
      });
      x += w;
    });
    y += rowH;
  }

  // #region agent log
  fetch("http://127.0.0.1:7422/ingest/05cf4936-8dd3-4ab1-89bc-af4409f2819b",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"85b471"},body:JSON.stringify({sessionId:"85b471",runId:"run-ndt-request-pdf",hypothesisId:"H2",location:"lib/ndt-request-pdf.js:buildNdtRequestPdfBlob:success",message:"Built NDT PDF document successfully",data:{requestId:request?.id||null,rowCount:rows.length,pageCount:doc.getNumberOfPages()},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  return doc.output("blob");
}

export function generateNdtRequestPdf(request, options = {}) {
  const blob = buildNdtRequestPdfBlob(request, options);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = requestFileName(request);
  a.click();
  URL.revokeObjectURL(url);
}
