"use client";

import { useMemo, useState, useCallback, Fragment } from "react";
import { getWeldName } from "@/lib/weld-utils";
import { groupWpsLibraryEntries, TRACEABILITY } from "@/lib/traceability-groups";
import SettingsTraceabilitySection from "@/components/settings/SettingsTraceabilitySection";

function filterWpsEntries(entries, filterNorm) {
  if (!filterNorm) return entries;
  return entries.filter((entry) => {
    const t = (entry.title || "").toLowerCase();
    const d = (entry.description || "").toLowerCase();
    return t.includes(filterNorm) || d.includes(filterNorm);
  });
}

/**
 * WPS library: title, description, optional PDF. Welds link via wpsLibraryEntryId.
 * Grouped by traceability (PDF vs project use), same model as Material certificates.
 */
function SettingsWpsRegistry({
  wpsLibrary = [],
  weldPoints = [],
  personnel = { welders: [], wqrs: [] },
  wpsDocuments = [],
  onAddWps,
  onUpdateWps,
  onRemoveWps,
  onRequestWpsUpload,
}) {
  const [filter, setFilter] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const filterNorm = (filter || "").trim().toLowerCase();

  const wqrs = useMemo(() => personnel.wqrs || [], [personnel]);

  const { g1, g2, g3, orphanWpsDocuments } = useMemo(
    () => groupWpsLibraryEntries(wpsLibrary, weldPoints, wpsDocuments),
    [wpsLibrary, weldPoints, wpsDocuments]
  );

  const rowsG1 = useMemo(() => filterWpsEntries(g1, filterNorm), [g1, filterNorm]);
  const rowsG2 = useMemo(() => filterWpsEntries(g2, filterNorm), [g2, filterNorm]);
  const rowsG3 = useMemo(() => filterWpsEntries(g3, filterNorm), [g3, filterNorm]);

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

  function renderWpsTableRow(entry) {
    const welds = weldsForEntry(entry.id);
    const wqrList = wqrCodesForWelds(welds);
    const isOpen = expandedId === entry.id;
    const doc = entry?.documentId ? wpsDocuments.find((d) => d.id === entry.documentId) : null;

    return (
      <Fragment key={entry.id}>
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
            <div className="flex flex-wrap gap-1 items-center min-w-0">
              <select
                className="select select-bordered select-xs flex-1 min-w-[7rem] max-w-[14rem]"
                value={entry.documentId || ""}
                onChange={(e) => onUpdateWps(entry.id, { documentId: e.target.value || null })}
              >
                <option value="">No PDF linked</option>
                {wpsDocuments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title || d.fileName}
                  </option>
                ))}
              </select>
              {!entry.documentId && (
                <button
                  type="button"
                  className="btn btn-ghost btn-xs shrink-0"
                  onClick={() => onRequestWpsUpload?.(entry.id)}
                >
                  Load
                </button>
              )}
            </div>
          </td>
          <td>
            <div className="flex gap-1 justify-end flex-wrap">
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => setExpandedId(isOpen ? null : entry.id)}
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
            <td colSpan={4} className="!p-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="font-semibold text-base-content/80 mb-1">Related welds</p>
                  {welds.length === 0 ? (
                    <p className="text-base-content/50">
                      None (assign this WPS on a weld via the weld form)
                    </p>
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
  }

  function renderWpsTableBody(entries) {
    if (entries.length === 0) {
      return (
        <tr>
          <td colSpan={4} className="text-center text-base-content/50 py-4 text-[11px]">
            None in this group{filterNorm ? " (search)" : ""}.
          </td>
        </tr>
      );
    }
    return entries.map((entry) => renderWpsTableRow(entry));
  }

  const t = TRACEABILITY.wps;
  const hasAnyWps = (wpsLibrary || []).length > 0;

  return (
    <div className="space-y-4 min-w-0">
      <p className="text-xs text-base-content/70">
        Project WPS list. Same traceability groups as material certificates: PDF on file vs in use on welds. Assign a
        WPS to welds from the weld form.
      </p>

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

      <SettingsTraceabilitySection number={1} title={t.g1.title} description={t.g1.description}>
        {orphanWpsDocuments.length > 0 && (
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-2 space-y-1 mb-2">
            <p className="text-[11px] font-medium text-base-content/80">Unassigned WPS PDFs (pick a WPS row above)</p>
            <ul className="text-[11px] space-y-0.5">
              {orphanWpsDocuments.map((d) => (
                <li key={d.id} className="truncate" title={d.fileName}>
                  · {d.title || d.fileName}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="overflow-x-auto border border-base-300 rounded-lg">
          <table className="table table-xs table-pin-rows">
            <thead>
              <tr className="bg-base-200">
                <th>Title</th>
                <th>Description</th>
                <th className="min-w-[10rem]">WPS PDF</th>
                <th className="w-32"> </th>
              </tr>
            </thead>
            <tbody>
              {!hasAnyWps ? (
                <tr>
                  <td colSpan={4} className="text-center text-base-content/50 py-6">
                    No WPS entries yet.
                  </td>
                </tr>
              ) : (
                renderWpsTableBody(rowsG1)
              )}
            </tbody>
          </table>
        </div>
      </SettingsTraceabilitySection>

      <SettingsTraceabilitySection number={2} title={t.g2.title} description={t.g2.description}>
        <div className="overflow-x-auto border border-base-300 rounded-lg">
          <table className="table table-xs table-pin-rows">
            <thead>
              <tr className="bg-base-200">
                <th>Title</th>
                <th>Description</th>
                <th className="min-w-[10rem]">WPS PDF</th>
                <th className="w-32"> </th>
              </tr>
            </thead>
            <tbody>{renderWpsTableBody(rowsG2)}</tbody>
          </table>
        </div>
      </SettingsTraceabilitySection>

      <SettingsTraceabilitySection number={3} title={t.g3.title} description={t.g3.description}>
        <div className="overflow-x-auto border border-base-300 rounded-lg">
          <table className="table table-xs table-pin-rows">
            <thead>
              <tr className="bg-base-200">
                <th>Title</th>
                <th>Description</th>
                <th className="min-w-[10rem]">WPS PDF</th>
                <th className="w-32"> </th>
              </tr>
            </thead>
            <tbody>{renderWpsTableBody(rowsG3)}</tbody>
          </table>
        </div>
      </SettingsTraceabilitySection>
    </div>
  );
}

export default SettingsWpsRegistry;
