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

export default function PanelCatalogFittings({
  entries,
  search = "",
  catalogUnitSystem,
  catalogFacets = {},
}) {
  const partTypeFilter = catalogFacets.f_part ?? "";
  const npsFilter = catalogFacets.f_nps ?? "";
  const scheduleFilter = catalogFacets.f_schedule ?? "";
  const radiusFilter = catalogFacets.f_radius ?? "";
  const angleFilter = catalogFacets.f_angle ?? "";
  const odFilter = catalogFacets.f_od ?? "";

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (!entryMatchesCatalogUnitSystem(e, catalogUnitSystem)) return false;
      if (partTypeFilter && String(e.partTypeLabel ?? "").trim() !== partTypeFilter) return false;
      if (npsFilter && String(e.nps ?? "").trim() !== npsFilter) return false;
      if (scheduleFilter && String(e.attributes?.schedule ?? e.thickness ?? "") !== scheduleFilter) return false;
      if (radiusFilter && String(e.attributes?.radius ?? "") !== radiusFilter) return false;
      if (angleFilter && String(e.attributes?.angle ?? "") !== angleFilter) return false;
      if (!catalogFacetMatchesScalar(e.attributes?.od, odFilter)) return false;
      if (!matchEntrySearch(e, search)) return false;
      return true;
    });
  }, [
    entries,
    catalogUnitSystem,
    partTypeFilter,
    npsFilter,
    scheduleFilter,
    radiusFilter,
    angleFilter,
    odFilter,
    search,
  ]);

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
        <div className={catalogMainGridClass}>
          <div className={`flex-1 ${catalogTableScrollClass} rounded-xl min-h-[200px] lg:min-h-0`}>
            <table className={catalogTableClassName}>
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
        </div>
      </div>
    </div>
  );
}
