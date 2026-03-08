"use client";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Toolbar from "@/components/Toolbar";
import MarkupToolbar from "@/components/MarkupToolbar";
import PDFViewer from "@/components/PDFViewer";
import SidePanelWeldForm from "@/components/SidePanelWeldForm";
import SidePanelSpools from "@/components/SidePanelSpools";
import DashboardAnalytics from "@/components/DashboardAnalytics";
import ModalParameters from "@/components/ModalParameters";
import ModalProjects from "@/components/ModalProjects";
import NdtKanbanPage from "@/components/NdtKanbanPage";
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
import { createDefaultWeld, createDefaultSpool } from "@/lib/defaults";
import { getWeldName, getWeldOverallStatus, computeNdtSelection } from "@/lib/weld-utils";
import { formatNdtRequirements, NDT_REPORT_STATUS } from "@/lib/constants";
import { exportWeldsToExcel } from "@/lib/excel-export";
import { applyReportToWelds } from "@/lib/ndt-utils";

const PDFViewerDynamic = dynamic(() => import("@/components/PDFViewer"), {
  ssr: false,
  loading: () => <div className="p-8">Loading viewer...</div>,
});

function generateId() {
  return `wp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function applyCompletedReportsToWelds(weldPoints, ndtReports) {
  if (!Array.isArray(ndtReports) || !Array.isArray(weldPoints)) return weldPoints || [];
  let points = weldPoints;
  const completed = ndtReports.filter((r) => r.status === NDT_REPORT_STATUS.COMPLETED);
  completed.forEach((report) => {
    points = applyReportToWelds(report, points);
  });
  return points;
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
  const [selectedSpoolMarkerId, setSelectedSpoolMarkerId] = useState(null);
  const [formWeld, setFormWeld] = useState(null);
  const [showWeldPanel, setShowWeldPanel] = useState(false);
  const [showSpoolPanel, setShowSpoolPanel] = useState(false);
  const [showParameters, setShowParameters] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [showNdtPanel, setShowNdtPanel] = useState(false);
  const [projectId, setProjectId] = useState(null);
  const [spoolMarkers, setSpoolMarkers] = useState([]);
  const [personnel, setPersonnel] = useState({ fitters: [], welders: [], wqrs: [] });
  const [ndtRequests, setNdtRequests] = useState([]);
  const [ndtReports, setNdtReports] = useState([]);

  const loadPdfFile = useCallback((file) => {
    if (pdfBlob && typeof pdfBlob === "string") URL.revokeObjectURL(pdfBlob);
    setPdfBlob(file);
    setPdfFilename(file.name);
    setWeldPoints([]);
    setSpools([]);
    setSpoolMarkers([]);
    setPersonnel({ fitters: [], welders: [], wqrs: [] });
    setDrawingSettings({ ndtRequirements: [], weldingSpec: "" });
    setSelectedWeldId(null);
    setSelectedSpoolMarkerId(null);
    setProjectId(generateProjectId());
    setNdtRequests([]);
    setNdtReports([]);
  }, [pdfBlob]);

  const handleModeChange = useCallback((mode) => {
    setAppMode(mode);
    if (mode === "inspection") setFormWeld(null);
  }, []);

  const handleToolChange = useCallback((tool) => {
    setMarkupTool(tool);
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

  const handleAddWeld = useCallback(
    ({ xPercent, yPercent, pageNumber }) => {
      let newWeld;
      setWeldPoints((prev) => {
        const loc = "shop";
        const sameType = prev.filter((w) => (w.weldLocation || "shop") === loc);
        const maxNum = sameType.reduce((m, w) => Math.max(m, w.weldNumber ?? 0), 0);
        const labelOffset = 4;
        newWeld = {
          ...createDefaultWeld(),
          id: generateId(),
          xPercent,
          yPercent,
          indicatorXPercent: Math.min(100, Math.max(0, xPercent + labelOffset)),
          indicatorYPercent: Math.min(100, Math.max(0, yPercent - labelOffset)),
          pageNumber: pageNumber ?? 0,
          weldNumber: maxNum + 1,
        };
        return [...prev, newWeld];
      });
    },
    []
  );

  const handleAddSpoolMarker = useCallback(
    ({ xPercent, yPercent, pageNumber }) => {
      const labelOffset = 4;
      let newSpool;
      setSpools((prev) => {
        const used = prev
          .map((s) => s.name?.match(/^SP-([A-Z]+)$/i)?.[1])
          .filter(Boolean);
        let nextLetter = "A";
        if (used.length > 0) {
          const max = used.reduce((m, c) =>
            c.length > m.length || (c.length === m.length && c > m) ? c : m
          );
          if (max.length === 1) {
            const code = max.charCodeAt(0);
            nextLetter = code < 90 ? String.fromCharCode(code + 1) : "AA";
          } else {
            const last = max.charCodeAt(max.length - 1);
            nextLetter =
              last < 90
                ? max.slice(0, -1) + String.fromCharCode(last + 1)
                : max + "A";
          }
        }
        newSpool = createDefaultSpool({ name: `SP-${nextLetter}` });
        return [...prev, newSpool];
      });
      const newMarker = {
        id: `spm-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        spoolId: null,
        xPercent,
        yPercent,
        indicatorXPercent: Math.min(100, Math.max(0, xPercent + labelOffset)),
        indicatorYPercent: Math.min(100, Math.max(0, yPercent - labelOffset)),
        pageNumber: pageNumber ?? 0,
      };
      setSpoolMarkers((prev) => [
        ...prev,
        { ...newMarker, spoolId: newSpool.id },
      ]);
    },
    []
  );

  const handleDeleteSpoolMarker = useCallback((markerId) => {
    setSpoolMarkers((prev) => prev.filter((m) => m.id !== markerId));
    setSelectedSpoolMarkerId(null);
  }, []);

  const handleSpoolMarkerClick = useCallback((marker) => {
    setSelectedSpoolMarkerId(marker.id);
    setSelectedWeldId(null);
  }, []);

  const handleMoveSpoolMarker = useCallback((markerId, { xPercent, yPercent }) => {
    setSpoolMarkers((prev) =>
      prev.map((m) =>
        m.id === markerId ? { ...m, xPercent, yPercent } : m
      )
    );
  }, []);

  const handleMoveSpoolIndicator = useCallback(
    (markerId, { indicatorXPercent, indicatorYPercent }) => {
      setSpoolMarkers((prev) =>
        prev.map((m) =>
          m.id === markerId
            ? { ...m, indicatorXPercent, indicatorYPercent }
            : m
        )
      );
    },
    []
  );

  const handlePageClick = useCallback(
    ({ xPercent, yPercent, pageNumber }) => {
      if (appMode === "edition" && markupTool === "addSpool") {
        handleAddSpoolMarker({ xPercent, yPercent, pageNumber });
      } else if (appMode === "edition" && markupTool === "add") {
        handleAddWeld({ xPercent, yPercent, pageNumber });
      } else if (markupTool === "select") {
        setSelectedWeldId(null);
        setSelectedSpoolMarkerId(null);
        setFormWeld(null);
      }
    },
    [handleAddSpoolMarker, handleAddWeld, appMode, markupTool]
  );

  const handleWeldClick = useCallback((weld) => {
    setSelectedWeldId(weld.id);
    setSelectedSpoolMarkerId(null);
  }, []);

  const handleWeldDoubleClick = useCallback((weld) => {
    setFormWeld(weld);
    setSelectedWeldId(weld.id);
    setShowWeldPanel(true);
  }, []);

  const handleSaveWeld = useCallback((updatedWeld) => {
    setWeldPoints((prev) =>
      prev.map((w) => (w.id === updatedWeld.id ? updatedWeld : w))
    );
    setFormWeld(updatedWeld);
  }, []);

  const handleClosePanel = useCallback(() => {
    setFormWeld(null);
    setSelectedWeldId(null);
    setShowWeldPanel(false);
  }, []);

  const handleBackToList = useCallback(() => {
    setFormWeld(null);
    setSelectedWeldId(null);
  }, []);

  const handleAssignWeldToSpool = useCallback((weldId, spoolId) => {
    setWeldPoints((prev) =>
      prev.map((w) => (w.id === weldId ? { ...w, spoolId } : w))
    );
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

  const handleResizeLabel = useCallback((weldId, { labelFontSize }) => {
    setWeldPoints((prev) =>
      prev.map((w) => (w.id === weldId ? { ...w, labelFontSize } : w))
    );
  }, []);

  const handleMoveLineBend = useCallback(
    (weldId, { lineBendXPercent, lineBendYPercent }) => {
      setWeldPoints((prev) =>
        prev.map((w) =>
          w.id === weldId
            ? { ...w, lineBendXPercent, lineBendYPercent }
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
    setShowWeldPanel(false);
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
    const loadedReports = Array.isArray(data.ndtReports) ? data.ndtReports : [];
    setWeldPoints(applyCompletedReportsToWelds(data.weldPoints || [], loadedReports));
    setSpools(data.spools || []);
    setSpoolMarkers(data.spoolMarkers || []);
    setPersonnel(data.personnel || { fitters: [], welders: [], wqrs: [] });
    setDrawingSettings(
      migrateDrawingSettings(data.drawingSettings) || {
        ndtRequirements: [],
        weldingSpec: "",
      }
    );
    setNdtRequests(Array.isArray(data.ndtRequests) ? data.ndtRequests : []);
    setNdtReports(loadedReports);
    setFormWeld(null);
    setSelectedWeldId(null);
    setSelectedSpoolMarkerId(null);
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
      personnel,
      drawingSettings,
      ndtRequests,
      ndtReports,
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
    personnel,
    drawingSettings,
    ndtRequests,
    ndtReports,
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
      const loadedReports = Array.isArray(data.ndtReports) ? data.ndtReports : [];
      setWeldPoints(applyCompletedReportsToWelds(data.weldPoints || [], loadedReports));
      setSpools(data.spools || []);
      setSpoolMarkers(data.spoolMarkers || []);
      setPersonnel(data.personnel || { fitters: [], welders: [], wqrs: [] });
      setDrawingSettings(
        migrateDrawingSettings(data.drawingSettings) || {
          ndtRequirements: [],
          weldingSpec: "",
        }
      );
      setNdtRequests(Array.isArray(data.ndtRequests) ? data.ndtRequests : []);
      setNdtReports(loadedReports);
      setFormWeld(null);
      setSelectedWeldId(null);
      setSelectedSpoolMarkerId(null);
      setProjectId(generateProjectId());
    } catch (err) {
      alert(err.message || "Failed to load project");
    }
  }, [pdfBlob]);

  const handleExportExcel = useCallback(() => {
    exportWeldsToExcel(weldPoints, {
      pdfFilename,
      spools,
      personnel,
      drawingSettings,
    });
  }, [weldPoints, pdfFilename, spools, personnel, drawingSettings]);

  const weldStatusByWeldId = useMemo(() => {
    const map = new Map();
    weldPoints.forEach((w) => {
      const ndtSel = computeNdtSelection(w, drawingSettings, weldPoints);
      map.set(w.id, getWeldOverallStatus(w, ndtSel));
    });
    return map;
  }, [weldPoints, drawingSettings]);

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
        onOpenParameters={() => setShowParameters(true)}
        onOpenProjects={() => setShowProjects(true)}
        onOpenNdt={() => setShowNdtPanel(true)}
      />

      {showNdtPanel ? (
        <div className="flex-1 min-h-0 flex flex-col rounded-lg overflow-hidden shadow bg-base-100">
          <NdtKanbanPage
            ndtRequests={ndtRequests}
            ndtReports={ndtReports}
            setNdtRequests={setNdtRequests}
            setNdtReports={setNdtReports}
            weldPoints={weldPoints}
            setWeldPoints={setWeldPoints}
            drawingSettings={drawingSettings}
            getWeldName={getWeldName}
            onClose={() => setShowNdtPanel(false)}
          />
        </div>
      ) : (
        <>
          {pdfBlob && appMode === "edition" && (
            <MarkupToolbar
              markupTool={markupTool}
              onToolChange={handleToolChange}
              className="mb-2"
            />
          )}

          {pdfBlob && (
            <DashboardAnalytics
              weldPoints={weldPoints}
              weldStatusByWeldId={weldStatusByWeldId}
              drawingSettings={drawingSettings}
              spools={spools}
            />
          )}

          <div className="flex gap-0 rounded-lg overflow-hidden shadow bg-base-100">
            {pdfBlob ? (
              <>
                <div className="flex-1 min-w-0 relative">
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
                    onWeldDoubleClick={handleWeldDoubleClick}
                    appMode={appMode}
                    markupTool={markupTool}
                    onMoveWeldPoint={handleMoveWeldPoint}
                    onMoveIndicator={handleMoveIndicator}
                    onResizeLabel={handleResizeLabel}
                    onMoveLineBend={handleMoveLineBend}
                    spoolMarkers={spoolMarkers}
                    spools={spools}
                    selectedSpoolMarkerId={selectedSpoolMarkerId}
                    onSpoolMarkerClick={handleSpoolMarkerClick}
                    onMoveSpoolMarker={handleMoveSpoolMarker}
                    onMoveSpoolIndicator={handleMoveSpoolIndicator}
                    onDeleteSpoolMarker={handleDeleteSpoolMarker}
                    weldStatusByWeldId={weldStatusByWeldId}
                  />
                </div>
                <div
                  className={`flex flex-shrink-0 overflow-hidden transition-all duration-300 ease-out ${
                    !showWeldPanel && !showSpoolPanel ? "flex-col w-10" : "flex-row"
                  }`}
                >
                  <SidePanelWeldForm
                    weldPoints={weldPoints}
                    weldStatusByWeldId={weldStatusByWeldId}
                    weld={formWeld}
                    selectedWeldId={selectedWeldId}
                    isOpen={showWeldPanel}
                    onToggle={() => {
                      setShowSpoolPanel(false);
                      setShowWeldPanel((v) => !v);
                    }}
                    onSelectWeld={(w) => {
                      setFormWeld(w);
                      setSelectedWeldId(w.id);
                    }}
                    onBackToList={handleBackToList}
                    onSave={handleSaveWeld}
                    onDelete={handleDeleteWeld}
                    appMode={appMode}
                    spools={spools}
                    personnel={personnel}
                    ndtAutoLabel={formatNdtRequirements(drawingSettings.ndtRequirements)}
                    drawingSettings={drawingSettings}
                    isStacked={!showWeldPanel && !showSpoolPanel}
                  />
                  <SidePanelSpools
                    spools={spools}
                    isOpen={showSpoolPanel}
                    onToggle={() => {
                      setShowWeldPanel(false);
                      setShowSpoolPanel((v) => !v);
                    }}
                    isStacked={!showWeldPanel && !showSpoolPanel}
                  onSave={(newSpools) => {
                    setSpools(newSpools);
                    setSpoolMarkers((prev) =>
                      prev.filter((m) => newSpools.some((s) => s.id === m.spoolId))
                    );
                  }}
                  onAssignWeldToSpool={handleAssignWeldToSpool}
                  spoolMarkers={spoolMarkers}
                  appMode={appMode}
                  weldPoints={weldPoints}
                  weldStatusByWeldId={weldStatusByWeldId}
                    getWeldName={getWeldName}
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-base-content/60">
                <p className="text-lg">Load a PDF or open a project to get started</p>
                <p className="text-sm mt-2">Click on the drawing to add weld points</p>
              </div>
            )}
          </div>
        </>
      )}

      <ModalParameters
        isOpen={showParameters}
        onClose={() => setShowParameters(false)}
        settings={drawingSettings}
        personnel={personnel}
        onSave={({ drawingSettings: s, personnel: p }) => {
          if (s != null) setDrawingSettings(s);
          if (p != null) setPersonnel(p);
        }}
      />

      <ModalProjects
        isOpen={showProjects}
        onClose={() => setShowProjects(false)}
        onOpenProject={handleOpenProjectFromStorage}
      />
    </div>
  );
}
