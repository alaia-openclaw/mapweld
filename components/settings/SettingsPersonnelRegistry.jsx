"use client";

import { useState, useMemo, useCallback, Fragment } from "react";
import { getWeldName } from "@/lib/weld-utils";
import { getResolvedWpsCode } from "@/lib/wps-resolution";
import { groupFitterNames, groupWelders, groupWqrs, TRACEABILITY } from "@/lib/traceability-groups";
import SettingsTraceabilitySection from "@/components/settings/SettingsTraceabilitySection";

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

/**
 * Fitters + welders + WQR with shared 3-group traceability (same model as Material certificates / WPS).
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

  const fitterGroups = useMemo(() => groupFitterNames(fitters, weldPoints), [fitters, weldPoints]);
  const welderGroups = useMemo(() => groupWelders(welders, weldPoints), [welders, weldPoints]);
  const wqrGroups = useMemo(() => groupWqrs(wqrs, weldPoints), [wqrs, weldPoints]);

  const wqrG1 = useMemo(
    () => filterBySearchWqr(wqrGroups.g1, wqrFilterNorm),
    [wqrGroups.g1, wqrFilterNorm]
  );
  const wqrG2 = useMemo(
    () => filterBySearchWqr(wqrGroups.g2, wqrFilterNorm),
    [wqrGroups.g2, wqrFilterNorm]
  );
  const wqrG3 = useMemo(
    () => filterBySearchWqr(wqrGroups.g3, wqrFilterNorm),
    [wqrGroups.g3, wqrFilterNorm]
  );

  const tf = TRACEABILITY.fitter;
  const tw = TRACEABILITY.welder;
  const tq = TRACEABILITY.wqr;

  function renderWqrRow(wqr) {
    const welder = findWelderForWqr(welders, wqr.id);
    const welds = weldsForWqr(wqr.id);
    const wpsList = wpsCodesForWelds(welds);
    const isLinksOpen = expandedWqrId === wqr.id;
    const doc = wqr.documentId ? wqrDocuments.find((d) => d.id === wqr.documentId) : null;

    return (
      <Fragment key={wqr.id}>
        <tr className={`align-top hover ${isLinksOpen ? "bg-base-200/50" : ""}`}>
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
            <td colSpan={5} className="!p-2 !pt-0">
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

  function renderWqrBody(list) {
    if (!wqrs.length) {
      return (
        <tr>
          <td colSpan={5} className="text-center text-base-content/50 py-4 text-[11px]">
            No WQR qualifications yet. Use <strong>Add WQR</strong> on a welder row.
          </td>
        </tr>
      );
    }
    if (list.length === 0) {
      return (
        <tr>
          <td colSpan={5} className="text-center text-base-content/50 py-4 text-[11px]">
            None in this group{wqrFilterNorm ? " (search)" : ""}.
          </td>
        </tr>
      );
    }
    return list.map((wqr) => renderWqrRow(wqr));
  }

  function renderFitterTable(rows) {
    if (rows.length === 0) {
      return (
        <tr>
          <td colSpan={2} className="text-center text-base-content/50 py-3 text-[11px]">
            None in this group.
          </td>
        </tr>
      );
    }
    return rows.map((f) => (
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
    ));
  }

  function renderWelderTable(rows) {
    if (rows.length === 0) {
      return (
        <tr>
          <td colSpan={2} className="text-center text-base-content/50 py-3 text-[11px]">
            None in this group.
          </td>
        </tr>
      );
    }
    return rows.map((w) => (
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
    ));
  }

  return (
    <div className="space-y-6 min-w-0 text-xs">
      <p className="text-[11px] text-base-content/65 leading-snug">
        Personnel grouped by the same traceability model as material certificates and WPS: listed vs used on welds,
        and for WQR — PDF vs usage on welding records.
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

        <SettingsTraceabilitySection number={1} title={tf.g1.title} description={tf.g1.description}>
          <div className="overflow-x-auto border border-base-300 rounded-lg">
            <table className="table table-xs table-pin-rows">
              <thead>
                <tr className="bg-base-200">
                  <th>Name</th>
                  <th className="w-24 text-end" />
                </tr>
              </thead>
              <tbody>{renderFitterTable(fitterGroups.g1)}</tbody>
            </table>
          </div>
        </SettingsTraceabilitySection>

        <SettingsTraceabilitySection number={2} title={tf.g2.title} description={tf.g2.description}>
          {fitterGroups.g2.length === 0 ? (
            <p className="text-sm text-base-content/50">None — all fit-up names match the list.</p>
          ) : (
            <ul className="space-y-1 rounded-lg border border-warning/25 bg-warning/5 p-2">
              {fitterGroups.g2.map((name) => (
                <li
                  key={name}
                  className="flex flex-wrap items-center justify-between gap-2 text-[11px]"
                >
                  <span className="font-mono">{name}</span>
                  <button
                    type="button"
                    className="btn btn-primary btn-xs"
                    onClick={() => onAddFitter?.(name)}
                  >
                    Add to list
                  </button>
                </li>
              ))}
            </ul>
          )}
        </SettingsTraceabilitySection>

        <SettingsTraceabilitySection number={3} title={tf.g3.title} description={tf.g3.description}>
          <div className="overflow-x-auto border border-base-300 rounded-lg">
            <table className="table table-xs table-pin-rows">
              <thead>
                <tr className="bg-base-200">
                  <th>Name</th>
                  <th className="w-24 text-end" />
                </tr>
              </thead>
              <tbody>{renderFitterTable(fitterGroups.g3)}</tbody>
            </table>
          </div>
        </SettingsTraceabilitySection>
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

        <SettingsTraceabilitySection number={1} title={tw.g1.title} description={tw.g1.description}>
          <div className="overflow-x-auto border border-base-300 rounded-lg">
            <table className="table table-xs table-pin-rows">
              <thead>
                <tr className="bg-base-200">
                  <th>Welder</th>
                  <th className="w-44 text-end">WQR</th>
                </tr>
              </thead>
              <tbody>{renderWelderTable(welderGroups.g1)}</tbody>
            </table>
          </div>
        </SettingsTraceabilitySection>

        <SettingsTraceabilitySection number={2} title={tw.g2.title} description={tw.g2.description}>
          {welderGroups.g2Stray.length === 0 ? (
            <p className="text-sm text-base-content/50">None — welding records match registered welders.</p>
          ) : (
            <ul className="space-y-1 rounded-lg border border-warning/25 bg-warning/5 p-2">
              {welderGroups.g2Stray.map((item) => (
                <li
                  key={`${item.kind}-${item.value}`}
                  className="flex flex-wrap items-center justify-between gap-2 text-[11px]"
                >
                  <span className="font-mono">
                    {item.kind === "name" ? item.value : `Unknown welder ID: ${item.value}`}
                  </span>
                  {item.kind === "name" ? (
                    <button
                      type="button"
                      className="btn btn-primary btn-xs"
                      onClick={() => onAddWelder?.(item.value)}
                    >
                      Add welder
                    </button>
                  ) : (
                    <span className="text-base-content/45">Fix records on welds</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </SettingsTraceabilitySection>

        <SettingsTraceabilitySection number={3} title={tw.g3.title} description={tw.g3.description}>
          <div className="overflow-x-auto border border-base-300 rounded-lg">
            <table className="table table-xs table-pin-rows">
              <thead>
                <tr className="bg-base-200">
                  <th>Welder</th>
                  <th className="w-44 text-end">WQR</th>
                </tr>
              </thead>
              <tbody>{renderWelderTable(welderGroups.g3)}</tbody>
            </table>
          </div>
        </SettingsTraceabilitySection>
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

        <SettingsTraceabilitySection number={1} title={tq.g1.title} description={tq.g1.description}>
          <div className="overflow-x-auto border border-base-300 rounded-lg">
            <table className="table table-xs">
              <thead>
                <tr className="bg-base-200">
                  <th className="min-w-[7rem]">Welder</th>
                  <th>Code</th>
                  <th>Description</th>
                  <th className="min-w-[9rem]">PDF</th>
                  <th className="w-28 text-end" />
                </tr>
              </thead>
              <tbody>{renderWqrBody(wqrG1)}</tbody>
            </table>
          </div>
        </SettingsTraceabilitySection>

        <SettingsTraceabilitySection number={2} title={tq.g2.title} description={tq.g2.description}>
          <div className="overflow-x-auto border border-base-300 rounded-lg">
            <table className="table table-xs">
              <thead>
                <tr className="bg-base-200">
                  <th className="min-w-[7rem]">Welder</th>
                  <th>Code</th>
                  <th>Description</th>
                  <th className="min-w-[9rem]">PDF</th>
                  <th className="w-28 text-end" />
                </tr>
              </thead>
              <tbody>{renderWqrBody(wqrG2)}</tbody>
            </table>
          </div>
        </SettingsTraceabilitySection>

        <SettingsTraceabilitySection number={3} title={tq.g3.title} description={tq.g3.description}>
          <div className="overflow-x-auto border border-base-300 rounded-lg">
            <table className="table table-xs">
              <thead>
                <tr className="bg-base-200">
                  <th className="min-w-[7rem]">Welder</th>
                  <th>Code</th>
                  <th>Description</th>
                  <th className="min-w-[9rem]">PDF</th>
                  <th className="w-28 text-end" />
                </tr>
              </thead>
              <tbody>{renderWqrBody(wqrG3)}</tbody>
            </table>
          </div>
        </SettingsTraceabilitySection>
      </div>
    </div>
  );
}

export default SettingsPersonnelRegistry;
