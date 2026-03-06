"use client";

import { useState } from "react";

function generateSpoolId() {
  return `spool-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function SidePanelSpools({
  spools = [],
  isOpen,
  onToggle,
  onSave,
  spoolMarkers = [],
  appMode = "edition",
}) {
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
    if (confirm("Delete this spool? Its marker will be removed from the drawing.")) {
      onSave?.(spools.filter((s) => s.id !== id));
    }
  }

  return (
    <div
      className={`flex-shrink-0 flex flex-col bg-base-200 border-l border-base-300 transition-all duration-300 ease-out overflow-hidden ${
        isOpen ? "w-80" : "w-10"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className={`flex-shrink-0 flex items-center justify-center gap-2 py-3 px-2 border-b border-base-300 bg-base-100 hover:bg-base-200 transition-colors ${
          isOpen ? "flex-row" : "flex-col min-h-24"
        }`}
        title={isOpen ? "Collapse spools panel" : "Expand spools panel"}
        aria-label={isOpen ? "Collapse spools panel" : "Expand spools panel"}
      >
        <span
          className={`font-medium ${isOpen ? "text-base" : "text-xs -rotate-90 whitespace-nowrap"}`}
        >
          Spools
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-2">
            <form onSubmit={handleAdd} className="flex gap-2 mb-3">
              <input
                type="text"
                className="input input-bordered input-sm flex-1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Spool name"
              />
              <button type="submit" className="btn btn-primary btn-sm">
                Add
              </button>
            </form>
            {spools.length === 0 ? (
              <div className="text-center py-6 text-base-content/60 text-sm">
                <p>No spools yet</p>
                <p className="mt-1">Add with the Add Spool tool on the drawing</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {spools.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center gap-2 p-2 bg-base-100 rounded-lg"
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
                        <span className="flex-1 truncate">{s.name}</span>
                        {appMode === "edition" && (
                          <>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm btn-square"
                              onClick={() => {
                                setEditingId(s.id);
                                setEditName(s.name);
                              }}
                              aria-label="Edit"
                            >
                              ✎
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm btn-square text-error"
                              onClick={() => handleDelete(s.id)}
                              aria-label="Delete"
                            >
                              ×
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SidePanelSpools;
