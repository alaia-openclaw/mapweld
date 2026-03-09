"use client";

import { PART_TYPES, PART_TYPE_LABELS, WELD_LOCATION, WELD_LOCATION_LABELS } from "@/lib/constants";

function AddDefaultsBar({
  addDefaults,
  onAddDefaultsChange,
  spools = [],
  className = "",
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-2 px-3 py-2 bg-base-200 rounded-lg ${className}`}
      role="group"
      aria-label="Defaults for new weld/part"
    >
      <span className="text-sm font-medium text-base-content/70 mr-1">Defaults for new:</span>
      {spools.length > 0 && (
        <div className="flex items-center gap-1">
          <label htmlFor="default-spool" className="text-xs text-base-content/60 whitespace-nowrap">
            Spool
          </label>
          <select
            id="default-spool"
            className="select select-bordered select-xs w-28 max-w-full"
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
      <div className="flex items-center gap-1">
        <label htmlFor="default-weldLocation" className="text-xs text-base-content/60 whitespace-nowrap">
          Weld
        </label>
        <select
          id="default-weldLocation"
          className="select select-bordered select-xs w-24 max-w-full"
          value={addDefaults?.weldLocation ?? "shop"}
          onChange={(e) => onAddDefaultsChange?.({ ...addDefaults, weldLocation: e.target.value })}
        >
          {Object.entries(WELD_LOCATION_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-1">
        <label htmlFor="default-partType" className="text-xs text-base-content/60 whitespace-nowrap">
          Part type
        </label>
        <select
          id="default-partType"
          className="select select-bordered select-xs w-24 max-w-full"
          value={addDefaults?.partType ?? ""}
          onChange={(e) => onAddDefaultsChange?.({ ...addDefaults, partType: e.target.value })}
        >
          <option value="">—</option>
          {Object.entries(PART_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-1">
        <label htmlFor="default-nps" className="text-xs text-base-content/60 whitespace-nowrap">
          NPS
        </label>
        <input
          id="default-nps"
          type="text"
          className="input input-bordered input-xs w-16 max-w-full"
          placeholder="—"
          value={addDefaults?.nps ?? ""}
          onChange={(e) => onAddDefaultsChange?.({ ...addDefaults, nps: e.target.value })}
        />
      </div>
      <div className="flex items-center gap-1">
        <label htmlFor="default-thickness" className="text-xs text-base-content/60 whitespace-nowrap">
          Thick
        </label>
        <input
          id="default-thickness"
          type="text"
          className="input input-bordered input-xs w-16 max-w-full"
          placeholder="—"
          value={addDefaults?.thickness ?? ""}
          onChange={(e) => onAddDefaultsChange?.({ ...addDefaults, thickness: e.target.value })}
        />
      </div>
      <div className="flex items-center gap-1">
        <label htmlFor="default-materialGrade" className="text-xs text-base-content/60 whitespace-nowrap">
          Material
        </label>
        <input
          id="default-materialGrade"
          type="text"
          className="input input-bordered input-xs w-24 max-w-full"
          placeholder="—"
          value={addDefaults?.materialGrade ?? ""}
          onChange={(e) => onAddDefaultsChange?.({ ...addDefaults, materialGrade: e.target.value })}
        />
      </div>
    </div>
  );
}

export default AddDefaultsBar;
