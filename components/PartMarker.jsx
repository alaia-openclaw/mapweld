"use client";

import { useCallback, useRef, useEffect } from "react";
import { warnIfDev } from "@/lib/dev-log";

const PART_LINE_COLOUR = "text-accent";
const PART_BADGE_COLOUR = "border-accent bg-accent";

function clientToPercent(clientX, clientY, pageWrapperRef) {
  const el = pageWrapperRef?.current;
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  const xPercent = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
  const yPercent = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
  return { xPercent, yPercent };
}

function PartMarker({
  marker,
  displayNumber,
  onDelete,
  isSelected = false,
  onClick,
  canDrag = false,
  onMovePartMarker,
  onMovePartIndicator,
  pageWrapperRef,
  scale = 1,
  indicatorPositionOverride = null,
}) {
  const draggingRef = useRef(null);
  const badgeMin = Math.round(18 * scale);
  const badgeFontSize = Math.max(8, Math.round(10 * scale));
  const dotSize = Math.max(1, Math.round(2 * scale));

  const wx = marker.xPercent ?? 0;
  const wy = marker.yPercent ?? 0;
  const ix = indicatorPositionOverride ? indicatorPositionOverride.xPercent : (marker.indicatorXPercent ?? Math.min(100, Math.max(0, wx + 4)));
  const iy = indicatorPositionOverride ? indicatorPositionOverride.yPercent : (marker.indicatorYPercent ?? Math.min(100, Math.max(0, wy - 4)));

  const allX = [wx, ix];
  const allY = [wy, iy];
  const minX = Math.min(...allX) - 2;
  const minY = Math.min(...allY) - 2;
  const maxX = Math.max(...allX) + 2;
  const maxY = Math.max(...allY) + 2;
  const width = Math.max(maxX - minX, 8);
  const height = Math.max(maxY - minY, 8);

  const label = displayNumber != null ? String(displayNumber) : "?";
  const showHandles = canDrag && isSelected;

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
      if (mode === "point" && onMovePartMarker) {
        onMovePartMarker(marker.id, { xPercent: coords.xPercent, yPercent: coords.yPercent });
      } else if (mode === "indicator" && onMovePartIndicator) {
        onMovePartIndicator(marker.id, {
          indicatorXPercent: coords.xPercent,
          indicatorYPercent: coords.yPercent,
        });
      }
    },
    [marker.id, onMovePartMarker, onMovePartIndicator, pageWrapperRef]
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

  const handlePointPointerDown = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!canDrag || !onMovePartMarker) return;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (err) {
        warnIfDev("PartMarker", err);
      }
      draggingRef.current = "point";
      const onUp = () => {
        draggingRef.current = null;
        try {
          e.target.releasePointerCapture(e.pointerId);
        } catch (err) {
          warnIfDev("PartMarker", err);
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
    [canDrag, onMovePartMarker, handlePointerMove, createDragOnUp]
  );

  const handleIndicatorPointerDown = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!canDrag || !onMovePartIndicator) return;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (err) {
        warnIfDev("PartMarker", err);
      }
      draggingRef.current = "indicator";
      const onUp = () => {
        draggingRef.current = null;
        try {
          e.target.releasePointerCapture(e.pointerId);
        } catch (err) {
          warnIfDev("PartMarker", err);
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
    [canDrag, onMovePartIndicator, handlePointerMove, createDragOnUp]
  );

  useEffect(() => {
    return () => {
      draggingRef.current = null;
    };
  }, []);

  const pathHasLength = ix !== wx || iy !== wy;

  return (
    <div
      className={`absolute inset-0 pointer-events-none ${showHandles ? "z-30" : ""}`}
      aria-hidden
    >
      <div
        className="absolute pointer-events-none z-0"
        style={{
          left: `${minX}%`,
          top: `${minY}%`,
          width: `${width}%`,
          height: `${height}%`,
        }}
        aria-hidden
      />

      {pathHasLength && (
        <svg
          className={`absolute inset-0 w-full h-full pointer-events-none ${PART_LINE_COLOUR}`}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d={`M ${ix} ${iy} L ${wx} ${wy}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.1"
          />
        </svg>
      )}

      <div
        role="button"
        tabIndex={indicatorPositionOverride ? -1 : 0}
        onClick={handleClick}
        className={`absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 z-10
          ${indicatorPositionOverride ? "pointer-events-none" : "pointer-events-auto cursor-pointer"}
          ${isSelected ? (showHandles ? "ring-2 ring-error ring-offset-1 rounded-full" : "ring-2 ring-primary ring-offset-1 rounded-full") : ""}`}
        style={{
          left: `${ix}%`,
          top: `${iy}%`,
        }}
      >
        <span
          className={`flex items-center justify-center border border-solid rounded-full px-1 font-medium leading-none select-none text-base-100 ${PART_BADGE_COLOUR}`}
          style={{
            minWidth: `${badgeMin}px`,
            minHeight: `${badgeMin}px`,
            fontSize: `${badgeFontSize}px`,
          }}
        >
          {label}
        </span>
        {showHandles && (
          <div
            role="button"
            tabIndex={indicatorPositionOverride ? -1 : 0}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-error bg-white cursor-grab active:cursor-grabbing hover:scale-110 transition-transform"
            style={{ left: "50%", top: "50%", zIndex: 20 }}
            onPointerDown={handleIndicatorPointerDown}
            aria-label="Drag to move label"
          />
        )}
      </div>

      <div
        role="presentation"
        className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
        style={{ left: `${wx}%`, top: `${wy}%` }}
      >
        <span
          className="block rounded-full bg-accent"
          style={{ width: `${dotSize}px`, height: `${dotSize}px` }}
          aria-hidden
        />
        {showHandles && (
          <div
            role="button"
            tabIndex={indicatorPositionOverride ? -1 : 0}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-error bg-white cursor-grab active:cursor-grabbing hover:scale-110 transition-transform pointer-events-auto"
            style={{ left: "50%", top: "50%", zIndex: 20 }}
            onPointerDown={handlePointPointerDown}
            aria-label="Drag to move part point"
          />
        )}
      </div>
    </div>
  );
}

export default PartMarker;
