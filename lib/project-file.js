import { createDefaultWeld, createDefaultWeldingRecord, createDefaultSpool, createDefaultDrawing } from "./defaults";
import { normalizeSpoolLifecycleStage } from "./status-utils";
import { DRAWING_NDT_PRESETS } from "./constants";
import { normalizeDatabookConfig } from "./databook-sections";

/**
 * Helpers for saving and loading .weldproject files
 */

export const PROJECT_FILE_VERSION = 5;

export function migrateDrawingSettings(settings) {
  if (!settings) return null;
  if (settings.ndtRequirements && Array.isArray(settings.ndtRequirements)) {
    return {
      ndtRequirements: settings.ndtRequirements,
      weldingSpec: settings.weldingSpec || "",
    };
  }
  if (settings.ndtPresetId) {
    const preset = DRAWING_NDT_PRESETS.find((p) => p.id === settings.ndtPresetId);
    return {
      ndtRequirements: preset ? [{ method: preset.method, pct: preset.pct }] : [],
      weldingSpec: settings.weldingSpec || "",
    };
  }
  return {
    ndtRequirements: [],
    weldingSpec: settings.weldingSpec || "",
  };
}

function migrateWeldPoints(weldPoints = []) {
  const migrated = weldPoints.map((w) => {
    const { status: _, partNumber1, partNumber2, heatNumber, welderName, ...wRest } = w;
    const x = w.xPercent ?? wRest.xPercent;
    const y = w.yPercent ?? wRest.yPercent;
    const heatNumber1 = w.heatNumber1 ?? (w.heatNumber ? w.heatNumber.split(",")[0]?.trim() : "") ?? "";
    const heatNumber2 = w.heatNumber2 ?? (w.heatNumber ? w.heatNumber.split(",")[1]?.trim() : "") ?? "";
    const electrodeNumbers = Array.isArray(w.electrodeNumbers) && w.electrodeNumbers.length > 0
      ? w.electrodeNumbers
      : [""];
    const welderIds = Array.isArray(w.welderIds) ? w.welderIds : [];
    const weldingProcesses = Array.isArray(w.weldingProcesses) ? w.weldingProcesses : [];
    const weldingRecords = Array.isArray(w.weldingRecords) && w.weldingRecords.length > 0
      ? w.weldingRecords.map((r) => ({
          id: r.id || `wr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          welderIds: Array.isArray(r.welderIds) ? r.welderIds : [],
          wqrIds: Array.isArray(r.wqrIds) ? r.wqrIds : [],
          welderName: r.welderName ?? "",
          weldingProcesses: Array.isArray(r.weldingProcesses) ? r.weldingProcesses : [],
          electrodeNumbers: Array.isArray(r.electrodeNumbers) && r.electrodeNumbers.length > 0 ? r.electrodeNumbers : [""],
          date: r.date ?? "",
        }))
      : (welderIds.length > 0 || weldingProcesses.length > 0 || (electrodeNumbers[0] && electrodeNumbers[0].trim()) || w.weldingDate)
        ? [{
            id: `wr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            welderIds,
            wqrIds: [],
            welderName: welderName ?? "",
            weldingProcesses,
            electrodeNumbers: electrodeNumbers.filter(Boolean).length > 0 ? electrodeNumbers.filter(Boolean) : [""],
            date: w.weldingDate ?? "",
          }]
        : [];
    return {
      ...createDefaultWeld(),
      ...wRest,
      weldType: w.weldType || "butt",
      weldLocation: w.weldLocation || "shop",
      ndtRequired: w.ndtRequired || "auto",
      spoolId: w.spoolId ?? null,
      pageNumber: w.pageNumber ?? 0,
      indicatorXPercent: w.indicatorXPercent ?? x,
      indicatorYPercent: w.indicatorYPercent ?? y,
      labelFontSize: w.labelFontSize ?? 12,
      lineBendXPercent: w.lineBendXPercent ?? null,
      lineBendYPercent: w.lineBendYPercent ?? null,
      heatNumber1,
      heatNumber2,
      partId1: w.partId1 ?? null,
      partId2: w.partId2 ?? null,
      electrodeNumbers,
      wps: w.wps ?? "",
      welderIds,
      weldingProcesses,
      weldingRecords,
      welderName: welderName ?? "",
    };
  });
  // Assign stable weldNumber for welds that don't have it
  const byType = { shop: [], field: [] };
  migrated.forEach((w) => {
    const key = w.weldLocation === "field" ? "field" : "shop";
    byType[key].push(w);
  });
  ["shop", "field"].forEach((key) => {
    byType[key]
      .sort((a, b) => {
        const pa = a.pageNumber ?? 0;
        const pb = b.pageNumber ?? 0;
        if (pa !== pb) return pa - pb;
        const ya = a.yPercent ?? 0;
        const yb = b.yPercent ?? 0;
        if (ya !== yb) return ya - yb;
        const xa = a.xPercent ?? 0;
        const xb = b.xPercent ?? 0;
        if (xa !== xb) return xa - xb;
        return (a.id ?? "").localeCompare(b.id ?? "");
      })
      .forEach((w, i) => {
        if (w.weldNumber == null) w.weldNumber = i + 1;
      });
  });
  return migrated;
}

export function saveProject(projectData) {
  const blob = new Blob([JSON.stringify(projectData, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const firstDwg = Array.isArray(projectData.drawings) && projectData.drawings[0];
  const baseName =
    projectData.projectMeta?.projectName?.trim() ||
    (firstDwg ? firstDwg.filename : projectData.pdfFilename)?.replace(/\.pdf$/i, "") ||
    "weld-project";
  a.download = `${baseName}.weldproject`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Migrate v3 (single pdfFilename/pdfBase64) to v4 (drawings[]).
 * Sets drawingId on weldPoints, spoolMarkers, and partMarkers.
 */
function migrateToDrawings(data) {
  if (Array.isArray(data.drawings) && data.drawings.length > 0) return;

  if (data.pdfFilename || data.pdfBase64) {
    const dwg = createDefaultDrawing({
      filename: data.pdfFilename || "",
      pdfBase64: data.pdfBase64 || "",
    });
    data.drawings = [dwg];

    if (Array.isArray(data.weldPoints)) {
      data.weldPoints.forEach((w) => { if (!w.drawingId) w.drawingId = dwg.id; });
    }
    if (Array.isArray(data.spoolMarkers)) {
      data.spoolMarkers.forEach((m) => { if (!m.drawingId) m.drawingId = dwg.id; });
    }
    if (Array.isArray(data.partMarkers)) {
      data.partMarkers.forEach((m) => { if (!m.drawingId) m.drawingId = dwg.id; });
    }
    if (Array.isArray(data.lineMarkers)) {
      data.lineMarkers.forEach((m) => { if (!m.drawingId) m.drawingId = dwg.id; });
    }
  } else {
    data.drawings = [];
  }

  delete data.pdfFilename;
  delete data.pdfBase64;
}

function migrateToDatabookSchema(data) {
  if (!Array.isArray(data.documents)) data.documents = [];
  data.documents = data.documents
    .filter((doc) => doc && typeof doc === "object")
    .map((doc) => ({
      id: doc.id || `doc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      title: doc.title || doc.fileName || "",
      category: doc.category || "other",
      fileName: doc.fileName || doc.title || "document.pdf",
      mimeType: doc.mimeType || "application/pdf",
      base64: doc.base64 || "",
      createdAt: doc.createdAt || new Date().toISOString(),
    }))
    .filter((doc) => !!doc.base64);

  data.databookConfig = normalizeDatabookConfig(data.databookConfig);
  if (!Array.isArray(data.wpsLibrary)) data.wpsLibrary = [];
  if (!Array.isArray(data.electrodeLibrary)) data.electrodeLibrary = [];
  if (!Array.isArray(data.materialCertificates)) data.materialCertificates = [];
}

export async function loadProject(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        reject(
          new Error(
            parseErr instanceof SyntaxError
              ? "Project file is not valid JSON"
              : "Could not parse project file"
          )
        );
        return;
      }
      try {
        if (data.weldPoints) {
          data.weldPoints = migrateWeldPoints(data.weldPoints);
        }
        if (!data.drawingSettings) {
          data.drawingSettings = { ndtRequirements: [], weldingSpec: "" };
        } else {
          data.drawingSettings = migrateDrawingSettings(data.drawingSettings);
        }
        if (!Array.isArray(data.spools)) {
          data.spools = [];
        } else {
          data.spools = data.spools
            .filter((sp) => sp && typeof sp === "object")
            .map((sp) => ({
              ...createDefaultSpool(),
              ...sp,
              lineId: sp.lineId ?? null,
              lifecycleStage: normalizeSpoolLifecycleStage(sp.lifecycleStage),
            }));
        }
        if (!data.spoolMarkers) {
          data.spoolMarkers = [];
        }
        if (!data.parts) {
          data.parts = [];
        }
        if (!data.partMarkers) {
          data.partMarkers = [];
        }
        if (!Array.isArray(data.lineMarkers)) {
          data.lineMarkers = [];
        }
        if (!data.personnel) {
          data.personnel = { fitters: [], welders: [], wqrs: [] };
        } else {
          data.personnel = {
            fitters: Array.isArray(data.personnel.fitters) ? data.personnel.fitters : [],
            welders: Array.isArray(data.personnel.welders) ? data.personnel.welders : [],
            wqrs: Array.isArray(data.personnel.wqrs) ? data.personnel.wqrs : [],
          };
        }
        if (!Array.isArray(data.ndtRequests)) data.ndtRequests = [];
        if (!Array.isArray(data.ndtReports)) data.ndtReports = [];

        // v4 migrations
        migrateToDrawings(data);
        // v5 migrations
        migrateToDatabookSchema(data);
        if (!Array.isArray(data.systems)) data.systems = [];
        if (!Array.isArray(data.lines)) data.lines = [];
        if (!data.projectSettings || typeof data.projectSettings !== "object") {
          data.projectSettings = { steps: [] };
        } else {
          if (!Array.isArray(data.projectSettings.steps)) data.projectSettings.steps = [];
        }
        if (!data.projectMeta || typeof data.projectMeta !== "object") {
          data.projectMeta = { projectName: "", client: "", spec: "", revision: "", date: "" };
        }

        resolve(data);
      } catch (err) {
        if (process.env.NODE_ENV === "development") console.warn("[MapWeld:loadProject migration]", err);
        reject(
          err instanceof Error
            ? new Error(`Invalid project data: ${err.message}`)
            : new Error("Invalid project data")
        );
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}
