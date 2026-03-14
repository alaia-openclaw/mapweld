"use client";

import { useMemo } from "react";
import { matchEntrySearch, matchEntryFilters } from "@/lib/catalog-structure";

export default function PanelCatalogPipe({ entries, search = "", filters = [] }) {
  const filtered = useMemo(() => {
    return entries.filter(
      (e) => matchEntrySearch(e, search) && matchEntryFilters(e, filters)
    );
  }, [entries, search, filters]);

  if (!entries.length) {
    return (
      <div className="rounded-xl border border-base-300 bg-base-200/60 p-6 text-center text-base-content/70">
        No pipe data available. Ensure the reference database folder is present.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-10rem)] min-h-[380px] rounded-xl border border-base-300 bg-base-200/60 overflow-hidden">
      <div className="flex-1 overflow-auto rounded-xl">
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
  );
}
