"use client";

import { useState, useEffect, useRef } from "react";
import {
  WELD_TYPE_LABELS,
  WELD_LOCATION_LABELS,
  NDT_REQUIRED_OPTIONS,
  NDT_REQUIRED_LABELS,
  NDT_METHODS,
  NDT_METHOD_LABELS,
  NDT_OVERRIDE_OPTIONS,
  NDT_OVERRIDE_LABELS,
  NDT_RESULT_OUTCOME_LABELS,
  WELDING_PROCESSES,
  WELDING_PROCESS_LABELS,
} from "@/lib/constants";
import { createDefaultWeldingRecord } from "@/lib/defaults";
import { getWeldName, getWeldOverallStatus, getWeldSectionCompletion, computeNdtSelection, getNdtSelectionWarnings } from "@/lib/weld-utils";

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
  drawingSettings = { ndtRequirements: [] },
  weldStatusByWeldId,
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
  const [ndtOverrides, setNdtOverrides] = useState({});
  const [ndtResults, setNdtResults] = useState({});
  const [ndtResultOutcome, setNdtResultOutcome] = useState({});
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
            welderName: r.welderName ?? "",
            weldingProcesses: Array.isArray(r.weldingProcesses) ? r.weldingProcesses : [],
            electrodeNumbers: Array.isArray(r.electrodeNumbers) && r.electrodeNumbers.length > 0 ? r.electrodeNumbers : [""],
            date: r.date ?? "",
          }))
        : [];
      setWeldingRecords(records.length > 0 ? records : []);
      setNdtOverrides(weld.ndtOverrides || {});
      setNdtResults(weld.ndtResults || {});
      setNdtResultOutcome(weld.ndtResultOutcome || {});
    }
  }, [weld]);

  const autoSaveTimeoutRef = useRef(null);
  useEffect(() => {
    if (!weld) return;
    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    autoSaveTimeoutRef.current = setTimeout(() => {
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
        ndtOverrides,
        ndtResults,
        ndtResultOutcome,
        spoolId: spoolId || null,
      });
    }, 600);
    return () => {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    };
  }, [
    weld,
    weldType,
    weldLocation,
    wps,
    fitterName,
    dateFitUp,
    heatNumber1,
    heatNumber2,
    welderName,
    weldingRecords,
    ndtRequired,
    visualInspection,
    ndtOverrides,
    ndtResults,
    ndtResultOutcome,
    spoolId,
    onSave,
  ]);

  function handleAddWeldingRecord(initialData = {}) {
    setWeldingRecords((prev) => [
      ...prev,
      {
        id: `wr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        welderIds: [],
        welderName: "",
        weldingProcesses: [],
        electrodeNumbers: [""],
        date: "",
        ...initialData,
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
      ndtOverrides,
      ndtResults,
      ndtResultOutcome,
      spoolId: spoolId || null,
    });
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
                  const listStatus = weldStatusByWeldId?.get(w.id);
                  const statusBorder =
                    w.id === selectedWeldId
                      ? "border-primary"
                      : listStatus === "complete"
                        ? "border-success"
                        : listStatus === "incomplete"
                          ? "border-warning"
                          : "border-error";
                  return (
                    <li key={w.id} className="w-full min-w-full border-b border-base-200 last:border-b-0">
                      <button
                        type="button"
                        onClick={() =>
                          isExpanded
                            ? onBackToList?.()
                            : onSelectWeld?.(w)
                        }
                        className={`flex items-center justify-between gap-2 w-full text-left py-2 px-3 border-l-4 ${statusBorder} ${
                          w.id === selectedWeldId ? "bg-primary/15 font-medium" : ""
                        }`}
                      >
                        <span className="flex flex-col items-start gap-0.5 min-w-0">
                          <span className="font-mono text-sm flex items-center gap-1.5">
                            {getWeldName(w, weldPoints)}
                            {w.spoolId && (() => {
                              const spool = spools.find((s) => s.id === w.spoolId);
                              return spool?.name ? (
                                <span className="text-xs text-base-content/50 font-normal">
                                  {spool.name}
                                </span>
                              ) : null;
                            })()}
                          </span>
                          <span className="text-xs opacity-70 truncate max-w-full">
                            {(() => {
                              const ndtSel = computeNdtSelection(w, drawingSettings, weldPoints);
                              const section = getWeldSectionCompletion(w, ndtSel);
                              const missing = [];
                              if (!section.general) missing.push("General");
                              if (!section.fitup) missing.push("Fitup");
                              if (!section.welding) missing.push("Welding");
                              if (!section.inspection) missing.push("Inspection");
                              return missing.length > 0 ? `Missing: ${missing.join(", ")}` : "—";
                            })()}
                          </span>
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
                            {(() => {
                              const virtualWeld = {
                                id: weld?.id,
                                weldLocation: weld?.weldLocation,
                                wps,
                                fitterName,
                                dateFitUp,
                                heatNumber1,
                                heatNumber2,
                                weldingRecords,
                                ndtRequired,
                                visualInspection,
                                ndtOverrides,
                                ndtResults,
                                ndtResultOutcome,
                              };
                              const ndtSel = computeNdtSelection(virtualWeld, drawingSettings, weldPoints);
                              const sectionComplete = getWeldSectionCompletion(virtualWeld, ndtSel);
                              return ["general", "fitup", "welding", "inspection"].map((sectionKey) => (
                              <div key={sectionKey} className="w-full border border-base-300 rounded-none overflow-hidden first:rounded-t-lg last:rounded-b-lg border-b-0 last:border-b border-base-300">
                                <button
                                  type="button"
                                  onClick={() => toggleSection(sectionKey)}
                                  className={`w-full flex justify-start items-center gap-2 px-2 py-2 text-left font-medium capitalize border-l-4 ${
                                    sectionComplete[sectionKey]
                                      ? "bg-success/15 border-success hover:bg-success/25"
                                      : "bg-warning/15 border-warning hover:bg-warning/25"
                                  }`}
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
                                  <div className="p-2 bg-base-200 rounded-lg">
                                    <p className="text-sm text-base-content/60">Click + Add to add a welding record.</p>
                                  </div>
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
                                          <label className="label py-0" htmlFor={`side-welder-${rec.id}`}>
                                            <span className="label-text text-xs">Welder(s)</span>
                                          </label>
                                          <input
                                            id={`side-welder-${rec.id}`}
                                            type="text"
                                            className="input input-bordered input-xs w-full"
                                            placeholder={personnel?.welders?.length ? "Or type custom name" : "Welder name"}
                                            value={rec.welderName ?? ""}
                                            onChange={(e) => handleUpdateWeldingRecord(idx, { welderName: e.target.value })}
                                            autoComplete="off"
                                          />
                                          {personnel?.welders?.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1">
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
                                    <span className="label-text">NDT (global)</span>
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
                                    <span className="label-text">Visual inspection (VT)</span>
                                  </label>
                                </div>
                                <div className="overflow-x-auto">
                                  <table className="table table-xs">
                                    <thead>
                                      <tr>
                                        <th>NDT</th>
                                        <th>Override</th>
                                        <th>Required</th>
                                        <th>Done</th>
                                        <th>Result</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {NDT_METHODS.map((m) => {
                                        const virtualW = {
                                          id: weld?.id,
                                          weldLocation: weld?.weldLocation,
                                          ndtRequired,
                                          visualInspection,
                                          ndtOverrides,
                                        };
                                        const sel = computeNdtSelection(virtualW, drawingSettings, weldPoints);
                                        const isRequired = !!sel[m];
                                        const overrideVal = ndtOverrides[m] ?? NDT_OVERRIDE_OPTIONS.AUTO;
                                        const outcome = ndtResultOutcome[m];
                                        return (
                                          <tr key={m}>
                                            <td className="font-medium">{NDT_METHOD_LABELS[m] || m}</td>
                                            <td>
                                              <select
                                                className="select select-bordered select-xs w-full max-w-[7rem]"
                                                value={overrideVal}
                                                onChange={(e) => {
                                                  const v = e.target.value;
                                                  setNdtOverrides((prev) => {
                                                    const next = { ...prev };
                                                    if (v === NDT_OVERRIDE_OPTIONS.AUTO) delete next[m];
                                                    else next[m] = v;
                                                    return next;
                                                  });
                                                }}
                                              >
                                                <option value={NDT_OVERRIDE_OPTIONS.AUTO}>Auto</option>
                                                <option value={NDT_OVERRIDE_OPTIONS.REQUIRED}>Required</option>
                                                <option value={NDT_OVERRIDE_OPTIONS.EXEMPT}>Excluded</option>
                                              </select>
                                            </td>
                                            <td className="text-sm">{isRequired ? "Yes" : "No"}</td>
                                            <td>
                                              <input
                                                type="checkbox"
                                                className="checkbox checkbox-sm"
                                                checked={!!ndtResults[m]}
                                                onChange={(e) => {
                                                  setNdtResults((prev) => ({
                                                    ...prev,
                                                    [m]: e.target.checked ? "ok" : undefined,
                                                  }));
                                                }}
                                                disabled={!isRequired}
                                                title={!isRequired ? "Not required" : "Mark as done"}
                                              />
                                            </td>
                                            <td className="text-sm">
                                              {outcome ? (
                                                <span className={outcome === "rejected" || outcome === "reject" ? "text-error font-medium" : outcome === "omitted_or_inconclusive" || outcome === "repair" ? "text-warning font-medium" : ""}>
                                                  {NDT_RESULT_OUTCOME_LABELS[outcome] ?? outcome}
                                                </span>
                                              ) : (
                                                "—"
                                              )}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                  {(() => {
                                    const allWarnings = NDT_METHODS.flatMap((m) =>
                                      getNdtSelectionWarnings(weldPoints, drawingSettings, m)
                                    );
                                    if (allWarnings.length === 0) return null;
                                    return (
                                      <div className="mt-2 p-2 bg-warning/10 border border-warning/30 rounded text-xs">
                                        {allWarnings.map((msg, i) => (
                                          <div key={i}>{msg}</div>
                                        ))}
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                              </div>
                            )); })()}
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
                                Close
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
