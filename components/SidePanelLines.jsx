"use client";

import { useState, useEffect, useRef } from "react";

function SidePanelLines({
  systems = [],
  lines = [],
  onSaveLines,
  systemsManagedExternally = false,
  isOpen,
  onToggle,
  isStacked = false,
  hideHeader = false,
}) {
  const [expandedSystemId, setExpandedSystemId] = useState(null);
  const [expandedLineId, setExpandedLineId] = useState(null);

  const [editLineName, setEditLineName] = useState("");
  const [editFluidType, setEditFluidType] = useState("");
  const [editPressure, setEditPressure] = useState("");
  const [editDiameterRange, setEditDiameterRange] = useState("");
  const [editThickness, setEditThickness] = useState("");
  const [editMaterial, setEditMaterial] = useState("");

  const prevExpandedLineRef = useRef(null);

  useEffect(() => {
    if (!expandedLineId) { prevExpandedLineRef.current = null; return; }
    if (prevExpandedLineRef.current === expandedLineId) return;
    prevExpandedLineRef.current = expandedLineId;
    const line = lines.find((l) => l.id === expandedLineId);
    if (line) {
      setEditLineName(line.name ?? "");
      setEditFluidType(line.fluidType ?? "");
      setEditPressure(line.pressure ?? "");
      setEditDiameterRange(line.diameterRange ?? "");
      setEditThickness(line.thickness ?? "");
      setEditMaterial(line.material ?? "");
    }
  }, [expandedLineId, lines]);

  function handleAddLine(systemId) {
    const id = `line-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const sysLines = lines.filter((l) => l.systemId === systemId);
    const num = sysLines.length + 1;
    onSaveLines?.([
      ...lines,
      { id, systemId, name: `Line ${num}`, fluidType: "", pressure: "", diameterRange: "", thickness: "", material: "", drawingIds: [] },
    ]);
    setExpandedLineId(id);
  }

  function handleUpdateLine(id) {
    onSaveLines?.(
      lines.map((l) =>
        l.id === id
          ? {
              ...l,
              name: editLineName.trim() || l.name,
              fluidType: editFluidType.trim(),
              pressure: editPressure.trim(),
              diameterRange: editDiameterRange.trim(),
              thickness: editThickness.trim(),
              material: editMaterial.trim(),
            }
          : l
      )
    );
  }

  function handleDeleteLine(id) {
    if (!confirm("Delete this line?")) return;
    onSaveLines?.(lines.filter((l) => l.id !== id));
    if (expandedLineId === id) setExpandedLineId(null);
  }

  function linesForSystem(sysId) {
    return lines.filter((l) => l.systemId === sysId);
  }

  const orphanLines = lines.filter((l) => !l.systemId || !systems.some((s) => s.id === l.systemId));

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
          title={isOpen ? "Collapse lines panel" : "Expand lines panel"}
        >
          <span className={`font-medium ${isOpen ? "text-base" : "text-xs -rotate-90 whitespace-nowrap"}`}>
            Lines
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
            {systems.length === 0 && orphanLines.length === 0 ? (
              <div className="text-center py-6 text-base-content/60 text-sm">
                <p>No systems or lines</p>
                <p className="mt-1">
                  {systemsManagedExternally ? "Add systems in Parameters > Project tab" : "Add a system to group piping lines"}
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {systems.map((sys) => {
                  const sysLines = linesForSystem(sys.id);
                  const isExpandedSys = sys.id === expandedSystemId;
                  return (
                    <li key={sys.id} className="bg-base-100 rounded-lg overflow-hidden border border-base-300">
                      <div className="flex items-center gap-2 p-2">
                        <button
                          type="button"
                          className="flex-1 text-left truncate font-medium text-sm"
                          onClick={() => setExpandedSystemId((prev) => (prev === sys.id ? null : sys.id))}
                        >
                          {sys.name || "Unnamed system"}
                          <span className="ml-1.5 badge badge-ghost badge-xs">{sysLines.length} line{sysLines.length !== 1 ? "s" : ""}</span>
                        </button>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-4 w-4 flex-shrink-0 transition-transform ${isExpandedSys ? "rotate-180" : ""}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      {isExpandedSys && (
                        <div className="border-t border-base-300 px-2 py-2 space-y-2">
                          {sys.description ? (
                            <p className="text-xs text-base-content/60">{sys.description}</p>
                          ) : null}

                          <div className="space-y-1 pt-1">
                            <div className="flex items-center justify-between">
                              <span className="label-text text-xs font-medium">Lines ({sysLines.length})</span>
                              <button type="button" className="btn btn-ghost btn-xs gap-0.5" onClick={() => handleAddLine(sys.id)}>
                                + Add line
                              </button>
                            </div>
                            {sysLines.length === 0 ? (
                              <p className="text-xs text-base-content/50">No lines in this system</p>
                            ) : (
                              <ul className="space-y-1">
                                {sysLines.map((line) => {
                                  const isExpandedLine = line.id === expandedLineId;
                                  return (
                                    <li key={line.id} className="bg-base-200 rounded-lg overflow-hidden">
                                      <button
                                        type="button"
                                        className="w-full text-left text-xs px-2 py-1.5 flex items-center justify-between"
                                        onClick={() => setExpandedLineId((prev) => (prev === line.id ? null : line.id))}
                                      >
                                        <span className="truncate font-medium">{line.name || "Unnamed line"}</span>
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          className={`h-3 w-3 flex-shrink-0 transition-transform ${isExpandedLine ? "rotate-180" : ""}`}
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                      </button>
                                      {isExpandedLine && renderLineForm(line)}
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}

                {orphanLines.length > 0 && (
                  <li className="bg-base-100 rounded-lg overflow-hidden border border-base-300 p-2 space-y-1">
                    <span className="label-text text-xs font-medium text-base-content/60">Lines without system</span>
                    <ul className="space-y-1">
                      {orphanLines.map((line) => {
                        const isExpandedLine = line.id === expandedLineId;
                        return (
                          <li key={line.id} className="bg-base-200 rounded-lg overflow-hidden">
                            <button
                              type="button"
                              className="w-full text-left text-xs px-2 py-1.5 flex items-center justify-between"
                              onClick={() => setExpandedLineId((prev) => (prev === line.id ? null : line.id))}
                            >
                              <span className="truncate font-medium">{line.name || "Unnamed line"}</span>
                            </button>
                            {isExpandedLine && renderLineForm(line)}
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                )}
              </ul>
            )}
            {systemsManagedExternally && (
              <p className="text-xs text-base-content/60 mt-3">
                Systems are managed in Parameters &gt; Project tab.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  function renderLineForm(line) {
    return (
      <div className="border-t border-base-300/60 px-2 py-2 space-y-1.5">
        <div className="form-control">
          <label className="label py-0 min-h-0"><span className="label-text text-xs">Line name</span></label>
          <input type="text" className="input input-xs input-bordered w-full min-w-0" value={editLineName} onChange={(e) => setEditLineName(e.target.value)} onBlur={() => handleUpdateLine(line.id)} />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <div className="form-control">
            <label className="label py-0 min-h-0"><span className="label-text text-xs">Fluid type</span></label>
            <input type="text" className="input input-xs input-bordered w-full min-w-0" value={editFluidType} onChange={(e) => setEditFluidType(e.target.value)} onBlur={() => handleUpdateLine(line.id)} placeholder="e.g. Mud, Water" />
          </div>
          <div className="form-control">
            <label className="label py-0 min-h-0"><span className="label-text text-xs">Pressure</span></label>
            <input type="text" className="input input-xs input-bordered w-full min-w-0" value={editPressure} onChange={(e) => setEditPressure(e.target.value)} onBlur={() => handleUpdateLine(line.id)} placeholder="e.g. 3000 psi" />
          </div>
          <div className="form-control">
            <label className="label py-0 min-h-0"><span className="label-text text-xs">Diameter range</span></label>
            <input type="text" className="input input-xs input-bordered w-full min-w-0" value={editDiameterRange} onChange={(e) => setEditDiameterRange(e.target.value)} onBlur={() => handleUpdateLine(line.id)} placeholder='e.g. 2" - 6"' />
          </div>
          <div className="form-control">
            <label className="label py-0 min-h-0"><span className="label-text text-xs">Thickness</span></label>
            <input type="text" className="input input-xs input-bordered w-full min-w-0" value={editThickness} onChange={(e) => setEditThickness(e.target.value)} onBlur={() => handleUpdateLine(line.id)} placeholder="e.g. Sch 40" />
          </div>
        </div>
        <div className="form-control">
          <label className="label py-0 min-h-0"><span className="label-text text-xs">Material</span></label>
          <input type="text" className="input input-xs input-bordered w-full min-w-0" value={editMaterial} onChange={(e) => setEditMaterial(e.target.value)} onBlur={() => handleUpdateLine(line.id)} placeholder="e.g. CS, SS316" />
        </div>
        <div className="flex justify-end pt-1">
          <button type="button" className="btn btn-error btn-outline btn-xs" onClick={() => handleDeleteLine(line.id)}>
            Delete line
          </button>
        </div>
      </div>
    );
  }
}

export default SidePanelLines;
