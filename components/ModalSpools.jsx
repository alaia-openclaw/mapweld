"use client";

import { getWeldName } from "@/lib/weld-utils";
import { useState } from "react";

function generateSpoolId() {
  return `spool-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function ModalSpools({
  isOpen,
  onClose,
  spools,
  onSave,
  spoolMarkers = [],
  onPlaceSpoolMarker,
  weldPoints = [],
  onAssignWeldsToSpool,
  appMode = "edition",
}) {
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [assignSpoolId, setAssignSpoolId] = useState("");
  const [selectedWeldIds, setSelectedWeldIds] = useState(new Set());

  function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave?.([
      ...spools,
      { id: generateSpoolId(), name: name.trim() },
    ]);
    setName("");
  }

  function handleUpdate(id) {
    const updated = spools.map((s) =>
      s.id === id ? { ...s, name: editName.trim() || s.name } : s
    );
    onSave?.(updated);
    setEditingId(null);
    setEditName("");
  }

  function handleDelete(id) {
    if (confirm("Delete this spool? Welds will be unassigned.")) {
      onSave?.(spools.filter((s) => s.id !== id));
    }
  }

  function toggleWeldSelection(weldId) {
    setSelectedWeldIds((prev) => {
      const next = new Set(prev);
      if (next.has(weldId)) next.delete(weldId);
      else next.add(weldId);
      return next;
    });
  }

  function handleBulkAssign(e) {
    e.preventDefault();
    if (!assignSpoolId || selectedWeldIds.size === 0 || !onAssignWeldsToSpool) return;
    onAssignWeldsToSpool(Array.from(selectedWeldIds), assignSpoolId);
    setSelectedWeldIds(new Set());
    setAssignSpoolId("");
  }

  if (!isOpen) return null;

  return (
    <dialog open={isOpen} className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg">Spools</h3>
        <p className="text-sm text-base-content/70 mt-1">
          Group welds into physical spools/items
        </p>
        <form onSubmit={handleAdd} className="flex gap-2 mt-4">
          <input
            type="text"
            className="input input-bordered flex-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Spool name"
          />
          <button type="submit" className="btn btn-primary">
            Add
          </button>
        </form>
        <ul className="mt-4 space-y-2">
          {spools.map((s) => (
            <li
              key={s.id}
              className="flex items-center gap-2 p-2 bg-base-200 rounded-lg"
            >
              {editingId === s.id ? (
                <>
                  <input
                    type="text"
                    className="input input-sm input-bordered flex-1"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={() => handleUpdate(s.id)}
                  >
                    Done
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1">{s.name}</span>
                  {onPlaceSpoolMarker && appMode === "edition" && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm btn-outline"
                      onClick={() => onPlaceSpoolMarker(s.id)}
                      title="Place on drawing"
                    >
                      Place
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setEditingId(s.id);
                      setEditName(s.name);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm text-error"
                    onClick={() => handleDelete(s.id)}
                  >
                    Delete
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
        {spools.length === 0 && (
          <p className="text-sm text-base-content/50 mt-4">No spools yet</p>
        )}

        {onAssignWeldsToSpool && weldPoints.length > 0 && spools.length > 0 && (
          <>
            <div className="divider">Assign welds to spool</div>
            <form onSubmit={handleBulkAssign} className="space-y-3">
              <div className="form-control">
                <label className="label" htmlFor="assignSpool">
                  <span className="label-text">Spool</span>
                </label>
                <select
                  id="assignSpool"
                  className="select select-bordered select-sm"
                  value={assignSpoolId}
                  onChange={(e) => setAssignSpoolId(e.target.value)}
                >
                  <option value="">Select spool…</option>
                  {spools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-control">
                <span className="label-text mb-1 block">Welds to assign</span>
                <div className="max-h-40 overflow-y-auto space-y-1 bg-base-200 rounded-lg p-2">
                  {weldPoints.map((w) => (
                    <label
                      key={w.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-base-300 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={selectedWeldIds.has(w.id)}
                        onChange={() => toggleWeldSelection(w.id)}
                      />
                      <span className="text-sm truncate">
                        {getWeldName(w, weldPoints)} {w.welderName ? `(${w.welderName})` : ""}
                      </span>
                      {spools.find((s) => s.id === w.spoolId) && (
                        <span className="badge badge-ghost badge-sm">
                          {spools.find((s) => s.id === w.spoolId)?.name}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
              <button
                type="submit"
                className="btn btn-sm btn-primary"
                disabled={!assignSpoolId || selectedWeldIds.size === 0}
              >
                Assign {selectedWeldIds.size > 0 ? `(${selectedWeldIds.size})` : ""} to spool
              </button>
            </form>
          </>
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

export default ModalSpools;
