"use client";

import { useCallback, useEffect, useRef } from "react";
import { warnIfDev } from "@/lib/dev-log";
import MarkerProgressPill from "./MarkerProgressPill";

const LINE_MARKER_LINE = "text-sky-500";
const LINE_BADGE = "border-2 border-sky-500 bg-white text-sky-500";

function clientToPercent(clientX, clientY, pageWrapperRef) {
  const el = pageWrapperRef?.current;
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  const xPercent = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
  const yPercent = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
  return { xPercent, yPercent };
}

function LineMarker({
  marker,
  lineName,
  isSelected = false,
  onClick,
  canDrag = false,
  onMoveLineMarker,
  onMoveLineIndicator,
  pageWrapperRef,
  scale = 1,
  progressPercent = 0,
  indicatorPositionOverride = null,
}) {
  const draggingRef = useRef(null);
  const badgeMin = Math.round(18 * scale);
  const badgeFontSize = Math.max(8, Math.round(10 * scale));
  const dotSize = Math.max(1, Math.round(2 * scale));

  const wx = marker.xPercent ?? 0;
  const wy = marker.yPercent ?? 0;
  const ix = indicatorPositionOverride
    ? indicatorPositionOverride.xPercent
    : (marker.indicatorXPercent ?? Math.min(100, Math.max(0, wx + 4)));
  const iy = indicatorPositionOverride
    ? indicatorPositionOverride.yPercent
    : (marker.indicatorYPercent ?? Math.min(100, Math.max(0, wy - 4)));

  const showHandles = canDrag && isSelected;
  const label = lineName || "Line";

  const handleClick = useCallback(
    (e) => {
      e.stopPropagation();
      onClick?.(marker);
    },
    [onClick, marker]
  );

  const handlePointerMove = useCallback(
    (e) => {
      const mode = draggingRef.current;
      if (!mode || !pageWrapperRef) return;
      const coords = clientToPercent(e.clientX, e.clientY, pageWrapperRef);
      if (!coords) return;
      if (mode === "point" && onMoveLineMarker) {
        onMoveLineMarker(marker.id, { xPercent: coords.xPercent, yPercent: coords.yPercent });
      } else if (mode === "indicator" && onMoveLineIndicator) {
        onMoveLineIndicator(marker.id, {
          indicatorXPercent: coords.xPercent,
          indicatorYPercent: coords.yPercent,
        });
      }
    },
    [marker.id, onMoveLineMarker, onMoveLineIndicator, pageWrapperRef]
  );

  const createDragOnUp = useCallback(() => {
    const preventClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.removeEventListener("click", preventClick, true);
    };
    window.addEventListener("click", preventClick, true);
    setTimeout(() => window.removeEventListener("click", preventClick, true), 100);
  }, []);

  const startDrag = useCallback(
    (e, mode) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (err) {
        warnIfDev("LineMarker", err);
      }
      draggingRef.current = mode;
      const onUp = () => {
        draggingRef.current = null;
        try {
          e.target.releasePointerCapture(e.pointerId);
        } catch (err) {
          warnIfDev("LineMarker", err);
        }
        createDragOnUp();
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointerleave", onUp);
      };
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointerleave", onUp);
    },
    [createDragOnUp, handlePointerMove]
  );

  const handlePointPointerDown = useCallback(
    (e) => {
      if (!canDrag || !onMoveLineMarker) return;
      startDrag(e, "point");
    },
    [canDrag, onMoveLineMarker, startDrag]
  );

  const handleIndicatorPointerDown = useCallback(
    (e) => {
      if (!canDrag || !onMoveLineIndicator) return;
      startDrag(e, "indicator");
    },
    [canDrag, onMoveLineIndicator, startDrag]
  );

  useEffect(() => () => {
    draggingRef.current = null;
  }, []);

  const pathHasLength = ix !== wx || iy !== wy;

  return (
    <div className={`absolute inset-0 pointer-events-none ${showHandles ? "z-30" : ""}`} data-print-marker="line" aria-hidden>
      {pathHasLength && (
        <svg className={`absolute inset-0 w-full h-full pointer-events-none ${LINE_MARKER_LINE}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          <path d={`M ${ix} ${iy} L ${wx} ${wy}`} fill="none" stroke="currentColor" strokeWidth="0.1" />
        </svg>
      )}

      <div
        role="button"
        tabIndex={indicatorPositionOverride ? -1 : 0}
        onClick={handleClick}
        className={`absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 z-10 ${
          indicatorPositionOverride ? "pointer-events-none" : "pointer-events-auto cursor-pointer"
        } ${isSelected ? (showHandles ? "ring-2 ring-error ring-offset-1 rounded-full" : "ring-2 ring-primary ring-offset-1 rounded-full") : ""}`}
        style={{ left: `${ix}%`, top: `${iy}%` }}
      >
        <MarkerProgressPill
          progressPercent={progressPercent}
          className={`min-h-0 border-2 border-solid rounded-full font-medium leading-none select-none ${LINE_BADGE}`}
          style={{ minWidth: `${badgeMin}px`, minHeight: `${badgeMin}px`, fontSize: `${badgeFontSize}px` }}
        >
          {label}
        </MarkerProgressPill>
        {showHandles && (
          <div
            role="button"
            tabIndex={indicatorPositionOverride ? -1 : 0}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-error bg-white cursor-grab active:cursor-grabbing hover:scale-110 transition-transform"
            style={{ left: "50%", top: "50%", zIndex: 20 }}
            onPointerDown={handleIndicatorPointerDown}
            aria-label="Drag to move line label"
          />
        )}
      </div>

      <div
        role="presentation"
        className={`absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 ${LINE_MARKER_LINE}`}
        style={{ left: `${wx}%`, top: `${wy}%` }}
      >
        <span
          className="block rounded-full border-2 border-sky-500 bg-white box-border shrink-0"
          style={{ width: `${Math.max(dotSize + 4, 6)}px`, height: `${Math.max(dotSize + 4, 6)}px` }}
          aria-hidden
        />
        {showHandles && (
          <div
            role="button"
            tabIndex={indicatorPositionOverride ? -1 : 0}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-error bg-white cursor-grab active:cursor-grabbing hover:scale-110 transition-transform pointer-events-auto"
            style={{ left: "50%", top: "50%", zIndex: 20 }}
            onPointerDown={handlePointPointerDown}
            aria-label="Drag to move line point"
          />
        )}
      </div>
    </div>
  );
}

export default LineMarker;
