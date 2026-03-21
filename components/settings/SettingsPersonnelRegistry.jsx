"use client";

import { useState, useMemo, useCallback, Fragment } from "react";
import { getWeldName } from "@/lib/weld-utils";
import { getResolvedWpsCode } from "@/lib/wps-resolution";
import { groupFitterNames, groupWelders } from "@/lib/traceability-groups";

function findWelderForWqr(welders, wqrId) {
  return (welders || []).find((w) => (w.wqrIds || []).includes(wqrId)) || null;
}

function filterBySearchWqr(wqrs, filterNorm) {
  if (!filterNorm) return wqrs;
  return wqrs.filter((q) => {
    const c = (q.code || "").toLowerCase();
    const d = (q.description || "").toLowerCase();
    return c.includes(filterNorm) || d.includes(filterNorm);
  });
}

/** Inline warning — missing PDF, stray name, unassigned welder, etc. */
function RowWarningIcon({ title }) {
  return (
    <span className="inline-flex text-warning shrink-0" title={title} aria-label={title}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l6.518 11.59c.75 1.334-.213 2.98-1.742 2.98H3.48c-1.53 0-2.493-1.646-1.743-2.98l6.52-11.59zM11 14a1 1 0 10-2 0 1 1 0 002 0zm-1-2a1 1 0 01-1-1V7a1 1 0 112 0v4a1 1 0 01-1 1z"
          clipRule="evenodd"
        />
      </svg>
    </span>
  );
}

/**
 * Fitters, welders, and WQR in simple lists. Stray names on welds are called out in alerts;
 * each row can show a warning icon when something is missing (PDF, assignment, registry mismatch).
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
  onMoveWqrToWelder,
  wqrUploadInputRef,
  wqrUploadTargetRef,
}) {
  const [fitterInput, setFitterInput] = useState("");
  const [welderInput, setWelderInput] = useState("");
  const [expandedWqrId, setExpandedWqrId] = useState(null);
  const [wqrFilter, setWqrFilter] = useState("");
  const wqrFilterNorm = (wqrFilter || "").trim().toLowerCase();

  const { g2: strayFitterNames } = useMemo(
    () => groupFitterNames(fitters, weldPoints),
    [fitters, weldPoints]
  );
  const { g2Stray: strayWelderItems } = useMemo(
    () => groupWelders(welders, weldPoints),
    [welders, weldPoints]
  );

  const filteredWqrs = useMemo(
    () => filterBySearchWqr(wqrs || [], wqrFilterNorm),
    [wqrs, wqrFilterNorm]
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

  function renderWqrRow(wqr) {
    const welder = findWelderForWqr(welders, wqr.id);
    const welds = weldsForWqr(wqr.id);
    const wpsList = wpsCodesForWelds(welds);
    const isLinksOpen = expandedWqrId === wqr.id;
    const doc = wqr.documentId ? wqrDocuments.find((d) => d.id === wqr.documentId) : null;

    const missingPdfOnUse = welds.length > 0 && !wqr.documentId;
    const unassignedWelder = !welder;
    const pdfNotUsed = Boolean(wqr.documentId) && welds.length === 0;

    return (
      <Fragment key={wqr.id}>
        <tr className={`align-top hover ${isLinksOpen ? "bg-base-200/50" : ""}`}>
          <td className="w-10 min-w-[2rem]">
            <div className="flex items-start justify-center gap-0.5 pt-1">
              {(missingPdfOnUse || unassignedWelder) && (
                <RowWarningIcon
                  title={
                    [
                      missingPdfOnUse && "Qualification PDF missing (used on weld record)",
                      unassignedWelder && "Assign to a welder",
                    ]
                      .filter(Boolean)
                      .join(" · ")
                  }
                />
              )}
              {!missingPdfOnUse && !unassignedWelder && pdfNotUsed && (
                <span
                  className="inline-flex text-base-content/35 shrink-0 pt-0.5"
                  title="PDF on file — not referenced on any weld yet"
                  aria-label="PDF not used on welds"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M10 12a1 1 0 100-2 1 1 0 000 2zm0-8a1 1 0 00-1 1v5a1 1 0 102 0V5a1 1 0 00-1-1z" />
                  </svg>
                </span>
              )}
            </div>
          </td>
          <td className="min-w-[7rem]">
            <select
              className="select select-bordered select-xs w-full max-w-[11rem]"
              value={welder?.id || ""}
              onChange={(e) => {
                const next = e.target.value;
                if (next && wqr.id) onMoveWqrToWelder?.(wqr.id, next);
              }}
            >
              <option value="">Assign to welder…</option>
              {welders.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name || w.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </td>
          <td>
            <input
              type="text"
              className="input input-bordered input-xs font-mono w-full min-w-[5rem]"
              value={wqr.code || ""}
              onChange={(e) => onUpdateWqr?.(wqr.id, { code: e.target.value.toUpperCase() })}
              placeholder="WQR code"
            />
          </td>
          <td>
            <input
              type="text"
              className="input input-bordered input-xs w-full min-w-[6rem]"
              value={wqr.description || ""}
              onChange={(e) => onUpdateWqr?.(wqr.id, { description: e.target.value })}
              placeholder="Description"
            />
          </td>
          <td>
            <div className="flex flex-wrap gap-0.5 items-center min-w-0">
              <select
                className="select select-bordered select-xs flex-1 min-w-0 max-w-[11rem]"
                value={wqr.documentId || ""}
                onChange={(e) => onUpdateWqr?.(wqr.id, { documentId: e.target.value || null })}
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
          </td>
          <td>
            <div className="flex flex-wrap gap-0.5 justify-end">
              <button
                type="button"
                className="btn btn-ghost btn-xs px-1.5"
                onClick={() => setExpandedWqrId(isLinksOpen ? null : wqr.id)}
              >
                {isLinksOpen ? "Hide" : "Links"}
              </button>
              {welder && (
                <button
                  type="button"
                  className="btn btn-ghost btn-xs text-error px-1.5"
                  onClick={() => onUnlinkWqrFromWelder?.(welder.id, wqr.id)}
                >
                  Unlink
                </button>
              )}
            </div>
          </td>
        </tr>
        {isLinksOpen && (
          <tr className="bg-base-200/30">
            <td colSpan={6} className="!p-2 !pt-0">
              <div className="text-[11px] space-y-0.5 pl-1 border-l-2 border-primary/30">
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
            </td>
          </tr>
        )}
      </Fragment>
    );
  }

  return (
    <div className="space-y-6 min-w-0 text-xs">
      <p className="text-[11px] text-base-content/65 leading-snug">
        Fitters, welders, and WQR qualifications. Alerts flag names on welds that are not in your list; WQR rows show
        icons when a PDF or welder assignment is missing.
      </p>

      {/* ——— Fitters ——— */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <h4 className="font-medium text-sm text-base-content/90">Fitters</h4>
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

        {strayFitterNames.length > 0 && (
          <div className="alert alert-warning py-2 px-3 text-[11px]">
            <div className="flex flex-col gap-1 min-w-0">
              <span className="font-medium">Fit-up on welds but not in this list</span>
              <ul className="space-y-1">
                {strayFitterNames.map((name) => (
                  <li key={name} className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono">{name}</span>
                    <button type="button" className="btn btn-primary btn-xs" onClick={() => onAddFitter?.(name)}>
                      Add to list
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="overflow-x-auto border border-base-300 rounded-lg">
          <table className="table table-xs table-pin-rows">
            <thead>
              <tr className="bg-base-200">
                <th>Name</th>
                <th className="w-24 text-end" />
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

      {/* ——— Welders ——— */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <h4 className="font-medium text-sm text-base-content/90">Welders</h4>
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

        {strayWelderItems.length > 0 && (
          <div className="alert alert-warning py-2 px-3 text-[11px]">
            <div className="flex flex-col gap-1 min-w-0">
              <span className="font-medium">Welding records reference names/IDs not in this list</span>
              <ul className="space-y-1">
                {strayWelderItems.map((item) => (
                  <li key={`${item.kind}-${item.value}`} className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono">
                      {item.kind === "name" ? item.value : `Unknown welder ID: ${item.value}`}
                    </span>
                    {item.kind === "name" ? (
                      <button type="button" className="btn btn-primary btn-xs" onClick={() => onAddWelder?.(item.value)}>
                        Add welder
                      </button>
                    ) : (
                      <span className="text-base-content/50">Update welds to use a listed welder</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="overflow-x-auto border border-base-300 rounded-lg">
          <table className="table table-xs table-pin-rows">
            <thead>
              <tr className="bg-base-200">
                <th>Welder</th>
                <th className="w-44 text-end">WQR</th>
              </tr>
            </thead>
            <tbody>
              {welders.length === 0 && (
                <tr>
                  <td colSpan={2} className="text-center text-base-content/50 py-4 text-[11px]">
                    No welders yet.
                  </td>
                </tr>
              )}
              {welders.map((w) => (
                <tr key={w.id} className="hover align-top">
                  <td>
                    <input
                      type="text"
                      className="input input-bordered input-xs w-full max-w-[14rem]"
                      value={w.name || ""}
                      onChange={(e) => onUpdateWelderName?.(w.id, e.target.value)}
                      placeholder="Welder name"
                    />
                  </td>
                  <td className="text-end whitespace-nowrap">
                    <div className="flex flex-wrap gap-1 justify-end">
                      <button
                        type="button"
                        className="btn btn-outline btn-xs"
                        onClick={() => onAddWqrForWelder?.(w.id)}
                      >
                        + WQR
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs text-error"
                        onClick={() => onRemoveWelder?.(w.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ——— WQR ——— */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-end sm:justify-between">
          <h4 className="font-medium text-sm text-base-content/90">WQR qualifications</h4>
          <div className="form-control flex-1 min-w-0 max-w-md">
            <label className="label py-0" htmlFor="wqr-registry-filter">
              <span className="label-text text-xs">Search WQR</span>
            </label>
            <input
              id="wqr-registry-filter"
              type="search"
              className="input input-bordered input-xs w-full"
              value={wqrFilter}
              onChange={(e) => setWqrFilter(e.target.value)}
              placeholder="Code, description…"
              autoComplete="off"
            />
          </div>
        </div>

        <p className="text-[10px] text-base-content/45">
          Warning: missing PDF on a used WQR, or not assigned to a welder. Info: PDF loaded but not on any weld yet.
        </p>

        <div className="overflow-x-auto border border-base-300 rounded-lg">
          <table className="table table-xs">
            <thead>
              <tr className="bg-base-200">
                <th className="w-10" aria-hidden />
                <th className="min-w-[7rem]">Welder</th>
                <th>Code</th>
                <th>Description</th>
                <th className="min-w-[9rem]">PDF</th>
                <th className="w-28 text-end" />
              </tr>
            </thead>
            <tbody>
              {!wqrs.length && (
                <tr>
                  <td colSpan={6} className="text-center text-base-content/50 py-4 text-[11px]">
                    No WQR qualifications yet. Use <strong>+ WQR</strong> on a welder row.
                  </td>
                </tr>
              )}
              {wqrs.length > 0 && filteredWqrs.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-base-content/50 py-4 text-[11px]">
                    No entries match this search.
                  </td>
                </tr>
              )}
              {filteredWqrs.map((wqr) => renderWqrRow(wqr))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default SettingsPersonnelRegistry;
