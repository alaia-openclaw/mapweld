"use client";

import { useMemo } from "react";
import { matchEntrySearch, matchEntryFilters } from "@/lib/catalog-structure";

export default function PanelCatalogFittings({ entries, search = "", filters = [] }) {
  const filtered = useMemo(() => {
    return entries.filter(
      (e) => matchEntrySearch(e, search) && matchEntryFilters(e, filters)
    );
  }, [entries, search, filters]);

  if (!entries.length) {
    return (
      <div className="rounded-xl border border-base-300 bg-base-200/60 p-6 text-center text-base-content/70">
        No fittings data available. Ensure the reference database folder is present.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-10rem)] min-h-[380px] rounded-xl border border-base-300 bg-base-200/60 overflow-hidden">
      <div className="flex-1 overflow-auto rounded-xl">
        <table className="table table-xs table-pin-rows">
          <thead>
            <tr>
              <th>Type</th>
              <th>NPS / NB</th>
              <th>Schedule</th>
              <th>OD</th>
              <th>Weight (kg)</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id}>
                <td>{row.partTypeLabel}</td>
                <td>{row.nps}</td>
                <td>{row.attributes?.schedule ?? row.thickness ?? "—"}</td>
                <td>{row.attributes?.od ?? "—"}</td>
                <td>{row.weightKg != null ? row.weightKg : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
