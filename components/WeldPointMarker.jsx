"use client";

import { useCallback, useRef, useEffect } from "react";
import { WELD_TYPES, WELD_LOCATION } from "@/lib/constants";
import { getWeldName } from "@/lib/weld-utils";
import { warnIfDev } from "@/lib/dev-log";

const BULLET_COLOURS = {
  [WELD_LOCATION.SHOP]: "border-success bg-success",
  [WELD_LOCATION.FIELD]: "border-error bg-error",
};

const LINE_COLOURS = {
  [WELD_LOCATION.SHOP]: "text-success",
  [WELD_LOCATION.FIELD]: "text-error",
};

const LABEL_FONT_SIZE_MIN = 8;
const LABEL_FONT_SIZE_MAX = 24;
const WELD_MARKER_DISPLAY_SCALE = 0.5;

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
  spools = [],
  onClick,
  onDoubleClick,
  isSelected,
  canDrag = false,
  onMoveWeldPoint,
  onMoveIndicator,
  onResizeLabel,
  onMoveLineBend,
  pageWrapperRef,
  weldStatus,
  scale = 1,
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

  const bulletColourClass = BULLET_COLOURS[weldLocation] || BULLET_COLOURS[WELD_LOCATION.SHOP];
  const lineColourClass = LINE_COLOURS[weldLocation] || LINE_COLOURS[WELD_LOCATION.SHOP];
  const weldName = getWeldName(weld, weldPoints);
  const spoolName = weld.spoolId
    ? spools.find((s) => s.id === weld.spoolId)?.name
    : null;
  const rawFontSize = weld.labelFontSize ?? 12;
  const displayFontSize = Math.max(4, rawFontSize * WELD_MARKER_DISPLAY_SCALE);
  const scaledFontSize = displayFontSize * scale;
  const scaledMin = Math.max(16, displayFontSize * 2) * scale;
  const bulletSize = Math.max(2, Math.round(6 * scale));
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
        onPointerDown={showHandles ? handleIndicatorHandlePointerDown : undefined}
        className={`absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center border-2 border-solid z-10 ${bulletColourClass}
          ${indicatorPositionOverride ? "pointer-events-none" : "pointer-events-auto"}
          ${isField ? "rotate-45" : "rounded-full"}
          ${lineColourClass}
          ${showHandles ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}
          ${isSelected ? (showHandles ? "ring-2 ring-error ring-offset-1" : "ring-2 ring-primary ring-offset-1") : weldStatus === "complete" ? "ring-2 ring-success ring-offset-1" : weldStatus === "incomplete" ? "ring-2 ring-warning ring-offset-1" : weldStatus === "not_started" ? "ring-2 ring-error ring-offset-1" : ""}`}
        style={{
          left: `${ix}%`,
          top: `${iy}%`,
          minWidth: `${scaledMin}px`,
          minHeight: `${scaledMin}px`,
        }}
        aria-label={showHandles ? "Drag to move label" : undefined}
      >
        <span
          className={`font-medium leading-none select-none text-base-100 flex flex-col items-center
            ${isField ? "-rotate-45" : ""}`}
          style={{ fontSize: `${scaledFontSize}px` }}
        >
          <span>{weldName}</span>
          {spoolName && (
            <span
              className="opacity-70 text-[0.65em] leading-tight"
              style={{ fontSize: `${Math.max(4, scaledFontSize * 0.65)}px` }}
            >
              {spoolName}
            </span>
          )}
        </span>
      </div>

      <div
        role="presentation"
        className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
        style={{
          left: `${wx}%`,
          top: `${wy}%`,
        }}
      >
        {isField ? (
          <svg
            width={bulletSize}
            height={bulletSize}
            className="text-current"
            aria-hidden
          >
            <line
              x1="0.5"
              y1="0.5"
              x2={bulletSize - 0.5}
              y2={bulletSize - 0.5}
              stroke="currentColor"
              strokeWidth={Math.max(0.5, 1 * scale)}
            />
            <line
              x1={bulletSize - 0.5}
              y1="0.5"
              x2="0.5"
              y2={bulletSize - 0.5}
              stroke="currentColor"
              strokeWidth={Math.max(0.5, 1 * scale)}
            />
          </svg>
        ) : (
          <span
            className="block rounded-full bg-current"
            style={{ width: `${dotSize}px`, height: `${dotSize}px` }}
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
