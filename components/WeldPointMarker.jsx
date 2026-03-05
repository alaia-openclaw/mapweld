"use client";

import { useCallback } from "react";
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

function WeldPointMarker({ weld, weldPoints = [], onClick, isSelected, isRelocating }) {
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

  return (
    <button
      type="button"
      className={`absolute transition-all pointer-events-auto focus:outline-none touch-manipulation
        ${lineColourClass}
        ${isSelected ? "ring-2 ring-primary ring-offset-1 z-10" : ""}
        ${isRelocating ? "ring-2 ring-secondary animate-pulse z-10" : ""}`}
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
          : "Click to edit. Use Move button to relocate."
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
      </div>
    </button>
  );
}

export default WeldPointMarker;
