"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import SidePanelDrawings from "@/components/SidePanelDrawings";
import SidePanelLines from "@/components/SidePanelLines";
import SidePanelSpools from "@/components/SidePanelSpools";
import SidePanelWeldForm from "@/components/SidePanelWeldForm";
import NdtRequirementsOverrideTable from "@/components/NdtRequirementsOverrideTable";
import NdtInheritanceHelpModal from "@/components/NdtInheritanceHelpModal";
import SettingsWpsRegistry from "@/components/settings/SettingsWpsRegistry";
import SettingsElectrodePanel from "@/components/settings/SettingsElectrodePanel";
import SettingsMaterialCertificatesPanel from "@/components/settings/SettingsMaterialCertificatesPanel";
import SettingsPersonnelRegistry from "@/components/settings/SettingsPersonnelRegistry";
import SettingsDocumentCategoryRegistry from "@/components/settings/SettingsDocumentCategoryRegistry";
import SettingsNdtReportsRegistry from "@/components/settings/SettingsNdtReportsRegistry";
import SettingsNdtRequestsRegistry from "@/components/settings/SettingsNdtRequestsRegistry";
import { getWeldName } from "@/lib/weld-utils";
import { migrateNdtRequirementsRows } from "@/lib/ndt-requirements-rows";
import {
  getWpsLibraryEntryEffectiveCode,
  findWpsLibraryEntriesMatchingUserText,
  isWpsLibraryEntryRegisteredForDropdown,
} from "@/lib/wps-resolution";

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Map stored WPS text to select value: `__none__` | `library:id` | `__manual__`. */
function getWpsSelectValueForLibrary(wpsRaw, libraryWpsEntries) {
  const trimmed = (wpsRaw || "").trim();
  if (!trimmed) return "__none__";
  const matches = findWpsLibraryEntriesMatchingUserText(libraryWpsEntries, trimmed).filter((e) =>
    isWpsLibraryEntryRegisteredForDropdown(e)
  );
  if (matches.length >= 1) {
    const pick = [...matches].sort((a, b) => (a.id || "").localeCompare(b.id || ""))[0];
    return `library:${pick.id}`;
  }
  return "__manual__";
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
 * @property {object} [lines] — lines, spools, onSaveLines, onSaveSpools, appMode
 * @property {object} [spools] — spools, parts, lines, spoolMarkers, weldPoints, weldStatusByWeldId, getWeldName, onSave, onAssignWeldToSpool, onAssignPartToSpool, appMode
 * @property {object} [welds] — project-wide weld table: weldPoints, weldStatusByWeldId, getWeldName, spools, parts, lines, personnel, wpsLibrary, electrodeLibrary, drawingSettings, ndtAutoLabel, appMode, onSave, onDelete, onUpdatePartHeat
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
  materialCertificates = [],
  ndtReports = [],
  ndtRequests = [],
  lines = [],
  spools = [],
  parts = [],
  drawings = [],
  weldPoints = [],
  onSave,
  /** When set, tree includes Drawings / Systems & lines / Spools / Welds with full-project editors */
  structureIntegration = null,
  /** Settings → WPS: jump to weld on canvas (switches drawing/page when needed) */
  onSelectWeldFromSettings = null,
}) {
  const [activeSection, setActiveSection] = useState("project-info");
  /** Isolated weld picker state for Settings → Structure → Welds (avoid coupling to main canvas selection). */
  const [settingsWeldFormWeld, setSettingsWeldFormWeld] = useState(null);
  const [settingsWeldSelectedId, setSettingsWeldSelectedId] = useState(null);

  // Default NDT state
  const [ndtRequirements, setNdtRequirements] = useState([]);
  const [weldingSpec, setWeldingSpec] = useState("");
  const [defaultWps, setDefaultWps] = useState("");

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
  const wpsUploadInputRef = useRef(null);
  const wpsUploadTargetRef = useRef(null);
  /** Avoid resetting Personnel sidebar when parent props refresh while modal stays open (e.g. auto-save). */
  const parametersModalWasOpenRef = useRef(false);

  const fitters = personnel.fitters || [];
  const welders = personnel.welders || [];
  const wqrs = personnel.wqrs || [];
  const wqrDocuments = (documents || []).filter((doc) => doc?.category === "wqr");
  const wpsDocuments = (documents || []).filter((doc) => doc?.category === "wps");
  const safeElectrodeLibrary = Array.isArray(electrodeLibrary) ? electrodeLibrary : [];
  const safeLines = Array.isArray(lines) ? lines : [];

  const libraryWpsEntries = useMemo(
    () => (Array.isArray(projectWpsLibrary) ? projectWpsLibrary : []),
    [projectWpsLibrary]
  );
  const libraryWpsRows = useMemo(() => {
    return libraryWpsEntries
      .map((entry) => ({ entry, effective: getWpsLibraryEntryEffectiveCode(entry) }))
      .filter((row) => row.effective && isWpsLibraryEntryRegisteredForDropdown(row.entry))
      .sort((a, b) => a.effective.localeCompare(b.effective));
  }, [libraryWpsEntries]);

  function getSystemWpsSelectValue(wpsRaw) {
    return getWpsSelectValueForLibrary(wpsRaw, libraryWpsEntries);
  }

  const projectDefaultWpsSelectValue = useMemo(
    () => getWpsSelectValueForLibrary(defaultWps, libraryWpsEntries),
    [defaultWps, libraryWpsEntries]
  );

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
      setDefaultWps(typeof settings.defaultWps === "string" ? settings.defaultWps : "");
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
      setActiveSection("project-info");
      setSettingsWeldFormWeld(null);
      setSettingsWeldSelectedId(null);
    }
  }, [settings, isOpen, projectMeta, systems, wpsLibrary]);

  useEffect(() => {
    if (activeSection !== "welds" || !isOpen) {
      setSettingsWeldFormWeld(null);
      setSettingsWeldSelectedId(null);
    }
  }, [activeSection, isOpen]);

  function pushProjectSave(overrides = {}) {
    onSave?.({
      drawingSettings: { ndtRequirements, weldingSpec, defaultWps },
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

  /** Reassign WQR to another welder (single owner in UI). */
  function handleMoveWqrToWelder(wqrId, targetWelderId) {
    if (!wqrId || !targetWelderId) return;
    const nextWelders = welders.map((w) => ({
      ...w,
      wqrIds: (w.wqrIds || []).filter((id) => id !== wqrId),
    }));
    const nextWelders2 = nextWelders.map((w) =>
      w.id === targetWelderId
        ? { ...w, wqrIds: [...new Set([...(w.wqrIds || []), wqrId])] }
        : w
    );
    pushProjectSave({
      personnel: {
        ...personnel,
        welders: nextWelders2,
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
      drawingSettings: { ndtRequirements, weldingSpec, defaultWps },
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

  function handlePersistNdtRequests({ ndtRequests: nextRequests }) {
    onSave?.({
      drawingSettings: { ndtRequirements, weldingSpec, defaultWps },
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
      ndtRequests: nextRequests,
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
        wpsOverridesProject: false,
        ndtOverridesProject: false,
        ndtRequirements: [],
      },
    ];
    setProjectSystems(nextSystems);
    onSave?.({
      drawingSettings: { ndtRequirements, weldingSpec, defaultWps },
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
      drawingSettings: { ndtRequirements, weldingSpec, defaultWps },
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

  function handleSystemWpsSelectChange(systemId, e) {
    const v = e.target.value;
    if (v === "__none__") {
      handleUpdateSystem(systemId, { wps: "" });
      return;
    }
    if (v.startsWith("library:")) {
      const entryId = v.slice("library:".length);
      const entry = libraryWpsEntries.find((x) => x.id === entryId);
      if (!entry) return;
      handleUpdateSystem(systemId, { wps: getWpsLibraryEntryEffectiveCode(entry) });
      return;
    }
    if (v === "__manual__") return;
  }

  function handleProjectDefaultWpsSelectChange(e) {
    const v = e.target.value;
    if (v === "__none__") {
      setDefaultWps("");
      return;
    }
    if (v.startsWith("library:")) {
      const entryId = v.slice("library:".length);
      const entry = libraryWpsEntries.find((x) => x.id === entryId);
      if (!entry) return;
      setDefaultWps(getWpsLibraryEntryEffectiveCode(entry));
      return;
    }
    if (v === "__manual__") return;
  }

  function handleAddWps(initial) {
    const init = initial && typeof initial === "object" ? initial : {};
    let codeFromInit = typeof init.code === "string" ? init.code.trim().toUpperCase() : "";
    const titleFromInit = typeof init.title === "string" ? init.title.trim() : "";
    // Blank rows are excluded from the registered table (see isWpsLibraryEntryRegisteredForDropdown in wps-resolution).
    if (!codeFromInit) {
      codeFromInit = `WPS-${Date.now().toString(36).toUpperCase()}`;
    }
    const nextWpsLibrary = [
      ...projectWpsLibrary,
      {
        id: generateId(),
        code: codeFromInit,
        title: titleFromInit,
        description: "",
        documentId: null,
      },
    ];
    setProjectWpsLibrary(nextWpsLibrary);
    onSave?.({
      drawingSettings: { ndtRequirements, weldingSpec, defaultWps },
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
      drawingSettings: { ndtRequirements, weldingSpec, defaultWps },
      personnel,
      systems: projectSystems,
      wpsLibrary: nextWpsLibrary,
      electrodeLibrary: safeElectrodeLibrary,
    });
  }

  function handleUpdateWps(wpsId, updates) {
    const nextWpsLibrary = projectWpsLibrary.map((entry) => {
      if (entry.id !== wpsId) return entry;
      const merged = { ...entry, ...updates };
      if ((merged.code || "").trim() || merged.documentId) return { ...merged, weldSyncAuto: false };
      return merged;
    });
    setProjectWpsLibrary(nextWpsLibrary);
  }

  async function handleUploadWpsDocument(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    const resolvedId = wpsUploadTargetRef.current;
    if (!file || !resolvedId) return;
    const entry = projectWpsLibrary.find((item) => item.id === resolvedId);
    if (!entry) return;
    const newDoc = await uploadLinkedDocument(file, "wps", "WPS");
    const nextWpsLibrary = projectWpsLibrary.map((e) =>
      e.id === resolvedId ? { ...e, documentId: newDoc.id, weldSyncAuto: false } : e
    );
    setProjectWpsLibrary(nextWpsLibrary);
    onSave?.({
      drawingSettings: { ndtRequirements, weldingSpec, defaultWps },
      personnel,
      systems: projectSystems,
      projectMeta: {
        projectName: metaProjectName,
        client: metaClient,
        spec: metaSpec,
        revision: metaRevision,
        date: metaDate,
      },
      wpsLibrary: nextWpsLibrary,
      electrodeLibrary: safeElectrodeLibrary,
      documents: [...(documents || []), newDoc],
    });
    wpsUploadTargetRef.current = null;
  }

  async function uploadLinkedDocument(file, category, fallbackTitle) {
    const base64 = await fileToBase64(file);
    return {
      id: generateId(),
      title: file.name || fallbackTitle || "",
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
      drawingSettings: { ndtRequirements, weldingSpec, defaultWps },
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
      title: file.name || `${heat} MTC`,
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
      drawingSettings: { ndtRequirements, weldingSpec, defaultWps },
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

  /** MTC PDF without a heat — listed in Material certificates §1 until assigned to a heat. */
  async function handleUploadOrphanMtcPdf(file) {
    if (!file) return;
    const base64 = await fileToBase64(file);
    const newDoc = {
      id: generateId(),
      title: file.name || "MTC",
      category: "mtc",
      fileName: file.name || "mtc.pdf",
      mimeType: file.type || "application/pdf",
      base64,
      createdAt: new Date().toISOString(),
    };
    onSave?.({
      drawingSettings: { ndtRequirements, weldingSpec, defaultWps },
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
      documents: [...(documents || []), newDoc],
    });
  }

  const autoSaveTimeoutRef = useRef(null);
  useEffect(() => {
    if (!isOpen) return;
    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    autoSaveTimeoutRef.current = setTimeout(() => {
      const elib = Array.isArray(electrodeLibrary) ? electrodeLibrary : [];
      onSave?.({
        drawingSettings: { ndtRequirements, weldingSpec, defaultWps },
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
  }, [isOpen, ndtRequirements, weldingSpec, defaultWps, personnel, projectSettings, metaProjectName, metaClient, metaSpec, metaRevision, metaDate, projectSystems, projectWpsLibrary, electrodeLibrary, onSave]);

  if (!isOpen) return null;

  const structureItems = [
    { key: "systems", label: "Systems" },
    ...(structureIntegration?.drawings ? [{ key: "drawings", label: "Drawings" }] : []),
    ...(structureIntegration?.lines ? [{ key: "lines", label: "Systems & lines" }] : []),
    ...(structureIntegration?.spools ? [{ key: "spools", label: "Spools" }] : []),
    ...(structureIntegration?.welds ? [{ key: "welds", label: "Welds" }] : []),
  ];

  const navGroups = [
    {
      label: "PROJECT",
      items: [
        { key: "project-info", label: "Project info" },
        { key: "itp", label: "ITP" },
      ],
    },
    {
      label: "STRUCTURE",
      items: structureItems,
    },
    {
      label: "WELDING",
      items: [
        { type: "heading", label: "General" },
        { key: "wps", label: "WPS" },
        { type: "heading", label: "Fit-up" },
        { key: "personnel-fitters", label: "Fitter personnel" },
        { key: "materials", label: "Material register" },
        { type: "heading", label: "Welding" },
        { key: "personnel-welders", label: "Welder personnel & WQR" },
        { key: "electrodes", label: "Electrode register" },
        { type: "heading", label: "Inspection" },
        { key: "ndt-requests", label: "NDT requests" },
        { key: "ndt-reports", label: "NDT reports" },
        { key: "ndt-personnel-docs", label: "NDT personnel" },
        { key: "ndt-calibration-docs", label: "NDT calibration" },
      ],
    },
    {
      label: "OTHER",
      items: [
        { key: "painting-reports", label: "Paint report" },
        { key: "release-qc", label: "Release QC report" },
      ],
    },
  ];

  return (
    <dialog open={isOpen} className="modal modal-open">
      <div className="modal-box w-full min-w-80 max-w-6xl max-h-[90vh] flex flex-col p-0 sm:p-6 gap-0 overflow-hidden">
        <div className="px-4 pt-4 sm:px-0 sm:pt-0 shrink-0">
          <h3 className="font-bold text-lg">Settings</h3>
          <p className="text-xs text-base-content/60 mt-1">Project info, structure, welding, and documents</p>
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
                <div className="flex md:flex-col gap-0.5">
                  {group.items.map((item) =>
                    item.type === "heading" ? (
                      <p
                        key={`${group.label}-${item.label}`}
                        className="block text-[9px] font-semibold uppercase tracking-wide text-base-content/40 px-1 pt-1.5 pb-0"
                      >
                        {item.label}
                      </p>
                    ) : (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setActiveSection(item.key)}
                        className={`btn btn-xs justify-start font-normal whitespace-nowrap md:w-full h-8 min-h-8 flex-shrink-0 ${
                          activeSection === item.key ? "btn-primary" : "btn-ghost"
                        }`}
                      >
                        {item.label}
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </nav>

          <div className="flex-1 min-h-0 min-w-0 overflow-y-auto px-4 pb-4 md:px-0 md:pr-1">
        {activeSection === "personnel-fitters" && (
          <div className="mt-2 md:mt-0 space-y-4">
            <SettingsPersonnelRegistry
              variant="fitters"
              fitters={fitters}
              welders={welders}
              wqrs={wqrs}
              wqrDocuments={wqrDocuments}
              weldPoints={weldPoints}
              systems={projectSystems}
              lines={lines}
              spools={spools}
              wpsLibrary={projectWpsLibrary}
              drawingSettings={{ ndtRequirements, weldingSpec, defaultWps }}
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
              onMoveWqrToWelder={handleMoveWqrToWelder}
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

        {activeSection === "personnel-welders" && (
          <div className="mt-2 md:mt-0 space-y-4">
            <SettingsPersonnelRegistry
              variant="welders-wqr"
              fitters={fitters}
              welders={welders}
              wqrs={wqrs}
              wqrDocuments={wqrDocuments}
              weldPoints={weldPoints}
              systems={projectSystems}
              lines={lines}
              spools={spools}
              wpsLibrary={projectWpsLibrary}
              drawingSettings={{ ndtRequirements, weldingSpec, defaultWps }}
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
              onMoveWqrToWelder={handleMoveWqrToWelder}
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

            <div className="border border-base-300 rounded-lg p-3 bg-base-200/30 space-y-2">
              <div className="flex flex-wrap items-start justify-end gap-2">
                <NdtInheritanceHelpModal />
              </div>
              <NdtRequirementsOverrideTable
                variant="default"
                scope="project"
                title="Project NDT defaults"
                hint="Base sampling when NDT on the weld is Auto. Optional system and line overrides are under Settings → Project info → Systems (line wins over system over project)."
                rows={ndtRequirements}
                onChange={setNdtRequirements}
              />
            </div>
            <div className="form-control">
              <label className="label py-0" htmlFor="settings-welding-spec">
                <span className="label-text text-xs">Welding spec (reference)</span>
              </label>
              <input
                id="settings-welding-spec"
                type="text"
                className="input input-bordered input-xs w-full max-w-xl"
                value={weldingSpec}
                onChange={(e) => setWeldingSpec(e.target.value)}
                placeholder="e.g. Company WPS index, ASME IX — optional note for exports"
              />
            </div>
            <div className="form-control">
              <label className="label py-0" htmlFor="settings-default-wps">
                <span className="label-text text-xs">Default WPS (project)</span>
              </label>
              <div className="flex flex-col gap-2 max-w-xl">
                <select
                  id="settings-default-wps"
                  className="select select-bordered select-xs w-full min-w-0"
                  value={projectDefaultWpsSelectValue}
                  onChange={handleProjectDefaultWpsSelectChange}
                  aria-describedby={
                    projectDefaultWpsSelectValue === "__manual__"
                      ? "settings-default-wps-manual-hint"
                      : undefined
                  }
                >
                  <option value="__none__">None (no project default)</option>
                  {libraryWpsRows.length > 0 && (
                    <optgroup label="Registered WPS">
                      {libraryWpsRows.map(({ entry, effective }) => (
                        <option key={entry.id} value={`library:${entry.id}`}>
                          {effective}
                          {(entry.description || "").trim()
                            ? ` — ${(entry.description || "").trim().slice(0, 48)}${(entry.description || "").trim().length > 48 ? "…" : ""}`
                            : ""}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <option value="__manual__">Other (manual entry)…</option>
                </select>
                {projectDefaultWpsSelectValue === "__manual__" && (
                  <>
                    <input
                      id="settings-default-wps-manual"
                      type="text"
                      className="input input-bordered input-xs w-full min-w-0"
                      value={defaultWps}
                      onChange={(e) => setDefaultWps(e.target.value)}
                      placeholder="Type a WPS name or code"
                      autoComplete="off"
                    />
                    <p id="settings-default-wps-manual-hint" className="text-xs text-base-content/50">
                      Register WPS rows under Settings → Project info & libraries → WPS to pick them from the list
                      above.
                    </p>
                  </>
                )}
              </div>
              <p className="text-xs text-base-content/60 mt-1">
                Optional — inherited by welds when systems/lines do not override
              </p>
            </div>

            <div className="modal-action mt-4">
              <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
            </div>
          </div>
        )}

        {activeSection === "systems" && (
          <div className="mt-2 md:mt-0 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="text-sm text-base-content/70 flex-1 min-w-0">
                Systems group lines and inherit default WPS / NDT settings. Line default WPS and line NDT overrides are
                edited in the workspace <strong>Lines</strong> panel.
              </p>
              <NdtInheritanceHelpModal />
            </div>
            <div className="flex justify-end">
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleAddSystem}>
                + Add system
              </button>
            </div>
            <ul className="space-y-2">
              {projectSystems.map((system) => {
                const systemWpsSelect = getSystemWpsSelectValue(system.wps);
                const sysNdtOverride =
                  system.ndtOverridesProject === true ||
                  (system.ndtOverridesProject === false
                    ? false
                    : (Array.isArray(system.ndtRequirements) ? system.ndtRequirements.length > 0 : false));
                const sysWpsOverride =
                  system.wpsOverridesProject === true ||
                  (system.wpsOverridesProject === false ? false : !!(system.wps || "").trim());
                return (
                <li
                  key={system.id}
                  className="border border-base-300 rounded-lg p-3 bg-base-200/30 space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">System name</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered input-xs"
                        value={system.name || ""}
                        onChange={(e) => handleUpdateSystem(system.id, { name: e.target.value })}
                        placeholder="e.g. Main process"
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Description</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered input-xs"
                        value={system.description || ""}
                        onChange={(e) => handleUpdateSystem(system.id, { description: e.target.value })}
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                  <div className="form-control space-y-2">
                    <label className="label py-0 cursor-pointer justify-start gap-2">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-xs"
                        checked={sysWpsOverride}
                        onChange={(e) =>
                          handleUpdateSystem(system.id, { wpsOverridesProject: e.target.checked })
                        }
                      />
                      <span className="label-text text-xs">Override project default WPS</span>
                    </label>
                    {!sysWpsOverride ? (
                      <div className="rounded-lg border border-base-300 bg-base-300/30 px-3 py-2 text-xs text-base-content/70">
                        <span className="font-medium text-base-content/50">Inherited from project: </span>
                        {defaultWps.trim() ? defaultWps.trim() : "— (none set above)"}
                      </div>
                    ) : (
                      <>
                        <label className="label py-0" htmlFor={`system-default-wps-select-${system.id}`}>
                          <span className="label-text text-xs">Default WPS (inherited by lines & welds)</span>
                        </label>
                        <div className="flex flex-col gap-2">
                          <select
                            id={`system-default-wps-select-${system.id}`}
                            className="select select-bordered select-xs w-full min-w-0"
                            value={systemWpsSelect}
                            onChange={(e) => handleSystemWpsSelectChange(system.id, e)}
                            aria-describedby={
                              systemWpsSelect === "__manual__"
                                ? `system-default-wps-manual-hint-${system.id}`
                                : undefined
                            }
                          >
                            <option value="__none__">No system default</option>
                            {libraryWpsRows.length > 0 && (
                              <optgroup label="Registered WPS">
                                {libraryWpsRows.map(({ entry, effective }) => (
                                  <option key={entry.id} value={`library:${entry.id}`}>
                                    {effective}
                                    {(entry.description || "").trim()
                                      ? ` — ${(entry.description || "").trim().slice(0, 48)}${(entry.description || "").trim().length > 48 ? "…" : ""}`
                                      : ""}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            <option value="__manual__">Other (manual entry)…</option>
                          </select>
                          {systemWpsSelect === "__manual__" && (
                            <>
                              <input
                                id={`system-default-wps-manual-${system.id}`}
                                type="text"
                                className="input input-bordered input-xs w-full min-w-0"
                                value={system.wps || ""}
                                onChange={(e) => handleUpdateSystem(system.id, { wps: e.target.value })}
                                placeholder="Type a WPS name or code"
                                autoComplete="off"
                              />
                              <p id={`system-default-wps-manual-hint-${system.id}`} className="text-xs text-base-content/50">
                                Lines can override. Register WPS rows under Settings → Project info & libraries → WPS to pick
                                them here.
                              </p>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="label py-0 cursor-pointer justify-start gap-2 min-h-0">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-xs"
                        checked={sysNdtOverride}
                        onChange={(e) =>
                          handleUpdateSystem(system.id, { ndtOverridesProject: e.target.checked })
                        }
                      />
                      <span className="label-text text-xs">Override project NDT defaults</span>
                    </label>
                    {!sysNdtOverride ? (
                      <NdtRequirementsOverrideTable
                        variant="compact"
                        scope="override"
                        title="NDT (inherited)"
                        readOnly
                        readOnlyCaption="Inherited from project — enable override above to edit"
                        rows={ndtRequirements}
                        onChange={() => {}}
                      />
                    ) : (
                      <NdtRequirementsOverrideTable
                        variant="compact"
                        scope="override"
                        title="NDT overrides (optional)"
                        hint="Per-method % for this system. Merges with project defaults; line-level overrides win over system for welds on that line."
                        rows={Array.isArray(system.ndtRequirements) ? system.ndtRequirements : []}
                        onChange={(nextReqs) => handleUpdateSystem(system.id, { ndtRequirements: nextReqs })}
                      />
                    )}
                  </div>
                  {safeLines.some((ln) => ln.systemId === system.id) ? (
                    <div className="space-y-2 border-t border-base-300/50 pt-2">
                      <p className="text-[11px] font-medium text-base-content/85">Lines on this system</p>
                      <ul className="space-y-1">
                        {safeLines
                          .filter((ln) => ln.systemId === system.id)
                          .map((line) => (
                            <li
                              key={line.id}
                              className="text-xs text-base-content/90 truncate rounded-md border border-base-300/70 bg-base-100/60 px-2 py-1.5"
                              title={line.name || ""}
                            >
                              {line.name?.trim() || "Unnamed line"}
                            </li>
                          ))}
                      </ul>
                      <p className="text-[10px] text-base-content/50 leading-snug">
                        Edit line WPS and NDT in the workspace Lines panel.
                      </p>
                    </div>
                  ) : null}
                  <div className="flex justify-end">
                    <button type="button" className="btn btn-ghost btn-xs text-error" onClick={() => handleRemoveSystem(system.id)}>
                      Remove
                    </button>
                  </div>
                </li>
                );
              })}
            </ul>
            {safeLines.some((ln) => !ln.systemId) ? (
              <div className="border border-base-300 rounded-lg p-3 bg-base-200/40 space-y-2">
                <p className="text-xs font-semibold text-base-content/90">Lines not assigned to a system</p>
                <ul className="space-y-1">
                  {safeLines
                    .filter((ln) => !ln.systemId)
                    .map((line) => (
                      <li
                        key={line.id}
                        className="text-xs text-base-content/90 truncate rounded-md border border-base-300/70 bg-base-100/60 px-2 py-1.5"
                        title={line.name || ""}
                      >
                        {line.name?.trim() || "Unnamed line"}
                      </li>
                    ))}
                </ul>
                <p className="text-[10px] text-base-content/50 leading-snug">
                  Edit line WPS and NDT in the workspace Lines panel.
                </p>
              </div>
            ) : null}
            {projectSystems.length === 0 && <p className="text-sm text-base-content/50">No systems yet.</p>}
            <div className="modal-action mt-4">
              <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
            </div>
          </div>
        )}

        {activeSection === "wps" && (
          <div className="mt-2 md:mt-0 space-y-3">
            <SettingsWpsRegistry
              wpsLibrary={projectWpsLibrary}
              weldPoints={weldPoints}
              personnel={personnel}
              wpsDocuments={wpsDocuments}
              drawings={drawings}
              systems={projectSystems}
              lines={lines}
              spools={spools}
              drawingSettings={{ ndtRequirements, weldingSpec, defaultWps }}
              onAddWps={handleAddWps}
              onUpdateWps={handleUpdateWps}
              onRemoveWps={handleRemoveWps}
              onSelectWeld={onSelectWeldFromSettings}
              onRequestWpsUpload={(wpsId) => {
                wpsUploadTargetRef.current = wpsId;
                wpsUploadInputRef.current?.click();
              }}
            />
            <input
              ref={wpsUploadInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={handleUploadWpsDocument}
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
              weldPoints={weldPoints}
              onSave={(payload) => {
                onSave?.({
                  drawingSettings: { ndtRequirements, weldingSpec, defaultWps },
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
                  drawingSettings: { ndtRequirements, weldingSpec, defaultWps },
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
              onUploadOrphanMtcPdf={handleUploadOrphanMtcPdf}
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

        {activeSection === "ndt-requests" && (
          <div className="mt-2 md:mt-0 space-y-3">
            <SettingsNdtRequestsRegistry
              ndtRequests={ndtRequests}
              ndtReports={ndtReports}
              weldPoints={weldPoints}
              drawingSettings={settings}
              getWeldName={(w) => getWeldName(w, weldPoints)}
              onPersist={handlePersistNdtRequests}
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

        {activeSection === "ndt-personnel-docs" && (
          <div className="mt-2 md:mt-0 space-y-3">
            <SettingsDocumentCategoryRegistry
              category="ndt_qualification"
              documents={documents}
              onUpdateDocument={handleUpdateVaultDocument}
              onRemoveDocument={handleRemoveVaultDocument}
              onAddDocumentFromFile={(file) => handleAddVaultDocument("ndt_qualification", file)}
            />
            <div className="modal-action mt-4">
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        )}

        {activeSection === "ndt-calibration-docs" && (
          <div className="mt-2 md:mt-0 space-y-3">
            <SettingsDocumentCategoryRegistry
              category="ndt_calibration"
              documents={documents}
              onUpdateDocument={handleUpdateVaultDocument}
              onRemoveDocument={handleRemoveVaultDocument}
              onAddDocumentFromFile={(file) => handleAddVaultDocument("ndt_calibration", file)}
            />
            <div className="modal-action mt-4">
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        )}

        {activeSection === "release-qc" && (
          <div className="mt-2 md:mt-0 space-y-3">
            <SettingsDocumentCategoryRegistry
              category="final_release"
              documents={documents}
              onUpdateDocument={handleUpdateVaultDocument}
              onRemoveDocument={handleRemoveVaultDocument}
              onAddDocumentFromFile={(file) => handleAddVaultDocument("final_release", file)}
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

        {structureIntegration?.welds && activeSection === "welds" && (
          <div className="mt-2 md:mt-0 min-h-[min(70vh,520px)] flex flex-col border border-base-300 rounded-lg overflow-hidden bg-base-100">
            <SidePanelWeldForm
              hideHeader
              isOpen
              onToggle={() => {}}
              weldPoints={structureIntegration.welds.weldPoints}
              weld={settingsWeldFormWeld}
              selectedWeldId={settingsWeldSelectedId}
              onSelectWeld={(w) => {
                setSettingsWeldFormWeld(w);
                setSettingsWeldSelectedId(w?.id ?? null);
              }}
              onBackToList={() => {
                setSettingsWeldFormWeld(null);
                setSettingsWeldSelectedId(null);
              }}
              onSave={structureIntegration.welds.onSave}
              onDelete={structureIntegration.welds.onDelete}
              appMode={structureIntegration.welds.appMode}
              spools={structureIntegration.welds.spools}
              parts={structureIntegration.welds.parts}
              onUpdatePartHeat={structureIntegration.welds.onUpdatePartHeat}
              personnel={structureIntegration.welds.personnel}
              wpsLibrary={structureIntegration.welds.wpsLibrary}
              electrodeLibrary={structureIntegration.welds.electrodeLibrary}
              ndtAutoLabel={structureIntegration.welds.ndtAutoLabel}
              drawingSettings={structureIntegration.welds.drawingSettings}
              weldStatusByWeldId={structureIntegration.welds.weldStatusByWeldId}
              getWeldName={structureIntegration.welds.getWeldName}
            />
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
