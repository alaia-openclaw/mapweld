"use client";

import { useState, useCallback } from "react";

function ModalPrint({
  isOpen,
  onClose,
  onPrint,
  hasPdf,
  hasWelds,
  hasSpools,
  hasParts,
}) {
  const [pdfDrawing, setPdfDrawing] = useState(true);
  const [markerWelds, setMarkerWelds] = useState(true);
  const [markerSpools, setMarkerSpools] = useState(true);
  const [markerParts, setMarkerParts] = useState(true);
  const [markerLines, setMarkerLines] = useState(true);
  const [weldMap, setWeldMap] = useState(true);
  const [projectProgress, setProjectProgress] = useState(true);
  const [projectSummary, setProjectSummary] = useState(true);

  const hasAny = pdfDrawing || weldMap || projectProgress || projectSummary;

  const handlePrint = useCallback(() => {
    onPrint({
      pdfDrawing: hasPdf && pdfDrawing,
      markers: {
        welds: markerWelds,
        spools: markerSpools,
        parts: markerParts,
        lines: markerLines,
      },
      weldMap: hasWelds && weldMap,
      projectProgress,
      projectSummary,
    });
    onClose();
  }, [
    pdfDrawing,
    markerWelds,
    markerSpools,
    markerParts,
    markerLines,
    weldMap,
    projectProgress,
    projectSummary,
    hasPdf,
    hasWelds,
    onPrint,
    onClose,
  ]);

  if (!isOpen) return null;

  return (
    <dialog className="modal modal-open" open={isOpen}>
      <div className="modal-box max-w-md">
        <h3 className="font-bold text-lg">Print</h3>
        <p className="text-sm text-base-content/70 mt-1">
          Select what to include. Printer, format, and layout are chosen in the print dialog.
        </p>

        <div className="mt-4 space-y-4">
          {hasPdf && (
            <div className="space-y-2">
              <label className="font-medium flex items-center gap-2">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  checked={pdfDrawing}
                  onChange={(e) => setPdfDrawing(e.target.checked)}
                />
                PDF drawing
              </label>
              <div className="pl-6 space-y-1.5">
                <p className="text-xs text-base-content/60">Markers on drawing:</p>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-xs"
                    checked={markerWelds}
                    onChange={(e) => setMarkerWelds(e.target.checked)}
                  />
                  Welds
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-xs"
                    checked={markerSpools}
                    onChange={(e) => setMarkerSpools(e.target.checked)}
                  />
                  Spools
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-xs"
                    checked={markerParts}
                    onChange={(e) => setMarkerParts(e.target.checked)}
                  />
                  Parts
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-xs"
                    checked={markerLines}
                    onChange={(e) => setMarkerLines(e.target.checked)}
                  />
                  Lines
                </label>
              </div>
            </div>
          )}

          {hasWelds && (
            <label className="font-medium flex items-center gap-2">
              <input
                type="checkbox"
                className="checkbox checkbox-sm"
                checked={weldMap}
                onChange={(e) => setWeldMap(e.target.checked)}
              />
              Weld map (table)
            </label>
          )}

          <label className="font-medium flex items-center gap-2">
            <input
              type="checkbox"
              className="checkbox checkbox-sm"
              checked={projectProgress}
              onChange={(e) => setProjectProgress(e.target.checked)}
            />
            Project progress
          </label>

          <label className="font-medium flex items-center gap-2">
            <input
              type="checkbox"
              className="checkbox checkbox-sm"
              checked={projectSummary}
              onChange={(e) => setProjectSummary(e.target.checked)}
            />
            Project weld summary
          </label>
        </div>

        <div className="modal-action">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handlePrint}
            disabled={!hasAny}
          >
            Print…
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={onClose} aria-label="Close">
          close
        </button>
      </form>
    </dialog>
  );
}

export default ModalPrint;
