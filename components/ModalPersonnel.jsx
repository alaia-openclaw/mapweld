"use client";

import { useState } from "react";

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function ModalPersonnel({
  isOpen,
  onClose,
  personnel = { fitters: [], welders: [], wqrs: [] },
  onSave,
}) {
  const [activeSection, setActiveSection] = useState("fitters");
  const [fitterName, setFitterName] = useState("");
  const [welderName, setWelderName] = useState("");
  const [editingWelderId, setEditingWelderId] = useState(null);
  const [wqrCode, setWqrCode] = useState("");

  const fitters = personnel.fitters || [];
  const welders = personnel.welders || [];
  const wqrs = personnel.wqrs || [];

  function handleAddFitter(e) {
    e.preventDefault();
    if (!fitterName.trim()) return;
    onSave?.({
      ...personnel,
      fitters: [...fitters, { id: generateId(), name: fitterName.trim() }],
    });
    setFitterName("");
  }

  function handleRemoveFitter(id) {
    onSave?.({
      ...personnel,
      fitters: fitters.filter((f) => f.id !== id),
    });
  }

  function handleAddWelder(e) {
    e.preventDefault();
    if (!welderName.trim()) return;
    onSave?.({
      ...personnel,
      welders: [...welders, { id: generateId(), name: welderName.trim(), wqrIds: [] }],
    });
    setWelderName("");
  }

  function handleRemoveWelder(id) {
    onSave?.({
      ...personnel,
      welders: welders.filter((w) => w.id !== id),
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
      ...personnel,
      wqrs: [...wqrs, newWqr],
      welders: welders.map((w) =>
        w.id === editingWelderId
          ? { ...w, wqrIds: [...(w.wqrIds || []), newWqr.id] }
          : w
      ),
    });
    setWqrCode("");
  }

  function handleRemoveWqrFromWelder(welderId, wqrId) {
    onSave?.({
      ...personnel,
      welders: welders.map((w) =>
        w.id === welderId
          ? { ...w, wqrIds: (w.wqrIds || []).filter((id) => id !== wqrId) }
          : w
      ),
    });
  }

  if (!isOpen) return null;

  return (
    <dialog open={isOpen} className="modal modal-open">
      <div className="modal-box w-full min-w-80 max-w-4xl max-h-[90vh] overflow-y-auto">
        <h3 className="font-bold text-lg">Personnel</h3>
        <p className="text-sm text-base-content/70 mt-1">
          Manage fitters, welders, and welder qualifications (WQR)
        </p>

        <div role="tablist" className="tabs tabs-boxed tabs-sm mt-4">
          {["fitters", "welders", "wqr"].map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              className={`tab capitalize ${activeSection === tab ? "tab-active" : ""}`}
              onClick={() => setActiveSection(tab)}
            >
              {tab === "wqr" ? "WQR per welder" : tab}
            </button>
          ))}
        </div>

        {activeSection === "fitters" && (
          <div className="mt-4 space-y-4">
            <form onSubmit={handleAddFitter} className="flex gap-2">
              <input
                type="text"
                className="input input-bordered flex-1"
                value={fitterName}
                onChange={(e) => setFitterName(e.target.value)}
                placeholder="Fitter name"
              />
              <button type="submit" className="btn btn-primary">
                Add
              </button>
            </form>
            <ul className="space-y-2">
              {fitters.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between gap-2 p-2 bg-base-200 rounded-lg"
                >
                  <span>{f.name}</span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm text-error"
                    onClick={() => handleRemoveFitter(f.id)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            {fitters.length === 0 && (
              <p className="text-sm text-base-content/50">No fitters yet.</p>
            )}
          </div>
        )}

        {activeSection === "welders" && (
          <div className="mt-4 space-y-4">
            <form onSubmit={handleAddWelder} className="flex gap-2">
              <input
                type="text"
                className="input input-bordered flex-1"
                value={welderName}
                onChange={(e) => setWelderName(e.target.value)}
                placeholder="Welder name"
              />
              <button type="submit" className="btn btn-primary">
                Add
              </button>
            </form>
            <ul className="space-y-2">
              {welders.map((w) => (
                <li
                  key={w.id}
                  className="flex items-center justify-between gap-2 p-2 bg-base-200 rounded-lg"
                >
                  <span>{w.name}</span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm text-error"
                    onClick={() => handleRemoveWelder(w.id)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            {welders.length === 0 && (
              <p className="text-sm text-base-content/50">No welders yet.</p>
            )}
          </div>
        )}

        {activeSection === "wqr" && (
          <div className="mt-4 space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Select welder</span>
              </label>
              <select
                className="select select-bordered"
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
                <form onSubmit={handleAddWqr} className="flex gap-2">
                  <input
                    type="text"
                    className="input input-bordered flex-1"
                    value={wqrCode}
                    onChange={(e) => setWqrCode(e.target.value)}
                    placeholder="WQR code (e.g. WQR-2024-001)"
                  />
                  <button type="submit" className="btn btn-primary">
                    Add WQR
                  </button>
                </form>
                <div className="space-y-2">
                  <span className="text-sm font-medium">Qualifications:</span>
                  <ul className="space-y-1">
                    {(welders.find((w) => w.id === editingWelderId)?.wqrIds || []).map((wqrId) => {
                      const wqr = wqrs.find((q) => q.id === wqrId);
                      return wqr ? (
                        <li
                          key={wqr.id}
                          className="flex items-center justify-between gap-2 p-2 bg-base-200 rounded"
                        >
                          <span className="text-sm">{wqr.code}</span>
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
                    <p className="text-sm text-base-content/50">No WQR for this welder.</p>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        <div className="modal-action">
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={onClose}>
          close
        </button>
      </form>
    </dialog>
  );
}

export default ModalPersonnel;
