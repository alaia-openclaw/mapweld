"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import {
  DATABOOK_SECTIONS,
  createDefaultDatabookConfig,
  normalizeDatabookConfig,
  buildDatabookValidationWithContext,
} from "@/lib/databook-sections";

const DOCUMENT_CATEGORIES = [
  { id: "itp", label: "ITP" },
  { id: "wqr", label: "Welder qualification (WQR)" },
  { id: "wps", label: "WPS" },
  { id: "mtc", label: "Material certificate (MTC)" },
  { id: "electrode", label: "Electrode register" },
  { id: "ndt_qualification", label: "NDT qualification" },
  { id: "ndt_calibration", label: "NDT calibration" },
  { id: "painting_report", label: "Painting report" },
  { id: "final_release", label: "Final release / QC approval" },
  { id: "ndt_report_attachment", label: "NDT report attachment" },
  { id: "other", label: "Other" },
];

function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      const base64 = typeof result === "string" ? result.replace(/^data:.*?;base64,/, "") : "";
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getCategoryLabel(category) {
  return DOCUMENT_CATEGORIES.find((item) => item.id === category)?.label || category || "Uncategorized";
}

function getNdtAttachmentDocuments(ndtReports = []) {
  return (ndtReports || []).flatMap((report) => {
    const reportDate = report?.reportDate || "NDT";
    const method = report?.method || "NDT";
    return (report?.attachments || [])
      .filter((attachment) => attachment?.base64)
      .map((attachment) => ({
        id: `ndt-att-${report.id || "report"}-${attachment.id || attachment.name || Math.random().toString(36).slice(2, 7)}`,
        title: attachment.name?.replace(/\.pdf$/i, "") || `${method} ${reportDate}`,
        category: "ndt_report_attachment",
        fileName: attachment.name || `${method}-${reportDate}.pdf`,
        mimeType: "application/pdf",
        base64: attachment.base64,
        createdAt: report?.createdAt || new Date().toISOString(),
        isReadOnlyFromNdt: true,
      }));
  });
}

function ModalDatabookBuilder({
  isOpen,
  onClose,
  documents = [],
  databookConfig = null,
  weldPoints = [],
  parts = [],
  personnel = { welders: [], wqrs: [] },
  wpsLibrary = [],
  materialCertificates = [],
  ndtReports = [],
  onSaveDocuments,
  onSaveDatabookConfig,
}) {
  const [activeTab, setActiveTab] = useState("sections");
  const [localDocuments, setLocalDocuments] = useState([]);
  const [localConfig, setLocalConfig] = useState(createDefaultDatabookConfig());
  const [uploadCategory, setUploadCategory] = useState("other");
  const [uploadTitle, setUploadTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [sectionUploadTarget, setSectionUploadTarget] = useState(null);
  const [sectionFilter, setSectionFilter] = useState("all");
  const [vaultCategoryFilter, setVaultCategoryFilter] = useState("all");

  useEffect(() => {
    if (!isOpen) return;
    const providedDocuments = Array.isArray(documents) ? documents : [];
    const ndtAttachmentDocuments = getNdtAttachmentDocuments(ndtReports);
    const mergedById = new Map();
    [...providedDocuments, ...ndtAttachmentDocuments].forEach((doc) => {
      if (!doc?.id) return;
      mergedById.set(doc.id, doc);
    });
    setLocalDocuments([...mergedById.values()]);
    setLocalConfig(normalizeDatabookConfig(databookConfig));
    setUploadCategory("other");
    setUploadTitle("");
    setActiveTab("sections");
    setSectionUploadTarget(null);
    setSectionFilter("all");
    setVaultCategoryFilter("all");
  }, [isOpen, documents, databookConfig, ndtReports]);

  const validation = useMemo(
    () =>
      buildDatabookValidationWithContext({
        documents: localDocuments,
        databookConfig: localConfig,
        weldPoints,
        parts,
        personnel,
        wpsLibrary,
        materialCertificates,
        ndtReports,
      }),
    [localDocuments, localConfig, weldPoints, parts, personnel, wpsLibrary, materialCertificates, ndtReports]
  );

  const documentsByCategory = useMemo(() => {
    const map = new Map();
    localDocuments.forEach((doc) => {
      const category = doc?.category || "other";
      if (!map.has(category)) map.set(category, []);
      map.get(category).push(doc);
    });
    return map;
  }, [localDocuments]);

  const filteredSections = useMemo(() => {
    return localConfig.sectionOrder.filter((sectionId) => {
      if (sectionFilter === "all") return true;
      const section = DATABOOK_SECTIONS.find((item) => item.id === sectionId);
      if (!section) return false;
      if (sectionFilter === "required_missing") {
        const sectionState = validation.sections.find((item) => item.id === section.id);
        return section.required && !(sectionState?.ready);
      }
      return section.type === sectionFilter;
    });
  }, [localConfig.sectionOrder, sectionFilter, validation.sections]);

  const filteredVaultDocuments = useMemo(() => {
    const sorted = localDocuments
      .slice()
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    if (vaultCategoryFilter === "all") return sorted;
    return sorted.filter((doc) => doc.category === vaultCategoryFilter);
  }, [localDocuments, vaultCategoryFilter]);

  const setSectionIncluded = useCallback((sectionId, included) => {
    setLocalConfig((prev) => {
      const currentIncluded = new Set(prev.includedSectionIds || []);
      if (included) currentIncluded.add(sectionId);
      else currentIncluded.delete(sectionId);
      return { ...prev, includedSectionIds: prev.sectionOrder.filter((id) => currentIncluded.has(id)) };
    });
  }, []);

  const moveSection = useCallback((sectionId, direction) => {
    setLocalConfig((prev) => {
      const order = [...(prev.sectionOrder || [])];
      const currentIndex = order.indexOf(sectionId);
      if (currentIndex < 0) return prev;
      const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (nextIndex < 0 || nextIndex >= order.length) return prev;
      const temp = order[currentIndex];
      order[currentIndex] = order[nextIndex];
      order[nextIndex] = temp;
      const includedSet = new Set(prev.includedSectionIds || []);
      return {
        ...prev,
        sectionOrder: order,
        includedSectionIds: order.filter((id) => includedSet.has(id)),
      };
    });
  }, []);

  const linkSectionDocument = useCallback((sectionId, documentId) => {
    setLocalConfig((prev) => ({
      ...prev,
      sectionDocumentIds: {
        ...(prev.sectionDocumentIds || {}),
        [sectionId]: documentId || undefined,
      },
    }));
  }, []);

  const handleUploadFiles = useCallback(async (event) => {
    const files = event.target.files;
    if (!files?.length) return;
    setIsUploading(true);
    try {
      const uploads = await Promise.all(
        Array.from(files).map(async (file) => ({
          id: generateId("doc"),
          title: uploadTitle.trim() || file.name.replace(/\.pdf$/i, ""),
          category: uploadCategory,
          fileName: file.name,
          mimeType: file.type || "application/pdf",
          base64: await fileToBase64(file),
          createdAt: new Date().toISOString(),
        }))
      );
      setLocalDocuments((prev) => [...prev, ...uploads]);
      setLocalConfig((prev) => {
        const sectionDocumentIds = { ...(prev.sectionDocumentIds || {}) };
        DATABOOK_SECTIONS.filter((section) => section.type === "uploaded").forEach((section) => {
          const relevant = uploads.filter((doc) => doc.category === section.documentCategory);
          if (relevant.length === 0) return;
          const latest = relevant[relevant.length - 1];
          sectionDocumentIds[section.id] = latest.id;
        });
        return { ...prev, sectionDocumentIds };
      });
      setUploadTitle("");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }, [uploadCategory, uploadTitle]);

  function removeDocument(documentId) {
    const doc = localDocuments.find((item) => item.id === documentId);
    if (doc?.isReadOnlyFromNdt) return;
    setLocalDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
    setLocalConfig((prev) => {
      const nextLinks = { ...(prev.sectionDocumentIds || {}) };
      Object.entries(nextLinks).forEach(([sectionId, linkedDocumentId]) => {
        if (linkedDocumentId === documentId) delete nextLinks[sectionId];
      });
      return { ...prev, sectionDocumentIds: nextLinks };
    });
  }

  const handleSectionUpload = useCallback(async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !sectionUploadTarget) return;
    const section = DATABOOK_SECTIONS.find((item) => item.id === sectionUploadTarget);
    if (!section?.documentCategory) return;
    const uploaded = {
      id: generateId("doc"),
      title: file.name.replace(/\.pdf$/i, ""),
      category: section.documentCategory,
      fileName: file.name,
      mimeType: file.type || "application/pdf",
      base64: await fileToBase64(file),
      createdAt: new Date().toISOString(),
    };
    setLocalDocuments((prev) => [...prev, uploaded]);
    setLocalConfig((prev) => ({
      ...prev,
      sectionDocumentIds: {
        ...(prev.sectionDocumentIds || {}),
        [section.id]: uploaded.id,
      },
    }));
  }, [sectionUploadTarget]);

  useEffect(() => {
    if (!isOpen) return;
    setLocalConfig((prev) => {
      const sectionDocumentIds = { ...(prev.sectionDocumentIds || {}) };
      let changed = false;
      DATABOOK_SECTIONS.filter((section) => section.type === "uploaded").forEach((section) => {
        const existing = sectionDocumentIds[section.id];
        const existingStillPresent = existing && localDocuments.some((doc) => doc.id === existing);
        if (existingStillPresent) return;
        const candidates = localDocuments.filter((doc) => doc.category === section.documentCategory);
        if (candidates.length === 0) {
          if (existing) {
            delete sectionDocumentIds[section.id];
            changed = true;
          }
          return;
        }
        const latest = candidates
          .slice()
          .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))[0];
        if (latest && latest.id !== existing) {
          sectionDocumentIds[section.id] = latest.id;
          changed = true;
        }
      });
      if (!changed) return prev;
      return { ...prev, sectionDocumentIds };
    });
  }, [isOpen, localDocuments]);

  function handleSave() {
    onSaveDocuments?.(localDocuments.filter((doc) => !doc?.isReadOnlyFromNdt));
    onSaveDatabookConfig?.(localConfig);
    onClose?.();
  }

  if (!isOpen) return null;

  return (
    <dialog open={isOpen} className="modal modal-open">
      <div className="modal-box w-full min-w-80 max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-lg">Databook Builder</h3>
            <p className="text-sm text-base-content/70 mt-1">
              Track required sections, link uploaded PDFs, and keep databook order consistent.
            </p>
          </div>
          <div className={`badge ${validation.isReady ? "badge-success" : "badge-warning"} badge-outline`}>
            {validation.isReady ? "Ready to generate" : `${validation.missingRequiredCount} required missing`}
          </div>
        </div>

        <div role="tablist" className="tabs tabs-boxed tabs-sm mt-4">
          <button
            type="button"
            role="tab"
            className={`tab ${activeTab === "sections" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("sections")}
          >
            Sections
          </button>
          <button
            type="button"
            role="tab"
            className={`tab ${activeTab === "documents" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("documents")}
          >
            Document Vault
          </button>
          <button
            type="button"
            role="tab"
            className={`tab ${activeTab === "meta" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("meta")}
          >
            Release Meta
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-auto mt-4 pr-1">
          {activeTab === "sections" && (
            <div className="grid grid-cols-1 md:grid-cols-[14rem_minmax(0,1fr)] gap-3">
              <aside className="border border-base-300 rounded-lg bg-base-100 p-2 h-fit">
                <p className="text-xs font-semibold uppercase tracking-wide text-base-content/60 px-1 py-1">
                  Section tree
                </p>
                <ul className="menu menu-sm">
                  <li><button type="button" className={sectionFilter === "all" ? "active" : ""} onClick={() => setSectionFilter("all")}>All sections</button></li>
                  <li><button type="button" className={sectionFilter === "required_missing" ? "active" : ""} onClick={() => setSectionFilter("required_missing")}>Required missing</button></li>
                  <li><button type="button" className={sectionFilter === "generated" ? "active" : ""} onClick={() => setSectionFilter("generated")}>Generated</button></li>
                  <li><button type="button" className={sectionFilter === "uploaded" ? "active" : ""} onClick={() => setSectionFilter("uploaded")}>Uploaded PDFs</button></li>
                  <li><button type="button" className={sectionFilter === "linked_documents" ? "active" : ""} onClick={() => setSectionFilter("linked_documents")}>Linked data docs</button></li>
                </ul>
              </aside>
              <div className="space-y-2">
              {filteredSections.map((sectionId) => {
                const section = DATABOOK_SECTIONS.find((item) => item.id === sectionId);
                if (!section) return null;
                const sectionState = validation.sections.find((item) => item.id === section.id);
                const isIncluded = localConfig.includedSectionIds.includes(section.id);
                const availableDocuments = section.documentCategory
                  ? (documentsByCategory.get(section.documentCategory) || [])
                  : [];
                const selectedDocId = localConfig.sectionDocumentIds?.[section.id] || "";
                const orderIndex = localConfig.sectionOrder.indexOf(sectionId);

                return (
                  <div key={section.id} className="border border-base-300 rounded-lg p-3 bg-base-100">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={isIncluded}
                        onChange={(e) => setSectionIncluded(section.id, e.target.checked)}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm">{section.title}</div>
                        <div className="text-xs text-base-content/60">
                          {section.required ? "Required" : "Optional"} · {section.type}
                        </div>
                      </div>
                      <div className={`badge badge-sm ${sectionState?.ready ? "badge-success" : "badge-warning"}`}>
                        {sectionState?.ready ? "Ready" : "Missing"}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs"
                          onClick={() => moveSection(section.id, "up")}
                          disabled={orderIndex <= 0}
                          aria-label="Move section up"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs"
                          onClick={() => moveSection(section.id, "down")}
                          disabled={orderIndex === localConfig.sectionOrder.length - 1}
                          aria-label="Move section down"
                        >
                          ↓
                        </button>
                      </div>
                    </div>

                    {section.type === "uploaded" && (
                      <div className="mt-2 pl-6">
                        <label className="label py-0">
                          <span className="label-text text-xs">Linked document</span>
                        </label>
                        <div className="flex gap-1">
                          <select
                            className="select select-bordered select-sm w-full"
                            value={selectedDocId}
                            onChange={(e) => linkSectionDocument(section.id, e.target.value)}
                            disabled={!isIncluded}
                          >
                            <option value="">Select PDF document…</option>
                            {availableDocuments.map((doc) => (
                              <option key={doc.id} value={doc.id}>
                                {doc.title || doc.fileName}
                              </option>
                            ))}
                          </select>
                          {!selectedDocId && (
                            <label className="btn btn-ghost btn-sm">
                              Load
                              <input
                                type="file"
                                accept=".pdf,application/pdf"
                                className="hidden"
                                onClick={() => setSectionUploadTarget(section.id)}
                                onChange={handleSectionUpload}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-base-content/60 mt-2 pl-6">
                      {sectionState?.message}
                    </p>
                  </div>
                );
              })}
              </div>
            </div>
          )}

          {activeTab === "documents" && (
            <div className="grid grid-cols-1 md:grid-cols-[14rem_minmax(0,1fr)] gap-3">
              <aside className="border border-base-300 rounded-lg bg-base-100 p-2 h-fit">
                <p className="text-xs font-semibold uppercase tracking-wide text-base-content/60 px-1 py-1">
                  Categories
                </p>
                <ul className="menu menu-sm">
                  <li>
                    <button
                      type="button"
                      className={vaultCategoryFilter === "all" ? "active" : ""}
                      onClick={() => setVaultCategoryFilter("all")}
                    >
                      All ({localDocuments.length})
                    </button>
                  </li>
                  {DOCUMENT_CATEGORIES.map((category) => {
                    const count = (documentsByCategory.get(category.id) || []).length;
                    return (
                      <li key={category.id}>
                        <button
                          type="button"
                          className={vaultCategoryFilter === category.id ? "active" : ""}
                          onClick={() => setVaultCategoryFilter(category.id)}
                        >
                          {category.label} ({count})
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </aside>
              <div className="space-y-4">
                <div className="border border-base-300 rounded-lg p-3 bg-base-100">
                  <h4 className="font-medium text-sm">Upload PDF documents</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                    <input
                      type="text"
                      className="input input-bordered input-sm"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      placeholder="Optional title override"
                    />
                    <select
                      className="select select-bordered select-sm"
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value)}
                    >
                      {DOCUMENT_CATEGORIES.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      multiple
                      className="file-input file-input-bordered file-input-sm w-full"
                      onChange={handleUploadFiles}
                      disabled={isUploading}
                    />
                  </div>
                  {isUploading && <p className="text-xs text-base-content/60 mt-2">Uploading…</p>}
                </div>

                {filteredVaultDocuments.length === 0 ? (
                  <p className="text-sm text-base-content/60">No documents in this category.</p>
                ) : (
                  <ul className="space-y-2">
                    {filteredVaultDocuments.map((doc) => (
                      <li key={doc.id} className="border border-base-300 rounded-lg p-3 bg-base-100">
                        <div className="flex items-center gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{doc.title || doc.fileName}</p>
                            <p className="text-xs text-base-content/60 truncate">
                              {getCategoryLabel(doc.category)} · {doc.fileName}
                            </p>
                          </div>
                          {doc.isReadOnlyFromNdt ? (
                            <span className="badge badge-ghost badge-sm">From NDT report</span>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs text-error"
                              onClick={() => removeDocument(doc.id)}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {activeTab === "meta" && (
            <div className="space-y-3 border border-base-300 rounded-lg p-3 bg-base-100">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <label className="label py-0">
                    <span className="label-text text-xs">Databook revision</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered input-sm w-full"
                    value={localConfig.revision || ""}
                    onChange={(e) => setLocalConfig((prev) => ({ ...prev, revision: e.target.value }))}
                    placeholder="e.g. Rev A"
                  />
                </div>
                <div>
                  <label className="label py-0">
                    <span className="label-text text-xs">Issued by</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered input-sm w-full"
                    value={localConfig.issuedBy || ""}
                    onChange={(e) => setLocalConfig((prev) => ({ ...prev, issuedBy: e.target.value }))}
                    placeholder="Name / role"
                  />
                </div>
                <div>
                  <label className="label py-0">
                    <span className="label-text text-xs">Issued date</span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered input-sm w-full"
                    value={localConfig.issuedAt || ""}
                    onChange={(e) => setLocalConfig((prev) => ({ ...prev, issuedAt: e.target.value }))}
                  />
                </div>
              </div>
              <p className="text-xs text-base-content/60">
                These metadata fields are saved with the project and used by the upcoming databook generation pipeline.
              </p>
            </div>
          )}
        </div>

        <div className="modal-action mt-4">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            Save databook setup
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={onClose} aria-label="Close">
          close
        </button>
      </form>
    </dialog>
  );
}

export default ModalDatabookBuilder;

