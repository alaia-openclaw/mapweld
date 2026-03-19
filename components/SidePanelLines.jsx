"use client";

import { useState, useEffect, useRef, useMemo } from "react";

function SidePanelLines({
  systems = [],
  lines = [],
  onSaveLines,
  spools = [],
  onSaveSpools,
  appMode = "edition",
  systemsManagedExternally = false,
  isOpen,
  onToggle,
  isStacked = false,
  hideHeader = false,
}) {
  const [expandedLineId, setExpandedLineId] = useState(null);
  const [spoolMenuLineId, setSpoolMenuLineId] = useState(null);

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

  function spoolsOnLine(lineId) {
    return (spools || []).filter((spool) => spool.lineId === lineId);
  }

  function assignSpoolToLine(spoolId, lineId) {
    if (!onSaveSpools) return;
    onSaveSpools(
      (spools || []).map((spool) =>
        spool.id === spoolId ? { ...spool, lineId: lineId || null } : spool
      )
    );
  }

  const groupedLines = useMemo(() => {
    const groups = (systems || []).map((system) => ({
      id: system.id,
      label: system.name || "Unnamed system",
      description: system.description || "",
      lines: [],
    }));
    const byId = new Map(groups.map((group) => [group.id, group]));
    const orphan = { id: "__none__", label: "No system", description: "", lines: [] };

    (lines || []).forEach((line) => {
      if (line.systemId && byId.has(line.systemId)) byId.get(line.systemId).lines.push(line);
      else orphan.lines.push(line);
    });

    groups.forEach((group) =>
      group.lines.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")))
    );
    orphan.lines.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));

    const all = groups;
    if (orphan.lines.length > 0) all.push(orphan);
    return all;
  }, [systems, lines]);

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
            {lines.length === 0 ? (
              <div className="text-center py-6 text-base-content/60 text-sm">
                <p>No lines on this page</p>
                <p className="mt-1">
                  Lines are filtered to the current page.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {groupedLines.map((group) => {
                  return (
                    <li key={group.id} className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-base-content/70 truncate">
                            {group.label}
                          </p>
                          {group.description ? (
                            <p className="text-xs text-base-content/55 truncate">{group.description}</p>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs gap-0.5"
                          onClick={() => handleAddLine(group.id === "__none__" ? null : group.id)}
                        >
                          + Add line
                        </button>
                      </div>
                      {group.lines.length === 0 ? (
                        <p className="text-xs text-base-content/50">No lines in this group</p>
                      ) : (
                        <ul className="space-y-1">
                          {group.lines.map((line) => {
                            const isExpandedLine = line.id === expandedLineId;
                            return (
                              <li key={line.id} className="bg-base-100 border border-base-300 rounded-lg overflow-hidden">
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
                    </li>
                  );
                })}
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
    const linkedSpools = spoolsOnLine(line.id);
    const availableSpools = (spools || []).filter((spool) => spool.lineId !== line.id);
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
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-1">
            <span className="label-text text-xs font-medium">Linked spools ({linkedSpools.length})</span>
            {appMode === "edition" && (spools || []).length > 0 && (
              <div className={`dropdown dropdown-end ${spoolMenuLineId === line.id ? "dropdown-open" : ""}`}>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs gap-0.5"
                  onClick={() => setSpoolMenuLineId((prev) => (prev === line.id ? null : line.id))}
                >
                  + Add spool
                </button>
                <ul className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-56 max-h-56 overflow-y-auto border border-base-300">
                  {availableSpools.length === 0 ? (
                    <li><span className="text-xs text-base-content/50">All spools linked</span></li>
                  ) : (
                    availableSpools.map((spool) => (
                      <li key={spool.id}>
                        <button
                          type="button"
                          className="text-left text-sm"
                          onClick={() => {
                            assignSpoolToLine(spool.id, line.id);
                            setSpoolMenuLineId(null);
                          }}
                        >
                          {spool.name || spool.id}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}
          </div>
          {linkedSpools.length === 0 ? (
            <p className="text-xs text-base-content/50">None linked</p>
          ) : (
            <ul className="space-y-0.5">
              {linkedSpools.map((spool) => (
                <li
                  key={spool.id}
                  className="flex items-center justify-between gap-1 text-xs py-1 px-1.5 bg-base-200 rounded min-w-0"
                >
                  <span className="truncate" title={spool.name || spool.id}>{spool.name || spool.id}</span>
                  {appMode === "edition" && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs text-error px-0.5 min-h-6"
                      onClick={() => assignSpoolToLine(spool.id, null)}
                      aria-label="Unlink spool"
                      title="Unlink spool"
                    >
                      ×
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
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
