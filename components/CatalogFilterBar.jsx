"use client";

import { useEffect, useMemo, useState } from "react";
import { FILTER_PROPERTY_OPTIONS } from "@/lib/catalog-structure";

function normalizeSelectedValues(value) {
  if (Array.isArray(value)) {
    return value.map((v) => String(v ?? "").trim()).filter(Boolean);
  }
  if (value == null || String(value).trim() === "") return [];
  return [String(value).trim()];
}

function FilterValueSelect({ value, options, onChange, onRemove }) {
  const selected = useMemo(() => normalizeSelectedValues(value), [value]);
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const summary =
    selected.length === 0
      ? "Any"
      : selected.length === 1
        ? selected[0]
        : `${selected.length} selected`;

  function toggleOption(opt) {
    const next = new Set(selected);
    if (next.has(opt)) next.delete(opt);
    else next.add(opt);
    onChange(Array.from(next));
  }

  function clearSelection() {
    onChange([]);
  }

  return (
    <div className="flex items-center gap-1 min-w-0 w-full">
      <div className="relative flex-1 min-w-0">
        <button
          type="button"
          className="select select-xs select-bordered w-full min-h-8 h-auto py-1.5 flex justify-between items-center gap-1 font-normal text-left"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label="Filter value"
        >
          <span className="truncate min-w-0">{summary}</span>
          <span className="shrink-0 opacity-60 text-[10px]" aria-hidden>
            ▾
          </span>
        </button>
        {open ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 cursor-default"
              aria-label="Close filter value list"
              onClick={() => setOpen(false)}
            />
            <div
              className="absolute left-0 right-0 top-full z-50 mt-1 rounded-box border border-base-300 bg-base-100 shadow-lg max-h-60 overflow-y-auto p-1"
              role="listbox"
              aria-label="Filter values"
              aria-multiselectable="true"
            >
              <div className="sticky top-0 z-10 flex justify-end border-b border-base-200 bg-base-100 px-1 pb-1 mb-1">
                <button
                  type="button"
                  className="btn btn-ghost btn-xs min-h-6 h-6 px-1"
                  onClick={clearSelection}
                >
                  Clear
                </button>
              </div>
              {options.map((opt) => {
                const isOn = selectedSet.has(opt);
                return (
                  <label
                    key={opt}
                    className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-base-200"
                  >
                    <input
                      type="checkbox"
                      className="checkbox checkbox-xs shrink-0"
                      checked={isOn}
                      onChange={() => toggleOption(opt)}
                    />
                    <span className="min-w-0 break-words">{opt}</span>
                  </label>
                );
              })}
            </div>
          </>
        ) : null}
      </div>
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
