"use client";

import { useMemo, useRef, useCallback, useState } from "react";

function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function uniqueSorted(strings) {
  return [...new Set(strings.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function getUsedHeatNumbers(parts = [], weldPoints = []) {
  const fromParts = (parts || []).map((part) => (part?.heatNumber || "").trim());
  const fromWelds = (weldPoints || []).flatMap((weld) => [
    (weld?.heatNumber1 || "").trim(),
    (weld?.heatNumber2 || "").trim(),
  ]);
  return uniqueSorted([...fromParts, ...fromWelds]);
}

function getCertForHeat(heat, materialCertificates = []) {
  const h = (heat || "").trim();
  return (materialCertificates || []).find((c) => (c?.heatNumber || "").trim() === h) || null;
}

function getPartsForHeat(heat, parts = []) {
  const h = (heat || "").trim();
  return (parts || []).filter((p) => (p?.heatNumber || "").trim() === h);
}

function partLabel(p) {
  const n = p?.displayNumber != null ? `#${p.displayNumber}` : "";
  const t = (p?.partType || "").trim();
  return [n, t].filter(Boolean).join(" · ") || p?.id?.slice(0, 12) || "Part";
}

function filterHeatRows(heats, filterNorm, materialCertificates, documents) {
  if (!filterNorm) return heats;
  return heats.filter((heat) => {
    const cert = getCertForHeat(heat, materialCertificates);
    const doc = cert?.documentId
      ? (documents || []).find((d) => d?.id === cert.documentId)
      : null;
    const heatText = (heat || "").toLowerCase();
    const docText = (doc?.title || doc?.fileName || "").toLowerCase();
    return heatText.includes(filterNorm) || docText.includes(filterNorm);
  });
}

/** Heat/MTC registry with WPS-style setup: registered heats + in-use unregistered heats. */
function SettingsMaterialCertificatesPanel({
  materialCertificates = [],
  documents = [],
  weldPoints = [],
  parts = [],
  onUpdateCertificates,
  onUploadMtcPdf,
  onUploadOrphanMtcPdf,
}) {
  const mtcUploadInputRef = useRef(null);
  const mtcUploadHeatRef = useRef("");
  const orphanMtcUploadInputRef = useRef(null);
  const [expandedRegisteredHeat, setExpandedRegisteredHeat] = useState(null);
  const [expandedUnregisteredHeat, setExpandedUnregisteredHeat] = useState(null);
  const [filter, setFilter] = useState("");
  const [newHeatInput, setNewHeatInput] = useState("");
  const filterNorm = (filter || "").trim().toLowerCase();

  const mtcDocuments = useMemo(() => documents.filter((d) => d?.category === "mtc"), [documents]);

  const usedHeatNumbers = useMemo(() => getUsedHeatNumbers(parts, weldPoints), [parts, weldPoints]);

  const orphanMtcDocuments = useMemo(
    () =>
      mtcDocuments.filter(
        (doc) => !(materialCertificates || []).some((c) => c?.documentId === doc.id)
      ),
    [mtcDocuments, materialCertificates]
  );

  const registeredHeats = useMemo(() => {
    const rows = Array.isArray(materialCertificates) ? materialCertificates : [];
    return uniqueSorted(rows.map((row) => (row?.heatNumber || "").trim()));
  }, [materialCertificates]);
  const registeredSet = useMemo(() => new Set(registeredHeats), [registeredHeats]);
  const heatsInUseNotRegistered = useMemo(
    () => usedHeatNumbers.filter((heat) => !registeredSet.has(heat)),
    [usedHeatNumbers, registeredSet]
  );
  const filteredRegisteredHeats = useMemo(
    () => filterHeatRows(registeredHeats, filterNorm, materialCertificates, documents),
    [registeredHeats, filterNorm, materialCertificates, documents]
  );
  const filteredInUseNotRegistered = useMemo(
    () => filterHeatRows(heatsInUseNotRegistered, filterNorm, materialCertificates, documents),
    [heatsInUseNotRegistered, filterNorm, materialCertificates, documents]
  );

  const pushCertificates = useCallback(
    (next) => {
      onUpdateCertificates?.(next);
    },
    [onUpdateCertificates]
  );

  function ensureHeatRegistered(heatNumber) {
    const heat = (heatNumber || "").trim();
    if (!heat) return;
    const exists = (materialCertificates || []).some((item) => (item?.heatNumber || "").trim() === heat);
    if (exists) return;
    pushCertificates([
      ...(Array.isArray(materialCertificates) ? materialCertificates : []),
      { id: generateId("mtc"), heatNumber: heat, documentId: null, linkedPartIds: [] },
    ]);
  }

  function updateMtcHeatDocument(heatNumber, documentId) {
    const heat = (heatNumber || "").trim();
    if (!heat) return;
    const list = Array.isArray(materialCertificates) ? [...materialCertificates] : [];
    const idx = list.findIndex((item) => (item?.heatNumber || "").trim() === heat);
    const nextEntry = {
      id: idx >= 0 ? list[idx].id : generateId("mtc"),
      heatNumber: heat,
      documentId: documentId || null,
      linkedPartIds: idx >= 0 ? list[idx].linkedPartIds || [] : [],
    };
    if (idx >= 0) list[idx] = nextEntry;
    else list.push(nextEntry);
    pushCertificates(list);
  }

  function togglePartLinked(heat, partId, checked) {
    const h = (heat || "").trim();
    if (!h || !partId) return;
    const list = Array.isArray(materialCertificates) ? [...materialCertificates] : [];
    const idx = list.findIndex((item) => (item?.heatNumber || "").trim() === h);
    if (idx < 0) {
      list.push({
        id: generateId("mtc"),
        heatNumber: h,
        documentId: null,
        linkedPartIds: checked ? [partId] : [],
      });
    } else {
      const prev = list[idx].linkedPartIds || [];
      const nextIds = checked
        ? [...new Set([...prev, partId])]
        : prev.filter((id) => id !== partId);
      list[idx] = { ...list[idx], linkedPartIds: nextIds };
    }
    pushCertificates(list);
  }

  function linkOrphanDocToHeat(docId, heatInput) {
    const heat = (heatInput || "").trim();
    if (!heat || !docId) return;
    ensureHeatRegistered(heat);
    updateMtcHeatDocument(heat, docId);
  }

  function renderPartSubmenu(heat) {
    const heatParts = getPartsForHeat(heat, parts);
    const cert = getCertForHeat(heat, materialCertificates);
    const linked = new Set(cert?.linkedPartIds || []);

    if (heatParts.length === 0) {
      return (
        <p className="text-[11px] text-base-content/50 mt-1 pl-1">
          No parts with this heat number on the project.
        </p>
      );
    }

    return (
      <ul className="mt-1.5 space-y-0.5 pl-1 border-l-2 border-base-300/70 max-h-36 overflow-y-auto">
        {heatParts.map((p) => (
          <li key={p.id}>
            <label className="label cursor-pointer justify-start gap-2 py-0.5 min-h-0">
              <input
                type="checkbox"
                className="checkbox checkbox-xs"
                checked={linked.has(p.id)}
                onChange={(e) => togglePartLinked(heat, p.id, e.target.checked)}
              />
              <span className="label-text text-[11px]">{partLabel(p)}</span>
            </label>
          </li>
        ))}
      </ul>
    );
  }

  function renderHeatRow(heat, { rowType = "registered" }) {
    const linkedEntry = getCertForHeat(heat, materialCertificates);
    const linkedDocId = linkedEntry?.documentId || "";
    const isOpen = rowType === "registered" ? expandedRegisteredHeat === heat : expandedUnregisteredHeat === heat;
    const hasLinkedDoc = Boolean(linkedDocId);
    const toggleOpen = () => {
      if (rowType === "registered") setExpandedRegisteredHeat(isOpen ? null : heat);
      else setExpandedUnregisteredHeat(isOpen ? null : heat);
    };
    const usagePartCount = getPartsForHeat(heat, parts).length;
    const usageWeldCount = (weldPoints || []).filter(
      (weld) =>
        (weld?.heatNumber1 || "").trim() === heat ||
        (weld?.heatNumber2 || "").trim() === heat
    ).length;

    return (
      <li
        key={heat}
        className="bg-base-100 rounded-lg overflow-hidden border border-primary/40"
      >
        <div className="flex items-center gap-2 p-2 min-w-0">
          <button
            type="button"
            className="flex-1 min-w-0 text-left"
            onClick={toggleOpen}
            title={heat}
          >
            <span className="font-medium text-sm text-primary font-mono truncate">{heat}</span>
          </button>
          <span className="badge badge-ghost badge-xs shrink-0">{usagePartCount} part(s)</span>
          <span className="badge badge-ghost badge-xs shrink-0">{usageWeldCount} weld(s)</span>
          {rowType === "unregistered" && (
            <button
              type="button"
              className="btn btn-primary btn-xs shrink-0"
              onClick={() => ensureHeatRegistered(heat)}
            >
              Register
            </button>
          )}
          <button
            type="button"
            className="btn btn-ghost btn-xs btn-square shrink-0"
            onClick={toggleOpen}
            aria-expanded={isOpen}
            aria-label={isOpen ? "Collapse" : "Expand"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        {isOpen && (
          <div className="border-t border-base-300 px-2 py-2 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="select select-bordered select-xs flex-1 min-w-[8rem] max-w-md"
                value={linkedDocId}
                onChange={(e) => {
                  ensureHeatRegistered(heat);
                  updateMtcHeatDocument(heat, e.target.value);
                }}
              >
                <option value="">{hasLinkedDoc ? "No MTC linked" : "No MTC linked"}</option>
                {mtcDocuments.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.title || doc.fileName}
                  </option>
                ))}
              </select>
              {!linkedDocId && (
                <button
                  type="button"
                  className="btn btn-ghost btn-xs shrink-0"
                  onClick={() => {
                    mtcUploadHeatRef.current = heat;
                    mtcUploadInputRef.current?.click();
                  }}
                >
                  Load PDF
                </button>
              )}
            </div>
            <div>
              <p className="text-[11px] font-medium text-base-content/80 mb-1">Parts for this heat (link for traceability)</p>
              {renderPartSubmenu(heat)}
            </div>
          </div>
        )}
      </li>
    );
  }

  return (
    <div className="space-y-4 min-w-0">
      <p className="text-xs text-base-content/70">
        Maintain heat numbers here with the same registry flow as WPS: register rows, link MTC PDFs, and review heat
        values in use but not yet registered.
      </p>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-base-content">Registered heat numbers</h3>
        <p className="text-[11px] text-base-content/60">
          Rows in this table are your managed heat register. Link a PDF and map parts for traceability completeness.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div className="form-control min-w-0">
          <label className="label py-0" htmlFor="heat-registry-filter">
            <span className="label-text text-xs">Search</span>
          </label>
          <input
            id="heat-registry-filter"
            type="search"
            className="input input-bordered input-xs w-full"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Heat number or linked document..."
            autoComplete="off"
          />
        </div>
        <div className="flex items-end gap-1 min-w-0">
          <input
            type="text"
            className="input input-bordered input-xs w-32 font-mono"
            value={newHeatInput}
            onChange={(e) => setNewHeatInput(e.target.value)}
            placeholder="Heat #"
          />
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              ensureHeatRegistered(newHeatInput);
              setNewHeatInput("");
            }}
          >
            + Add heat
          </button>
        </div>
      </div>

      {orphanMtcDocuments.length > 0 && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-2 space-y-1">
          <p className="text-[11px] font-medium text-base-content/80">
            MTC PDFs in the project file are not linked to any heat row yet. Assign them below.
          </p>
          <ul className="space-y-2">
            {orphanMtcDocuments.map((doc) => (
              <OrphanMtcRow
                key={doc.id}
                doc={doc}
                onAssignHeat={(heat) => linkOrphanDocToHeat(doc.id, heat)}
              />
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={orphanMtcUploadInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            onUploadOrphanMtcPdf?.(file);
          }}
        />
        <button
          type="button"
          className="btn btn-outline btn-xs"
          onClick={() => orphanMtcUploadInputRef.current?.click()}
        >
          Upload MTC PDF (no heat yet)
        </button>
      </div>

      {filteredRegisteredHeats.length === 0 ? (
        <div className="text-center text-base-content/50 py-4 text-[11px] rounded-lg border border-base-300 bg-base-100/50">
          {filterNorm ? "No matching registered heat rows." : "No registered heat rows yet."}
        </div>
      ) : (
        <ul className="space-y-2">
          {filteredRegisteredHeats.map((heat) => renderHeatRow(heat, { rowType: "registered" }))}
        </ul>
      )}

      <div className="space-y-2 pt-2 border-t border-base-300">
        <h3 className="text-sm font-semibold text-base-content">Heat numbers in use but not registered</h3>
        <p className="text-[11px] text-base-content/60">
          These values are used on parts or welds but do not yet exist as registered heat rows.
        </p>
      </div>

      {filteredInUseNotRegistered.length === 0 ? (
        <div className="text-center text-base-content/50 py-4 text-[11px] rounded-lg border border-base-300 bg-base-100/50">
          None — all in-use heat numbers are registered, or no heat numbers are used yet.
        </div>
      ) : (
        <ul className="space-y-2">
          {filteredInUseNotRegistered.map((heat) => renderHeatRow(heat, { rowType: "unregistered" }))}
        </ul>
      )}

      <input
        ref={mtcUploadInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          const heat = (mtcUploadHeatRef.current || "").trim();
          if (!file || !heat) return;
          onUploadMtcPdf?.(heat, file);
          mtcUploadHeatRef.current = "";
        }}
      />
    </div>
  );
}

function OrphanMtcRow({ doc, onAssignHeat }) {
  const [heatInput, setHeatInput] = useState("");
  return (
    <li className="flex flex-wrap items-end gap-2 border border-primary/40 rounded-lg p-2 bg-base-100">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium truncate">{doc.title || doc.fileName}</p>
        <p className="text-[10px] text-base-content/50 truncate">{doc.fileName}</p>
      </div>
      <div className="flex gap-1 items-center">
        <input
          type="text"
          className="input input-bordered input-xs w-32 font-mono"
          value={heatInput}
          onChange={(e) => setHeatInput(e.target.value)}
          placeholder="Heat #"
        />
        <button
          type="button"
          className="btn btn-primary btn-xs"
          onClick={() => {
            onAssignHeat(heatInput);
            setHeatInput("");
          }}
        >
          Assign to heat
        </button>
      </div>
    </li>
  );
}

export default SettingsMaterialCertificatesPanel;
