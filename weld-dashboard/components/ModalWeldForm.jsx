"use client";

import { useState, useEffect } from "react";
import {
  WELD_STATUS,
  WELD_STATUS_LABELS,
  WELD_TYPES,
  WELD_TYPE_LABELS,
  NDT_REQUIRED_OPTIONS,
  NDT_REQUIRED_LABELS,
} from "@/lib/constants";

function ModalWeldForm({
  weld,
  isOpen,
  onClose,
  onSave,
  onMove,
  onDelete,
  spools = [],
  ndtAutoLabel,
}) {
  const [welderName, setWelderName] = useState("");
  const [weldingDate, setWeldingDate] = useState("");
  const [fitterName, setFitterName] = useState("");
  const [dateFitUp, setDateFitUp] = useState("");
  const [partNumber1, setPartNumber1] = useState("");
  const [partNumber2, setPartNumber2] = useState("");
  const [heatNumber1, setHeatNumber1] = useState("");
  const [heatNumber2, setHeatNumber2] = useState("");
  const [status, setStatus] = useState(WELD_STATUS.NOT_STARTED);
  const [weldType, setWeldType] = useState("butt");
  const [ndtRequired, setNdtRequired] = useState(NDT_REQUIRED_OPTIONS.AUTO);
  const [visualInspection, setVisualInspection] = useState(false);
  const [spoolId, setSpoolId] = useState("");

  useEffect(() => {
    if (weld) {
      setWelderName(weld.welderName || "");
      setWeldingDate(weld.weldingDate || "");
      setFitterName(weld.fitterName || "");
      setDateFitUp(weld.dateFitUp || "");
      setPartNumber1(weld.partNumber1 || "");
      setPartNumber2(weld.partNumber2 || "");
      setHeatNumber1(weld.heatNumber1 || "");
      setHeatNumber2(weld.heatNumber2 || "");
      setStatus(weld.status || WELD_STATUS.NOT_STARTED);
      setWeldType(weld.weldType || "butt");
      setNdtRequired(weld.ndtRequired || NDT_REQUIRED_OPTIONS.AUTO);
      setVisualInspection(weld.visualInspection || false);
      setSpoolId(weld.spoolId || "");
    }
  }, [weld]);

  function handleSubmit(e) {
    e.preventDefault();
    onSave?.({
      ...weld,
      welderName,
      weldingDate,
      fitterName,
      dateFitUp,
      partNumber1,
      partNumber2,
      heatNumber1,
      heatNumber2,
      status,
      weldType,
      ndtRequired,
      visualInspection,
      spoolId: spoolId || null,
    });
    onClose?.();
  }

  if (!isOpen) return null;

  return (
    <dialog open={isOpen} className="modal modal-open">
      <div className="modal-box max-h-[90vh] overflow-y-auto">
        <h3 className="font-bold text-lg">Weld info</h3>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="form-control">
              <label className="label" htmlFor="status">
                <span className="label-text">Status</span>
              </label>
              <select
                id="status"
                className="select select-bordered"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {Object.entries(WELD_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-control">
              <label className="label" htmlFor="weldType">
                <span className="label-text">Weld type</span>
              </label>
              <select
                id="weldType"
                className="select select-bordered"
                value={weldType}
                onChange={(e) => setWeldType(e.target.value)}
              >
                {Object.entries(WELD_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="divider">Welding</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label" htmlFor="welderName">
                <span className="label-text">Welder name</span>
              </label>
              <input
                id="welderName"
                type="text"
                className="input input-bordered"
                value={welderName}
                onChange={(e) => setWelderName(e.target.value)}
                placeholder="e.g. John D."
              />
            </div>
            <div className="form-control">
              <label className="label" htmlFor="weldingDate">
                <span className="label-text">Date welded</span>
              </label>
              <input
                id="weldingDate"
                type="date"
                className="input input-bordered"
                value={weldingDate}
                onChange={(e) => setWeldingDate(e.target.value)}
              />
            </div>
          </div>

          <div className="divider">Fit-up</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label" htmlFor="fitterName">
                <span className="label-text">Fitter name</span>
              </label>
              <input
                id="fitterName"
                type="text"
                className="input input-bordered"
                value={fitterName}
                onChange={(e) => setFitterName(e.target.value)}
                placeholder="e.g. Jane S."
              />
            </div>
            <div className="form-control">
              <label className="label" htmlFor="dateFitUp">
                <span className="label-text">Date fit-up</span>
              </label>
              <input
                id="dateFitUp"
                type="date"
                className="input input-bordered"
                value={dateFitUp}
                onChange={(e) => setDateFitUp(e.target.value)}
              />
            </div>
          </div>

          <div className="divider">Parts & Heat numbers</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label" htmlFor="partNumber1">
                <span className="label-text">Part number 1</span>
              </label>
              <input
                id="partNumber1"
                type="text"
                className="input input-bordered"
                value={partNumber1}
                onChange={(e) => setPartNumber1(e.target.value)}
                placeholder="e.g. P001"
              />
            </div>
            <div className="form-control">
              <label className="label" htmlFor="heatNumber1">
                <span className="label-text">Heat number 1</span>
              </label>
              <input
                id="heatNumber1"
                type="text"
                className="input input-bordered"
                value={heatNumber1}
                onChange={(e) => setHeatNumber1(e.target.value)}
                placeholder="e.g. H12345"
              />
            </div>
            <div className="form-control">
              <label className="label" htmlFor="partNumber2">
                <span className="label-text">Part number 2</span>
              </label>
              <input
                id="partNumber2"
                type="text"
                className="input input-bordered"
                value={partNumber2}
                onChange={(e) => setPartNumber2(e.target.value)}
                placeholder="e.g. P002"
              />
            </div>
            <div className="form-control">
              <label className="label" htmlFor="heatNumber2">
                <span className="label-text">Heat number 2</span>
              </label>
              <input
                id="heatNumber2"
                type="text"
                className="input input-bordered"
                value={heatNumber2}
                onChange={(e) => setHeatNumber2(e.target.value)}
                placeholder="e.g. H12346"
              />
            </div>
          </div>

          <div className="divider">Inspection</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label" htmlFor="ndtRequired">
                <span className="label-text">NDT required</span>
              </label>
              <select
                id="ndtRequired"
                className="select select-bordered"
                value={ndtRequired}
                onChange={(e) => setNdtRequired(e.target.value)}
              >
                {Object.entries(NDT_REQUIRED_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {k === "auto" && ndtAutoLabel ? `${v} (${ndtAutoLabel})` : v}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-control flex flex-col justify-end">
              <label className="label cursor-pointer justify-start gap-2">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  checked={visualInspection}
                  onChange={(e) => setVisualInspection(e.target.checked)}
                />
                <span className="label-text">Visual inspection</span>
              </label>
            </div>
          </div>

          {spools.length > 0 && (
            <>
              <div className="divider">Spool</div>
              <div className="form-control">
                <label className="label" htmlFor="spoolId">
                  <span className="label-text">Spool</span>
                </label>
                <select
                  id="spoolId"
                  className="select select-bordered"
                  value={spoolId}
                  onChange={(e) => setSpoolId(e.target.value)}
                >
                  <option value="">None</option>
                  {spools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="modal-action flex-wrap gap-2">
            {onMove && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  onMove?.(weld);
                  onClose?.();
                }}
              >
                Move on map
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className="btn btn-error btn-outline btn-sm"
                onClick={() => {
                  if (confirm("Delete this weld point?")) {
                    onDelete?.(weld);
                    onClose?.();
                  }
                }}
              >
                Delete
              </button>
            )}
            <div className="flex-1" />
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

export default ModalWeldForm;
