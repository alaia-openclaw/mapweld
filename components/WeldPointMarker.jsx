"use client";

import { useCallback } from "react";
import { WELD_STATUS, WELD_TYPES, WELD_LOCATION } from "@/lib/constants";

const STATUS_COLOURS = {
  [WELD_STATUS.NOT_STARTED]: "border-base-300 bg-base-300",
  [WELD_STATUS.WELDED]: "border-warning bg-warning/80",
  [WELD_STATUS.NDT_COMPLETE]: "border-info bg-info/80",
  [WELD_STATUS.FINALIZED]: "border-success bg-success/80",
};

const STATUS_TEXT_COLOURS = {
  [WELD_STATUS.NOT_STARTED]: "text-base-300",
  [WELD_STATUS.WELDED]: "text-warning",
  [WELD_STATUS.NDT_COMPLETE]: "text-info",
  [WELD_STATUS.FINALIZED]: "text-success",
};

const BULLET_SHAPES = {
  [WELD_LOCATION.SHOP]: "rounded-full",
  [WELD_LOCATION.FIELD]: "rounded-none rotate-45",
};

function WeldPointMarker({ weld, onClick, isSelected, isRelocating }) {
  const handleClick = useCallback(
    (e) => {
      e.stopPropagation();
      onClick?.(weld);
    },
    [onClick, weld]
  );

  const status = weld.status || WELD_STATUS.NOT_STARTED;
  const weldLocation = weld.weldLocation || WELD_LOCATION.SHOP;
  const weldType = weld.weldType || WELD_TYPES.BUTT;
  const colourClass =
    STATUS_COLOURS[status] || STATUS_COLOURS[WELD_STATUS.NOT_STARTED];
  const textColourClass =
    STATUS_TEXT_COLOURS[status] || STATUS_TEXT_COLOURS[WELD_STATUS.NOT_STARTED];
  const bulletShapeClass =
    BULLET_SHAPES[weldLocation] || BULLET_SHAPES[WELD_LOCATION.SHOP];
  const isField = weldLocation === WELD_LOCATION.FIELD;

  return (
    <button
      type="button"
      className={`absolute -translate-x-1/2 -translate-y-1/2 w-10 h-10 min-w-10 min-h-10
        flex items-center justify-end
        transition-all pointer-events-auto focus:outline-none touch-manipulation
        ${textColourClass}
        ${isSelected ? "ring-2 ring-primary ring-offset-1 scale-105" : "hover:scale-105 active:scale-95"}
        ${isRelocating ? "ring-2 ring-secondary animate-pulse" : ""}`}
      style={{
        left: `${weld.xPercent}%`,
        top: `${weld.yPercent}%`,
      }}
      onClick={handleClick}
      title={
        weld.welderName
          ? weld.welderName
          : "Click to edit. Use Move button to relocate."
      }
      aria-label={`Weld point ${weld.id}${weldType ? `, ${weldType}` : ""}`}
    >
      <div className="flex items-center absolute right-1/2 mr-0.5">
        <span
          className={`w-4 h-4 flex-shrink-0 border-2 border-solid ${bulletShapeClass} ${colourClass}`}
        />
        <svg
          width="8"
          height="2"
          className="flex-shrink-0"
          aria-hidden
        >
          <line
            x1="0"
            y1="1"
            x2="8"
            y2="1"
            stroke="currentColor"
            strokeWidth="1"
          />
        </svg>
      </div>
      {isField ? (
        <svg
          width="10"
          height="10"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
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
        <span
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-current"
          aria-hidden
        />
      )}
    </button>
  );
}

export default WeldPointMarker;
