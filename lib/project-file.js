import { createDefaultWeld } from "./defaults";
import { DRAWING_NDT_PRESETS } from "./constants";

/**
 * Helpers for saving and loading .weldproject files
 */

export const PROJECT_FILE_VERSION = 2;

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
  return weldPoints.map((w) => {
    const { status: _, ...wRest } = w;
    const x = w.xPercent ?? wRest.xPercent;
    const y = w.yPercent ?? wRest.yPercent;
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
    };
  });
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
        resolve(data);
      } catch (err) {
        reject(new Error("Invalid project file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}
