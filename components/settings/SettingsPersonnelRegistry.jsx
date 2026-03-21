"use client";

import { useState } from "react";

/**
 * Table-first fitters and welders (WQR lives under Settings → WQR).
 */
function SettingsPersonnelRegistry({
  fitters = [],
  welders = [],
  onAddFitter,
  onRemoveFitter,
  onUpdateFitterName,
  onAddWelder,
  onRemoveWelder,
  onUpdateWelderName,
}) {
  const [fitterInput, setFitterInput] = useState("");
  const [welderInput, setWelderInput] = useState("");

  return (
    <div className="space-y-6 min-w-0">
      <p className="text-xs text-base-content/70">
        Fitters and welders used on weld forms. Link welder qualifications (WQR) under{" "}
        <strong>Settings → WQR</strong>.
      </p>

      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <h4 className="font-medium text-sm">Fitters</h4>
          <form
            className="flex gap-2 flex-1 max-w-md"
            onSubmit={(e) => {
              e.preventDefault();
              if (!fitterInput.trim()) return;
              onAddFitter?.(fitterInput.trim());
              setFitterInput("");
            }}
          >
            <input
              type="text"
              className="input input-bordered input-xs flex-1"
              value={fitterInput}
              onChange={(e) => setFitterInput(e.target.value)}
              placeholder="Fitter name"
            />
            <button type="submit" className="btn btn-primary btn-sm shrink-0">
              Add fitter
            </button>
          </form>
        </div>
        <div className="overflow-x-auto border border-base-300 rounded-lg">
          <table className="table table-xs table-pin-rows">
            <thead>
              <tr className="bg-base-200">
                <th>Name</th>
                <th className="w-24 text-end"> </th>
              </tr>
            </thead>
            <tbody>
              {fitters.length === 0 && (
                <tr>
                  <td colSpan={2} className="text-center text-base-content/50 py-6">
                    No fitters yet.
                  </td>
                </tr>
              )}
              {fitters.map((f) => (
                <tr key={f.id} className="hover">
                  <td>
                    <input
                      type="text"
                      className="input input-bordered input-xs w-full max-w-md"
                      value={f.name || ""}
                      onChange={(e) => onUpdateFitterName?.(f.id, e.target.value)}
                      placeholder="Name"
                    />
                  </td>
                  <td className="text-end">
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs text-error"
                      onClick={() => onRemoveFitter?.(f.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <h4 className="font-medium text-sm">Welders</h4>
          <form
            className="flex gap-2 flex-1 max-w-md"
            onSubmit={(e) => {
              e.preventDefault();
              if (!welderInput.trim()) return;
              onAddWelder?.(welderInput.trim());
              setWelderInput("");
            }}
          >
            <input
              type="text"
              className="input input-bordered input-xs flex-1"
              value={welderInput}
              onChange={(e) => setWelderInput(e.target.value)}
              placeholder="Welder name"
            />
            <button type="submit" className="btn btn-primary btn-sm shrink-0">
              Add welder
            </button>
          </form>
        </div>
        <div className="overflow-x-auto border border-base-300 rounded-lg">
          <table className="table table-xs table-pin-rows">
            <thead>
              <tr className="bg-base-200">
                <th>Name</th>
                <th className="tabular-nums">WQRs</th>
                <th className="w-24 text-end"> </th>
              </tr>
            </thead>
            <tbody>
              {welders.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center text-base-content/50 py-6">
                    No welders yet.
                  </td>
                </tr>
              )}
              {welders.map((w) => (
                <tr key={w.id} className="hover">
                  <td>
                    <input
                      type="text"
                      className="input input-bordered input-xs w-full max-w-md"
                      value={w.name || ""}
                      onChange={(e) => onUpdateWelderName?.(w.id, e.target.value)}
                      placeholder="Name"
                    />
                  </td>
                  <td className="text-center tabular-nums">{(w.wqrIds || []).length}</td>
                  <td className="text-end">
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs text-error"
                      onClick={() => onRemoveWelder?.(w.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default SettingsPersonnelRegistry;
