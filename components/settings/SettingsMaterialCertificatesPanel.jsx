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

/** MTC by heat — three groups: PDF without part links, heats missing PDF, heats with PDF (+ part links). */
function SettingsMaterialCertificatesPanel({
  materialCertificates = [],
  documents = [],
  weldPoints = [],
  parts = [],
  onUpdateCertificates,
  onUploadMtcPdf,
}) {
  const mtcUploadInputRef = useRef(null);
  const mtcUploadHeatRef = useRef("");

  const mtcDocuments = useMemo(() => documents.filter((d) => d?.category === "mtc"), [documents]);

  const usedHeatNumbers = useMemo(() => getUsedHeatNumbers(parts, weldPoints), [parts, weldPoints]);

  const orphanMtcDocuments = useMemo(
    () =>
      mtcDocuments.filter(
        (doc) => !(materialCertificates || []).some((c) => c?.documentId === doc.id)
      ),
    [mtcDocuments, materialCertificates]
  );

  const { heatsNoPdf, heatsPdfNoParts, heatsPdfWithParts } = useMemo(() => {
    const noPdf = [];
    const pdfNoParts = [];
    const pdfWithParts = [];
    for (const heat of usedHeatNumbers) {
      const cert = getCertForHeat(heat, materialCertificates);
      const hasDoc = Boolean(cert?.documentId);
      const linked = cert?.linkedPartIds || [];
      const hasPartLinks = Array.isArray(linked) && linked.length > 0;
      if (!hasDoc) noPdf.push(heat);
      else if (!hasPartLinks) pdfNoParts.push(heat);
      else pdfWithParts.push(heat);
    }
    return { heatsNoPdf: noPdf, heatsPdfNoParts: pdfNoParts, heatsPdfWithParts: pdfWithParts };
  }, [usedHeatNumbers, materialCertificates]);

  const pushCertificates = useCallback(
    (next) => {
      onUpdateCertificates?.(next);
    },
    [onUpdateCertificates]
  );

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

  function renderHeatRow(heat, { showPdfSelect, showLoad }) {
    const linkedEntry = getCertForHeat(heat, materialCertificates);
    const linkedDocId = linkedEntry?.documentId || "";

    return (
      <li
        key={heat}
        className="border border-base-300 rounded-lg p-2 bg-base-100 space-y-1"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono font-medium truncate max-w-[10rem]" title={heat}>
            {heat}
          </span>
          {showPdfSelect && (
            <select
              className="select select-bordered select-xs flex-1 min-w-[8rem] max-w-md"
              value={linkedDocId}
              onChange={(e) => updateMtcHeatDocument(heat, e.target.value)}
            >
              <option value="">No MTC linked</option>
              {mtcDocuments.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.title || doc.fileName}
                </option>
              ))}
            </select>
          )}
          {showLoad && !linkedDocId && (
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
        <details className="collapse collapse-arrow bg-base-200/40 rounded-md min-h-0">
          <summary className="collapse-title text-[11px] font-medium py-1 min-h-0">
            Parts for this heat (link for traceability)
          </summary>
          <div className="collapse-content !p-2 !pt-0">{renderPartSubmenu(heat)}</div>
        </details>
      </li>
    );
  }

  return (
    <div className="space-y-4 min-w-0">
      <p className="text-xs text-base-content/70">
        Material certificates grouped by status: PDF without part links, heats missing MTC PDF, and heats with MTC
        PDF linked.
      </p>

      {/* 1 — MTC loaded but not attributed to a part */}
      <section className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-base-content/70 border-b border-base-300 pb-1">
          1 · MTC PDF loaded — not linked to any part
        </h4>
        <p className="text-[11px] text-base-content/55">
          Certificate PDF is set, but no part is checked below. Link parts that use this heat.
        </p>

        {orphanMtcDocuments.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-medium text-base-content/80">Unassigned MTC files (not tied to a heat)</p>
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

        {heatsPdfNoParts.length === 0 && orphanMtcDocuments.length === 0 && (
          <p className="text-sm text-base-content/50">None in this group.</p>
        )}

        {heatsPdfNoParts.length > 0 && (
          <ul className="space-y-2">
            {heatsPdfNoParts.map((heat) => renderHeatRow(heat, { showPdfSelect: true, showLoad: true }))}
          </ul>
        )}
      </section>

      {/* 2 — Heat in use, no MTC PDF */}
      <section className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-base-content/70 border-b border-base-300 pb-1">
          2 · Heat in use — no MTC PDF
        </h4>
        <p className="text-[11px] text-base-content/55">
          Heats referenced on parts or welds without a linked certificate PDF yet.
        </p>
        {heatsNoPdf.length === 0 ? (
          <p className="text-sm text-base-content/50">None in this group.</p>
        ) : (
          <ul className="space-y-2">
            {heatsNoPdf.map((heat) => renderHeatRow(heat, { showPdfSelect: true, showLoad: true }))}
          </ul>
        )}
      </section>

      {/* 3 — Heat with MTC PDF + part links */}
      <section className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-base-content/70 border-b border-base-300 pb-1">
          3 · Heat with MTC PDF — linked to parts
        </h4>
        <p className="text-[11px] text-base-content/55">
          Heats with a certificate PDF and at least one part attributed for traceability.
        </p>
        {heatsPdfWithParts.length === 0 ? (
          <p className="text-sm text-base-content/50">None in this group yet.</p>
        ) : (
          <ul className="space-y-2">
            {heatsPdfWithParts.map((heat) => renderHeatRow(heat, { showPdfSelect: true, showLoad: true }))}
          </ul>
        )}
      </section>

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
    <li className="flex flex-wrap items-end gap-2 border border-base-300 rounded-lg p-2 bg-base-100">
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
