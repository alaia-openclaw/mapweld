"use client";

import { getOptionsForStep } from "@/lib/catalog-hierarchy";
import { getHierarchyStepDisplayLabel } from "@/lib/catalog-category-labels";

/**
 * Cascading selects for one catalog category (shared by part form and add-defaults bar).
 * @param {string} catalogCategory
 * @param {object[]} hierarchySteps — from getHierarchyForCategory(catalogCategory)
 * @param {object} hierarchyState
 * @param {object[]} catalogEntriesForCategory
 * @param {(stepKey: string, value: string) => void} onHierarchyChange
 * @param {'form' | 'compact'} variant
 * @param {string} idPrefix — element id prefix
 */
export default function CatalogHierarchyStepSelects({
  catalogCategory,
  hierarchySteps = [],
  hierarchyState = {},
  catalogEntriesForCategory = [],
  onHierarchyChange,
  variant = "form",
  idPrefix = "hierarchy",
}) {
  const isCompact = variant === "compact";
  const selectCls = isCompact
    ? "select select-bordered select-xs h-7 min-h-7 py-0.5 w-20 max-w-full text-xs"
    : "select select-bordered select-sm w-full";

  return (
    <>
      {hierarchySteps.map((step) => {
        const value = hierarchyState[step.key] ?? "";
        const options = getOptionsForStep(
          catalogEntriesForCategory,
          hierarchyState,
          catalogCategory,
          step.key
        );
        const displayLabel = getHierarchyStepDisplayLabel(catalogCategory, step);
        return (
          <div key={step.key} className={isCompact ? "flex items-center gap-1" : "form-control"}>
            {!isCompact ? (
              <label className="label" htmlFor={`${idPrefix}-${step.key}`}>
                <span className="label-text">{displayLabel}</span>
              </label>
            ) : null}
            <select
              id={`${idPrefix}-${step.key}`}
              className={selectCls}
              value={value}
              onChange={(e) => onHierarchyChange(step.key, e.target.value)}
              aria-label={displayLabel}
            >
              <option value="">—</option>
              {options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        );
      })}
    </>
  );
}
