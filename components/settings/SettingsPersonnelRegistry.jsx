"use client";

import { useState, useMemo, useCallback, Fragment } from "react";
import { getWeldName } from "@/lib/weld-utils";
import { getResolvedWpsCode } from "@/lib/wps-resolution";

const cell = "border border-base-300/80 bg-base-100 px-1 py-0 align-middle";
const cellHeader =
  "border border-base-300 bg-base-300/40 px-1 py-0.5 text-left text-[10px] font-semibold uppercase tracking-wide text-base-content/80";
const inp =
  "input input-bordered input-xs w-full min-h-0 h-6 rounded-none border-0 bg-transparent px-1 text-[11px] leading-tight focus:outline-none focus:ring-1 focus:ring-primary/40";
const sel =
  "select select-bordered select-xs w-full min-h-0 h-6 rounded-none border-0 bg-transparent px-0 text-[11px] leading-tight max-w-full focus:outline-none focus:ring-1 focus:ring-primary/40";
const btnMini =
  "btn btn-ghost btn-xs min-h-0 h-5 px-1 text-[10px] leading-none font-normal";

/**
 * Fitters + welders; WQR as flat spreadsheet rows (compact / Excel-style).
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

  function renderWelderCell(w, lineIndex) {
    if (lineIndex === 0) {
      return (
        <div className="flex flex-col gap-0.5 min-w-[6.5rem]">
          <input
            type="text"
            className={inp}
            value={w.name || ""}
            onChange={(e) => onUpdateWelderName?.(w.id, e.target.value)}
            placeholder="—"
          />
          <button
            type="button"
            className="text-[9px] text-error/90 hover:underline text-left"
            onClick={() => onRemoveWelder?.(w.id)}
          >
            Remove welder
          </button>
        </div>
      );
    }
    return (
      <div
        className="text-[10px] text-base-content/55 pl-1 border-l-2 border-base-300/80 min-h-[1.5rem] flex items-center"
        title={w.name || ""}
      >
        ↳
      </div>
    );
  }

  return (
    <div className="space-y-4 min-w-0 text-[11px] leading-tight">
      <p className="text-[10px] text-base-content/60 leading-snug">
        Compact grid — fitters and welders; add WQR lines per welder like spreadsheet rows.
      </p>

      <div>
        <div className="flex flex-wrap items-end gap-2 mb-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-base-content/70">
            Fitters
          </span>
          <form
            className="flex gap-1 flex-1 min-w-0 max-w-sm"
            onSubmit={(e) => {
              e.preventDefault();
              if (!fitterInput.trim()) return;
              onAddFitter?.(fitterInput.trim());
              setFitterInput("");
            }}
          >
            <input
              type="text"
              className={`${inp} max-w-[12rem] border border-base-300/60 bg-base-100`}
              value={fitterInput}
              onChange={(e) => setFitterInput(e.target.value)}
              placeholder="Name…"
            />
            <button type="submit" className={`${btnMini} btn-primary text-primary-content`}>
              + Row
            </button>
          </form>
        </div>
        <div className="overflow-x-auto border border-base-300">
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr>
                <th className={`${cellHeader} min-w-[12rem]`}>Name</th>
                <th className={`${cellHeader} w-10 text-center`}>×</th>
              </tr>
            </thead>
            <tbody>
              {fitters.length === 0 && (
                <tr>
                  <td colSpan={2} className={`${cell} text-center text-base-content/45 py-0.5`}>
                    —
                  </td>
                </tr>
              )}
              {fitters.map((f) => (
                <tr key={f.id} className="hover:bg-base-200/35">
                  <td className={cell}>
                    <input
                      type="text"
                      className={inp}
                      value={f.name || ""}
                      onChange={(e) => onUpdateFitterName?.(f.id, e.target.value)}
                      placeholder="—"
                    />
                  </td>
                  <td className={`${cell} text-center`}>
                    <button
                      type="button"
                      className={`${btnMini} text-error`}
                      onClick={() => onRemoveFitter?.(f.id)}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-end gap-2 mb-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-base-content/70">
            Welders &amp; WQR
          </span>
          <form
            className="flex gap-1 flex-1 min-w-0 max-w-sm"
            onSubmit={(e) => {
              e.preventDefault();
              if (!welderInput.trim()) return;
              onAddWelder?.(welderInput.trim());
              setWelderInput("");
            }}
          >
            <input
              type="text"
              className={`${inp} max-w-[12rem] border border-base-300/60 bg-base-100`}
              value={welderInput}
              onChange={(e) => setWelderInput(e.target.value)}
              placeholder="Welder…"
            />
            <button type="submit" className={`${btnMini} btn-primary text-primary-content`}>
              + Row
            </button>
          </form>
        </div>
        <div className="overflow-x-auto border border-base-300">
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr>
                <th className={`${cellHeader} w-[7.5rem]`}>Welder</th>
                <th className={`${cellHeader} w-[6.5rem]`}>WQR code</th>
                <th className={`${cellHeader} min-w-[7rem]`}>Description</th>
                <th className={`${cellHeader} min-w-[8rem] max-w-[14rem]`}>PDF</th>
                <th className={`${cellHeader} w-[4.5rem] text-right`}>▶ ×</th>
              </tr>
            </thead>
            <tbody>
              {welders.length === 0 && (
                <tr>
                  <td colSpan={5} className={`${cell} text-center text-base-content/45 py-0.5`}>
                    —
                  </td>
                </tr>
              )}
              {welders.map((w) => {
                const ids = w.wqrIds || [];
                if (ids.length === 0) {
                  return (
                    <Fragment key={w.id}>
                      <tr className="hover:bg-base-200/35">
                        <td className={cell}>{renderWelderCell(w, 0)}</td>
                        <td className={`${cell} text-base-content/45 text-center`} colSpan={3}>
                          —
                        </td>
                        <td className={cell} />
                      </tr>
                      <tr className="bg-base-200/20 hover:bg-base-200/35">
                        <td className={cell} colSpan={5}>
                          <button
                            type="button"
                            className={`${btnMini} btn-outline border-base-300`}
                            onClick={() => onAddWqrForWelder?.(w.id)}
                          >
                            + WQR
                          </button>
                        </td>
                      </tr>
                    </Fragment>
                  );
                }

                return (
                  <Fragment key={w.id}>
                    {ids.map((wqrId, idx) => {
                      const wqr = wqrById.get(wqrId);
                      if (!wqr) {
                        return (
                          <tr key={wqrId} className="hover:bg-base-200/35">
                            <td className={cell}>{renderWelderCell(w, idx)}</td>
                            <td className={`${cell} text-warning text-[10px]`} colSpan={3}>
                              Missing WQR: {wqrId}
                            </td>
                            <td className={cell} />
                          </tr>
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
                          <tr className="hover:bg-base-200/35">
                            <td className={cell}>{renderWelderCell(w, idx)}</td>
                            <td className={`${cell} p-0`}>
                              <input
                                type="text"
                                className={`${inp} font-mono`}
                                value={wqr.code || ""}
                                onChange={(e) =>
                                  onUpdateWqr?.(wqr.id, { code: e.target.value.toUpperCase() })
                                }
                                placeholder="—"
                              />
                            </td>
                            <td className={`${cell} p-0`}>
                              <input
                                type="text"
                                className={inp}
                                value={wqr.description || ""}
                                onChange={(e) =>
                                  onUpdateWqr?.(wqr.id, { description: e.target.value })
                                }
                                placeholder="—"
                              />
                            </td>
                            <td className={`${cell} p-0 min-w-0`}>
                              <div className="flex items-stretch min-h-6">
                                <select
                                  className={sel}
                                  value={wqr.documentId || ""}
                                  onChange={(e) =>
                                    onUpdateWqr?.(wqr.id, {
                                      documentId: e.target.value || null,
                                    })
                                  }
                                >
                                  <option value="">—</option>
                                  {wqrDocuments.map((d) => (
                                    <option key={d.id} value={d.id}>
                                      {d.title || d.fileName}
                                    </option>
                                  ))}
                                </select>
                                {!wqr.documentId && (
                                  <button
                                    type="button"
                                    className={`${btnMini} shrink-0 rounded-none border-l border-base-300`}
                                    onClick={() => {
                                      wqrUploadTargetRef.current = wqr.id;
                                      wqrUploadInputRef.current?.click();
                                    }}
                                  >
                                    …
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className={`${cell} whitespace-nowrap text-right`}>
                              <button
                                type="button"
                                className={btnMini}
                                title="Details"
                                onClick={() =>
                                  setExpandedWqrId(isLinksOpen ? null : wqr.id)
                                }
                              >
                                {isLinksOpen ? "▼" : "▶"}
                              </button>
                              <button
                                type="button"
                                className={`${btnMini} text-error`}
                                title="Remove WQR from welder"
                                onClick={() => onUnlinkWqrFromWelder?.(w.id, wqr.id)}
                              >
                                ×
                              </button>
                            </td>
                          </tr>
                          {isLinksOpen && (
                            <tr className="bg-base-200/25">
                              <td colSpan={5} className={`${cell} py-0.5`}>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0 text-[10px] pl-1">
                                  <div>
                                    <span className="text-base-content/50">Welds: </span>
                                    {welds.length === 0 ? (
                                      <span className="text-base-content/45">—</span>
                                    ) : (
                                      <span className="font-mono">
                                        {welds.map((wp) => getWeldName(wp, weldPoints)).join(", ")}
                                      </span>
                                    )}
                                  </div>
                                  <div>
                                    <span className="text-base-content/50">WPS: </span>
                                    {wpsList.length === 0 ? (
                                      <span className="text-base-content/45">—</span>
                                    ) : (
                                      <span className="font-mono">{wpsList.join(", ")}</span>
                                    )}
                                  </div>
                                  {doc && (
                                    <div className="sm:col-span-2 text-base-content/70">
                                      PDF: {doc.title || doc.fileName}
                                    </div>
                                  )}
                                  <div className="sm:col-span-2">
                                    <button
                                      type="button"
                                      className={`${btnMini} text-error`}
                                      onClick={() => onDeleteWqr?.(wqr.id)}
                                    >
                                      Delete qualification from project
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                    <tr className="bg-base-200/20 hover:bg-base-200/35">
                      <td className={cell} colSpan={5}>
                        <button
                          type="button"
                          className={`${btnMini} btn-outline border-base-300`}
                          onClick={() => onAddWqrForWelder?.(w.id)}
                        >
                          + WQR
                        </button>
                      </td>
                    </tr>
                  </Fragment>
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
