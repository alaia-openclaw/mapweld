"use client";

import { PART_TYPE_LABELS, WELD_LOCATION_LABELS } from "@/lib/constants";
import {
  getCategories,
  getPartTypesForCategory,
  getNpsOptions,
  getThicknessOptions,
} from "@/lib/part-catalog";

function AddDefaultsBar({
  markupTool,
  addDefaults,
  onAddDefaultsChange,
  spools = [],
  className = "",
}) {
  const catalogCategory = addDefaults?.catalogCategory ?? "";
  const isCatalogMode = Boolean(catalogCategory);
  const categories = getCategories();
  const catalogPartTypes = isCatalogMode ? getPartTypesForCategory(catalogCategory) : [];
  const catalogNpsOptions =
    isCatalogMode && addDefaults?.partType
      ? getNpsOptions(catalogCategory, addDefaults.partType)
      : [];
  const catalogThicknessOptions =
    isCatalogMode && addDefaults?.partType && addDefaults?.nps
      ? getThicknessOptions(catalogCategory, addDefaults.partType, addDefaults.nps)
      : [];

  const showWeld = markupTool === "add";
  const showSpool = markupTool === "add" || markupTool === "addSpool";
  const showPart = markupTool === "addPart";

  function handleCatalogCategoryChange(value) {
    onAddDefaultsChange?.({
      ...addDefaults,
      catalogCategory: value,
      partType: "",
      nps: "",
      thickness: "",
    });
  }

  function handleCatalogPartTypeChange(value) {
    onAddDefaultsChange?.({
      ...addDefaults,
      partType: value,
      nps: "",
      thickness: "",
    });
  }

  function handleCatalogNpsChange(value) {
    onAddDefaultsChange?.({
      ...addDefaults,
      nps: value,
      thickness: "",
    });
  }

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
      {showSpool && spools.length > 0 && (
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
      {showPart && (
        <>
          <div className="flex items-center gap-1">
            <label htmlFor="default-catalogCategory" className="text-[11px] text-base-content/60 whitespace-nowrap">
              Part
            </label>
            <select
              id="default-catalogCategory"
              className="select select-bordered select-xs h-7 min-h-7 py-0.5 w-20 max-w-full text-xs"
              value={catalogCategory}
              onChange={(e) => handleCatalogCategoryChange(e.target.value)}
            >
              <option value="">Custom</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          {isCatalogMode ? (
        <>
          <select
            id="default-partType"
            className="select select-bordered select-xs h-7 min-h-7 py-0.5 w-24 max-w-full text-xs"
            value={addDefaults?.partType ?? ""}
            onChange={(e) => handleCatalogPartTypeChange(e.target.value)}
            aria-label="Part type"
          >
            <option value="">—</option>
            {catalogPartTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            id="default-nps"
            className="select select-bordered select-xs h-7 min-h-7 py-0.5 w-12 max-w-full text-xs"
            value={addDefaults?.nps ?? ""}
            onChange={(e) => handleCatalogNpsChange(e.target.value)}
            aria-label="NPS"
          >
            <option value="">—</option>
            {catalogNpsOptions.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <select
            id="default-thickness"
            className="select select-bordered select-xs h-7 min-h-7 py-0.5 w-12 max-w-full text-xs"
            value={addDefaults?.thickness ?? ""}
            onChange={(e) => onAddDefaultsChange?.({ ...addDefaults, thickness: e.target.value })}
            aria-label="Thickness"
          >
            <option value="">—</option>
            {catalogThicknessOptions.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </>
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
            placeholder="Thick"
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
    </div>
  );
}

export default AddDefaultsBar;
