"use client";

import { useMemo, useState, useCallback, Fragment } from "react";
import { getWeldName } from "@/lib/weld-utils";
import { getResolvedWpsCode } from "@/lib/wps-resolution";

function SettingsWqrRegistry({
  wqrs = [],
  welders = [],
  weldPoints = [],
  systems = [],
  lines = [],
  spools = [],
  wpsLibrary = [],
  wqrDocuments = [],
  onAddWqr,
  onUpdateWqr,
  onRemoveWqr,
  onToggleWelderWqr,
  wqrUploadInputRef,
  wqrUploadTargetRef,
}) {
  const [filter, setFilter] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const filterNorm = (filter || "").trim().toLowerCase();

  const rows = useMemo(() => {
    const list = wqrs.map((entry) => ({
      key: entry.id,
      entry,
      code: (entry.code || "").trim(),
      description: (entry.description || "").trim(),
      documentId: entry.documentId || null,
    }));
    if (!filterNorm) return list;
    return list.filter((r) => {
      const c = r.code.toLowerCase();
      const d = r.description.toLowerCase();
      return c.includes(filterNorm) || d.includes(filterNorm);
    });
  }, [wqrs, filterNorm]);

  const weldersWithWqr = useCallback(
    (wqrId) =>
      welders.filter((w) => (w.wqrIds || []).includes(wqrId)).map((w) => ({ id: w.id, name: w.name || "—" })),
    [welders]
  );

  const weldsForWqr = useCallback(
    (wqrId) => {
      if (!wqrId) return [];
      return weldPoints.filter((w) =>
        (w.weldingRecords || []).some((rec) => (rec.wqrIds || []).includes(wqrId))
      );
    },
    [weldPoints]
  );

  const wpsCodesForWelds = useCallback(
    (welds) => {
      const codes = new Set();
      for (const w of welds) {
        const code = (getResolvedWpsCode(w, systems, lines, spools) || "").trim();
        if (code) codes.add(code);
        const libId = w.wpsLibraryEntryId;
        if (libId) {
          const lib = wpsLibrary.find((e) => e.id === libId);
          if (lib?.code) codes.add((lib.code || "").trim());
        }
      }
      return [...codes].filter(Boolean).sort((a, b) => a.localeCompare(b));
    },
    [systems, lines, spools, wpsLibrary]
  );

  return (
    <div className="space-y-3 min-w-0">
      <p className="text-xs text-base-content/70">
        Register WQR codes and PDFs, then assign them to welders. Welding records on welds only use WQRs linked
        here.
      </p>
      <div className="flex flex-col sm:flex-row gap-2 sm:items-end sm:justify-between">
        <div className="form-control flex-1 min-w-0 max-w-md">
          <label className="label py-0" htmlFor="wqr-registry-filter">
            <span className="label-text text-xs">Search</span>
          </label>
          <input
            id="wqr-registry-filter"
            type="search"
            className="input input-bordered input-xs w-full"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Code, description…"
            autoComplete="off"
          />
        </div>
        <button type="button" className="btn btn-primary btn-sm shrink-0" onClick={() => onAddWqr?.()}>
          + Add WQR
        </button>
      </div>

      <div className="overflow-x-auto border border-base-300 rounded-lg">
        <table className="table table-xs table-pin-rows">
          <thead>
            <tr className="bg-base-200">
              <th>Code</th>
              <th>Description</th>
              <th>PDF</th>
              <th className="tabular-nums">Welders</th>
              <th className="tabular-nums">Welds</th>
              <th className="w-28"> </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-base-content/50 py-6">
                  No WQR entries. Add a row or assign WQRs to welders from the weld form after registering here.
                </td>
              </tr>
            )}
            {rows.map((row) => {
              const wqrId = row.entry.id;
              const assigned = weldersWithWqr(wqrId);
              const welds = weldsForWqr(wqrId);
              const wpsList = wpsCodesForWelds(welds);
              const isOpen = expandedId === row.key;
              const doc = row.documentId ? wqrDocuments.find((d) => d.id === row.documentId) : null;

              return (
                <Fragment key={row.key}>
                  <tr className={`hover ${isOpen ? "bg-base-200/80" : ""}`}>
                    <td>
                      <input
                        type="text"
                        className="input input-bordered input-xs w-full min-w-[6rem] font-mono"
                        value={row.entry.code || ""}
                        onChange={(e) => onUpdateWqr?.(wqrId, { code: e.target.value.toUpperCase() })}
                        placeholder="WQR code"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="input input-bordered input-xs w-full min-w-[10rem]"
                        value={row.entry.description || ""}
                        onChange={(e) => onUpdateWqr?.(wqrId, { description: e.target.value })}
                        placeholder="Notes"
                      />
                    </td>
                    <td>
                      <div className="flex gap-1 items-center">
                        <select
                          className="select select-bordered select-xs min-w-[7rem] max-w-[12rem]"
                          value={row.documentId || ""}
                          onChange={(e) => onUpdateWqr?.(wqrId, { documentId: e.target.value || null })}
                        >
                          <option value="">No PDF</option>
                          {wqrDocuments.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.title || d.fileName}
                            </option>
                          ))}
                        </select>
                        {!row.documentId && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            onClick={() => {
                              wqrUploadTargetRef.current = wqrId;
                              wqrUploadInputRef.current?.click();
                            }}
                          >
                            Load
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="text-center tabular-nums">{assigned.length}</td>
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
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs text-error"
                          onClick={() => onRemoveWqr?.(wqrId)}
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="bg-base-200/50">
                      <td colSpan={6} className="!pt-2 !pb-3">
                        <div className="text-xs space-y-2 px-1">
                          <p className="font-medium text-base-content/80">Assign to welders</p>
                          {welders.length === 0 ? (
                            <p className="text-base-content/50">Add welders under Personnel first.</p>
                          ) : (
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                              {welders.map((w) => {
                                const checked = (w.wqrIds || []).includes(wqrId);
                                return (
                                  <label key={w.id} className="label cursor-pointer gap-2 py-0">
                                    <input
                                      type="checkbox"
                                      className="checkbox checkbox-xs"
                                      checked={checked}
                                      onChange={(e) =>
                                        onToggleWelderWqr?.(w.id, wqrId, e.target.checked)
                                      }
                                    />
                                    <span className="label-text">{w.name || "—"}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                          <p className="font-medium text-base-content/80 pt-1">Related welds</p>
                          {welds.length === 0 ? (
                            <p className="text-base-content/50">No welding records reference this WQR yet.</p>
                          ) : (
                            <ul className="list-disc list-inside space-y-0.5">
                              {welds.map((w) => (
                                <li key={w.id}>
                                  <span className="font-mono">{getWeldName(w, weldPoints)}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                          <p className="font-medium text-base-content/80 pt-1">WPS on those welds</p>
                          {wpsList.length === 0 ? (
                            <p className="text-base-content/50">—</p>
                          ) : (
                            <p className="font-mono">{wpsList.join(", ")}</p>
                          )}
                          {doc && (
                            <p className="pt-1">
                              <span className="text-base-content/60">Linked PDF:</span>{" "}
                              <span className="font-medium">{doc.title || doc.fileName}</span>
                            </p>
                          )}
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

export default SettingsWqrRegistry;
