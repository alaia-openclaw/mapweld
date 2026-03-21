"use client";

import { useState } from "react";
import { NDT_METHODS, NDT_METHOD_LABELS, sortNdtMethods } from "@/lib/constants";
import {
  addNdtRequirementRow,
  updateNdtRequirementRow,
  removeNdtRequirementRow,
} from "@/lib/ndt-requirements-rows";

/**
 * Editable NDT % table (project default or system/line overrides).
 * @param {object[]} rows
 * @param {(next: object[]) => void} onChange
 * @param {'default' | 'compact'} variant
 * @param {'project' | 'override'} scope — empty-state copy
 * @param {string} [hint] — short help under title
 * @param {boolean} [showTitle]
 * @param {string} [title]
 */
export default function NdtRequirementsOverrideTable({
  rows = [],
  onChange,
  variant = "default",
  scope = "override",
  hint,
  showTitle = true,
  title = "NDT overrides",
}) {
  const [customMethod, setCustomMethod] = useState("");
  const compact = variant === "compact";
  const inputCls = compact ? "input input-bordered input-xs w-14" : "input input-bordered input-xs w-16";
  const rowPad = compact ? "p-1.5 gap-1" : "p-2 gap-2";
  const labelCls = compact ? "text-[10px]" : "text-xs";

  function addRow(method, pct = 100) {
    onChange(addNdtRequirementRow(rows, method, pct));
  }

  function updateRow(method, field, value) {
    onChange(updateNdtRequirementRow(rows, method, field, value));
  }

  function removeRow(method) {
    onChange(removeNdtRequirementRow(rows, method));
  }

  function handleAddCustom() {
    if (!customMethod.trim()) return;
    addRow(customMethod.trim(), 100);
    setCustomMethod("");
  }

  const methodOrder = sortNdtMethods(rows.map((r) => r.method));
  const sortedRows = [...rows].sort(
    (a, b) => methodOrder.indexOf(a.method) - methodOrder.indexOf(b.method)
  );

  return (
    <div className="space-y-1.5">
      {showTitle ? (
        <div>
          <p className={`font-medium ${compact ? "text-xs" : "text-sm"}`}>{title}</p>
          {hint ? (
            <p className={`text-base-content/60 ${compact ? "text-[10px] leading-tight" : "text-xs"} mt-0.5`}>
              {hint}
            </p>
          ) : null}
        </div>
      ) : null}
      <div className="space-y-1">
        {sortedRows.map((r) => (
          <div
            key={r.method}
            className={`flex flex-wrap items-center bg-base-200 rounded-lg ${rowPad}`}
          >
            <span className={`${compact ? "w-16" : "w-24"} font-medium shrink-0 text-xs`}>
              {NDT_METHOD_LABELS[r.method] || r.method}
            </span>
            <div className="flex items-center gap-0.5">
              <span className={`${labelCls} text-base-content/60`}>Shop</span>
              <input
                type="number"
                min={0}
                max={100}
                className={inputCls}
                value={r.pctShop ?? r.pct ?? 100}
                onChange={(e) => updateRow(r.method, "shop", e.target.value)}
              />
              <span className="text-xs">%</span>
            </div>
            <div className="flex items-center gap-0.5">
              <span className={`${labelCls} text-base-content/60`}>Field</span>
              <input
                type="number"
                min={0}
                max={100}
                className={inputCls}
                value={r.pctField ?? r.pct ?? 100}
                onChange={(e) => updateRow(r.method, "field", e.target.value)}
              />
              <span className="text-xs">%</span>
            </div>
            <button
              type="button"
              className={`btn btn-ghost btn-square ml-auto ${compact ? "btn-xs min-h-6 h-6 w-6" : "btn-sm"}`}
              onClick={() => removeRow(r.method)}
              aria-label={`Remove ${r.method}`}
            >
              ×
            </button>
          </div>
        ))}
        {rows.length === 0 && (
          <p className={`text-base-content/50 ${compact ? "text-[10px]" : "text-xs"} py-1`}>
            {scope === "project"
              ? "No NDT methods set. Add below."
              : "None — project defaults apply for every method."}
          </p>
        )}
      </div>
      <div className={`flex flex-wrap gap-1 ${compact ? "" : "mt-1"}`}>
        {NDT_METHODS.filter((m) => !rows.some((r) => r.method === m)).map((m) => (
          <button key={m} type="button" className="btn btn-ghost btn-xs" onClick={() => addRow(m)}>
            + {NDT_METHOD_LABELS[m] || m}
          </button>
        ))}
      </div>
      <div className="flex gap-1 items-center">
        <input
          type="text"
          className={`input input-bordered flex-1 min-w-0 input-xs`}
          value={customMethod}
          onChange={(e) => setCustomMethod(e.target.value)}
          placeholder="Custom (e.g. PWHT)"
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCustom())}
        />
        <button type="button" className={`btn btn-ghost ${compact ? "btn-xs" : "btn-sm"}`} onClick={handleAddCustom}>
          Add
        </button>
      </div>
    </div>
  );
}
