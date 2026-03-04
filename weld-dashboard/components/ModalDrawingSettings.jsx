"use client";

import { useState, useEffect } from "react";
import { DRAWING_NDT_PRESETS } from "@/lib/constants";

function ModalDrawingSettings({ isOpen, onClose, settings, onSave }) {
  const [ndtPresetId, setNdtPresetId] = useState("");
  const [weldingSpec, setWeldingSpec] = useState("");

  useEffect(() => {
    if (settings) {
      setNdtPresetId(settings.ndtPresetId || "");
      setWeldingSpec(settings.weldingSpec || "");
    }
  }, [settings]);

  function handleSubmit(e) {
    e.preventDefault();
    const preset = DRAWING_NDT_PRESETS.find((p) => p.id === ndtPresetId);
    onSave?.({
      ndtPresetId,
      ndtPresetLabel: preset?.label || "",
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
              <span className="label-text">NDT requirement</span>
            </label>
            <select
              id="ndtPreset"
              className="select select-bordered"
              value={ndtPresetId}
              onChange={(e) => setNdtPresetId(e.target.value)}
            >
              <option value="">Not set</option>
              {DRAWING_NDT_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
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
