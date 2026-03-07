"use client";

import { useState, useEffect } from "react";
import { NDT_METHODS, NDT_METHOD_LABELS } from "@/lib/constants";

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function ModalParameters({
  isOpen,
  onClose,
  settings = { ndtRequirements: [], weldingSpec: "" },
  personnel = { fitters: [], welders: [], wqrs: [] },
  onSave,
}) {
  const [activeTab, setActiveTab] = useState("default");

  // Default NDT state
  const [ndtRequirements, setNdtRequirements] = useState([]);
  const [weldingSpec, setWeldingSpec] = useState("");

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
  }, [settings, isOpen]);

  function addNdtRow(method, pct = 100) {
    setNdtRequirements((prev) => {
      const filtered = prev.filter((r) => r.method !== method);
      return [...filtered, { method, pct }].sort(
        (a, b) => NDT_METHODS.indexOf(a.method) - NDT_METHODS.indexOf(b.method)
      );
    });
  }

  function updateNdtRow(method, pct) {
    const num = parseInt(pct, 10);
    if (isNaN(num) || num < 0) return;
    setNdtRequirements((prev) => {
      const filtered = prev.filter((r) => r.method !== method);
      if (num === 0) return filtered;
      return [...filtered, { method, pct: Math.min(100, Math.max(0, num)) }].sort(
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

  function handleSaveDefault(e) {
    e.preventDefault();
    onSave?.({
      drawingSettings: { ndtRequirements, weldingSpec },
      personnel,
    });
    onClose?.();
  }

  if (!isOpen) return null;

  const tabs = [
    { key: "default", label: "Default NDT" },
    { key: "personnel", label: "Personnel" },
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
          <form onSubmit={handleSaveDefault} className="mt-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">NDT / QC checks</span>
              </label>
              <p className="text-xs text-base-content/60 mb-2">
                Add methods with % required (VT, MPI, RT, UT). Used when weld NDT is &quot;Auto&quot;.
              </p>
              <div className="mt-2 space-y-2">
                {ndtRequirements.map((r) => (
                  <div
                    key={r.method}
                    className="flex items-center gap-2 p-2 bg-base-200 rounded-lg"
                  >
                    <span className="w-24 font-medium">
                      {NDT_METHOD_LABELS[r.method] || r.method}
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="input input-bordered input-sm w-20"
                      value={r.pct}
                      onChange={(e) => updateNdtRow(r.method, e.target.value)}
                    />
                    <span className="text-sm">%</span>
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
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save
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
