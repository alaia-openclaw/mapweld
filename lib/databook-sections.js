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
      const categoryDocs = section.documentCategory
        ? documentsByCategory(section.documentCategory)
        : [];
      const ready = !!linkedDoc || categoryDocs.length > 0;
      return {
        id: section.id,
        title: section.title,
        required: section.required,
        included: true,
        ready,
        message: ready
          ? linkedDoc
            ? `Linked document: ${linkedDoc.title || linkedDoc.fileName || linkedDoc.id}`
            : `${categoryDocs.length} ${section.documentCategory?.toUpperCase?.() || "category"} document${categoryDocs.length > 1 ? "s" : ""} auto-selected`
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

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function getUsedWelderIds(weldPoints = []) {
  return unique(
    (weldPoints || []).flatMap((weld) =>
      (weld?.weldingRecords || []).flatMap((record) => record?.welderIds || [])
    )
  );
}

function getUsedWpsCodes(weldPoints = []) {
  return unique((weldPoints || []).map((weld) => (weld?.wps || "").trim()));
}

function getUsedHeatNumbers(parts = [], weldPoints = []) {
  const fromParts = (parts || []).map((part) => (part?.heatNumber || "").trim());
  const fromWelds = (weldPoints || []).flatMap((weld) => [
    (weld?.heatNumber1 || "").trim(),
    (weld?.heatNumber2 || "").trim(),
  ]);
  return unique([...fromParts, ...fromWelds]);
}

export function getDatabookLinkedRequirements({
  weldPoints = [],
  parts = [],
  personnel = { welders: [], wqrs: [] },
  wpsLibrary = [],
  materialCertificates = [],
} = {}) {
  const weldersById = new Map((personnel?.welders || []).map((welder) => [welder.id, welder]));
  const wqrsById = new Map((personnel?.wqrs || []).map((wqr) => [wqr.id, wqr]));
  const wpsByCode = new Map(
    (wpsLibrary || [])
      .filter((entry) => entry && typeof entry === "object")
      .map((entry) => [(entry.code || "").trim(), entry])
      .filter(([code]) => !!code)
  );
  const mtcByHeat = new Map(
    (materialCertificates || [])
      .filter((cert) => cert && typeof cert === "object")
      .map((cert) => [(cert.heatNumber || "").trim(), cert])
      .filter(([heat]) => !!heat)
  );

  const usedWelderIds = getUsedWelderIds(weldPoints);
  const requiredWqrEntries = unique(
    usedWelderIds.flatMap((welderId) => {
      const welder = weldersById.get(welderId);
      const wqrIds = welder?.wqrIds || [];
      return wqrIds.map((wqrId) => wqrsById.get(wqrId)).filter(Boolean);
    })
  );

  const usedWpsCodes = getUsedWpsCodes(weldPoints);
  const requiredWpsEntries = usedWpsCodes.map((code) => wpsByCode.get(code)).filter(Boolean);

  const usedHeatNumbers = getUsedHeatNumbers(parts, weldPoints);
  const requiredMtcEntries = usedHeatNumbers.map((heat) => mtcByHeat.get(heat)).filter(Boolean);

  return {
    usedWelderIds,
    requiredWqrEntries,
    usedWpsCodes,
    requiredWpsEntries,
    usedHeatNumbers,
    requiredMtcEntries,
  };
}

export function buildDatabookValidationWithContext({
  documents = [],
  databookConfig = null,
  weldPoints = [],
  parts = [],
  personnel = { welders: [], wqrs: [] },
  wpsLibrary = [],
  materialCertificates = [],
  ndtReports = [],
} = {}) {
  const base = buildDatabookValidation({ documents, databookConfig });
  const documentIds = new Set((documents || []).map((doc) => doc.id));
  const requirements = getDatabookLinkedRequirements({
    weldPoints,
    parts,
    personnel,
    wpsLibrary,
    materialCertificates,
  });

  const sections = base.sections.map((section) => {
    if (!section.included) return section;

    if (section.id === "welder-qualification") {
      const required = requirements.requiredWqrEntries;
      if (required.length === 0) {
        return {
          ...section,
          ready: true,
          message: "No welders from project weld records require linked WQR documents",
        };
      }
      const missing = required.filter((entry) => !entry.documentId || !documentIds.has(entry.documentId));
      return {
        ...section,
        ready: missing.length === 0,
        message:
          missing.length === 0
            ? `${required.length} required WQR document link${required.length > 1 ? "s" : ""} satisfied`
            : `${missing.length}/${required.length} required WQR entries missing document links`,
      };
    }

    if (section.id === "wps") {
      const required = requirements.usedWpsCodes;
      if (required.length === 0) {
        return {
          ...section,
          ready: true,
          message: "No WPS codes referenced in weld records",
        };
      }
      const missingCodes = required.filter((code) => {
        const entry = (wpsLibrary || []).find((item) => (item?.code || "").trim() === code);
        return !entry?.documentId || !documentIds.has(entry.documentId);
      });
      return {
        ...section,
        ready: missingCodes.length === 0,
        message:
          missingCodes.length === 0
            ? `${required.length} referenced WPS code${required.length > 1 ? "s" : ""} linked to documents`
            : `${missingCodes.length}/${required.length} referenced WPS code${required.length > 1 ? "s are" : " is"} missing linked document`,
      };
    }

    if (section.id === "material-certificates") {
      const required = requirements.usedHeatNumbers;
      if (required.length === 0) {
        return {
          ...section,
          ready: true,
          message: "No heat numbers found in parts/weld records",
        };
      }
      const missingHeats = required.filter((heat) => {
        const cert = (materialCertificates || []).find((item) => (item?.heatNumber || "").trim() === heat);
        return !cert?.documentId || !documentIds.has(cert.documentId);
      });
      return {
        ...section,
        ready: missingHeats.length === 0,
        message:
          missingHeats.length === 0
            ? `${required.length} heat number${required.length > 1 ? "s" : ""} mapped to MTC documents`
            : `${missingHeats.length}/${required.length} heat number${required.length > 1 ? "s are" : " is"} missing linked MTC`,
      };
    }

    if (section.id === "ndt-report") {
      const totalReports = Array.isArray(ndtReports) ? ndtReports.length : 0;
      const completedReports = (ndtReports || []).filter((report) => report?.status === "completed").length;
      return {
        ...section,
        ready: totalReports > 0,
        message:
          totalReports > 0
            ? `${totalReports} NDT report${totalReports > 1 ? "s" : ""} available (${completedReports} completed)`
            : "No NDT reports created yet",
      };
    }

    return section;
  });

  const missingRequired = sections.filter((section) => section.required && !section.ready);
  return {
    ...base,
    sections,
    isReady: missingRequired.length === 0,
    missingRequiredCount: missingRequired.length,
  };
}

