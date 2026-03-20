"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  WELD_TYPE_LABELS,
  WELD_LOCATION_LABELS,
  NDT_REQUIRED_OPTIONS,
  NDT_REQUIRED_LABELS,
  NDT_METHODS,
  NDT_METHOD_LABELS,
  NDT_OVERRIDE_OPTIONS,
  NDT_OVERRIDE_LABELS,
  NDT_RESULT_OUTCOMES,
  NDT_RESULT_OUTCOME_LABELS,
  WELDING_PROCESSES,
  WELDING_PROCESS_LABELS,
  sortNdtMethods,
} from "@/lib/constants";
import { getWeldName, getWeldSectionCompletion, computeNdtSelection } from "@/lib/weld-utils";
import { useNdtScope } from "@/contexts/NdtScopeContext";
import { getInheritedWpsCode, getResolvedWpsCode, getWpsLibraryEntryById } from "@/lib/wps-resolution";
import { comparePartDisplayNumbers } from "@/lib/part-display-number";
import {
  createDefaultJointDimensions,
  normalizeJointDimensions,
  getEffectiveJointSide,
} from "@/lib/joint-dimensions";

function electrodeRefKey(s) {
  return (s || "").trim().toLowerCase();
}

/** Same batch / ref only once per record when loading or saving (first occurrence wins). */
function dedupeElectrodeNumbersInRecord(arr) {
  const raw = Array.isArray(arr) && arr.length > 0 ? arr : [""];
  const seen = new Set();
  const out = [];
  for (const x of raw) {
    const k = electrodeRefKey(x);
    if (k) {
      if (seen.has(k)) continue;
      seen.add(k);
    }
    out.push(typeof x === "string" ? x : "");
  }
  return out.length > 0 ? out : [""];
}

function normalizeElectrodeNumbersForSave(arr) {
  const deduped = dedupeElectrodeNumbersInRecord(arr || [""]);
  const nonEmpty = deduped.filter((s) => s?.trim?.() !== "");
  return nonEmpty.length > 0 ? nonEmpty : [""];
}

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
  /** All project parts (not only current page) so Part 1/2 can link joints across sheets/markers. */
  parts = [],
  onUpdatePartHeat,
  personnel = { fitters: [], welders: [] },
  wpsLibrary = [],
  electrodeLibrary = [],
  ndtAutoLabel,
  drawingSettings = { ndtRequirements: [] },
  weldStatusByWeldId,
  isStacked = false,
  hideHeader = false,
}) {
  const ndtContext = useNdtScope();
  const inheritedWpsCode = useMemo(() => {
    if (!weld || !ndtContext) return "";
    return getInheritedWpsCode(weld, ndtContext.systems, ndtContext.lines, ndtContext.spools);
  }, [weld, ndtContext]);
  const [weldType, setWeldType] = useState("butt");
  const [weldLocation, setWeldLocation] = useState("shop");
  const [wps, setWps] = useState("");
  /** Optional `wpsLibrary` row id — synced when picking a preset code (managed in Settings for PDF link). */
  const [linkedWpsEntryId, setLinkedWpsEntryId] = useState("");
  const [weldListSearch, setWeldListSearch] = useState("");
  const [weldListLocation, setWeldListLocation] = useState("all");
  const [weldListMissing, setWeldListMissing] = useState("all");
  const [fitterName, setFitterName] = useState("");
  const [dateFitUp, setDateFitUp] = useState("");
  const [heatNumber1, setHeatNumber1] = useState("");
  const [heatNumber2, setHeatNumber2] = useState("");
  const [partId1, setPartId1] = useState("");
  const [partId2, setPartId2] = useState("");
  const [jointDimensions, setJointDimensions] = useState(createDefaultJointDimensions);
  const [welderName, setWelderName] = useState("");
  const [ndtRequired, setNdtRequired] = useState(NDT_REQUIRED_OPTIONS.AUTO);
  const [visualInspection, setVisualInspection] = useState(false);
  const [spoolId, setSpoolId] = useState("");
  const [weldingRecords, setWeldingRecords] = useState([]);
  const [ndtOverrides, setNdtOverrides] = useState({});
  const [ndtResults, setNdtResults] = useState({});
  const [ndtResultOutcome, setNdtResultOutcome] = useState({});
  const [ndtResultManualOverride, setNdtResultManualOverride] = useState({});
  const [ndtResultOverrideUnlocked, setNdtResultOverrideUnlocked] = useState(false);
  const [openSections, setOpenSections] = useState({ general: true, fitup: false, welding: false, inspection: false });
  const addWeldingRecordLastRef = useRef(0);

  const selectedPart1 = parts.find((p) => p.id === partId1) || null;
  const selectedPart2 = parts.find((p) => p.id === partId2) || null;
  const trimmedHeat1 = (heatNumber1 ?? "").trim();
  const trimmedHeat2 = (heatNumber2 ?? "").trim();
  const partHeat1 = (selectedPart1?.heatNumber ?? "").trim();
  const partHeat2 = (selectedPart2?.heatNumber ?? "").trim();
  const showSync1 = !!selectedPart1 && !!trimmedHeat1 && trimmedHeat1 !== partHeat1;
  const showSync2 = !!selectedPart2 && !!trimmedHeat2 && trimmedHeat2 !== partHeat2;

  const jointDimensionsNorm = useMemo(
    () => normalizeJointDimensions(jointDimensions),
    [jointDimensions]
  );
  const effectiveJoint1 = useMemo(
    () => getEffectiveJointSide({ jointDimensions: jointDimensionsNorm }, selectedPart1, 1),
    [jointDimensionsNorm, selectedPart1]
  );
  const effectiveJoint2 = useMemo(
    () => getEffectiveJointSide({ jointDimensions: jointDimensionsNorm }, selectedPart2, 2),
    [jointDimensionsNorm, selectedPart2]
  );

  function setJointSideField(side, field, value) {
    const key = side === 1 ? "side1" : "side2";
    setJointDimensions((prev) => {
      const n = normalizeJointDimensions(prev);
      return {
        ...n,
        [key]: { ...n[key], [field]: value },
      };
    });
  }

  function handlePart1Select(id) {
    const nextId = id || "";
    setPartId1(nextId);
    const p = parts.find((x) => x.id === nextId);
    if (p?.heatNumber) {
      setHeatNumber1((prev) => ((prev ?? "").trim() ? prev : p.heatNumber));
    }
    if (nextId) {
      setJointDimensions((prev) => {
        const n = normalizeJointDimensions(prev);
        return { ...n, side1: { nps: "", schedule: "" } };
      });
    }
  }

  function handlePart2Select(id) {
    const nextId = id || "";
    setPartId2(nextId);
    const p = parts.find((x) => x.id === nextId);
    if (p?.heatNumber) {
      setHeatNumber2((prev) => ((prev ?? "").trim() ? prev : p.heatNumber));
    }
    if (nextId) {
      setJointDimensions((prev) => {
        const n = normalizeJointDimensions(prev);
        return { ...n, side2: { nps: "", schedule: "" } };
      });
    }
  }

  const libraryWpsEntries = useMemo(
    () => (Array.isArray(wpsLibrary) ? wpsLibrary : []),
    [wpsLibrary]
  );
  const wpsPresetCodes = useMemo(
    () =>
      [...new Set(libraryWpsEntries.map((entry) => (entry?.code || "").trim()).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b)),
    [libraryWpsEntries]
  );

  const weldListSearchNorm = (weldListSearch || "").trim().toLowerCase();
  const filteredWeldPoints = useMemo(() => {
    return weldPoints.filter((w) => {
      if (weldListLocation === "shop" && (w.weldLocation || "shop") !== "shop") return false;
      if (weldListLocation === "field" && (w.weldLocation || "shop") !== "field") return false;
      if (weldListMissing === "incomplete") {
        const ndtSel = computeNdtSelection(w, drawingSettings, weldPoints, ndtContext);
        const section = getWeldSectionCompletion(w, ndtSel, ndtContext);
        const allDone =
          section.general && section.fitup && section.welding && section.inspection;
        if (allDone) return false;
      }
      if (!weldListSearchNorm) return true;
      const name = getWeldName(w, weldPoints).toLowerCase();
      const resolved =
        ndtContext != null &&
        Array.isArray(ndtContext.systems) &&
        Array.isArray(ndtContext.lines) &&
        Array.isArray(ndtContext.spools)
          ? getResolvedWpsCode(w, ndtContext.systems, ndtContext.lines, ndtContext.spools)
          : (w.wps || "").trim();
      const spool = spools.find((s) => s.id === w.spoolId);
      const hay = [name, resolved, spool?.name || "", w.id || ""].join(" ").toLowerCase();
      return hay.includes(weldListSearchNorm);
    });
  }, [
    weldPoints,
    weldListSearchNorm,
    weldListLocation,
    weldListMissing,
    drawingSettings,
    ndtContext,
    spools,
  ]);

  function syncLinkedWpsAfterCodeChange(nextCode) {
    if (!linkedWpsEntryId) return;
    const entry = getWpsLibraryEntryById(libraryWpsEntries, linkedWpsEntryId);
    const nextTrim = (nextCode || "").trim();
    if (!entry || (entry.code || "").trim() !== nextTrim) setLinkedWpsEntryId("");
  }

  function applyPresetWpsCode(code) {
    const v = (code || "").trim();
    setWps(v);
    const matches = libraryWpsEntries.filter((e) => (e.code || "").trim() === v);
    if (matches.length === 1) setLinkedWpsEntryId(matches[0].id);
    else setLinkedWpsEntryId("");
  }
  const fitterOptions = useMemo(
    () =>
      [...new Set((personnel?.fitters || []).map((fitter) => (fitter?.name || "").trim()).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b)),
    [personnel]
  );
  const electrodeOptions = useMemo(
    () =>
      [...new Set((electrodeLibrary || []).map((entry) => (entry?.code || "").trim()).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b)),
    [electrodeLibrary]
  );

  /** Library codes already chosen on other slots in this record (same slot can keep its current value). */
  function getUsedElectrodeKeysElsewhere(record, slotIndex) {
    const used = new Set();
    const nums = record.electrodeNumbers || [""];
    nums.forEach((v, j) => {
      if (j === slotIndex) return;
      const k = electrodeRefKey(v);
      if (k) used.add(k);
    });
    return used;
  }

  function getElectrodeLibraryChoicesForSlot(record, slotIndex) {
    const usedElsewhere = getUsedElectrodeKeysElsewhere(record, slotIndex);
    const currentKey = electrodeRefKey((record.electrodeNumbers || [""])[slotIndex]);
    return electrodeOptions.filter(
      (code) => !usedElsewhere.has(electrodeRefKey(code)) || electrodeRefKey(code) === currentKey
    );
  }

  const welderPresetEntries = useMemo(() => {
    const entries = [];
    const welders = personnel?.welders || [];
    const wqrs = personnel?.wqrs || [];
    welders.forEach((welder) => {
      const welderName = (welder?.name || "").trim();
      if (!welderName) return;
      const welderWqrs = (welder?.wqrIds || [])
        .map((wqrId) => wqrs.find((wqr) => wqr.id === wqrId))
        .filter(Boolean);
      if (welderWqrs.length === 0) {
        entries.push({ label: welderName, welderId: welder.id, welderName, wqrId: null });
        return;
      }
      welderWqrs.forEach((wqr) => {
        entries.push({
          label: `${welderName} | ${wqr.code}`,
          welderId: welder.id,
          welderName,
          wqrId: wqr.id,
        });
      });
    });
    return entries;
  }, [personnel]);
  const welderPresetByLabel = useMemo(
    () => new Map(welderPresetEntries.map((entry) => [entry.label, entry])),
    [welderPresetEntries]
  );
  const inspectionMethods = useMemo(
    () =>
      sortNdtMethods([
        ...NDT_METHODS,
        ...((drawingSettings?.ndtRequirements || []).map((row) => row.method)),
        ...Object.keys(ndtOverrides || {}),
        ...Object.keys(ndtResults || {}),
        ...Object.keys(ndtResultOutcome || {}),
      ]),
    [drawingSettings, ndtOverrides, ndtResults, ndtResultOutcome]
  );

  function toggleSection(key) {
    setOpenSections((prev) => {
      const nextOpen = !prev[key];
      if (nextOpen) {
        return { general: false, fitup: false, welding: false, inspection: false, [key]: true };
      }
      return { ...prev, [key]: false };
    });
  }

  const previousWeldIdRef = useRef(null);
  useEffect(() => {
    if (!weld) {
      previousWeldIdRef.current = null;
      return;
    }
    const isNewWeld = previousWeldIdRef.current !== weld.id;
    previousWeldIdRef.current = weld.id;
    if (!isNewWeld) return;
    setWeldType(weld.weldType || "butt");
    setWeldLocation(weld.weldLocation || "shop");
    setWps(weld.wps || "");
    setLinkedWpsEntryId(weld.wpsLibraryEntryId || "");
    setFitterName(weld.fitterName || "");
    setDateFitUp(weld.dateFitUp || "");
    setHeatNumber1(weld.heatNumber1 || "");
    setHeatNumber2(weld.heatNumber2 || "");
    setPartId1(weld.partId1 || "");
    setPartId2(weld.partId2 || "");
    setJointDimensions(normalizeJointDimensions(weld.jointDimensions));
    setWelderName(weld.welderName || "");
    setNdtRequired(weld.ndtRequired || NDT_REQUIRED_OPTIONS.AUTO);
    setVisualInspection(weld.visualInspection || false);
    setSpoolId(weld.spoolId || "");
    const records = Array.isArray(weld.weldingRecords) && weld.weldingRecords.length > 0
      ? weld.weldingRecords.map((r) => ({
          id: r.id || `wr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          welderIds: Array.isArray(r.welderIds) ? r.welderIds : [],
          wqrIds: Array.isArray(r.wqrIds) ? r.wqrIds : [],
          welderName: r.welderName ?? "",
          weldingProcesses: Array.isArray(r.weldingProcesses) ? r.weldingProcesses : [],
          electrodeNumbers: dedupeElectrodeNumbersInRecord(r.electrodeNumbers),
          date: r.date ?? "",
        }))
      : [];
    setWeldingRecords(records.length > 0 ? records : []);
    setNdtOverrides(weld.ndtOverrides || {});
    setNdtResults(weld.ndtResults || {});
    setNdtResultOutcome(weld.ndtResultOutcome || {});
    setNdtResultManualOverride(weld.ndtResultManualOverride || {});
    setNdtResultOverrideUnlocked(false);
  }, [weld]);

  useEffect(() => {
    if (!linkedWpsEntryId) return;
    if (libraryWpsEntries.some((e) => e.id === linkedWpsEntryId)) return;
    setLinkedWpsEntryId("");
  }, [libraryWpsEntries, linkedWpsEntryId]);

  const autoSaveTimeoutRef = useRef(null);
  useEffect(() => {
    if (!weld) return;
    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    autoSaveTimeoutRef.current = setTimeout(() => {
      const recordsToSave = weldingRecords.map((r) => ({
        ...r,
        electrodeNumbers: normalizeElectrodeNumbersForSave(r.electrodeNumbers),
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
        partId1: partId1 || null,
        partId2: partId2 || null,
        welderName,
        weldingRecords: recordsToSave,
        ndtRequired,
        visualInspection,
        ndtOverrides,
        ndtResults,
        ndtResultOutcome,
        ndtResultManualOverride: Object.keys(ndtResultManualOverride).length ? ndtResultManualOverride : undefined,
        spoolId: spoolId || null,
        wpsLibraryEntryId: linkedWpsEntryId || null,
        jointDimensions: normalizeJointDimensions(jointDimensions),
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
    partId1,
    partId2,
    welderName,
    weldingRecords,
    ndtRequired,
    visualInspection,
    ndtOverrides,
    ndtResults,
    ndtResultOutcome,
    ndtResultManualOverride,
    spoolId,
    linkedWpsEntryId,
    jointDimensions,
    onSave,
  ]);

  function handleAddWeldingRecord(initialData = {}) {
    const now = Date.now();
    if (now - addWeldingRecordLastRef.current < 400) return;
    addWeldingRecordLastRef.current = now;
    setWeldingRecords((prev) => [
      ...prev,
      {
        id: `wr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        welderIds: [],
        wqrIds: [],
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
      const rec = prev[recordIndex];
      if (!rec) return prev;
      const arr = [...(rec.electrodeNumbers || [""])];
      const newKey = electrodeRefKey(value);
      if (newKey) {
        const clash = arr.some((v, j) => j !== electrodeIndex && electrodeRefKey(v) === newKey);
        if (clash) return prev;
      }
      arr[electrodeIndex] = value;
      const next = [...prev];
      next[recordIndex] = { ...rec, electrodeNumbers: arr };
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

  function handleRecordWelderWqrInput(recordIndex, value) {
    const preset = welderPresetByLabel.get(value);
    if (preset) {
      handleUpdateWeldingRecord(recordIndex, {
        welderName: preset.welderName,
        welderIds: [preset.welderId],
        wqrIds: preset.wqrId ? [preset.wqrId] : [],
      });
      return;
    }
    handleUpdateWeldingRecord(recordIndex, {
      welderName: value,
      welderIds: [],
      wqrIds: [],
    });
  }

  function handleRecordWelderWqrSelect(recordIndex, value) {
    if (value === "__custom__") {
      handleUpdateWeldingRecord(recordIndex, { welderIds: [], wqrIds: [] });
      return;
    }
    handleRecordWelderWqrInput(recordIndex, value);
  }

  function getRecordWelderWqrDisplayValue(record) {
    const selectedWelderId = (record.welderIds || [])[0];
    if (!selectedWelderId) return record.welderName || "";
    const selectedWelder = (personnel?.welders || []).find((welder) => welder.id === selectedWelderId);
    if (!selectedWelder?.name) return record.welderName || "";
    const selectedWqrId = (record.wqrIds || [])[0];
    if (!selectedWqrId) return selectedWelder.name;
    const selectedWqr = (personnel?.wqrs || []).find((wqr) => wqr.id === selectedWqrId);
    if (!selectedWqr?.code) return selectedWelder.name;
    return `${selectedWelder.name} | ${selectedWqr.code}`;
  }

  function getRecordWelderWqrPresetValue(record) {
    const value = getRecordWelderWqrDisplayValue(record);
    return welderPresetByLabel.has(value) ? value : "__custom__";
  }

  function handleRecordElectrodeSelect(recordIndex, electrodeIndex, value) {
    if (value === "__custom__") {
      handleRecordElectrodeChange(recordIndex, electrodeIndex, "");
      return;
    }
    handleRecordElectrodeChange(recordIndex, electrodeIndex, value);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!weld) return;
    const recordsToSave = weldingRecords.map((r) => ({
      ...r,
      electrodeNumbers: normalizeElectrodeNumbersForSave(r.electrodeNumbers),
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
      partId1: partId1 || null,
      partId2: partId2 || null,
      welderName,
      weldingRecords: recordsToSave,
      ndtRequired,
      visualInspection,
      ndtOverrides,
      ndtResults,
      ndtResultOutcome,
      ndtResultManualOverride: Object.keys(ndtResultManualOverride).length ? ndtResultManualOverride : undefined,
      spoolId: spoolId || null,
      wpsLibraryEntryId: linkedWpsEntryId || null,
      jointDimensions: normalizeJointDimensions(jointDimensions),
    });
  }

  const expandedWeldId = weld?.id;

  return (
    <div
      className={`flex flex-col bg-base-200 transition-all duration-300 ease-out min-w-0 ${
        hideHeader
          ? "w-full flex-1 min-h-0 overflow-hidden"
          : `flex-shrink-0 border-l border-base-300 ${isOpen ? "w-full min-w-[16rem] min-h-0 flex-1 h-full overflow-hidden" : "w-14 overflow-hidden"}`
      }`}
    >
      {!hideHeader && (
        <button
          type="button"
          onClick={() => (expandedWeldId ? onBackToList?.() : onToggle?.())}
          className={`flex-shrink-0 flex items-center justify-center gap-2 py-3 px-2 border-b border-base-300 bg-base-100 hover:bg-base-200 transition-colors ${
            isOpen ? "flex-row" : `flex-col ${isStacked ? "min-h-12" : "min-h-24"}`
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
      )}

      {/* Panel content - scrollable list with accordion-style expandable weld details */}
      {isOpen && (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden w-full min-w-0 h-0 basis-0">
          <div className={`flex-1 min-h-0 w-full min-w-0 overflow-y-scroll overflow-x-auto p-2 pb-12 overscroll-contain [scrollbar-gutter:stable] ${hideHeader ? "mobile-no-scrollbar" : ""}`}>
            {weldPoints.length === 0 ? (
              <div className="text-center py-8 text-base-content/60 text-sm">
                <p>No welds yet</p>
                <p className="mt-1">Add welds with the Add tool</p>
              </div>
            ) : (
              <>
                <div className="mb-2 flex flex-col gap-2">
                  <div>
                    <label className="label py-0 min-h-0" htmlFor="weld-list-search">
                      <span className="label-text text-xs">Search welds</span>
                    </label>
                    <input
                      id="weld-list-search"
                      type="search"
                      className="input input-bordered input-xs w-full"
                      value={weldListSearch}
                      onChange={(e) => setWeldListSearch(e.target.value)}
                      placeholder="Name, WPS, spool…"
                      autoComplete="off"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <select
                      id="weld-list-location"
                      className="select select-bordered select-xs flex-1 min-w-[6rem]"
                      value={weldListLocation}
                      onChange={(e) => setWeldListLocation(e.target.value)}
                      aria-label="Filter by shop or field"
                    >
                      <option value="all">All SW / FW</option>
                      <option value="shop">Shop only</option>
                      <option value="field">Field only</option>
                    </select>
                    <select
                      id="weld-list-missing"
                      className="select select-bordered select-xs flex-1 min-w-[6rem]"
                      value={weldListMissing}
                      onChange={(e) => setWeldListMissing(e.target.value)}
                      aria-label="Filter by missing requirements"
                    >
                      <option value="all">All welds</option>
                      <option value="incomplete">Missing requirements</option>
                    </select>
                  </div>
                  {weldListSearchNorm && filteredWeldPoints.length === 0 ? (
                    <p className="text-xs text-base-content/55">No welds match this search.</p>
                  ) : null}
                </div>
              <ul className="w-full min-w-full max-w-full bg-base-100 rounded-lg p-0 gap-0 list-none">
                {filteredWeldPoints.map((w) => {
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
                              const ndtSel = computeNdtSelection(w, drawingSettings, weldPoints, ndtContext);
                              const section = getWeldSectionCompletion(w, ndtSel, ndtContext);
                              const missing = [];
                              if (!section.general) missing.push("General");
                              if (!section.fitup) missing.push("Fitup");
                              if (!section.welding) missing.push("Welding");
                              if (!section.inspection) missing.push("Inspection");
                              const base = missing.length > 0 ? `Missing: ${missing.join(", ")}` : "—";
                              return base;
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
                                spoolId: weld?.spoolId ?? null,
                                lineId: weld?.lineId ?? null,
                                wps,
                                wpsLibraryEntryId: linkedWpsEntryId || null,
                                fitterName,
                                dateFitUp,
                                heatNumber1,
                                heatNumber2,
                                partId1: partId1 || null,
                                partId2: partId2 || null,
                                jointDimensions: jointDimensionsNorm,
                                weldingRecords,
                                ndtRequired,
                                visualInspection,
                                ndtOverrides,
                                ndtResults,
                                ndtResultOutcome,
                              };
                              const ndtSel = computeNdtSelection(virtualWeld, drawingSettings, weldPoints, ndtContext);
                              const sectionComplete = getWeldSectionCompletion(virtualWeld, ndtSel, ndtContext);
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
                                          <p className="text-xs text-base-content/60 -mt-1 mb-1">
                                            {inheritedWpsCode
                                              ? `Leave blank to inherit: ${inheritedWpsCode} (line → system)`
                                              : "Set WPS on the weld, or define default WPS on the line/system in Settings / Lines."}
                                          </p>
                                          <div className="space-y-1.5">
                                            {wpsPresetCodes.length > 0 && (
                                              <select
                                                className="select select-bordered select-sm"
                                                value={
                                                  !(wps || "").trim()
                                                    ? "__inherit__"
                                                    : wpsPresetCodes.includes((wps || "").trim())
                                                      ? (wps || "").trim()
                                                      : "__custom__"
                                                }
                                                onChange={(e) => {
                                                  const v = e.target.value;
                                                  if (v === "__inherit__") {
                                                    setWps("");
                                                    setLinkedWpsEntryId("");
                                                    return;
                                                  }
                                                  if (v === "__custom__") {
                                                    setWps("");
                                                    setLinkedWpsEntryId("");
                                                    return;
                                                  }
                                                  applyPresetWpsCode(v);
                                                }}
                                              >
                                                <option value="__inherit__">
                                                  {inheritedWpsCode
                                                    ? `Inherit (${inheritedWpsCode})`
                                                    : "Inherit from line/system (none set)"}
                                                </option>
                                                <option value="__custom__">Custom / override (type below)</option>
                                                {wpsPresetCodes.map((code) => (
                                                  <option key={code} value={code}>{code}</option>
                                                ))}
                                              </select>
                                            )}
                                            {wpsPresetCodes.length === 0 ||
                                            !(wps || "").trim() ||
                                            !wpsPresetCodes.includes((wps || "").trim()) ? (
                                              <input
                                                id="side-wps"
                                                type="text"
                                                className="input input-bordered input-sm"
                                                value={wps}
                                                onChange={(e) => {
                                                  const next = e.target.value;
                                                  setWps(next);
                                                  syncLinkedWpsAfterCodeChange(next);
                                                }}
                                                placeholder={
                                                  inheritedWpsCode
                                                    ? `Override (blank = ${inheritedWpsCode})`
                                                    : "Type WPS code"
                                                }
                                              />
                                            ) : null}
                                          </div>
                                          <p className="text-xs text-base-content/50 mt-1">
                                            Attach WPS PDFs and library rows in Settings → Project info & libraries.
                                          </p>
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
                                              <span className="label-text">Linked spool (current drawing)</span>
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
                                  <div className="space-y-1.5">
                                    {fitterOptions.length > 0 && (
                                      <select
                                        className="select select-bordered select-sm"
                                        value={fitterOptions.includes((fitterName || "").trim()) ? (fitterName || "").trim() : "__custom__"}
                                        onChange={(e) => {
                                          if (e.target.value === "__custom__") {
                                            setFitterName("");
                                            return;
                                          }
                                          setFitterName(e.target.value);
                                        }}
                                      >
                                        <option value="__custom__">Custom fitter</option>
                                        {fitterOptions.map((name) => (
                                          <option key={name} value={name}>{name}</option>
                                        ))}
                                      </select>
                                    )}
                                    {fitterOptions.length === 0 || !fitterOptions.includes((fitterName || "").trim()) ? (
                                      <input
                                        id="side-fitterName"
                                        type="text"
                                        className="input input-bordered input-sm"
                                        value={fitterName}
                                        onChange={(e) => setFitterName(e.target.value)}
                                        placeholder="Type custom fitter"
                                      />
                                    ) : null}
                                  </div>
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

                                <div className="rounded-lg border border-base-300/70 bg-base-200/25 p-3 space-y-3">
                                  <p className="text-xs font-semibold text-base-content/75 uppercase tracking-wide">Side 1</p>
                                  {parts.length > 0 && (
                                    <div className="form-control">
                                      <label className="label py-0" htmlFor="side-partId1">
                                        <span className="label-text text-sm">Part 1</span>
                                      </label>
                                      <select
                                        id="side-partId1"
                                        className="select select-bordered select-sm w-full"
                                        value={partId1}
                                        onChange={(e) => handlePart1Select(e.target.value)}
                                      >
                                        <option value="">— No part (custom joint)</option>
                                        {parts
                                          .slice()
                                          .filter((p) => {
                                            const heat = (heatNumber1 ?? "").trim();
                                            if (!heat) return true;
                                            const partHeat = (p.heatNumber ?? "").trim();
                                            if (!partHeat) return true;
                                            return partHeat === heat || p.id === partId1;
                                          })
                                          .sort(comparePartDisplayNumbers)
                                          .map((p) => (
                                            <option key={p.id} value={p.id}>
                                              Part {p.displayNumber}
                                              {p.heatNumber ? ` (${p.heatNumber})` : ""}
                                              {p.nps ? ` · ${p.nps}` : ""}
                                              {p.thickness ? ` – ${p.thickness}` : ""}
                                            </option>
                                          ))}
                                      </select>
                                      {showSync1 && onUpdatePartHeat && selectedPart1 && (
                                        <button
                                          type="button"
                                          className="btn btn-ghost btn-xs mt-1"
                                          onClick={() => onUpdatePartHeat(selectedPart1.id, trimmedHeat1)}
                                        >
                                          {partHeat1
                                            ? `Update Part ${selectedPart1.displayNumber} to ${trimmedHeat1}`
                                            : `Assign this heat to Part ${selectedPart1.displayNumber}`}
                                        </button>
                                      )}
                                    </div>
                                  )}
                                  <div className="form-control">
                                    <label className="label py-0" htmlFor="side-heatNumber1">
                                      <span className="label-text text-sm">Heat number</span>
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
                                  {selectedPart1 && !selectedPart1.heatNumber && !trimmedHeat1 && (
                                    <p className="text-xs text-base-content/60">
                                      Type a heat number above and then assign it to Part {selectedPart1.displayNumber}.
                                    </p>
                                  )}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div className="form-control">
                                      <label className="label py-0" htmlFor="fit-nps-1">
                                        <span className="label-text text-xs">NPS</span>
                                      </label>
                                      <input
                                        id="fit-nps-1"
                                        type="text"
                                        readOnly={!!selectedPart1}
                                        className={`input input-bordered input-sm w-full ${selectedPart1 ? "bg-base-200/90 text-base-content/75 cursor-default" : ""}`}
                                        value={selectedPart1 ? effectiveJoint1.nps : jointDimensionsNorm.side1.nps}
                                        onChange={
                                          selectedPart1
                                            ? undefined
                                            : (e) => setJointSideField(1, "nps", e.target.value)
                                        }
                                        placeholder={selectedPart1 ? "" : "e.g. 2"}
                                      />
                                    </div>
                                    <div className="form-control">
                                      <label className="label py-0" htmlFor="fit-sch-1">
                                        <span className="label-text text-xs">Schedule</span>
                                      </label>
                                      <input
                                        id="fit-sch-1"
                                        type="text"
                                        readOnly={!!selectedPart1}
                                        className={`input input-bordered input-sm w-full ${selectedPart1 ? "bg-base-200/90 text-base-content/75 cursor-default" : ""}`}
                                        value={selectedPart1 ? effectiveJoint1.schedule : jointDimensionsNorm.side1.schedule}
                                        onChange={
                                          selectedPart1
                                            ? undefined
                                            : (e) => setJointSideField(1, "schedule", e.target.value)
                                        }
                                        placeholder={selectedPart1 ? "" : "e.g. SCH 40"}
                                      />
                                    </div>
                                  </div>
                                  {selectedPart1 ? (
                                    <p className="text-[10px] text-base-content/50 leading-snug">
                                      NPS and schedule follow the linked part. Clear Part 1 to enter custom values.
                                    </p>
                                  ) : null}
                                </div>

                                <div className="rounded-lg border border-base-300/70 bg-base-200/25 p-3 space-y-3">
                                  <p className="text-xs font-semibold text-base-content/75 uppercase tracking-wide">Side 2</p>
                                  {parts.length > 0 && (
                                    <div className="form-control">
                                      <label className="label py-0" htmlFor="side-partId2">
                                        <span className="label-text text-sm">Part 2</span>
                                      </label>
                                      <select
                                        id="side-partId2"
                                        className="select select-bordered select-sm w-full"
                                        value={partId2}
                                        onChange={(e) => handlePart2Select(e.target.value)}
                                      >
                                        <option value="">— No part (custom joint)</option>
                                        {parts
                                          .slice()
                                          .filter((p) => {
                                            const heat = (heatNumber2 ?? "").trim();
                                            if (!heat) return true;
                                            const partHeat = (p.heatNumber ?? "").trim();
                                            if (!partHeat) return true;
                                            return partHeat === heat || p.id === partId2;
                                          })
                                          .sort(comparePartDisplayNumbers)
                                          .map((p) => (
                                            <option key={p.id} value={p.id}>
                                              Part {p.displayNumber}
                                              {p.heatNumber ? ` (${p.heatNumber})` : ""}
                                              {p.nps ? ` · ${p.nps}` : ""}
                                              {p.thickness ? ` – ${p.thickness}` : ""}
                                            </option>
                                          ))}
                                      </select>
                                      {showSync2 && onUpdatePartHeat && selectedPart2 && (
                                        <button
                                          type="button"
                                          className="btn btn-ghost btn-xs mt-1"
                                          onClick={() => onUpdatePartHeat(selectedPart2.id, trimmedHeat2)}
                                        >
                                          {partHeat2
                                            ? `Update Part ${selectedPart2.displayNumber} to ${trimmedHeat2}`
                                            : `Assign this heat to Part ${selectedPart2.displayNumber}`}
                                        </button>
                                      )}
                                    </div>
                                  )}
                                  <div className="form-control">
                                    <label className="label py-0" htmlFor="side-heatNumber2">
                                      <span className="label-text text-sm">Heat number</span>
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
                                  {selectedPart2 && !selectedPart2.heatNumber && !trimmedHeat2 && (
                                    <p className="text-xs text-base-content/60">
                                      Type a heat number above and then assign it to Part {selectedPart2.displayNumber}.
                                    </p>
                                  )}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div className="form-control">
                                      <label className="label py-0" htmlFor="fit-nps-2">
                                        <span className="label-text text-xs">NPS</span>
                                      </label>
                                      <input
                                        id="fit-nps-2"
                                        type="text"
                                        readOnly={!!selectedPart2}
                                        className={`input input-bordered input-sm w-full ${selectedPart2 ? "bg-base-200/90 text-base-content/75 cursor-default" : ""}`}
                                        value={selectedPart2 ? effectiveJoint2.nps : jointDimensionsNorm.side2.nps}
                                        onChange={
                                          selectedPart2
                                            ? undefined
                                            : (e) => setJointSideField(2, "nps", e.target.value)
                                        }
                                        placeholder={selectedPart2 ? "" : "e.g. 2"}
                                      />
                                    </div>
                                    <div className="form-control">
                                      <label className="label py-0" htmlFor="fit-sch-2">
                                        <span className="label-text text-xs">Schedule</span>
                                      </label>
                                      <input
                                        id="fit-sch-2"
                                        type="text"
                                        readOnly={!!selectedPart2}
                                        className={`input input-bordered input-sm w-full ${selectedPart2 ? "bg-base-200/90 text-base-content/75 cursor-default" : ""}`}
                                        value={selectedPart2 ? effectiveJoint2.schedule : jointDimensionsNorm.side2.schedule}
                                        onChange={
                                          selectedPart2
                                            ? undefined
                                            : (e) => setJointSideField(2, "schedule", e.target.value)
                                        }
                                        placeholder={selectedPart2 ? "" : "e.g. SCH 40"}
                                      />
                                    </div>
                                  </div>
                                  {selectedPart2 ? (
                                    <p className="text-[10px] text-base-content/50 leading-snug">
                                      NPS and schedule follow the linked part. Clear Part 2 to enter custom values.
                                    </p>
                                  ) : null}
                                </div>

                                <button
                                  type="button"
                                  className="btn btn-ghost btn-xs w-full sm:w-auto"
                                  onClick={() => setJointDimensions(createDefaultJointDimensions())}
                                >
                                  Clear custom NPS/schedule (both sides)
                                </button>
                              </div>
                            )}

                            {sectionKey === "welding" && (
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="label-text font-medium">Welding records</span>
                                  <div
                                    role="button"
                                    tabIndex={0}
                                    className="btn btn-ghost btn-sm gap-1 touch-manipulation select-none min-h-[2.5rem] px-4 -mr-1 active:bg-base-300"
                                    onPointerDown={(e) => {
                                      if (e.button !== 0 && e.pointerType === "mouse") return;
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleAddWeldingRecord();
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        handleAddWeldingRecord();
                                      }
                                    }}
                                  >
                                    + Add
                                  </div>
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
                                            <span className="label-text text-xs">Welder / WQR</span>
                                          </label>
                                          <div className="space-y-1.5">
                                            {welderPresetEntries.length > 0 && (
                                              <select
                                                id={`side-welder-${rec.id}`}
                                                className="select select-bordered select-xs w-full"
                                                value={getRecordWelderWqrPresetValue(rec)}
                                                onChange={(e) => handleRecordWelderWqrSelect(idx, e.target.value)}
                                              >
                                                <option value="__custom__">Custom welder / WQR</option>
                                                {welderPresetEntries.map((entry) => (
                                                  <option
                                                    key={`${entry.welderId}-${entry.wqrId || "none"}`}
                                                    value={entry.label}
                                                  >
                                                    {entry.label}
                                                  </option>
                                                ))}
                                              </select>
                                            )}
                                            {welderPresetEntries.length === 0 || getRecordWelderWqrPresetValue(rec) === "__custom__" ? (
                                              <input
                                                type="text"
                                                className="input input-bordered input-xs w-full"
                                                placeholder="Type custom welder / WQR"
                                                value={rec.welderName ?? ""}
                                                onChange={(e) => handleUpdateWeldingRecord(idx, { welderName: e.target.value, welderIds: [], wqrIds: [] })}
                                                autoComplete="off"
                                              />
                                            ) : null}
                                          </div>
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
                                                <div className="flex-1 space-y-1">
                                                  {electrodeOptions.length > 0 && (
                                                    <select
                                                      className="select select-bordered select-xs w-full"
                                                      value={electrodeOptions.includes((val || "").trim()) ? (val || "").trim() : "__custom__"}
                                                      onChange={(e) => handleRecordElectrodeSelect(idx, i, e.target.value)}
                                                    >
                                                      <option value="__custom__">Custom electrode</option>
                                                      {getElectrodeLibraryChoicesForSlot(rec, i).map((code) => (
                                                        <option key={code} value={code}>{code}</option>
                                                      ))}
                                                    </select>
                                                  )}
                                                  {electrodeOptions.length === 0 || !electrodeOptions.includes((val || "").trim()) ? (
                                                    <input
                                                      type="text"
                                                      className="input input-bordered input-xs flex-1"
                                                      value={val}
                                                      onChange={(e) => handleRecordElectrodeChange(idx, i, e.target.value)}
                                                      placeholder="e.g. E7018"
                                                    />
                                                  ) : null}
                                                </div>
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
                                              className="btn btn-ghost btn-xs gap-0 touch-manipulation min-h-[2rem]"
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleAddRecordElectrode(idx);
                                              }}
                                              onPointerDown={(e) => {
                                                if (e.pointerType === "touch") {
                                                  e.preventDefault();
                                                  handleAddRecordElectrode(idx);
                                                }
                                              }}
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
                                <div className="form-control flex flex-row items-center gap-2 py-2">
                                  <span className="label-text">Override NDT result</span>
                                  <button
                                    type="button"
                                    className={`btn btn-sm ${ndtResultOverrideUnlocked ? "btn-warning" : "btn-ghost"}`}
                                    onClick={() => setNdtResultOverrideUnlocked((v) => !v)}
                                    title={ndtResultOverrideUnlocked ? "Lock to prevent accidental edits" : "Unlock to edit result (overrides system)"}
                                    aria-label={ndtResultOverrideUnlocked ? "Lock" : "Unlock"}
                                  >
                                    {ndtResultOverrideUnlocked ? (
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                      </svg>
                                    ) : (
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                      </svg>
                                    )}
                                    <span className="text-xs">{ndtResultOverrideUnlocked ? "Unlocked" : "Locked"}</span>
                                  </button>
                                </div>
                                <div className="overflow-x-auto">
                                  <table className="table table-xs">
                                    <thead>
                                      <tr>
                                        <th>NDT</th>
                                        <th>Override</th>
                                        <th>Required</th>
                                        <th>Result</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {inspectionMethods.map((m) => {
                                        const virtualW = {
                                          id: weld?.id,
                                          weldLocation: weld?.weldLocation,
                                          ndtRequired,
                                          visualInspection,
                                          ndtOverrides,
                                        };
                                        const sel = computeNdtSelection(virtualW, drawingSettings, weldPoints, ndtContext);
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
                                                <option value={NDT_OVERRIDE_OPTIONS.REQUIRED}>Include</option>
                                                <option value={NDT_OVERRIDE_OPTIONS.EXEMPT}>Exclude</option>
                                              </select>
                                            </td>
                                            <td className="text-sm">{isRequired ? "Yes" : "No"}</td>
                                            <td className="text-sm">
                                              {!isRequired ? (
                                                <span className="text-base-content/50">N/A</span>
                                              ) : ndtResultOverrideUnlocked ? (
                                                <select
                                                  className="select select-bordered select-xs w-full max-w-[10rem]"
                                                  value={outcome ?? ""}
                                                  onChange={(e) => {
                                                    const v = e.target.value;
                                                    setNdtResultOutcome((prev) => {
                                                      const next = { ...prev };
                                                      if (v) next[m] = v; else delete next[m];
                                                      return next;
                                                    });
                                                    setNdtResults((prev) => ({ ...prev, [m]: v ? "ok" : undefined }));
                                                    setNdtResultManualOverride((prev) => {
                                                      const next = { ...prev };
                                                      if (v) next[m] = true; else delete next[m];
                                                      return next;
                                                    });
                                                  }}
                                                  title="Override NDT result"
                                                >
                                                  <option value="">—</option>
                                                  <option value={NDT_RESULT_OUTCOMES.ACCEPTED}>{NDT_RESULT_OUTCOME_LABELS[NDT_RESULT_OUTCOMES.ACCEPTED]}</option>
                                                  <option value={NDT_RESULT_OUTCOMES.REJECTED}>{NDT_RESULT_OUTCOME_LABELS[NDT_RESULT_OUTCOMES.REJECTED]}</option>
                                                  <option value={NDT_RESULT_OUTCOMES.OMITTED_OR_INCONCLUSIVE}>{NDT_RESULT_OUTCOME_LABELS[NDT_RESULT_OUTCOMES.OMITTED_OR_INCONCLUSIVE]}</option>
                                                  <option value="repair">{NDT_RESULT_OUTCOME_LABELS.repair}</option>
                                                </select>
                                              ) : outcome ? (
                                                <span className="inline-flex items-center gap-1">
                                                  <span className={outcome === "rejected" || outcome === "reject" ? "text-error font-medium" : outcome === "omitted_or_inconclusive" || outcome === "repair" ? "text-warning font-medium" : ""}>
                                                    {NDT_RESULT_OUTCOME_LABELS[outcome] ?? outcome}
                                                  </span>
                                                  {ndtResultManualOverride[m] && (
                                                    <span
                                                      className="text-xs font-mono bg-base-300 text-base-content/70 px-1 rounded align-middle"
                                                      title="Manually overridden — may be missing linked report info"
                                                    >
                                                      m
                                                    </span>
                                                  )}
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
              </>
              )}
            </div>
          </div>
        )}
    </div>
  );
}

export default SidePanelWeldForm;
