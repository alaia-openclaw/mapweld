"use client";

import { Document, Page, pdfjs } from "react-pdf";
import { useCallback, useEffect, useRef, useState } from "react";
import WeldOverlay from "./WeldOverlay";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

const MIN_SCALE = 0.5;
const MAX_SCALE = 2.5;
const SCALE_STEP = 0.25;

function PDFViewer({
  pdfBlob,
  onPageClick,
  onRelocateClick,
  containerRef,
  scale: initialScale = 1.2,
  weldPoints = [],
  selectedWeldId,
  onWeldClick,
  isRelocating = false,
}) {
  const [loadError, setLoadError] = useState(null);
  const [scale, setScale] = useState(initialScale);
  const pageWrapperRef = useRef(null);

  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
  }, []);

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
      if (isRelocating && onRelocateClick) {
        onRelocateClick({ xPercent: x, yPercent: y });
      } else {
        onPageClick?.({ xPercent: x, yPercent: y, pageNumber: 0 });
      }
    },
    [onPageClick, onRelocateClick, isRelocating]
  );

  if (!pdfBlob) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn btn-sm btn-square btn-outline"
          onClick={handleZoomOut}
          disabled={scale <= MIN_SCALE}
          aria-label="Zoom out"
        >
          −
        </button>
        <span className="text-sm tabular-nums min-w-[4rem]">
          {Math.round(scale * 100)}%
        </span>
        <button
          type="button"
          className="btn btn-sm btn-square btn-outline"
          onClick={handleZoomIn}
          disabled={scale >= MAX_SCALE}
          aria-label="Zoom in"
        >
          +
        </button>
      </div>
      <div
        ref={containerRef}
        className="relative bg-base-100 cursor-crosshair overflow-auto max-h-[calc(100vh-10rem)]"
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
            onLoadSuccess={() => setLoadError(null)}
          >
            <Page pageNumber={1} scale={scale} renderTextLayer={false} />
          </Document>
          <WeldOverlay
            weldPoints={weldPoints}
            selectedWeldId={selectedWeldId}
            onWeldClick={onWeldClick}
            isRelocating={isRelocating}
          />
        </div>
      </div>
    </div>
  );
}

export default PDFViewer;
