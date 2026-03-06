"use client";

import { Document, Page, pdfjs } from "react-pdf";
import { useCallback, useEffect, useRef, useState } from "react";
import WeldOverlay from "./WeldOverlay";
import SpoolMarker from "./SpoolMarker";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

const MIN_SCALE = 0.5;
const MAX_SCALE = 2.5;
const SCALE_STEP = 0.25;

function PDFViewer({
  pdfBlob,
  onPageClick,
  containerRef,
  scale: initialScale = 1.2,
  weldPoints = [],
  selectedWeldId,
  onWeldClick,
  appMode = "edition",
  markupTool = "select",
  onMoveWeldPoint,
  onMoveIndicator,
  spoolMarkers = [],
  spools = [],
  onDeleteSpoolMarker,
  spoolMarkerToPlace = null,
}) {
  const [loadError, setLoadError] = useState(null);
  const [scale, setScale] = useState(initialScale);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const pageWrapperRef = useRef(null);

  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setNumPages(null);
  }, [pdfBlob]);

  const handleZoomIn = useCallback(() => {
    setScale((s) => Math.min(MAX_SCALE, s + SCALE_STEP));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((s) => Math.max(MIN_SCALE, s - SCALE_STEP));
  }, []);

  const handleClick = useCallback(
    (e) => {
      const target = pageWrapperRef.current;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      onPageClick?.({ xPercent: x, yPercent: y, pageNumber: currentPage - 1 });
    },
    [onPageClick, currentPage]
  );

  const weldPointsOnPage = weldPoints.filter(
    (w) => (w.pageNumber ?? 0) === currentPage - 1
  );
  const spoolMarkersOnPage = spoolMarkers.filter(
    (m) => (m.pageNumber ?? 0) === currentPage - 1
  );

  if (!pdfBlob) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="btn btn-sm btn-square btn-outline min-h-12 min-w-12"
          onClick={handleZoomOut}
          disabled={scale <= MIN_SCALE}
          aria-label="Zoom out"
        >
          −
        </button>
        <span className="text-sm tabular-nums min-w-[4rem] py-2">
          {Math.round(scale * 100)}%
        </span>
        <button
          type="button"
          className="btn btn-sm btn-square btn-outline min-h-12 min-w-12"
          onClick={handleZoomIn}
          disabled={scale >= MAX_SCALE}
          aria-label="Zoom in"
        >
          +
        </button>
        {numPages !== null && numPages > 1 && (
          <div className="flex items-center gap-1 ml-2 pl-2 border-l border-base-300">
            <button
              type="button"
              className="btn btn-sm btn-square btn-ghost min-h-12 min-w-12"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              aria-label="Previous page"
            >
              ‹
            </button>
            <span className="text-sm tabular-nums min-w-[5rem] py-2 text-center">
              {currentPage} / {numPages}
            </span>
            <button
              type="button"
              className="btn btn-sm btn-square btn-ghost min-h-12 min-w-12"
              onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
              disabled={currentPage >= numPages}
              aria-label="Next page"
            >
              ›
            </button>
          </div>
        )}
      </div>
      <div
        ref={containerRef}
        className={`relative bg-base-100 overflow-auto max-h-[calc(100dvh-10rem)] min-h-[50dvh] touch-pan-x touch-pan-y ${appMode === "edition" && markupTool === "add" ? "cursor-crosshair" : "cursor-default"}`}
      >
        <div
          ref={pageWrapperRef}
          className="relative inline-block min-w-0"
          onClick={handleClick}
        >
          <Document
            file={pdfBlob}
            loading={<div className="p-8">Loading PDF...</div>}
            error={
              loadError ? (
                <div className="p-8 text-error">
                  <p className="font-semibold">Failed to load PDF</p>
                  <p className="text-sm mt-2">{loadError}</p>
                </div>
              ) : null
            }
            onLoadError={(error) => setLoadError(error?.message || "Load error")}
            onSourceError={(error) =>
              setLoadError(error?.message || "Source error - check file or worker")
            }
            onLoadSuccess={({ numPages: n }) => {
              setLoadError(null);
              setNumPages(n);
            }}
          >
            <Page
              pageNumber={currentPage}
              scale={scale}
              renderTextLayer={false}
            />
          </Document>
          <WeldOverlay
            weldPoints={weldPointsOnPage}
            selectedWeldId={selectedWeldId}
            onWeldClick={onWeldClick}
            appMode={appMode}
            canDrag={appMode === "edition"}
            pageWrapperRef={pageWrapperRef}
            onMoveWeldPoint={onMoveWeldPoint}
            onMoveIndicator={onMoveIndicator}
          />
          <div className="absolute inset-0 pointer-events-none">
            {spoolMarkersOnPage.map((m) => (
              <SpoolMarker
                key={m.id}
                marker={m}
                spoolName={spools.find((s) => s.id === m.spoolId)?.name}
                onDelete={onDeleteSpoolMarker}
              />
            ))}
          </div>
          {spoolMarkerToPlace && (
            <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-sm bg-base-200 px-3 py-1 rounded-full pointer-events-none">
              Click on the drawing to place spool marker
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default PDFViewer;
