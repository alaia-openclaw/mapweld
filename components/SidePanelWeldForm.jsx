"use client";

import { useState, useEffect } from "react";
import {
  WELD_TYPE_LABELS,
  WELD_LOCATION_LABELS,
  NDT_REQUIRED_OPTIONS,
  NDT_REQUIRED_LABELS,
  WELDING_PROCESSES,
  WELDING_PROCESS_LABELS,
} from "@/lib/constants";
import { createDefaultWeldingRecord } from "@/lib/defaults";
import { getWeldName } from "@/lib/weld-utils";

function SidePanelWeldForm({
  weldPoints = [],
  weld,
  selectedWeldId,
  isOpen,
  onToggle,
  onSelectWeld,
  onBackToList,
  onSave,
  onDelete,
  appMode = "edition",
  spools = [],
  personnel = { fitters: [], welders: [] },
  ndtAutoLabel,
}) {
  const [weldType, setWeldType] = useState("butt");
  const [weldLocation, setWeldLocation] = useState("shop");
  const [wps, setWps] = useState("");
  const [fitterName, setFitterName] = useState("");
  const [dateFitUp, setDateFitUp] = useState("");
  const [heatNumber1, setHeatNumber1] = useState("");
  const [heatNumber2, setHeatNumber2] = useState("");
  const [welderName, setWelderName] = useState("");
  const [ndtRequired, setNdtRequired] = useState(NDT_REQUIRED_OPTIONS.AUTO);
  const [visualInspection, setVisualInspection] = useState(false);
  const [spoolId, setSpoolId] = useState("");
  const [weldingRecords, setWeldingRecords] = useState([]);
  const [openSections, setOpenSections] = useState({ general: true, fitup: false, welding: false, inspection: false });

  function toggleSection(key) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  useEffect(() => {
    if (weld) {
      setWeldType(weld.weldType || "butt");
      setWeldLocation(weld.weldLocation || "shop");
      setWps(weld.wps || "");
      setFitterName(weld.fitterName || "");
      setDateFitUp(weld.dateFitUp || "");
      setHeatNumber1(weld.heatNumber1 || "");
      setHeatNumber2(weld.heatNumber2 || "");
      setWelderName(weld.welderName || "");
      setNdtRequired(weld.ndtRequired || NDT_REQUIRED_OPTIONS.AUTO);
      setVisualInspection(weld.visualInspection || false);
      setSpoolId(weld.spoolId || "");
      const records = Array.isArray(weld.weldingRecords) && weld.weldingRecords.length > 0
        ? weld.weldingRecords.map((r) => ({
            id: r.id || `wr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            welderIds: Array.isArray(r.welderIds) ? r.welderIds : [],
            weldingProcesses: Array.isArray(r.weldingProcesses) ? r.weldingProcesses : [],
            electrodeNumbers: Array.isArray(r.electrodeNumbers) && r.electrodeNumbers.length > 0 ? r.electrodeNumbers : [""],
            date: r.date ?? "",
          }))
        : [];
      setWeldingRecords(records.length > 0 ? records : []);
    }
  }, [weld]);

  function handleAddWeldingRecord() {
    setWeldingRecords((prev) => [
      ...prev,
      {
        id: `wr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        welderIds: [],
        weldingProcesses: [],
        electrodeNumbers: [""],
        date: "",
      },
    ]);
  }

  function handleUpdateWeldingRecord(index, updates) {
    setWeldingRecords((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  }

  function handleRemoveWeldingRecord(index) {
    setWeldingRecords((prev) => prev.filter((_, i) => i !== index));
  }

  function handleRecordElectrodeChange(recordIndex, electrodeIndex, value) {
    setWeldingRecords((prev) => {
      const next = [...prev];
      const arr = [...(next[recordIndex].electrodeNumbers || [""])];
      arr[electrodeIndex] = value;
      next[recordIndex] = { ...next[recordIndex], electrodeNumbers: arr };
      return next;
    });
  }

  function handleAddRecordElectrode(recordIndex) {
    setWeldingRecords((prev) => {
      const next = [...prev];
      const arr = [...(next[recordIndex].electrodeNumbers || [""]), ""];
      next[recordIndex] = { ...next[recordIndex], electrodeNumbers: arr };
      return next;
    });
  }

  function handleRemoveRecordElectrode(recordIndex, electrodeIndex) {
    setWeldingRecords((prev) => {
      const next = [...prev];
      const arr = next[recordIndex].electrodeNumbers || [""];
      if (arr.length <= 1) return prev;
      next[recordIndex] = {
        ...next[recordIndex],
        electrodeNumbers: arr.filter((_, i) => i !== electrodeIndex),
      };
      return next;
    });
  }

  function toggleRecordWelderId(recordIndex, welderId) {
    setWeldingRecords((prev) => {
      const next = [...prev];
      const ids = next[recordIndex].welderIds || [];
      const nextIds = ids.includes(welderId) ? ids.filter((x) => x !== welderId) : [...ids, welderId];
      next[recordIndex] = { ...next[recordIndex], welderIds: nextIds };
      return next;
    });
  }

  function toggleRecordWeldingProcess(recordIndex, proc) {
    setWeldingRecords((prev) => {
      const next = [...prev];
      const procs = next[recordIndex].weldingProcesses || [];
      const nextProcs = procs.includes(proc) ? procs.filter((x) => x !== proc) : [...procs, proc];
      next[recordIndex] = { ...next[recordIndex], weldingProcesses: nextProcs };
      return next;
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!weld) return;
    const recordsToSave = weldingRecords.map((r) => ({
      ...r,
      electrodeNumbers: (r.electrodeNumbers || [""]).filter((s) => s?.trim?.() !== "").length > 0
        ? (r.electrodeNumbers || [""]).filter((s) => s?.trim?.() !== "")
        : [""],
    }));
    onSave?.({
      ...weld,
      weldType,
      weldLocation,
      wps,
      fitterName,
      dateFitUp,
      heatNumber1,
      heatNumber2,
      welderName,
      weldingRecords: recordsToSave,
      ndtRequired,
      visualInspection,
      spoolId: spoolId || null,
    });
    onBackToList?.();
  }

  const expandedWeldId = weld?.id;

  return (
    <div
      className={`flex-shrink-0 flex flex-col bg-base-200 border-l border-base-300 transition-all duration-300 ease-out overflow-hidden ${
        isOpen ? "min-w-80 w-[28rem] flex-shrink-0" : "w-10"
      }`}
    >
      {/* Tab / header - when a weld is expanded, click collapses it; when in list, click collapses panel */}
      <button
        type="button"
        onClick={() => (expandedWeldId ? onBackToList?.() : onToggle?.())}
        className={`flex-shrink-0 flex items-center justify-center gap-2 py-3 px-2 border-b border-base-300 bg-base-100 hover:bg-base-200 transition-colors ${
          isOpen ? "flex-row" : "flex-col min-h-24"
        }`}
        title={
          expandedWeldId
            ? "Collapse expanded weld"
            : isOpen
              ? "Collapse weld panel"
              : "Expand weld panel"
        }
        aria-label={
          expandedWeldId
            ? "Collapse expanded weld"
            : isOpen
              ? "Collapse weld panel"
              : "Expand weld panel"
        }
      >
        <span
          className={`font-medium ${isOpen ? "text-base" : "text-xs -rotate-90 whitespace-nowrap"}`}
        >
          Welds
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

      {/* Panel content - scrollable list with accordion-style expandable weld details */}
      {isOpen && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 w-full min-w-0 overflow-y-auto overflow-x-hidden p-0 py-2">
            {weldPoints.length === 0 ? (
              <div className="text-center py-8 text-base-content/60 text-sm">
                <p>No welds yet</p>
                <p className="mt-1">Add welds with the Add tool</p>
              </div>
            ) : (
              <ul className="w-full min-w-full max-w-full bg-base-100 rounded-lg p-0 gap-0 list-none">
                {weldPoints.map((w) => {
                  const isExpanded = w.id === expandedWeldId;
                  return (
                    <li key={w.id} className="w-full min-w-full border-b border-base-200 last:border-b-0">
                      <button
                        type="button"
                        onClick={() =>
                          isExpanded
                            ? onBackToList?.()
                            : onSelectWeld?.(w)
                        }
                        className={`flex items-center justify-between gap-2 w-full text-left py-2 px-3 ${
                          w.id === selectedWeldId
                            ? "bg-primary/15 border-l-4 border-primary font-medium"
                            : ""
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="font-mono text-sm">
                            {getWeldName(w, weldPoints)}
                          </span>
                          {w.weldType && (
                            <span className="text-xs opacity-60">
                              {WELD_TYPE_LABELS[w.weldType] || w.weldType}
                            </span>
                          )}
                        </span>
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
                      </button>
                      {isExpanded && weld && w.id === weld.id && (
                        <div className="w-full min-w-full border-t border-base-200 bg-base-100 px-1 py-3">
                          <form onSubmit={handleSubmit} className="space-y-0">
                            {/* Vertical collapsible sections */}
                            {["general", "fitup", "welding", "inspection"].map((sectionKey) => (
                              <div key={sectionKey} className="w-full border border-base-300 rounded-none overflow-hidden first:rounded-t-lg last:rounded-b-lg border-b-0 last:border-b border-base-300">
                                <button
                                  type="button"
                                  onClick={() => toggleSection(sectionKey)}
                                  className="w-full flex justify-start items-center gap-2 px-2 py-2 bg-base-200 hover:bg-base-300 text-left font-medium capitalize"
                                >
                                  <span>{sectionKey}</span>
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className={`h-4 w-4 transition-transform ${openSections[sectionKey] ? "rotate-180" : ""}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                                {openSections[sectionKey] && (
                                  <div className="w-full px-2 py-2 border-t border-base-300 space-y-3">
                                    {sectionKey === "general" && (
                                      <>
                                        <div className="form-control">
                                          <label className="label" htmlFor="side-wps">
                                            <span className="label-text">WPS</span>
                                          </label>
                                          <input
                                            id="side-wps"
                                            type="text"
                                            className="input input-bordered input-sm"
                                            value={wps}
                                            onChange={(e) => setWps(e.target.value)}
                                            placeholder="e.g. WPS-001"
                                          />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                          <div className="form-control">
                                            <label className="label" htmlFor="side-weldType">
                                              <span className="label-text">Weld type</span>
                                            </label>
                                            <select
                                              id="side-weldType"
                                              className="select select-bordered select-sm"
                                              value={weldType}
                                              onChange={(e) => setWeldType(e.target.value)}
                                            >
                                              {Object.entries(WELD_TYPE_LABELS).map(([k, v]) => (
                                                <option key={k} value={k}>{v}</option>
                                              ))}
                                            </select>
                                          </div>
                                          <div className="form-control">
                                            <label className="label" htmlFor="side-weldLocation">
                                              <span className="label-text">Location</span>
                                            </label>
                                            <select
                                              id="side-weldLocation"
                                              className="select select-bordered select-sm"
                                              value={weldLocation}
                                              onChange={(e) => setWeldLocation(e.target.value)}
                                            >
                                              {Object.entries(WELD_LOCATION_LABELS).map(([k, v]) => (
                                                <option key={k} value={k}>{v}</option>
                                              ))}
                                            </select>
                                          </div>
                                        </div>
                                      </>
                                    )}
                                    {sectionKey === "fitup" && (
                              <div className="space-y-3">
                                <div className="form-control">
                                  <label className="label" htmlFor="side-fitterName">
                                    <span className="label-text">Fitter</span>
                                  </label>
                                  {personnel?.fitters?.length > 0 ? (
                                    <select
                                      id="side-fitterName"
                                      className="select select-bordered select-sm"
                                      value={fitterName}
                                      onChange={(e) => setFitterName(e.target.value)}
                                    >
                                      <option value="">Select fitter</option>
                                      {personnel.fitters.map((f) => (
                                        <option key={f.id} value={f.name}>{f.name}</option>
                                      ))}
                                    </select>
                                  ) : (
                                    <input
                                      id="side-fitterName"
                                      type="text"
                                      className="input input-bordered input-sm"
                                      value={fitterName}
                                      onChange={(e) => setFitterName(e.target.value)}
                                      placeholder="e.g. Jane S."
                                    />
                                  )}
                                </div>
                                <div className="form-control">
                                  <label className="label" htmlFor="side-dateFitUp">
                                    <span className="label-text">Date fit-up</span>
                                  </label>
                                  <input
                                    id="side-dateFitUp"
                                    type="date"
                                    className="input input-bordered input-sm"
                                    value={dateFitUp}
                                    onChange={(e) => setDateFitUp(e.target.value)}
                                  />
                                </div>
                                <div className="form-control">
                                  <label className="label" htmlFor="side-heatNumber1">
                                    <span className="label-text">Heat number (part 1)</span>
                                  </label>
                                  <input
                                    id="side-heatNumber1"
                                    type="text"
                                    className="input input-bordered input-sm"
                                    value={heatNumber1}
                                    onChange={(e) => setHeatNumber1(e.target.value)}
                                    placeholder="e.g. H12345"
                                  />
                                </div>
                                <div className="form-control">
                                  <label className="label" htmlFor="side-heatNumber2">
                                    <span className="label-text">Heat number (part 2)</span>
                                  </label>
                                  <input
                                    id="side-heatNumber2"
                                    type="text"
                                    className="input input-bordered input-sm"
                                    value={heatNumber2}
                                    onChange={(e) => setHeatNumber2(e.target.value)}
                                    placeholder="e.g. H12346"
                                  />
                                </div>
                              </div>
                            )}

                            {sectionKey === "welding" && (
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="label-text font-medium">Welding records</span>
                                  <button
                                    type="button"
                                    className="btn btn-ghost btn-sm gap-1"
                                    onClick={handleAddWeldingRecord}
                                  >
                                    + Add
                                  </button>
                                </div>
                                {weldingRecords.length === 0 ? (
                                  <p className="text-sm text-base-content/60">No records. Add to log root pass, capping, etc.</p>
                                ) : (
                                  <div className="space-y-3">
                                    {weldingRecords.map((rec, idx) => (
                                      <div key={rec.id} className="p-2 bg-base-200 rounded-lg space-y-2">
                                        <div className="flex justify-between items-center">
                                          <span className="text-xs font-medium text-base-content/70">Record {idx + 1}</span>
                                          {weldingRecords.length > 1 && (
                                            <button
                                              type="button"
                                              className="btn btn-ghost btn-xs text-error"
                                              onClick={() => handleRemoveWeldingRecord(idx)}
                                              aria-label="Remove record"
                                            >
                                              ×
                                            </button>
                                          )}
                                        </div>
                                        <div className="form-control">
                                          <label className="label py-0"><span className="label-text text-xs">Welder(s)</span></label>
                                          {personnel?.welders?.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                              {personnel.welders.map((welder) => (
                                                <label key={welder.id} className="label cursor-pointer gap-1 py-0">
                                                  <input
                                                    type="checkbox"
                                                    className="checkbox checkbox-xs"
                                                    checked={(rec.welderIds || []).includes(welder.id)}
                                                    onChange={() => toggleRecordWelderId(idx, welder.id)}
                                                  />
                                                  <span className="label-text text-xs">{welder.name}</span>
                                                </label>
                                              ))}
                                            </div>
                                          ) : (
                                            <input
                                              type="text"
                                              className="input input-bordered input-xs"
                                              placeholder="Welder name"
                                              readOnly
                                            />
                                          )}
                                        </div>
                                        <div className="form-control">
                                          <label className="label py-0" htmlFor={`side-process-${rec.id}`}>
                                            <span className="label-text text-xs">Process</span>
                                          </label>
                                          <select
                                            id={`side-process-${rec.id}`}
                                            className="select select-bordered select-xs w-full"
                                            value={(rec.weldingProcesses || [])[0] || ""}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              handleUpdateWeldingRecord(idx, {
                                                weldingProcesses: val ? [val] : [],
                                              });
                                            }}
                                          >
                                            <option value="">Select process</option>
                                            {WELDING_PROCESSES.map((proc) => (
                                              <option key={proc} value={proc}>
                                                {WELDING_PROCESS_LABELS[proc] || proc}
                                              </option>
                                            ))}
                                          </select>
                                        </div>
                                        <div className="form-control">
                                          <label className="label py-0"><span className="label-text text-xs">Electrode ref</span></label>
                                          <div className="space-y-1">
                                            {(rec.electrodeNumbers || [""]).map((val, i) => (
                                              <div key={i} className="flex gap-1">
                                                <input
                                                  type="text"
                                                  className="input input-bordered input-xs flex-1"
                                                  value={val}
                                                  onChange={(e) => handleRecordElectrodeChange(idx, i, e.target.value)}
                                                  placeholder="e.g. E7018"
                                                />
                                                {(rec.electrodeNumbers || [""]).length > 1 ? (
                                                  <button
                                                    type="button"
                                                    className="btn btn-ghost btn-xs btn-square"
                                                    onClick={() => handleRemoveRecordElectrode(idx, i)}
                                                    aria-label="Remove"
                                                  >
                                                    ×
                                                  </button>
                                                ) : null}
                                              </div>
                                            ))}
                                            <button
                                              type="button"
                                              className="btn btn-ghost btn-xs gap-0"
                                              onClick={() => handleAddRecordElectrode(idx)}
                                            >
                                              + Add
                                            </button>
                                          </div>
                                        </div>
                                        <div className="form-control">
                                          <label className="label py-0"><span className="label-text text-xs">Date</span></label>
                                          <input
                                            type="date"
                                            className="input input-bordered input-xs"
                                            value={rec.date || ""}
                                            onChange={(e) => handleUpdateWeldingRecord(idx, { date: e.target.value })}
                                          />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {sectionKey === "inspection" && (
                              <div className="space-y-3">
                                <div className="form-control">
                                  <label className="label" htmlFor="side-ndtRequired">
                                    <span className="label-text">NDT</span>
                                  </label>
                                  <select
                                    id="side-ndtRequired"
                                    className="select select-bordered select-sm"
                                    value={ndtRequired}
                                    onChange={(e) => setNdtRequired(e.target.value)}
                                  >
                                    {Object.entries(NDT_REQUIRED_LABELS).map(([k, v]) => (
                                      <option key={k} value={k}>
                                        {k === "auto" && ndtAutoLabel ? `${v} (${ndtAutoLabel})` : v}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="form-control">
                                  <label className="label cursor-pointer justify-start gap-2 py-2">
                                    <input
                                      type="checkbox"
                                      className="checkbox checkbox-sm"
                                      checked={visualInspection}
                                      onChange={(e) => setVisualInspection(e.target.checked)}
                                    />
                                    <span className="label-text">Visual</span>
                                  </label>
                                </div>
                                {spools.length > 0 && (
                                  <div className="form-control">
                                    <label className="label" htmlFor="side-spoolId">
                                      <span className="label-text">Spool</span>
                                    </label>
                                    <select
                                      id="side-spoolId"
                                      className="select select-bordered select-sm"
                                      value={spoolId}
                                      onChange={(e) => setSpoolId(e.target.value)}
                                    >
                                      <option value="">None</option>
                                      {spools.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                              </div>
                            ))}
                            {/* end sections map */}
                            <div className="flex flex-wrap gap-2 mt-4">
                              {onDelete && appMode === "edition" && (
                                <button
                                  type="button"
                                  className="btn btn-error btn-outline btn-sm"
                                  onClick={() => {
                                    if (confirm("Delete this weld point?")) {
                                      onDelete?.(weld);
                                      onBackToList?.();
                                    }
                                  }}
                                >
                                  Delete
                                </button>
                              )}
                              <div className="flex-1" />
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={onBackToList}
                                title="Collapse (or click weld again)"
                              >
                                Cancel
                              </button>
                              <button type="submit" className="btn btn-primary btn-sm">
                                Save
                              </button>
                            </div>
                          </form>
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

export default SidePanelWeldForm;
