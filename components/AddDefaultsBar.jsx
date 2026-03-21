"use client";

import { useMemo, useCallback } from "react";
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
            value={addDefaults?.spoolId ?? ""}
            onChange={(e) => onAddDefaultsChange?.({ ...addDefaults, spoolId: e.target.value || null })}
          >
            <option value="">—</option>
            {spools.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}
      {showSpoolLineDefaults && spoolLineChoices.length > 0 && (
        <div className="flex items-center gap-1">
          <label htmlFor="default-spool-line" className="text-[11px] text-base-content/60 whitespace-nowrap">
            Line
          </label>
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
