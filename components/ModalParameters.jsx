"use client";

import { useState, useEffect, useRef } from "react";
import SidePanelDrawings from "@/components/SidePanelDrawings";
import SidePanelLines from "@/components/SidePanelLines";
import SidePanelSpools from "@/components/SidePanelSpools";
import NdtRequirementsOverrideTable from "@/components/NdtRequirementsOverrideTable";
import { migrateNdtRequirementsRows } from "@/lib/ndt-requirements-rows";

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const value = typeof reader.result === "string" ? reader.result : "";
      resolve(value.replace(/^data:.*?;base64,/, ""));
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * @typedef {object} ModalSettingsStructureIntegration
 * @property {object} [drawings] — props for SidePanelDrawings (except hideHeader, isOpen, onToggle)
 * @property {object} [lines] — lines, spools, onSaveLines, onSaveSpools, onCreateLineOnCurrentPage, onLinkLineToCurrentPage, appMode
 * @property {object} [spools] — spools, parts, lines, spoolMarkers, weldPoints, weldStatusByWeldId, getWeldName, onSave, onAssignWeldToSpool, onAssignPartToSpool, appMode
 */

function ModalSettings({
  isOpen,
  onClose,
  settings = { ndtRequirements: [], weldingSpec: "" },
  personnel = { fitters: [], welders: [], wqrs: [] },
  systems = [],
  projectSettings = { steps: [] },
  projectMeta = { projectName: "", client: "", spec: "", revision: "", date: "" },
  wpsLibrary = [],
  electrodeLibrary = [],
  documents = [],
  onSave,
  /** When set, tree includes Drawings / Systems & lines / Spools with full-project editors */
  structureIntegration = null,
}) {
  const [activeSection, setActiveSection] = useState("project-ndt");

  // Default NDT state
  const [ndtRequirements, setNdtRequirements] = useState([]);
  const [weldingSpec, setWeldingSpec] = useState("");

  // Project meta state
  const [metaProjectName, setMetaProjectName] = useState("");
  const [metaClient, setMetaClient] = useState("");
  const [metaSpec, setMetaSpec] = useState("");
  const [metaRevision, setMetaRevision] = useState("");
  const [metaDate, setMetaDate] = useState("");
  const [projectSystems, setProjectSystems] = useState([]);
  const [projectWpsLibrary, setProjectWpsLibrary] = useState([]);

  // Personnel state
  const [personnelSubtab, setPersonnelSubtab] = useState("fitters");
  const [fitterName, setFitterName] = useState("");
  const [welderName, setWelderName] = useState("");
  const [editingWelderId, setEditingWelderId] = useState(null);
  const [wqrCode, setWqrCode] = useState("");
  const wqrUploadInputRef = useRef(null);
  const wpsUploadInputRef = useRef(null);
  const wqrUploadTargetRef = useRef(null);
  const wpsUploadTargetRef = useRef(null);
  /** Avoid resetting Personnel sidebar when parent props refresh while modal stays open (e.g. auto-save). */
  const parametersModalWasOpenRef = useRef(false);

  const fitters = personnel.fitters || [];
  const welders = personnel.welders || [];
  const wqrs = personnel.wqrs || [];
  const wqrDocuments = (documents || []).filter((doc) => doc?.category === "wqr");
  const wpsDocuments = (documents || []).filter((doc) => doc?.category === "wps");
  const safeElectrodeLibrary = Array.isArray(electrodeLibrary) ? electrodeLibrary : [];

  useEffect(() => {
    if (!isOpen) {
      parametersModalWasOpenRef.current = false;
      return;
    }

    const justOpened = !parametersModalWasOpenRef.current;
    parametersModalWasOpenRef.current = true;

    if (settings) {
      setNdtRequirements(migrateNdtRequirementsRows(settings.ndtRequirements || []));
      setWeldingSpec(settings.weldingSpec || "");
    }
    setMetaProjectName(projectMeta?.projectName || "");
    setMetaClient(projectMeta?.client || "");
    setMetaSpec(projectMeta?.spec || "");
    setMetaRevision(projectMeta?.revision || "");
    setMetaDate(projectMeta?.date || "");
    setProjectSystems(Array.isArray(systems) ? systems : []);
    setProjectWpsLibrary(Array.isArray(wpsLibrary) ? wpsLibrary : []);

    if (justOpened) {
      setPersonnelSubtab("fitters");
      setEditingWelderId(null);
      wqrUploadTargetRef.current = null;
      wpsUploadTargetRef.current = null;
      setActiveSection("project-ndt");
    }
  }, [settings, isOpen, projectMeta, systems, wpsLibrary]);

  // Personnel
  function handleAddFitter(e) {
    e.preventDefault();
    if (!fitterName.trim()) return;
    onSave?.({
      drawingSettings: { ndtRequirements, weldingSpec },
      personnel: {
        ...personnel,
        fitters: [...fitters, { id: generateId(), name: fitterName.trim() }],
      },
    });
    setFitterName("");
  }

  function handleRemoveFitter(id) {
    onSave?.({
      drawingSettings: { ndtRequirements, weldingSpec },
      personnel: { ...personnel, fitters: fitters.filter((f) => f.id !== id) },
    });
  }

  function handleAddWelder(e) {
    e.preventDefault();
    if (!welderName.trim()) return;
    onSave?.({
      drawingSettings: { ndtRequirements, weldingSpec },
      personnel: {
        ...personnel,
        welders: [...welders, { id: generateId(), name: welderName.trim(), wqrIds: [] }],
      },
    });
    setWelderName("");
  }

  function handleRemoveWelder(id) {
    onSave?.({
      drawingSettings: { ndtRequirements, weldingSpec },
      personnel: { ...personnel, welders: welders.filter((w) => w.id !== id) },
    });
    setEditingWelderId(null);
  }

  function handleAddWqr(e) {
    e.preventDefault();
    if (!wqrCode.trim() || !editingWelderId) return;
    const newWqr = { id: generateId(), code: wqrCode.trim(), documentId: null };
    const welder = welders.find((w) => w.id === editingWelderId);
    if (!welder) return;
    onSave?.({
      drawingSettings: { ndtRequirements, weldingSpec },
      personnel: {
        ...personnel,
        wqrs: [...wqrs, newWqr],
        welders: welders.map((w) =>
          w.id === editingWelderId
            ? { ...w, wqrIds: [...(w.wqrIds || []), newWqr.id] }
            : w
        ),
      },
    });
    setWqrCode("");
  }

  function handleUpdateWqrDocument(wqrId, documentId) {
    onSave?.({
      drawingSettings: { ndtRequirements, weldingSpec },
      personnel: {
        ...personnel,
        wqrs: wqrs.map((wqr) =>
          wqr.id === wqrId ? { ...wqr, documentId: documentId || null } : wqr
        ),
      },
    });
  }

  function handleRemoveWqrFromWelder(welderId, wqrId) {
    onSave?.({
      drawingSettings: { ndtRequirements, weldingSpec },
      personnel: {
        ...personnel,
        welders: welders.map((w) =>
          w.id === welderId
            ? { ...w, wqrIds: (w.wqrIds || []).filter((id) => id !== wqrId) }
            : w
        ),
      },
    });
  }

  function handleAddSystem() {
    const nextSystems = [
      ...projectSystems,
      {
        id: generateId(),
        name: `System ${projectSystems.length + 1}`,
        description: "",
        wps: "",
        ndtRequirements: [],
      },
    ];
    setProjectSystems(nextSystems);
    onSave?.({
      drawingSettings: { ndtRequirements, weldingSpec },
      personnel,
      systems: nextSystems,
      wpsLibrary: projectWpsLibrary,
      electrodeLibrary: safeElectrodeLibrary,
    });
  }

  function handleRemoveSystem(systemId) {
    const nextSystems = projectSystems.filter((system) => system.id !== systemId);
    setProjectSystems(nextSystems);
    onSave?.({
      drawingSettings: { ndtRequirements, weldingSpec },
      personnel,
      systems: nextSystems,
      wpsLibrary: projectWpsLibrary,
      electrodeLibrary: safeElectrodeLibrary,
    });
  }

  function handleUpdateSystem(systemId, updates) {
    const nextSystems = projectSystems.map((system) =>
      system.id === systemId ? { ...system, ...updates } : system
    );
    setProjectSystems(nextSystems);
  }

  function handleAddWps() {
    const nextCode = `WPS-${String(projectWpsLibrary.length + 1).padStart(3, "0")}`;
    const nextWpsLibrary = [
      ...projectWpsLibrary,
      { id: generateId(), code: nextCode, title: "", documentId: null },
    ];
    setProjectWpsLibrary(nextWpsLibrary);
    onSave?.({
      drawingSettings: { ndtRequirements, weldingSpec },
      personnel,
      systems: projectSystems,
      wpsLibrary: nextWpsLibrary,
      electrodeLibrary: safeElectrodeLibrary,
    });
  }

  function handleRemoveWps(wpsId) {
    const nextWpsLibrary = projectWpsLibrary.filter((entry) => entry.id !== wpsId);
    setProjectWpsLibrary(nextWpsLibrary);
    onSave?.({
      drawingSettings: { ndtRequirements, weldingSpec },
      personnel,
      systems: projectSystems,
      wpsLibrary: nextWpsLibrary,
      electrodeLibrary: safeElectrodeLibrary,
    });
  }

  function handleUpdateWps(wpsId, updates) {
    const nextWpsLibrary = projectWpsLibrary.map((entry) =>
      entry.id === wpsId ? { ...entry, ...updates } : entry
    );
    setProjectWpsLibrary(nextWpsLibrary);
  }

  async function uploadLinkedDocument(file, category, fallbackTitle) {
    const base64 = await fileToBase64(file);
    return {
      id: generateId(),
      title: (fallbackTitle || file.name || "").replace(/\.pdf$/i, ""),
      category,
      fileName: file.name || `${fallbackTitle || "document"}.pdf`,
      mimeType: file.type || "application/pdf",
      base64,
      createdAt: new Date().toISOString(),
    };
  }

  async function handleUploadWqrDocument(wqrId, event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    const resolvedWqrId = wqrId || wqrUploadTargetRef.current;
    if (!file || !resolvedWqrId) return;
    const wqr = wqrs.find((item) => item.id === resolvedWqrId);
    if (!wqr) return;
    const newDoc = await uploadLinkedDocument(file, "wqr", wqr.code || "WQR");
    onSave?.({
      drawingSettings: { ndtRequirements, weldingSpec },
      personnel: {
        ...personnel,
        wqrs: wqrs.map((item) =>
          item.id === resolvedWqrId ? { ...item, documentId: newDoc.id } : item
        ),
      },
      systems: projectSystems,
      wpsLibrary: projectWpsLibrary,
      electrodeLibrary: safeElectrodeLibrary,
      documents: [...documents, newDoc],
    });
    wqrUploadTargetRef.current = null;
  }

  async function handleUploadWpsDocument(wpsId, event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    const resolvedWpsId = wpsId || wpsUploadTargetRef.current;
    if (!file || !resolvedWpsId) return;
    const wpsEntry = projectWpsLibrary.find((entry) => entry.id === resolvedWpsId);
    if (!wpsEntry) return;
    const newDoc = await uploadLinkedDocument(file, "wps", wpsEntry.code || "WPS");
    const nextWpsLibrary = projectWpsLibrary.map((entry) =>
      entry.id === resolvedWpsId ? { ...entry, documentId: newDoc.id } : entry
    );
    setProjectWpsLibrary(nextWpsLibrary);
    onSave?.({
      drawingSettings: { ndtRequirements, weldingSpec },
      personnel,
      systems: projectSystems,
      wpsLibrary: nextWpsLibrary,
      electrodeLibrary: safeElectrodeLibrary,
      documents: [...documents, newDoc],
    });
    wpsUploadTargetRef.current = null;
  }

  const autoSaveTimeoutRef = useRef(null);
  useEffect(() => {
    if (!isOpen) return;
    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    autoSaveTimeoutRef.current = setTimeout(() => {
      const elib = Array.isArray(electrodeLibrary) ? electrodeLibrary : [];
      onSave?.({
        drawingSettings: { ndtRequirements, weldingSpec },
        personnel,
        projectSettings:
          projectSettings && typeof projectSettings === "object"
            ? projectSettings
            : { steps: [] },
        projectMeta: { projectName: metaProjectName, client: metaClient, spec: metaSpec, revision: metaRevision, date: metaDate },
        systems: projectSystems,
        wpsLibrary: projectWpsLibrary,
        electrodeLibrary: elib,
      });
    }, 500);
    return () => {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    };
  }, [isOpen, ndtRequirements, weldingSpec, personnel, projectSettings, metaProjectName, metaClient, metaSpec, metaRevision, metaDate, projectSystems, projectWpsLibrary, electrodeLibrary, onSave]);

  if (!isOpen) return null;

  const treeItems = [
    { key: "project-ndt", label: "Project NDT & spec" },
    { key: "personnel", label: "Personnel" },
    { key: "project-info", label: "Project info & libraries" },
    ...(structureIntegration
      ? [
          { key: "drawings", label: "Drawings" },
          { key: "lines", label: "Systems & lines" },
          { key: "spools", label: "Spools" },
        ]
      : []),
  ];

  return (
    <dialog open={isOpen} className="modal modal-open">
      <div className="modal-box w-full min-w-80 max-w-6xl max-h-[90vh] flex flex-col p-0 sm:p-6 gap-0 overflow-hidden">
        <div className="px-4 pt-4 sm:px-0 sm:pt-0 shrink-0">
          <h3 className="font-bold text-lg">Settings</h3>
          <p className="text-xs text-base-content/60 mt-1">Project defaults, personnel, structure, and libraries</p>
        </div>

        <div className="flex flex-1 min-h-0 flex-col md:flex-row gap-0 md:gap-4 mt-3 border-t border-base-300 md:border-0">
          <nav
            className="flex md:flex-col gap-1 p-2 md:p-0 md:w-52 shrink-0 border-b md:border-b-0 md:border-r border-base-300 overflow-x-auto md:overflow-y-auto bg-base-200/40 md:bg-transparent"
            aria-label="Settings sections"
          >
            {treeItems.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveSection(key)}
                className={`btn btn-sm justify-start font-normal whitespace-nowrap md:w-full ${
                  activeSection === key ? "btn-primary" : "btn-ghost"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="flex-1 min-h-0 min-w-0 overflow-y-auto px-4 pb-4 md:px-0 md:pr-1">
        {activeSection === "project-ndt" && (
          <div className="mt-2 md:mt-0">
            <NdtRequirementsOverrideTable
              scope="project"
              title="NDT / QC checks"
              hint="Add methods with % required. Default methods are VT, MPI, RT, UT; add custom tests (e.g. PWHT). Shop % / Field % apply by weld location."
              rows={ndtRequirements}
              onChange={setNdtRequirements}
            />
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
                Close
              </button>
            </div>
          </div>
        )}

        {activeSection === "personnel" && (
          <div className="mt-2 md:mt-0 space-y-4">
            <p className="text-sm text-base-content/70">
              Manage fitters, welders, and welder qualifications (WQR).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-[14rem_minmax(0,1fr)] gap-3">
              <aside className="border border-base-300 rounded-lg bg-base-100 p-2 h-fit">
                <ul className="menu menu-sm">
                  <li>
                    <button
                      type="button"
                      className={personnelSubtab === "fitters" ? "active" : ""}
                      onClick={() => setPersonnelSubtab("fitters")}
                    >
                      Fitters
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className={personnelSubtab === "welders" ? "active" : ""}
                      onClick={() => setPersonnelSubtab("welders")}
                    >
                      Welders & WQR
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className={personnelSubtab === "ndt" ? "active" : ""}
                      onClick={() => setPersonnelSubtab("ndt")}
                    >
                      NDT personnel
                    </button>
                  </li>
                </ul>
              </aside>

              <div className="min-w-0">
                {personnelSubtab === "fitters" && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Fitters</h4>
                    <form onSubmit={handleAddFitter} className="flex gap-2">
                      <input
                        type="text"
                        className="input input-bordered input-sm flex-1"
                        value={fitterName}
                        onChange={(e) => setFitterName(e.target.value)}
                        placeholder="Fitter name"
                      />
                      <button type="submit" className="btn btn-primary btn-sm">
                        Add
                      </button>
                    </form>
                    <ul className="space-y-1">
                      {fitters.map((f) => (
                        <li
                          key={f.id}
                          className="flex items-center justify-between gap-2 p-2 bg-base-200 rounded-lg text-sm"
                        >
                          <span>{f.name}</span>
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs text-error"
                            onClick={() => handleRemoveFitter(f.id)}
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                      {fitters.length === 0 && (
                        <p className="text-sm text-base-content/50">No fitters yet.</p>
                      )}
                    </ul>
                  </div>
                )}

                {personnelSubtab === "welders" && (
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Welders</h4>
                      <form onSubmit={handleAddWelder} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          className="input input-bordered input-sm flex-1"
                          value={welderName}
                          onChange={(e) => setWelderName(e.target.value)}
                          placeholder="Welder name"
                        />
                        <button type="submit" className="btn btn-primary btn-sm">
                          Add
                        </button>
                      </form>
                      <ul className="space-y-1">
                        {welders.map((w) => (
                          <li
                            key={w.id}
                            className="flex items-center justify-between gap-2 p-2 bg-base-200 rounded-lg text-sm"
                          >
                            <span>{w.name}</span>
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs text-error"
                              onClick={() => handleRemoveWelder(w.id)}
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                        {welders.length === 0 && (
                          <p className="text-sm text-base-content/50">No welders yet.</p>
                        )}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm mb-2">WQR per welder</h4>
                      <div className="form-control">
                        <label className="label py-0">
                          <span className="label-text text-xs">Select welder</span>
                        </label>
                        <select
                          className="select select-bordered select-sm"
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
                      </div>
                      {editingWelderId && (
                        <>
                          <form onSubmit={handleAddWqr} className="flex gap-2 mt-2">
                            <input
                              type="text"
                              className="input input-bordered input-sm flex-1"
                              value={wqrCode}
                              onChange={(e) => setWqrCode(e.target.value)}
                              placeholder="WQR code"
                            />
                            <button type="submit" className="btn btn-primary btn-sm">
                              Add
                            </button>
                          </form>
                          <ul className="space-y-1 mt-2">
                            {(welders.find((w) => w.id === editingWelderId)?.wqrIds || []).map((wqrId) => {
                              const wqr = wqrs.find((q) => q.id === wqrId);
                              return wqr ? (
                                <li key={wqr.id} className="p-2 bg-base-200 rounded text-sm space-y-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <span>{wqr.code}</span>
                                    <button
                                      type="button"
                                      className="btn btn-ghost btn-xs text-error"
                                      onClick={() => handleRemoveWqrFromWelder(editingWelderId, wqr.id)}
                                    >
                                      Remove
                                    </button>
                                  </div>
                                  <div className="form-control">
                                    <label className="label py-0">
                                      <span className="label-text text-xs">Linked WQR PDF</span>
                                    </label>
                                    <div className="flex gap-1">
                                      <select
                                        className="select select-bordered select-xs flex-1"
                                        value={wqr.documentId || ""}
                                        onChange={(e) => handleUpdateWqrDocument(wqr.id, e.target.value)}
                                      >
                                        <option value="">No PDF linked</option>
                                        {wqrDocuments.map((doc) => (
                                          <option key={doc.id} value={doc.id}>
                                            {doc.title || doc.fileName}
                                          </option>
                                        ))}
                                      </select>
                                      {!wqr.documentId && (
                                        <button
                                          type="button"
                                          className="btn btn-ghost btn-xs"
                                          onClick={() => {
                                            wqrUploadTargetRef.current = wqr.id;
                                            wqrUploadInputRef.current?.click();
                                          }}
                                        >
                                          Load
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </li>
                              ) : null;
                            })}
                          </ul>
                          {(welders.find((w) => w.id === editingWelderId)?.wqrIds || []).length === 0 && (
                            <p className="text-sm text-base-content/50 mt-1">No WQR for this welder.</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {personnelSubtab === "ndt" && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">NDT personnel</h4>
                    <p className="text-sm text-base-content/60">
                      Placeholder submenu reserved for future NDT operator / inspector qualification management.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-action mt-4">
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        )}

        {activeSection === "project-info" && (
          <div className="mt-2 md:mt-0 space-y-4">
            <p className="text-sm text-base-content/70">
              Project information used for documentation and export.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label"><span className="label-text">Project name</span></label>
                <input type="text" className="input input-bordered" value={metaProjectName} onChange={(e) => setMetaProjectName(e.target.value)} placeholder="e.g. Platform A Piping" />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Client</span></label>
                <input type="text" className="input input-bordered" value={metaClient} onChange={(e) => setMetaClient(e.target.value)} placeholder="e.g. Acme Corp" />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Spec / Standard</span></label>
                <input type="text" className="input input-bordered" value={metaSpec} onChange={(e) => setMetaSpec(e.target.value)} placeholder="e.g. ASME B31.3" />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Revision</span></label>
                <input type="text" className="input input-bordered" value={metaRevision} onChange={(e) => setMetaRevision(e.target.value)} placeholder="e.g. Rev A" />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Date</span></label>
                <input type="date" className="input input-bordered" value={metaDate} onChange={(e) => setMetaDate(e.target.value)} />
              </div>
            </div>

            <div className="divider my-1">Systems</div>
            <div className="flex justify-end">
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleAddSystem}>
                + Add system
              </button>
            </div>
            <ul className="space-y-2">
              {projectSystems.map((system) => (
                <li key={system.id} className="p-2 bg-base-200 rounded-lg space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input
                      type="text"
                      className="input input-bordered input-sm"
                      value={system.name || ""}
                      onChange={(e) => handleUpdateSystem(system.id, { name: e.target.value })}
                      placeholder="System name"
                    />
                    <input
                      type="text"
                      className="input input-bordered input-sm"
                      value={system.description || ""}
                      onChange={(e) => handleUpdateSystem(system.id, { description: e.target.value })}
                      placeholder="Description"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label py-0">
                      <span className="label-text text-xs">Default WPS (inherited by lines & welds)</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered input-sm w-full"
                      value={system.wps || ""}
                      onChange={(e) => handleUpdateSystem(system.id, { wps: e.target.value })}
                      placeholder="e.g. WPS-001 — optional; lines can override"
                    />
                  </div>
                  <NdtRequirementsOverrideTable
                    variant="compact"
                    scope="override"
                    title="NDT overrides (optional)"
                    hint="Per-method % for this system. Merges with project defaults; line-level overrides win over system for welds on that line."
                    rows={Array.isArray(system.ndtRequirements) ? system.ndtRequirements : []}
                    onChange={(nextReqs) => handleUpdateSystem(system.id, { ndtRequirements: nextReqs })}
                  />
                  <div className="flex justify-end">
                    <button type="button" className="btn btn-ghost btn-xs text-error" onClick={() => handleRemoveSystem(system.id)}>
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            {projectSystems.length === 0 && <p className="text-sm text-base-content/50">No systems yet.</p>}

            <div className="divider my-1">WPS Library</div>
            <div className="flex justify-end">
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleAddWps}>
                + Add WPS
              </button>
            </div>
            <ul className="space-y-2">
              {projectWpsLibrary.map((entry) => (
                <li key={entry.id} className="p-2 bg-base-200 rounded-lg space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input
                      type="text"
                      className="input input-bordered input-sm"
                      value={entry.code || ""}
                      onChange={(e) => handleUpdateWps(entry.id, { code: e.target.value.toUpperCase() })}
                      placeholder="WPS code"
                    />
                    <input
                      type="text"
                      className="input input-bordered input-sm"
                      value={entry.title || ""}
                      onChange={(e) => handleUpdateWps(entry.id, { title: e.target.value })}
                      placeholder="WPS title"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-end">
                    <div className="form-control">
                      <label className="label py-0">
                        <span className="label-text text-xs">Linked WPS PDF</span>
                      </label>
                      <div className="flex gap-1">
                        <select
                          className="select select-bordered select-sm flex-1"
                          value={entry.documentId || ""}
                          onChange={(e) => handleUpdateWps(entry.id, { documentId: e.target.value || null })}
                        >
                          <option value="">No PDF linked</option>
                          {wpsDocuments.map((doc) => (
                            <option key={doc.id} value={doc.id}>
                              {doc.title || doc.fileName}
                            </option>
                          ))}
                        </select>
                        {!entry.documentId && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => {
                              wpsUploadTargetRef.current = entry.id;
                              wpsUploadInputRef.current?.click();
                            }}
                          >
                            Load
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button type="button" className="btn btn-ghost btn-xs text-error" onClick={() => handleRemoveWps(entry.id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {projectWpsLibrary.length === 0 && <p className="text-sm text-base-content/50">No WPS entries yet.</p>}

            <p className="text-sm text-base-content/60 mt-4">
              Manage electrode certificates and register entries in <strong>Document Vault</strong> (Databook builder).
            </p>
            <div className="modal-action mt-4">
              <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
            </div>
          </div>
        )}

        {structureIntegration?.drawings && activeSection === "drawings" && (
          <div className="mt-2 md:mt-0 min-h-[min(70vh,520px)] flex flex-col border border-base-300 rounded-lg overflow-hidden bg-base-100">
            <SidePanelDrawings
              hideHeader
              isOpen
              onToggle={() => {}}
              {...structureIntegration.drawings}
            />
          </div>
        )}

        {structureIntegration?.lines && activeSection === "lines" && (
          <div className="mt-2 md:mt-0 min-h-[min(70vh,520px)] flex flex-col border border-base-300 rounded-lg overflow-hidden bg-base-100">
            <SidePanelLines
              hideHeader
              isOpen
              onToggle={() => {}}
              systems={projectSystems}
              systemsManagedExternally
              selectedLineId={null}
              {...structureIntegration.lines}
              drawingSettings={settings}
            />
          </div>
        )}

        {structureIntegration?.spools && activeSection === "spools" && (
          <div className="mt-2 md:mt-0 min-h-[min(70vh,520px)] flex flex-col border border-base-300 rounded-lg overflow-hidden bg-base-100">
            <SidePanelSpools
              hideHeader
              isOpen
              onToggle={() => {}}
              {...structureIntegration.spools}
            />
          </div>
        )}
          </div>
        </div>
        <input
          ref={wqrUploadInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => handleUploadWqrDocument(wqrUploadTargetRef.current, e)}
        />
        <input
          ref={wpsUploadInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => handleUploadWpsDocument(wpsUploadTargetRef.current, e)}
        />
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={onClose}>
          close
        </button>
      </form>
    </dialog>
  );
}

export default ModalSettings;
/** @deprecated Use ModalSettings */
export { ModalSettings as ModalParameters };
