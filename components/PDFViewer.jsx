"use client";

import { Document, Page, pdfjs } from "react-pdf";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import WeldOverlay from "./WeldOverlay";
import SpoolMarker from "./SpoolMarker";
import PartMarker from "./PartMarker";
import LineMarker from "./LineMarker";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

const MIN_SCALE = 0.5;
const MAX_SCALE = 2.5;
const SCALE_STEP = 0.25;

function PDFViewer({
  pdfBlob,
  onPageClick,
  containerRef,
  scale: controlledScale,
  currentPage: controlledPage,
  onScaleChange,
  onPageChange,
  onNumPages,
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
  lineMarkers = [],
  lines = [],
  selectedLineMarkerId,
  onLineMarkerClick,
  onMoveLineMarker,
  onMoveLineIndicator,
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
  pendingLabelId = null,
  onPendingLabelMove,
  focusMode = false,
}) {
  const [loadError, setLoadError] = useState(null);
  const [internalScale, setInternalScale] = useState(1.2);
  const [internalPage, setInternalPage] = useState(1);
  const [internalNumPages, setInternalNumPages] = useState(null);
  const [placingIndicatorPos, setPlacingIndicatorPos] = useState(null);
  const [pinchScaleRatio, setPinchScaleRatio] = useState(null);
  const pageWrapperRef = useRef(null);
  const panStartRef = useRef(null);
  const isPanningRef = useRef(false);
  const pinchRef = useRef(null);
  const lastPlacementTapRef = useRef(0);

  const scale = controlledScale !== undefined ? controlledScale : internalScale;
  const currentPage = controlledPage !== undefined ? controlledPage : internalPage;
  const setScale = onScaleChange ?? setInternalScale;
  const setCurrentPage = onPageChange ?? setInternalPage;

  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
  }, []);

  useEffect(() => {
    setLoadError(null);
    if (controlledPage === undefined) {
      setInternalPage(1);
      setInternalNumPages(null);
    }
  }, [pdfBlob, controlledPage]);

  useEffect(() => {
    if (pendingLabelId) return;
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
  }, [pendingLabelId, scrollToTarget, currentPage, containerRef, setCurrentPage]);

  const handleLoadSuccess = useCallback(
    ({ numPages: n }) => {
      setLoadError(null);
      if (onNumPages) onNumPages(n);
      else setInternalNumPages(n);
    },
    [onNumPages]
  );

  const handlePointerDown = useCallback(
    (e) => {
      if (e.button !== 0) return;
      if (pinchRef.current) return;
      if (e.target.closest("button, [role='button']")) return;
      if (pendingLabelId) return;
      if (markupTool === "add" || markupTool === "addSpool" || markupTool === "addPart" || markupTool === "addLine") return;
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
    [markupTool, pendingLabelId, containerRef]
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (pinchRef.current) return;
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
    [containerRef]
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

  const pinchRafRef = useRef(null);
  const pinchRatioRef = useRef(1);

  const handleTouchStart = useCallback(
    (e) => {
      if (e.touches.length === 2) {
        if (e.cancelable) e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        pinchRef.current = {
          initialDistance: Math.hypot(dx, dy),
          initialScale: scale,
        };
        setPinchScaleRatio(1);
      }
    },
    [scale]
  );

  const handleTouchMove = useCallback(
    (e) => {
      if (e.touches.length === 2 && pinchRef.current) {
        if (e.cancelable) e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDistance = Math.hypot(dx, dy);
        const ratio = currentDistance / pinchRef.current.initialDistance;
        const clampedRatio = Math.max(
          MIN_SCALE / pinchRef.current.initialScale,
          Math.min(MAX_SCALE / pinchRef.current.initialScale, ratio)
        );
        pinchRatioRef.current = clampedRatio;
        if (pinchRafRef.current) cancelAnimationFrame(pinchRafRef.current);
        pinchRafRef.current = requestAnimationFrame(() => {
          pinchRafRef.current = null;
          setPinchScaleRatio(clampedRatio);
        });
      }
    },
    []
  );

  const handleTouchEnd = useCallback(
    (e) => {
      if (e.touches.length < 2) {
        if (pinchRafRef.current) {
          cancelAnimationFrame(pinchRafRef.current);
          pinchRafRef.current = null;
        }
        if (pinchRef.current) {
          const ratio = pinchRatioRef.current;
          const finalScale = Math.max(
            MIN_SCALE,
            Math.min(MAX_SCALE, pinchRef.current.initialScale * ratio)
          );
          setScale(finalScale);
        }
        setPinchScaleRatio(null);
        pinchRef.current = null;
      }
    },
    [setScale]
  );

  const handleClick = useCallback(
    (e) => {
      if (isPanningRef.current) {
        isPanningRef.current = false;
        return;
      }
      const now = Date.now();
      if (now - lastPlacementTapRef.current < 400) return;
      lastPlacementTapRef.current = now;
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
  }, [containerRef, pdfBlob, setScale]);

  const weldPointsOnPage = weldPoints.filter(
    (w) => (w.pageNumber ?? 0) === currentPage - 1
  );
  const spoolMarkersOnPage = spoolMarkers.filter(
    (m) => (m.pageNumber ?? 0) === currentPage - 1
  );
  const lineMarkersOnPage = lineMarkers.filter(
    (m) => (m.pageNumber ?? 0) === currentPage - 1
  );
  const partMarkersOnPage = partMarkers.filter(
    (m) => (m.pageNumber ?? 0) === currentPage - 1
  );

  const isPlacingLabel = !!pendingLabelId;

  useLayoutEffect(() => {
    if (!isPlacingLabel) {
      setPlacingIndicatorPos(null);
      return;
    }
    const pending = pendingLabelId;
    if (!pending) return;
    let ix, iy;
    if (pending.type === "weld") {
      const w = weldPoints.find((p) => p.id === pending.id);
      ix = w?.indicatorXPercent; iy = w?.indicatorYPercent;
    } else if (pending.type === "spool") {
      const m = spoolMarkers.find((p) => p.id === pending.id);
      ix = m?.indicatorXPercent; iy = m?.indicatorYPercent;
    } else if (pending.type === "part") {
      const m = partMarkers.find((p) => p.id === pending.id);
      ix = m?.indicatorXPercent; iy = m?.indicatorYPercent;
    } else if (pending.type === "line") {
      const m = lineMarkers.find((p) => p.id === pending.id);
      ix = m?.indicatorXPercent; iy = m?.indicatorYPercent;
    }
    if (ix != null && iy != null) {
      setPlacingIndicatorPos((prev) => prev ?? { x: ix, y: iy });
    }
  }, [isPlacingLabel, pendingLabelId, weldPoints, spoolMarkers, partMarkers, lineMarkers]);

  useLayoutEffect(() => {
    if (!isPlacingLabel || !onPendingLabelMove) return;
    const handler = (e) => {
      const target = pageWrapperRef?.current;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0]?.clientX : e.clientX;
      const clientY = e.touches ? e.touches[0]?.clientY : e.clientY;
      if (clientX == null || clientY == null) return;
      const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
      setPlacingIndicatorPos({ x, y });
      onPendingLabelMove({ xPercent: x, yPercent: y });
      if (e.touches && e.cancelable) e.preventDefault();
    };
    const opts = { passive: false, capture: true };
    document.addEventListener("mousemove", handler, opts);
    document.addEventListener("touchmove", handler, opts);
    return () => {
      document.removeEventListener("mousemove", handler, opts);
      document.removeEventListener("touchmove", handler, opts);
    };
  }, [isPlacingLabel, onPendingLabelMove]);

  const getCoordsFromEvent = useCallback(
    (e) => {
      const target = pageWrapperRef.current;
      if (!target) return null;
      const rect = target.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)),
        y: Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100)),
      };
    },
    []
  );

  const getCoordsFromChangedTouch = useCallback(
    (e) => {
      const target = pageWrapperRef.current;
      if (!target || !e.changedTouches?.[0]) return null;
      const rect = target.getBoundingClientRect();
      const { clientX, clientY } = e.changedTouches[0];
      return {
        x: Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)),
        y: Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100)),
      };
    },
    []
  );

  const handleCaptureMove = useCallback(
    (e) => {
      if (!onPendingLabelMove) return;
      const coords = getCoordsFromEvent(e);
      if (!coords) return;
      setPlacingIndicatorPos({ x: coords.x, y: coords.y });
      onPendingLabelMove({ xPercent: coords.x, yPercent: coords.y });
      e.preventDefault();
    },
    [onPendingLabelMove, getCoordsFromEvent]
  );

  const invokePageClick = useCallback(
    (coords) => {
      if (!coords) return;
      onPageClick?.({ xPercent: coords.x, yPercent: coords.y, pageNumber: currentPage - 1 });
    },
    [onPageClick, currentPage]
  );

  const handleCaptureClick = useCallback(
    (e) => {
      e.stopPropagation();
      e.preventDefault();
      const coords = getCoordsFromEvent(e);
      invokePageClick(coords);
    },
    [getCoordsFromEvent, invokePageClick]
  );

  const handleCaptureTouchEnd = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      const now = Date.now();
      lastPlacementTapRef.current = now;
      const coords = getCoordsFromChangedTouch(e);
      invokePageClick(coords);
    },
    [getCoordsFromChangedTouch, invokePageClick]
  );

  if (!pdfBlob) return null;

  const cursorClass =
    isPlacingLabel
      ? "cursor-crosshair"
      : appMode === "edition" && (markupTool === "add" || markupTool === "addSpool" || markupTool === "addPart" || markupTool === "addLine")
        ? "cursor-crosshair"
        : "cursor-default";

  return (
    <div className="flex flex-col gap-0">
      <div
        ref={containerRef}
        className={`relative bg-base-100 overflow-auto min-h-[50dvh] mobile-no-scrollbar ${focusMode ? "max-h-[100dvh]" : "max-h-[calc(100dvh-3.5rem)] md:max-h-[calc(100dvh-10rem)]"} ${cursorClass}`}
        style={{ touchAction: "pan-x pan-y" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          ref={pageWrapperRef}
          data-print-target="pdf-with-overlays"
          className="relative inline-block min-w-0 origin-center"
          style={
            pinchScaleRatio != null
              ? {
                  transform: `scale(${pinchScaleRatio})`,
                  transformOrigin: "50% 50%",
                  willChange: "transform",
                }
              : undefined
          }
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
            onLoadSuccess={handleLoadSuccess}
          >
            <Page
              pageNumber={currentPage}
              scale={scale}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
          {isPlacingLabel && (() => {
            const pending = pendingLabelId;
            let ix, iy;
            if (placingIndicatorPos) {
              ix = placingIndicatorPos.x;
              iy = placingIndicatorPos.y;
            } else if (pending.type === "weld") {
              const w = weldPoints.find((p) => p.id === pending.id);
              ix = w?.indicatorXPercent; iy = w?.indicatorYPercent;
            } else if (pending.type === "spool") {
              const m = spoolMarkers.find((p) => p.id === pending.id);
              ix = m?.indicatorXPercent; iy = m?.indicatorYPercent;
            } else if (pending.type === "part") {
              const m = partMarkers.find((p) => p.id === pending.id);
              ix = m?.indicatorXPercent; iy = m?.indicatorYPercent;
            } else if (pending.type === "line") {
              const m = lineMarkers.find((p) => p.id === pending.id);
              ix = m?.indicatorXPercent; iy = m?.indicatorYPercent;
            }
            if (ix == null || iy == null) return null;
            return (
              <div
                className="absolute pointer-events-none z-50"
                style={{ left: `${ix}%`, top: `${iy}%`, transform: "translate(-50%, -50%)" }}
                aria-hidden
              >
                <span className="flex h-5 w-5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex rounded-full h-5 w-5 border-2 border-primary bg-base-100/50" />
                </span>
              </div>
            );
          })()}
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
                pendingWeldId={pendingLabelId?.type === "weld" ? pendingLabelId.id : null}
                placingIndicatorOverride={placingIndicatorPos ? { xPercent: placingIndicatorPos.x, yPercent: placingIndicatorPos.y } : null}
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
                    indicatorPositionOverride={pendingLabelId?.type === "spool" && pendingLabelId?.id === m.id && placingIndicatorPos ? { xPercent: placingIndicatorPos.x, yPercent: placingIndicatorPos.y } : null}
                  />
                ))}
                {lineMarkersOnPage.map((m) => {
                  const line = lines.find((item) => item.id === m.lineId);
                  return (
                    <LineMarker
                      key={m.id}
                      marker={m}
                      lineName={line?.name || "Line"}
                      isSelected={m.id === selectedLineMarkerId}
                      onClick={onLineMarkerClick}
                      canDrag={appMode === "edition"}
                      onMoveLineMarker={onMoveLineMarker}
                      onMoveLineIndicator={onMoveLineIndicator}
                      pageWrapperRef={pageWrapperRef}
                      scale={scale}
                      indicatorPositionOverride={pendingLabelId?.type === "line" && pendingLabelId?.id === m.id && placingIndicatorPos ? { xPercent: placingIndicatorPos.x, yPercent: placingIndicatorPos.y } : null}
                    />
                  );
                })}
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
                      indicatorPositionOverride={pendingLabelId?.type === "part" && pendingLabelId?.id === m.id && placingIndicatorPos ? { xPercent: placingIndicatorPos.x, yPercent: placingIndicatorPos.y } : null}
                    />
                  );
                })}
              </div>
            </>
          )}
          {isPlacingLabel && (
            <div
              className="absolute inset-0 cursor-crosshair"
              style={{ zIndex: 9999, touchAction: "none" }}
              onMouseMove={handleCaptureMove}
              onTouchMove={handleCaptureMove}
              onTouchEnd={handleCaptureTouchEnd}
              onClick={handleCaptureClick}
              aria-hidden
            />
          )}
        </div>
        {isPlacingLabel && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none z-50">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-content text-xs font-medium shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
              </svg>
              Click to place label · Esc to cancel
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default PDFViewer;
