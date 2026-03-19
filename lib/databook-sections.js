export const DATABOOK_SECTIONS = [
  { id: "itp", title: "ITP", type: "uploaded", required: true, documentCategory: "itp" },
  { id: "project-summary", title: "Project summary (drawings, systems, lines)", type: "generated", required: true },
  { id: "as-built-drawings", title: "As-built drawings (with overlays)", type: "generated", required: true },
  { id: "weld-map", title: "Weld map", type: "generated", required: true },
  { id: "fitup-report", title: "Visual & dimensional fit-up report", type: "generated", required: true },
  { id: "welder-qualification", title: "Welder qualification (WQR)", type: "linked_documents", required: true, documentCategory: "wqr" },
  { id: "wps", title: "WPS", type: "linked_documents", required: true, documentCategory: "wps" },
  { id: "material-certificates", title: "Material certificates (MTC)", type: "linked_documents", required: true, documentCategory: "mtc" },
  { id: "ndt-report", title: "NDT report", type: "generated", required: true },
  { id: "ndt-qualification", title: "NDT qualification", type: "uploaded", required: true, documentCategory: "ndt_qualification" },
  { id: "ndt-calibration", title: "NDT calibration", type: "uploaded", required: true, documentCategory: "ndt_calibration" },
  { id: "painting-report", title: "Painting report", type: "uploaded", required: true, documentCategory: "painting_report" },
  { id: "final-release", title: "Final release note / QC approval", type: "uploaded", required: true, documentCategory: "final_release" },
];

export function createDefaultDatabookConfig() {
  return {
    sectionOrder: DATABOOK_SECTIONS.map((section) => section.id),
    includedSectionIds: DATABOOK_SECTIONS.map((section) => section.id),
    sectionDocumentIds: {},
    revision: "",
    issuedBy: "",
    issuedAt: "",
  };
}

export function normalizeDatabookConfig(config) {
  const defaults = createDefaultDatabookConfig();
  if (!config || typeof config !== "object") return defaults;

  const knownSectionIds = new Set(DATABOOK_SECTIONS.map((section) => section.id));
  const normalizedOrder = Array.isArray(config.sectionOrder)
    ? config.sectionOrder.filter((id) => knownSectionIds.has(id))
    : [];
  const missingOrderedIds = defaults.sectionOrder.filter((id) => !normalizedOrder.includes(id));
  const sectionOrder = [...normalizedOrder, ...missingOrderedIds];

  const includedSet = new Set(
    Array.isArray(config.includedSectionIds)
      ? config.includedSectionIds.filter((id) => knownSectionIds.has(id))
      : defaults.includedSectionIds
  );

  const sectionDocumentIds = {};
  if (config.sectionDocumentIds && typeof config.sectionDocumentIds === "object") {
    Object.entries(config.sectionDocumentIds).forEach(([sectionId, documentId]) => {
      if (!knownSectionIds.has(sectionId)) return;
      if (typeof documentId !== "string" || !documentId) return;
      sectionDocumentIds[sectionId] = documentId;
    });
  }

  return {
    sectionOrder,
    includedSectionIds: sectionOrder.filter((id) => includedSet.has(id)),
    sectionDocumentIds,
    revision: config.revision || "",
    issuedBy: config.issuedBy || "",
    issuedAt: config.issuedAt || "",
  };
}

export function buildDatabookValidation({ documents = [], databookConfig = null } = {}) {
  const config = normalizeDatabookConfig(databookConfig);
  const documentsById = new Map((documents || []).map((doc) => [doc.id, doc]));
  const documentsByCategory = (category) =>
    (documents || []).filter((doc) => doc?.category === category);

  const sectionStates = config.sectionOrder.map((sectionId) => {
    const section = DATABOOK_SECTIONS.find((item) => item.id === sectionId);
    if (!section) return null;

    const isIncluded = config.includedSectionIds.includes(sectionId);
    if (!isIncluded) {
      return {
        id: section.id,
        title: section.title,
        required: section.required,
        included: false,
        ready: !section.required,
        message: section.required ? "Required section is excluded" : "Excluded",
      };
    }

    if (section.type === "generated") {
      return {
        id: section.id,
        title: section.title,
        required: section.required,
        included: true,
        ready: true,
        message: "Generated from project data",
      };
    }

    if (section.type === "uploaded") {
      const linkedId = config.sectionDocumentIds?.[section.id];
      const linkedDoc = linkedId ? documentsById.get(linkedId) : null;
      const ready = !!linkedDoc;
      return {
        id: section.id,
        title: section.title,
        required: section.required,
        included: true,
        ready,
        message: ready
          ? `Linked document: ${linkedDoc.title || linkedDoc.fileName || linkedDoc.id}`
          : "Missing linked PDF document",
      };
    }

    if (section.type === "linked_documents") {
      const linked = documentsByCategory(section.documentCategory);
      const ready = linked.length > 0;
      return {
        id: section.id,
        title: section.title,
        required: section.required,
        included: true,
        ready,
        message: ready
          ? `${linked.length} related document${linked.length > 1 ? "s" : ""} found`
          : "No related documents found",
      };
    }

    return {
      id: section.id,
      title: section.title,
      required: section.required,
      included: true,
      ready: false,
      message: "Unknown section type",
    };
  }).filter(Boolean);

  const missingRequired = sectionStates.filter((section) => section.required && !section.ready);
  return {
    sections: sectionStates,
    isReady: missingRequired.length === 0,
    missingRequiredCount: missingRequired.length,
  };
}

