"use client";

import { CATALOG_UNIT_SYSTEMS } from "@/lib/catalog-structure";

export default function CatalogFilterBar({
  search,
  onSearchChange,
  catalogUnitSystem = CATALOG_UNIT_SYSTEMS[0],
  onCatalogUnitSystemChange,
}) {
  return (
    <div className="shrink-0 flex flex-wrap items-end gap-2 gap-y-2 px-3 py-2 border-b border-base-300 bg-base-200/60">
      <div className="flex flex-col gap-0.5 shrink-0">
        <label htmlFor="catalog-search" className="text-[10px] font-semibold uppercase tracking-wide text-base-content/60">
          Search
        </label>
        <input
          id="catalog-search"
          type="search"
          placeholder="Search in table…"
          className="input input-xs input-bordered w-48 min-w-[8rem]"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search catalog"
        />
      </div>
      <div className="flex flex-col gap-0.5 shrink-0">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-base-content/60">Units</span>
        <div
          className="join join-horizontal border border-base-300 rounded-lg overflow-hidden"
          role="group"
          aria-label="Catalog unit system"
        >
          {CATALOG_UNIT_SYSTEMS.map((sys) => (
            <button
              key={sys}
              type="button"
              className={`btn btn-xs join-item min-h-8 px-3 font-medium ${
                catalogUnitSystem === sys ? "btn-primary text-primary-content" : "btn-ghost bg-base-100"
              }`}
              onClick={() => onCatalogUnitSystemChange?.(sys)}
            >
              {sys}
            </button>
          ))}
        </div>
      </div>
      {search.trim() ? (
        <button
          type="button"
          className="btn btn-ghost btn-xs shrink-0 self-end mb-0.5"
          onClick={() => onSearchChange("")}
          aria-label="Clear search"
        >
          Clear search
        </button>
      ) : null}
    </div>
  );
}
