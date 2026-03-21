"use client";

import { useMemo } from "react";
import {
  matchEntrySearch,
  matchEntryFilters,
  entryMatchesCatalogUnitSystem,
} from "@/lib/catalog-structure";

export default function PanelCatalogPipe({
  entries,
  search = "",
  filters = [],
  catalogUnitSystem,
}) {
  const filtered = useMemo(() => {
    return entries.filter(
      (e) =>
        entryMatchesCatalogUnitSystem(e, catalogUnitSystem) &&
        matchEntrySearch(e, search) &&
        matchEntryFilters(e, filters)
    );
  }, [entries, search, filters, catalogUnitSystem]);

  if (!entries.length) {
    return (
      <div className="rounded-xl border border-base-300 bg-base-200/60 p-6 text-center text-base-content/70">
        No pipe data available. Ensure the reference database folder is present.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-10rem)] min-h-[380px] rounded-xl border border-base-300 bg-base-200/60 overflow-hidden">
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
                <th>OD</th>
                <th>Wall thk</th>
                <th>ID</th>
                <th>Weight (kg/m)</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id}>
                  <td>{row.nps}</td>
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
