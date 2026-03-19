import { buildExportRows } from "./excel-export";
import { DATABOOK_SECTIONS, getDatabookLinkedRequirements, normalizeDatabookConfig } from "./databook-sections";
import { getWeldName } from "./weld-utils";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function toPdfSrc(document) {
  if (!document?.base64) return "";
  return `data:${document.mimeType || "application/pdf"};base64,${document.base64}`;
}

function getDrawingPdfSrc(drawing) {
  if (drawing?.blobUrl) return drawing.blobUrl;
  if (drawing?.pdfBase64) return `data:application/pdf;base64,${drawing.pdfBase64}`;
  return "";
}

function buildDocumentEmbedHtml(document, label = "") {
  if (!document) return "<p class='muted'>No linked document</p>";
  const src = toPdfSrc(document);
  if (!src) return "<p class='muted'>Document is linked but has no PDF payload.</p>";
  const title = escapeHtml(label || document.title || document.fileName || "Document");
  return `
    <div class="doc-card">
      <p class="doc-title">${title}</p>
      <iframe class="doc-frame" src="${src}" title="${title}"></iframe>
    </div>
  `;
}

function buildCoverPage({ projectMeta = {}, databookConfig = {} }) {
  return `
    <section class="page cover">
      <h1>Databook Compilation</h1>
      <div class="grid">
        <div><strong>Project</strong><br/>${escapeHtml(projectMeta.projectName || "—")}</div>
        <div><strong>Client</strong><br/>${escapeHtml(projectMeta.client || "—")}</div>
        <div><strong>Spec</strong><br/>${escapeHtml(projectMeta.spec || "—")}</div>
        <div><strong>Revision</strong><br/>${escapeHtml(databookConfig.revision || projectMeta.revision || "—")}</div>
        <div><strong>Issued by</strong><br/>${escapeHtml(databookConfig.issuedBy || "—")}</div>
        <div><strong>Issued at</strong><br/>${escapeHtml(databookConfig.issuedAt || formatDate(projectMeta.date))}</div>
      </div>
      <p class="muted">Generated on ${escapeHtml(new Date().toLocaleString())}</p>
    </section>
  `;
}

function buildProjectSummarySection({ projectMeta = {}, drawings = [], systems = [], lines = [], weldPoints = [], spools = [], parts = [] }) {
  const drawingRows = drawings
    .map(
      (drawing) => `
        <tr>
          <td>${escapeHtml(drawing.filename || drawing.id || "Drawing")}</td>
          <td>${escapeHtml(drawing.revision || "—")}</td>
          <td>${(drawing.lineIds || []).length}</td>
        </tr>
      `
    )
    .join("");
  const systemRows = systems
    .map((system) => {
      const scopedLines = lines.filter((line) => line.systemId === system.id);
      return `<tr><td>${escapeHtml(system.name || "Unnamed system")}</td><td>${scopedLines.length}</td></tr>`;
    })
    .join("");

  return `
    <section class="page">
      <h2>Project summary</h2>
      <div class="grid">
        <div><strong>Project</strong><br/>${escapeHtml(projectMeta.projectName || "—")}</div>
        <div><strong>Drawings</strong><br/>${drawings.length}</div>
        <div><strong>Systems</strong><br/>${systems.length}</div>
        <div><strong>Lines</strong><br/>${lines.length}</div>
        <div><strong>Welds</strong><br/>${weldPoints.length}</div>
        <div><strong>Spools / Parts</strong><br/>${spools.length} / ${parts.length}</div>
      </div>
      <h3>Drawing list</h3>
      <table>
        <thead><tr><th>Drawing</th><th>Revision</th><th>Linked lines</th></tr></thead>
        <tbody>${drawingRows || "<tr><td colspan='3'>No drawings</td></tr>"}</tbody>
      </table>
      <h3>Systems and lines</h3>
      <table>
        <thead><tr><th>System</th><th>Lines</th></tr></thead>
        <tbody>${systemRows || "<tr><td colspan='2'>No systems</td></tr>"}</tbody>
      </table>
    </section>
  `;
}

function buildAsBuiltSection({ drawings = [] }) {
  const cards = drawings
    .map((drawing) => {
      const src = getDrawingPdfSrc(drawing);
      const title = escapeHtml(drawing.filename || drawing.id || "Drawing");
      if (!src) {
        return `<div class="doc-card"><p class="doc-title">${title}</p><p class="muted">PDF source unavailable.</p></div>`;
      }
      return `<div class="doc-card"><p class="doc-title">${title}</p><iframe class="doc-frame" src="${src}" title="${title}"></iframe></div>`;
    })
    .join("");
  return `
    <section class="page">
      <h2>As-built drawings</h2>
      ${cards || "<p class='muted'>No drawings available.</p>"}
    </section>
  `;
}

function buildWeldMapSection({ weldPoints = [], spools = [], personnel = {}, drawingSettings = {}, projectMeta = {} }) {
  const { rows = [] } = buildExportRows(weldPoints, {
    pdfFilename: projectMeta.projectName || "",
    spools,
    parts: [],
    personnel,
    drawingSettings,
  });
  const head = ["Drawing", "Spool", "Weld #", "WPS", "Type", "Fitter", "Date", "Heat #1", "Heat #2", "Welder / Process / Electrode", "VT", "MPI", "RT", "UT"];
  const body = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
    .join("");
  return `
    <section class="page">
      <h2>Weld map</h2>
      <table>
        <thead><tr>${head.map((label) => `<th>${escapeHtml(label)}</th>`).join("")}</tr></thead>
        <tbody>${body || "<tr><td colspan='14'>No welds</td></tr>"}</tbody>
      </table>
    </section>
  `;
}

function buildFitupSection({ weldPoints = [], spools = [] }) {
  const rows = weldPoints
    .map((weld) => {
      const spoolName = spools.find((spool) => spool.id === weld.spoolId)?.name || "—";
      return `
        <tr>
          <td>${escapeHtml(getWeldName(weld, weldPoints) || weld.id)}</td>
          <td>${escapeHtml(spoolName)}</td>
          <td>${escapeHtml(weld.fitterName || "—")}</td>
          <td>${escapeHtml(weld.dateFitUp || "—")}</td>
          <td>${escapeHtml(weld.visualInspection ? "Pass" : "Pending")}</td>
          <td>${escapeHtml(weld.weldLocation || "shop")}</td>
        </tr>
      `;
    })
    .join("");
  return `
    <section class="page">
      <h2>Visual & dimensional fit-up report</h2>
      <table>
        <thead><tr><th>Weld</th><th>Spool</th><th>Fitter</th><th>Fit-up date</th><th>Visual</th><th>Location</th></tr></thead>
        <tbody>${rows || "<tr><td colspan='6'>No welds</td></tr>"}</tbody>
      </table>
    </section>
  `;
}

function buildNdtReportSection({ ndtReports = [] }) {
  const rows = ndtReports
    .map((report) => {
      const attachmentCount = (report.attachments || []).length;
      return `
        <tr>
          <td>${escapeHtml(report.displayName || report.id)}</td>
          <td>${escapeHtml(report.method || "—")}</td>
          <td>${escapeHtml(report.status || "draft")}</td>
          <td>${escapeHtml(report.reportDate || "—")}</td>
          <td>${attachmentCount}</td>
        </tr>
      `;
    })
    .join("");
  return `
    <section class="page">
      <h2>NDT report</h2>
      <table>
        <thead><tr><th>Report</th><th>Method</th><th>Status</th><th>Date</th><th>Attachments</th></tr></thead>
        <tbody>${rows || "<tr><td colspan='5'>No NDT reports</td></tr>"}</tbody>
      </table>
    </section>
  `;
}

function buildStyles() {
  return `
    @media print {
      @page { size: A4; margin: 1.2cm; }
      body { margin: 0; }
      .page { page-break-after: always; }
      .page:last-child { page-break-after: auto; }
    }
    body { font-family: system-ui, sans-serif; color: #111827; margin: 0 auto; max-width: 1024px; padding: 1rem; }
    h1 { font-size: 1.5rem; margin: 0 0 1rem; }
    h2 { font-size: 1.2rem; margin: 0 0 0.75rem; }
    h3 { font-size: 1rem; margin: 1rem 0 0.5rem; }
    .muted { color: #6b7280; font-size: 0.85rem; }
    .page { padding-bottom: 0.5rem; border-bottom: 1px dashed #d1d5db; margin-bottom: 1rem; }
    .cover .grid, .grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); gap: 0.75rem; margin-bottom: 0.75rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.75rem; }
    th, td { border: 1px solid #d1d5db; padding: 0.35rem 0.4rem; text-align: left; vertical-align: top; }
    th { background: #f3f4f6; }
    .doc-card { margin: 0 0 1rem; border: 1px solid #d1d5db; border-radius: 0.375rem; padding: 0.5rem; }
    .doc-title { margin: 0 0 0.4rem; font-weight: 600; font-size: 0.85rem; }
    .doc-frame { width: 100%; height: 78vh; border: 1px solid #e5e7eb; border-radius: 0.25rem; background: #fff; }
    .actions { position: sticky; top: 0; background: #fff; padding-bottom: 0.5rem; margin-bottom: 0.75rem; z-index: 1; }
    .btn { border: 1px solid #d1d5db; border-radius: 0.375rem; padding: 0.45rem 0.7rem; background: #f9fafb; cursor: pointer; font-size: 0.85rem; }
  `;
}

export function compileDatabookPdf({
  databookConfig = null,
  documents = [],
  projectMeta = {},
  drawings = [],
  systems = [],
  lines = [],
  weldPoints = [],
  spools = [],
  parts = [],
  personnel = { welders: [], wqrs: [] },
  drawingSettings = {},
  wpsLibrary = [],
  materialCertificates = [],
  ndtReports = [],
} = {}) {
  const config = normalizeDatabookConfig(databookConfig);
  const docsById = new Map((documents || []).map((doc) => [doc.id, doc]));
  const docsByCategory = new Map();
  (documents || []).forEach((doc) => {
    const category = doc?.category || "other";
    if (!docsByCategory.has(category)) docsByCategory.set(category, []);
    docsByCategory.get(category).push(doc);
  });
  docsByCategory.forEach((items) => items.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")));

  const requirements = getDatabookLinkedRequirements({
    weldPoints,
    parts,
    personnel,
    wpsLibrary,
    materialCertificates,
  });

  const sectionById = new Map(DATABOOK_SECTIONS.map((section) => [section.id, section]));
  const includedSections = config.sectionOrder
    .map((sectionId) => sectionById.get(sectionId))
    .filter((section) => section && config.includedSectionIds.includes(section.id));

  const htmlSections = [buildCoverPage({ projectMeta, databookConfig: config })];

  includedSections.forEach((section) => {
    if (section.id === "project-summary") {
      htmlSections.push(buildProjectSummarySection({ projectMeta, drawings, systems, lines, weldPoints, spools, parts }));
      return;
    }
    if (section.id === "as-built-drawings") {
      htmlSections.push(buildAsBuiltSection({ drawings }));
      return;
    }
    if (section.id === "weld-map") {
      htmlSections.push(buildWeldMapSection({ weldPoints, spools, personnel, drawingSettings, projectMeta }));
      return;
    }
    if (section.id === "fitup-report") {
      htmlSections.push(buildFitupSection({ weldPoints, spools }));
      return;
    }
    if (section.id === "ndt-report") {
      htmlSections.push(buildNdtReportSection({ ndtReports }));
      return;
    }

    if (section.type === "uploaded") {
      const linkedId = config.sectionDocumentIds?.[section.id];
      const linkedDoc = linkedId ? docsById.get(linkedId) : null;
      const fallbackDoc = (docsByCategory.get(section.documentCategory) || [])[0];
      const chosenDoc = linkedDoc || fallbackDoc || null;
      htmlSections.push(`
        <section class="page">
          <h2>${escapeHtml(section.title)}</h2>
          ${buildDocumentEmbedHtml(chosenDoc, section.title)}
        </section>
      `);
      return;
    }

    if (section.id === "welder-qualification") {
      const cards = requirements.requiredWqrEntries
        .map((entry) => ({
          label: entry.code || entry.id || "WQR",
          doc: entry.documentId ? docsById.get(entry.documentId) : null,
        }))
        .map((item) => buildDocumentEmbedHtml(item.doc, `WQR ${item.label}`))
        .join("");
      htmlSections.push(`
        <section class="page">
          <h2>${escapeHtml(section.title)}</h2>
          ${cards || "<p class='muted'>No WQR links required from current weld records.</p>"}
        </section>
      `);
      return;
    }

    if (section.id === "wps") {
      const cards = requirements.usedWpsCodes
        .map((code) => {
          const entry = (wpsLibrary || []).find((item) => (item?.code || "").trim() === code);
          const doc = entry?.documentId ? docsById.get(entry.documentId) : null;
          return buildDocumentEmbedHtml(doc, `WPS ${code}`);
        })
        .join("");
      htmlSections.push(`
        <section class="page">
          <h2>${escapeHtml(section.title)}</h2>
          ${cards || "<p class='muted'>No WPS references in current weld records.</p>"}
        </section>
      `);
      return;
    }

    if (section.id === "material-certificates") {
      const cards = requirements.usedHeatNumbers
        .map((heat) => {
          const entry = (materialCertificates || []).find((item) => (item?.heatNumber || "").trim() === heat);
          const doc = entry?.documentId ? docsById.get(entry.documentId) : null;
          return buildDocumentEmbedHtml(doc, `MTC heat ${heat}`);
        })
        .join("");
      htmlSections.push(`
        <section class="page">
          <h2>${escapeHtml(section.title)}</h2>
          ${cards || "<p class='muted'>No heat numbers referenced in current data.</p>"}
        </section>
      `);
    }
  });

  const win = window.open("", "_blank");
  if (!win) {
    alert("Pop-up blocked. Please allow pop-ups to compile the databook.");
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Databook compilation</title>
        <style>${buildStyles()}</style>
      </head>
      <body>
        <div class="actions">
          <button class="btn" onclick="window.print()">Print / Save as PDF</button>
        </div>
        ${htmlSections.join("\n")}
      </body>
    </html>
  `;

  win.document.open();
  win.document.write(html);
  win.document.close();
}
