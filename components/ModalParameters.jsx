"use client";

import { useState, useEffect, useRef } from "react";
import SidePanelDrawings from "@/components/SidePanelDrawings";
import SidePanelLines from "@/components/SidePanelLines";
import SidePanelSpools from "@/components/SidePanelSpools";
import NdtRequirementsOverrideTable from "@/components/NdtRequirementsOverrideTable";
import SettingsWpsRegistry from "@/components/settings/SettingsWpsRegistry";
import SettingsElectrodePanel from "@/components/settings/SettingsElectrodePanel";
import SettingsMaterialCertificatesPanel from "@/components/settings/SettingsMaterialCertificatesPanel";
import SettingsPersonnelRegistry from "@/components/settings/SettingsPersonnelRegistry";
import SettingsDocumentCategoryRegistry from "@/components/settings/SettingsDocumentCategoryRegistry";
import SettingsNdtReportsRegistry from "@/components/settings/SettingsNdtReportsRegistry";
import SettingsDatabookExportPanel from "@/components/settings/SettingsDatabookExportPanel";
import { getWeldName } from "@/lib/weld-utils";
import { migrateNdtRequirementsRows } from "@/lib/ndt-requirements-rows";
import { normalizeDatabookConfig } from "@/lib/databook-sections";

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
  databookConfig = null,
  materialCertificates = [],
  ndtReports = [],
  ndtRequests = [],
  lines = [],
  spools = [],
  parts = [],
  drawings = [],
  weldPoints = [],
  onSave,
  onCompileDatabook,
  isCompilingDatabook = false,
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

  const wqrUploadInputRef = useRef(null);
  const wqrUploadTargetRef = useRef(null);
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
      wqrUploadTargetRef.current = null;
      setActiveSection("project-ndt");
    }
  }, [settings, isOpen, projectMeta, systems, wpsLibrary]);

  function pushProjectSave(overrides = {}) {
    onSave?.({
      drawingSettings: { ndtRequirements, weldingSpec },
      personnel,
      systems: projectSystems,
      projectMeta: {
        projectName: metaProjectName,
        client: metaClient,
        spec: metaSpec,
        revision: metaRevision,
        date: metaDate,
      },
      wpsLibrary: projectWpsLibrary,
      electrodeLibrary: safeElectrodeLibrary,
      ...overrides,
    });
  }

  function handleAddFitterName(name) {
    pushProjectSave({
      personnel: {
        ...personnel,
        fitters: [...fitters, { id: generateId(), name }],
      },
    });
  }

  function handleUpdateFitterName(id, name) {
    pushProjectSave({
      personnel: {
        ...personnel,
        fitters: fitters.map((f) => (f.id === id ? { ...f, name } : f)),
      },
    });
  }

  function handleRemoveFitter(id) {
    pushProjectSave({
      personnel: { ...personnel, fitters: fitters.filter((f) => f.id !== id) },
    });
  }

  function handleAddWelderName(name) {
    pushProjectSave({
      personnel: {
        ...personnel,
        welders: [...welders, { id: generateId(), name, wqrIds: [] }],
      },
    });
  }

  function handleUpdateWelderName(id, name) {
    pushProjectSave({
      personnel: {
        ...personnel,
        welders: welders.map((w) => (w.id === id ? { ...w, name } : w)),
      },
    });
  }

  function handleRemoveWelder(id) {
    pushProjectSave({
      personnel: { ...personnel, welders: welders.filter((w) => w.id !== id) },
    });
  }

  function handleAddWqrForWelder(welderId) {
    const newWqr = { id: generateId(), code: "", documentId: null, description: "" };
    pushProjectSave({
      personnel: {
        ...personnel,
        wqrs: [...wqrs, newWqr],
        welders: welders.map((w) =>
          w.id === welderId
            ? { ...w, wqrIds: [...(w.wqrIds || []), newWqr.id] }
            : w
        ),
      },
    });
  }

  /** Remove WQR from this welder; drop the WQR record if no welder references it. */
  function handleUnlinkWqrFromWelder(welderId, wqrId) {
    const nextWelders = welders.map((w) =>
      w.id === welderId
        ? { ...w, wqrIds: (w.wqrIds || []).filter((id) => id !== wqrId) }
        : w
    );
    const stillReferenced = nextWelders.some((w) => (w.wqrIds || []).includes(wqrId));
    const nextWqrs = stillReferenced ? wqrs : wqrs.filter((q) => q.id !== wqrId);
    pushProjectSave({
      personnel: {
        ...personnel,
        welders: nextWelders,
        wqrs: nextWqrs,
      },
    });
  }

  function handleUpdateWqr(wqrId, updates) {
    pushProjectSave({
      personnel: {
        ...personnel,
        wqrs: wqrs.map((wqr) => (wqr.id === wqrId ? { ...wqr, ...updates } : wqr)),
      },
    });
  }

  function handleDeleteWqrFromProject(wqrId) {
    if (
      !confirm(
        "Delete this WQR from the project? It will be removed from all welders and welding records will lose this link."
      )
    )
      return;
    pushProjectSave({
      personnel: {
        ...personnel,
        wqrs: wqrs.filter((w) => w.id !== wqrId),
        welders: welders.map((w) => ({
          ...w,
          wqrIds: (w.wqrIds || []).filter((id) => id !== wqrId),
        })),
      },
    });
  }

  async function handleAddVaultDocument(category, file) {
    const newDoc = await uploadLinkedDocument(file, category, file.name);
    pushProjectSave({ documents: [...(documents || []), newDoc] });
  }

  function handleUpdateVaultDocument(docId, updates) {
    pushProjectSave({
      documents: (documents || []).map((d) => (d.id === docId ? { ...d, ...updates } : d)),
    });
  }

  function handleRemoveVaultDocument(docId) {
    pushProjectSave({
      documents: (documents || []).filter((d) => d.id !== docId),
    });
  }

  function handlePersistNdt({ ndtReports: nextReports, weldPoints: nextWelds }) {
    onSave?.({
      drawingSettings: { ndtRequirements, weldingSpec },
      personnel,
      systems: projectSystems,
      projectMeta: {
        projectName: metaProjectName,
        client: metaClient,
        spec: metaSpec,
        revision: metaRevision,
        date: metaDate,
      },
      wpsLibrary: projectWpsLibrary,
      electrodeLibrary: safeElectrodeLibrary,
      ndtReports: nextReports,
      weldPoints: nextWelds,
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
    const nextWpsLibrary = [
      ...projectWpsLibrary,
      {
        id: generateId(),
        code: "",
        title: "",
        description: "",
        documentId: null,
      },
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

  async function handleUploadMtcPdf(heat, file) {
    const base64 = await fileToBase64(file);
    const newDoc = {
      id: generateId(),
      title: `${heat} MTC`,
      category: "mtc",
      fileName: file.name || `${heat}.pdf`,
      mimeType: file.type || "application/pdf",
      base64,
      createdAt: new Date().toISOString(),
    };
    const nextDocs = [...(documents || []), newDoc];
    const list = Array.isArray(materialCertificates) ? [...materialCertificates] : [];
    const idx = list.findIndex((item) => (item?.heatNumber || "").trim() === heat);
    const nextEntry = {
      id: idx >= 0 ? list[idx].id : generateId(),
      heatNumber: heat,
      documentId: newDoc.id,
      linkedPartIds: idx >= 0 ? list[idx].linkedPartIds || [] : [],
    };
    if (idx >= 0) list[idx] = nextEntry;
    else list.push(nextEntry);
    onSave?.({
      drawingSettings: { ndtRequirements, weldingSpec },
      personnel,
      systems: projectSystems,
      projectMeta: {
        projectName: metaProjectName,
        client: metaClient,
        spec: metaSpec,
        revision: metaRevision,
        date: metaDate,
      },
      wpsLibrary: projectWpsLibrary,
      electrodeLibrary: safeElectrodeLibrary,
      documents: nextDocs,
      materialCertificates: list,
    });
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

  const navGroups = [
    {
      label: "Project",
      items: [
        { key: "project-ndt", label: "NDT & spec" },
        { key: "project-info", label: "Project info" },
        { key: "systems", label: "Systems" },
      ],
    },
    {
      label: "Libraries",
      items: [
        { key: "wps", label: "WPS" },
        { key: "personnel", label: "Personnel" },
      ],
    },
    {
      label: "Documents & QA",
      items: [
        { key: "electrodes", label: "Electrode register" },
        { key: "materials", label: "Material certificates" },
        { key: "painting-reports", label: "Painting reports" },
        { key: "ndt-reports", label: "NDT reports" },
        { key: "itp", label: "ITP" },
        { key: "databook-export", label: "Databook export" },
      ],
    },
    ...(structureIntegration
      ? [
          {
            label: "Structure",
            items: [
              { key: "drawings", label: "Drawings" },
              { key: "lines", label: "Systems & lines" },
              { key: "spools", label: "Spools" },
            ],
          },
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
            className="flex md:flex-col gap-2 p-2 md:p-0 md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-base-300 overflow-x-auto md:overflow-y-auto bg-base-200/40 md:bg-transparent max-h-[min(70vh,520px)]"
            aria-label="Settings sections"
          >
            {navGroups.map((group) => (
              <div key={group.label} className="min-w-0">
                <p className="hidden md:block text-[10px] font-semibold uppercase tracking-wide text-base-content/50 px-1 pt-1 pb-0.5">
                  {group.label}
                </p>
                <ul className="flex md:flex-col gap-0.5">
                  {group.items.map(({ key, label }) => (
                    <li key={key} className="flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setActiveSection(key)}
                        className={`btn btn-xs justify-start font-normal whitespace-nowrap md:w-full h-8 min-h-8 ${
                          activeSection === key ? "btn-primary" : "btn-ghost"
                        }`}
                      >
                        {label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
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
                className="input input-bordered input-xs"
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
            <SettingsPersonnelRegistry
              fitters={fitters}
              welders={welders}
              wqrs={wqrs}
              wqrDocuments={wqrDocuments}
              weldPoints={weldPoints}
              systems={projectSystems}
              lines={lines}
              spools={spools}
              wpsLibrary={projectWpsLibrary}
              onAddFitter={handleAddFitterName}
              onRemoveFitter={handleRemoveFitter}
              onUpdateFitterName={handleUpdateFitterName}
              onAddWelder={handleAddWelderName}
              onRemoveWelder={handleRemoveWelder}
              onUpdateWelderName={handleUpdateWelderName}
              onAddWqrForWelder={handleAddWqrForWelder}
              onUpdateWqr={handleUpdateWqr}
              onUnlinkWqrFromWelder={handleUnlinkWqrFromWelder}
              onDeleteWqr={handleDeleteWqrFromProject}
              wqrUploadInputRef={wqrUploadInputRef}
              wqrUploadTargetRef={wqrUploadTargetRef}
            />
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
                <input type="text" className="input input-bordered input-xs" value={metaProjectName} onChange={(e) => setMetaProjectName(e.target.value)} placeholder="e.g. Platform A Piping" />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Client</span></label>
                <input type="text" className="input input-bordered input-xs" value={metaClient} onChange={(e) => setMetaClient(e.target.value)} placeholder="e.g. Acme Corp" />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Spec / Standard</span></label>
                <input type="text" className="input input-bordered input-xs" value={metaSpec} onChange={(e) => setMetaSpec(e.target.value)} placeholder="e.g. ASME B31.3" />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Revision</span></label>
                <input type="text" className="input input-bordered input-xs" value={metaRevision} onChange={(e) => setMetaRevision(e.target.value)} placeholder="e.g. Rev A" />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Date</span></label>
                <input type="date" className="input input-bordered input-xs" value={metaDate} onChange={(e) => setMetaDate(e.target.value)} />
              </div>
            </div>

            <div className="modal-action mt-4">
              <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
            </div>
          </div>
        )}

        {activeSection === "systems" && (
          <div className="mt-2 md:mt-0 space-y-4">
            <p className="text-sm text-base-content/70">
              Systems group lines and inherit default WPS / NDT settings.
            </p>
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
                      className="input input-bordered input-xs"
                      value={system.name || ""}
                      onChange={(e) => handleUpdateSystem(system.id, { name: e.target.value })}
                      placeholder="System name"
                    />
                    <input
                      type="text"
                      className="input input-bordered input-xs"
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
                      className="input input-bordered input-xs w-full"
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
            <div className="modal-action mt-4">
              <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
            </div>
          </div>
        )}

        {activeSection === "wps" && (
          <div className="mt-2 md:mt-0 space-y-3">
            <p className="text-xs text-base-content/70">
              Project WPS list (title and description). Use <strong>Links</strong> to see welds and WQR codes tied to each entry. Assign a WPS to welds from the weld form.
            </p>
            <SettingsWpsRegistry
              wpsLibrary={projectWpsLibrary}
              weldPoints={weldPoints}
              personnel={personnel}
              wpsDocuments={wpsDocuments}
              onAddWps={handleAddWps}
              onUpdateWps={handleUpdateWps}
              onRemoveWps={handleRemoveWps}
            />
            <div className="modal-action mt-4">
              <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
            </div>
          </div>
        )}

        {activeSection === "electrodes" && (
          <div className="mt-2 md:mt-0 space-y-3">
            <SettingsElectrodePanel
              documents={documents}
              electrodeLibrary={electrodeLibrary}
              onSave={(payload) => {
                onSave?.({
                  drawingSettings: { ndtRequirements, weldingSpec },
                  personnel,
                  systems: projectSystems,
                  projectMeta: {
                    projectName: metaProjectName,
                    client: metaClient,
                    spec: metaSpec,
                    revision: metaRevision,
                    date: metaDate,
                  },
                  wpsLibrary: projectWpsLibrary,
                  electrodeLibrary: payload.electrodeLibrary,
                  documents: payload.documents,
                });
              }}
            />
            <div className="modal-action mt-4">
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        )}

        {activeSection === "materials" && (
          <div className="mt-2 md:mt-0 space-y-3">
            <SettingsMaterialCertificatesPanel
              materialCertificates={materialCertificates}
              documents={documents}
              weldPoints={weldPoints}
              parts={parts}
              onUpdateCertificates={(next) => {
                onSave?.({
                  drawingSettings: { ndtRequirements, weldingSpec },
                  personnel,
                  systems: projectSystems,
                  projectMeta: {
                    projectName: metaProjectName,
                    client: metaClient,
                    spec: metaSpec,
                    revision: metaRevision,
                    date: metaDate,
                  },
                  wpsLibrary: projectWpsLibrary,
                  electrodeLibrary: safeElectrodeLibrary,
                  materialCertificates: next,
                });
              }}
              onUploadMtcPdf={handleUploadMtcPdf}
            />
            <div className="modal-action mt-4">
              <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
            </div>
          </div>
        )}

        {activeSection === "painting-reports" && (
          <div className="mt-2 md:mt-0 space-y-3">
            <SettingsDocumentCategoryRegistry
              category="painting_report"
              documents={documents}
              onUpdateDocument={handleUpdateVaultDocument}
              onRemoveDocument={handleRemoveVaultDocument}
              onAddDocumentFromFile={(file) => handleAddVaultDocument("painting_report", file)}
            />
            <div className="modal-action mt-4">
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        )}

        {activeSection === "ndt-reports" && (
          <div className="mt-2 md:mt-0 space-y-3">
            <SettingsNdtReportsRegistry
              ndtReports={ndtReports}
              ndtRequests={ndtRequests}
              weldPoints={weldPoints}
              drawingSettings={settings}
              getWeldName={(w) => getWeldName(w, weldPoints)}
              onPersist={handlePersistNdt}
            />
            <div className="modal-action mt-4">
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        )}

        {activeSection === "itp" && (
          <div className="mt-2 md:mt-0 space-y-3">
            <SettingsDocumentCategoryRegistry
              category="itp"
              documents={documents}
              onUpdateDocument={handleUpdateVaultDocument}
              onRemoveDocument={handleRemoveVaultDocument}
              onAddDocumentFromFile={(file) => handleAddVaultDocument("itp", file)}
            />
            <div className="modal-action mt-4">
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        )}

        {activeSection === "databook-export" && (
          <div className="mt-2 md:mt-0 space-y-3">
            <SettingsDatabookExportPanel
              databookConfig={databookConfig}
              onChange={(next) => {
                onSave?.({
                  drawingSettings: { ndtRequirements, weldingSpec },
                  personnel,
                  systems: projectSystems,
                  projectMeta: {
                    projectName: metaProjectName,
                    client: metaClient,
                    spec: metaSpec,
                    revision: metaRevision,
                    date: metaDate,
                  },
                  wpsLibrary: projectWpsLibrary,
                  electrodeLibrary: safeElectrodeLibrary,
                  databookConfig: normalizeDatabookConfig(next),
                });
              }}
              onCompile={onCompileDatabook}
              isCompiling={isCompilingDatabook}
            />
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
