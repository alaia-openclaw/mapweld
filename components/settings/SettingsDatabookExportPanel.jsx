"use client";

import { normalizeDatabookConfig } from "@/lib/databook-sections";

/** Databook PDF metadata + compile (Settings). */
function SettingsDatabookExportPanel({ databookConfig = null, onChange, onCompile, isCompiling = false }) {
  const local = normalizeDatabookConfig(databookConfig);

  function patch(updates) {
    onChange?.(normalizeDatabookConfig({ ...local, ...updates }));
  }

  return (
    <div className="space-y-4 min-w-0">
      <p className="text-xs text-base-content/70">
        Revision and issue fields are embedded in generated databook PDFs. Use <strong>Compile databook PDF</strong> to
        build a preview from current project data and vault documents.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 border border-base-300 rounded-lg p-3 bg-base-100">
        <div>
          <label className="label py-0">
            <span className="label-text text-xs">Databook revision</span>
          </label>
          <input
            type="text"
            className="input input-bordered input-xs w-full"
            value={local.revision || ""}
            onChange={(e) => patch({ revision: e.target.value })}
            placeholder="e.g. Rev A"
          />
        </div>
        <div>
          <label className="label py-0">
            <span className="label-text text-xs">Issued by</span>
          </label>
          <input
            type="text"
            className="input input-bordered input-xs w-full"
            value={local.issuedBy || ""}
            onChange={(e) => patch({ issuedBy: e.target.value })}
            placeholder="Name / role"
          />
        </div>
        <div>
          <label className="label py-0">
            <span className="label-text text-xs">Issued date</span>
          </label>
          <input
            type="date"
            className="input input-bordered input-xs w-full"
            value={local.issuedAt || ""}
            onChange={(e) => patch({ issuedAt: e.target.value })}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary btn-sm" onClick={onCompile} disabled={isCompiling}>
          {isCompiling ? "Compiling…" : "Compile databook PDF"}
        </button>
      </div>
    </div>
  );
}

export default SettingsDatabookExportPanel;
