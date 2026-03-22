"use client";

import { useMemo, useCallback, useEffect } from "react";
import { PART_TYPE_LABELS, WELD_LOCATION_LABELS } from "@/lib/constants";
import { getCategories } from "@/lib/part-catalog";
import { getHierarchyForCategory } from "@/lib/catalog-hierarchy";
import CatalogHierarchyStepSelects from "@/components/CatalogHierarchyStepSelects";
import CatalogTreeCascade from "@/components/CatalogTreeCascade";
import { leafIdToCatalogCategory, getMergedCatalogEntries } from "@/lib/catalog-leaf-resolve";

function AddDefaultsBar({
  markupTool,
  addDefaults,
  onAddDefaultsChange,
  spools = [],
  lines = [],
  /** Lines present on the current PDF page (line/spool markers on this page) — limits default line for new spools. */
  linesForSpoolDefault = null,
  systems = [],
  className = "",
}) {
  const catalogLeafId = addDefaults?.catalogLeafId ?? "";
  const catalogCategory =
    addDefaults?.catalogCategory ?? (catalogLeafId ? leafIdToCatalogCategory(catalogLeafId) : "");
  const hierarchyState = addDefaults?.hierarchyState ?? {};
  const isCatalogMode = Boolean(catalogLeafId);
  const categories = getCategories();
  const catalogEntriesForCategory = useMemo(
    () =>
      catalogCategory
        ? getMergedCatalogEntries(catalogCategory, catalogLeafId)
        : [],
    [catalogCategory, catalogLeafId]
  );
  const hierarchySteps = useMemo(
    () => getHierarchyForCategory(catalogCategory),
    [catalogCategory]
  );

  const showWeld = markupTool === "add";
  /** Line default for new spool markers (and welds) */
  const showSpoolLineDefaults = markupTool === "add" || markupTool === "addSpool";
  /** Default spool assignment only when placing welds — not when placing spool markers */
  const showSpoolPickerForWelds = markupTool === "add";
  const showPart = markupTool === "addPart";
  const showLine = markupTool === "addLine";
  const spoolLineChoices = Array.isArray(linesForSpoolDefault) ? linesForSpoolDefault : lines;

  const selectedSpool = useMemo(
    () => (addDefaults?.spoolId ? spools.find((s) => s.id === addDefaults.spoolId) : null),
    [addDefaults?.spoolId, spools]
  );
  const lineIdLockedBySpool = selectedSpool?.lineId ?? null;
  const lockedLineLabel = useMemo(() => {
    if (!lineIdLockedBySpool) return "";
    const line =
      lines.find((l) => l.id === lineIdLockedBySpool) ||
      spoolLineChoices.find((l) => l.id === lineIdLockedBySpool);
    return line ? String(line.name || line.id).trim() || lineIdLockedBySpool : lineIdLockedBySpool;
  }, [lineIdLockedBySpool, lines, spoolLineChoices]);

  /** Weld mode: line default only after a default spool is chosen. Spool-marker mode has no default spool — line stays choosable. */
  const canChooseDefaultLine = !showSpoolPickerForWelds || Boolean(addDefaults?.spoolId);

  /** When a line applies (linked spool, or spool + chosen line), only spools on that line appear in the default spool picker. */
  const effectiveLineIdForSpoolFilter = useMemo(() => {
    if (lineIdLockedBySpool) return lineIdLockedBySpool;
    if (!addDefaults?.spoolId) return null;
    return addDefaults?.spoolLineId ?? null;
  }, [lineIdLockedBySpool, addDefaults?.spoolId, addDefaults?.spoolLineId]);

  const spoolsForDefaultPicker = useMemo(() => {
    if (!effectiveLineIdForSpoolFilter) return spools;
    return spools.filter((s) => s.lineId === effectiveLineIdForSpoolFilter);
  }, [spools, effectiveLineIdForSpoolFilter]);

  const spoolSelectValue = useMemo(() => {
    const sid = addDefaults?.spoolId ?? "";
    if (!sid) return "";
    return spoolsForDefaultPicker.some((s) => s.id === sid) ? sid : "";
  }, [addDefaults?.spoolId, spoolsForDefaultPicker]);

  const showSpoolLineControl =
    showSpoolLineDefaults && (spoolLineChoices.length > 0 || Boolean(lineIdLockedBySpool));

  useEffect(() => {
    if (!lineIdLockedBySpool || !onAddDefaultsChange) return;
    if (addDefaults?.spoolLineId === lineIdLockedBySpool) return;
    onAddDefaultsChange({ ...addDefaults, spoolLineId: lineIdLockedBySpool });
  }, [lineIdLockedBySpool, addDefaults, onAddDefaultsChange]);

  useEffect(() => {
    if (!showSpoolPickerForWelds || !onAddDefaultsChange) return;
    if (addDefaults?.spoolId) return;
    if (addDefaults?.spoolLineId == null || addDefaults?.spoolLineId === "") return;
    onAddDefaultsChange({ ...addDefaults, spoolLineId: null });
  }, [showSpoolPickerForWelds, addDefaults?.spoolId, addDefaults?.spoolLineId, addDefaults, onAddDefaultsChange]);

  useEffect(() => {
    if (!onAddDefaultsChange) return;
    const sid = addDefaults?.spoolId;
    if (!sid) return;
    if (spoolsForDefaultPicker.some((s) => s.id === sid)) return;
    onAddDefaultsChange({ ...addDefaults, spoolId: null });
  }, [spoolsForDefaultPicker, addDefaults, onAddDefaultsChange]);

  function handleCatalogLeafChange(leafId) {
    if (!leafId) {
      onAddDefaultsChange?.({
        ...addDefaults,
        catalogLeafId: "",
        catalogCategory: "",
        hierarchyState: {},
        partType: "",
        nps: "",
        thickness: "",
      });
      return;
    }
    const cat = leafIdToCatalogCategory(leafId);
    onAddDefaultsChange?.({
      ...addDefaults,
      catalogLeafId: leafId,
      catalogCategory: cat,
      hierarchyState: {},
      partType: "",
      nps: "",
      thickness: "",
    });
  }

  function handleHierarchyChange(stepKey, value) {
    const stepIndex = hierarchySteps.findIndex((s) => s.key === stepKey);
    if (stepIndex < 0) return;
    const next = { ...hierarchyState, [stepKey]: value };
    for (let j = stepIndex + 1; j < hierarchySteps.length; j++) {
      delete next[hierarchySteps[j].key];
    }
    onAddDefaultsChange?.({
      ...addDefaults,
      hierarchyState: next,
    });
  }

  const handleHierarchyStateReplace = useCallback(
    (next) => {
      onAddDefaultsChange?.({ ...addDefaults, hierarchyState: next });
    },
    [addDefaults, onAddDefaultsChange]
  );

  return (
    <div
      className={`flex flex-wrap items-center gap-1.5 px-2 py-1.5 rounded-lg bg-base-200/70 backdrop-blur-md border border-base-300/50 shadow-sm w-fit max-w-full ${className}`}
      role="group"
      aria-label="Defaults for new weld/part"
    >
      <span className="text-xs text-base-content/60 mr-1 whitespace-nowrap">Defaults</span>
      {showWeld && (
        <div className="flex items-center gap-1">
          <label htmlFor="default-weldLocation" className="text-[11px] text-base-content/60 whitespace-nowrap">
            Weld
          </label>
          <select
            id="default-weldLocation"
            className="select select-bordered select-xs h-7 min-h-7 py-0.5 w-16 max-w-full text-xs"
            value={addDefaults?.weldLocation ?? "shop"}
            onChange={(e) => onAddDefaultsChange?.({ ...addDefaults, weldLocation: e.target.value })}
          >
            {Object.entries(WELD_LOCATION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      )}
      {showSpoolPickerForWelds && spools.length > 0 && (
        <div className="flex items-center gap-1">
          <label htmlFor="default-spool" className="text-[11px] text-base-content/60 whitespace-nowrap">
            Spool
          </label>
          <select
            id="default-spool"
            className="select select-bordered select-xs h-7 min-h-7 py-0.5 w-20 max-w-full text-xs"
            value={spoolSelectValue}
            title={
              effectiveLineIdForSpoolFilter
                ? "Only spools linked to the selected line are listed."
                : undefined
            }
            onChange={(e) => onAddDefaultsChange?.({ ...addDefaults, spoolId: e.target.value || null })}
          >
            <option value="">—</option>
            {spoolsForDefaultPicker.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}
      {showSpoolLineControl && (
        <div className="flex items-center gap-1">
          <label
            htmlFor={
              lineIdLockedBySpool || !canChooseDefaultLine ? undefined : "default-spool-line"
            }
            className="text-[11px] text-base-content/60 whitespace-nowrap"
          >
            Line
          </label>
          {lineIdLockedBySpool ? (
            <div
              className="flex items-center h-7 min-h-7 min-w-[6rem] max-w-[10rem] px-2 rounded-md border border-base-300 bg-base-300/40 text-xs text-base-content/50 cursor-not-allowed truncate"
              title="This spool is already linked to a line — line is inherited for new welds and spool markers."
              role="status"
              aria-live="polite"
            >
              {lockedLineLabel}
            </div>
          ) : !canChooseDefaultLine ? (
            <div
              className="flex items-center h-7 min-h-7 min-w-[6rem] max-w-[10rem] px-2 rounded-md border border-base-300 bg-base-300/40 text-xs text-base-content/50 cursor-not-allowed truncate"
              title="Choose a default spool first to set the line for new welds."
              role="status"
              aria-live="polite"
            >
              —
            </div>
          ) : (
            <select
              id="default-spool-line"
              className="select select-bordered select-xs h-7 min-h-7 py-0.5 w-24 max-w-full text-xs"
              value={addDefaults?.spoolLineId ?? ""}
              onChange={(e) =>
                onAddDefaultsChange?.({ ...addDefaults, spoolLineId: e.target.value || null })
              }
            >
              <option value="">—</option>
              {spoolLineChoices.map((line) => (
                <option key={line.id} value={line.id}>
                  {line.name || line.id}
                </option>
              ))}
            </select>
          )}
        </div>
      )}
      {showPart && (
        <>
          <div className="flex flex-wrap items-center gap-1 max-w-[min(100vw-2rem,42rem)]">
            <label className="text-[11px] text-base-content/60 whitespace-nowrap shrink-0">Part</label>
            <CatalogTreeCascade
              catalogCategories={categories}
              valueLeafId={catalogLeafId}
              onLeafChange={handleCatalogLeafChange}
              variant="compact"
              idPrefix="default-catalog"
            />
            <button
              type="button"
              className="btn btn-ghost btn-xs h-7 min-h-7 px-1.5 shrink-0"
              onClick={() => handleCatalogLeafChange("")}
              title="Clear catalog — use custom fields"
            >
              Custom
            </button>
          </div>
          {isCatalogMode ? (
            <CatalogHierarchyStepSelects
              catalogCategory={catalogCategory}
              hierarchySteps={hierarchySteps}
              hierarchyState={hierarchyState}
              catalogEntriesForCategory={catalogEntriesForCategory}
              onHierarchyChange={handleHierarchyChange}
              onHierarchyStateReplace={handleHierarchyStateReplace}
              variant="compact"
              idPrefix="default"
            />
          ) : (
        <>
          <select
            id="default-partType"
            className="select select-bordered select-xs h-7 min-h-7 py-0.5 w-20 max-w-full text-xs"
            value={addDefaults?.partType ?? ""}
            onChange={(e) => onAddDefaultsChange?.({ ...addDefaults, partType: e.target.value })}
            aria-label="Part type"
          >
            <option value="">—</option>
            {Object.entries(PART_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <input
            id="default-nps"
            type="text"
            className="input input-bordered input-xs h-7 min-h-7 py-0.5 w-12 max-w-full text-xs"
            placeholder="NPS"
            value={addDefaults?.nps ?? ""}
            onChange={(e) => onAddDefaultsChange?.({ ...addDefaults, nps: e.target.value })}
            aria-label="NPS"
          />
          <input
            id="default-thickness"
            type="text"
            className="input input-bordered input-xs h-7 min-h-7 py-0.5 w-12 max-w-full text-xs"
            placeholder="Sch"
            value={addDefaults?.thickness ?? ""}
            onChange={(e) => onAddDefaultsChange?.({ ...addDefaults, thickness: e.target.value })}
            aria-label="Thickness"
          />
        </>
      )}
          <div className="flex items-center gap-1">
            <label htmlFor="default-materialGrade" className="text-[11px] text-base-content/60 whitespace-nowrap">
              Material
            </label>
            <input
              id="default-materialGrade"
              type="text"
              className="input input-bordered input-xs h-7 min-h-7 py-0.5 w-20 max-w-full text-xs"
              placeholder="—"
              value={addDefaults?.materialGrade ?? ""}
              onChange={(e) => onAddDefaultsChange?.({ ...addDefaults, materialGrade: e.target.value })}
            />
          </div>
        </>
      )}
      {showLine && (
        <>
          <div className="flex items-center gap-1">
            <label htmlFor="default-lineId" className="text-[11px] text-base-content/60 whitespace-nowrap">
              Line
            </label>
            <select
              id="default-lineId"
              className="select select-bordered select-xs h-7 min-h-7 py-0.5 w-24 max-w-full text-xs"
              value={addDefaults?.lineId ?? "__new__"}
              onChange={(e) => onAddDefaultsChange?.({ ...addDefaults, lineId: e.target.value })}
            >
              <option value="__new__">New line</option>
              {lines.map((line) => (
                <option key={line.id} value={line.id}>
                  {line.name || line.id}
                </option>
              ))}
            </select>
          </div>
          {(addDefaults?.lineId ?? "__new__") === "__new__" && (
            <div className="flex items-center gap-1">
              <label htmlFor="default-lineSystemId" className="text-[11px] text-base-content/60 whitespace-nowrap">
                System
              </label>
              <select
                id="default-lineSystemId"
                className="select select-bordered select-xs h-7 min-h-7 py-0.5 w-24 max-w-full text-xs"
                value={addDefaults?.lineSystemId ?? ""}
                onChange={(e) => onAddDefaultsChange?.({ ...addDefaults, lineSystemId: e.target.value || null })}
              >
                <option value="">No system</option>
                {systems.map((system) => (
                  <option key={system.id} value={system.id}>
                    {system.name || "Unnamed system"}
                  </option>
                ))}
              </select>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AddDefaultsBar;
