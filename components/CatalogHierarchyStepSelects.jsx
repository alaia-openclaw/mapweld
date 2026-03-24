"use client";

import { useEffect, useMemo } from "react";
import {
  getHierarchyForCategory,
  getOptionsForStep,
  expandHierarchyStateWithAutoFills,
  hierarchyStateDiffers,
} from "@/lib/catalog-hierarchy";
import { getHierarchyStepDisplayLabel } from "@/lib/catalog-category-labels";

/**
 * Cascading selects for one catalog category (shared by part form and add-defaults bar).
 * Hides steps that only have one possible value (e.g. angle 90° for 90° elbows).
 * Optional onHierarchyStateReplace commits auto-filled state (single-option steps).
 */
export default function CatalogHierarchyStepSelects({
  catalogCategory,
  hierarchySteps: _ignored,
  hierarchyState = {},
  catalogEntriesForCategory = [],
  onHierarchyChange,
  onHierarchyStateReplace,
  variant = "form",
  idPrefix = "hierarchy",
}) {
  const isCompact = variant === "compact";
  const selectCls = isCompact
    ? "select select-bordered select-xs h-7 min-h-7 py-0.5 w-20 max-w-full text-xs"
    : "select select-bordered select-xs w-full";

  const steps = useMemo(() => getHierarchyForCategory(catalogCategory), [catalogCategory]);

  const expandedState = useMemo(
    () =>
      expandHierarchyStateWithAutoFills(catalogCategory, catalogEntriesForCategory, hierarchyState),
    [catalogCategory, catalogEntriesForCategory, hierarchyState]
  );

  useEffect(() => {
    if (!catalogCategory || !onHierarchyStateReplace) return;
    if (hierarchyStateDiffers(hierarchyState, expandedState)) {
      onHierarchyStateReplace(expandedState);
    }
  }, [catalogCategory, expandedState, hierarchyState, onHierarchyStateReplace]);

  const visibleSteps = useMemo(() => {
    return steps.filter((step) => {
      const opts = getOptionsForStep(
        catalogEntriesForCategory,
        expandedState,
        catalogCategory,
        step.key
      );
      return opts.length > 1;
    });
  }, [catalogCategory, catalogEntriesForCategory, expandedState, steps]);

  return (
    <>
      {visibleSteps.map((step) => {
        const value = expandedState[step.key] ?? "";
        const options = getOptionsForStep(
          catalogEntriesForCategory,
          expandedState,
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
