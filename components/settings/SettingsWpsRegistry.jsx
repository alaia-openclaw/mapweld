"use client";

import { useMemo, useState, useCallback, Fragment } from "react";
import { getWeldName } from "@/lib/weld-utils";

/**
 * WPS library: title + description only. Welds link via wpsLibraryEntryId.
 */
function SettingsWpsRegistry({
  wpsLibrary = [],
  weldPoints = [],
  personnel = { welders: [], wqrs: [] },
  wpsDocuments = [],
  onAddWps,
  onUpdateWps,
  onRemoveWps,
}) {
  const [filter, setFilter] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const filterNorm = (filter || "").trim().toLowerCase();

  const wqrs = useMemo(() => personnel.wqrs || [], [personnel]);

  const rows = useMemo(() => {
    const list = wpsLibrary.map((entry) => ({
      key: entry.id,
      entry,
      title: entry.title || "",
      description: entry.description || "",
    }));
    if (!filterNorm) return list;
    return list.filter((r) => {
      const t = (r.title || "").toLowerCase();
      const d = (r.description || "").toLowerCase();
      return t.includes(filterNorm) || d.includes(filterNorm);
    });
  }, [wpsLibrary, filterNorm]);

  const weldsForEntry = useCallback(
    (entryId) => {
      if (!entryId) return [];
      return weldPoints.filter((w) => w.wpsLibraryEntryId === entryId);
    },
    [weldPoints]
  );

  const wqrCodesForWelds = useCallback(
    (welds) => {
      const ids = new Set();
      for (const w of welds) {
        for (const r of w.weldingRecords || []) {
          for (const id of r.wqrIds || []) ids.add(id);
        }
      }
      return [...ids]
        .map((id) => wqrs.find((q) => q.id === id))
        .filter(Boolean)
        .map((q) => (q.code || "").trim())
        .filter(Boolean);
    },
    [wqrs]
  );

  return (
    <div className="space-y-3 min-w-0">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-end sm:justify-between">
        <div className="form-control flex-1 min-w-0 max-w-md">
          <label className="label py-0" htmlFor="wps-registry-filter">
            <span className="label-text text-xs">Search</span>
          </label>
          <input
            id="wps-registry-filter"
            type="search"
            className="input input-bordered input-xs w-full"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Title, description…"
            autoComplete="off"
          />
        </div>
        <button type="button" className="btn btn-primary btn-sm shrink-0" onClick={() => onAddWps?.()}>
          + Add WPS
        </button>
      </div>

      <div className="overflow-x-auto border border-base-300 rounded-lg">
        <table className="table table-xs table-pin-rows">
          <thead>
            <tr className="bg-base-200">
              <th>Title</th>
              <th>Description</th>
              <th className="w-28"> </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center text-base-content/50 py-6">
                  No WPS entries.
                </td>
              </tr>
            )}
            {rows.map((row) => {
              const entry = row.entry;
              const welds = weldsForEntry(entry.id);
              const wqrList = wqrCodesForWelds(welds);
              const isOpen = expandedId === row.key;
              const doc =
                entry?.documentId ? wpsDocuments.find((d) => d.id === entry.documentId) : null;

              return (
                <Fragment key={row.key}>
                  <tr className={`hover ${isOpen ? "bg-base-200/80" : ""}`}>
                    <td>
                      <input
                        type="text"
                        className="input input-bordered input-xs w-full min-w-[8rem]"
                        value={entry.title || ""}
                        onChange={(e) => onUpdateWps(entry.id, { title: e.target.value })}
                        placeholder="Title"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="input input-bordered input-xs w-full min-w-[10rem]"
                        value={entry.description || ""}
                        onChange={(e) => onUpdateWps(entry.id, { description: e.target.value })}
                        placeholder="Description"
                      />
                    </td>
                    <td>
                      <div className="flex gap-1 justify-end">
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs"
                          onClick={() => setExpandedId(isOpen ? null : row.key)}
                        >
                          {isOpen ? "Hide" : "Links"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs text-error"
                          onClick={() => onRemoveWps(entry.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="bg-base-200/40">
                      <td colSpan={3} className="!p-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div>
                            <p className="font-semibold text-base-content/80 mb-1">Related welds</p>
                            {welds.length === 0 ? (
                              <p className="text-base-content/50">None (assign this WPS on a weld via the weld form)</p>
                            ) : (
                              <ul className="space-y-1 max-h-40 overflow-y-auto">
                                {welds.map((w) => (
                                  <li key={w.id} className="flex justify-between gap-2">
                                    <span>{getWeldName(w, weldPoints)}</span>
                                    <span className="text-base-content/50 font-mono truncate max-w-[40%]">{w.id}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-base-content/80 mb-1">WQR codes (welding records)</p>
                            {wqrList.length === 0 ? (
                              <p className="text-base-content/50">None linked on these welds</p>
                            ) : (
                              <ul className="flex flex-wrap gap-1">
                                {wqrList.map((code, i) => (
                                  <li key={`${code}-${i}`} className="badge badge-outline badge-sm">
                                    {code}
                                  </li>
                                ))}
                              </ul>
                            )}
                            {doc && (
                              <p className="mt-2 text-base-content/60">
                                Linked WPS PDF: <strong>{doc.title || doc.fileName}</strong>
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SettingsWpsRegistry;
