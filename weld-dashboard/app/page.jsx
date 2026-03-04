"use client";

import { useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Toolbar from "@/components/Toolbar";
import PDFViewer from "@/components/PDFViewer";
import ModalWeldForm from "@/components/ModalWeldForm";
import ModalDrawingSettings from "@/components/ModalDrawingSettings";
import ModalSpools from "@/components/ModalSpools";
import { saveProject, loadProject, PROJECT_FILE_VERSION } from "@/lib/project-file";
import { createDefaultWeld } from "@/lib/defaults";
import * as XLSX from "xlsx";

const PDFViewerDynamic = dynamic(() => import("@/components/PDFViewer"), {
  ssr: false,
  loading: () => <div className="p-8">Loading viewer...</div>,
});

function generateId() {
  return `wp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function Home() {
  const containerRef = useRef(null);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [pdfFilename, setPdfFilename] = useState("");
  const [weldPoints, setWeldPoints] = useState([]);
  const [spools, setSpools] = useState([]);
  const [drawingSettings, setDrawingSettings] = useState({
    ndtPresetId: "",
    ndtPresetLabel: "",
    weldingSpec: "",
  });
  const [selectedWeldId, setSelectedWeldId] = useState(null);
  const [formWeld, setFormWeld] = useState(null);
  const [isRelocating, setIsRelocating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSpools, setShowSpools] = useState(false);

  const loadPdfFile = useCallback((file) => {
    if (pdfBlob && typeof pdfBlob === "string") URL.revokeObjectURL(pdfBlob);
    setPdfBlob(file);
    setPdfFilename(file.name);
    setWeldPoints([]);
    setSpools([]);
    setDrawingSettings({ ndtPresetId: "", ndtPresetLabel: "", weldingSpec: "" });
    setSelectedWeldId(null);
    setIsRelocating(false);
  }, [pdfBlob]);

  const handleAddWeld = useCallback(
    ({ xPercent, yPercent, pageNumber }) => {
      const newWeld = {
        ...createDefaultWeld(),
        id: generateId(),
        xPercent,
        yPercent,
        pageNumber: pageNumber ?? 0,
      };
      setWeldPoints((prev) => [...prev, newWeld]);
      setFormWeld(newWeld);
    },
    []
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
    setIsRelocating(false);
  }, []);

  const handleMoveWeld = useCallback((weld) => {
    setFormWeld(null);
    setSelectedWeldId(weld.id);
    setIsRelocating(true);
  }, []);

  const handleRelocateWeld = useCallback(
    ({ xPercent, yPercent }) => {
      if (!selectedWeldId) return;
      setWeldPoints((prev) =>
        prev.map((w) =>
          w.id === selectedWeldId
            ? { ...w, xPercent, yPercent }
            : w
        )
      );
      setSelectedWeldId(null);
      setIsRelocating(false);
    },
    [selectedWeldId]
  );

  const handleDeleteWeld = useCallback((weld) => {
    setWeldPoints((prev) => prev.filter((w) => w.id !== weld.id));
    setFormWeld(null);
    setSelectedWeldId(null);
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

  const handleSaveProject = useCallback(async () => {
    if (!pdfBlob) return;
    const pdfBase64 = await pdfToBase64(pdfBlob);
    saveProject({
      version: PROJECT_FILE_VERSION,
      pdfFilename,
      pdfBase64,
      weldPoints,
      spools,
      drawingSettings,
    });
  }, [pdfBlob, pdfFilename, weldPoints, spools, drawingSettings, pdfToBase64]);

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

      if (pdfBlob) URL.revokeObjectURL(pdfBlob);
      setPdfBlob(url);
      setPdfFilename(data.pdfFilename || "drawing.pdf");
      setWeldPoints(data.weldPoints || []);
      setSpools(data.spools || []);
      setDrawingSettings(data.drawingSettings || {
        ndtPresetId: "",
        ndtPresetLabel: "",
        weldingSpec: "",
      });
      setFormWeld(null);
      setSelectedWeldId(null);
      setIsRelocating(false);
    } catch (err) {
      alert(err.message || "Failed to load project");
    }
  }, [pdfBlob]);

  const handleExportExcel = useCallback(() => {
    const rows = weldPoints.map((w) => ({
      ID: w.id,
      Status: w.status || "",
      "Weld Type": w.weldType || "",
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
      <Toolbar
        hasPdf={!!pdfBlob}
        hasWelds={weldPoints.length > 0}
        onLoadPdf={loadPdfFile}
        onLoadProject={handleLoadProject}
        onSaveProject={handleSaveProject}
        onExportExcel={handleExportExcel}
        onOpenSettings={() => setShowSettings(true)}
        onOpenSpools={() => setShowSpools(true)}
      />

      <div className="relative bg-base-100 rounded-lg overflow-hidden shadow">
        {pdfBlob ? (
          <>
            {isRelocating && (
              <div className="alert alert-info mx-4 mt-2">
                <span>Click on the drawing to move the selected weld point</span>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => setIsRelocating(false)}
                >
                  Cancel
                </button>
              </div>
            )}
            <PDFViewerDynamic
              key={
                typeof pdfBlob === "string"
                  ? pdfBlob
                  : pdfBlob.name + pdfBlob.lastModified
              }
              pdfBlob={pdfBlob}
              onPageClick={handleAddWeld}
              onRelocateClick={handleRelocateWeld}
              containerRef={containerRef}
              weldPoints={weldPoints}
              selectedWeldId={selectedWeldId}
              onWeldClick={handleWeldClick}
              isRelocating={isRelocating}
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
        onMove={handleMoveWeld}
        onDelete={handleDeleteWeld}
        spools={spools}
        ndtAutoLabel={drawingSettings.ndtPresetLabel}
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
        onSave={setSpools}
      />
    </div>
  );
}
