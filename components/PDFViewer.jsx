"use client";

import { Document, Page, pdfjs } from "react-pdf";
import { useCallback, useEffect, useRef, useState } from "react";
import WeldOverlay from "./WeldOverlay";
import SpoolMarker from "./SpoolMarker";
import PartMarker from "./PartMarker";
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
  onWeldDoubleClick,
  appMode = "edition",
  markupTool = "select",
  onMoveWeldPoint,
  onMoveIndicator,
  onResizeLabel,
  onMoveLineBend,
  spoolMarkers = [],
  spools = [],
  selectedSpoolMarkerId,
  onSpoolMarkerClick,
  onMoveSpoolMarker,
  onMoveSpoolIndicator,
  onDeleteSpoolMarker,
  weldStatusByWeldId,
  partMarkers = [],
  parts = [],
  selectedPartMarkerId,
  onPartMarkerClick,
  onMovePartMarker,
  onMovePartIndicator,
  onDeletePartMarker,
  scrollToTarget,
  showOverlay = true,
  onToggleOverlay,
  focusMode = false,
}) {
  const [loadError, setLoadError] = useState(null);
  const [scale, setScale] = useState(initialScale);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const pageWrapperRef = useRef(null);
  const panStartRef = useRef(null);
  const isPanningRef = useRef(false);

  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setNumPages(null);
  }, [pdfBlob]);

  useEffect(() => {
    if (!scrollToTarget || scrollToTarget.pageNumber == null) return;
    const targetPage = scrollToTarget.pageNumber + 1;
    if (currentPage !== targetPage) {
      setCurrentPage(targetPage);
      return;
    }
    const container = containerRef?.current;
    const pageEl = pageWrapperRef?.current;
    if (!container || !pageEl) return;
    const xPercent = scrollToTarget.xPercent ?? 50;
    const yPercent = scrollToTarget.yPercent ?? 50;
    const runScroll = () => {
      const left = pageEl.offsetLeft + (xPercent / 100) * pageEl.offsetWidth;
      const top = pageEl.offsetTop + (yPercent / 100) * pageEl.offsetHeight;
      container.scrollLeft = Math.max(0, Math.min(left - container.clientWidth / 2, container.scrollWidth - container.clientWidth));
      container.scrollTop = Math.max(0, Math.min(top - container.clientHeight / 2, container.scrollHeight - container.clientHeight));
    };
    const t = setTimeout(runScroll, 80);
    return () => clearTimeout(t);
  }, [scrollToTarget, currentPage, containerRef]);

  const handleZoomIn = useCallback(() => {
    setScale((s) => Math.min(MAX_SCALE, s + SCALE_STEP));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((s) => Math.max(MIN_SCALE, s - SCALE_STEP));
  }, []);

  const handlePointerDown = useCallback(
    (e) => {
      if (e.button !== 0) return;
      if (e.target.closest("button, [role='button']")) return;
      if (markupTool === "add" || markupTool === "addSpool" || markupTool === "addPart") return;
      const el = containerRef?.current;
      if (!el) return;
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        scrollLeft: el.scrollLeft,
        scrollTop: el.scrollTop,
      };
      isPanningRef.current = false;
    },
    [markupTool]
  );

  const handlePointerMove = useCallback(
    (e) => {
      const start = panStartRef.current;
      const el = containerRef?.current;
      if (!start || !el) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (!isPanningRef.current && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        isPanningRef.current = true;
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch (_) {}
      }
      if (isPanningRef.current) {
        e.preventDefault();
        el.scrollLeft = start.scrollLeft - dx;
        el.scrollTop = start.scrollTop - dy;
      }
    },
    []
  );

  const handlePointerUp = useCallback(
    (e) => {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (_) {}
      panStartRef.current = null;
    },
    []
  );

  const handleClick = useCallback(
    (e) => {
      if (isPanningRef.current) {
        isPanningRef.current = false;
        return;
      }
      const target = pageWrapperRef.current;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      onPageClick?.({ xPercent: x, yPercent: y, pageNumber: currentPage - 1 });
    },
    [onPageClick, currentPage]
  );

  useEffect(() => {
    const el = containerRef?.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.ctrlKey || e.metaKey) {
        setScale((s) => {
          const delta = e.deltaY > 0 ? -SCALE_STEP : SCALE_STEP;
          return Math.max(MIN_SCALE, Math.min(MAX_SCALE, s + delta));
        });
      } else {
        el.scrollLeft += e.deltaX;
        el.scrollTop += e.deltaY;
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [containerRef, pdfBlob]);

  const weldPointsOnPage = weldPoints.filter(
    (w) => (w.pageNumber ?? 0) === currentPage - 1
  );
  const spoolMarkersOnPage = spoolMarkers.filter(
    (m) => (m.pageNumber ?? 0) === currentPage - 1
  );
  const partMarkersOnPage = partMarkers.filter(
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
        {onToggleOverlay && (
          <button
            type="button"
            className="btn btn-sm btn-outline min-h-12 gap-1"
            onClick={onToggleOverlay}
            aria-label={showOverlay ? "Hide markers" : "Show markers"}
            title={showOverlay ? "Hide weld/spool/part markers" : "Show markers"}
          >
            {showOverlay ? "Hide markers" : "Show markers"}
          </button>
        )}
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
        className={`relative bg-base-100 overflow-auto min-h-[50dvh] touch-pan-x touch-pan-y ${focusMode ? "max-h-[100dvh]" : "max-h-[calc(100dvh-10rem)]"} ${appMode === "edition" && (markupTool === "add" || markupTool === "addSpool" || markupTool === "addPart") ? "cursor-crosshair" : "cursor-default"}`}
        style={{ touchAction: "pan-x pan-y" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
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
              renderAnnotationLayer={false}
            />
          </Document>
          {showOverlay && (
            <>
              <WeldOverlay
                weldPoints={weldPointsOnPage}
                selectedWeldId={selectedWeldId}
                onWeldClick={onWeldClick}
                onWeldDoubleClick={onWeldDoubleClick}
                appMode={appMode}
                canDrag={appMode === "edition"}
                pageWrapperRef={pageWrapperRef}
                onMoveWeldPoint={onMoveWeldPoint}
                onMoveIndicator={onMoveIndicator}
                onResizeLabel={onResizeLabel}
                onMoveLineBend={onMoveLineBend}
                weldStatusByWeldId={weldStatusByWeldId}
                spools={spools}
                scale={scale}
              />
              <div className="absolute inset-0 pointer-events-none">
                {spoolMarkersOnPage.map((m) => (
                  <SpoolMarker
                    key={m.id}
                    marker={m}
                    spoolName={spools.find((s) => s.id === m.spoolId)?.name}
                    isSelected={m.id === selectedSpoolMarkerId}
                    onClick={onSpoolMarkerClick}
                    canDrag={appMode === "edition"}
                    onMoveSpoolMarker={onMoveSpoolMarker}
                    onMoveSpoolIndicator={onMoveSpoolIndicator}
                    pageWrapperRef={pageWrapperRef}
                    onDelete={onDeleteSpoolMarker}
                    scale={scale}
                  />
                ))}
                {partMarkersOnPage.map((m) => {
                  const part = parts.find((p) => p.id === m.partId);
                  return (
                    <PartMarker
                      key={m.id}
                      marker={m}
                      displayNumber={part?.displayNumber}
                      isSelected={m.id === selectedPartMarkerId}
                      onClick={onPartMarkerClick}
                      canDrag={appMode === "edition"}
                      onMovePartMarker={onMovePartMarker}
                      onMovePartIndicator={onMovePartIndicator}
                      pageWrapperRef={pageWrapperRef}
                      onDelete={onDeletePartMarker}
                      scale={scale}
                    />
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PDFViewer;
