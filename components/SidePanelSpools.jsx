"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { comparePartDisplayNumbers } from "@/lib/part-display-number";

function SidePanelSpools({
  spools = [],
  isOpen,
  onToggle,
  onSave,
  onAssignWeldToSpool,
  onAssignPartToSpool,
  parts = [],
  spoolMarkers = [],
  appMode = "edition",
  weldPoints = [],
  weldStatusByWeldId,
  getWeldName,
  lines = [],
  isStacked = false,
  hideHeader = false,
}) {
  const [expandedSpoolId, setExpandedSpoolId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDimX, setEditDimX] = useState("");
  const [editDimY, setEditDimY] = useState("");
  const [editDimZ, setEditDimZ] = useState("");
  const [editWeight, setEditWeight] = useState("");
  const [editPressureValue, setEditPressureValue] = useState("");
  const [editPressureUnit, setEditPressureUnit] = useState("bar");
  const [editLineId, setEditLineId] = useState("");
  /** Portal menu so list isn’t clipped by panel overflow ({ kind, spoolId, rect } | null) */
  const [menuPortal, setMenuPortal] = useState(null);

  const closeMenuPortal = useCallback(() => setMenuPortal(null), []);

  useEffect(() => {
    if (!menuPortal) return;
    function onKey(e) {
      if (e.key === "Escape") closeMenuPortal();
    }
    function onResize() {
      closeMenuPortal();
    }
    window.addEventListener("keydown", onKey);
    // Do not listen to `scroll` with capture — scrolling inside the portal menu
    // fires captured scroll events and was closing the menu when using the scrollbar.
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [menuPortal, closeMenuPortal]);

  const previousExpandedSpoolIdRef = useRef(null);
  useEffect(() => {
    if (!expandedSpoolId) {
      previousExpandedSpoolIdRef.current = null;
      return;
    }
    if (previousExpandedSpoolIdRef.current === expandedSpoolId) return;
    previousExpandedSpoolIdRef.current = expandedSpoolId;
    const s = spools.find((sp) => sp.id === expandedSpoolId);
    if (s) {
      setEditName(s.name ?? "");
      setEditDimX(String(s.dimX ?? ""));
      setEditDimY(String(s.dimY ?? ""));
      setEditDimZ(String(s.dimZ ?? ""));
      setEditWeight(String(s.weight ?? ""));
      setEditPressureValue(String(s.pressureTestValue ?? ""));
      setEditPressureUnit(s.pressureTestUnit ?? "bar");
      setEditLineId(s.lineId ?? "");
    }
  }, [expandedSpoolId, spools]);

  function handleUpdate(id) {
    const s = spools.find((sp) => sp.id === id);
    if (!s) return;
    const updated = spools.map((sp) =>
      sp.id === id
        ? {
            ...sp,
            name: editName.trim() || sp.name,
            dimX: editDimX.trim() || "",
            dimY: editDimY.trim() || "",
            dimZ: editDimZ.trim() || "",
            weight: editWeight.trim() || "",
            pressureTestValue: editPressureValue.trim() || "",
            pressureTestUnit: editPressureUnit,
            lineId: editLineId || null,
          }
        : sp
    );
    onSave?.(updated);
  }

  function handleDelete(id) {
    if (confirm("Delete this spool? Its marker will be removed from the drawing.")) {
      onSave?.(spools.filter((s) => s.id !== id));
      setExpandedSpoolId((prev) => (prev === id ? null : prev));
    }
  }

  const weldsBySpoolId = weldPoints.reduce((acc, w) => {
    const sid = w.spoolId;
    if (!sid) return acc;
    if (!acc[sid]) acc[sid] = [];
    acc[sid].push(w);
    return acc;
  }, {});

  function weldsNotOnSpool(spoolId) {
    return weldPoints.filter((w) => w.spoolId !== spoolId);
  }

  function partsOnSpool(spoolId) {
    return parts.filter((p) => p.spoolId === spoolId);
  }

  function partsNotOnSpool(spoolId) {
    return parts.filter((p) => p.spoolId !== spoolId);
  }

  function getSpoolName(spoolId) {
    const spool = spools.find((s) => s.id === spoolId);
    return spool?.name ?? null;
  }

  function renderPortalMenu() {
    if (!menuPortal || typeof document === "undefined") return null;
    const { kind, spoolId, rect } = menuPortal;
    const margin = 12;
    const spaceBelow = Math.max(0, window.innerHeight - rect.bottom - margin);
    const spaceAbove = Math.max(0, rect.top - margin);
    const idealMax = 360;
    let openDownward = spaceBelow >= spaceAbove;
    let avail = openDownward ? spaceBelow : spaceAbove;
    let maxH = Math.min(idealMax, avail);
    if (maxH < 80) {
      const other = openDownward ? spaceAbove : spaceBelow;
      if (other > avail) {
        openDownward = !openDownward;
        avail = other;
        maxH = Math.min(idealMax, avail);
      }
    }
    if (maxH < 48) {
      maxH = Math.min(idealMax, Math.max(spaceBelow, spaceAbove));
    }

    const menuStyle = {
      position: "fixed",
      right: Math.max(8, window.innerWidth - rect.right),
      minWidth: "12rem",
      maxHeight: maxH,
      zIndex: 9999,
      overflowY: "auto",
      overscrollBehavior: "contain",
      WebkitOverflowScrolling: "touch",
      touchAction: "pan-y",
    };
    if (openDownward) {
      menuStyle.top = rect.bottom + 4;
    } else {
      menuStyle.bottom = window.innerHeight - rect.top + 4;
    }

    const listWeld = () =>
      weldsNotOnSpool(spoolId).length === 0 ? (
        <p className="px-2 py-2 text-xs text-base-content/50">All welds assigned</p>
      ) : (
        <ul className="menu p-1">
          {weldsNotOnSpool(spoolId).map((w) => {
            const weldLabel = getWeldName ? getWeldName(w, weldPoints) : w.id;
            const otherSpoolName =
              w.spoolId && w.spoolId !== spoolId ? getSpoolName(w.spoolId) : null;
            const fullLabel = otherSpoolName ? `${weldLabel} · ${otherSpoolName}` : weldLabel;
            return (
              <li key={w.id}>
                <button
                  type="button"
                  className="text-left text-sm py-1.5 w-full min-w-0 truncate rounded-lg"
                  title={fullLabel}
                  onClick={() => {
                    onAssignWeldToSpool(w.id, spoolId);
                    closeMenuPortal();
                  }}
                >
                  {weldLabel}
                  {otherSpoolName && (
                    <span className="text-base-content/60 text-xs">
                      {" · "}
                      {otherSpoolName}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      );

    const listPart = () =>
      partsNotOnSpool(spoolId).length === 0 ? (
        <p className="px-2 py-2 text-xs text-base-content/50">All parts assigned</p>
      ) : (
        <ul className="menu p-1">
          {partsNotOnSpool(spoolId)
            .slice()
            .sort(comparePartDisplayNumbers)
            .map((p) => {
              const otherSpoolName =
                p.spoolId && p.spoolId !== spoolId ? getSpoolName(p.spoolId) : null;
              const fullLabel = otherSpoolName
                ? `Part ${p.displayNumber} · ${otherSpoolName}`
                : `Part ${p.displayNumber}`;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    className="text-left text-sm py-1.5 w-full min-w-0 truncate rounded-lg"
                    title={fullLabel}
                    onClick={() => {
                      onAssignPartToSpool(p.id, spoolId);
                      closeMenuPortal();
                    }}
                  >
                    Part {p.displayNumber}
                    {[p.partType, p.nps].filter(Boolean).length ? (
                      <span>
                        {" · "}
                        {[p.partType, p.nps].filter(Boolean).join(" ")}
                      </span>
                    ) : null}
                    {otherSpoolName && (
                      <span className="text-base-content/60 text-xs">
                        {" · "}
                        {otherSpoolName}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
        </ul>
      );

    return createPortal(
      <>
        <button
          type="button"
          className="fixed inset-0 z-[9998] cursor-default bg-transparent"
          aria-label="Close menu"
          onClick={closeMenuPortal}
        />
        <div
          className="fixed rounded-box border border-base-300 bg-base-100 p-1 shadow-lg flex flex-col min-h-0 pointer-events-auto"
          style={menuStyle}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {kind === "weld" && onAssignWeldToSpool && listWeld()}
          {kind === "part" && onAssignPartToSpool && listPart()}
        </div>
      </>,
      document.body
    );
  }

  return (
    <>
    <div
      className={`flex-shrink-0 flex flex-col bg-base-200 transition-all duration-300 ease-out min-w-0 ${
        hideHeader ? "w-full flex-1 min-h-0 overflow-hidden" : `border-l border-base-300 ${isOpen ? "w-full min-w-[16rem] max-w-[28rem] min-h-0 flex-1 h-full overflow-hidden" : "w-14 overflow-hidden"}`
      }`}
    >
      {!hideHeader && (
        <button
          type="button"
          onClick={onToggle}
          className={`flex-shrink-0 flex items-center justify-center gap-2 py-3 px-2 border-b border-base-300 bg-base-100 hover:bg-base-200 transition-colors ${
            isOpen ? "flex-row" : `flex-col ${isStacked ? "min-h-12" : "min-h-24"}`
          }`}
          title={isOpen ? "Collapse spools panel" : "Expand spools panel"}
          aria-label={isOpen ? "Collapse spools panel" : "Expand spools panel"}
        >
          <span
            className={`font-medium ${isOpen ? "text-base" : "text-xs -rotate-90 whitespace-nowrap"}`}
          >
            Spools
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 transition-transform ${isOpen ? "rotate-90" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      )}

      {isOpen && (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden w-full min-w-0 h-0 basis-0">
          <div className={`flex-1 min-h-0 overflow-y-scroll overflow-x-auto p-2 min-w-0 pb-12 overscroll-contain [scrollbar-gutter:stable] ${hideHeader ? "mobile-no-scrollbar" : ""}`}>
            {spools.length === 0 ? (
              <div className="text-center py-6 text-base-content/60 text-sm">
                <p>No spools yet</p>
                <p className="mt-1">Add with the Add Spool tool on the drawing</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {spools.map((s) => {
                  const isExpanded = s.id === expandedSpoolId;
                  const attachedWelds = weldsBySpoolId[s.id] || [];
                  return (
                    <li
                      key={s.id}
                      className="bg-base-100 rounded-lg overflow-hidden border border-base-300"
                    >
                      <div className="flex items-center gap-2 p-2">
                        <button
                          type="button"
                          className="flex-1 text-left truncate font-medium"
                          onClick={() =>
                            setExpandedSpoolId((prev) => (prev === s.id ? null : s.id))
                          }
                        >
                          {s.name}
                        </button>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-4 w-4 flex-shrink-0 transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                      {isExpanded && (
                        <div className="border-t border-base-300 px-2 py-2 space-y-2">
                          <div className="form-control">
                            <label className="label py-0 min-h-0">
                              <span className="label-text text-xs">Name</span>
                            </label>
                            <input
                              type="text"
                              className="input input-xs input-bordered w-full min-w-0"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onBlur={() => handleUpdate(s.id)}
                              placeholder="Spool name"
                            />
                          </div>
                          <div className="form-control">
                            <label className="label py-0 min-h-0">
                              <span className="label-text text-xs">Dimensions (mm)</span>
                            </label>
                            <div className="flex gap-1">
                              <input
                                type="text"
                                inputMode="numeric"
                                className="input input-xs input-bordered flex-1 min-w-0 w-0"
                                value={editDimX}
                                onChange={(e) => setEditDimX(e.target.value)}
                                onBlur={() => handleUpdate(s.id)}
                                placeholder="X"
                              />
                              <input
                                type="text"
                                inputMode="numeric"
                                className="input input-xs input-bordered flex-1 min-w-0 w-0"
                                value={editDimY}
                                onChange={(e) => setEditDimY(e.target.value)}
                                onBlur={() => handleUpdate(s.id)}
                                placeholder="Y"
                              />
                              <input
                                type="text"
                                inputMode="numeric"
                                className="input input-xs input-bordered flex-1 min-w-0 w-0"
                                value={editDimZ}
                                onChange={(e) => setEditDimZ(e.target.value)}
                                onBlur={() => handleUpdate(s.id)}
                                placeholder="Z"
                              />
                            </div>
                          </div>
                          <div className="form-control">
                            <label className="label py-0 min-h-0">
                              <span className="label-text text-xs">Weight (kg)</span>
                            </label>
                            <input
                              type="text"
                              inputMode="decimal"
                              className="input input-xs input-bordered w-full min-w-0"
                              value={editWeight}
                              onChange={(e) => setEditWeight(e.target.value)}
                              onBlur={() => handleUpdate(s.id)}
                              placeholder="e.g. 125"
                            />
                          </div>
                          <div className="form-control">
                            <label className="label py-0 min-h-0">
                              <span className="label-text text-xs">Pressure test</span>
                            </label>
                            <div className="flex gap-1">
                              <input
                                type="text"
                                inputMode="decimal"
                                className="input input-xs input-bordered flex-1 min-w-0"
                                value={editPressureValue}
                                onChange={(e) => setEditPressureValue(e.target.value)}
                                onBlur={() => handleUpdate(s.id)}
                                placeholder="Value"
                              />
                              <select
                                className="select select-bordered select-xs flex-shrink-0 w-16"
                                value={editPressureUnit}
                                onChange={(e) => {
                                  setEditPressureUnit(e.target.value);
                                  handleUpdate(s.id);
                                }}
                              >
                                <option value="bar">bar</option>
                                <option value="psi">PSI</option>
                              </select>
                            </div>
                          </div>
                          {lines.length > 0 && (
                            <div className="form-control">
                              <label className="label py-0 min-h-0">
                                <span className="label-text text-xs">Line</span>
                              </label>
                              <select
                                className="select select-bordered select-xs w-full"
                                value={editLineId}
                                onChange={(e) => {
                                  setEditLineId(e.target.value);
                                  const updated = spools.map((sp) =>
                                    sp.id === s.id ? { ...sp, lineId: e.target.value || null } : sp
                                  );
                                  onSave?.(updated);
                                }}
                              >
                                <option value="">— No line —</option>
                                {lines.map((line) => (
                                  <option key={line.id} value={line.id}>
                                    {line.name || line.id}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="label-text text-xs font-medium">
                                Welds attached ({attachedWelds.length})
                              </span>
                              {appMode === "edition" && onAssignWeldToSpool && (
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-xs gap-0.5"
                                  onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setMenuPortal({ kind: "weld", spoolId: s.id, rect });
                                  }}
                                >
                                  + Add weld
                                </button>
                              )}
                            </div>
                            {attachedWelds.length === 0 ? (
                              <p className="text-xs text-base-content/50">None</p>
                            ) : (
                              <ul className="space-y-0.5">
                                {attachedWelds.map((w) => {
                                  const status = weldStatusByWeldId?.get(w.id);
                                  const statusLabel =
                                    status === "complete"
                                      ? "Complete"
                                      : status === "incomplete"
                                        ? "Incomplete"
                                        : "Not started";
                                  const statusClass =
                                    status === "complete"
                                      ? "text-success"
                                      : status === "incomplete"
                                        ? "text-warning"
                                        : "text-base-content/60";
                                  return (
                                    <li
                                      key={w.id}
                                      className="flex items-center justify-between gap-1 text-xs py-1 px-1.5 bg-base-200 rounded min-w-0"
                                    >
                                      <span className="truncate font-mono" title={getWeldName ? getWeldName(w, weldPoints) : w.id}>
                                        {getWeldName ? getWeldName(w, weldPoints) : w.id}
                                      </span>
                                      <span className="flex items-center gap-0.5 flex-shrink-0">
                                        <span className={statusClass}>{statusLabel}</span>
                                        {appMode === "edition" && onAssignWeldToSpool && (
                                          <button
                                            type="button"
                                            className="btn btn-ghost btn-xs text-error px-0.5 min-h-6"
                                            onClick={() => onAssignWeldToSpool(w.id, null)}
                                            aria-label="Remove from spool"
                                            title="Remove from spool"
                                          >
                                            ×
                                          </button>
                                        )}
                                      </span>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="label-text text-xs font-medium">
                                Parts attached ({partsOnSpool(s.id).length})
                              </span>
                              {appMode === "edition" && onAssignPartToSpool && (
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-xs gap-0.5"
                                  onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setMenuPortal({ kind: "part", spoolId: s.id, rect });
                                  }}
                                >
                                  + Add part
                                </button>
                              )}
                            </div>
                            {partsOnSpool(s.id).length === 0 ? (
                              <p className="text-xs text-base-content/50">None</p>
                            ) : (
                              <ul className="space-y-0.5">
                                {partsOnSpool(s.id)
                                  .slice()
                                  .sort(comparePartDisplayNumbers)
                                  .map((p) => (
                                    <li
                                      key={p.id}
                                      className="flex items-center justify-between gap-1 text-xs py-1 px-1.5 bg-base-200 rounded min-w-0"
                                    >
                                      <span className="truncate" title={`Part ${p.displayNumber} ${[p.partType, p.nps].filter(Boolean).join(" ")}`}>
                                        Part {p.displayNumber}
                                        {[p.partType, p.nps].filter(Boolean).length ? ` · ${[p.partType, p.nps].filter(Boolean).join(" ")}` : ""}
                                      </span>
                                      {appMode === "edition" && onAssignPartToSpool && (
                                        <button
                                          type="button"
                                          className="btn btn-ghost btn-xs text-error px-0.5 min-h-6"
                                          onClick={() => onAssignPartToSpool(p.id, null)}
                                          aria-label="Remove from spool"
                                          title="Remove from spool"
                                        >
                                          ×
                                        </button>
                                      )}
                                    </li>
                                  ))}
                              </ul>
                            )}
                          </div>
                          {appMode === "edition" && (
                            <div className="flex flex-wrap gap-1 pt-2 border-t border-base-300">
                              <button
                                type="button"
                                className="btn btn-error btn-outline btn-sm"
                                onClick={() => handleDelete(s.id)}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
    {renderPortalMenu()}
    </>
  );
}

export default SidePanelSpools;
