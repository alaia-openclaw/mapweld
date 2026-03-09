"use client";

import { useMemo } from "react";

const STATUS_COLUMNS = [
  { id: "not_started", label: "Not started", class: "bg-base-200" },
  { id: "incomplete", label: "In progress", class: "bg-warning/10" },
  { id: "complete", label: "Complete", class: "bg-success/10" },
];

function StatusPage({
  weldPoints = [],
  weldStatusByWeldId = new Map(),
  getWeldName,
  onSelectWeld,
  onClose,
}) {
  const byStatus = useMemo(() => {
    const out = { not_started: [], incomplete: [], complete: [] };
    weldPoints.forEach((w) => {
      const status = weldStatusByWeldId.get(w.id) || "not_started";
      const key = status === "complete" ? "complete" : status === "incomplete" ? "incomplete" : "not_started";
      out[key].push(w);
    });
    return out;
  }, [weldPoints, weldStatusByWeldId]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between p-4 border-b border-base-300 flex-shrink-0">
        <h2 className="text-lg font-semibold">Weld status</h2>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onClose}
          aria-label="Close"
        >
          Close
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
          {STATUS_COLUMNS.map((col) => (
            <div
              key={col.id}
              className={`rounded-lg border border-base-300 flex flex-col min-h-[200px] ${col.class}`}
            >
              <div className="p-2 border-b border-base-300 font-medium flex items-center justify-between">
                <span>{col.label}</span>
                <span className="badge badge-ghost badge-sm">{byStatus[col.id].length}</span>
              </div>
              <div className="flex-1 overflow-auto p-2 space-y-2">
                {byStatus[col.id].map((weld) => (
                  <button
                    key={weld.id}
                    type="button"
                    className="btn btn-sm btn-ghost w-full justify-start text-left normal-case h-auto min-h-0 py-2 px-3 rounded-lg border border-base-300 hover:border-primary"
                    onClick={() => onSelectWeld?.(weld.id)}
                  >
                    <span className="font-medium">{getWeldName?.(weld, weldPoints) ?? weld.id}</span>
                    {weld.weldLocation === "field" && (
                      <span className="ml-1 text-xs opacity-70">(field)</span>
                    )}
                  </button>
                ))}
                {byStatus[col.id].length === 0 && (
                  <p className="text-sm text-base-content/50 py-4 text-center">None</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StatusPage;
