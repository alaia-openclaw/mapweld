"use client";

import { useState, useEffect, useCallback } from "react";
import { NDT_METHODS, NDT_METHOD_LABELS, sortNdtMethods } from "@/lib/constants";

function generateId() {
  return `wiz-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const STEP_LABELS = ["Project", "Personnel", "NDT & spec", "Systems", "WPS library", "Done"];

/**
 * Guided new-project setup: identity → personnel → NDT/spec → systems → WPS → finish.
 */
function ProjectSetupWizard({ isOpen, onClose, onComplete, onRequestLoadPdf }) {
  const [step, setStep] = useState(0);

  const [projectName, setProjectName] = useState("");
  const [metaClient, setMetaClient] = useState("");
  const [metaSpec, setMetaSpec] = useState("");
  const [metaRevision, setMetaRevision] = useState("");
  const [metaDate, setMetaDate] = useState("");

  const [fitters, setFitters] = useState([]);
  const [welders, setWelders] = useState([]);
  const [wqrs, setWqrs] = useState([]);
  const [fitterInput, setFitterInput] = useState("");
  const [welderInput, setWelderInput] = useState("");
  const [editingWelderId, setEditingWelderId] = useState(null);
  const [wqrCodeInput, setWqrCodeInput] = useState("");

  const [ndtRequirements, setNdtRequirements] = useState([]);
  const [weldingSpec, setWeldingSpec] = useState("");
  const [customNdtMethod, setCustomNdtMethod] = useState("");

  const [systems, setSystems] = useState([]);

  const [wpsEntries, setWpsEntries] = useState([]);

  const resetForm = useCallback(() => {
    setStep(0);
    setProjectName("");
    setMetaClient("");
    setMetaSpec("");
    setMetaRevision("");
    setMetaDate("");
    setFitters([]);
    setWelders([]);
    setWqrs([]);
    setFitterInput("");
    setWelderInput("");
    setEditingWelderId(null);
    setWqrCodeInput("");
    setNdtRequirements([]);
    setWeldingSpec("");
    setCustomNdtMethod("");
    setSystems([]);
    setWpsEntries([]);
  }, []);

  useEffect(() => {
    if (isOpen) resetForm();
  }, [isOpen, resetForm]);

  const addNdtRow = useCallback((method, pct = 100) => {
    const normalizedMethod = String(method || "").trim().toUpperCase();
    if (!normalizedMethod) return;
    setNdtRequirements((prev) => {
      const filtered = prev.filter((r) => r.method !== normalizedMethod);
      const merged = [...filtered, { method: normalizedMethod, pct: Math.min(100, Math.max(0, pct)) }];
      const orderedMethods = sortNdtMethods(merged.map((r) => r.method));
      return merged.sort((a, b) => orderedMethods.indexOf(a.method) - orderedMethods.indexOf(b.method));
    });
  }, []);

  const updateNdtRow = useCallback((method, field, value) => {
    const num = value === "" ? null : parseInt(value, 10);
    if (num !== null && (Number.isNaN(num) || num < 0)) return;
    const clamped = num != null ? Math.min(100, Math.max(0, num)) : null;
    setNdtRequirements((prev) => {
      const prevReq = prev.find((r) => r.method === method);
      if (!prevReq) return prev;
      const next = { ...prevReq };
      if (field === "pct") {
        next.pct = clamped ?? 100;
        delete next.pctShop;
        delete next.pctField;
      } else if (field === "shop") {
        if (clamped == null || clamped === (prevReq.pct ?? 100)) delete next.pctShop;
        else next.pctShop = clamped;
      } else if (field === "field") {
        if (clamped == null || clamped === (prevReq.pct ?? 100)) delete next.pctField;
        else next.pctField = clamped;
      }
      const updated = prev.map((r) => (r.method === method ? next : r));
      const orderedMethods = sortNdtMethods(updated.map((r) => r.method));
      return updated.sort((a, b) => orderedMethods.indexOf(a.method) - orderedMethods.indexOf(b.method));
    });
  }, []);

  const removeNdtRow = useCallback((method) => {
    setNdtRequirements((prev) => prev.filter((r) => r.method !== method));
  }, []);

  function handleAddFitter(e) {
    e.preventDefault();
    if (!fitterInput.trim()) return;
    setFitters((prev) => [...prev, { id: generateId(), name: fitterInput.trim() }]);
    setFitterInput("");
  }

  function handleAddWelder(e) {
    e.preventDefault();
    if (!welderInput.trim()) return;
    setWelders((prev) => [...prev, { id: generateId(), name: welderInput.trim(), wqrIds: [] }]);
    setWelderInput("");
  }

  function handleAddWqr(e) {
    e.preventDefault();
    if (!wqrCodeInput.trim() || !editingWelderId) return;
    const newWqr = { id: generateId(), code: wqrCodeInput.trim(), documentId: null };
    setWqrs((prev) => [...prev, newWqr]);
    setWelders((prev) =>
      prev.map((w) =>
        w.id === editingWelderId ? { ...w, wqrIds: [...(w.wqrIds || []), newWqr.id] } : w
      )
    );
    setWqrCodeInput("");
  }

  function handleFinishCommit() {
    onComplete?.({
      projectMeta: {
        projectName: projectName.trim(),
        client: metaClient.trim(),
        spec: metaSpec.trim(),
        revision: metaRevision.trim(),
        date: metaDate,
      },
      personnel: { fitters, welders, wqrs },
      drawingSettings: { ndtRequirements, weldingSpec: weldingSpec.trim() },
      systems,
      wpsLibrary: wpsEntries,
    });
  }

  function handleLoadPdfAndFinish() {
    handleFinishCommit();
    onRequestLoadPdf?.();
  }

  function handleContinueLater() {
    handleFinishCommit();
  }

  function handleBack() {
    if (step <= 0) {
      onClose?.();
      return;
    }
    setStep((s) => s - 1);
  }

  function handleNext() {
    if (step < STEP_LABELS.length - 1) setStep((s) => s + 1);
  }

  if (!isOpen) return null;

  const maxStepIndex = STEP_LABELS.length - 1;

  return (
    <dialog open className="modal modal-open z-[60]">
      <div className="modal-box w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col p-0 gap-0">
        <div className="p-4 sm:p-6 border-b border-base-300 shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold">New project</h2>
              <p className="text-xs text-base-content/60 mt-1">Step {step + 1} of {STEP_LABELS.length}: {STEP_LABELS[step]}</p>
            </div>
            <button type="button" className="btn btn-ghost btn-sm btn-circle shrink-0" aria-label="Close" onClick={() => onClose?.()}>
              ×
            </button>
          </div>
          <ul className="steps steps-horizontal w-full mt-4 text-[10px] sm:text-xs">
            {STEP_LABELS.map((label, i) => (
              <li key={label} className={`step ${i <= step ? "step-primary" : ""}`}>
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
          {step === 0 && (
            <div className="space-y-4">
              <p className="text-sm text-base-content/70">Basic information used in exports and reports.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="form-control sm:col-span-2">
                  <label className="label py-1"><span className="label-text">Project name</span></label>
                  <input
                    type="text"
                    className="input input-bordered input-sm w-full"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. Platform A Piping"
                  />
                </div>
                <div className="form-control">
                  <label className="label py-1"><span className="label-text">Client</span></label>
                  <input
                    type="text"
                    className="input input-bordered input-sm w-full"
                    value={metaClient}
                    onChange={(e) => setMetaClient(e.target.value)}
                    placeholder="e.g. Acme Corp"
                  />
                </div>
                <div className="form-control">
                  <label className="label py-1"><span className="label-text">Spec / standard</span></label>
                  <input
                    type="text"
                    className="input input-bordered input-sm w-full"
                    value={metaSpec}
                    onChange={(e) => setMetaSpec(e.target.value)}
                    placeholder="e.g. ASME B31.3"
                  />
                </div>
                <div className="form-control">
                  <label className="label py-1"><span className="label-text">Revision</span></label>
                  <input
                    type="text"
                    className="input input-bordered input-sm w-full"
                    value={metaRevision}
                    onChange={(e) => setMetaRevision(e.target.value)}
                    placeholder="e.g. Rev A"
                  />
                </div>
                <div className="form-control">
                  <label className="label py-1"><span className="label-text">Date</span></label>
                  <input
                    type="date"
                    className="input input-bordered input-sm w-full"
                    value={metaDate}
                    onChange={(e) => setMetaDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <p className="text-sm text-base-content/70">Add people you will pick from on weld records. You can edit later in Parameters.</p>
              <div>
                <h4 className="font-medium text-sm mb-2">Fitters</h4>
                <form onSubmit={handleAddFitter} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    className="input input-bordered input-sm flex-1"
                    value={fitterInput}
                    onChange={(e) => setFitterInput(e.target.value)}
                    placeholder="Fitter name"
                  />
                  <button type="submit" className="btn btn-primary btn-sm">
                    Add
                  </button>
                </form>
                <ul className="space-y-1">
                  {fitters.map((f) => (
                    <li key={f.id} className="flex justify-between items-center text-sm bg-base-200 rounded px-2 py-1">
                      <span>{f.name}</span>
                      <button type="button" className="btn btn-ghost btn-xs" onClick={() => setFitters((p) => p.filter((x) => x.id !== f.id))}>
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-2">Welders</h4>
                <form onSubmit={handleAddWelder} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    className="input input-bordered input-sm flex-1"
                    value={welderInput}
                    onChange={(e) => setWelderInput(e.target.value)}
                    placeholder="Welder name"
                  />
                  <button type="submit" className="btn btn-primary btn-sm">
                    Add
                  </button>
                </form>
                <ul className="space-y-1">
                  {welders.map((w) => (
                    <li key={w.id} className="flex justify-between items-center text-sm bg-base-200 rounded px-2 py-1">
                      <span>{w.name}</span>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        onClick={() => {
                          const dropIds = new Set(w.wqrIds || []);
                          setWqrs((prev) => prev.filter((q) => !dropIds.has(q.id)));
                          setWelders((p) => p.filter((x) => x.id !== w.id));
                          if (editingWelderId === w.id) setEditingWelderId(null);
                        }}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-2">WQR codes (per welder)</h4>
                <div className="flex flex-wrap gap-2 mb-2">
                  <select
                    className="select select-bordered select-sm flex-1 min-w-[8rem]"
                    value={editingWelderId || ""}
                    onChange={(e) => setEditingWelderId(e.target.value || null)}
                  >
                    <option value="">Choose welder</option>
                    {welders.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                  <form onSubmit={handleAddWqr} className="flex gap-2 flex-1 min-w-[12rem]">
                    <input
                      type="text"
                      className="input input-bordered input-sm flex-1"
                      value={wqrCodeInput}
                      onChange={(e) => setWqrCodeInput(e.target.value)}
                      placeholder="WQR code"
                    />
                    <button type="submit" className="btn btn-ghost btn-sm" disabled={!editingWelderId}>
                      Add WQR
                    </button>
                  </form>
                </div>
                {welders.length > 0 && editingWelderId && (
                  <ul className="text-sm space-y-1">
                    {(welders.find((w) => w.id === editingWelderId)?.wqrIds || []).map((qid) => {
                      const q = wqrs.find((x) => x.id === qid);
                      return q ? (
                        <li key={q.id} className="flex justify-between bg-base-200 rounded px-2 py-1">
                          <span>{q.code}</span>
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            onClick={() => {
                              setWelders((prev) =>
                                prev.map((w) =>
                                  w.id === editingWelderId
                                    ? { ...w, wqrIds: (w.wqrIds || []).filter((id) => id !== q.id) }
                                    : w
                                )
                              );
                              setWqrs((prev) => prev.filter((x) => x.id !== q.id));
                            }}
                          >
                            Remove
                          </button>
                        </li>
                      ) : null;
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-base-content/70">Default NDT requirements and welding specification for this project.</p>
              <div className="space-y-2">
                {ndtRequirements.map((r) => (
                  <div key={r.method} className="flex flex-wrap items-center gap-2 p-2 bg-base-200 rounded-lg">
                    <span className="w-24 font-medium text-sm">{NDT_METHOD_LABELS[r.method] || r.method}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-base-content/60">Shop</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        className="input input-bordered input-sm w-14"
                        value={r.pctShop ?? r.pct ?? 100}
                        onChange={(e) => updateNdtRow(r.method, "shop", e.target.value)}
                      />
                      <span className="text-sm">%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-base-content/60">Field</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        className="input input-bordered input-sm w-14"
                        value={r.pctField ?? r.pct ?? 100}
                        onChange={(e) => updateNdtRow(r.method, "field", e.target.value)}
                      />
                      <span className="text-sm">%</span>
                    </div>
                    <button type="button" className="btn btn-ghost btn-sm btn-square ml-auto" onClick={() => removeNdtRow(r.method)} aria-label={`Remove ${r.method}`}>
                      ×
                    </button>
                  </div>
                ))}
                {ndtRequirements.length === 0 && <p className="text-sm text-base-content/50">No NDT methods yet — add below.</p>}
              </div>
              <div className="flex flex-wrap gap-1">
                {NDT_METHODS.filter((m) => !ndtRequirements.some((r) => r.method === m)).map((m) => (
                  <button key={m} type="button" className="btn btn-ghost btn-xs" onClick={() => addNdtRow(m)}>
                    + {NDT_METHOD_LABELS[m] || m}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 flex-wrap">
                <input
                  type="text"
                  className="input input-bordered input-sm flex-1 min-w-[8rem]"
                  value={customNdtMethod}
                  onChange={(e) => setCustomNdtMethod(e.target.value.toUpperCase())}
                  placeholder="Custom code (e.g. PWHT)"
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    if (!customNdtMethod.trim()) return;
                    addNdtRow(customNdtMethod.trim(), 100);
                    setCustomNdtMethod("");
                  }}
                >
                  + Add custom
                </button>
              </div>
              <div className="form-control">
                <label className="label py-1"><span className="label-text">Welding spec</span></label>
                <input
                  type="text"
                  className="input input-bordered input-sm w-full"
                  value={weldingSpec}
                  onChange={(e) => setWeldingSpec(e.target.value)}
                  placeholder="e.g. WPS-001, ASME IX"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-base-content/70">Systems group lines for traceability. Optional — you can add more later.</p>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() =>
                  setSystems((prev) => [
                    ...prev,
                    {
                      id: generateId(),
                      name: `System ${prev.length + 1}`,
                      description: "",
                      wps: "",
                      ndtRequirements: [],
                    },
                  ])
                }
              >
                + Add system
              </button>
              <ul className="space-y-2">
                {systems.map((sys) => (
                  <li key={sys.id} className="p-2 bg-base-200 rounded-lg space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        className="input input-bordered input-sm"
                        value={sys.name}
                        onChange={(e) =>
                          setSystems((prev) => prev.map((s) => (s.id === sys.id ? { ...s, name: e.target.value } : s)))
                        }
                        placeholder="System name"
                      />
                      <input
                        type="text"
                        className="input input-bordered input-sm"
                        value={sys.description || ""}
                        onChange={(e) =>
                          setSystems((prev) =>
                            prev.map((s) => (s.id === sys.id ? { ...s, description: e.target.value } : s))
                          )
                        }
                        placeholder="Description"
                      />
                    </div>
                    <input
                      type="text"
                      className="input input-bordered input-sm w-full"
                      value={sys.wps || ""}
                      onChange={(e) =>
                        setSystems((prev) =>
                          prev.map((s) => (s.id === sys.id ? { ...s, wps: e.target.value } : s))
                        )
                      }
                      placeholder="Default WPS for this system (optional)"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs text-error"
                        onClick={() => setSystems((prev) => prev.filter((s) => s.id !== sys.id))}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              {systems.length === 0 && <p className="text-sm text-base-content/50">No systems yet.</p>}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-base-content/70">
                Register WPS codes used on welds. Link PDFs later in <strong>Settings</strong> if needed. You can also set default WPS per system (above) or per line in the Lines panel.
              </p>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  const n = wpsEntries.length + 1;
                  setWpsEntries((prev) => [...prev, { id: generateId(), code: `WPS-${String(n).padStart(3, "0")}`, title: "", documentId: null }]);
                }}
              >
                + Add WPS
              </button>
              <ul className="space-y-2">
                {wpsEntries.map((entry) => (
                  <li key={entry.id} className="p-2 bg-base-200 rounded-lg space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        className="input input-bordered input-sm"
                        value={entry.code}
                        onChange={(e) =>
                          setWpsEntries((prev) =>
                            prev.map((w) => (w.id === entry.id ? { ...w, code: e.target.value.toUpperCase() } : w))
                          )
                        }
                        placeholder="WPS code"
                      />
                      <input
                        type="text"
                        className="input input-bordered input-sm"
                        value={entry.title}
                        onChange={(e) =>
                          setWpsEntries((prev) =>
                            prev.map((w) => (w.id === entry.id ? { ...w, title: e.target.value } : w))
                          )
                        }
                        placeholder="Title"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs text-error"
                        onClick={() => setWpsEntries((prev) => prev.filter((w) => w.id !== entry.id))}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              {wpsEntries.length === 0 && <p className="text-sm text-base-content/50">No WPS entries yet — optional.</p>}
            </div>
          )}

          {step === maxStepIndex && (
            <div className="space-y-4 text-center">
              <p className="text-4xl" aria-hidden>
                ✓
              </p>
              <p className="font-semibold">Setup complete</p>
              <p className="text-sm text-base-content/70">
                {projectName.trim() ? (
                  <>
                    Project <span className="font-medium text-base-content">{projectName.trim()}</span> is ready.
                  </>
                ) : (
                  "Your project is ready."
                )}{" "}
                Load a PDF drawing to start placing welds, or continue and load one later from the toolbar.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                <button type="button" className="btn btn-primary" onClick={handleLoadPdfAndFinish}>
                  Load PDF now
                </button>
                <button type="button" className="btn btn-ghost" onClick={handleContinueLater}>
                  Continue without PDF
                </button>
              </div>
            </div>
          )}
        </div>

        {step < maxStepIndex && (
          <div className="p-4 sm:p-6 border-t border-base-300 flex flex-wrap justify-between gap-2 shrink-0">
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleBack}>
              {step === 0 ? "← Back to project choice" : "Back"}
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={handleNext}>
              Next
            </button>
          </div>
        )}
      </div>
      <form method="dialog" className="modal-backdrop bg-base-300/60">
        <button type="button" aria-label="Close" onClick={() => onClose?.()}>
          close
        </button>
      </form>
    </dialog>
  );
}

export default ProjectSetupWizard;
