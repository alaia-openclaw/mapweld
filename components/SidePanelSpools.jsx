"use client";

import { useState } from "react";
import { createDefaultSpool } from "@/lib/defaults";

function SidePanelSpools({
  spools = [],
  isOpen,
  onToggle,
  onSave,
  spoolMarkers = [],
  appMode = "edition",
  weldPoints = [],
  weldStatusByWeldId,
  getWeldName,
}) {
  const [name, setName] = useState("");
  const [expandedSpoolId, setExpandedSpoolId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDimX, setEditDimX] = useState("");
  const [editDimY, setEditDimY] = useState("");
  const [editDimZ, setEditDimZ] = useState("");
  const [editWeight, setEditWeight] = useState("");
  const [editPressureValue, setEditPressureValue] = useState("");
  const [editPressureUnit, setEditPressureUnit] = useState("bar");

  function startEdit(s) {
    setEditingId(s.id);
    setEditName(s.name ?? "");
    setEditDimX(String(s.dimX ?? ""));
    setEditDimY(String(s.dimY ?? ""));
    setEditDimZ(String(s.dimZ ?? ""));
    setEditWeight(String(s.weight ?? ""));
    setEditPressureValue(String(s.pressureTestValue ?? ""));
    setEditPressureUnit(s.pressureTestUnit ?? "bar");
  }

  function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave?.([
      ...spools,
      createDefaultSpool({ name: name.trim() }),
    ]);
    setName("");
  }

  function handleUpdate(id) {
    const updated = spools.map((s) =>
      s.id === id
        ? {
            ...s,
            name: editName.trim() || s.name,
            dimX: editDimX.trim() || "",
            dimY: editDimY.trim() || "",
            dimZ: editDimZ.trim() || "",
            weight: editWeight.trim() || "",
            pressureTestValue: editPressureValue.trim() || "",
            pressureTestUnit: editPressureUnit,
          }
        : s
    );
    onSave?.(updated);
    setEditingId(null);
    setExpandedSpoolId(null);
  }

  function handleDelete(id) {
    if (confirm("Delete this spool? Its marker will be removed from the drawing.")) {
      onSave?.(spools.filter((s) => s.id !== id));
      setExpandedSpoolId((prev) => (prev === id ? null : prev));
      setEditingId((prev) => (prev === id ? null : prev));
    }
  }

  const weldsBySpoolId = weldPoints.reduce((acc, w) => {
    const sid = w.spoolId;
    if (!sid) return acc;
    if (!acc[sid]) acc[sid] = [];
    acc[sid].push(w);
    return acc;
  }, {});

  return (
    <div
      className={`flex-shrink-0 flex flex-col bg-base-200 border-l border-base-300 transition-all duration-300 ease-out overflow-hidden ${
        isOpen ? "min-w-80 w-full max-w-lg" : "w-10"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className={`flex-shrink-0 flex items-center justify-center gap-2 py-3 px-2 border-b border-base-300 bg-base-100 hover:bg-base-200 transition-colors ${
          isOpen ? "flex-row" : "flex-col min-h-24"
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

      {isOpen && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-0 py-2">
            <form onSubmit={handleAdd} className="flex gap-2 mb-3">
              <input
                type="text"
                className="input input-bordered input-sm flex-1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Spool name"
              />
              <button type="submit" className="btn btn-primary btn-sm">
                Add
              </button>
            </form>
            {spools.length === 0 ? (
              <div className="text-center py-6 text-base-content/60 text-sm">
                <p>No spools yet</p>
                <p className="mt-1">Add with the Add Spool tool on the drawing</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {spools.map((s) => {
                  const isExpanded = s.id === expandedSpoolId;
                  const isEditing = editingId === s.id;
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
                            d="M19 9l-7 7-7 7"
                          />
                        </svg>
                        {appMode === "edition" && !isEditing && (
                          <>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm btn-square"
                              onClick={() => startEdit(s)}
                              aria-label="Edit"
                            >
                              ✎
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm btn-square text-error"
                              onClick={() => handleDelete(s.id)}
                              aria-label="Delete"
                            >
                              ×
                            </button>
                          </>
                        )}
                      </div>
                      {isExpanded && (
                        <div className="border-t border-base-300 px-3 py-3 space-y-3">
                          {isEditing ? (
                            <>
                              <div className="form-control">
                                <label className="label py-0">
                                  <span className="label-text text-xs">Name</span>
                                </label>
                                <input
                                  type="text"
                                  className="input input-sm input-bordered"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  placeholder="Spool name"
                                />
                              </div>
                              <div className="form-control">
                                <label className="label py-0">
                                  <span className="label-text text-xs">Dimensions (mm)</span>
                                </label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    className="input input-sm input-bordered flex-1"
                                    value={editDimX}
                                    onChange={(e) => setEditDimX(e.target.value)}
                                    placeholder="X"
                                  />
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    className="input input-sm input-bordered flex-1"
                                    value={editDimY}
                                    onChange={(e) => setEditDimY(e.target.value)}
                                    placeholder="Y"
                                  />
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    className="input input-sm input-bordered flex-1"
                                    value={editDimZ}
                                    onChange={(e) => setEditDimZ(e.target.value)}
                                    placeholder="Z"
                                  />
                                </div>
                              </div>
                              <div className="form-control">
                                <label className="label py-0">
                                  <span className="label-text text-xs">Weight (kg)</span>
                                </label>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  className="input input-sm input-bordered"
                                  value={editWeight}
                                  onChange={(e) => setEditWeight(e.target.value)}
                                  placeholder="e.g. 125"
                                />
                              </div>
                              <div className="form-control">
                                <label className="label py-0">
                                  <span className="label-text text-xs">Pressure test</span>
                                </label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    className="input input-sm input-bordered flex-1"
                                    value={editPressureValue}
                                    onChange={(e) => setEditPressureValue(e.target.value)}
                                    placeholder="Value"
                                  />
                                  <select
                                    className="select select-bordered select-sm w-24"
                                    value={editPressureUnit}
                                    onChange={(e) => setEditPressureUnit(e.target.value)}
                                  >
                                    <option value="bar">bar</option>
                                    <option value="psi">PSI</option>
                                  </select>
                                </div>
                              </div>
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() => handleUpdate(s.id)}
                              >
                                Save
                              </button>
                            </>
                          ) : (
                            <>
                              <div className="grid grid-cols-3 gap-2 text-sm">
                                <div>
                                  <span className="text-base-content/60 text-xs">X (mm)</span>
                                  <p>{s.dimX || "—"}</p>
                                </div>
                                <div>
                                  <span className="text-base-content/60 text-xs">Y (mm)</span>
                                  <p>{s.dimY || "—"}</p>
                                </div>
                                <div>
                                  <span className="text-base-content/60 text-xs">Z (mm)</span>
                                  <p>{s.dimZ || "—"}</p>
                                </div>
                              </div>
                              <div>
                                <span className="text-base-content/60 text-xs">Weight (kg)</span>
                                <p>{s.weight || "—"}</p>
                              </div>
                              <div>
                                <span className="text-base-content/60 text-xs">Pressure test</span>
                                <p>
                                  {s.pressureTestValue
                                    ? `${s.pressureTestValue} ${s.pressureTestUnit || "bar"}`
                                    : "—"}
                                </p>
                              </div>
                              {appMode === "edition" && (
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => startEdit(s)}
                                >
                                  Edit details
                                </button>
                              )}
                              <div>
                                <span className="label-text text-xs font-medium">
                                  Welds attached ({attachedWelds.length})
                                </span>
                                {attachedWelds.length === 0 ? (
                                  <p className="text-sm text-base-content/60 mt-1">
                                    No welds assigned to this spool
                                  </p>
                                ) : (
                                  <ul className="mt-1 space-y-1">
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
                                          className="flex items-center justify-between text-sm py-1 px-2 bg-base-200 rounded"
                                        >
                                          <span className="font-mono">
                                            {getWeldName ? getWeldName(w, weldPoints) : w.id}
                                          </span>
                                          <span className={`text-xs ${statusClass}`}>
                                            {statusLabel}
                                          </span>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                )}
                              </div>
                            </>
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
  );
}

export default SidePanelSpools;
