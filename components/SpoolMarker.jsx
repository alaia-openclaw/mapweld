"use client";

import { useCallback } from "react";

function SpoolMarker({ marker, spoolName, onDelete }) {
  const handleDeleteClick = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      onDelete?.(marker.id);
    },
    [marker.id, onDelete]
  );

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto flex items-center gap-1"
      style={{
        left: `${marker.xPercent}%`,
        top: `${marker.yPercent}%`,
      }}
    >
      <span className="badge badge-lg badge-primary badge-outline min-h-10 px-3 py-2 font-medium">
        {spoolName || "Spool"}
      </span>
      <button
        type="button"
        className="btn btn-circle btn-ghost btn-xs opacity-70 hover:opacity-100"
        onClick={handleDeleteClick}
        aria-label="Remove from drawing"
      >
        ×
      </button>
    </div>
  );
}

export default SpoolMarker;
