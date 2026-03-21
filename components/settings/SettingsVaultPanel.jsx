"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { SETTINGS_DOCUMENT_CATEGORIES, getSettingsDocumentCategoryLabel } from "@/lib/settings-documents";

function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      const base64 = typeof result === "string" ? result.replace(/^data:.*?;base64,/, "") : "";
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getNdtAttachmentDocuments(ndtReports = []) {
  return (ndtReports || []).flatMap((report) => {
    const reportDate = report?.reportDate || "NDT";
    const method = report?.method || "NDT";
    return (report?.attachments || [])
      .filter((attachment) => attachment?.base64)
      .map((attachment) => ({
        id: `ndt-att-${report.id || "report"}-${attachment.id || attachment.name || Math.random().toString(36).slice(2, 7)}`,
        title: attachment.name?.replace(/\.pdf$/i, "") || `${method} ${reportDate}`,
        category: "ndt_report_attachment",
        fileName: attachment.name || `${method}-${reportDate}.pdf`,
        mimeType: "application/pdf",
        base64: attachment.base64,
        createdAt: report?.createdAt || new Date().toISOString(),
        isReadOnlyFromNdt: true,
      }));
  });
}

/**
 * Document vault + electrode register (Settings). Syncs to parent via onSave.
 */
function SettingsVaultPanel({
  documents = [],
  electrodeLibrary = [],
  ndtReports = [],
  onSave,
}) {
  const [localDocuments, setLocalDocuments] = useState([]);
  const [localElectrodeLibrary, setLocalElectrodeLibrary] = useState([]);
  const [uploadCategory, setUploadCategory] = useState("other");
  const [uploadTitle, setUploadTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [vaultCategoryFilter, setVaultCategoryFilter] = useState("all");
  const electrodeUploadInputRef = useRef(null);
  const electrodeUploadTargetRef = useRef(null);

  useEffect(() => {
    const providedDocuments = Array.isArray(documents) ? documents : [];
    const ndtAttachmentDocuments = getNdtAttachmentDocuments(ndtReports);
    const mergedById = new Map();
    [...providedDocuments, ...ndtAttachmentDocuments].forEach((doc) => {
      if (!doc?.id) return;
      mergedById.set(doc.id, doc);
    });
    setLocalDocuments([...mergedById.values()]);
    setLocalElectrodeLibrary(Array.isArray(electrodeLibrary) ? electrodeLibrary.map((e) => ({ ...e })) : []);
    setUploadCategory("other");
    setUploadTitle("");
    setVaultCategoryFilter("all");
  }, [documents, electrodeLibrary, ndtReports]);

  const documentsByCategory = useMemo(() => {
    const map = new Map();
    localDocuments.forEach((doc) => {
      const category = doc?.category || "other";
      if (!map.has(category)) map.set(category, []);
      map.get(category).push(doc);
    });
    return map;
  }, [localDocuments]);

  const electrodeVaultDocuments = useMemo(
    () => localDocuments.filter((doc) => doc?.category === "electrode" && !doc?.isReadOnlyFromNdt),
    [localDocuments]
  );

  const filteredVaultDocuments = useMemo(() => {
    const sorted = localDocuments
      .slice()
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    if (vaultCategoryFilter === "all") return sorted;
    return sorted.filter((doc) => doc.category === vaultCategoryFilter);
  }, [localDocuments, vaultCategoryFilter]);

  function pushSave(nextDocs, nextElec) {
    onSave?.({
      documents: nextDocs.filter((doc) => !doc?.isReadOnlyFromNdt),
      electrodeLibrary: nextElec,
    });
  }

  async function handleUploadFiles(event) {
    const files = event.target.files;
    if (!files?.length) return;
    setIsUploading(true);
    try {
      const uploads = await Promise.all(
        Array.from(files).map(async (file) => ({
          id: generateId("doc"),
          title: uploadTitle.trim() || file.name.replace(/\.pdf$/i, ""),
          category: uploadCategory,
          fileName: file.name,
          mimeType: file.type || "application/pdf",
          base64: await fileToBase64(file),
          createdAt: new Date().toISOString(),
        }))
      );
      const next = [...localDocuments, ...uploads];
      setLocalDocuments(next);
      pushSave(next, localElectrodeLibrary);
      setUploadTitle("");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  function removeDocument(documentId) {
    const doc = localDocuments.find((item) => item.id === documentId);
    if (doc?.isReadOnlyFromNdt) return;
    const next = localDocuments.filter((d) => d.id !== documentId);
    const nextElec = localElectrodeLibrary.map((e) =>
      e.documentId === documentId ? { ...e, documentId: null } : e
    );
    setLocalDocuments(next);
    setLocalElectrodeLibrary(nextElec);
    pushSave(next, nextElec);
  }

  function handleAddElectrode() {
    const nextCode = `ELEC-${String(localElectrodeLibrary.length + 1).padStart(3, "0")}`;
    const next = [...localElectrodeLibrary, { id: generateId("elec"), code: nextCode, title: "", documentId: null }];
    setLocalElectrodeLibrary(next);
    pushSave(localDocuments, next);
  }

  function handleRemoveElectrode(electrodeId) {
    const next = localElectrodeLibrary.filter((entry) => entry.id !== electrodeId);
    setLocalElectrodeLibrary(next);
    pushSave(localDocuments, next);
  }

  function handleUpdateElectrode(electrodeId, updates) {
    const next = localElectrodeLibrary.map((entry) =>
      entry.id === electrodeId ? { ...entry, ...updates } : entry
    );
    setLocalElectrodeLibrary(next);
    pushSave(localDocuments, next);
  }

  async function handleUploadElectrodeCertificate(electrodeId, event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    const resolvedId = electrodeId || electrodeUploadTargetRef.current;
    if (!file || !resolvedId) return;
    const entry = localElectrodeLibrary.find((item) => item.id === resolvedId);
    if (!entry) return;
    const uploaded = {
      id: generateId("doc"),
      title: (entry.code || file.name || "Electrode").replace(/\.pdf$/i, ""),
      category: "electrode",
      fileName: file.name,
      mimeType: file.type || "application/pdf",
      base64: await fileToBase64(file),
      createdAt: new Date().toISOString(),
    };
    const nextDocs = [...localDocuments, uploaded];
    const nextElec = localElectrodeLibrary.map((item) =>
      item.id === resolvedId ? { ...item, documentId: uploaded.id } : item
    );
    setLocalDocuments(nextDocs);
    setLocalElectrodeLibrary(nextElec);
    electrodeUploadTargetRef.current = null;
    pushSave(nextDocs, nextElec);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[12rem_minmax(0,1fr)] gap-3 min-w-0">
      <aside className="border border-base-300 rounded-lg bg-base-100 p-2 h-fit">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-base-content/60 px-1 py-1">Categories</p>
        <ul className="menu menu-xs">
          <li>
            <button
              type="button"
              className={vaultCategoryFilter === "all" ? "active" : ""}
              onClick={() => setVaultCategoryFilter("all")}
            >
              All ({localDocuments.length})
            </button>
          </li>
          {SETTINGS_DOCUMENT_CATEGORIES.map((category) => {
            const count = (documentsByCategory.get(category.id) || []).length;
            return (
              <li key={category.id}>
                <button
                  type="button"
                  className={vaultCategoryFilter === category.id ? "active" : ""}
                  onClick={() => setVaultCategoryFilter(category.id)}
                >
                  {category.label} ({count})
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <div className="space-y-4 min-w-0">
        <div className="border border-base-300 rounded-lg p-3 bg-base-100">
          <h4 className="font-medium text-sm">Upload PDF documents</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
            <input
              type="text"
              className="input input-bordered input-xs"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              placeholder="Optional title"
            />
            {vaultCategoryFilter === "all" ? (
              <select
                className="select select-bordered select-xs"
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
              >
                {SETTINGS_DOCUMENT_CATEGORIES.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                className="input input-bordered input-xs"
                value={getSettingsDocumentCategoryLabel(vaultCategoryFilter)}
                disabled
                readOnly
              />
            )}
            <input
              type="file"
              accept=".pdf,application/pdf"
              multiple
              className="file-input file-input-bordered file-input-xs w-full"
              onChange={handleUploadFiles}
              disabled={isUploading}
            />
          </div>
          {isUploading && <p className="text-xs text-base-content/60 mt-2">Uploading…</p>}
        </div>

        {(vaultCategoryFilter === "all" || vaultCategoryFilter === "electrode") && (
          <div className="border border-base-300 rounded-lg p-3 bg-base-100 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="font-medium text-sm">Electrode register</h4>
                <p className="text-xs text-base-content/60 mt-0.5">Codes used on weld records; link certificate PDFs.</p>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleAddElectrode}>
                + Add electrode
              </button>
            </div>
            <ul className="space-y-2">
              {localElectrodeLibrary.map((entry) => (
                <li key={entry.id} className="p-2 bg-base-200 rounded-lg space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input
                      type="text"
                      className="input input-bordered input-xs"
                      value={entry.code || ""}
                      onChange={(e) => handleUpdateElectrode(entry.id, { code: e.target.value.toUpperCase() })}
                      placeholder="Electrode code"
                    />
                    <input
                      type="text"
                      className="input input-bordered input-xs"
                      value={entry.title || ""}
                      onChange={(e) => handleUpdateElectrode(entry.id, { title: e.target.value })}
                      placeholder="Description"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-end">
                    <div className="form-control">
                      <label className="label py-0">
                        <span className="label-text text-xs">Linked electrode PDF</span>
                      </label>
                      <div className="flex gap-1">
                        <select
                          className="select select-bordered select-xs flex-1"
                          value={entry.documentId || ""}
                          onChange={(e) =>
                            handleUpdateElectrode(entry.id, { documentId: e.target.value || null })
                          }
                        >
                          <option value="">No PDF linked</option>
                          {electrodeVaultDocuments.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.title || d.fileName}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            electrodeUploadTargetRef.current = entry.id;
                            electrodeUploadInputRef.current?.click();
                          }}
                        >
                          Load
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs text-error"
                        onClick={() => handleRemoveElectrode(entry.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {localElectrodeLibrary.length === 0 && (
              <p className="text-sm text-base-content/50">No electrode entries yet.</p>
            )}
          </div>
        )}

        {filteredVaultDocuments.length === 0 ? (
          <p className="text-sm text-base-content/60">No documents in this category.</p>
        ) : (
          <ul className="space-y-2">
            {filteredVaultDocuments.map((doc) => (
              <li key={doc.id} className="border border-base-300 rounded-lg p-3 bg-base-100">
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{doc.title || doc.fileName}</p>
                    <p className="text-xs text-base-content/60 truncate">
                      {getSettingsDocumentCategoryLabel(doc.category)} · {doc.fileName}
                    </p>
                  </div>
                  {doc.isReadOnlyFromNdt ? (
                    <span className="badge badge-ghost badge-sm">From NDT</span>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs text-error"
                      onClick={() => removeDocument(doc.id)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        <input
          ref={electrodeUploadInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => handleUploadElectrodeCertificate(electrodeUploadTargetRef.current, e)}
        />
      </div>
    </div>
  );
}

export default SettingsVaultPanel;
