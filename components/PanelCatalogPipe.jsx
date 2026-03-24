"use client";

import { useMemo } from "react";
import {
  matchEntrySearch,
  entryMatchesCatalogUnitSystem,
  catalogFacetMatchesScalar,
} from "@/lib/catalog-structure";
import {
  catalogPanelOuterClass,
  catalogMainGridClass,
  catalogTableScrollClass,
  catalogTableClassName,
} from "@/components/CatalogCategoryToolbar";

export default function PanelCatalogPipe({
  entries,
  search = "",
  catalogUnitSystem,
  catalogFacets = {},
}) {
  const npsFilter = catalogFacets.p_nps ?? "";
  const scheduleFilter = catalogFacets.p_schedule ?? "";
  const formFilter = catalogFacets.p_form ?? "";
  const odFilter = catalogFacets.p_od ?? "";
  const wallThkFilter = catalogFacets.p_wall ?? "";
  const idFilter = catalogFacets.p_id ?? "";

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
        <div className={catalogMainGridClass}>
          <div className={`flex-1 ${catalogTableScrollClass} rounded-xl min-h-[200px] lg:min-h-0`}>
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
        </div>
      </div>
    </div>
  );
}
