"use client";

import { useMemo, useState } from "react";
import {
  matchEntrySearch,
  matchEntryFilters,
  entryMatchesCatalogUnitSystem,
} from "@/lib/catalog-structure";
import {
  CatalogFacetDropdown,
  CatalogReadOnlyFacet,
  catalogPanelOuterClass,
  catalogPanelToolbarClass,
} from "@/components/CatalogCategoryToolbar";

function uniqueSortedStrings(values) {
  const set = new Set();
  for (const v of values) {
    const s = v != null && String(v).trim() !== "" ? String(v).trim() : null;
    if (s) set.add(s);
  }
  return Array.from(set).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
  );
}

export default function PanelCatalogPipe({
  entries,
  search = "",
  filters = [],
  catalogUnitSystem,
}) {
  const [scheduleFilter, setScheduleFilter] = useState("");
  const [formFilter, setFormFilter] = useState("");

  const scheduleOptions = useMemo(
    () => uniqueSortedStrings(entries.map((e) => e.attributes?.schedule)),
    [entries]
  );

  const formOptions = useMemo(
    () => uniqueSortedStrings(entries.map((e) => e.attributes?.pipeForm ?? "Seamless")),
    [entries]
  );

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (!entryMatchesCatalogUnitSystem(e, catalogUnitSystem)) return false;
      if (scheduleFilter && String(e.attributes?.schedule ?? "") !== scheduleFilter) return false;
      if (formFilter && String(e.attributes?.pipeForm ?? "Seamless") !== formFilter) return false;
      if (!matchEntrySearch(e, search)) return false;
      if (!matchEntryFilters(e, filters)) return false;
      return true;
    });
  }, [entries, catalogUnitSystem, scheduleFilter, formFilter, search, filters]);

  if (!entries.length) {
    return (
      <div className="rounded-xl border border-base-300 bg-base-200/60 p-6 text-center text-base-content/70">
        No pipe data available. Ensure the reference database folder is present.
      </div>
    );
  }

  const isMetric = catalogUnitSystem === "Metric";

  return (
    <div className={catalogPanelOuterClass}>
      <div className={catalogPanelToolbarClass}>
        <CatalogReadOnlyFacet label="Category" value="Pipe" />
        {scheduleOptions.length > 0 ? (
          <CatalogFacetDropdown
            label="Schedule"
            options={[{ id: "", label: "All schedules" }, ...scheduleOptions.map((s) => ({ id: s, label: s }))]}
            activeId={scheduleFilter}
            onSelect={setScheduleFilter}
          />
        ) : null}
        {formOptions.length > 1 ? (
          <CatalogFacetDropdown
            label="Form"
            options={[{ id: "", label: "All" }, ...formOptions.map((f) => ({ id: f, label: f }))]}
            activeId={formFilter}
            onSelect={setFormFilter}
          />
        ) : null}
      </div>
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)] gap-3 p-3 min-h-0">
        <div className="rounded-lg border border-base-300 bg-base-100 p-3 flex flex-col gap-2 min-h-[200px]">
          <h2 className="text-sm font-semibold truncate">Pipe</h2>
          <div className="flex-1 flex items-center justify-center bg-base-200 rounded-md overflow-hidden border border-base-300/70 min-h-[160px]">
            {/* eslint-disable-next-line @next/next/no-img-element -- static bundled reference art */}
            <img
              src="/catalog/pipe.svg"
              alt=""
              className="max-h-full max-w-full object-contain pointer-events-none select-none opacity-90"
            />
          </div>
        </div>
        <div className="flex-1 overflow-auto rounded-xl min-h-0 border border-base-300 bg-base-100">
          <table className="table table-xs table-pin-rows">
            <thead>
              <tr>
                <th>NPS / NB</th>
                <th>Schedule</th>
                <th>{isMetric ? "OD (mm)" : "OD (in)"}</th>
                <th>{isMetric ? "Wall thk (mm)" : "Wall thk (in)"}</th>
                <th>{isMetric ? "ID (mm)" : "ID (in)"}</th>
                <th>{isMetric ? "Weight (kg/m)" : "Weight (lb/ft)"}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id}>
                  <td>{row.nps}</td>
                  <td>{row.attributes?.schedule ?? row.thickness ?? "—"}</td>
                  <td>{row.attributes?.od ?? "—"}</td>
                  <td>{row.attributes?.wallThk ?? "—"}</td>
                  <td>{row.attributes?.id ?? "—"}</td>
                  <td>{row.weightKg != null ? row.weightKg : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
