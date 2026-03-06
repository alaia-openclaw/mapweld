"use client";

import { useCallback, useRef, useEffect } from "react";
import { WELD_TYPES, WELD_LOCATION } from "@/lib/constants";
import { getWeldName } from "@/lib/weld-utils";

const BULLET_COLOURS = {
  [WELD_LOCATION.SHOP]: "border-success bg-success",
  [WELD_LOCATION.FIELD]: "border-error bg-error",
};

const LINE_COLOURS = {
  [WELD_LOCATION.SHOP]: "text-success",
  [WELD_LOCATION.FIELD]: "text-error",
};

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
  isSelected,
  canDrag = false,
  onMoveWeldPoint,
  onMoveIndicator,
  pageWrapperRef,
}) {
  const draggingRef = useRef(null);

  const handleClick = useCallback(
    (e) => {
      e.stopPropagation();
      onClick?.(weld);
    },
    [onClick, weld]
  );

  const weldLocation = weld.weldLocation || WELD_LOCATION.SHOP;
  const weldType = weld.weldType || WELD_TYPES.BUTT;
  const isField = weldLocation === WELD_LOCATION.FIELD;

  const wx = weld.xPercent ?? 0;
  const wy = weld.yPercent ?? 0;
  const ix = weld.indicatorXPercent ?? wx;
  const iy = weld.indicatorYPercent ?? wy;

  const minX = Math.min(wx, ix) - 1;
  const minY = Math.min(wy, iy) - 1;
  const maxX = Math.max(wx, ix) + 1;
  const maxY = Math.max(wy, iy) + 1;
  const width = Math.max(maxX - minX, 6);
  const height = Math.max(maxY - minY, 6);

  const lineX1 = ((ix - minX) / width) * 100;
  const lineY1 = ((iy - minY) / height) * 100;
  const lineX2 = ((wx - minX) / width) * 100;
  const lineY2 = ((wy - minY) / height) * 100;

  const indicatorLeft = ((ix - minX) / width) * 100;
  const indicatorTop = ((iy - minY) / height) * 100;
  const weldLeft = ((wx - minX) / width) * 100;
  const weldTop = ((wy - minY) / height) * 100;

  const bulletColourClass = BULLET_COLOURS[weldLocation] || BULLET_COLOURS[WELD_LOCATION.SHOP];
  const lineColourClass = LINE_COLOURS[weldLocation] || LINE_COLOURS[WELD_LOCATION.SHOP];
  const weldName = getWeldName(weld, weldPoints);

  const handlePointerMove = useCallback(
    (e) => {
      const mode = draggingRef.current;
      if (!mode || !pageWrapperRef) return;
      const coords = clientToPercent(e.clientX, e.clientY, pageWrapperRef);
      if (!coords) return;
      if (mode === "weld" && onMoveWeldPoint) {
        onMoveWeldPoint(weld.id, { xPercent: coords.xPercent, yPercent: coords.yPercent });
      } else if (mode === "indicator" && onMoveIndicator) {
        onMoveIndicator(weld.id, {
          indicatorXPercent: coords.xPercent,
          indicatorYPercent: coords.yPercent,
        });
      }
    },
    [weld.id, onMoveWeldPoint, onMoveIndicator, pageWrapperRef]
  );

  const cleanupRef = useRef(null);

  const handleWeldHandlePointerDown = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!canDrag || !onMoveWeldPoint) return;
      draggingRef.current = "weld";
      const onUp = () => {
        draggingRef.current = null;
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointerleave", onUp);
      };
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointerleave", onUp);
    },
    [canDrag, onMoveWeldPoint, handlePointerMove]
  );

  const handleIndicatorHandlePointerDown = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!canDrag || !onMoveIndicator) return;
      draggingRef.current = "indicator";
      const onUp = () => {
        draggingRef.current = null;
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointerleave", onUp);
      };
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointerleave", onUp);
    },
    [canDrag, onMoveIndicator, handlePointerMove]
  );

  useEffect(() => {
    return () => {
      draggingRef.current = null;
    };
  }, []);

  const showHandles = canDrag && isSelected;

  return (
    <button
      type="button"
      className={`absolute transition-all pointer-events-auto focus:outline-none touch-manipulation
        ${lineColourClass}
        ${isSelected ? "ring-2 ring-primary ring-offset-1 z-10" : ""}`}
      style={{
        left: `${minX}%`,
        top: `${minY}%`,
        width: `${width}%`,
        height: `${height}%`,
      }}
      onClick={handleClick}
      title={
        weld.welderName
          ? weld.welderName
          : showHandles
            ? "Drag handles to move. Click to edit."
            : "Click to edit."
      }
      aria-label={`Weld ${weldName}${weldType ? `, ${weldType}` : ""}`}
    >
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <line
          x1={lineX1}
          y1={lineY1}
          x2={lineX2}
          y2={lineY2}
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>

      <div
        className={`absolute -translate-x-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center border-2 border-solid ${bulletColourClass}
          ${isField ? "rotate-45" : "rounded-full"}`}
        style={{
          left: `${indicatorLeft}%`,
          top: `${indicatorTop}%`,
        }}
      >
        <span
          className={`text-xs font-medium leading-none select-none text-base-100
            ${isField ? "-rotate-45" : ""}`}
        >
          {weldName}
        </span>
        {showHandles && (
          <div
            role="button"
            tabIndex={0}
            className="absolute inset-0 -m-2 rounded-full ring-2 ring-primary bg-base-100/80 cursor-grab active:cursor-grabbing touch-none"
            style={{ zIndex: 5 }}
            onPointerDown={handleIndicatorHandlePointerDown}
            aria-label="Drag to move indicator"
          />
        )}
      </div>

      <div
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{
          left: `${weldLeft}%`,
          top: `${weldTop}%`,
        }}
      >
        {isField ? (
          <svg
            width="10"
            height="10"
            className="text-current"
            aria-hidden
          >
            <line
              x1="1"
              y1="1"
              x2="9"
              y2="9"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <line
              x1="9"
              y1="1"
              x2="1"
              y2="9"
              stroke="currentColor"
              strokeWidth="1.2"
            />
          </svg>
        ) : (
          <span className="block w-1.5 h-1.5 rounded-full bg-current" aria-hidden />
        )}
        {showHandles && (
          <div
            role="button"
            tabIndex={0}
            className="absolute -translate-x-1/2 -translate-y-1/2 -m-3 w-6 h-6 rounded-full ring-2 ring-primary bg-base-100 cursor-grab active:cursor-grabbing touch-none"
            style={{ left: "50%", top: "50%", zIndex: 5 }}
            onPointerDown={handleWeldHandlePointerDown}
            aria-label="Drag to move weld point"
          />
        )}
      </div>
    </button>
  );
}

export default WeldPointMarker;
