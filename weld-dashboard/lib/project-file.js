import { createDefaultWeld } from "./defaults";

/**
 * Helpers for saving and loading .weldproject files
 */

export const PROJECT_FILE_VERSION = 2;

function migrateWeldPoints(weldPoints = []) {
  return weldPoints.map((w) => ({
    ...createDefaultWeld(),
    ...w,
    status: w.status || "not_started",
    weldType: w.weldType || "butt",
    ndtRequired: w.ndtRequired || "auto",
    spoolId: w.spoolId ?? null,
  }));
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
          data.drawingSettings = { ndtPresetId: "", ndtPresetLabel: "", weldingSpec: "" };
        }
        if (!data.spools) {
          data.spools = [];
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
