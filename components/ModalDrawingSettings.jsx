"use client";

import { useState, useEffect } from "react";
import {
  DRAWING_NDT_PRESETS,
  NDT_METHODS,
  NDT_METHOD_LABELS,
} from "@/lib/constants";

function ModalDrawingSettings({ isOpen, onClose, settings, onSave }) {
  const [ndtRequirements, setNdtRequirements] = useState([]);
  const [presetToAdd, setPresetToAdd] = useState("");
  const [weldingSpec, setWeldingSpec] = useState("");

  useEffect(() => {
    if (settings) {
      setNdtRequirements(settings.ndtRequirements || []);
      setWeldingSpec(settings.weldingSpec || "");
    }
  }, [settings, isOpen]);

  function addFromPreset() {
    if (!presetToAdd) return;
    const preset = DRAWING_NDT_PRESETS.find((p) => p.id === presetToAdd);
    if (!preset) return;
    setNdtRequirements((prev) => {
      const filtered = prev.filter((r) => r.method !== preset.method);
      return [...filtered, { method: preset.method, pct: preset.pct }].sort(
        (a, b) => NDT_METHODS.indexOf(a.method) - NDT_METHODS.indexOf(b.method)
      );
    });
    setPresetToAdd("");
  }

  function addRow(method, pct = 100) {
    setNdtRequirements((prev) => {
      const filtered = prev.filter((r) => r.method !== method);
      return [...filtered, { method, pct }].sort(
        (a, b) => NDT_METHODS.indexOf(a.method) - NDT_METHODS.indexOf(b.method)
      );
    });
  }

  function updateRow(method, pct) {
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

  function removeRow(method) {
    setNdtRequirements((prev) => prev.filter((r) => r.method !== method));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSave?.({
      ndtRequirements,
      weldingSpec,
    });
    onClose?.();
  }

  if (!isOpen) return null;

  return (
    <dialog open={isOpen} className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg">Drawing settings</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-control mt-4">
            <label className="label" htmlFor="ndtPreset">
              <span className="label-text">NDT requirements</span>
            </label>
            <p className="text-xs text-base-content/60 mb-2">
              Add methods with % required. Used when weld NDT is &quot;Auto&quot;.
            </p>
            <div className="flex gap-2">
              <select
                id="ndtPreset"
                className="select select-bordered flex-1"
                value={presetToAdd}
                onChange={(e) => setPresetToAdd(e.target.value)}
              >
                <option value="">Quick add preset…</option>
                {DRAWING_NDT_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-outline"
                onClick={addFromPreset}
                disabled={!presetToAdd}
              >
                Add
              </button>
            </div>
            <div className="mt-3 space-y-2">
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
                    onChange={(e) => updateRow(r.method, e.target.value)}
                  />
                  <span className="text-sm">%</span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm btn-square ml-auto"
                    onClick={() => removeRow(r.method)}
                    aria-label={`Remove ${r.method}`}
                  >
                    ×
                  </button>
                </div>
              ))}
              {ndtRequirements.length === 0 && (
                <p className="text-sm text-base-content/50 py-2">
                  No NDT methods set. Use preset or add below.
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
                  onClick={() => addRow(m)}
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
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={onClose}>
          close
        </button>
      </form>
    </dialog>
  );
}

export default ModalDrawingSettings;
