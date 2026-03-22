"use client";

import { useMemo, useState, useEffect } from "react";
import {
  matchEntrySearch,
  entryMatchesCatalogUnitSystem,
  uniqueSortedFacetValues,
  catalogFacetMatchesScalar,
} from "@/lib/catalog-structure";
import {
  CatalogFacetDropdown,
  catalogPanelOuterClass,
  catalogPanelToolbarClass,
  catalogTableScrollClass,
  catalogTableClassName,
} from "@/components/CatalogCategoryToolbar";

export default function PanelCatalogPipe({ entries, search = "", catalogUnitSystem }) {
  const [scheduleFilter, setScheduleFilter] = useState("");
  const [formFilter, setFormFilter] = useState("");
  const [npsFilter, setNpsFilter] = useState("");
  const [odFilter, setOdFilter] = useState("");
  const [wallThkFilter, setWallThkFilter] = useState("");
  const [idFilter, setIdFilter] = useState("");

  const scheduleOptions = useMemo(
    () => uniqueSortedFacetValues(entries.map((e) => e.attributes?.schedule)),
    [entries]
  );

  const formOptions = useMemo(
    () => uniqueSortedFacetValues(entries.map((e) => e.attributes?.pipeForm ?? "Seamless")),
    [entries]
  );

  const npsOptions = useMemo(
    () => uniqueSortedFacetValues(entries.map((e) => e.nps)),
    [entries]
  );

  const odOptions = useMemo(
    () => uniqueSortedFacetValues(entries.map((e) => e.attributes?.od)),
    [entries]
  );

  const wallThkOptions = useMemo(
    () => uniqueSortedFacetValues(entries.map((e) => e.attributes?.wallThk)),
    [entries]
  );

  const idOptions = useMemo(
    () => uniqueSortedFacetValues(entries.map((e) => e.attributes?.id)),
    [entries]
  );

  useEffect(() => {
    setNpsFilter("");
    setOdFilter("");
    setWallThkFilter("");
    setIdFilter("");
  }, [catalogUnitSystem]);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (!entryMatchesCatalogUnitSystem(e, catalogUnitSystem)) return false;
      if (npsFilter && String(e.nps ?? "").trim() !== npsFilter) return false;
      if (scheduleFilter && String(e.attributes?.schedule ?? "") !== scheduleFilter) return false;
      if (formFilter && String(e.attributes?.pipeForm ?? "Seamless") !== formFilter) return false;
      if (!catalogFacetMatchesScalar(e.attributes?.od, odFilter)) return false;
      if (!catalogFacetMatchesScalar(e.attributes?.wallThk, wallThkFilter)) return false;
      if (!catalogFacetMatchesScalar(e.attributes?.id, idFilter)) return false;
      if (!matchEntrySearch(e, search)) return false;
      return true;
    });
  }, [
    entries,
    catalogUnitSystem,
    npsFilter,
    scheduleFilter,
    formFilter,
    odFilter,
    wallThkFilter,
    idFilter,
    search,
  ]);

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
      <div className="flex-1 flex flex-col min-h-0">
        <div className={catalogPanelToolbarClass}>
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
          {formOptions.length > 0 ? (
            <CatalogFacetDropdown
              label="Form"
              options={[{ id: "", label: "All" }, ...formOptions.map((f) => ({ id: f, label: f }))]}
              activeId={formFilter}
              onSelect={setFormFilter}
            />
          ) : null}
          {odOptions.length > 0 ? (
            <CatalogFacetDropdown
              label={catalogUnitSystem === "Metric" ? "OD (mm)" : "OD (in)"}
              options={[{ id: "", label: "All" }, ...odOptions.map((o) => ({ id: o, label: o }))]}
              activeId={odFilter}
              onSelect={setOdFilter}
            />
          ) : null}
          {wallThkOptions.length > 0 ? (
            <CatalogFacetDropdown
              label={catalogUnitSystem === "Metric" ? "Wall thk (mm)" : "Wall thk (in)"}
              options={[{ id: "", label: "All" }, ...wallThkOptions.map((w) => ({ id: w, label: w }))]}
              activeId={wallThkFilter}
              onSelect={setWallThkFilter}
            />
          ) : null}
          {idOptions.length > 0 ? (
            <CatalogFacetDropdown
              label={catalogUnitSystem === "Metric" ? "ID (mm)" : "ID (in)"}
              options={[{ id: "", label: "All" }, ...idOptions.map((i) => ({ id: i, label: i }))]}
              activeId={idFilter}
              onSelect={setIdFilter}
            />
          ) : null}
        </div>
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)] gap-3 min-h-0">
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
          <div className={`flex-1 ${catalogTableScrollClass} rounded-xl`}>
            <table className={catalogTableClassName}>
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
    </div>
  );
}
