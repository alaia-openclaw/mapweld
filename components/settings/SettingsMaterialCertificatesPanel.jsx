"use client";

import { useMemo, useRef, useCallback, useState } from "react";
import { TRACEABILITY } from "@/lib/traceability-groups";
import SettingsTraceabilitySection from "@/components/settings/SettingsTraceabilitySection";

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
  onUploadOrphanMtcPdf,
}) {
  const mtcUploadInputRef = useRef(null);
  const mtcUploadHeatRef = useRef("");
  const orphanMtcUploadInputRef = useRef(null);
  const [expandedHeat, setExpandedHeat] = useState(null);

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
    const isOpen = expandedHeat === heat;

    return (
      <li
        key={heat}
        className="bg-base-100 rounded-lg overflow-hidden border border-primary/40"
      >
        <div className="flex items-center gap-2 p-2 min-w-0">
          <button
            type="button"
            className="flex-1 min-w-0 text-left"
            onClick={() => setExpandedHeat(isOpen ? null : heat)}
            title={heat}
          >
            <span className="font-medium text-sm text-primary font-mono truncate">{heat}</span>
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-xs btn-square shrink-0"
            onClick={() => setExpandedHeat(isOpen ? null : heat)}
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
            <div>
              <p className="text-[11px] font-medium text-base-content/80 mb-1">Parts for this heat (link for traceability)</p>
              {renderPartSubmenu(heat)}
            </div>
          </div>
        )}
      </li>
    );
  }

  const th = TRACEABILITY.heat;

  return (
    <div className="space-y-4 min-w-0">
      <p className="text-xs text-base-content/70">
        Heat / MTC traceability uses the same three groups as WPS, WQR, and electrodes: PDF on file vs project use,
        then full part linkage.
      </p>

      <SettingsTraceabilitySection number={1} title={th.g1.title} description={th.g1.description}>
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
          <span className="text-[10px] text-base-content/45">
            Adds to this list; assign to a heat when ready.
          </span>
        </div>

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
      </SettingsTraceabilitySection>

      <SettingsTraceabilitySection number={2} title={th.g2.title} description={th.g2.description}>
        {heatsNoPdf.length === 0 ? (
          <p className="text-sm text-base-content/50">None in this group.</p>
        ) : (
          <ul className="space-y-2">
            {heatsNoPdf.map((heat) => renderHeatRow(heat, { showPdfSelect: true, showLoad: true }))}
          </ul>
        )}
      </SettingsTraceabilitySection>

      <SettingsTraceabilitySection number={3} title={th.g3.title} description={th.g3.description}>
        {heatsPdfWithParts.length === 0 ? (
          <p className="text-sm text-base-content/50">None in this group yet.</p>
        ) : (
          <ul className="space-y-2">
            {heatsPdfWithParts.map((heat) => renderHeatRow(heat, { showPdfSelect: true, showLoad: true }))}
          </ul>
        )}
      </SettingsTraceabilitySection>

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
