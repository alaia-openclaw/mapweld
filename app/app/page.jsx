"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Toolbar from "@/components/Toolbar";
import MarkupToolbar from "@/components/MarkupToolbar";
import PDFViewer from "@/components/PDFViewer";
import ModalWeldForm from "@/components/ModalWeldForm";
import ModalDrawingSettings from "@/components/ModalDrawingSettings";
import ModalSpools from "@/components/ModalSpools";
import ModalProjects from "@/components/ModalProjects";
import OfflineBanner from "@/components/OfflineBanner";
import {
  saveProject,
  loadProject,
  PROJECT_FILE_VERSION,
  migrateDrawingSettings,
} from "@/lib/project-file";
import {
  saveProject as saveToIndexedDB,
  loadProject as loadFromIndexedDB,
  generateProjectId,
} from "@/lib/offline-storage";
import { createDefaultWeld } from "@/lib/defaults";
import { getWeldName } from "@/lib/weld-utils";
import { formatNdtRequirements } from "@/lib/constants";
import * as XLSX from "xlsx";

const AUTO_SAVE_DELAY_MS = 1500;

const PDFViewerDynamic = dynamic(() => import("@/components/PDFViewer"), {
  ssr: false,
  loading: () => <div className="p-8">Loading viewer...</div>,
});

function generateId() {
  return `wp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function WeldTrackerApp() {
  const containerRef = useRef(null);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [pdfFilename, setPdfFilename] = useState("");
  const [weldPoints, setWeldPoints] = useState([]);
  const [spools, setSpools] = useState([]);
  const [drawingSettings, setDrawingSettings] = useState({
    ndtRequirements: [],
    weldingSpec: "",
  });
  const [appMode, setAppMode] = useState("edition");
  const [markupTool, setMarkupTool] = useState("select");
  const [selectedWeldId, setSelectedWeldId] = useState(null);
  const [formWeld, setFormWeld] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showSpools, setShowSpools] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [projectId, setProjectId] = useState(null);
  const [spoolMarkers, setSpoolMarkers] = useState([]);
  const [spoolMarkerToPlace, setSpoolMarkerToPlace] = useState(null);

  const loadPdfFile = useCallback((file) => {
    if (pdfBlob && typeof pdfBlob === "string") URL.revokeObjectURL(pdfBlob);
    setPdfBlob(file);
    setPdfFilename(file.name);
    setWeldPoints([]);
    setSpools([]);
    setSpoolMarkers([]);
    setSpoolMarkerToPlace(null);
    setDrawingSettings({ ndtRequirements: [], weldingSpec: "" });
    setSelectedWeldId(null);
    setProjectId(generateProjectId());
  }, [pdfBlob]);

  const handleModeChange = useCallback((mode) => {
    setAppMode(mode);
    setSpoolMarkerToPlace(null);
    if (mode === "inspection") setFormWeld(null);
  }, []);

  const pdfToBase64 = useCallback(async (source) => {
    const url =
      typeof source === "string" ? source : URL.createObjectURL(source);
    try {
      const blob = await fetch(url).then((r) => r.blob());
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () =>
          resolve(reader.result.replace(/^data:.*?;base64,/, ""));
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } finally {
      if (typeof source !== "string") URL.revokeObjectURL(url);
    }
  }, []);

  useEffect(() => {
    if (!pdfBlob || !projectId) return;
    const timer = setTimeout(async () => {
      try {
        const pdfBase64 = await pdfToBase64(pdfBlob);
        await saveToIndexedDB(projectId, {
          version: PROJECT_FILE_VERSION,
          pdfFilename,
          pdfBase64,
          weldPoints,
          spools,
          spoolMarkers,
          drawingSettings,
        });
      } catch {
        // Ignore save errors (e.g. private window)
      }
    }, AUTO_SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [projectId, pdfBlob, pdfFilename, weldPoints, spools, spoolMarkers, drawingSettings, pdfToBase64]);

  const handleAddWeld = useCallback(
    ({ xPercent, yPercent, pageNumber }) => {
      const newWeld = {
        ...createDefaultWeld(),
        id: generateId(),
        xPercent,
        yPercent,
        indicatorXPercent: xPercent,
        indicatorYPercent: yPercent,
        pageNumber: pageNumber ?? 0,
      };
      setWeldPoints((prev) => [...prev, newWeld]);
      setFormWeld(newWeld);
    },
    []
  );

  const handleAddSpoolMarker = useCallback(
    ({ xPercent, yPercent, pageNumber }) => {
      if (!spoolMarkerToPlace) return;
      const newMarker = {
        id: `spm-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        spoolId: spoolMarkerToPlace,
        xPercent,
        yPercent,
        pageNumber: pageNumber ?? 0,
      };
      setSpoolMarkers((prev) => [...prev, newMarker]);
      setSpoolMarkerToPlace(null);
    },
    [spoolMarkerToPlace]
  );

  const handleDeleteSpoolMarker = useCallback((markerId) => {
    setSpoolMarkers((prev) => prev.filter((m) => m.id !== markerId));
  }, []);

  const handleAssignWeldsToSpool = useCallback((weldIds, spoolId) => {
    setWeldPoints((prev) =>
      prev.map((w) =>
        weldIds.includes(w.id) ? { ...w, spoolId } : w
      )
    );
  }, []);

  const handlePageClick = useCallback(
    ({ xPercent, yPercent, pageNumber }) => {
      if (spoolMarkerToPlace) {
        handleAddSpoolMarker({ xPercent, yPercent, pageNumber });
      } else if (appMode === "edition" && markupTool === "add") {
        handleAddWeld({ xPercent, yPercent, pageNumber });
      } else if (markupTool === "select") {
        setSelectedWeldId(null);
        setFormWeld(null);
      }
    },
    [spoolMarkerToPlace, handleAddSpoolMarker, handleAddWeld, appMode, markupTool]
  );

  const handleWeldClick = useCallback((weld) => {
    setSelectedWeldId(weld.id);
    setFormWeld(weld);
  }, []);

  const handleSaveWeld = useCallback((updatedWeld) => {
    setWeldPoints((prev) =>
      prev.map((w) => (w.id === updatedWeld.id ? updatedWeld : w))
    );
    setFormWeld(null);
    setSelectedWeldId(null);
  }, []);

  const handleCloseForm = useCallback(() => {
    setFormWeld(null);
    setSelectedWeldId(null);
  }, []);

  const handleMoveWeldPoint = useCallback((weldId, { xPercent, yPercent }) => {
    setWeldPoints((prev) =>
      prev.map((w) =>
        w.id === weldId ? { ...w, xPercent, yPercent } : w
      )
    );
  }, []);

  const handleMoveIndicator = useCallback(
    (weldId, { indicatorXPercent, indicatorYPercent }) => {
      setWeldPoints((prev) =>
        prev.map((w) =>
          w.id === weldId
            ? { ...w, indicatorXPercent, indicatorYPercent }
            : w
        )
      );
    },
    []
  );

  const handleDeleteWeld = useCallback((weld) => {
    setWeldPoints((prev) => prev.filter((w) => w.id !== weld.id));
    setFormWeld(null);
    setSelectedWeldId(null);
  }, []);

  const handleOpenProjectFromStorage = useCallback((data) => {
    const pdfBase64 = data.pdfBase64;
    if (!pdfBase64) return;
    const binary = atob(pdfBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    if (pdfBlob && typeof pdfBlob === "string") URL.revokeObjectURL(pdfBlob);
    setPdfBlob(url);
    setPdfFilename(data.pdfFilename || "drawing.pdf");
    setWeldPoints(data.weldPoints || []);
    setSpools(data.spools || []);
    setSpoolMarkers(data.spoolMarkers || []);
    setSpoolMarkerToPlace(null);
    setDrawingSettings(
      migrateDrawingSettings(data.drawingSettings) || {
        ndtRequirements: [],
        weldingSpec: "",
      }
    );
    setFormWeld(null);
    setSelectedWeldId(null);
    setProjectId(data.id);
  }, [pdfBlob]);

  const handleSaveProject = useCallback(async () => {
    if (!pdfBlob) return;
    const pdfBase64 = await pdfToBase64(pdfBlob);
    const payload = {
      version: PROJECT_FILE_VERSION,
      pdfFilename,
      pdfBase64,
      weldPoints,
      spools,
      spoolMarkers,
      drawingSettings,
    };
    if (projectId) {
      try {
        await saveToIndexedDB(projectId, payload);
      } catch {
        // Ignore (e.g. private window)
      }
    }
    saveProject(payload);
  }, [
    pdfBlob,
    projectId,
    pdfFilename,
    weldPoints,
    spools,
    spoolMarkers,
    drawingSettings,
    pdfToBase64,
  ]);

  const handleLoadProject = useCallback(async (file) => {
    try {
      const data = await loadProject(file);
      const pdfBase64 = data.pdfBase64;
      if (!pdfBase64) throw new Error("No PDF in project file");

      const binary = atob(pdfBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      if (pdfBlob && typeof pdfBlob === "string") URL.revokeObjectURL(pdfBlob);
      setPdfBlob(url);
      setPdfFilename(data.pdfFilename || "drawing.pdf");
      setWeldPoints(data.weldPoints || []);
      setSpools(data.spools || []);
      setSpoolMarkers(data.spoolMarkers || []);
      setSpoolMarkerToPlace(null);
      setDrawingSettings(
        migrateDrawingSettings(data.drawingSettings) || {
          ndtRequirements: [],
          weldingSpec: "",
        }
      );
      setFormWeld(null);
      setSelectedWeldId(null);
      setProjectId(generateProjectId());
    } catch (err) {
      alert(err.message || "Failed to load project");
    }
  }, [pdfBlob]);

  const handleExportExcel = useCallback(() => {
    const rows = weldPoints.map((w) => ({
      ID: getWeldName(w, weldPoints),
      "Weld Type": w.weldType || "",
      Location: w.weldLocation === "field" ? "Field" : "Shop",
      "X %": w.xPercent?.toFixed(2),
      "Y %": w.yPercent?.toFixed(2),
      Page: (w.pageNumber ?? 0) + 1,
      "Welder Name": w.welderName || "",
      "Date Welded": w.weldingDate || "",
      "Fitter Name": w.fitterName || "",
      "Date Fit-up": w.dateFitUp || "",
      "Part 1": w.partNumber1 || "",
      "Part 2": w.partNumber2 || "",
      "Heat 1": w.heatNumber1 || "",
      "Heat 2": w.heatNumber2 || "",
      "NDT Required": w.ndtRequired || "",
      "Visual Insp": w.visualInspection ? "Yes" : "No",
      Spool: spools.find((s) => s.id === w.spoolId)?.name || "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Welds");
    XLSX.writeFile(wb, `${pdfFilename.replace(".pdf", "")}-welds.xlsx`);
  }, [weldPoints, pdfFilename, spools]);

  return (
    <div className="container mx-auto p-4">
      <header className="mb-4 flex items-center justify-between">
        <Link
          href="/"
          className="text-lg font-semibold text-primary hover:underline"
        >
          Weld Dashboard
        </Link>
      </header>
      <OfflineBanner />
      <Toolbar
        hasPdf={!!pdfBlob}
        hasWelds={weldPoints.length > 0}
        appMode={appMode}
        onModeChange={handleModeChange}
        onLoadPdf={loadPdfFile}
        onLoadProject={handleLoadProject}
        onSaveProject={handleSaveProject}
        onExportExcel={handleExportExcel}
        onOpenSettings={() => setShowSettings(true)}
        onOpenSpools={() => setShowSpools(true)}
        onOpenProjects={() => setShowProjects(true)}
      />

      {pdfBlob && appMode === "edition" && (
        <MarkupToolbar
          markupTool={markupTool}
          onToolChange={setMarkupTool}
          className="mb-2"
        />
      )}

      <div className="relative bg-base-100 rounded-lg overflow-hidden shadow">
        {pdfBlob ? (
          <>
            <PDFViewerDynamic
              key={
                typeof pdfBlob === "string"
                  ? pdfBlob
                  : pdfBlob.name + pdfBlob.lastModified
              }
              pdfBlob={pdfBlob}
              onPageClick={handlePageClick}
              containerRef={containerRef}
              weldPoints={weldPoints}
              selectedWeldId={selectedWeldId}
              onWeldClick={handleWeldClick}
              appMode={appMode}
              markupTool={markupTool}
              onMoveWeldPoint={handleMoveWeldPoint}
              onMoveIndicator={handleMoveIndicator}
              spoolMarkers={spoolMarkers}
              spools={spools}
              onDeleteSpoolMarker={handleDeleteSpoolMarker}
              spoolMarkerToPlace={spoolMarkerToPlace}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-base-content/60">
            <p className="text-lg">Load a PDF or open a project to get started</p>
            <p className="text-sm mt-2">Click on the drawing to add weld points</p>
          </div>
        )}
      </div>

      <ModalWeldForm
        weld={formWeld}
        isOpen={!!formWeld}
        onClose={handleCloseForm}
        onSave={handleSaveWeld}
        onDelete={handleDeleteWeld}
        appMode={appMode}
        spools={spools}
        ndtAutoLabel={formatNdtRequirements(drawingSettings.ndtRequirements)}
      />

      <ModalDrawingSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={drawingSettings}
        onSave={(s) => {
          setDrawingSettings(s);
          setShowSettings(false);
        }}
      />

      <ModalSpools
        isOpen={showSpools}
        onClose={() => setShowSpools(false)}
        spools={spools}
        appMode={appMode}
        onSave={(newSpools) => {
          setSpools(newSpools);
          setSpoolMarkers((prev) =>
            prev.filter((m) => newSpools.some((s) => s.id === m.spoolId))
          );
        }}
        spoolMarkers={spoolMarkers}
        onPlaceSpoolMarker={
          appMode === "edition"
            ? (spoolId) => {
                setSpoolMarkerToPlace(spoolId);
                setShowSpools(false);
              }
            : undefined
        }
        weldPoints={weldPoints}
        onAssignWeldsToSpool={handleAssignWeldsToSpool}
      />

      <ModalProjects
        isOpen={showProjects}
        onClose={() => setShowProjects(false)}
        onOpenProject={handleOpenProjectFromStorage}
      />
    </div>
  );
}
