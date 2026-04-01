import { jsPDF } from "jspdf";
import { pdfjs } from "react-pdf";
import { WELD_LOCATION } from "./constants";
import { MARKER_HEX } from "./marker-colors";
import {
  computeNdtSelection,
  getWeldProgressPercent,
  getSpoolProgressPercent,
  getLineProgressPercent,
  getPartHeatProgressPercent,
} from "./weld-utils";

if (typeof window !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Export every PDF page as raster + markers (pdf.js render — same geometry as % stored per page).
 * @param {object} opts
 * @param {boolean} opts.pdfDrawing
 * @param {Blob|File|string} opts.pdfBlob - blob/file or URL string
 * @param {number} [opts.pdfRenderScale] - pdf.js viewport scale (sharpness)
 * @param {{ welds?: boolean, spools?: boolean, parts?: boolean, lines?: boolean }} opts.exportMarkerLayers
 * @param {string} [opts.pdfFilename]
 * @param {Array} [opts.weldPoints]
 * @param {Array} [opts.spoolMarkers]
 * @param {Array} [opts.lineMarkers]
 * @param {Array} [opts.partMarkers]
 * @param {Array} [opts.spools]
 * @param {Array} [opts.parts]
 * @param {Array} [opts.lines]
 * @param {(w: object, all: Array) => string} [opts.getWeldName]
 * @param {"download"|"print"} [opts.exportAction]
 * @param {boolean} [opts.includeDrawingMarkers] - when false, PDF pages only (no weld/spool/part/line overlay)
 */
export async function runPrint({
  pdfDrawing,
  pdfBlob,
  pdfRenderScale = 2,
  includeDrawingMarkers = true,
  exportMarkerLayers = { welds: true, spools: true, parts: true, lines: true },
  pdfFilename,
  weldPoints = [],
  spoolMarkers = [],
  lineMarkers = [],
  partMarkers = [],
  spools = [],
  parts = [],
  lines = [],
  drawingSettings = {},
  ndtContext = null,
  getWeldName,
  exportAction = "download",
}) {
  if (!pdfDrawing) return;

  const hex = MARKER_HEX;

  function clampPct(value) {
    return Math.max(0, Math.min(100, Number(value) || 0));
  }

  function makeSimplePctToBmp(w, h) {
    return function pctToBmp(xp, yp) {
      return {
        x: (clampPct(xp) / 100) * w,
        y: (clampPct(yp) / 100) * h,
      };
    };
  }

  /** White fill, colored stroke, text in same color (matches app markers). */
  function drawOutlinedLabel(ctx, { x, y, text, color, fontSize = 12, shape = "pill", progressRatio = 0 }) {
    const padX = 8;
    const padY = 5;
    ctx.font = `600 ${fontSize}px Arial`;
    const textW = Math.max(10, ctx.measureText(text).width);
    let w = textW + padX * 2;
    let h = fontSize + padY * 2;
    if (shape === "circle" || shape === "diamond") {
      const side = Math.max(w, h);
      w = side;
      h = side;
    }
    const outlineW = Math.max(1.25, fontSize * 0.11);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const pr = Math.max(0, Math.min(1, progressRatio));

    if (shape === "pill") {
      const left = x - w / 2;
      const top = y - h / 2;
      const r = Math.min(8, h / 3);
      const buildPillPath = () => {
        ctx.beginPath();
        ctx.moveTo(left + r, top);
        ctx.lineTo(left + w - r, top);
        ctx.quadraticCurveTo(left + w, top, left + w, top + r);
        ctx.lineTo(left + w, top + h - r);
        ctx.quadraticCurveTo(left + w, top + h, left + w - r, top + h);
        ctx.lineTo(left + r, top + h);
        ctx.quadraticCurveTo(left, top + h, left, top + h - r);
        ctx.lineTo(left, top + r);
        ctx.quadraticCurveTo(left, top, left + r, top);
        ctx.closePath();
      };
      buildPillPath();
      ctx.fillStyle = hex.labelFill;
      ctx.fill();
      if (pr > 0) {
        ctx.save();
        buildPillPath();
        ctx.clip();
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.22;
        ctx.fillRect(left, top, w * pr, h);
        ctx.globalAlpha = 1;
        ctx.restore();
      }
      buildPillPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = outlineW;
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.fillText(text, x, y + 0.5);
      return;
    }

    ctx.fillStyle = hex.labelFill;
    ctx.strokeStyle = color;
    ctx.lineWidth = outlineW;

    if (shape === "circle") {
      const r = w / 2;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (shape === "diamond") {
      const half = w / 2;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 4);
      ctx.beginPath();
      ctx.rect(-half, -half, w, w);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    ctx.fillStyle = color;
    ctx.fillText(text, x, y + 0.5);
  }

  function drawLineSeg(ctx, x1, y1, x2, y2, color, width) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  function drawHollowDot(ctx, x, y, color, radius, outlineW) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = hex.labelFill;
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = outlineW;
    ctx.stroke();
  }

  /** Horizontal top/bottom, 45° sides, triangular arrowheads pointing left/right (field weld). */
  function drawFieldWeldMark(ctx, cx, cy, color, arm, lineW) {
    const a = arm;
    const verts = [
      [-0.35 * a, -0.65 * a],
      [0.35 * a, -0.65 * a],
      [a, 0],
      [0.35 * a, 0.65 * a],
      [-0.35 * a, 0.65 * a],
      [-a, 0],
    ];
    const fill = hex.labelFill;
    ctx.beginPath();
    ctx.moveTo(cx + verts[0][0], cy + verts[0][1]);
    for (let i = 1; i < verts.length; i++) ctx.lineTo(cx + verts[i][0], cy + verts[i][1]);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineW;
    ctx.stroke();
    const aw = Math.max(lineW * 2, a * 0.14);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx - a - aw * 1.15, cy);
    ctx.lineTo(cx - a + aw * 0.35, cy - aw * 0.55);
    ctx.lineTo(cx - a + aw * 0.35, cy + aw * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + a + aw * 1.15, cy);
    ctx.lineTo(cx + a - aw * 0.35, cy - aw * 0.55);
    ctx.lineTo(cx + a - aw * 0.35, cy + aw * 0.55);
    ctx.closePath();
    ctx.fill();
  }

  function drawMarkerOverlaysOnCanvas(outCanvas, pageIndex0, pctToBmp) {
    const ctx = outCanvas.getContext("2d");
    if (!ctx) return;
    const safeLines = Array.isArray(lines) ? lines : [];
    const minDim = Math.min(outCanvas.width, outCanvas.height);
    const strokeW = Math.max(1, Math.min(3, minDim * 0.0009));

    if (exportMarkerLayers?.welds !== false) {
      (weldPoints || [])
        .filter((w) => (w.pageNumber ?? 0) === pageIndex0)
        .forEach((w) => {
          const wxPct = w.xPercent ?? 0;
          const wyPct = w.yPercent ?? 0;
          const ixPct = w.indicatorXPercent ?? wxPct;
          const iyPct = w.indicatorYPercent ?? wyPct;
          const hasBend = w.lineBendXPercent != null && w.lineBendYPercent != null;
          const bendXPct = hasBend ? w.lineBendXPercent : (ixPct + wxPct) / 2;
          const bendYPct = hasBend ? w.lineBendYPercent : (iyPct + wyPct) / 2;

          const pWeld = pctToBmp(wxPct, wyPct);
          const pInd = pctToBmp(ixPct, iyPct);
          const pBend = pctToBmp(bendXPct, bendYPct);

          const isField = (w.weldLocation || WELD_LOCATION.SHOP) === WELD_LOCATION.FIELD;
          const lineCol = isField ? hex.fieldWeld : hex.shopWeld;
          const markArm = Math.max(2, strokeW * 1.6);
          const dotR = Math.max(2, strokeW * 1.6);
          const dotOutline = Math.max(1, strokeW * 0.9);

          drawLineSeg(ctx, pInd.x, pInd.y, pBend.x, pBend.y, lineCol, strokeW);
          drawLineSeg(ctx, pBend.x, pBend.y, pWeld.x, pWeld.y, lineCol, strokeW);
          if (isField)
            drawFieldWeldMark(ctx, pWeld.x, pWeld.y, lineCol, markArm, Math.max(1, strokeW * 0.95));
          else drawHollowDot(ctx, pWeld.x, pWeld.y, lineCol, dotR, dotOutline);
          const labelSize = Math.max(8, Math.min(13, minDim * 0.007));
          const ndtSel = computeNdtSelection(w, drawingSettings, weldPoints, ndtContext);
          const progressRatio = getWeldProgressPercent(w, ndtSel, ndtContext) / 100;
          drawOutlinedLabel(ctx, {
            x: pInd.x,
            y: pInd.y,
            text: getWeldName?.(w, weldPoints) || "Weld",
            color: lineCol,
            fontSize: labelSize,
            shape: "pill",
            progressRatio,
          });
        });
    }

    if (exportMarkerLayers?.spools !== false) {
      (spoolMarkers || [])
        .filter((m) => (m.pageNumber ?? 0) === pageIndex0)
        .forEach((m) => {
          const wx = m.xPercent ?? 0;
          const wy = m.yPercent ?? 0;
          const ix = m.indicatorXPercent ?? Math.min(100, Math.max(0, wx + 4));
          const iy = m.indicatorYPercent ?? Math.min(100, Math.max(0, wy - 4));
          const pWeld = pctToBmp(wx, wy);
          const pInd = pctToBmp(ix, iy);
          drawLineSeg(ctx, pInd.x, pInd.y, pWeld.x, pWeld.y, hex.spool, strokeW);
          drawHollowDot(ctx, pWeld.x, pWeld.y, hex.spool, Math.max(2, strokeW * 1.6), Math.max(1, strokeW * 0.9));
          const spoolName = spools?.find((s) => s.id === m.spoolId)?.name || "Spool";
          const labelSize = Math.max(8, Math.min(13, minDim * 0.007));
          const progressRatio =
            getSpoolProgressPercent(m.spoolId, weldPoints, drawingSettings, ndtContext) / 100;
          drawOutlinedLabel(ctx, {
            x: pInd.x,
            y: pInd.y,
            text: spoolName,
            color: hex.spool,
            fontSize: labelSize,
            progressRatio,
          });
        });
    }

    if (exportMarkerLayers?.parts !== false) {
      (partMarkers || [])
        .filter((m) => (m.pageNumber ?? 0) === pageIndex0)
        .forEach((m) => {
          const wx = m.xPercent ?? 0;
          const wy = m.yPercent ?? 0;
          const ix = m.indicatorXPercent ?? Math.min(100, Math.max(0, wx + 4));
          const iy = m.indicatorYPercent ?? Math.min(100, Math.max(0, wy - 4));
          const pWeld = pctToBmp(wx, wy);
          const pInd = pctToBmp(ix, iy);
          drawLineSeg(ctx, pInd.x, pInd.y, pWeld.x, pWeld.y, hex.part, strokeW);
          drawHollowDot(ctx, pWeld.x, pWeld.y, hex.part, Math.max(2, strokeW * 1.6), Math.max(1, strokeW * 0.9));
          const part = parts?.find((p) => p.id === m.partId);
          const num = part?.displayNumber;
          const labelSize = Math.max(8, Math.min(13, minDim * 0.007));
          const progressRatio = getPartHeatProgressPercent(part) / 100;
          drawOutlinedLabel(ctx, {
            x: pInd.x,
            y: pInd.y,
            text: String(num ?? "Part"),
            color: hex.part,
            fontSize: labelSize,
            progressRatio,
          });
        });
    }

    if (exportMarkerLayers?.lines !== false) {
      (lineMarkers || [])
        .filter((m) => (m.pageNumber ?? 0) === pageIndex0)
        .forEach((m) => {
          const wx = m.xPercent ?? 0;
          const wy = m.yPercent ?? 0;
          const ix = m.indicatorXPercent ?? Math.min(100, Math.max(0, wx + 4));
          const iy = m.indicatorYPercent ?? Math.min(100, Math.max(0, wy - 4));
          const pWeld = pctToBmp(wx, wy);
          const pInd = pctToBmp(ix, iy);
          drawLineSeg(ctx, pInd.x, pInd.y, pWeld.x, pWeld.y, hex.line, strokeW);
          drawHollowDot(ctx, pWeld.x, pWeld.y, hex.line, Math.max(2, strokeW * 1.6), Math.max(1, strokeW * 0.9));
          const lineName = safeLines.find((l) => l.id === m.lineId)?.name || "Line";
          const labelSize = Math.max(8, Math.min(13, minDim * 0.007));
          const progressRatio =
            getLineProgressPercent(m.lineId, weldPoints, spools, drawingSettings, ndtContext) / 100;
          drawOutlinedLabel(ctx, {
            x: pInd.x,
            y: pInd.y,
            text: lineName,
            color: hex.line,
            fontSize: labelSize,
            progressRatio,
          });
        });
    }
  }

  async function loadPdfDocument(source) {
    if (typeof source === "string") {
      return pdfjs.getDocument(source).promise;
    }
    const buf = await source.arrayBuffer();
    return pdfjs.getDocument({ data: buf }).promise;
  }

  async function renderPageToCanvas(pdfDocument, pageNumber1Based, scale) {
    const page = await pdfDocument.getPage(pageNumber1Based);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const renderTask = page.render({
      canvasContext: ctx,
      viewport,
    });
    await renderTask.promise;
    return canvas;
  }

  if (!pdfBlob) {
    window.alert("No PDF is loaded for this drawing.");
    return;
  }

  let pdfDocument;
  try {
    pdfDocument = await loadPdfDocument(pdfBlob);
  } catch (err) {
    console.warn("PDF load for export failed:", err);
    window.alert("Could not read the PDF for export.");
    return;
  }

  const numPages = pdfDocument.numPages || 0;
  if (numPages < 1) {
    window.alert("This PDF has no pages to export.");
    return;
  }

  const scale = Math.min(3, Math.max(1.25, Number(pdfRenderScale) || 2));
  const pageCanvases = [];

  try {
    for (let p = 1; p <= numPages; p++) {
      const base = await renderPageToCanvas(pdfDocument, p, scale);
      if (!base) continue;
      const out = document.createElement("canvas");
      out.width = base.width;
      out.height = base.height;
      const octx = out.getContext("2d");
      if (!octx) continue;
      octx.drawImage(base, 0, 0);
      if (includeDrawingMarkers) {
        const pctToBmp = makeSimplePctToBmp(out.width, out.height);
        drawMarkerOverlaysOnCanvas(out, p - 1, pctToBmp);
      }
      pageCanvases.push(out);
    }
  } catch (err) {
    console.warn("PDF page render for export failed:", err);
    window.alert("Could not render one or more PDF pages for export.");
    return;
  }

  if (pageCanvases.length === 0) {
    window.alert("Could not export the drawing.");
    return;
  }

  const pageImages = [];
  for (const canvas of pageCanvases) {
    try {
      pageImages.push({
        dataUrl: canvas.toDataURL("image/png"),
        width: canvas.width,
        height: canvas.height,
      });
    } catch (err) {
      console.warn("Drawing export toDataURL failed:", err);
      window.alert("Could not capture the drawing image. The PDF may be blocked from export.");
      return;
    }
  }

  const stem = (pdfFilename || "drawing").replace(/\.pdf$/i, "");
  const pdfFileSuffix = includeDrawingMarkers ? "-overlay-export" : "-drawing-export";

  if (exportAction === "print") {
    const win = window.open("", "_blank");
    if (!win) {
      window.alert("Pop-up blocked. Please allow pop-ups for this site to print the drawing.");
      return;
    }
    const title = escapeHtml(pdfFilename || "Drawing");
    const sheets = pageImages
      .map(
        (pg) =>
          `<div class="sheet"><img src="${pg.dataUrl}" alt="" width="${pg.width}" height="${pg.height}" /></div>`
      )
      .join("");
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
      <style>
        @media print {
          @page { margin: 10mm; }
          body { margin: 0; }
          .sheet { page-break-after: always; break-after: page; }
          .sheet:last-child { page-break-after: auto; break-after: auto; }
          img { max-width: 100%; height: auto; display: block; margin: 0 auto; }
        }
        body { margin: 0; padding: 8px; background: #e5e5e5; }
        .sheet { margin-bottom: 12px; background: #fff; }
        img { max-width: 100%; height: auto; display: block; margin: 0 auto; }
      </style></head><body>${sheets}
      <script>
        function doPrint() {
          window.focus();
          window.print();
        }
        const imgs = document.querySelectorAll("img");
        let pending = imgs.length;
        function tryPrint() {
          pending--;
          if (pending <= 0) setTimeout(doPrint, 150);
        }
        imgs.forEach(function (img) {
          if (img.complete) tryPrint();
          else {
            img.onload = tryPrint;
            img.onerror = tryPrint;
          }
        });
        if (imgs.length === 0) setTimeout(doPrint, 150);
      <\/script>
      </body></html>`);
    win.document.close();
    return;
  }

  let doc = null;
  for (let i = 0; i < pageImages.length; i++) {
    const { dataUrl, width: imageWidth, height: imageHeight } = pageImages[i];
    const isLandscape = imageWidth >= imageHeight;
    if (i === 0) {
      doc = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: isLandscape ? "landscape" : "portrait",
      });
    } else {
      doc.addPage(undefined, isLandscape ? "landscape" : "portrait");
    }
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
    doc.addImage(dataUrl, "PNG", x, y, drawW, drawH, undefined, "FAST");
  }
  doc.save(`${stem}${pdfFileSuffix}.pdf`);
}
