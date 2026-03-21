"use client";

import { useState, useRef, useEffect } from "react";
import { FILTER_PROPERTY_OPTIONS } from "@/lib/catalog-structure";

function FilterValueMultiSelect({
  filterId,
  propertyId,
  value,
  options,
  onChange,
  onRemove,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = Array.isArray(value) ? value : value ? [value] : [];

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  function toggleOption(opt) {
    const next = selected.includes(opt)
      ? selected.filter((v) => v !== opt)
      : [...selected, opt];
    onChange(next);
  }

  const label =
    selected.length === 0
      ? "Value"
      : selected.length === 1
        ? selected[0]
        : `${selected.length} values`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="input input-xs input-bordered w-32 min-w-[6rem] text-left flex items-center justify-between gap-1"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Filter value"
      >
        <span className="truncate">{label}</span>
        <span className="text-base-content/50 shrink-0">
          {open ? "▾" : "▸"}
        </span>
      </button>
      {open && (
        <ul
          className="dropdown-content menu p-1 mt-0.5 w-56 max-h-48 overflow-y-auto bg-base-100 border border-base-300 rounded-lg shadow-lg z-20"
          role="listbox"
        >
          {options.length === 0 ? (
            <li className="px-2 py-1 text-xs text-base-content/50">
              No values in catalog
            </li>
          ) : (
            options.map((opt) => (
              <li key={opt}>
                <label className="flex items-center gap-2 cursor-pointer py-1 px-2 rounded-md hover:bg-base-200">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={selected.includes(opt)}
                    onChange={() => toggleOption(opt)}
                  />
                  <span className="text-sm">{opt}</span>
                </label>
              </li>
            ))
          )}
        </ul>
      )}
      <button
        type="button"
        className="btn btn-ghost btn-xs btn-square ml-0.5"
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
        value: [],
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
    return Array.isArray(v) ? v.length > 0 : v?.trim();
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
        <div key={f.id} className="flex items-center gap-1 flex-wrap">
          <select
            className="select select-xs select-bordered w-32 max-w-[8rem]"
            value={f.property}
            onChange={(e) =>
              updateFilter(f.id, { property: e.target.value, value: [] })
            }
            aria-label="Filter property"
          >
            {FILTER_PROPERTY_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
          <FilterValueMultiSelect
            filterId={f.id}
            propertyId={f.property}
            value={f.value}
            options={valueOptionsByProperty[f.property] ?? []}
            onChange={(value) => updateFilter(f.id, { value })}
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
