"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { groupElectrodeEntries, TRACEABILITY } from "@/lib/traceability-groups";
import SettingsTraceabilitySection from "@/components/settings/SettingsTraceabilitySection";

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

function filterElectrodeEntries(entries, filterNorm) {
  if (!filterNorm) return entries;
  return entries.filter((e) => {
    const c = (e.code || "").toLowerCase();
    const t = (e.title || "").toLowerCase();
    return c.includes(filterNorm) || t.includes(filterNorm);
  });
}

/**
 * Electrode register: codes + linked certificate PDFs (stored in project `documents[]` with category electrode).
 */
function SettingsElectrodePanel({ documents = [], electrodeLibrary = [], weldPoints = [], onSave }) {
  const [localDocuments, setLocalDocuments] = useState([]);
  const [localElectrodeLibrary, setLocalElectrodeLibrary] = useState([]);
  const [filter, setFilter] = useState("");
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

  const filterNorm = (filter || "").trim().toLowerCase();

  const { g1, g2, g3, orphanElectrodeDocuments } = useMemo(
    () => groupElectrodeEntries(localElectrodeLibrary, weldPoints, localDocuments),
    [localElectrodeLibrary, weldPoints, localDocuments]
  );

  const rowsG1 = useMemo(() => filterElectrodeEntries(g1, filterNorm), [g1, filterNorm]);
  const rowsG2 = useMemo(() => filterElectrodeEntries(g2, filterNorm), [g2, filterNorm]);
  const rowsG3 = useMemo(() => filterElectrodeEntries(g3, filterNorm), [g3, filterNorm]);

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

  function renderRow(entry) {
    return (
      <tr key={entry.id} className="hover">
        <td>
          <input
            type="text"
            className="input input-bordered input-xs w-full min-w-[6rem] font-mono"
            value={entry.code || ""}
            onChange={(e) => handleUpdateElectrode(entry.id, { code: e.target.value.toUpperCase() })}
            placeholder="Code"
          />
        </td>
        <td>
          <input
            type="text"
            className="input input-bordered input-xs w-full min-w-[10rem]"
            value={entry.title || ""}
            onChange={(e) => handleUpdateElectrode(entry.id, { title: e.target.value })}
            placeholder="Description"
          />
        </td>
        <td>
          <div className="flex flex-wrap gap-1 items-center">
            <select
              className="select select-bordered select-xs flex-1 min-w-[8rem]"
              value={entry.documentId || ""}
              onChange={(e) => handleUpdateElectrode(entry.id, { documentId: e.target.value || null })}
            >
              <option value="">No PDF linked</option>
              {electrodeVaultDocuments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title || d.fileName}
                </option>
              ))}
            </select>
            {!entry.documentId && (
              <button
                type="button"
                className="btn btn-ghost btn-xs shrink-0"
                onClick={() => {
                  electrodeUploadTargetRef.current = entry.id;
                  electrodeUploadInputRef.current?.click();
                }}
              >
                Load
              </button>
            )}
          </div>
        </td>
        <td>
          <div className="flex justify-end">
            <button
              type="button"
              className="btn btn-ghost btn-xs text-error"
              onClick={() => handleRemoveElectrode(entry.id)}
            >
              Remove
            </button>
          </div>
        </td>
      </tr>
    );
  }

  function renderBody(entries) {
    if (entries.length === 0) {
      return (
        <tr>
          <td colSpan={4} className="text-center text-base-content/50 py-4 text-[11px]">
            None in this group{filterNorm ? " (search)" : ""}.
          </td>
        </tr>
      );
    }
    return entries.map((entry) => renderRow(entry));
  }

  const t = TRACEABILITY.electrode;
  const hasAny = localElectrodeLibrary.length > 0;

  return (
    <div className="space-y-4 min-w-0">
      <p className="text-xs text-base-content/70">
        Electrode codes used on weld records. Same traceability groups as WPS and material certificates: PDF on file
        vs usage on welds.
      </p>

      <div className="flex flex-col sm:flex-row gap-2 sm:items-end sm:justify-between">
        <div className="form-control flex-1 min-w-0 max-w-md">
          <label className="label py-0" htmlFor="electrode-registry-filter">
            <span className="label-text text-xs">Search</span>
          </label>
          <input
            id="electrode-registry-filter"
            type="search"
            className="input input-bordered input-xs w-full"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Code, description…"
            autoComplete="off"
          />
        </div>
        <button type="button" className="btn btn-primary btn-sm shrink-0" onClick={handleAddElectrode}>
          + Add electrode
        </button>
      </div>

      <SettingsTraceabilitySection number={1} title={t.g1.title} description={t.g1.description}>
        {orphanElectrodeDocuments.length > 0 && (
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-2 space-y-1 mb-2">
            <p className="text-[11px] font-medium text-base-content/80">
              Unassigned electrode PDFs (link from a row below)
            </p>
            <ul className="text-[11px] space-y-0.5">
              {orphanElectrodeDocuments.map((d) => (
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
                <th>Code</th>
                <th>Description</th>
                <th className="min-w-[12rem]">Certificate PDF</th>
                <th className="w-28"> </th>
              </tr>
            </thead>
            <tbody>
              {!hasAny ? (
                <tr>
                  <td colSpan={4} className="text-center text-base-content/50 py-6">
                    No electrode entries yet.
                  </td>
                </tr>
              ) : (
                renderBody(rowsG1)
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
                <th>Code</th>
                <th>Description</th>
                <th className="min-w-[12rem]">Certificate PDF</th>
                <th className="w-28"> </th>
              </tr>
            </thead>
            <tbody>{renderBody(rowsG2)}</tbody>
          </table>
        </div>
      </SettingsTraceabilitySection>

      <SettingsTraceabilitySection number={3} title={t.g3.title} description={t.g3.description}>
        <div className="overflow-x-auto border border-base-300 rounded-lg">
          <table className="table table-xs table-pin-rows">
            <thead>
              <tr className="bg-base-200">
                <th>Code</th>
                <th>Description</th>
                <th className="min-w-[12rem]">Certificate PDF</th>
                <th className="w-28"> </th>
              </tr>
            </thead>
            <tbody>{renderBody(rowsG3)}</tbody>
          </table>
        </div>
      </SettingsTraceabilitySection>

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
