"use client";

import { useRef } from "react";

function Toolbar({
  hasPdf,
  hasWelds,
  onLoadPdf,
  onLoadProject,
  onSaveProject,
  onExportExcel,
  onOpenSettings,
  onOpenSpools,
}) {
  const projectInputRef = useRef(null);

  return (
    <div className="navbar bg-base-100 shadow-lg rounded-lg mb-4">
      <div className="flex-1">
        <span className="text-xl font-bold">Weld Dashboard</span>
      </div>
      <div className="flex gap-2">
        <label htmlFor="pdf-file-input" className="btn btn-sm btn-outline cursor-pointer">
          Load PDF
        </label>
        <input
          id="pdf-file-input"
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onLoadPdf?.(file);
            e.target.value = "";
          }}
        />
        <input
          ref={projectInputRef}
          type="file"
          accept=".weldproject,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onLoadProject?.(file);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          className="btn btn-sm btn-outline"
          onClick={() => projectInputRef.current?.click()}
        >
          Load Project
        </button>
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={onSaveProject}
          disabled={!hasPdf}
        >
          Save Project
        </button>
        <button
          type="button"
          className="btn btn-sm btn-secondary"
          onClick={onExportExcel}
          disabled={!hasWelds}
        >
          Export Excel
        </button>
        {hasPdf && (
          <>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={onOpenSettings}
              title="Drawing settings"
            >
              Settings
            </button>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={onOpenSpools}
              title="Spools"
            >
              Spools
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default Toolbar;
