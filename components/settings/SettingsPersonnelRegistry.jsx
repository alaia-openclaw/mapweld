"use client";

import { useState, useMemo, useCallback, Fragment } from "react";
import { getWeldName } from "@/lib/weld-utils";
import { getResolvedWpsCode } from "@/lib/wps-resolution";

/**
 * Fitters + welders; WQR nested under each welder (compact, classic card layout — not a flat spreadsheet grid).
 */
function SettingsPersonnelRegistry({
  fitters = [],
  welders = [],
  wqrs = [],
  wqrDocuments = [],
  weldPoints = [],
  systems = [],
  lines = [],
  spools = [],
  wpsLibrary = [],
  onAddFitter,
  onRemoveFitter,
  onUpdateFitterName,
  onAddWelder,
  onRemoveWelder,
  onUpdateWelderName,
  onAddWqrForWelder,
  onUpdateWqr,
  onUnlinkWqrFromWelder,
  onDeleteWqr,
  wqrUploadInputRef,
  wqrUploadTargetRef,
}) {
  const [fitterInput, setFitterInput] = useState("");
  const [welderInput, setWelderInput] = useState("");
  const [expandedWqrId, setExpandedWqrId] = useState(null);

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

  const wqrById = useMemo(() => {
    const m = new Map();
    (wqrs || []).forEach((q) => m.set(q.id, q));
    return m;
  }, [wqrs]);

  return (
    <div className="space-y-5 min-w-0 text-xs">
      <p className="text-[11px] text-base-content/65 leading-snug">
        Fitters and welders for weld forms. Add WQR qualifications inside each welder block.
      </p>

      {/* Fitters */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <h4 className="font-medium text-xs text-base-content/80">Fitters</h4>
          <form
            className="flex gap-2 flex-1 max-w-md"
            onSubmit={(e) => {
              e.preventDefault();
              if (!fitterInput.trim()) return;
              onAddFitter?.(fitterInput.trim());
              setFitterInput("");
            }}
          >
            <input
              type="text"
              className="input input-bordered input-xs flex-1"
              value={fitterInput}
              onChange={(e) => setFitterInput(e.target.value)}
              placeholder="Fitter name"
            />
            <button type="submit" className="btn btn-primary btn-xs shrink-0">
              Add
            </button>
          </form>
        </div>
        <div className="overflow-x-auto border border-base-300 rounded-lg">
          <table className="table table-xs table-pin-rows">
            <thead>
              <tr className="bg-base-200">
                <th>Name</th>
                <th className="w-20 text-end"></th>
              </tr>
            </thead>
            <tbody>
              {fitters.length === 0 && (
                <tr>
                  <td colSpan={2} className="text-center text-base-content/50 py-4 text-[11px]">
                    No fitters yet.
                  </td>
                </tr>
              )}
              {fitters.map((f) => (
                <tr key={f.id} className="hover">
                  <td>
                    <input
                      type="text"
                      className="input input-bordered input-xs w-full max-w-md"
                      value={f.name || ""}
                      onChange={(e) => onUpdateFitterName?.(f.id, e.target.value)}
                      placeholder="Name"
                    />
                  </td>
                  <td className="text-end">
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs text-error"
                      onClick={() => onRemoveFitter?.(f.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Welders + nested WQR */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <h4 className="font-medium text-xs text-base-content/80">Welders &amp; WQR</h4>
          <form
            className="flex gap-2 flex-1 max-w-md"
            onSubmit={(e) => {
              e.preventDefault();
              if (!welderInput.trim()) return;
              onAddWelder?.(welderInput.trim());
              setWelderInput("");
            }}
          >
            <input
              type="text"
              className="input input-bordered input-xs flex-1"
              value={welderInput}
              onChange={(e) => setWelderInput(e.target.value)}
              placeholder="Welder name"
            />
            <button type="submit" className="btn btn-primary btn-xs shrink-0">
              Add
            </button>
          </form>
        </div>
        <div className="overflow-x-auto border border-base-300 rounded-lg">
          <table className="table table-xs">
            <thead>
              <tr className="bg-base-200">
                <th className="min-w-[9rem] max-w-[11rem]">Welder</th>
                <th className="min-w-0">WQR qualifications</th>
                <th className="w-24 text-end"></th>
              </tr>
            </thead>
            <tbody>
              {welders.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center text-base-content/50 py-4 text-[11px]">
                    No welders yet.
                  </td>
                </tr>
              )}
              {welders.map((w) => {
                const ids = w.wqrIds || [];
                return (
                  <tr key={w.id} className="align-top hover">
                    <td className="min-w-[8rem]">
                      <input
                        type="text"
                        className="input input-bordered input-xs w-full max-w-[12rem]"
                        value={w.name || ""}
                        onChange={(e) => onUpdateWelderName?.(w.id, e.target.value)}
                        placeholder="Welder name"
                      />
                    </td>
                    <td className="min-w-0 py-1.5">
                      <div className="rounded-md border border-base-300/80 bg-base-200/25 p-1.5 space-y-1.5">
                        {ids.length === 0 && (
                          <p className="text-[11px] text-base-content/50 px-0.5">No WQR yet.</p>
                        )}
                        {ids.map((wqrId) => {
                          const wqr = wqrById.get(wqrId);
                          if (!wqr) {
                            return (
                              <div
                                key={wqrId}
                                className="text-[11px] text-warning px-1 py-0.5 rounded bg-warning/10"
                              >
                                Missing WQR: {wqrId}
                              </div>
                            );
                          }
                          const welds = weldsForWqr(wqr.id);
                          const wpsList = wpsCodesForWelds(welds);
                          const isLinksOpen = expandedWqrId === wqr.id;
                          const doc = wqr.documentId
                            ? wqrDocuments.find((d) => d.id === wqr.documentId)
                            : null;

                          return (
                            <Fragment key={wqr.id}>
                              <div
                                className={`rounded border border-base-300/60 bg-base-100 p-1.5 space-y-1 ${
                                  isLinksOpen ? "ring-1 ring-primary/25" : ""
                                }`}
                              >
                                <div className="grid grid-cols-1 sm:grid-cols-[minmax(4.5rem,6.5rem)_1fr_minmax(6rem,9rem)_auto] gap-1 items-start">
                                  <input
                                    type="text"
                                    className="input input-bordered input-xs font-mono w-full"
                                    value={wqr.code || ""}
                                    onChange={(e) =>
                                      onUpdateWqr?.(wqr.id, { code: e.target.value.toUpperCase() })
                                    }
                                    placeholder="WQR code"
                                  />
                                  <input
                                    type="text"
                                    className="input input-bordered input-xs w-full min-w-0"
                                    value={wqr.description || ""}
                                    onChange={(e) =>
                                      onUpdateWqr?.(wqr.id, { description: e.target.value })
                                    }
                                    placeholder="Description"
                                  />
                                  <div className="flex gap-0.5 items-center min-w-0">
                                    <select
                                      className="select select-bordered select-xs flex-1 min-w-0 max-w-[11rem]"
                                      value={wqr.documentId || ""}
                                      onChange={(e) =>
                                        onUpdateWqr?.(wqr.id, {
                                          documentId: e.target.value || null,
                                        })
                                      }
                                    >
                                      <option value="">No PDF</option>
                                      {wqrDocuments.map((d) => (
                                        <option key={d.id} value={d.id}>
                                          {d.title || d.fileName}
                                        </option>
                                      ))}
                                    </select>
                                    {!wqr.documentId && (
                                      <button
                                        type="button"
                                        className="btn btn-ghost btn-xs shrink-0 px-1.5"
                                        onClick={() => {
                                          wqrUploadTargetRef.current = wqr.id;
                                          wqrUploadInputRef.current?.click();
                                        }}
                                      >
                                        Load
                                      </button>
                                    )}
                                  </div>
                                  <div className="flex gap-0.5 justify-end sm:justify-start flex-wrap">
                                    <button
                                      type="button"
                                      className="btn btn-ghost btn-xs px-1.5"
                                      onClick={() =>
                                        setExpandedWqrId(isLinksOpen ? null : wqr.id)
                                      }
                                    >
                                      {isLinksOpen ? "Hide" : "Links"}
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-ghost btn-xs text-error px-1.5"
                                      onClick={() => onUnlinkWqrFromWelder?.(w.id, wqr.id)}
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                                {isLinksOpen && (
                                  <div className="text-[11px] space-y-0.5 pl-0.5 border-l-2 border-primary/30 ml-0.5 pt-0.5">
                                    <p>
                                      <span className="text-base-content/55">Welds: </span>
                                      {welds.length === 0 ? (
                                        <span className="text-base-content/45">—</span>
                                      ) : (
                                        <span className="font-mono">
                                          {welds.map((wp) => getWeldName(wp, weldPoints)).join(", ")}
                                        </span>
                                      )}
                                    </p>
                                    <p>
                                      <span className="text-base-content/55">WPS: </span>
                                      {wpsList.length === 0 ? (
                                        <span className="text-base-content/45">—</span>
                                      ) : (
                                        <span className="font-mono">{wpsList.join(", ")}</span>
                                      )}
                                    </p>
                                    {doc && (
                                      <p className="text-base-content/70">
                                        PDF: {doc.title || doc.fileName}
                                      </p>
                                    )}
                                    <button
                                      type="button"
                                      className="btn btn-ghost btn-xs text-error mt-0.5 px-1"
                                      onClick={() => onDeleteWqr?.(wqr.id)}
                                    >
                                      Delete qualification from project
                                    </button>
                                  </div>
                                )}
                              </div>
                            </Fragment>
                          );
                        })}
                        <button
                          type="button"
                          className="btn btn-outline btn-xs w-full sm:w-auto min-h-0 h-7"
                          onClick={() => onAddWqrForWelder?.(w.id)}
                        >
                          + Add WQR
                        </button>
                      </div>
                    </td>
                    <td className="text-end whitespace-nowrap">
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs text-error"
                        onClick={() => onRemoveWelder?.(w.id)}
                      >
                        Remove welder
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default SettingsPersonnelRegistry;
