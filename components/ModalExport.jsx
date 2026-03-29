"use client";

import { useState, useCallback } from "react";

function ModalExport({
  isOpen,
  onClose,
  onExportExcel,
  onDrawingExport,
  hasPdf,
  hasWelds,
  hasSpools,
  hasParts,
}) {
  const [includeIndications, setIncludeIndications] = useState(true);
  const [markerWelds, setMarkerWelds] = useState(true);
  const [markerSpools, setMarkerSpools] = useState(true);
  const [markerParts, setMarkerParts] = useState(true);
  const [markerLines, setMarkerLines] = useState(true);

  const runDrawingExport = useCallback(
    async (exportAction) => {
      if (!hasPdf) return;
      try {
        await onDrawingExport({
          pdfDrawing: true,
          includeDrawingMarkers: includeIndications,
          markers: {
            welds: markerWelds,
            spools: markerSpools,
            parts: markerParts,
            lines: markerLines,
          },
          exportAction,
        });
      } finally {
        onClose();
      }
    },
    [
      hasPdf,
      includeIndications,
      markerWelds,
      markerSpools,
      markerParts,
      markerLines,
      onDrawingExport,
      onClose,
    ]
  );

  const handleExcel = useCallback(() => {
    if (!hasWelds) return;
    onExportExcel?.();
  }, [hasWelds, onExportExcel]);

  if (!isOpen) return null;

  return (
    <dialog className="modal modal-open" open={isOpen}>
      <div className="modal-box max-w-md">
        <h3 className="font-bold text-lg">Export</h3>
        <p className="text-sm text-base-content/70 mt-1">
          Download weld data as Excel, or export the active drawing as PDF (all pages).
        </p>

        <div className="mt-4 space-y-5">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
              Weld data
            </p>
            <button
              type="button"
              className="btn btn-secondary btn-block"
              disabled={!hasWelds}
              onClick={handleExcel}
            >
              Download Excel
            </button>
            {!hasWelds && (
              <p className="text-xs text-base-content/60">Add welds to enable Excel export.</p>
            )}
          </div>

          <div className="divider my-0" />

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
              Drawing PDF
            </p>
            {!hasPdf ? (
              <p className="text-sm text-warning">Load a PDF on the active drawing to export sheets.</p>
            ) : (
              <>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={includeIndications}
                    onChange={(e) => setIncludeIndications(e.target.checked)}
                  />
                  Include indications (markers)
                </label>
                {includeIndications && (
                  <div className="pl-1 space-y-2 border-l-2 border-base-300 pl-3 ml-1">
                    <p className="text-xs text-base-content/60">Marker types</p>
                    <div className="space-y-1.5">
                      {hasWelds && (
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            className="checkbox checkbox-xs"
                            checked={markerWelds}
                            onChange={(e) => setMarkerWelds(e.target.checked)}
                          />
                          Welds
                        </label>
                      )}
                      {hasSpools && (
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            className="checkbox checkbox-xs"
                            checked={markerSpools}
                            onChange={(e) => setMarkerSpools(e.target.checked)}
                          />
                          Spools
                        </label>
                      )}
                      {hasParts && (
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            className="checkbox checkbox-xs"
                            checked={markerParts}
                            onChange={(e) => setMarkerParts(e.target.checked)}
                          />
                          Parts
                        </label>
                      )}
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
              </>
            )}
          </div>
        </div>

        <div className="modal-action flex-wrap gap-2">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="btn btn-outline btn-primary"
            disabled={!hasPdf}
            onClick={() => runDrawingExport("print")}
          >
            Print PDF
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!hasPdf}
            onClick={() => runDrawingExport("download")}
          >
            Download PDF
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

export default ModalExport;
