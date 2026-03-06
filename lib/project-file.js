import { createDefaultWeld, createDefaultWeldingRecord } from "./defaults";
import { DRAWING_NDT_PRESETS } from "./constants";

/**
 * Helpers for saving and loading .weldproject files
 */

export const PROJECT_FILE_VERSION = 3;

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
    const { status: _, partNumber1, partNumber2, heatNumber1, heatNumber2, welderName, ...wRest } = w;
    const x = w.xPercent ?? wRest.xPercent;
    const y = w.yPercent ?? wRest.yPercent;
    const heatNumber = (w.heatNumber ?? [heatNumber1, heatNumber2].filter(Boolean).join(", ")) || "";
    const electrodeNumbers = Array.isArray(w.electrodeNumbers) && w.electrodeNumbers.length > 0
      ? w.electrodeNumbers
      : [""];
    const welderIds = Array.isArray(w.welderIds) ? w.welderIds : [];
    const weldingProcesses = Array.isArray(w.weldingProcesses) ? w.weldingProcesses : [];
    const weldingRecords = Array.isArray(w.weldingRecords) && w.weldingRecords.length > 0
      ? w.weldingRecords.map((r) => ({
          id: r.id || `wr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          welderIds: Array.isArray(r.welderIds) ? r.welderIds : [],
          weldingProcesses: Array.isArray(r.weldingProcesses) ? r.weldingProcesses : [],
          electrodeNumbers: Array.isArray(r.electrodeNumbers) && r.electrodeNumbers.length > 0 ? r.electrodeNumbers : [""],
          date: r.date ?? "",
        }))
      : (welderIds.length > 0 || weldingProcesses.length > 0 || (electrodeNumbers[0] && electrodeNumbers[0].trim()) || w.weldingDate)
        ? [{
            id: `wr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            welderIds,
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
      heatNumber,
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
  const baseName = projectData.pdfFilename?.replace(/\.pdf$/i, "") || "weld-project";
  a.download = `${baseName}.weldproject`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function loadProject(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.weldPoints) {
          data.weldPoints = migrateWeldPoints(data.weldPoints);
        }
        if (!data.drawingSettings) {
          data.drawingSettings = { ndtRequirements: [], weldingSpec: "" };
        } else {
          data.drawingSettings = migrateDrawingSettings(data.drawingSettings);
        }
        if (!data.spools) {
          data.spools = [];
        }
        if (!data.spoolMarkers) {
          data.spoolMarkers = [];
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
        resolve(data);
      } catch (err) {
        reject(new Error("Invalid project file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}
