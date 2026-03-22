"use client";

import { useMemo, useState, useCallback, Fragment } from "react";
import { getWeldName } from "@/lib/weld-utils";
import { getWeldLineId } from "@/lib/ndt-resolution";
import {
  getUnregisteredWpsUsageGroups,
  getResolvedWpsCode,
  isWpsLibraryEntryRegisteredForDropdown,
  wpsLibraryEntryMatchesUserText,
} from "@/lib/wps-resolution";

function filterWpsEntries(entries, filterNorm) {
  if (!filterNorm) return entries;
  return entries.filter((entry) => {
    const t = (entry.title || "").toLowerCase();
    const d = (entry.description || "").toLowerCase();
    const c = (entry.code || "").toLowerCase();
    return t.includes(filterNorm) || d.includes(filterNorm) || c.includes(filterNorm);
  });
}

/** Missing WPS certificate PDF — same glyph as personnel registry. */
function MissingPdfWarningIcon() {
  const title = "No WPS PDF linked — upload a certificate or assign one from the vault when ready.";
  return (
    <span className="inline-flex text-warning shrink-0" title={title} aria-label={title}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
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
 * WPS library: code (match key), optional title, description, optional PDF. Related welds include explicit links and
 * any weld whose resolved WPS (weld → line → system) matches the row.
 * Registered rows + a second list: effective WPS on welds that do not match any library row.
 */
function SettingsWpsRegistry({
  wpsLibrary = [],
  weldPoints = [],
  personnel = { welders: [], wqrs: [] },
  wpsDocuments = [],
  drawings = [],
  systems = [],
  lines = [],
  spools = [],
  drawingSettings = {},
  onAddWps,
  onUpdateWps,
  onRemoveWps,
  onRequestWpsUpload,
  onSelectWeld,
}) {
  const [filter, setFilter] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [expandedUnregisteredCode, setExpandedUnregisteredCode] = useState(null);
  const filterNorm = (filter || "").trim().toLowerCase();

  const wqrs = useMemo(() => personnel.wqrs || [], [personnel]);

  const orphanWpsDocuments = useMemo(() => {
    const list = Array.isArray(wpsLibrary) ? wpsLibrary : [];
    const wpsDocs = (wpsDocuments || []).filter((d) => d?.category === "wps" && !d?.isReadOnlyFromNdt);
    const linkedDocIds = new Set(list.map((e) => e?.documentId).filter(Boolean));
    return wpsDocs.filter((d) => !linkedDocIds.has(d.id));
  }, [wpsLibrary, wpsDocuments]);

  const unregisteredWpsGroups = useMemo(
    () => getUnregisteredWpsUsageGroups(weldPoints, wpsLibrary, systems, lines, spools, drawingSettings),
    [weldPoints, wpsLibrary, systems, lines, spools, drawingSettings]
  );

  const sortedFilteredEntries = useMemo(() => {
    const list = Array.isArray(wpsLibrary) ? wpsLibrary : [];
    const registeredOnly = list.filter((e) => isWpsLibraryEntryRegisteredForDropdown(e));
    const filtered = filterWpsEntries(registeredOnly, filterNorm);
    return [...filtered].sort((a, b) => {
      const ca = (a.code || "").toLowerCase();
      const cb = (b.code || "").toLowerCase();
      if (ca !== cb) return ca.localeCompare(cb);
      const ta = (a.title || "").toLowerCase();
      const tb = (b.title || "").toLowerCase();
      if (ta !== tb) return ta.localeCompare(tb);
      return (a.id || "").localeCompare(b.id || "");
    });
  }, [wpsLibrary, filterNorm]);

  const weldsForEntry = useCallback(
    (entry) => {
      if (!entry?.id) return [];
      return weldPoints.filter((w) => {
        if (w.wpsLibraryEntryId === entry.id) return true;
        const resolved = getResolvedWpsCode(w, systems, lines, spools, drawingSettings).trim();
        if (!resolved) return false;
        return wpsLibraryEntryMatchesUserText(entry, resolved);
      });
    },
    [weldPoints, systems, lines, spools, drawingSettings]
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

  const describeWeldPlacement = useCallback(
    (weld) => {
      const dwg = drawings.find((d) => d.id === weld.drawingId);
      const drawingLabel =
        (dwg?.filename || "").trim() || (dwg?.title || "").trim() || (weld.drawingId ? "Drawing" : "—");
      const pageLabel = weld.pageNumber != null ? String(weld.pageNumber) : "—";
      const lineId = getWeldLineId(weld, spools);
      const line = lineId ? lines.find((l) => l.id === lineId) : null;
      const lineLabel = (line?.name || "").trim() || lineId || "—";
      const sp = weld.spoolId ? spools.find((s) => s.id === weld.spoolId) : null;
      const spoolLabel = sp ? (sp.name || "").trim() || sp.id : null;
      return { drawingLabel, pageLabel, lineLabel, spoolLabel };
    },
    [drawings, lines, spools]
  );

  function renderWpsTableRow(entry) {
    const welds = weldsForEntry(entry);
    const wqrList = wqrCodesForWelds(welds);
    const isOpen = expandedId === entry.id;
    const doc = entry?.documentId ? wpsDocuments.find((d) => d.id === entry.documentId) : null;
    const hasPdf = Boolean(entry?.documentId);

    return (
      <Fragment key={entry.id}>
        <tr className={`hover ${isOpen ? "bg-base-200/80" : ""}`}>
          <td className="min-w-0">
            <div className="flex items-start gap-1.5 min-w-0">
              {!hasPdf && <MissingPdfWarningIcon />}
              <input
                type="text"
                className="input input-bordered input-xs w-full min-w-[6rem] font-mono"
                value={entry.code || ""}
                onChange={(e) => onUpdateWps(entry.id, { code: e.target.value.toUpperCase() })}
                placeholder="WPS code"
                title="WPS number or code — used to match typed WPS on welds"
                aria-label="WPS code"
              />
            </div>
          </td>
          <td className="min-w-0">
            <input
              type="text"
              className="input input-bordered input-xs w-full min-w-[8rem]"
              value={entry.title || ""}
              onChange={(e) => onUpdateWps(entry.id, { title: e.target.value })}
              placeholder="Title (optional)"
              aria-label="WPS title"
            />
          </td>
          <td>
            <input
              type="text"
              className="input input-bordered input-xs w-full min-w-[10rem]"
              value={entry.description || ""}
              onChange={(e) => onUpdateWps(entry.id, { description: e.target.value })}
              placeholder="Description"
              aria-label="WPS description"
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
                  Load file
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
                {isOpen ? "Hide welds" : "Related welds"}
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
            <td colSpan={5} className="!p-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="font-semibold text-base-content/80 mb-1">Related welds</p>
                  {welds.length === 0 ? (
                    <p className="text-base-content/50">
                      None yet. Assign this WPS on a weld, or set it on the line/system so welds inherit it — they will
                      appear here when the effective WPS matches this row.
                    </p>
                  ) : (
                    <ul className="space-y-2 max-h-48 overflow-y-auto">
                      {welds.map((w) => {
                        const { drawingLabel, pageLabel, lineLabel, spoolLabel } = describeWeldPlacement(w);
                        return (
                          <li key={w.id} className="border-b border-base-300/40 pb-2 last:border-0 last:pb-0">
                            <div className="font-mono font-medium text-base-content">{getWeldName(w, weldPoints)}</div>
                            <div className="text-[11px] text-base-content/65 mt-0.5 grid gap-0.5">
                              <span>
                                <span className="text-base-content/45">Drawing:</span> {drawingLabel}
                              </span>
                              <span>
                                <span className="text-base-content/45">Page:</span> {pageLabel}
                              </span>
                              <span>
                                <span className="text-base-content/45">Line:</span> {lineLabel}
                              </span>
                              {spoolLabel ? (
                                <span>
                                  <span className="text-base-content/45">Spool:</span> {spoolLabel}
                                </span>
                              ) : null}
                            </div>
                          </li>
                        );
                      })}
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

  const hasAnyWps = (wpsLibrary || []).length > 0;
  const hasRegisteredWps = useMemo(
    () =>
      (Array.isArray(wpsLibrary) ? wpsLibrary : []).some((e) => isWpsLibraryEntryRegisteredForDropdown(e)),
    [wpsLibrary]
  );

  return (
    <div className="space-y-4 min-w-0">
      <p className="text-xs text-base-content/70">
        Maintain the project WPS register here. Each registered row has a <strong>code</strong> (matches typed WPS on
        welds), optional <strong>title</strong>, and <strong>description</strong>. Link a certificate PDF when you have
        it. WPS text only ever typed on welds (not added here) appears under{" "}
        <strong>WPS in use but not registered</strong> — register it there or open those welds to change the WPS.
      </p>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-base-content">Registered WPS</h3>
        <p className="text-[11px] text-base-content/60">
          Rows you add here (with or without a PDF), or promote from the section below. Auto-created placeholders from
          weld saves are not listed here.
        </p>
      </div>

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
        <button type="button" className="btn btn-primary btn-sm shrink-0" onClick={() => onAddWps?.()}>
          + Add WPS
        </button>
      </div>

      {orphanWpsDocuments.length > 0 && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-2 space-y-1">
          <p className="text-[11px] font-medium text-base-content/80">
            WPS PDFs in the project file not linked to any row — pick one in the table below or remove the file from the
            vault.
          </p>
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
              <th>WPS code</th>
              <th>Title</th>
              <th>Description</th>
              <th className="min-w-[10rem]">WPS PDF</th>
              <th className="w-36"> </th>
            </tr>
          </thead>
          <tbody>
            {!hasAnyWps ? (
              <tr>
                <td colSpan={5} className="text-center text-base-content/50 py-6">
                  No WPS entries yet. Use &quot;Add WPS&quot; to create one, then assign it on welds or upload a PDF when
                  ready.
                </td>
              </tr>
            ) : sortedFilteredEntries.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-base-content/50 py-4 text-[11px]">
                  {filterNorm
                    ? `No matches for this search.`
                    : hasRegisteredWps
                      ? "No matches for this search."
                      : "No registered WPS rows yet. WPS typed only on welds are listed under “WPS in use but not registered” below — use Register there or add a row above."}
                </td>
              </tr>
            ) : (
              sortedFilteredEntries.map((entry) => renderWpsTableRow(entry))
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-2 pt-2 border-t border-base-300">
        <h3 className="text-sm font-semibold text-base-content">WPS in use but not registered</h3>
        <p className="text-[11px] text-base-content/60">
          Effective WPS on each weld (explicit weld field, else line, else system) that does not match any row in the
          registered table above (including when the weld only matched an auto-created placeholder row). Register a
          matching row, or open a weld to point it at a registered WPS or change the text.
        </p>
      </div>

      <div className="overflow-x-auto border border-base-300 rounded-lg">
        <table className="table table-xs table-pin-rows">
          <thead>
            <tr className="bg-base-200">
              <th>WPS text (resolved)</th>
              <th className="w-24">Welds</th>
              <th className="w-44"> </th>
            </tr>
          </thead>
          <tbody>
            {unregisteredWpsGroups.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center text-base-content/50 py-4 text-[11px]">
                  None — every weld with a WPS string matches a registered row, or no WPS is set on welds.
                </td>
              </tr>
            ) : (
              unregisteredWpsGroups.map((group) => {
                const isOpen = expandedUnregisteredCode === group.displayCode;
                return (
                  <Fragment key={group.displayCode}>
                    <tr className={`hover ${isOpen ? "bg-base-200/80" : ""}`}>
                      <td className="min-w-0">
                        <span className="font-mono text-xs break-all">{group.displayCode}</span>
                      </td>
                      <td>{group.welds.length}</td>
                      <td>
                        <div className="flex gap-1 justify-end flex-wrap">
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            onClick={() => onAddWps?.({ code: group.displayCode })}
                          >
                            Register
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            onClick={() =>
                              setExpandedUnregisteredCode(isOpen ? null : group.displayCode)
                            }
                          >
                            {isOpen ? "Hide welds" : "Welds"}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-base-200/40">
                        <td colSpan={3} className="!p-3">
                          <p className="font-semibold text-base-content/80 mb-2 text-xs">Welds using this WPS</p>
                          <ul className="space-y-2 max-h-56 overflow-y-auto text-xs">
                            {group.welds.map((w) => {
                              const { drawingLabel, pageLabel, lineLabel, spoolLabel } = describeWeldPlacement(w);
                              return (
                                <li
                                  key={w.id}
                                  className="border-b border-base-300/40 pb-2 last:border-0 last:pb-0"
                                >
                                  <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <div className="font-mono font-medium text-base-content">
                                        {getWeldName(w, weldPoints)}
                                      </div>
                                      <div className="text-[11px] text-base-content/65 mt-0.5 grid gap-0.5">
                                        <span>
                                          <span className="text-base-content/45">Drawing:</span> {drawingLabel}
                                        </span>
                                        <span>
                                          <span className="text-base-content/45">Page:</span> {pageLabel}
                                        </span>
                                        <span>
                                          <span className="text-base-content/45">Line:</span> {lineLabel}
                                        </span>
                                        {spoolLabel ? (
                                          <span>
                                            <span className="text-base-content/45">Spool:</span> {spoolLabel}
                                          </span>
                                        ) : null}
                                      </div>
                                    </div>
                                    {onSelectWeld ? (
                                      <button
                                        type="button"
                                        className="btn btn-primary btn-xs shrink-0"
                                        onClick={() => onSelectWeld(w.id)}
                                      >
                                        Open
                                      </button>
                                    ) : null}
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SettingsWpsRegistry;
