"use client";

import { useState, useRef } from "react";

function SidePanelDrawings({
  drawings = [],
  activeDrawingId,
  onSwitchDrawing,
  onAddDrawing,
  onUpdateDrawing,
  onDeleteDrawing,
  lines = [],
  isOpen,
  onToggle,
  isStacked = false,
  hideHeader = false,
}) {
  const [expandedId, setExpandedId] = useState(null);
  const [editRevision, setEditRevision] = useState("");
  const [editLineIds, setEditLineIds] = useState([]);
  const fileInputRef = useRef(null);

  function handleExpand(dwg) {
    if (expandedId === dwg.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(dwg.id);
    setEditRevision(dwg.revision || "");
    setEditLineIds(dwg.lineIds || []);
  }

  function handleSaveRevision(id) {
    onUpdateDrawing?.(id, { revision: editRevision.trim() });
  }

  function toggleLineLink(lineId) {
    const next = editLineIds.includes(lineId)
      ? editLineIds.filter((x) => x !== lineId)
      : [...editLineIds, lineId];
    setEditLineIds(next);
    onUpdateDrawing?.(expandedId, { lineIds: next });
  }

  return (
    <div
      className={`flex-shrink-0 flex flex-col bg-base-200 transition-all duration-300 ease-out min-w-0 ${
        hideHeader
          ? "w-full flex-1 min-h-0 overflow-hidden"
          : `border-l border-base-300 ${isOpen ? "w-full min-w-[16rem] max-w-[28rem] min-h-0 flex-1 h-full overflow-hidden" : "w-14 overflow-hidden"}`
      }`}
    >
      {!hideHeader && (
        <button
          type="button"
          onClick={onToggle}
          className={`flex-shrink-0 flex items-center justify-center gap-2 py-3 px-2 border-b border-base-300 bg-base-100 hover:bg-base-200 transition-colors ${
            isOpen ? "flex-row" : `flex-col ${isStacked ? "min-h-12" : "min-h-24"}`
          }`}
          title={isOpen ? "Collapse drawings panel" : "Expand drawings panel"}
        >
          <span className={`font-medium ${isOpen ? "text-base" : "text-xs -rotate-90 whitespace-nowrap"}`}>
            Drawings
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 transition-transform ${isOpen ? "rotate-90" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {isOpen && (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden w-full min-w-0 h-0 basis-0">
          <div className={`flex-1 min-h-0 overflow-y-scroll overflow-x-auto p-2 min-w-0 pb-12 overscroll-contain [scrollbar-gutter:stable] ${hideHeader ? "mobile-no-scrollbar" : ""}`}>
            {drawings.length === 0 ? (
              <div className="text-center py-6 text-base-content/60 text-sm">
                <p>No drawings yet</p>
                <p className="mt-1">Load a PDF from the toolbar</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {drawings.map((dwg) => {
                  const isActive = dwg.id === activeDrawingId;
                  const isExpanded = dwg.id === expandedId;
                  return (
                    <li
                      key={dwg.id}
                      className={`bg-base-100 rounded-lg overflow-hidden border ${
                        isActive ? "border-primary/50 ring-1 ring-primary/20" : "border-base-300"
                      }`}
                    >
                      <div className="flex items-center gap-2 p-2">
                        <button
                          type="button"
                          className="flex-1 text-left truncate"
                          onClick={() => {
                            if (!isActive) onSwitchDrawing?.(dwg.id);
                          }}
                          title={dwg.filename}
                        >
                          <span className={`font-medium text-sm ${isActive ? "text-primary" : ""}`}>
                            {dwg.filename || "Untitled"}
                          </span>
                          {dwg.revision && (
                            <span className="ml-1.5 badge badge-ghost badge-xs">Rev {dwg.revision}</span>
                          )}
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs btn-square"
                          onClick={() => handleExpand(dwg)}
                          aria-label="Expand"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                      {isExpanded && (
                        <div className="border-t border-base-300 px-2 py-2 space-y-2">
                          <div className="form-control">
                            <label className="label py-0 min-h-0">
                              <span className="label-text text-xs">Revision</span>
                            </label>
                            <input
                              type="text"
                              className="input input-sm input-bordered w-full min-w-0"
                              value={editRevision}
                              onChange={(e) => setEditRevision(e.target.value)}
                              onBlur={() => handleSaveRevision(dwg.id)}
                              placeholder="e.g. A, B, C"
                            />
                          </div>
                          {lines.length > 0 && (
                            <div className="form-control">
                              <label className="label py-0 min-h-0">
                                <span className="label-text text-xs">Linked lines</span>
                              </label>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {lines.map((line) => {
                                  const linked = editLineIds.includes(line.id);
                                  return (
                                    <button
                                      key={line.id}
                                      type="button"
                                      className={`badge badge-sm cursor-pointer ${linked ? "badge-primary" : "badge-ghost"}`}
                                      onClick={() => toggleLineLink(line.id)}
                                    >
                                      {line.name || line.id}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-1 pt-2 border-t border-base-300">
                            {!isActive && (
                              <button
                                type="button"
                                className="btn btn-primary btn-outline btn-sm"
                                onClick={() => onSwitchDrawing?.(dwg.id)}
                              >
                                View
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn btn-error btn-outline btn-sm"
                              onClick={() => {
                                if (confirm("Delete this drawing? Markers on it will remain in the project data.")) {
                                  onDeleteDrawing?.(dwg.id);
                                  if (expandedId === dwg.id) setExpandedId(null);
                                }
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="mt-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = e.target.files;
                  if (files) {
                    for (let i = 0; i < files.length; i++) onAddDrawing?.(files[i]);
                  }
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                className="btn btn-ghost btn-sm w-full gap-1"
                onClick={() => fileInputRef.current?.click()}
              >
                + Add drawing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SidePanelDrawings;
