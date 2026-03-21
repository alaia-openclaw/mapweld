"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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

/**
 * Electrode register: codes + linked certificate PDFs (stored in project `documents[]` with category electrode).
 */
function SettingsElectrodePanel({ documents = [], electrodeLibrary = [], onSave }) {
  const [localDocuments, setLocalDocuments] = useState([]);
  const [localElectrodeLibrary, setLocalElectrodeLibrary] = useState([]);
  const electrodeUploadInputRef = useRef(null);
  const electrodeUploadTargetRef = useRef(null);

  useEffect(() => {
    setLocalDocuments(Array.isArray(documents) ? documents.map((d) => ({ ...d })) : []);
    setLocalElectrodeLibrary(Array.isArray(electrodeLibrary) ? electrodeLibrary.map((e) => ({ ...e })) : []);
  }, [documents, electrodeLibrary]);

  const electrodeVaultDocuments = useMemo(
    () => localDocuments.filter((doc) => doc?.category === "electrode" && !doc?.isReadOnlyFromNdt),
    [localDocuments]
  );

  function pushSave(nextDocs, nextElec) {
    onSave?.({
      documents: nextDocs,
      electrodeLibrary: nextElec,
    });
  }

  function handleAddElectrode() {
    const nextCode = `ELEC-${String(localElectrodeLibrary.length + 1).padStart(3, "0")}`;
    const next = [
      ...localElectrodeLibrary,
      { id: generateId("elec"), code: nextCode, title: "", documentId: null },
    ];
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
    <div className="space-y-3 min-w-0">
      <p className="text-xs text-base-content/70">
        Electrode codes used on weld records. Link each entry to a certificate PDF (stored in the project file).
      </p>
      <div className="border border-base-300 rounded-lg p-3 bg-base-100 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-medium text-sm">Electrode register</h4>
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
      <input
        ref={electrodeUploadInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(e) => handleUploadElectrodeCertificate(electrodeUploadTargetRef.current, e)}
      />
    </div>
  );
}

export default SettingsElectrodePanel;
