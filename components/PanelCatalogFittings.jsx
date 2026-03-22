"use client";

import { useMemo, useState, useEffect, useLayoutEffect } from "react";
import { matchEntrySearch, entryMatchesCatalogUnitSystem } from "@/lib/catalog-structure";
import {
  CatalogFacetDropdown,
  CatalogReadOnlyFacet,
  catalogPanelOuterClass,
} from "@/components/CatalogCategoryToolbar";
import { useCatalogToolbar } from "@/contexts/CatalogToolbarContext";

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

export default function PanelCatalogFittings({ entries, search = "", catalogUnitSystem }) {
  const [scheduleFilter, setScheduleFilter] = useState("");
  const [radiusFilter, setRadiusFilter] = useState("");
  const [angleFilter, setAngleFilter] = useState("");
  const [npsFilter, setNpsFilter] = useState("");
  const { setToolbar } = useCatalogToolbar();

  const scheduleOptions = useMemo(
    () => uniqueSortedStrings(entries.map((e) => e.attributes?.schedule ?? e.thickness)),
    [entries]
  );

  const radiusOptions = useMemo(
    () => uniqueSortedStrings(entries.map((e) => e.attributes?.radius)),
    [entries]
  );

  const angleOptions = useMemo(
    () => uniqueSortedStrings(entries.map((e) => e.attributes?.angle)),
    [entries]
  );

  const npsOptions = useMemo(
    () => uniqueSortedStrings(entries.map((e) => e.nps)),
    [entries]
  );

  useEffect(() => {
    setNpsFilter("");
  }, [catalogUnitSystem]);

  useLayoutEffect(() => {
    setToolbar(
      <>
        <CatalogReadOnlyFacet label="Category" value="Fittings" />
        {npsOptions.length > 0 ? (
          <CatalogFacetDropdown
            label="Size (NPS / NB)"
            options={[{ id: "", label: "All sizes" }, ...npsOptions.map((n) => ({ id: n, label: n }))]}
            activeId={npsFilter}
            onSelect={setNpsFilter}
          />
        ) : null}
        {scheduleOptions.length > 0 ? (
          <CatalogFacetDropdown
            label="Schedule"
            options={[{ id: "", label: "All schedules" }, ...scheduleOptions.map((s) => ({ id: s, label: s }))]}
            activeId={scheduleFilter}
            onSelect={setScheduleFilter}
          />
        ) : null}
        {radiusOptions.length > 0 ? (
          <CatalogFacetDropdown
            label="Radius"
            options={[{ id: "", label: "All" }, ...radiusOptions.map((r) => ({ id: r, label: r }))]}
            activeId={radiusFilter}
            onSelect={setRadiusFilter}
          />
        ) : null}
        {angleOptions.length > 0 ? (
          <CatalogFacetDropdown
            label="Angle"
            options={[{ id: "", label: "All" }, ...angleOptions.map((a) => ({ id: a, label: a }))]}
            activeId={angleFilter}
            onSelect={setAngleFilter}
          />
        ) : null}
      </>
    );
    return () => setToolbar(null);
  }, [
    setToolbar,
    npsOptions,
    scheduleOptions,
    radiusOptions,
    angleOptions,
    npsFilter,
    scheduleFilter,
    radiusFilter,
    angleFilter,
  ]);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (!entryMatchesCatalogUnitSystem(e, catalogUnitSystem)) return false;
      if (npsFilter && String(e.nps ?? "").trim() !== npsFilter) return false;
      if (scheduleFilter && String(e.attributes?.schedule ?? e.thickness ?? "") !== scheduleFilter) return false;
      if (radiusFilter && String(e.attributes?.radius ?? "") !== radiusFilter) return false;
      if (angleFilter && String(e.attributes?.angle ?? "") !== angleFilter) return false;
      if (!matchEntrySearch(e, search)) return false;
      return true;
    });
  }, [entries, catalogUnitSystem, npsFilter, scheduleFilter, radiusFilter, angleFilter, search]);

  if (!entries.length) {
    return (
      <div className="rounded-xl border border-base-300 bg-base-200/60 p-6 text-center text-base-content/70">
        No fittings data available. Ensure the reference database folder is present.
      </div>
    );
  }

  const isMetric = catalogUnitSystem === "Metric";

  return (
    <div className={catalogPanelOuterClass}>
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)] gap-3 min-h-0">
          <div className="rounded-lg border border-base-300 bg-base-100 p-3 flex flex-col gap-2 min-h-[200px]">
            <h2 className="text-sm font-semibold truncate">Fittings</h2>
            <div className="flex-1 flex items-center justify-center bg-base-200 rounded-md overflow-hidden border border-base-300/70 min-h-[160px]">
              {/* eslint-disable-next-line @next/next/no-img-element -- static bundled reference art */}
              <img
                src="/catalog/fittings.svg"
                alt=""
                className="max-h-full max-w-full object-contain pointer-events-none select-none opacity-90"
              />
            </div>
          </div>
          <div className="flex-1 overflow-auto rounded-xl min-h-0 border border-base-300 bg-base-100">
            <table className="table table-xs table-pin-rows">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>NPS / NB</th>
                  <th title="Same ASME pipe wall schedule as Pipe and weldneck flange bore (from Pipedata file name for each fitting type).">
                    Schedule
                  </th>
                  <th>Radius</th>
                  <th>Angle</th>
                  <th>{isMetric ? "OD (mm)" : "OD (in)"}</th>
                  <th>{isMetric ? "Weight (kg)" : "Weight (lb)"}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id}>
                    <td>{row.partTypeLabel}</td>
                    <td>{row.nps}</td>
                    <td>{row.attributes?.schedule ?? row.thickness ?? "—"}</td>
                    <td>{row.attributes?.radius ?? "—"}</td>
                    <td>{row.attributes?.angle ?? "—"}</td>
                    <td>{row.attributes?.od ?? "—"}</td>
                    <td>{row.weightKg != null ? row.weightKg : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
