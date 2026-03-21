"use client";

import { useRef } from "react";
import { getDatabookLinkedRequirements } from "@/lib/databook-sections";

function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** MTC by heat number — links vault MTC PDFs to heats used on parts/welds. */
function SettingsMaterialCertificatesPanel({
  materialCertificates = [],
  documents = [],
  weldPoints = [],
  parts = [],
  personnel = {},
  wpsLibrary = [],
  onUpdateCertificates,
  onUploadMtcPdf,
}) {
  const mtcUploadInputRef = useRef(null);
  const mtcUploadHeatRef = useRef("");

  const linked = getDatabookLinkedRequirements({
    weldPoints,
    parts,
    personnel,
    wpsLibrary,
    materialCertificates,
  });
  const requiredHeatNumbers = linked.usedHeatNumbers || [];
  const mtcDocuments = documents.filter((d) => d?.category === "mtc");

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
    onUpdateCertificates?.(list);
  }

  return (
    <div className="space-y-3 min-w-0">
      <p className="text-xs text-base-content/70">
        Link material certificates (MTC) to heat numbers referenced on parts and weld records.
      </p>
      {requiredHeatNumbers.length === 0 ? (
        <p className="text-sm text-base-content/50">No heat numbers referenced in parts/weld data yet.</p>
      ) : (
        <ul className="space-y-2">
          {requiredHeatNumbers.map((heat) => {
            const linkedEntry = (materialCertificates || []).find(
              (item) => (item?.heatNumber || "").trim() === heat
            );
            const linkedDocId = linkedEntry?.documentId || "";
            return (
              <li
                key={heat}
                className="grid grid-cols-1 md:grid-cols-[9rem_minmax(0,1fr)_auto] gap-2 items-center border border-base-300 rounded-lg p-2 bg-base-100"
              >
                <span className="text-xs font-medium truncate" title={heat}>
                  {heat}
                </span>
                <select
                  className="select select-bordered select-xs w-full"
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
                {!linkedDocId && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    onClick={() => {
                      mtcUploadHeatRef.current = heat;
                      mtcUploadInputRef.current?.click();
                    }}
                  >
                    Load
                  </button>
                )}
              </li>
            );
          })}
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

export default SettingsMaterialCertificatesPanel;
