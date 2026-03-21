/**
 * Shared 3-group traceability model (aligned with Material certificates / heat MTC):
 *
 * 1 — PDF on file or library-only / not yet tied to project use (welds, parts, heats…)
 * 2 — Referenced on the project — missing certificate PDF where applicable
 * 3 — Certificate PDF + project use (traceability complete)
 *
 * Fitter / Welder (no PDF): "certificate" = listed in registry AND name appears on welds.
 */

function norm(s) {
  return (s || "").trim().toLowerCase();
}

export const TRACEABILITY = {
  /** Short labels for section <h4> */
  headings: {
    g1: "PDF on file — not linked to project use",
    g2: "In use on project — no certificate PDF",
    g3: "PDF linked — project use traceable",
  },
  /** Heat / MTC (parts + welds) */
  heat: {
    g1: {
      title: "MTC PDF loaded — not linked to any part",
      description:
        "Certificate PDF is stored, but no part is checked for traceability yet. Includes unassigned MTC files.",
    },
    g2: {
      title: "Heat in use — no MTC PDF",
      description: "Heats referenced on parts or welds without a linked certificate PDF yet.",
    },
    g3: {
      title: "Heat with MTC PDF — linked to parts",
      description: "Heats with a certificate PDF and at least one part attributed for traceability.",
    },
  },
  wps: {
    g1: {
      title: "WPS PDF on file — not linked to welds",
      description:
        "WPS library entries with a PDF (or not yet on any weld). Unassigned WPS PDFs in the project file are listed here too.",
    },
    g2: {
      title: "WPS in use on welds — no PDF",
      description: "Welds reference this WPS from the library, but no WPS certificate PDF is linked yet.",
    },
    g3: {
      title: "WPS PDF + linked to welds",
      description: "WPS entries with a certificate PDF and at least one weld using this library entry.",
    },
  },
  wqr: {
    g1: {
      title: "WQR PDF on file — not used on any weld",
      description:
        "Qualifications with a PDF loaded, but no welding record references this WQR yet.",
    },
    g2: {
      title: "WQR used on welds — no PDF",
      description: "Welding records reference this WQR, but no qualification PDF is linked.",
    },
    g3: {
      title: "WQR PDF + used on welds",
      description: "Qualifications with a PDF and at least one weld record using this WQR.",
    },
  },
  electrode: {
    g1: {
      title: "Certificate PDF on file — not used on welds",
      description:
        "Electrode entries with a PDF (or not yet referenced on a weld). Unassigned electrode PDFs appear here.",
    },
    g2: {
      title: "Electrode in use on welds — no PDF",
      description: "Electrode codes appear on weld records without a linked certificate PDF.",
    },
    g3: {
      title: "Electrode PDF + used on welds",
      description: "Electrode entries with a certificate PDF and usage on at least one weld.",
    },
  },
  fitter: {
    g1: {
      title: "Listed — not used on any weld",
      description: "Fitter names in this project’s list, but no weld fit-up uses them yet.",
    },
    g2: {
      title: "Used on welds — not in personnel list",
      description: "Fit-up names on welds that do not match any fitter entered under Settings.",
    },
    g3: {
      title: "Listed + used on welds",
      description: "Fitters that appear on at least one weld’s fit-up and match the personnel list.",
    },
  },
  welder: {
    g1: {
      title: "Listed — not used on any weld",
      description: "Welders in the list, but no welding record references them yet.",
    },
    g2: {
      title: "Used on welds — not in personnel list",
      description: "Welder names or IDs on welds that do not match the welder registry.",
    },
    g3: {
      title: "Listed + used on welds",
      description: "Welders referenced on welding records and registered in Settings.",
    },
  },
};

/** @param {object[]} weldPoints */
export function weldUsesWpsEntry(weld, entryId) {
  return Boolean(entryId && weld?.wpsLibraryEntryId === entryId);
}

/**
 * @param {object[]} wpsLibrary
 * @param {object[]} weldPoints
 * @param {object[]} documents category `wps`
 */
export function groupWpsLibraryEntries(wpsLibrary = [], weldPoints = [], documents = []) {
  const list = Array.isArray(wpsLibrary) ? wpsLibrary : [];
  const welds = Array.isArray(weldPoints) ? weldPoints : [];
  const wpsDocs = (documents || []).filter((d) => d?.category === "wps" && !d?.isReadOnlyFromNdt);

  const linkedDocIds = new Set(list.map((e) => e?.documentId).filter(Boolean));
  const orphanWpsDocuments = wpsDocs.filter((d) => !linkedDocIds.has(d.id));

  const g1 = [];
  const g2 = [];
  const g3 = [];

  for (const entry of list) {
    const hasPdf = Boolean(entry?.documentId);
    const used = welds.some((w) => weldUsesWpsEntry(w, entry.id));
    if (hasPdf && used) g3.push(entry);
    else if (!hasPdf && used) g2.push(entry);
    else g1.push(entry);
  }

  return { g1, g2, g3, orphanWpsDocuments };
}

export function weldReferencesWqr(weld, wqrId) {
  if (!wqrId) return false;
  for (const r of weld.weldingRecords || []) {
    if ((r.wqrIds || []).includes(wqrId)) return true;
  }
  return false;
}

/**
 * @param {object[]} wqrs
 * @param {object[]} weldPoints
 */
export function groupWqrs(wqrs = [], weldPoints = []) {
  const list = Array.isArray(wqrs) ? wqrs : [];
  const welds = Array.isArray(weldPoints) ? weldPoints : [];
  const g1 = [];
  const g2 = [];
  const g3 = [];

  for (const wqr of list) {
    const hasPdf = Boolean(wqr?.documentId);
    const used = welds.some((w) => weldReferencesWqr(w, wqr.id));
    if (hasPdf && used) g3.push(wqr);
    else if (!hasPdf && used) g2.push(wqr);
    else g1.push(wqr);
  }
  return { g1, g2, g3 };
}

/** Collect electrode codes referenced on weld records (normalized for compare). */
export function getElectrodeCodesUsedOnWelds(weldPoints = []) {
  const codes = new Set();
  for (const w of weldPoints || []) {
    for (const r of w.weldingRecords || []) {
      for (const raw of r.electrodeNumbers || []) {
        const c = (raw || "").trim();
        if (c) codes.add(c.toUpperCase());
      }
    }
  }
  return codes;
}

export function groupElectrodeEntries(electrodeLibrary = [], weldPoints = [], documents = []) {
  const list = Array.isArray(electrodeLibrary) ? electrodeLibrary : [];
  const usedCodes = getElectrodeCodesUsedOnWelds(weldPoints);
  const elecDocs = (documents || []).filter((d) => d?.category === "electrode" && !d?.isReadOnlyFromNdt);
  const linkedDocIds = new Set(list.map((e) => e?.documentId).filter(Boolean));
  const orphanElectrodeDocuments = elecDocs.filter((d) => !linkedDocIds.has(d.id));

  const g1 = [];
  const g2 = [];
  const g3 = [];

  for (const entry of list) {
    const code = (entry?.code || "").trim().toUpperCase();
    const hasPdf = Boolean(entry?.documentId);
    const used = code ? usedCodes.has(code) : false;
    if (hasPdf && used) g3.push(entry);
    else if (!hasPdf && used) g2.push(entry);
    else g1.push(entry);
  }

  return { g1, g2, g3, orphanElectrodeDocuments };
}

export function groupFitterNames(fitters = [], weldPoints = []) {
  const registry = new Map();
  for (const f of fitters || []) {
    const n = norm(f?.name);
    if (n) registry.set(n, f);
  }
  const usedOnWelds = new Set();
  for (const w of weldPoints || []) {
    const n = norm(w.fitterName);
    if (n) usedOnWelds.add(n);
  }

  const g1 = [];
  const g2 = [];
  const g3 = [];

  for (const f of fitters || []) {
    const n = norm(f?.name);
    if (!n) continue;
    if (usedOnWelds.has(n)) g3.push(f);
    else g1.push(f);
  }

  for (const n of usedOnWelds) {
    if (!registry.has(n)) g2.push(n);
  }

  return { g1, g2, g3 };
}

/**
 * Welder: match by welder id on record, or by name string.
 * @param {object[]} welders
 * @param {object[]} weldPoints
 */
export function groupWelders(welders = [], weldPoints = []) {
  const weldersList = Array.isArray(welders) ? welders : [];
  const byId = new Map(weldersList.map((w) => [w.id, w]));
  const nameSet = new Set(weldersList.map((w) => norm(w.name)).filter(Boolean));

  const usedWelderIds = new Set();
  const usedNamesFromWelds = new Set();

  for (const weld of weldPoints || []) {
    for (const r of weld.weldingRecords || []) {
      for (const id of r.welderIds || []) {
        if (id) usedWelderIds.add(id);
      }
      const wn = norm(r.welderName);
      if (wn) usedNamesFromWelds.add(wn);
    }
  }

  const g1 = [];
  const g3 = [];

  for (const w of weldersList) {
    const id = w.id;
    const n = norm(w.name);
    const inUse = usedWelderIds.has(id) || (n && usedNamesFromWelds.has(n));
    if (inUse) g3.push(w);
    else g1.push(w);
  }

  const g2Stray = [];
  for (const id of usedWelderIds) {
    if (!byId.has(id)) g2Stray.push({ kind: "id", value: id });
  }
  for (const n of usedNamesFromWelds) {
    if (!nameSet.has(n)) g2Stray.push({ kind: "name", value: n });
  }

  return { g1, g2Stray, g3 };
}
