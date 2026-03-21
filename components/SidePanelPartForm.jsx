"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { PART_TYPES, PART_TYPE_LABELS } from "@/lib/constants";
import {
  partCatalog,
  getCategories,
  getCatalogEntry,
} from "@/lib/part-catalog";
import {
  getHierarchyForCategory,
  getHierarchyStateFromEntry,
  findEntryByHierarchy,
} from "@/lib/catalog-hierarchy";
import CatalogHierarchyStepSelects from "@/components/CatalogHierarchyStepSelects";
import { comparePartDisplayNumbers } from "@/lib/part-display-number";

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      resolve(result.replace(/^data:.*?;base64,/, ""));
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function SidePanelPartForm({
  parts = [],
  partMarkers = [],
  spools = [],
  documents = [],
  materialCertificates = [],
  selectedPartMarkerId,
  isOpen,
  onToggle,
  onSelectPartMarker,
  onSavePart,
  onSaveDocuments,
  onSaveMaterialCertificates,
  onDeletePart,
  appMode = "edition",
  isStacked = false,
  hideHeader = false,
}) {
  const selectedMarker = partMarkers.find((m) => m.id === selectedPartMarkerId);
  const selectedPart = selectedMarker
    ? parts.find((p) => p.id === selectedMarker.partId)
    : null;

  const [catalogCategory, setCatalogCategory] = useState("");
  const [hierarchyState, setHierarchyState] = useState({});
  const [partType, setPartType] = useState("");
  const [nps, setNps] = useState("");
  const [thickness, setThickness] = useState("");
  const [materialGrade, setMaterialGrade] = useState("");
  const [length, setLength] = useState("");
  const [spoolId, setSpoolId] = useState("");
  const [heatNumber, setHeatNumber] = useState("");
  const [variation, setVariation] = useState("");
  /** Which part row shows the editor (Lines / Spools–style accordion). */
  const [expandedPartMarkerId, setExpandedPartMarkerId] = useState(null);
  const autoSaveTimeoutRef = useRef(null);
  const mtcUploadInputRef = useRef(null);

  const categories = getCategories();
  const catalogEntriesForCategory = useMemo(
    () =>
      catalogCategory
        ? partCatalog.entries.filter((e) => e.catalogCategory === catalogCategory)
        : [],
    [catalogCategory]
  );

  const previousSelectedPartIdRef = useRef(null);
  useEffect(() => {
    if (!selectedPart) {
      previousSelectedPartIdRef.current = null;
      return;
    }
    if (previousSelectedPartIdRef.current === selectedPart.id) return;
    previousSelectedPartIdRef.current = selectedPart.id;
    if (selectedPart.catalogPartId) {
      const entry = getCatalogEntry(selectedPart.catalogPartId);
      if (entry) {
        setCatalogCategory(entry.catalogCategory);
        setHierarchyState(getHierarchyStateFromEntry(entry, entry.catalogCategory));
        setPartType(entry.partTypeLabel ?? "");
        setNps(entry.nps ?? "");
        setThickness(entry.thickness ?? "");
      } else {
        setCatalogCategory(selectedPart.catalogCategory ?? "");
        setHierarchyState({});
        setPartType(selectedPart.partType ?? "");
        setNps(selectedPart.nps ?? "");
        setThickness(selectedPart.thickness ?? "");
      }
    } else {
      setCatalogCategory(selectedPart.catalogCategory ?? "");
      setHierarchyState({});
      setPartType(selectedPart.partType ?? "");
      setNps(selectedPart.nps ?? "");
      setThickness(selectedPart.thickness ?? "");
    }
    setMaterialGrade(selectedPart.materialGrade ?? "");
    setLength(selectedPart.length ?? "");
    setSpoolId(selectedPart.spoolId ?? "");
    setHeatNumber(selectedPart.heatNumber ?? "");
    setVariation(selectedPart.variation ?? "");
  }, [selectedPart]);

  useEffect(() => {
    if (!selectedPartMarkerId) {
      setExpandedPartMarkerId(null);
      return;
    }
    setExpandedPartMarkerId(selectedPartMarkerId);
  }, [selectedPartMarkerId]);

  useEffect(() => {
    if (!selectedPart) return;
    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    autoSaveTimeoutRef.current = setTimeout(() => {
      const entry =
        catalogCategory && Object.keys(hierarchyState).length > 0
          ? findEntryByHierarchy(catalogEntriesForCategory, hierarchyState, catalogCategory)
          : null;
      const resolvedPartType =
        entry?.partTypeLabel ??
        hierarchyState.flangeType ??
        hierarchyState.fittingType ??
        partType.trim();
      const resolvedNps = entry?.nps ?? hierarchyState.nps ?? nps.trim();
      const resolvedThickness =
        entry?.thickness ?? hierarchyState.schedule ?? thickness.trim();
      onSavePart?.({
        ...selectedPart,
        catalogCategory: catalogCategory || "",
        catalogPartId: entry?.catalogPartId ?? null,
        partType: resolvedPartType,
        nps: resolvedNps,
        thickness: resolvedThickness,
        materialGrade: materialGrade.trim(),
        length: length.trim(),
        spoolId: spoolId || null,
        heatNumber: heatNumber.trim(),
        variation: variation.trim(),
        weightKg: entry?.weightKg ?? null,
      });
    }, 400);
    return () => {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    };
  }, [
    selectedPart,
    catalogCategory,
    hierarchyState,
    partType,
    nps,
    thickness,
    materialGrade,
    length,
    spoolId,
    heatNumber,
    variation,
    catalogEntriesForCategory,
    onSavePart,
  ]);

  function getSpoolName(id) {
    const s = spools.find((sp) => sp.id === id);
    return s?.name ?? "";
  }

  function handleDelete() {
    if (!selectedPart) return;
    if (confirm("Delete this part? Its marker will be removed from the drawing.")) {
      onDeletePart?.(selectedPart.id);
      onSelectPartMarker?.(null);
    }
  }

  const partTypeOptions = Object.entries(PART_TYPE_LABELS).map(([value, label]) => (
    <option key={value} value={value}>
      {label}
    </option>
  ));

  const isCatalogMode = Boolean(catalogCategory);
  const hierarchySteps = useMemo(
    () => getHierarchyForCategory(catalogCategory),
    [catalogCategory]
  );
  const mtcDocuments = useMemo(
    () => (documents || []).filter((doc) => doc?.category === "mtc"),
    [documents]
  );
  const normalizedHeat = (heatNumber || "").trim();
  const linkedMtc = useMemo(
    () =>
      (materialCertificates || []).find(
        (cert) => (cert?.heatNumber || "").trim() === normalizedHeat
      ) || null,
    [materialCertificates, normalizedHeat]
  );

  function handleCatalogCategoryChange(value) {
    setCatalogCategory(value);
    setHierarchyState({});
    setPartType("");
    setNps("");
    setThickness("");
  }

  function handleHierarchyChange(stepKey, value) {
    const stepIndex = hierarchySteps.findIndex((s) => s.key === stepKey);
    if (stepIndex < 0) return;
    setHierarchyState((prev) => {
      const next = { ...prev, [stepKey]: value };
      for (let j = stepIndex + 1; j < hierarchySteps.length; j++) {
        delete next[hierarchySteps[j].key];
      }
      return next;
    });
  }

  function setHeatMtcDocument(documentId) {
    if (!normalizedHeat || !onSaveMaterialCertificates) return;
    const nextCertificates = [...(materialCertificates || [])];
    const idx = nextCertificates.findIndex(
      (cert) => (cert?.heatNumber || "").trim() === normalizedHeat
    );
    const nextEntry = {
      id: idx >= 0 ? nextCertificates[idx].id : `mtc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      heatNumber: normalizedHeat,
      documentId: documentId || null,
      linkedPartIds: idx >= 0 ? nextCertificates[idx].linkedPartIds || [] : [],
    };
    if (idx >= 0) nextCertificates[idx] = nextEntry;
    else nextCertificates.push(nextEntry);
    onSaveMaterialCertificates(nextCertificates);
  }

  async function handleUploadMtcForHeat(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !normalizedHeat || !onSaveDocuments || !onSaveMaterialCertificates) return;
    const uploadedDoc = {
      id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      title: `${normalizedHeat} MTC`,
      category: "mtc",
      fileName: file.name || `${normalizedHeat}-mtc.pdf`,
      mimeType: file.type || "application/pdf",
      base64: await fileToBase64(file),
      createdAt: new Date().toISOString(),
    };
    onSaveDocuments([...(documents || []), uploadedDoc]);
    setHeatMtcDocument(uploadedDoc.id);
  }

  function renderPartEditorBody() {
    return (
      <div className="border-t border-base-300/60 px-2 py-2 space-y-3 w-full min-w-0">
        <div className="form-control">
          <label className="label" htmlFor="part-catalog-category">
            <span className="label-text">Category</span>
          </label>
          <select
            id="part-catalog-category"
            className="select select-bordered select-xs w-full"
            value={catalogCategory}
            onChange={(e) => handleCatalogCategoryChange(e.target.value)}
          >
            <option value="">Custom (free text)</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        {isCatalogMode ? (
          <CatalogHierarchyStepSelects
            catalogCategory={catalogCategory}
            hierarchySteps={hierarchySteps}
            hierarchyState={hierarchyState}
            catalogEntriesForCategory={catalogEntriesForCategory}
            onHierarchyChange={handleHierarchyChange}
            variant="form"
            idPrefix="part-hierarchy"
          />
        ) : (
          <>
            <div className="form-control">
              <label className="label" htmlFor="part-type">
                <span className="label-text">Part type</span>
              </label>
              <select
                id="part-type"
                className="select select-bordered select-xs w-full"
                value={partType}
                onChange={(e) => setPartType(e.target.value)}
              >
                <option value="">—</option>
                {partTypeOptions}
              </select>
            </div>
            <div className="form-control">
              <label className="label" htmlFor="part-nps">
                <span className="label-text">NPS</span>
              </label>
              <input
                id="part-nps"
                type="text"
                className="input input-bordered input-xs w-full min-w-0"
                value={nps}
                onChange={(e) => setNps(e.target.value)}
                placeholder="e.g. 2, 4, 6"
              />
            </div>
            <div className="form-control">
              <label className="label" htmlFor="part-thickness">
                <span className="label-text">Schedule</span>
              </label>
              <input
                id="part-thickness"
                type="text"
                className="input input-bordered input-xs w-full min-w-0"
                value={thickness}
                onChange={(e) => setThickness(e.target.value)}
                placeholder="e.g. SCH 40"
              />
            </div>
          </>
        )}
        <div className="form-control">
          <label className="label" htmlFor="part-variation">
            <span className="label-text">Variation (optional)</span>
          </label>
          <input
            id="part-variation"
            type="text"
            className="input input-bordered input-xs w-full min-w-0"
            value={variation}
            onChange={(e) => setVariation(e.target.value)}
            placeholder="Case-by-case note"
          />
        </div>
        <div className="form-control">
          <label className="label" htmlFor="part-material">
            <span className="label-text">Material grade</span>
          </label>
          <input
            id="part-material"
            type="text"
            className="input input-bordered input-xs w-full min-w-0"
            value={materialGrade}
            onChange={(e) => setMaterialGrade(e.target.value)}
            placeholder="e.g. A106 Gr.B"
          />
        </div>
        <div className="form-control">
          <label className="label" htmlFor="part-length">
            <span className="label-text">Length (optional)</span>
          </label>
          <input
            id="part-length"
            type="text"
            className="input input-bordered input-xs w-full min-w-0"
            value={length}
            onChange={(e) => setLength(e.target.value)}
            placeholder="e.g. 500 mm"
          />
        </div>
        {spools.length > 0 && (
          <div className="form-control">
            <label className="label" htmlFor="part-spool">
              <span className="label-text">Spool</span>
            </label>
            <select
              id="part-spool"
              className="select select-bordered select-xs w-full"
              value={spoolId}
              onChange={(e) => setSpoolId(e.target.value)}
            >
              <option value="">—</option>
              {spools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name || s.id}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="form-control">
          <label className="label" htmlFor="part-heatNumber">
            <span className="label-text">Heat number</span>
          </label>
          <input
            id="part-heatNumber"
            type="text"
            className="input input-bordered input-xs"
            value={heatNumber}
            onChange={(e) => setHeatNumber(e.target.value)}
            placeholder="e.g. H12345"
          />
        </div>
        <div className="form-control">
          <label className="label" htmlFor="part-mtc">
            <span className="label-text">MTC PDF link</span>
          </label>
          <div className="flex gap-1">
            <select
              id="part-mtc"
              className="select select-bordered select-xs flex-1"
              value={linkedMtc?.documentId || ""}
              onChange={(e) => setHeatMtcDocument(e.target.value)}
              disabled={!normalizedHeat}
            >
              <option value="">
                {normalizedHeat ? "No MTC linked" : "Enter heat number first"}
              </option>
              {mtcDocuments.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.title || doc.fileName}
                </option>
              ))}
            </select>
            {!linkedMtc?.documentId && normalizedHeat && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => mtcUploadInputRef.current?.click()}
              >
                Load
              </button>
            )}
          </div>
          <p className="text-xs text-base-content/60 mt-1">
            Link certificate by heat number for databook traceability.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col bg-base-200 transition-all duration-300 ease-out min-w-0 ${
        hideHeader
          ? "w-full flex-1 min-h-0 overflow-hidden"
          : `flex-shrink-0 border-l border-base-300 ${isOpen ? "w-full min-w-[10rem] min-h-0 flex-1 h-full overflow-hidden" : "w-14 overflow-hidden"}`
      }`}
    >
      {!hideHeader && (
      <button
        type="button"
        onClick={onToggle}
        className={`flex-shrink-0 flex items-center justify-center gap-2 py-3 px-2 border-b border-base-300 bg-base-100 hover:bg-base-200 transition-colors ${
          isOpen ? "flex-row" : `flex-col ${isStacked ? "min-h-12" : "min-h-24"}`
        }`}
        title={isOpen ? "Collapse parts panel" : "Expand parts panel"}
        aria-label={isOpen ? "Collapse parts panel" : "Expand parts panel"}
      >
        <span
          className={`font-medium ${isOpen ? "text-base" : "text-xs -rotate-90 whitespace-nowrap"}`}
        >
          Parts
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
      )}

      {isOpen && (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden w-full min-w-0 h-0 basis-0">
          <div className={`flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-auto p-3 space-y-3 pb-12 overscroll-contain [scrollbar-gutter:stable] break-words ${hideHeader ? "mobile-no-scrollbar" : ""}`}>
            {parts.length === 0 ? (
              <div className="text-center py-6 text-base-content/60 text-sm break-words min-w-0">
                <p>No parts yet</p>
                <p className="mt-1">Add with the Add Part tool on the drawing</p>
              </div>
            ) : (
              <ul className="space-y-2 min-w-0">
                {parts
                  .slice()
                  .sort(comparePartDisplayNumbers)
                  .map((p) => {
                    const marker = partMarkers.find((m) => m.partId === p.id);
                    if (!marker) return null;
                    const spoolName = p.spoolId ? getSpoolName(p.spoolId) : null;
                    const isExpanded = expandedPartMarkerId === marker.id;
                    const isActivePart = selectedPartMarkerId === marker.id;
                    return (
                      <li
                        key={p.id}
                        className="bg-base-100 border border-base-300 rounded-lg overflow-hidden min-w-0"
                      >
                        <div className="flex items-stretch gap-0 min-w-0">
                          <button
                            type="button"
                            className="flex-1 min-w-0 text-left text-xs px-2 py-1.5 flex items-center justify-between gap-2 hover:bg-base-200/60"
                            onClick={() => {
                              onSelectPartMarker?.(marker.id);
                              setExpandedPartMarkerId((prev) =>
                                prev === marker.id ? null : marker.id
                              );
                            }}
                          >
                            <span className="font-medium shrink-0">Part {p.displayNumber}</span>
                            <span className="text-xs text-base-content/60 truncate min-w-0 flex-1 text-right">
                              {spoolName || (p.heatNumber ? `Heat: ${p.heatNumber}` : "") || "—"}
                            </span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className={`h-3 w-3 flex-shrink-0 transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>
                          {appMode === "edition" && isExpanded && isActivePart && selectedPart ? (
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs text-error shrink-0 self-center mr-1"
                              onClick={handleDelete}
                            >
                              Delete
                            </button>
                          ) : null}
                        </div>
                        {isExpanded && isActivePart && selectedPart ? renderPartEditorBody() : null}
                      </li>
                    );
                  })}
              </ul>
            )}
          </div>
        </div>
      )}
      <input
        ref={mtcUploadInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handleUploadMtcForHeat}
      />
    </div>
  );
}

export default SidePanelPartForm;
