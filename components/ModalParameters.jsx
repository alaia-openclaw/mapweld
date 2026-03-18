"use client";

import { useState, useEffect, useRef } from "react";
import { NDT_METHODS, NDT_METHOD_LABELS } from "@/lib/constants";

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const ITP_CATEGORIES = [
  { id: "general", label: "General" },
  { id: "fitup", label: "Fit-up" },
  { id: "cuttings", label: "Cuttings" },
  { id: "welding", label: "Welding" },
  { id: "final_inspection", label: "Final inspection" },
];

function ModalParameters({
  isOpen,
  onClose,
  settings = { ndtRequirements: [], weldingSpec: "" },
  personnel = { fitters: [], welders: [], wqrs: [] },
  projectSettings = { steps: [] },
  projectMeta = { projectName: "", client: "", spec: "", revision: "", date: "" },
  onSave,
}) {
  const [activeTab, setActiveTab] = useState("default");

  // Default NDT state
  const [ndtRequirements, setNdtRequirements] = useState([]);
  const [weldingSpec, setWeldingSpec] = useState("");

  // ITP state
  const [itpSteps, setItpSteps] = useState([]);
  const [itpOpenCategory, setItpOpenCategory] = useState("general");

  // Project meta state
  const [metaProjectName, setMetaProjectName] = useState("");
  const [metaClient, setMetaClient] = useState("");
  const [metaSpec, setMetaSpec] = useState("");
  const [metaRevision, setMetaRevision] = useState("");
  const [metaDate, setMetaDate] = useState("");

  // Personnel state
  const [fitterName, setFitterName] = useState("");
  const [welderName, setWelderName] = useState("");
  const [editingWelderId, setEditingWelderId] = useState(null);
  const [wqrCode, setWqrCode] = useState("");

  const fitters = personnel.fitters || [];
  const welders = personnel.welders || [];
  const wqrs = personnel.wqrs || [];

  useEffect(() => {
    if (settings && isOpen) {
      setNdtRequirements(settings.ndtRequirements || []);
      setWeldingSpec(settings.weldingSpec || "");
    }
    if (isOpen) {
      setItpSteps(projectSettings?.steps || []);
      setMetaProjectName(projectMeta?.projectName || "");
      setMetaClient(projectMeta?.client || "");
      setMetaSpec(projectMeta?.spec || "");
      setMetaRevision(projectMeta?.revision || "");
      setMetaDate(projectMeta?.date || "");
    }
  }, [settings, isOpen, projectSettings, projectMeta]);

  function addNdtRow(method, pct = 100) {
    setNdtRequirements((prev) => {
      const filtered = prev.filter((r) => r.method !== method);
      return [...filtered, { method, pct: Math.min(100, Math.max(0, pct)) }].sort(
        (a, b) => NDT_METHODS.indexOf(a.method) - NDT_METHODS.indexOf(b.method)
      );
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
      return prev.map((r) => (r.method === method ? next : r)).sort(
        (a, b) => NDT_METHODS.indexOf(a.method) - NDT_METHODS.indexOf(b.method)
      );
    });
  }

  function removeNdtRow(method) {
    setNdtRequirements((prev) => prev.filter((r) => r.method !== method));
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
    const newWqr = { id: generateId(), code: wqrCode.trim() };
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

  const autoSaveTimeoutRef = useRef(null);
  useEffect(() => {
    if (!isOpen) return;
    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    autoSaveTimeoutRef.current = setTimeout(() => {
      onSave?.({
        drawingSettings: { ndtRequirements, weldingSpec },
        personnel,
        projectSettings: { steps: itpSteps },
        projectMeta: { projectName: metaProjectName, client: metaClient, spec: metaSpec, revision: metaRevision, date: metaDate },
      });
    }, 500);
    return () => {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    };
  }, [isOpen, ndtRequirements, weldingSpec, personnel, itpSteps, metaProjectName, metaClient, metaSpec, metaRevision, metaDate, onSave]);

  if (!isOpen) return null;

  const tabs = [
    { key: "default", label: "Default NDT" },
    { key: "personnel", label: "Personnel" },
    { key: "itp", label: "ITP" },
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
          <form onSubmit={(e) => e.preventDefault()} className="mt-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">NDT / QC checks</span>
              </label>
              <p className="text-xs text-base-content/60 mb-2">
                Add methods with % required (VT, MPI, RT, UT). Shop % / Field % apply by weld location.
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
          </form>
        )}

        {activeTab === "personnel" && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-base-content/70">
              Manage fitters, welders, and welder qualifications (WQR)
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium text-sm mb-2">Fitters</h4>
                <form onSubmit={handleAddFitter} className="flex gap-2 mb-2">
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
                          <li
                            key={wqr.id}
                            className="flex items-center justify-between gap-2 p-2 bg-base-200 rounded text-sm"
                          >
                            <span>{wqr.code}</span>
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs text-error"
                              onClick={() => handleRemoveWqrFromWelder(editingWelderId, wqr.id)}
                            >
                              Remove
                            </button>
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

            <div className="modal-action mt-4">
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        )}

        {activeTab === "itp" && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-base-content/70">
              Define fabrication and inspection steps for this project. Steps are grouped by category.
            </p>
            <div className="space-y-2">
              {ITP_CATEGORIES.map((cat) => {
                const isOpenCat = itpOpenCategory === cat.id;
                const catSteps = itpSteps.filter((s) => s.category === cat.id);
                return (
                  <div key={cat.id} className="bg-base-200 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      className="w-full text-left text-sm font-medium px-3 py-2 flex items-center justify-between hover:bg-base-300/50 transition-colors"
                      onClick={() => setItpOpenCategory(isOpenCat ? null : cat.id)}
                    >
                      <span>{cat.label} ({catSteps.length})</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${isOpenCat ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isOpenCat && (
                      <div className="px-3 pb-3 space-y-2">
                        {catSteps.length === 0 && (
                          <p className="text-xs text-base-content/50 py-1">No steps in this category.</p>
                        )}
                        {catSteps.map((step) => (
                          <div key={step.id} className="bg-base-100 rounded-lg p-2 space-y-1.5 border border-base-300/60">
                            <input
                              type="text"
                              className="input input-sm input-bordered w-full"
                              value={step.label}
                              onChange={(e) => {
                                setItpSteps((prev) => prev.map((s) => s.id === step.id ? { ...s, label: e.target.value } : s));
                              }}
                              placeholder="Step description"
                            />
                            <div className="flex flex-wrap gap-3 text-xs">
                              <label className="flex items-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="checkbox checkbox-xs checkbox-primary"
                                  checked={step.required}
                                  onChange={(e) => setItpSteps((prev) => prev.map((s) => s.id === step.id ? { ...s, required: e.target.checked } : s))}
                                />
                                Required
                              </label>
                              <label className="flex items-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="checkbox checkbox-xs"
                                  checked={step.clientSignOff}
                                  onChange={(e) => setItpSteps((prev) => prev.map((s) => s.id === step.id ? { ...s, clientSignOff: e.target.checked } : s))}
                                />
                                Client sign-off
                              </label>
                              <label className="flex items-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="checkbox checkbox-xs"
                                  checked={step.requestInspection}
                                  onChange={(e) => setItpSteps((prev) => prev.map((s) => s.id === step.id ? { ...s, requestInspection: e.target.checked } : s))}
                                />
                                Request inspection
                              </label>
                              <button
                                type="button"
                                className="btn btn-ghost btn-xs text-error ml-auto"
                                onClick={() => setItpSteps((prev) => prev.filter((s) => s.id !== step.id))}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs gap-0.5"
                          onClick={() => {
                            setItpSteps((prev) => [
                              ...prev,
                              { id: generateId(), category: cat.id, label: "", required: true, clientSignOff: false, requestInspection: false },
                            ]);
                          }}
                        >
                          + Add step
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="modal-action mt-4">
              <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
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
            <div className="modal-action mt-4">
              <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
            </div>
          </div>
        )}
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
