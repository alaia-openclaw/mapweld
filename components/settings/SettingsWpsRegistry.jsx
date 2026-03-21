"use client";

import { useMemo, useState, useCallback, Fragment } from "react";
import { getWeldName } from "@/lib/weld-utils";
import { getWeldLineId } from "@/lib/ndt-resolution";

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
 * WPS library: title, description, optional PDF. Welds link via wpsLibraryEntryId.
 * Single table: warning when no PDF; expandable row lists related welds with drawing / page / line / spool.
 */
function SettingsWpsRegistry({
  wpsLibrary = [],
  weldPoints = [],
  personnel = { welders: [], wqrs: [] },
  wpsDocuments = [],
  drawings = [],
  lines = [],
  spools = [],
  onAddWps,
  onUpdateWps,
  onRemoveWps,
  onRequestWpsUpload,
}) {
  const [filter, setFilter] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const filterNorm = (filter || "").trim().toLowerCase();

  const wqrs = useMemo(() => personnel.wqrs || [], [personnel]);

  const orphanWpsDocuments = useMemo(() => {
    const list = Array.isArray(wpsLibrary) ? wpsLibrary : [];
    const wpsDocs = (wpsDocuments || []).filter((d) => d?.category === "wps" && !d?.isReadOnlyFromNdt);
    const linkedDocIds = new Set(list.map((e) => e?.documentId).filter(Boolean));
    return wpsDocs.filter((d) => !linkedDocIds.has(d.id));
  }, [wpsLibrary, wpsDocuments]);

  const sortedFilteredEntries = useMemo(() => {
    const filtered = filterWpsEntries(wpsLibrary, filterNorm);
    return [...filtered].sort((a, b) => {
      const ta = (a.title || "").toLowerCase();
      const tb = (b.title || "").toLowerCase();
      if (ta !== tb) return ta.localeCompare(tb);
      return (a.id || "").localeCompare(b.id || "");
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
    const welds = weldsForEntry(entry.id);
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
                className="input input-bordered input-xs w-full min-w-[8rem]"
                value={entry.title || ""}
                onChange={(e) => onUpdateWps(entry.id, { title: e.target.value })}
                placeholder="Name / title"
              />
            </div>
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
            <td colSpan={4} className="!p-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="font-semibold text-base-content/80 mb-1">Related welds</p>
                  {welds.length === 0 ? (
                    <p className="text-base-content/50">
                      None yet. Assign this WPS on a weld from the weld form, or resolve inherited codes until no ad-hoc
                      entry is needed.
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

  return (
    <div className="space-y-4 min-w-0">
      <p className="text-xs text-base-content/70">
        Project WPS list. Add a row with name and description, then link a certificate PDF when you have it. Welds
        reference rows via the weld form. Rows without a PDF show a warning until a file is linked or welds no longer
        need the entry.
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
            placeholder="Title, description, code…"
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
              <th>Name</th>
              <th>Description</th>
              <th className="min-w-[10rem]">WPS PDF</th>
              <th className="w-36"> </th>
            </tr>
          </thead>
          <tbody>
            {!hasAnyWps ? (
              <tr>
                <td colSpan={4} className="text-center text-base-content/50 py-6">
                  No WPS entries yet. Use &quot;Add WPS&quot; to create one, then assign it on welds or upload a PDF when
                  ready.
                </td>
              </tr>
            ) : sortedFilteredEntries.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-base-content/50 py-4 text-[11px]">
                  No matches{filterNorm ? " for this search" : ""}.
                </td>
              </tr>
            ) : (
              sortedFilteredEntries.map((entry) => renderWpsTableRow(entry))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SettingsWpsRegistry;
