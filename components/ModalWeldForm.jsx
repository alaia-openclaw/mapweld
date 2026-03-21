"use client";

import { useState, useEffect, useRef } from "react";
import {
  WELD_TYPES,
  WELD_TYPE_LABELS,
  WELD_LOCATION,
  WELD_LOCATION_LABELS,
  NDT_REQUIRED_OPTIONS,
  NDT_REQUIRED_LABELS,
} from "@/lib/constants";

function ModalWeldForm({
  weld,
  isOpen,
  onClose,
  onSave,
  onDelete,
  appMode = "edition",
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
  const [weldType, setWeldType] = useState("butt");
  const [weldLocation, setWeldLocation] = useState("shop");
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
      setWeldType(weld.weldType || "butt");
      setWeldLocation(weld.weldLocation || "shop");
      setNdtRequired(weld.ndtRequired || NDT_REQUIRED_OPTIONS.AUTO);
      setVisualInspection(weld.visualInspection || false);
      setSpoolId(weld.spoolId || "");
    }
  }, [weld]);

  const autoSaveTimeoutRef = useRef(null);
  useEffect(() => {
    if (!weld || !isOpen) return;
    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    autoSaveTimeoutRef.current = setTimeout(() => {
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
        weldType,
        weldLocation,
        ndtRequired,
        visualInspection,
        spoolId: spoolId || null,
      });
    }, 500);
    return () => {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    };
  }, [
    weld,
    isOpen,
    welderName,
    weldingDate,
    fitterName,
    dateFitUp,
    partNumber1,
    partNumber2,
    heatNumber1,
    heatNumber2,
    weldType,
    weldLocation,
    ndtRequired,
    visualInspection,
    spoolId,
    onSave,
  ]);

  if (!isOpen) return null;

  return (
    <dialog open={isOpen} className="modal modal-open">
      <div className="modal-box w-full max-w-none h-[100dvh] max-h-[100dvh] rounded-none md:w-auto md:max-w-4xl md:max-h-[90vh] md:h-auto md:rounded-lg overflow-y-auto">
        <h3 className="font-bold text-lg">Weld info</h3>
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="form-control">
              <label className="label" htmlFor="weldType">
                <span className="label-text">Weld type</span>
              </label>
              <select
                id="weldType"
                className="select select-bordered select-xs"
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
            <div className="form-control">
              <label className="label" htmlFor="weldLocation">
                <span className="label-text">Location</span>
              </label>
              <select
                id="weldLocation"
                className="select select-bordered select-xs"
                value={weldLocation}
                onChange={(e) => setWeldLocation(e.target.value)}
              >
                {Object.entries(WELD_LOCATION_LABELS).map(([k, v]) => (
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
                className="input input-bordered input-xs"
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
                className="input input-bordered input-xs"
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
                className="input input-bordered input-xs"
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
                className="input input-bordered input-xs"
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
                className="input input-bordered input-xs"
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
                className="input input-bordered input-xs"
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
                className="input input-bordered input-xs"
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
                className="input input-bordered input-xs"
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
                className="select select-bordered select-xs"
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
                className="select select-bordered select-xs"
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
            {onDelete && appMode === "edition" && (
              <button
                type="button"
                className="btn btn-error btn-outline min-h-12"
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
            <button type="button" className="btn btn-ghost min-h-12" onClick={onClose}>
              Close
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
