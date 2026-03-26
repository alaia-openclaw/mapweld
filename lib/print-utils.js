import { buildExportRows, buildWeldsSheetHeaders } from "./excel-export";
import { jsPDF } from "jspdf";
import { getWeldName, computeNdtSelection } from "./weld-utils";
import {
  getWeldPipelineStage,
  WELD_PIPELINE_STAGES,
  SPOOL_LIFECYCLE_STAGES,
  normalizeSpoolLifecycleStage,
} from "./status-utils";
import { WELD_TYPE_LABELS, WELD_LOCATION_LABELS } from "./constants";

function createPrintStyles() {
  return `
    @media print {
      @page { margin: 1.5cm; }
      body { font-family: system-ui, sans-serif; }
      .print-page { page-break-after: always; }
      .print-page:last-child { page-break-after: auto; }
      .print-hide { display: none !important; }
    }
    @media screen {
      body { padding: 1rem; max-width: 900px; margin: 0 auto; }
      .print-page { margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px dashed #ccc; }
    }
  `;
}

function createPdfSectionStyles() {
  return `
    .print-page-pdf { page-break-after: always; }
    .print-page-pdf .print-content { text-align: center; }
    .print-page-pdf img { max-width: 100%; height: auto; }
    .print-page-pdf h2 { font-size: 14px; margin-bottom: 0.5rem; }
  `;
}

function createWeldMapSectionStyles() {
  return `
    .print-page-weldmap { page-break-after: always; }
    .print-page-weldmap h2 { font-size: 14px; margin-bottom: 0.5rem; }
    .print-page-weldmap table { border-collapse: collapse; width: 100%; font-size: 9px; }
    .print-page-weldmap th, .print-page-weldmap td { border: 1px solid #333; padding: 3px 5px; text-align: left; }
    .print-page-weldmap th { background: #e5e5e5; font-weight: 600; }
  `;
}

function createProgressSectionStyles() {
  return `
    .print-page-progress { page-break-after: always; }
    .print-page-progress h2 { font-size: 14px; margin-bottom: 0.5rem; }
    .print-page-progress h3 { font-size: 12px; margin-top: 1rem; }
    .print-page-progress table { border-collapse: collapse; width: 100%; font-size: 11px; }
    .print-page-progress th, .print-page-progress td { border: 1px solid #333; padding: 4px 6px; }
    .print-page-progress th { background: #e5e5e5; }
  `;
}

function createSummarySectionStyles() {
  return `
    .print-page-summary { page-break-after: always; }
    .print-page-summary h2 { font-size: 14px; margin-bottom: 0.5rem; }
    .print-page-summary .stats { font-size: 11px; }
  `;
}

function buildWeldMapHtml(weldPoints, { pdfFilename, spools, parts = [], personnel, drawingSettings, ndtContext = null, drawings = [] }) {
  if (!weldPoints?.length) return "<p>No welds.</p>";
  const { rows, maxWelders, ndtMethods } = buildExportRows(weldPoints, {
    pdfFilename,
    spools: spools ?? [],
    parts,
    personnel,
    drawingSettings,
    ndtContext,
    drawings,
  });

  const allHeaders = buildWeldsSheetHeaders(maxWelders, ndtMethods);
  let html = "<table><thead>";
  html += "<tr>";
  allHeaders.forEach((h) => {
    html += `<th>${escapeHtml(String(h))}</th>`;
  });
  html += "</tr></thead><tbody>";

  rows.forEach((row) => {
    html += "<tr>";
    row.forEach((cell) => {
      html += `<td>${escapeHtml(String(cell ?? ""))}</td>`;
    });
    html += "</tr>";
  });
  html += "</tbody></table>";
  return html;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildProjectProgressHtml(weldPoints, spools, drawingSettings, getWeldName, ndtContext = null) {
  const safeWelds = Array.isArray(weldPoints) ? weldPoints : [];
  const safeSpools = Array.isArray(spools) ? spools : [];

  const weldByStage = Object.fromEntries(WELD_PIPELINE_STAGES.map((c) => [c.id, []]));
  safeWelds.forEach((w) => {
    const ndtSel = computeNdtSelection(w, drawingSettings, safeWelds, ndtContext);
    const stage = getWeldPipelineStage(w, ndtSel, ndtContext);
    const name = getWeldName?.(w, safeWelds) ?? w.id;
    if (weldByStage[stage]) weldByStage[stage].push({ ...w, displayName: name });
  });

  const spoolByStage = Object.fromEntries(SPOOL_LIFECYCLE_STAGES.map((c) => [c.id, []]));
  safeSpools.forEach((s) => {
    const stage = normalizeSpoolLifecycleStage(s.lifecycleStage);
    const name = (s.name || "").trim() || s.id;
    if (spoolByStage[stage]) spoolByStage[stage].push({ ...s, displayName: name });
  });

  let weldCompleted = 0;
  let spoolShipped = 0;
  WELD_PIPELINE_STAGES.forEach((c) => {
    if (c.id === "completed") weldCompleted = (weldByStage[c.id] || []).length;
  });
  SPOOL_LIFECYCLE_STAGES.forEach((c) => {
    if (c.id === "shipped") spoolShipped = (spoolByStage[c.id] || []).length;
  });
  const weldTotal = safeWelds.length;
  const spoolTotal = safeSpools.length;
  const weldProgress = weldTotal > 0 ? Math.round((weldCompleted / weldTotal) * 100) : 0;
  const spoolProgress = spoolTotal > 0 ? Math.round((spoolShipped / spoolTotal) * 100) : 0;
  const combined =
    weldTotal + spoolTotal > 0
      ? Math.round(
          ((weldCompleted + spoolShipped) / Math.max(1, weldTotal + spoolTotal)) * 100
        )
      : 0;

  let html = "";
  html += "<h2>Project progress</h2>";
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;margin-bottom:1rem;">';
  html += `<div><strong>Overall</strong><br/>${combined}%</div>`;
  html += `<div><strong>Welds</strong><br/>${weldCompleted}/${weldTotal} (${weldProgress}%)</div>`;
  html += `<div><strong>Spools</strong><br/>${spoolShipped}/${spoolTotal} (${spoolProgress}%)</div>`;
  html += "</div>";

  html += "<h3 style='font-size:12px;margin-top:1rem'>Weld pipeline</h3>";
  html += "<table><thead><tr><th>Stage</th><th>Count</th></tr></thead><tbody>";
  WELD_PIPELINE_STAGES.forEach((c) => {
    const count = (weldByStage[c.id] || []).length;
    html += `<tr><td>${escapeHtml(c.label)}</td><td>${count}</td></tr>`;
  });
  html += "</tbody></table>";

  html += "<h3 style='font-size:12px;margin-top:1rem'>Spool lifecycle</h3>";
  html += "<table><thead><tr><th>Stage</th><th>Count</th></tr></thead><tbody>";
  SPOOL_LIFECYCLE_STAGES.forEach((c) => {
    const count = (spoolByStage[c.id] || []).length;
    html += `<tr><td>${escapeHtml(c.label)}</td><td>${count}</td></tr>`;
  });
  html += "</tbody></table>";
  return html;
}

function buildProjectSummaryHtml(weldPoints, weldStatusByWeldId, drawingSettings, spools) {
  const total = weldPoints.length;
  let complete = 0;
  let incomplete = 0;
  let notStarted = 0;
  const byLocation = { shop: 0, field: 0 };
  const byType = {};

  weldPoints.forEach((w) => {
    const status = weldStatusByWeldId.get(w.id);
    if (status === "complete") complete++;
    else if (status === "incomplete") incomplete++;
    else notStarted++;

    const loc = w.weldLocation || "shop";
    byLocation[loc] = (byLocation[loc] || 0) + 1;
    const type = w.weldType || "butt";
    byType[type] = (byType[type] || 0) + 1;
  });

  const progressPct = total > 0 ? Math.round((complete / total) * 100) : 0;

  let html = "";
  html += "<h2>Project weld summary</h2>";
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:1rem;">';
  html += `<div><strong>Total welds</strong><br/>${total}</div>`;
  html += `<div><strong>Progress</strong><br/>${progressPct}% (${complete} complete, ${incomplete} incomplete, ${notStarted} not started)</div>`;
  html += `<div><strong>Location</strong><br/>${WELD_LOCATION_LABELS.shop || "Shop"}: ${byLocation.shop || 0}, ${WELD_LOCATION_LABELS.field || "Field"}: ${byLocation.field || 0}</div>`;
  if (spools?.length > 0) {
    const assigned = weldPoints.filter((w) => w.spoolId).length;
    html += `<div><strong>Spools</strong><br/>${spools.length} (${assigned} welds assigned)</div>`;
  }
  html += "</div>";

  if (Object.keys(byType).length > 0) {
    html += "<p style='margin-top:0.5rem'><strong>By type:</strong> ";
    html += Object.entries(byType)
      .sort((a, b) => b[1] - a[1])
      .map(([t, c]) => `${WELD_TYPE_LABELS[t] || t} ${c}`)
      .join(", ");
    html += "</p>";
  }
  return html;
}

export async function runPrint({
  pdfDrawing,
  markers,
  weldMap,
  projectProgress,
  projectSummary,
  pdfBlob,
  pdfFilename,
  weldPoints,
  spools,
  parts,
  personnel,
  drawingSettings,
  weldStatusByWeldId,
  getWeldName,
  ndtContext = null,
  drawings = [],
  currentPage = 1,
  markerLayers = { welds: true, spools: true, parts: true, lines: true },
  spoolMarkers = [],
  lineMarkers = [],
  partMarkers = [],
}) {
  function pctToPx(value, size) {
    return (Math.max(0, Math.min(100, Number(value) || 0)) / 100) * size;
  }

  function drawMarkerLabel(ctx, { x, y, text, fill = "#2563eb", fontSize = 12 }) {
    const padX = 8;
    const padY = 5;
    ctx.font = `600 ${fontSize}px Arial`;
    const textW = Math.max(10, ctx.measureText(text).width);
    const w = textW + padX * 2;
    const h = fontSize + padY * 2;
    const rx = x - w / 2;
    const ry = y - h / 2;
    const r = 8;
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(rx + r, ry);
    ctx.lineTo(rx + w - r, ry);
    ctx.quadraticCurveTo(rx + w, ry, rx + w, ry + r);
    ctx.lineTo(rx + w, ry + h - r);
    ctx.quadraticCurveTo(rx + w, ry + h, rx + w - r, ry + h);
    ctx.lineTo(rx + r, ry + h);
    ctx.quadraticCurveTo(rx, ry + h, rx, ry + h - r);
    ctx.lineTo(rx, ry + r);
    ctx.quadraticCurveTo(rx, ry, rx + r, ry);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y + 0.5);
  }

  function drawLine(ctx, x1, y1, x2, y2, color, width = 1.6) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  function drawDot(ctx, x, y, color, radius = 2.5) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawOverlayFromData(baseCanvas) {
    if (!baseCanvas) return null;
    const out = document.createElement("canvas");
    out.width = baseCanvas.width;
    out.height = baseCanvas.height;
    const ctx = out.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(baseCanvas, 0, 0);

    const pageIndex = Math.max(0, (Number(currentPage) || 1) - 1);
    const lines = ndtContext?.lines || [];

    if (markerLayers?.welds !== false) {
      (weldPoints || [])
        .filter((w) => (w.pageNumber ?? 0) === pageIndex)
        .forEach((w) => {
          const wx = pctToPx(w.xPercent, out.width);
          const wy = pctToPx(w.yPercent, out.height);
          const ix = pctToPx(w.indicatorXPercent ?? w.xPercent, out.width);
          const iy = pctToPx(w.indicatorYPercent ?? w.yPercent, out.height);
          const bx = pctToPx(
            w.lineBendXPercent != null ? w.lineBendXPercent : (w.indicatorXPercent ?? w.xPercent + w.xPercent) / 2,
            out.width
          );
          const by = pctToPx(
            w.lineBendYPercent != null ? w.lineBendYPercent : (w.indicatorYPercent ?? w.yPercent + w.yPercent) / 2,
            out.height
          );
          const color = (w.weldLocation || "shop") === "field" ? "#ef4444" : "#22c55e";
          drawLine(ctx, ix, iy, bx, by, color);
          drawLine(ctx, bx, by, wx, wy, color);
          drawDot(ctx, wx, wy, color, 2.2);
          drawMarkerLabel(ctx, { x: ix, y: iy, text: getWeldName?.(w, weldPoints) || "Weld", fill: color, fontSize: 11 });
        });
    }

    if (markerLayers?.spools !== false) {
      (spoolMarkers || [])
        .filter((m) => (m.pageNumber ?? 0) === pageIndex)
        .forEach((m) => {
          const wx = pctToPx(m.xPercent, out.width);
          const wy = pctToPx(m.yPercent, out.height);
          const ix = pctToPx(m.indicatorXPercent ?? m.xPercent, out.width);
          const iy = pctToPx(m.indicatorYPercent ?? m.yPercent, out.height);
          drawLine(ctx, ix, iy, wx, wy, "#06b6d4");
          drawDot(ctx, wx, wy, "#06b6d4", 2);
          const spoolName = spools?.find((s) => s.id === m.spoolId)?.name || "Spool";
          drawMarkerLabel(ctx, { x: ix, y: iy, text: spoolName, fill: "#06b6d4", fontSize: 10 });
        });
    }

    if (markerLayers?.parts !== false) {
      (partMarkers || [])
        .filter((m) => (m.pageNumber ?? 0) === pageIndex)
        .forEach((m) => {
          const wx = pctToPx(m.xPercent, out.width);
          const wy = pctToPx(m.yPercent, out.height);
          const ix = pctToPx(m.indicatorXPercent ?? m.xPercent, out.width);
          const iy = pctToPx(m.indicatorYPercent ?? m.yPercent, out.height);
          drawLine(ctx, ix, iy, wx, wy, "#f59e0b");
          drawDot(ctx, wx, wy, "#f59e0b", 2);
          const num = parts?.find((p) => p.id === m.partId)?.displayNumber;
          drawMarkerLabel(ctx, { x: ix, y: iy, text: String(num ?? "Part"), fill: "#f59e0b", fontSize: 10 });
        });
    }

    if (markerLayers?.lines !== false) {
      (lineMarkers || [])
        .filter((m) => (m.pageNumber ?? 0) === pageIndex)
        .forEach((m) => {
          const wx = pctToPx(m.xPercent, out.width);
          const wy = pctToPx(m.yPercent, out.height);
          const ix = pctToPx(m.indicatorXPercent ?? m.xPercent, out.width);
          const iy = pctToPx(m.indicatorYPercent ?? m.yPercent, out.height);
          drawLine(ctx, ix, iy, wx, wy, "#3b82f6");
          drawDot(ctx, wx, wy, "#3b82f6", 2);
          const lineName = lines?.find((l) => l.id === m.lineId)?.name || "Line";
          drawMarkerLabel(ctx, { x: ix, y: iy, text: lineName, fill: "#3b82f6", fontSize: 10 });
        });
    }

    return out;
  }

  async function exportDrawingAsPdf() {
    const target = document.querySelector("[data-print-target='pdf-with-overlays']");
    if (!target) return false;
    document.body.classList.add("print-capture-active");
    try {
      const { default: html2canvas } = await import("html2canvas");
      // Let React flush marker-layer updates before capture.
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      async function capture(node, useIgnore) {
        return html2canvas(node, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: "#fff",
          ignoreElements: useIgnore ? (el) => el.closest("[data-print-hide]") !== null : undefined,
        });
      }

      let canvas = null;
      try {
        canvas = await capture(target, true);
      } catch (primaryError) {
        const fallbackTarget = target.parentElement || target;
        canvas = await capture(fallbackTarget, false);
        console.warn("Primary overlay capture failed; used fallback target.", primaryError);
      }
      const basePdfCanvas = target.querySelector("canvas");
      if (!canvas || !canvas.width || !canvas.height) canvas = drawOverlayFromData(basePdfCanvas);
      else if ((!target.querySelector("[data-print-marker]") || target.querySelectorAll("[data-print-marker]").length === 0) && basePdfCanvas) {
        const manual = drawOverlayFromData(basePdfCanvas);
        if (manual) canvas = manual;
      }
      if (!canvas) return false;
      const imageData = canvas.toDataURL("image/png");
      const imageWidth = canvas.width;
      const imageHeight = canvas.height;
      const isLandscape = imageWidth >= imageHeight;
      const doc = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: isLandscape ? "landscape" : "portrait",
      });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 8;
      const maxW = pageW - margin * 2;
      const maxH = pageH - margin * 2;
      const ratio = Math.min(maxW / imageWidth, maxH / imageHeight);
      const drawW = imageWidth * ratio;
      const drawH = imageHeight * ratio;
      const x = (pageW - drawW) / 2;
      const y = (pageH - drawH) / 2;
      doc.addImage(imageData, "PNG", x, y, drawW, drawH, undefined, "FAST");
      const stem = (pdfFilename || "drawing").replace(/\.pdf$/i, "");
      doc.save(`${stem}-overlay-export.pdf`);
      return true;
    } catch (err) {
      console.warn("Failed to export drawing with overlays:", err);
      return false;
    } finally {
      document.body.classList.remove("print-capture-active");
    }
  }

  if (pdfDrawing && pdfBlob) {
    const exported = await exportDrawingAsPdf();
    if (!exported) {
      const src = typeof pdfBlob === "string" ? pdfBlob : URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = src;
      a.download = pdfFilename || "drawing.pdf";
      a.click();
      if (typeof pdfBlob !== "string") URL.revokeObjectURL(src);
    }
  }

  const hasNonPdfSections = (weldMap && weldPoints?.length) || projectProgress || (projectSummary && weldPoints?.length);
  if (!hasNonPdfSections) return;

  const win = window.open("", "_blank");
  if (!win) {
    alert("Pop-up blocked. Please allow pop-ups for this site to print.");
    return;
  }

  const pdfObjectUrls = [];
  function pdfIframeSrc(blobOrString) {
    if (typeof blobOrString === "string") return blobOrString;
    const u = URL.createObjectURL(blobOrString);
    pdfObjectUrls.push(u);
    return u;
  }
  let pdfUrlsRevoked = false;
  function revokePdfObjectUrls() {
    if (pdfUrlsRevoked) return;
    pdfUrlsRevoked = true;
    while (pdfObjectUrls.length) URL.revokeObjectURL(pdfObjectUrls.pop());
  }
  win.addEventListener("unload", revokePdfObjectUrls);

  const allStyles = [
    createPrintStyles(),
    createPdfSectionStyles(),
    createWeldMapSectionStyles(),
    createProgressSectionStyles(),
    createSummarySectionStyles(),
  ].join("\n");

  let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Print – ${escapeHtml(pdfFilename || "Weld Dashboard")}</title><style>${allStyles}</style></head><body>`;

  if (weldMap && weldPoints?.length) {
    html += '<div class="print-page print-page-weldmap"><h2>Weld map</h2>';
    html += buildWeldMapHtml(weldPoints, {
      pdfFilename,
      spools,
      parts: parts ?? [],
      personnel,
      drawingSettings,
      ndtContext,
      drawings,
    });
    html += "</div>";
  }

  if (projectProgress) {
    html += '<div class="print-page print-page-progress">';
    html += buildProjectProgressHtml(weldPoints, spools, drawingSettings, getWeldName, ndtContext);
    html += "</div>";
  }

  if (projectSummary && weldPoints?.length) {
    html += '<div class="print-page print-page-summary">';
    html += buildProjectSummaryHtml(weldPoints, weldStatusByWeldId, drawingSettings, spools);
    html += "</div>";
  }

  html += "</body></html>";
  win.document.write(html);
  win.document.close();

  win.focus();
  setTimeout(() => {
    win.print();
    win.onafterprint = () => {
      revokePdfObjectUrls();
      win.close();
    };
  }, 300);
}
