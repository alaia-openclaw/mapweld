"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import {
  DATABOOK_SECTIONS,
  createDefaultDatabookConfig,
  normalizeDatabookConfig,
  buildDatabookValidation,
} from "@/lib/databook-sections";

const DOCUMENT_CATEGORIES = [
  { id: "itp", label: "ITP" },
  { id: "wqr", label: "Welder qualification (WQR)" },
  { id: "wps", label: "WPS" },
  { id: "mtc", label: "Material certificate (MTC)" },
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

function ModalDatabookBuilder({
  isOpen,
  onClose,
  documents = [],
  databookConfig = null,
  onSaveDocuments,
  onSaveDatabookConfig,
}) {
  const [activeTab, setActiveTab] = useState("sections");
  const [localDocuments, setLocalDocuments] = useState([]);
  const [localConfig, setLocalConfig] = useState(createDefaultDatabookConfig());
  const [uploadCategory, setUploadCategory] = useState("other");
  const [uploadTitle, setUploadTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLocalDocuments(Array.isArray(documents) ? documents : []);
    setLocalConfig(normalizeDatabookConfig(databookConfig));
    setUploadCategory("other");
    setUploadTitle("");
    setActiveTab("sections");
  }, [isOpen, documents, databookConfig]);

  const validation = useMemo(
    () => buildDatabookValidation({ documents: localDocuments, databookConfig: localConfig }),
    [localDocuments, localConfig]
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
      setUploadTitle("");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }, [uploadCategory, uploadTitle]);

  function removeDocument(documentId) {
    setLocalDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
    setLocalConfig((prev) => {
      const nextLinks = { ...(prev.sectionDocumentIds || {}) };
      Object.entries(nextLinks).forEach(([sectionId, linkedDocumentId]) => {
        if (linkedDocumentId === documentId) delete nextLinks[sectionId];
      });
      return { ...prev, sectionDocumentIds: nextLinks };
    });
  }

  function handleSave() {
    onSaveDocuments?.(localDocuments);
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
            <div className="space-y-2">
              {localConfig.sectionOrder.map((sectionId, index) => {
                const section = DATABOOK_SECTIONS.find((item) => item.id === sectionId);
                if (!section) return null;
                const sectionState = validation.sections.find((item) => item.id === section.id);
                const isIncluded = localConfig.includedSectionIds.includes(section.id);
                const availableDocuments = section.documentCategory
                  ? (documentsByCategory.get(section.documentCategory) || [])
                  : [];
                const selectedDocId = localConfig.sectionDocumentIds?.[section.id] || "";

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
                          disabled={index === 0}
                          aria-label="Move section up"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs"
                          onClick={() => moveSection(section.id, "down")}
                          disabled={index === localConfig.sectionOrder.length - 1}
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
                      </div>
                    )}

                    <p className="text-xs text-base-content/60 mt-2 pl-6">
                      {sectionState?.message}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "documents" && (
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

              {localDocuments.length === 0 ? (
                <p className="text-sm text-base-content/60">No documents uploaded yet.</p>
              ) : (
                <ul className="space-y-2">
                  {localDocuments
                    .slice()
                    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
                    .map((doc) => (
                      <li key={doc.id} className="border border-base-300 rounded-lg p-3 bg-base-100">
                        <div className="flex items-center gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{doc.title || doc.fileName}</p>
                            <p className="text-xs text-base-content/60 truncate">
                              {getCategoryLabel(doc.category)} · {doc.fileName}
                            </p>
                          </div>
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs text-error"
                            onClick={() => removeDocument(doc.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </li>
                    ))}
                </ul>
              )}
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

