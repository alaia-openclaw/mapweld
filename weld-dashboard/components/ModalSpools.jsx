"use client";

import { useState } from "react";

function generateSpoolId() {
  return `spool-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function ModalSpools({ isOpen, onClose, spools, onSave }) {
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

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
