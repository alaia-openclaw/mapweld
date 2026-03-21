"use client";

import { FILTER_PROPERTY_OPTIONS } from "@/lib/catalog-structure";

function normalizeFilterValue(value) {
  if (Array.isArray(value)) {
    if (value.length === 0) return "";
    return String(value[0] ?? "").trim();
  }
  return value != null ? String(value).trim() : "";
}

function FilterValueSelect({ value, options, onChange, onRemove }) {
  const selected = normalizeFilterValue(value);

  return (
    <div className="flex items-center gap-1 min-w-0 w-full">
      <select
        className="select select-xs select-bordered flex-1 min-w-0 w-full"
        value={options.includes(selected) ? selected : ""}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Filter value"
      >
        <option value="">Any</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="btn btn-ghost btn-xs btn-square shrink-0"
        onClick={onRemove}
        aria-label="Remove filter"
        title="Remove filter"
      >
        ×
      </button>
    </div>
  );
}

export default function CatalogFilterBar({
  search,
  onSearchChange,
  filters,
  onFiltersChange,
  valueOptionsByProperty = {},
}) {
  function addFilter() {
    onFiltersChange([
      ...filters,
      {
        id: `f-${Date.now()}`,
        property: FILTER_PROPERTY_OPTIONS[0].id,
        value: "",
      },
    ]);
  }

  function updateFilter(filterId, updates) {
    onFiltersChange(
      filters.map((f) => (f.id === filterId ? { ...f, ...updates } : f))
    );
  }

  function removeFilter(filterId) {
    onFiltersChange(filters.filter((f) => f.id !== filterId));
  }

  const hasActiveFilters = filters.some((f) => {
    const v = f.value;
    if (Array.isArray(v)) return v.length > 0;
    return v != null && String(v).trim() !== "";
  });

  return (
    <div className="shrink-0 flex flex-wrap items-center gap-2 px-3 py-2 border-b border-base-300 bg-base-200/60">
      <label
        htmlFor="catalog-search"
        className="text-sm font-medium text-base-content/70 shrink-0"
      >
        Search
      </label>
      <input
        id="catalog-search"
        type="search"
        placeholder="Search any property…"
        className="input input-xs input-bordered w-48 min-w-[8rem]"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        aria-label="Search catalog"
      />
      {filters.map((f) => (
        <div
          key={f.id}
          className="flex flex-col gap-1 items-stretch min-w-[12rem] max-w-[min(100vw-2rem,20rem)] shrink-0"
        >
          <select
            className="select select-xs select-bordered w-full"
            value={f.property}
            onChange={(e) =>
              updateFilter(f.id, { property: e.target.value, value: "" })
            }
            aria-label="Filter property"
          >
            {FILTER_PROPERTY_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
          <FilterValueSelect
            value={f.value}
            options={valueOptionsByProperty[f.property] ?? []}
            onChange={(next) => updateFilter(f.id, { value: next })}
            onRemove={() => removeFilter(f.id)}
          />
        </div>
      ))}
      <button
        type="button"
        className="btn btn-ghost btn-sm gap-1"
        onClick={addFilter}
        aria-label="Add filter"
      >
        + Add filter
      </button>
      {(search.trim() || hasActiveFilters) && (
        <button
          type="button"
          className="btn btn-ghost btn-xs"
          onClick={() => {
            onSearchChange("");
            onFiltersChange([]);
          }}
          aria-label="Clear all"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
