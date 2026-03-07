"use client";

import { useState, useEffect } from "react";
import { listProjects, loadProject, deleteProject } from "@/lib/offline-storage";

function ModalProjects({ isOpen, onClose, onOpenProject }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      listProjects()
        .then(setProjects)
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  async function handleOpen(projectId) {
    try {
      const data = await loadProject(projectId);
      if (!data) return;
      onOpenProject?.(data);
      onClose?.();
    } catch (err) {
      alert(err.message || "Failed to load project");
    }
  }

  async function handleDelete(e, projectId) {
    e.stopPropagation();
    if (!confirm("Delete this project?")) return;
    try {
      await deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err) {
      alert(err.message || "Failed to delete");
    }
  }

  function formatDate(ts) {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  if (!isOpen) return null;

  return (
    <dialog open={isOpen} className="modal modal-open">
      <div className="modal-box w-full min-w-80 max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <h3 className="font-bold text-lg">Saved projects</h3>
        <p className="text-sm text-base-content/70 mt-1">
          Open a project to continue working offline
        </p>
        <div className="flex-1 overflow-y-auto mt-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-md" />
            </div>
          ) : projects.length === 0 ? (
            <p className="text-base-content/60 py-8 text-center">
              No saved projects yet
            </p>
          ) : (
            <ul className="space-y-2">
              {projects.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between p-3 bg-base-200 rounded-lg hover:bg-base-300 cursor-pointer min-h-12"
                  onClick={() => handleOpen(p.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{p.name}</p>
                    <p className="text-xs text-base-content/60">
                      {formatDate(p.updatedAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm btn-circle text-error ml-2"
                    onClick={(e) => handleDelete(e, p.id)}
                    aria-label="Delete"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="modal-action mt-4">
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

export default ModalProjects;
