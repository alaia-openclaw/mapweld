"use client";

import { useCallback, useRef, useEffect } from "react";
import { WELD_TYPES, WELD_LOCATION } from "@/lib/constants";
import { getWeldName } from "@/lib/weld-utils";
import { warnIfDev } from "@/lib/dev-log";
import MarkerProgressPill from "./MarkerProgressPill";

/** White label + colored outline/text/line (shop blue, field red). */
const LABEL_STYLES = {
  [WELD_LOCATION.SHOP]: "border-blue-600 bg-white text-blue-600",
  [WELD_LOCATION.FIELD]: "border-red-600 bg-white text-red-600",
};

const LINE_COLOURS = {
  [WELD_LOCATION.SHOP]: "text-blue-600",
  [WELD_LOCATION.FIELD]: "text-red-600",
};

const LABEL_FONT_SIZE_MIN = 8;
const LABEL_FONT_SIZE_MAX = 24;
/** Match PartMarker / SpoolMarker: `Math.max(8, round(10 * scale))`; weld `labelFontSize` scales relative to 12. */

function clientToPercent(clientX, clientY, pageWrapperRef) {
  const el = pageWrapperRef?.current;
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  const xPercent = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
  const yPercent = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
  return { xPercent, yPercent };
}

function WeldPointMarker({
  weld,
  weldPoints = [],
  onClick,
  onDoubleClick,
  isSelected,
  canDrag = false,
  onMoveWeldPoint,
  onMoveIndicator,
  onResizeLabel,
  onMoveLineBend,
  pageWrapperRef,
  scale = 1,
  progressPercent = 0,
  indicatorPositionOverride = null,
}) {
  const draggingRef = useRef(null);
  const resizeStartRef = useRef({ fontSize: 12, clientY: 0 });

  const handleClick = useCallback(
    (e) => {
      e.stopPropagation();
      onClick?.(weld);
    },
    [onClick, weld]
  );

  const handleDoubleClick = useCallback(
    (e) => {
      e.stopPropagation();
      onDoubleClick?.(weld);
    },
    [onDoubleClick, weld]
  );

  const weldLocation = weld.weldLocation || WELD_LOCATION.SHOP;
  const weldType = weld.weldType || WELD_TYPES.BUTT;
  const isField = weldLocation === WELD_LOCATION.FIELD;

  const wx = weld.xPercent ?? 0;
  const wy = weld.yPercent ?? 0;
  const ix = indicatorPositionOverride ? indicatorPositionOverride.xPercent : (weld.indicatorXPercent ?? wx);
  const iy = indicatorPositionOverride ? indicatorPositionOverride.yPercent : (weld.indicatorYPercent ?? wy);
  const bx = weld.lineBendXPercent;
  const by = weld.lineBendYPercent;
  const hasBend = bx != null && by != null;
  const bendX = hasBend ? bx : (ix + wx) / 2;
  const bendY = hasBend ? by : (iy + wy) / 2;

  const allX = [wx, ix, bendX];
  const allY = [wy, iy, bendY];
  const minX = Math.min(...allX) - 1;
  const minY = Math.min(...allY) - 1;
  const maxX = Math.max(...allX) + 1;
  const maxY = Math.max(...allY) + 1;
  const width = Math.max(maxX - minX, 6);
  const height = Math.max(maxY - minY, 6);

  const labelOutlineClass = LABEL_STYLES[weldLocation] || LABEL_STYLES[WELD_LOCATION.SHOP];
  const lineColourClass = LINE_COLOURS[weldLocation] || LINE_COLOURS[WELD_LOCATION.SHOP];
  const weldName = getWeldName(weld, weldPoints);
  const rawFontSize = weld.labelFontSize ?? 12;
  const partLikeBasePx = Math.max(8, Math.round(10 * scale));
  const scaledFontSize = Math.max(8, Math.round((rawFontSize / 12) * partLikeBasePx));
  /** Same min badge size as PartMarker / SpoolMarker — no fixed square, text + px-1 defines width. */
  const badgeMin = Math.round(18 * scale);
  /** FW symbol: horizontal top/bottom, 45° sides, outward arrows (matches print-utils). */
  const fieldSymbolPx = Math.max(11, Math.round(12 * scale));
  const dotSize = Math.max(1, Math.round(2 * scale));

  const handlePointerMove = useCallback(
    (e) => {
      const mode = draggingRef.current;
      if (!mode) return;
      if (mode === "resize" && onResizeLabel) {
        const { fontSize: startFontSize, clientY: startY } = resizeStartRef.current;
        const deltaY = e.clientY - startY;
        const newSize = Math.round(
          Math.max(LABEL_FONT_SIZE_MIN, Math.min(LABEL_FONT_SIZE_MAX, startFontSize - deltaY))
        );
        resizeStartRef.current = { fontSize: newSize, clientY: e.clientY };
        onResizeLabel(weld.id, { labelFontSize: newSize });
        return;
      }
      if (!pageWrapperRef) return;
      const coords = clientToPercent(e.clientX, e.clientY, pageWrapperRef);
      if (!coords) return;
      if (mode === "weld" && onMoveWeldPoint) {
        onMoveWeldPoint(weld.id, { xPercent: coords.xPercent, yPercent: coords.yPercent });
      } else if (mode === "indicator" && onMoveIndicator) {
        onMoveIndicator(weld.id, {
          indicatorXPercent: coords.xPercent,
          indicatorYPercent: coords.yPercent,
        });
      } else if (mode === "lineBend" && onMoveLineBend) {
        onMoveLineBend(weld.id, {
          lineBendXPercent: coords.xPercent,
          lineBendYPercent: coords.yPercent,
        });
      }
    },
    [weld.id, onMoveWeldPoint, onMoveIndicator, onResizeLabel, onMoveLineBend, pageWrapperRef]
  );

  const createDragOnUp = useCallback(
    () => {
      const preventClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.removeEventListener("click", preventClick, true);
      };
      window.addEventListener("click", preventClick, true);
      setTimeout(() => window.removeEventListener("click", preventClick, true), 100);
    },
    []
  );

  const handleWeldHandlePointerDown = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!canDrag || !onMoveWeldPoint) return;
      try {
        e.target.setPointerCapture(e.pointerId);
      } catch (err) {
        warnIfDev("WeldPointMarker", err);
      }
      draggingRef.current = "weld";
      const onUp = () => {
        draggingRef.current = null;
        try {
          e.target.releasePointerCapture(e.pointerId);
        } catch (err) {
          warnIfDev("WeldPointMarker", err);
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
    [canDrag, onMoveWeldPoint, handlePointerMove, createDragOnUp]
  );

  const handleIndicatorHandlePointerDown = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!canDrag || !onMoveIndicator) return;
      try {
        e.target.setPointerCapture(e.pointerId);
      } catch (err) {
        warnIfDev("WeldPointMarker", err);
      }
      draggingRef.current = "indicator";
      const onUp = () => {
        draggingRef.current = null;
        try {
          e.target.releasePointerCapture(e.pointerId);
        } catch (err) {
          warnIfDev("WeldPointMarker", err);
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
    [canDrag, onMoveIndicator, handlePointerMove, createDragOnUp]
  );

  const handleLineBendPointerDown = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!canDrag || !onMoveLineBend) return;
      try {
        e.target.setPointerCapture(e.pointerId);
      } catch (err) {
        warnIfDev("WeldPointMarker", err);
      }
      draggingRef.current = "lineBend";
      const onUp = () => {
        draggingRef.current = null;
        try {
          e.target.releasePointerCapture(e.pointerId);
        } catch (err) {
          warnIfDev("WeldPointMarker", err);
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
    [canDrag, onMoveLineBend, handlePointerMove, createDragOnUp]
  );

  const handleResizeHandlePointerDown = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!canDrag || !onResizeLabel) return;
      try {
        e.target.setPointerCapture(e.pointerId);
      } catch (err) {
        warnIfDev("WeldPointMarker", err);
      }
      resizeStartRef.current = {
        fontSize: weld.labelFontSize ?? 12,
        clientY: e.clientY,
      };
      draggingRef.current = "resize";
      const onUp = () => {
        draggingRef.current = null;
        try {
          e.target.releasePointerCapture(e.pointerId);
        } catch (err) {
          warnIfDev("WeldPointMarker", err);
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
    [canDrag, onResizeLabel, weld.labelFontSize, handlePointerMove, createDragOnUp]
  );

  useEffect(() => {
    return () => {
      draggingRef.current = null;
    };
  }, []);

  const showHandles = canDrag && isSelected;

  return (
    <div
      className={`absolute inset-0 pointer-events-none ${showHandles ? "z-30" : ""}`}
      data-print-marker="weld"
      aria-hidden
    >
      <button
        type="button"
        className="absolute pointer-events-none focus:outline-none touch-manipulation z-0"
        style={{
          left: `${minX}%`,
          top: `${minY}%`,
          width: `${width}%`,
          height: `${height}%`,
        }}
        aria-hidden
        title={
          weld.welderName
            ? weld.welderName
            : showHandles
              ? "Drag handles to move. Double-click to edit."
              : "Click to select. Double-click to edit."
        }
        aria-label={`Weld ${weldName}${weldType ? `, ${weldType}` : ""}`}
      />

      {(() => {
        const pathHasLength = hasBend
          ? (ix !== bendX || iy !== bendY) || (bendX !== wx || bendY !== wy)
          : ix !== wx || iy !== wy;
        if (!pathHasLength) return null;
        const pathD =
          hasBend
            ? `M ${ix} ${iy} L ${bendX} ${bendY} L ${wx} ${wy}`
            : `M ${ix} ${iy} L ${wx} ${wy}`;
        return (
          <svg
            className={`absolute inset-0 w-full h-full pointer-events-none ${lineColourClass}`}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              d={pathD}
              fill="none"
              stroke="currentColor"
              strokeWidth="0.1"
              className={lineColourClass}
            />
          </svg>
        );
      })()}

      <div
        role="button"
        tabIndex={indicatorPositionOverride ? -1 : 0}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        className={`absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center gap-1 z-10
          ${indicatorPositionOverride ? "pointer-events-none" : "pointer-events-auto"}
          ${isField ? "rotate-45" : ""}
          ${indicatorPositionOverride ? "" : "cursor-pointer"}
          ${isSelected ? (showHandles ? "ring-2 ring-error ring-offset-1 rounded-full" : "ring-2 ring-primary ring-offset-1 rounded-full") : ""}`}
        style={{
          left: `${ix}%`,
          top: `${iy}%`,
        }}
        aria-label={showHandles ? "Drag to move label" : undefined}
      >
        <MarkerProgressPill
          progressPercent={progressPercent}
          className={`min-h-0 border-2 border-solid rounded-full font-medium leading-none select-none text-center whitespace-nowrap ${labelOutlineClass}
            ${isField ? "-rotate-45" : ""}`}
          style={{
            minWidth: `${badgeMin}px`,
            minHeight: `${badgeMin}px`,
            fontSize: `${scaledFontSize}px`,
          }}
        >
          {weldName}
        </MarkerProgressPill>
        {showHandles && (
          <div
            role="button"
            tabIndex={indicatorPositionOverride ? -1 : 0}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-error bg-white cursor-grab active:cursor-grabbing hover:scale-110 transition-transform"
            style={{ left: "50%", top: "50%", zIndex: 20 }}
            onPointerDown={handleIndicatorHandlePointerDown}
            aria-label="Drag to move label"
          />
        )}
      </div>

      <div
        role="presentation"
        className={`absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 ${lineColourClass}`}
        style={{
          left: `${wx}%`,
          top: `${wy}%`,
        }}
      >
        {isField ? (
          <svg
            width={fieldSymbolPx}
            height={fieldSymbolPx}
            viewBox="0 0 24 24"
            className="text-inherit shrink-0"
            aria-hidden
          >
            <path
              d="M 8.85 6.15 L 15.15 6.15 L 21 12 L 15.15 17.85 L 8.85 17.85 L 3 12 Z"
              fill="white"
              stroke="currentColor"
              strokeWidth={Math.max(0.9, 1.05 * scale)}
              strokeLinejoin="miter"
            />
            <path
              fill="currentColor"
              d="M 1.15 12 L 3.55 10.35 L 3.55 13.65 Z"
            />
            <path
              fill="currentColor"
              d="M 22.85 12 L 20.45 10.35 L 20.45 13.65 Z"
            />
          </svg>
        ) : (
          <span
            className="block rounded-full border-2 border-blue-600 bg-white box-border shrink-0"
            style={{ width: `${Math.max(dotSize + 4, 6)}px`, height: `${Math.max(dotSize + 4, 6)}px` }}
            aria-hidden
          />
        )}
        {showHandles && (
          <div
            role="button"
            tabIndex={indicatorPositionOverride ? -1 : 0}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-error bg-white cursor-grab active:cursor-grabbing hover:scale-110 transition-transform pointer-events-auto"
            style={{ left: "50%", top: "50%", zIndex: 20 }}
            onPointerDown={handleWeldHandlePointerDown}
            aria-label="Drag to move weld point"
          />
        )}
      </div>

      {showHandles && (
        <div
          role="button"
          tabIndex={indicatorPositionOverride ? -1 : 0}
          className="absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-error bg-white cursor-grab active:cursor-grabbing hover:scale-110 transition-transform pointer-events-auto"
          style={{ left: `${bendX}%`, top: `${bendY}%`, zIndex: 20 }}
          onPointerDown={handleLineBendPointerDown}
          aria-label="Drag to adjust line bend"
        />
      )}
    </div>
  );
}

export default WeldPointMarker;
