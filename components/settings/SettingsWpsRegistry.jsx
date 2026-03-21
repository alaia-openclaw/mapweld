"use client";

import { useMemo, useState, useCallback, Fragment } from "react";
import { getWeldName } from "@/lib/weld-utils";
import { getResolvedWpsCode } from "@/lib/wps-resolution";

/**
 * Unified WPS table: library rows + weld-only codes. Detail shows related welds and WQR codes used on those welds.
 */
function SettingsWpsRegistry({
  wpsLibrary = [],
  weldPoints = [],
  systems = [],
  lines = [],
  spools = [],
  personnel = { welders: [], wqrs: [] },
  wpsDocuments = [],
  onAddWps,
  onUpdateWps,
  onRemoveWps,
  wpsUploadInputRef,
  wpsUploadTargetRef,
}) {
  const [filter, setFilter] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const filterNorm = (filter || "").trim().toLowerCase();

  const wqrs = useMemo(() => personnel.wqrs || [], [personnel]);

  const orphanCodes = useMemo(() => {
    const lib = new Set(
      wpsLibrary.map((e) => (e.code || "").trim().toLowerCase()).filter(Boolean)
    );
    const seen = new Map();
    for (const w of weldPoints) {
      const raw = (w?.wps || "").trim();
      if (!raw) continue;
      const k = raw.toLowerCase();
      if (lib.has(k)) continue;
      if (!seen.has(k)) seen.set(k, raw);
    }
    return [...seen.values()].sort((a, b) => a.localeCompare(b));
  }, [weldPoints, wpsLibrary]);

  const rows = useMemo(() => {
    const libRows = wpsLibrary.map((entry) => ({
      key: entry.id,
      kind: "library",
      entry,
      code: (entry.code || "").trim(),
      title: entry.title || "",
      description: entry.description || "",
      documentId: entry.documentId || null,
    }));
    const orphanRows = orphanCodes.map((code) => ({
      key: `orphan-${code}`,
      kind: "orphan",
      entry: null,
      code,
      title: "",
      description: "",
      documentId: null,
    }));
    const merged = [...libRows, ...orphanRows];
    if (!filterNorm) return merged;
    return merged.filter((r) => {
      const c = (r.code || "").toLowerCase();
      const t = (r.title || "").toLowerCase();
      const d = (r.description || "").toLowerCase();
      return c.includes(filterNorm) || t.includes(filterNorm) || d.includes(filterNorm);
    });
  }, [wpsLibrary, orphanCodes, filterNorm]);

  const weldsForCode = useCallback(
    (code) => {
      const c = (code || "").trim().toLowerCase();
      if (!c) return [];
      return weldPoints.filter((w) => {
        const direct = (w.wps || "").trim().toLowerCase();
        if (direct === c) return true;
        const resolved = getResolvedWpsCode(w, systems, lines, spools);
        return (resolved || "").trim().toLowerCase() === c && direct === "";
      });
    },
    [weldPoints, systems, lines, spools]
  );

  const weldsForRow = useCallback(
    (row) => {
      if (row.kind === "library" && row.entry) {
        const id = row.entry.id;
        const codeLower = (row.code || "").trim().toLowerCase();
        return weldPoints.filter((w) => {
          if (w.wpsLibraryEntryId === id) return true;
          const direct = (w.wps || "").trim().toLowerCase();
          return direct && direct === codeLower;
        });
      }
      return weldsForCode(row.code);
    },
    [weldPoints, weldsForCode]
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
            placeholder="Code, title, description…"
            autoComplete="off"
          />
        </div>
        <button type="button" className="btn btn-primary btn-sm shrink-0" onClick={onAddWps}>
          + Add WPS
        </button>
      </div>

      {orphanCodes.length > 0 && (
        <div className="rounded-lg border border-warning/40 bg-warning/5 px-3 py-2 text-xs text-base-content/90">
          <span className="font-medium text-warning">Custom / weld-only WPS:</span>{" "}
          {orphanCodes.join(", ")} — add matching library rows below or align weld codes.
        </div>
      )}

      <div className="overflow-x-auto border border-base-300 rounded-lg">
        <table className="table table-xs table-pin-rows">
          <thead>
            <tr className="bg-base-200">
              <th>Code</th>
              <th>Title</th>
              <th>Description</th>
              <th>PDF</th>
              <th>Source</th>
              <th>Welds</th>
              <th className="w-24"> </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-base-content/50 py-6">
                  No WPS entries.
                </td>
              </tr>
            )}
            {rows.map((row) => {
              const welds = weldsForRow(row);
              const wqrList = wqrCodesForWelds(welds);
              const isOpen = expandedId === row.key;
              const doc =
                row.kind === "library" && row.entry?.documentId
                  ? wpsDocuments.find((d) => d.id === row.entry.documentId)
                  : null;

              return (
                <Fragment key={row.key}>
                  <tr className={`hover ${isOpen ? "bg-base-200/80" : ""}`}>
                    <td className="font-mono text-xs">
                      {row.kind === "library" ? (
                        <input
                          type="text"
                          className="input input-bordered input-xs w-full min-w-[6rem]"
                          value={row.entry.code || ""}
                          onChange={(e) => onUpdateWps(row.entry.id, { code: e.target.value.toUpperCase() })}
                          placeholder="WPS code"
                        />
                      ) : (
                        <span title="Set on weld only">{row.code}</span>
                      )}
                    </td>
                    <td>
                      {row.kind === "library" ? (
                        <input
                          type="text"
                          className="input input-bordered input-xs w-full min-w-[8rem]"
                          value={row.entry.title || ""}
                          onChange={(e) => onUpdateWps(row.entry.id, { title: e.target.value })}
                          placeholder="Title"
                        />
                      ) : (
                        <span className="text-base-content/50">—</span>
                      )}
                    </td>
                    <td>
                      {row.kind === "library" ? (
                        <input
                          type="text"
                          className="input input-bordered input-xs w-full min-w-[10rem]"
                          value={row.entry.description || ""}
                          onChange={(e) => onUpdateWps(row.entry.id, { description: e.target.value })}
                          placeholder="Short description"
                        />
                      ) : (
                        <span className="text-base-content/50">—</span>
                      )}
                    </td>
                    <td>
                      {row.kind === "library" ? (
                        <div className="flex gap-1 items-center">
                          <select
                            className="select select-bordered select-xs min-w-[7rem] max-w-[12rem]"
                            value={row.entry.documentId || ""}
                            onChange={(e) =>
                              onUpdateWps(row.entry.id, { documentId: e.target.value || null })
                            }
                          >
                            <option value="">No PDF</option>
                            {wpsDocuments.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.title || d.fileName}
                              </option>
                            ))}
                          </select>
                          {!row.entry.documentId && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs"
                              onClick={() => {
                                wpsUploadTargetRef.current = row.entry.id;
                                wpsUploadInputRef.current?.click();
                              }}
                            >
                              Load
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-base-content/50">—</span>
                      )}
                    </td>
                    <td>
                      {row.kind === "library" ? (
                        <span className="badge badge-ghost badge-sm">Library</span>
                      ) : (
                        <span className="badge badge-warning badge-sm">Weld only</span>
                      )}
                    </td>
                    <td className="text-center tabular-nums">{welds.length}</td>
                    <td>
                      <div className="flex gap-1 justify-end">
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs"
                          onClick={() => setExpandedId(isOpen ? null : row.key)}
                        >
                          {isOpen ? "Hide" : "Links"}
                        </button>
                        {row.kind === "library" && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs text-error"
                            onClick={() => onRemoveWps(row.entry.id)}
                          >
                            Remove
                          </button>
                        )}
                        {row.kind === "orphan" && (
                          <button
                            type="button"
                            className="btn btn-outline btn-xs"
                            title="Create library row with this code"
                            onClick={() => {
                              onAddWps?.(row.code);
                            }}
                          >
                            Register
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="bg-base-200/40">
                      <td colSpan={7} className="!p-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div>
                            <p className="font-semibold text-base-content/80 mb-1">Related welds</p>
                            {welds.length === 0 ? (
                              <p className="text-base-content/50">None</p>
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
                              <p className="text-base-content/50">None linked on welds using this WPS</p>
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
