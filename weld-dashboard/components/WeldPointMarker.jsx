"use client";

import { useCallback } from "react";
import { WELD_STATUS, WELD_TYPES } from "@/lib/constants";

const STATUS_COLOURS = {
  [WELD_STATUS.NOT_STARTED]: "border-base-300 bg-base-300",
  [WELD_STATUS.WELDED]: "border-warning bg-warning/80",
  [WELD_STATUS.NDT_COMPLETE]: "border-info bg-info/80",
  [WELD_STATUS.FINALIZED]: "border-success bg-success/80",
};

const WELD_TYPE_SHAPES = {
  [WELD_TYPES.BUTT]: "rounded-full",
  [WELD_TYPES.FILLET]: "rounded-none rotate-45",
  [WELD_TYPES.SOCKET]: "rounded-md",
  [WELD_TYPES.TEE]: "rounded-none",
  [WELD_TYPES.LAP]: "rounded-sm",
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
  const weldType = weld.weldType || WELD_TYPES.BUTT;
  const colourClass =
    STATUS_COLOURS[status] || STATUS_COLOURS[WELD_STATUS.NOT_STARTED];
  const shapeClass =
    WELD_TYPE_SHAPES[weldType] || WELD_TYPE_SHAPES[WELD_TYPES.BUTT];

  return (
    <button
      type="button"
      className={`absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 border-2 transition-all pointer-events-auto
        ${shapeClass} ${colourClass}
        ${isSelected ? "ring-2 ring-primary ring-offset-2 scale-125" : "hover:scale-110"}
        focus:outline-none
        ${isRelocating ? "ring-2 ring-secondary animate-pulse" : ""}`}
      style={{
        left: `${weld.xPercent}%`,
        top: `${weld.yPercent}%`,
      }}
      onClick={handleClick}
      title={
        weld.welderName
          ? `${weld.welderName} - ${status}`
          : "Click to edit. Use Move button to relocate."
      }
      aria-label={`Weld point ${weld.id}`}
    />
  );
}

export default WeldPointMarker;
