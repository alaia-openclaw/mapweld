"use client";

import { useState, useEffect, useRef } from "react";
import { PART_TYPES, PART_TYPE_LABELS } from "@/lib/constants";

function SidePanelPartForm({
  parts = [],
  partMarkers = [],
  spools = [],
  selectedPartMarkerId,
  isOpen,
  onToggle,
  onSelectPartMarker,
  onSavePart,
  onDeletePart,
  appMode = "edition",
  isStacked = false,
}) {
  const selectedMarker = partMarkers.find((m) => m.id === selectedPartMarkerId);
  const selectedPart = selectedMarker
    ? parts.find((p) => p.id === selectedMarker.partId)
    : null;

  const [partType, setPartType] = useState("");
  const [nps, setNps] = useState("");
  const [thickness, setThickness] = useState("");
  const [materialGrade, setMaterialGrade] = useState("");
  const [length, setLength] = useState("");
  const [spoolId, setSpoolId] = useState("");
  const [heatNumber, setHeatNumber] = useState("");
  const [showReconcile, setShowReconcile] = useState(false);
  const autoSaveTimeoutRef = useRef(null);

  useEffect(() => {
    if (selectedPart) {
      setPartType(selectedPart.partType ?? "");
      setNps(selectedPart.nps ?? "");
      setThickness(selectedPart.thickness ?? "");
      setMaterialGrade(selectedPart.materialGrade ?? "");
      setLength(selectedPart.length ?? "");
      setSpoolId(selectedPart.spoolId ?? "");
      setHeatNumber(selectedPart.heatNumber ?? "");
    }
  }, [selectedPart]);

  useEffect(() => {
    if (!selectedPart) return;
    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    autoSaveTimeoutRef.current = setTimeout(() => {
      onSavePart?.({
        ...selectedPart,
        partType: partType.trim(),
        nps: nps.trim(),
        thickness: thickness.trim(),
        materialGrade: materialGrade.trim(),
        length: length.trim(),
        spoolId: spoolId || null,
        heatNumber: heatNumber.trim(),
      });
    }, 400);
    return () => {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    };
  }, [
    selectedPart,
    partType,
    nps,
    thickness,
    materialGrade,
    length,
    spoolId,
    heatNumber,
    onSavePart,
  ]);

  function getSpoolName(id) {
    const s = spools.find((sp) => sp.id === id);
    return s?.name ?? "";
  }

  function handleDelete() {
    if (!selectedPart) return;
    if (confirm("Delete this part? Its marker will be removed from the drawing.")) {
      onDeletePart?.(selectedPart.id);
      onSelectPartMarker?.(null);
    }
  }

  const partTypeOptions = Object.entries(PART_TYPE_LABELS).map(([value, label]) => (
    <option key={value} value={value}>
      {label}
    </option>
  ));

  return (
    <div
      className={`flex-shrink-0 flex flex-col bg-base-200 border-l border-base-300 transition-all duration-300 ease-out overflow-hidden ${
        isOpen ? "min-w-80 w-full max-w-lg min-h-0 max-h-full self-stretch" : "w-10"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className={`flex-shrink-0 flex items-center justify-center gap-2 py-3 px-2 border-b border-base-300 bg-base-100 hover:bg-base-200 transition-colors ${
          isOpen ? "flex-row" : `flex-col ${isStacked ? "min-h-12" : "min-h-24"}`
        }`}
        title={isOpen ? "Collapse parts panel" : "Expand parts panel"}
        aria-label={isOpen ? "Collapse parts panel" : "Expand parts panel"}
      >
        <span
          className={`font-medium ${isOpen ? "text-base" : "text-xs -rotate-90 whitespace-nowrap"}`}
        >
          Parts
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
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden w-full">
          <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden p-3 space-y-3 pb-6">
            {parts.length === 0 ? (
              <div className="text-center py-6 text-base-content/60 text-sm">
                <p>No parts yet</p>
                <p className="mt-1">Add with the Add Part tool on the drawing</p>
              </div>
            ) : showReconcile ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 flex-shrink-0">
                  <span className="font-medium text-sm">Heat reconciliation</span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setShowReconcile(false)}
                  >
                    Parts list
                  </button>
                </div>
                <p className="text-xs text-base-content/60">
                  Assign heat numbers to parts. Same heat can be used for multiple parts (e.g. same pipe cut to length).
                </p>
                <div className="space-y-2">
                  {parts
                    .slice()
                    .sort((a, b) => (a.displayNumber ?? 0) - (b.displayNumber ?? 0))
                    .map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-2 p-2 rounded-lg bg-base-100 border border-base-300"
                      >
                        <span className="font-medium w-14 shrink-0">Part {p.displayNumber}</span>
                        <span className="text-xs text-base-content/60 truncate flex-1 min-w-0">
                          {[p.partType, p.nps, p.spoolId ? getSpoolName(p.spoolId) : null].filter(Boolean).join(" · ") || "—"}
                        </span>
                        <input
                          type="text"
                          className="input input-bordered input-sm w-28 shrink-0"
                          placeholder="Heat"
                          value={p.heatNumber ?? ""}
                          onChange={(e) => {
                            const v = e.target.value.trim();
                            onSavePart?.({ ...p, heatNumber: v });
                          }}
                        />
                      </div>
                    ))}
                </div>
              </div>
            ) : selectedPart ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">Part {selectedPart.displayNumber}</span>
                  {appMode === "edition" && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm text-error"
                      onClick={handleDelete}
                    >
                      Delete
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="form-control">
                    <label className="label" htmlFor="part-type">
                      <span className="label-text">Part type</span>
                    </label>
                    <select
                      id="part-type"
                      className="select select-bordered select-sm w-full"
                      value={partType}
                      onChange={(e) => setPartType(e.target.value)}
                    >
                      <option value="">—</option>
                      {partTypeOptions}
                    </select>
                  </div>
                  <div className="form-control">
                    <label className="label" htmlFor="part-nps">
                      <span className="label-text">NPS</span>
                    </label>
                    <input
                      id="part-nps"
                      type="text"
                      className="input input-bordered input-sm"
                      value={nps}
                      onChange={(e) => setNps(e.target.value)}
                      placeholder="e.g. 2, 4, 6"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label" htmlFor="part-thickness">
                      <span className="label-text">Thickness</span>
                    </label>
                    <input
                      id="part-thickness"
                      type="text"
                      className="input input-bordered input-sm"
                      value={thickness}
                      onChange={(e) => setThickness(e.target.value)}
                      placeholder="e.g. SCH 40"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label" htmlFor="part-material">
                      <span className="label-text">Material grade</span>
                    </label>
                    <input
                      id="part-material"
                      type="text"
                      className="input input-bordered input-sm"
                      value={materialGrade}
                      onChange={(e) => setMaterialGrade(e.target.value)}
                      placeholder="e.g. A106 Gr.B"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label" htmlFor="part-length">
                      <span className="label-text">Length (optional)</span>
                    </label>
                    <input
                      id="part-length"
                      type="text"
                      className="input input-bordered input-sm"
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                      placeholder="e.g. 500 mm"
                    />
                  </div>
                  {spools.length > 0 && (
                    <div className="form-control">
                      <label className="label" htmlFor="part-spool">
                        <span className="label-text">Spool</span>
                      </label>
                      <select
                        id="part-spool"
                        className="select select-bordered select-sm w-full"
                        value={spoolId}
                        onChange={(e) => setSpoolId(e.target.value)}
                      >
                        <option value="">—</option>
                        {spools.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name || s.id}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="form-control">
                    <label className="label" htmlFor="part-heatNumber">
                      <span className="label-text">Heat number</span>
                    </label>
                    <input
                      id="part-heatNumber"
                      type="text"
                      className="input input-bordered input-sm"
                      value={heatNumber}
                      onChange={(e) => setHeatNumber(e.target.value)}
                      placeholder="e.g. H12345"
                    />
                  </div>
                </div>
              </>
            ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm w-full gap-1"
                    onClick={() => {
                      setShowReconcile(true);
                      onSelectPartMarker?.(null);
                    }}
                  >
                    Heat reconciliation
                  </button>
                  <ul className="space-y-2">
                    {parts
                      .slice()
                      .sort((a, b) => (a.displayNumber ?? 0) - (b.displayNumber ?? 0))
                      .map((p) => {
                        const marker = partMarkers.find((m) => m.partId === p.id);
                        const spoolName = p.spoolId ? getSpoolName(p.spoolId) : null;
                        return (
                          <li key={p.id}>
                            <button
                              type="button"
                              className="w-full text-left p-2 rounded-lg bg-base-100 border border-base-300 hover:bg-base-200 flex items-center justify-between gap-2"
                              onClick={() => marker && onSelectPartMarker?.(marker.id)}
                            >
                              <span className="font-medium">Part {p.displayNumber}</span>
                              <span className="text-xs text-base-content/60 truncate max-w-[100px]">
                                {spoolName || (p.heatNumber ? `Heat: ${p.heatNumber}` : "") || "—"}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                  </ul>
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SidePanelPartForm;
