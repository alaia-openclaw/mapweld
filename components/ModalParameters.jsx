"use client";

import { useState, useEffect, useRef } from "react";
import { NDT_METHODS, NDT_METHOD_LABELS, sortNdtMethods } from "@/lib/constants";

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const value = typeof reader.result === "string" ? reader.result : "";
      resolve(value.replace(/^data:.*?;base64,/, ""));
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ModalParameters({
  isOpen,
  onClose,
  settings = { ndtRequirements: [], weldingSpec: "" },
  personnel = { fitters: [], welders: [], wqrs: [] },
  systems = [],
  projectSettings = { steps: [] },
  projectMeta = { projectName: "", client: "", spec: "", revision: "", date: "" },
  wpsLibrary = [],
  electrodeLibrary = [],
  documents = [],
  onSave,
}) {
  const [activeTab, setActiveTab] = useState("default");

  // Default NDT state
  const [ndtRequirements, setNdtRequirements] = useState([]);
  const [weldingSpec, setWeldingSpec] = useState("");
  const [customNdtMethod, setCustomNdtMethod] = useState("");

  // Project meta state
  const [metaProjectName, setMetaProjectName] = useState("");
  const [metaClient, setMetaClient] = useState("");
  const [metaSpec, setMetaSpec] = useState("");
  const [metaRevision, setMetaRevision] = useState("");
  const [metaDate, setMetaDate] = useState("");
  const [projectSystems, setProjectSystems] = useState([]);
  const [projectWpsLibrary, setProjectWpsLibrary] = useState([]);

  // Personnel state
  const [personnelSubtab, setPersonnelSubtab] = useState("fitters");
  const [fitterName, setFitterName] = useState("");
  const [welderName, setWelderName] = useState("");
  const [editingWelderId, setEditingWelderId] = useState(null);
  const [wqrCode, setWqrCode] = useState("");
  const wqrUploadInputRef = useRef(null);
  const wpsUploadInputRef = useRef(null);
  const wqrUploadTargetRef = useRef(null);
  const wpsUploadTargetRef = useRef(null);
  /** Avoid resetting Personnel sidebar when parent props refresh while modal stays open (e.g. auto-save). */
  const parametersModalWasOpenRef = useRef(false);

  const fitters = personnel.fitters || [];
  const welders = personnel.welders || [];
  const wqrs = personnel.wqrs || [];
  const wqrDocuments = (documents || []).filter((doc) => doc?.category === "wqr");
  const wpsDocuments = (documents || []).filter((doc) => doc?.category === "wps");
  const safeElectrodeLibrary = Array.isArray(electrodeLibrary) ? electrodeLibrary : [];

  useEffect(() => {
    if (!isOpen) {
      parametersModalWasOpenRef.current = false;
      return;
    }

    const justOpened = !parametersModalWasOpenRef.current;
    parametersModalWasOpenRef.current = true;

    if (settings) {
      setNdtRequirements(settings.ndtRequirements || []);
      setWeldingSpec(settings.weldingSpec || "");
    }
    setMetaProjectName(projectMeta?.projectName || "");
    setMetaClient(projectMeta?.client || "");
    setMetaSpec(projectMeta?.spec || "");
    setMetaRevision(projectMeta?.revision || "");
    setMetaDate(projectMeta?.date || "");
    setProjectSystems(Array.isArray(systems) ? systems : []);
    setProjectWpsLibrary(Array.isArray(wpsLibrary) ? wpsLibrary : []);

    if (justOpened) {
      setCustomNdtMethod("");
      setPersonnelSubtab("fitters");
      setEditingWelderId(null);
      wqrUploadTargetRef.current = null;
      wpsUploadTargetRef.current = null;
    }
  }, [settings, isOpen, projectMeta, systems, wpsLibrary]);

  function addNdtRow(method, pct = 100) {
    const normalizedMethod = String(method || "").trim().toUpperCase();
    if (!normalizedMethod) return;
    setNdtRequirements((prev) => {
      const filtered = prev.filter((r) => r.method !== normalizedMethod);
      const merged = [...filtered, { method: normalizedMethod, pct: Math.min(100, Math.max(0, pct)) }];
      const orderedMethods = sortNdtMethods(merged.map((r) => r.method));
      return merged.sort((a, b) => orderedMethods.indexOf(a.method) - orderedMethods.indexOf(b.method));
    });
  }

  function updateNdtRow(method, field, value) {
    const num = value === "" ? null : parseInt(value, 10);
    if (num !== null && (isNaN(num) || num < 0)) return;
    const clamped = num != null ? Math.min(100, Math.max(0, num)) : null;
    setNdtRequirements((prev) => {
      const prevReq = prev.find((r) => r.method === method);
      if (!prevReq) return prev;
      const next = { ...prevReq };
      if (field === "pct") {
        next.pct = clamped ?? 100;
        delete next.pctShop;
        delete next.pctField;
      } else if (field === "shop") {
        if (clamped == null || clamped === (prevReq.pct ?? 100)) delete next.pctShop;
        else next.pctShop = clamped;
      } else if (field === "field") {
        if (clamped == null || clamped === (prevReq.pct ?? 100)) delete next.pctField;
        else next.pctField = clamped;
      }
      const updated = prev.map((r) => (r.method === method ? next : r));
      const orderedMethods = sortNdtMethods(updated.map((r) => r.method));
      return updated.sort((a, b) => orderedMethods.indexOf(a.method) - orderedMethods.indexOf(b.method));
    });
  }

  function removeNdtRow(method) {
    setNdtRequirements((prev) => prev.filter((r) => r.method !== method));
  }

  function handleAddCustomNdtMethod() {
    if (!customNdtMethod.trim()) return;
    addNdtRow(customNdtMethod.trim(), 100);
    setCustomNdtMethod("");
  }

  // Personnel
  function handleAddFitter(e) {
    e.preventDefault();
    if (!fitterName.trim()) return;
    onSave?.({
      drawingSettings: { ndtRequirements, weldingSpec },
      personnel: {
        ...personnel,
        fitters: [...fitters, { id: generateId(), name: fitterName.trim() }],
      },
    });
    setFitterName("");
  }

  function handleRemoveFitter(id) {
    onSave?.({
      drawingSettings: { ndtRequirements, weldingSpec },
      personnel: { ...personnel, fitters: fitters.filter((f) => f.id !== id) },
    });
  }

  function handleAddWelder(e) {
    e.preventDefault();
    if (!welderName.trim()) return;
    onSave?.({
      drawingSettings: { ndtRequirements, weldingSpec },
      personnel: {
        ...personnel,
        welders: [...welders, { id: generateId(), name: welderName.trim(), wqrIds: [] }],
      },
    });
    setWelderName("");
  }

  function handleRemoveWelder(id) {
    onSave?.({
      drawingSettings: { ndtRequirements, weldingSpec },
      personnel: { ...personnel, welders: welders.filter((w) => w.id !== id) },
    });
    setEditingWelderId(null);
  }

  function handleAddWqr(e) {
    e.preventDefault();
    if (!wqrCode.trim() || !editingWelderId) return;
    const newWqr = { id: generateId(), code: wqrCode.trim(), documentId: null };
    const welder = welders.find((w) => w.id === editingWelderId);
    if (!welder) return;
    onSave?.({
      drawingSettings: { ndtRequirements, weldingSpec },
      personnel: {
        ...personnel,
        wqrs: [...wqrs, newWqr],
        welders: welders.map((w) =>
          w.id === editingWelderId
            ? { ...w, wqrIds: [...(w.wqrIds || []), newWqr.id] }
            : w
        ),
      },
    });
    setWqrCode("");
  }

  function handleUpdateWqrDocument(wqrId, documentId) {
    onSave?.({
      drawingSettings: { ndtRequirements, weldingSpec },
      personnel: {
        ...personnel,
        wqrs: wqrs.map((wqr) =>
          wqr.id === wqrId ? { ...wqr, documentId: documentId || null } : wqr
        ),
      },
    });
  }

  function handleRemoveWqrFromWelder(welderId, wqrId) {
    onSave?.({
      drawingSettings: { ndtRequirements, weldingSpec },
      personnel: {
        ...personnel,
        welders: welders.map((w) =>
          w.id === welderId
            ? { ...w, wqrIds: (w.wqrIds || []).filter((id) => id !== wqrId) }
            : w
        ),
      },
    });
  }

  function handleAddSystem() {
    const nextSystems = [
      ...projectSystems,
      { id: generateId(), name: `System ${projectSystems.length + 1}`, description: "" },
    ];
    setProjectSystems(nextSystems);
    onSave?.({
      drawingSettings: { ndtRequirements, weldingSpec },
      personnel,
      systems: nextSystems,
      wpsLibrary: projectWpsLibrary,
      electrodeLibrary: safeElectrodeLibrary,
    });
  }

  function handleRemoveSystem(systemId) {
    const nextSystems = projectSystems.filter((system) => system.id !== systemId);
    setProjectSystems(nextSystems);
    onSave?.({
      drawingSettings: { ndtRequirements, weldingSpec },
      personnel,
      systems: nextSystems,
      wpsLibrary: projectWpsLibrary,
      electrodeLibrary: safeElectrodeLibrary,
    });
  }

  function handleUpdateSystem(systemId, updates) {
    const nextSystems = projectSystems.map((system) =>
      system.id === systemId ? { ...system, ...updates } : system
    );
    setProjectSystems(nextSystems);
  }

  function handleAddWps() {
    const nextCode = `WPS-${String(projectWpsLibrary.length + 1).padStart(3, "0")}`;
    const nextWpsLibrary = [
      ...projectWpsLibrary,
      { id: generateId(), code: nextCode, title: "", documentId: null },
    ];
    setProjectWpsLibrary(nextWpsLibrary);
    onSave?.({
      drawingSettings: { ndtRequirements, weldingSpec },
      personnel,
      systems: projectSystems,
      wpsLibrary: nextWpsLibrary,
      electrodeLibrary: safeElectrodeLibrary,
    });
  }

  function handleRemoveWps(wpsId) {
    const nextWpsLibrary = projectWpsLibrary.filter((entry) => entry.id !== wpsId);
    setProjectWpsLibrary(nextWpsLibrary);
    onSave?.({
      drawingSettings: { ndtRequirements, weldingSpec },
      personnel,
      systems: projectSystems,
      wpsLibrary: nextWpsLibrary,
      electrodeLibrary: safeElectrodeLibrary,
    });
  }

  function handleUpdateWps(wpsId, updates) {
    const nextWpsLibrary = projectWpsLibrary.map((entry) =>
      entry.id === wpsId ? { ...entry, ...updates } : entry
    );
    setProjectWpsLibrary(nextWpsLibrary);
  }

  async function uploadLinkedDocument(file, category, fallbackTitle) {
    const base64 = await fileToBase64(file);
    return {
      id: generateId(),
      title: (fallbackTitle || file.name || "").replace(/\.pdf$/i, ""),
      category,
      fileName: file.name || `${fallbackTitle || "document"}.pdf`,
      mimeType: file.type || "application/pdf",
      base64,
      createdAt: new Date().toISOString(),
    };
  }

  async function handleUploadWqrDocument(wqrId, event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    const resolvedWqrId = wqrId || wqrUploadTargetRef.current;
    if (!file || !resolvedWqrId) return;
    const wqr = wqrs.find((item) => item.id === resolvedWqrId);
    if (!wqr) return;
    const newDoc = await uploadLinkedDocument(file, "wqr", wqr.code || "WQR");
    onSave?.({
      drawingSettings: { ndtRequirements, weldingSpec },
      personnel: {
        ...personnel,
        wqrs: wqrs.map((item) =>
          item.id === resolvedWqrId ? { ...item, documentId: newDoc.id } : item
        ),
      },
      systems: projectSystems,
      wpsLibrary: projectWpsLibrary,
      electrodeLibrary: safeElectrodeLibrary,
      documents: [...documents, newDoc],
    });
    wqrUploadTargetRef.current = null;
  }

  async function handleUploadWpsDocument(wpsId, event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    const resolvedWpsId = wpsId || wpsUploadTargetRef.current;
    if (!file || !resolvedWpsId) return;
    const wpsEntry = projectWpsLibrary.find((entry) => entry.id === resolvedWpsId);
    if (!wpsEntry) return;
    const newDoc = await uploadLinkedDocument(file, "wps", wpsEntry.code || "WPS");
    const nextWpsLibrary = projectWpsLibrary.map((entry) =>
      entry.id === resolvedWpsId ? { ...entry, documentId: newDoc.id } : entry
    );
    setProjectWpsLibrary(nextWpsLibrary);
    onSave?.({
      drawingSettings: { ndtRequirements, weldingSpec },
      personnel,
      systems: projectSystems,
      wpsLibrary: nextWpsLibrary,
      electrodeLibrary: safeElectrodeLibrary,
      documents: [...documents, newDoc],
    });
    wpsUploadTargetRef.current = null;
  }

  const autoSaveTimeoutRef = useRef(null);
  useEffect(() => {
    if (!isOpen) return;
    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    autoSaveTimeoutRef.current = setTimeout(() => {
      const elib = Array.isArray(electrodeLibrary) ? electrodeLibrary : [];
      onSave?.({
        drawingSettings: { ndtRequirements, weldingSpec },
        personnel,
        projectSettings:
          projectSettings && typeof projectSettings === "object"
            ? projectSettings
            : { steps: [] },
        projectMeta: { projectName: metaProjectName, client: metaClient, spec: metaSpec, revision: metaRevision, date: metaDate },
        systems: projectSystems,
        wpsLibrary: projectWpsLibrary,
        electrodeLibrary: elib,
      });
    }, 500);
    return () => {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    };
  }, [isOpen, ndtRequirements, weldingSpec, personnel, projectSettings, metaProjectName, metaClient, metaSpec, metaRevision, metaDate, projectSystems, projectWpsLibrary, electrodeLibrary, onSave]);

  if (!isOpen) return null;

  const tabs = [
    { key: "default", label: "Default NDT" },
    { key: "personnel", label: "Personnel" },
    { key: "project", label: "Project" },
  ];

  return (
    <dialog open={isOpen} className="modal modal-open">
      <div className="modal-box w-full min-w-80 max-w-4xl max-h-[90vh] overflow-y-auto">
        <h3 className="font-bold text-lg">Parameters</h3>

        <div role="tablist" className="tabs tabs-boxed tabs-sm mt-4">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              role="tab"
              className={`tab ${activeTab === key ? "tab-active" : ""}`}
              onClick={() => setActiveTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "default" && (
          <div className="mt-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">NDT / QC checks</span>
              </label>
              <p className="text-xs text-base-content/60 mb-2">
                Add methods with % required. Default methods are VT, MPI, RT, UT and you can add custom tests (e.g. PWHT).
                Shop % / Field % apply by weld location.
              </p>
              <div className="mt-2 space-y-2">
                {ndtRequirements.map((r) => (
                  <div
                    key={r.method}
                    className="flex flex-wrap items-center gap-2 p-2 bg-base-200 rounded-lg"
                  >
                    <span className="w-24 font-medium">
                      {NDT_METHOD_LABELS[r.method] || r.method}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-base-content/60">Shop</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        className="input input-bordered input-sm w-16"
                        value={r.pctShop ?? r.pct ?? 100}
                        onChange={(e) => updateNdtRow(r.method, "shop", e.target.value)}
                      />
                      <span className="text-sm">%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-base-content/60">Field</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        className="input input-bordered input-sm w-16"
                        value={r.pctField ?? r.pct ?? 100}
                        onChange={(e) => updateNdtRow(r.method, "field", e.target.value)}
                      />
                      <span className="text-sm">%</span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm btn-square ml-auto"
                      onClick={() => removeNdtRow(r.method)}
                      aria-label={`Remove ${r.method}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
                {ndtRequirements.length === 0 && (
                  <p className="text-sm text-base-content/50 py-2">
                    No NDT methods set. Add below.
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {NDT_METHODS.filter(
                  (m) => !ndtRequirements.some((r) => r.method === m)
                ).map((m) => (
                  <button
                    key={m}
                    type="button"
                    className="btn btn-ghost btn-xs"
                    onClick={() => addNdtRow(m)}
                  >
                    + {NDT_METHOD_LABELS[m] || m}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  className="input input-bordered input-sm flex-1"
                  value={customNdtMethod}
                  onChange={(e) => setCustomNdtMethod(e.target.value.toUpperCase())}
                  placeholder="Custom test code (e.g. PWHT)"
                />
                <button type="button" className="btn btn-ghost btn-sm" onClick={handleAddCustomNdtMethod}>
                  + Add custom
                </button>
              </div>
            </div>
            <div className="form-control mt-4">
              <label className="label" htmlFor="weldingSpec">
                <span className="label-text">Welding spec</span>
              </label>
              <input
                id="weldingSpec"
                type="text"
                className="input input-bordered"
                value={weldingSpec}
                onChange={(e) => setWeldingSpec(e.target.value)}
                placeholder="e.g. WPS-001, ASME IX"
              />
            </div>
            <div className="modal-action">
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        )}

        {activeTab === "personnel" && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-base-content/70">
              Manage fitters, welders, and welder qualifications (WQR).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-[14rem_minmax(0,1fr)] gap-3">
              <aside className="border border-base-300 rounded-lg bg-base-100 p-2 h-fit">
                <ul className="menu menu-sm">
                  <li>
                    <button
                      type="button"
                      className={personnelSubtab === "fitters" ? "active" : ""}
                      onClick={() => setPersonnelSubtab("fitters")}
                    >
                      Fitters
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className={personnelSubtab === "welders" ? "active" : ""}
                      onClick={() => setPersonnelSubtab("welders")}
                    >
                      Welders & WQR
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className={personnelSubtab === "ndt" ? "active" : ""}
                      onClick={() => setPersonnelSubtab("ndt")}
                    >
                      NDT personnel
                    </button>
                  </li>
                </ul>
              </aside>

              <div className="min-w-0">
                {personnelSubtab === "fitters" && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Fitters</h4>
                    <form onSubmit={handleAddFitter} className="flex gap-2">
                      <input
                        type="text"
                        className="input input-bordered input-sm flex-1"
                        value={fitterName}
                        onChange={(e) => setFitterName(e.target.value)}
                        placeholder="Fitter name"
                      />
                      <button type="submit" className="btn btn-primary btn-sm">
                        Add
                      </button>
                    </form>
                    <ul className="space-y-1">
                      {fitters.map((f) => (
                        <li
                          key={f.id}
                          className="flex items-center justify-between gap-2 p-2 bg-base-200 rounded-lg text-sm"
                        >
                          <span>{f.name}</span>
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs text-error"
                            onClick={() => handleRemoveFitter(f.id)}
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                      {fitters.length === 0 && (
                        <p className="text-sm text-base-content/50">No fitters yet.</p>
                      )}
                    </ul>
                  </div>
                )}

                {personnelSubtab === "welders" && (
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Welders</h4>
                      <form onSubmit={handleAddWelder} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          className="input input-bordered input-sm flex-1"
                          value={welderName}
                          onChange={(e) => setWelderName(e.target.value)}
                          placeholder="Welder name"
                        />
                        <button type="submit" className="btn btn-primary btn-sm">
                          Add
                        </button>
                      </form>
                      <ul className="space-y-1">
                        {welders.map((w) => (
                          <li
                            key={w.id}
                            className="flex items-center justify-between gap-2 p-2 bg-base-200 rounded-lg text-sm"
                          >
                            <span>{w.name}</span>
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs text-error"
                              onClick={() => handleRemoveWelder(w.id)}
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                        {welders.length === 0 && (
                          <p className="text-sm text-base-content/50">No welders yet.</p>
                        )}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm mb-2">WQR per welder</h4>
                      <div className="form-control">
                        <label className="label py-0">
                          <span className="label-text text-xs">Select welder</span>
                        </label>
                        <select
                          className="select select-bordered select-sm"
                          value={editingWelderId || ""}
                          onChange={(e) => setEditingWelderId(e.target.value || null)}
                        >
                          <option value="">Choose welder</option>
                          {welders.map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      {editingWelderId && (
                        <>
                          <form onSubmit={handleAddWqr} className="flex gap-2 mt-2">
                            <input
                              type="text"
                              className="input input-bordered input-sm flex-1"
                              value={wqrCode}
                              onChange={(e) => setWqrCode(e.target.value)}
                              placeholder="WQR code"
                            />
                            <button type="submit" className="btn btn-primary btn-sm">
                              Add
                            </button>
                          </form>
                          <ul className="space-y-1 mt-2">
                            {(welders.find((w) => w.id === editingWelderId)?.wqrIds || []).map((wqrId) => {
                              const wqr = wqrs.find((q) => q.id === wqrId);
                              return wqr ? (
                                <li key={wqr.id} className="p-2 bg-base-200 rounded text-sm space-y-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <span>{wqr.code}</span>
                                    <button
                                      type="button"
                                      className="btn btn-ghost btn-xs text-error"
                                      onClick={() => handleRemoveWqrFromWelder(editingWelderId, wqr.id)}
                                    >
                                      Remove
                                    </button>
                                  </div>
                                  <div className="form-control">
                                    <label className="label py-0">
                                      <span className="label-text text-xs">Linked WQR PDF</span>
                                    </label>
                                    <div className="flex gap-1">
                                      <select
                                        className="select select-bordered select-xs flex-1"
                                        value={wqr.documentId || ""}
                                        onChange={(e) => handleUpdateWqrDocument(wqr.id, e.target.value)}
                                      >
                                        <option value="">No PDF linked</option>
                                        {wqrDocuments.map((doc) => (
                                          <option key={doc.id} value={doc.id}>
                                            {doc.title || doc.fileName}
                                          </option>
                                        ))}
                                      </select>
                                      {!wqr.documentId && (
                                        <button
                                          type="button"
                                          className="btn btn-ghost btn-xs"
                                          onClick={() => {
                                            wqrUploadTargetRef.current = wqr.id;
                                            wqrUploadInputRef.current?.click();
                                          }}
                                        >
                                          Load
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </li>
                              ) : null;
                            })}
                          </ul>
                          {(welders.find((w) => w.id === editingWelderId)?.wqrIds || []).length === 0 && (
                            <p className="text-sm text-base-content/50 mt-1">No WQR for this welder.</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {personnelSubtab === "ndt" && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">NDT personnel</h4>
                    <p className="text-sm text-base-content/60">
                      Placeholder submenu reserved for future NDT operator / inspector qualification management.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-action mt-4">
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        )}

        {activeTab === "project" && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-base-content/70">
              Project information used for documentation and export.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label"><span className="label-text">Project name</span></label>
                <input type="text" className="input input-bordered" value={metaProjectName} onChange={(e) => setMetaProjectName(e.target.value)} placeholder="e.g. Platform A Piping" />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Client</span></label>
                <input type="text" className="input input-bordered" value={metaClient} onChange={(e) => setMetaClient(e.target.value)} placeholder="e.g. Acme Corp" />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Spec / Standard</span></label>
                <input type="text" className="input input-bordered" value={metaSpec} onChange={(e) => setMetaSpec(e.target.value)} placeholder="e.g. ASME B31.3" />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Revision</span></label>
                <input type="text" className="input input-bordered" value={metaRevision} onChange={(e) => setMetaRevision(e.target.value)} placeholder="e.g. Rev A" />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Date</span></label>
                <input type="date" className="input input-bordered" value={metaDate} onChange={(e) => setMetaDate(e.target.value)} />
              </div>
            </div>

            <div className="divider my-1">Systems</div>
            <div className="flex justify-end">
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleAddSystem}>
                + Add system
              </button>
            </div>
            <ul className="space-y-2">
              {projectSystems.map((system) => (
                <li key={system.id} className="p-2 bg-base-200 rounded-lg space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input
                      type="text"
                      className="input input-bordered input-sm"
                      value={system.name || ""}
                      onChange={(e) => handleUpdateSystem(system.id, { name: e.target.value })}
                      placeholder="System name"
                    />
                    <input
                      type="text"
                      className="input input-bordered input-sm"
                      value={system.description || ""}
                      onChange={(e) => handleUpdateSystem(system.id, { description: e.target.value })}
                      placeholder="Description"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button type="button" className="btn btn-ghost btn-xs text-error" onClick={() => handleRemoveSystem(system.id)}>
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            {projectSystems.length === 0 && <p className="text-sm text-base-content/50">No systems yet.</p>}

            <div className="divider my-1">WPS Library</div>
            <div className="flex justify-end">
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleAddWps}>
                + Add WPS
              </button>
            </div>
            <ul className="space-y-2">
              {projectWpsLibrary.map((entry) => (
                <li key={entry.id} className="p-2 bg-base-200 rounded-lg space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input
                      type="text"
                      className="input input-bordered input-sm"
                      value={entry.code || ""}
                      onChange={(e) => handleUpdateWps(entry.id, { code: e.target.value.toUpperCase() })}
                      placeholder="WPS code"
                    />
                    <input
                      type="text"
                      className="input input-bordered input-sm"
                      value={entry.title || ""}
                      onChange={(e) => handleUpdateWps(entry.id, { title: e.target.value })}
                      placeholder="WPS title"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-end">
                    <div className="form-control">
                      <label className="label py-0">
                        <span className="label-text text-xs">Linked WPS PDF</span>
                      </label>
                      <div className="flex gap-1">
                        <select
                          className="select select-bordered select-sm flex-1"
                          value={entry.documentId || ""}
                          onChange={(e) => handleUpdateWps(entry.id, { documentId: e.target.value || null })}
                        >
                          <option value="">No PDF linked</option>
                          {wpsDocuments.map((doc) => (
                            <option key={doc.id} value={doc.id}>
                              {doc.title || doc.fileName}
                            </option>
                          ))}
                        </select>
                        {!entry.documentId && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => {
                              wpsUploadTargetRef.current = entry.id;
                              wpsUploadInputRef.current?.click();
                            }}
                          >
                            Load
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button type="button" className="btn btn-ghost btn-xs text-error" onClick={() => handleRemoveWps(entry.id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {projectWpsLibrary.length === 0 && <p className="text-sm text-base-content/50">No WPS entries yet.</p>}

            <p className="text-sm text-base-content/60 mt-4">
              Manage electrode certificates and register entries in <strong>Document Vault</strong> (Databook builder).
            </p>
            <div className="modal-action mt-4">
              <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
            </div>
          </div>
        )}
        <input
          ref={wqrUploadInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => handleUploadWqrDocument(wqrUploadTargetRef.current, e)}
        />
        <input
          ref={wpsUploadInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => handleUploadWpsDocument(wpsUploadTargetRef.current, e)}
        />
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={onClose}>
          close
        </button>
      </form>
    </dialog>
  );
}

export default ModalParameters;
