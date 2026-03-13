/**
 * Declarative hierarchy of selection steps per catalog category.
 * Used by SidePanelPartForm and AddDefaultsBar to render category-aware selectors
 * and to resolve catalogPartId from hierarchy selections.
 */

/**
 * Step definition shape:
 * - key: string, used in hierarchy state and entry matching
 * - label: string, shown in UI
 * - getValueFromEntry: (entry) => value for this step from a catalog entry
 * - sortValues: optional (a, b) => number for option list order
 */
const defaultSortNps = (a, b) => {
  const na = parseFloat(String(a).replace(/\+/g, ".")) || 0;
  const nb = parseFloat(String(b).replace(/\+/g, ".")) || 0;
  return na - nb;
};

const defaultSortString = (a, b) => String(a).localeCompare(String(b));

export const catalogHierarchyConfig = {
  // Flanges: Standard (category) → Type (weldneck/slip-on/…) → NPS → Schedule → Rating → Face Type
  "asme-b16-5": [
    { key: "flangeType", label: "Flange type", getValueFromEntry: (e) => e.partTypeLabel ?? e.attributes?.flangeTypeLabel ?? "", sortValues: defaultSortString },
    { key: "nps", label: "NPS", getValueFromEntry: (e) => e.nps ?? "", sortValues: defaultSortNps },
    { key: "schedule", label: "Schedule", getValueFromEntry: (e) => e.thickness ?? "", sortValues: defaultSortString },
    { key: "rating", label: "Rating", getValueFromEntry: (e) => e.attributes?.rating ?? e.attributes?.pressureClass ?? "", sortValues: defaultSortNps },
    { key: "faceType", label: "Face type", getValueFromEntry: (e) => e.attributes?.faceType ?? "RF", sortValues: defaultSortString },
  ],
  "asme-b16-47-a": [
    { key: "nps", label: "NPS", getValueFromEntry: (e) => e.nps ?? "", sortValues: defaultSortNps },
    { key: "schedule", label: "Schedule", getValueFromEntry: (e) => e.thickness ?? "", sortValues: defaultSortString },
    { key: "rating", label: "Rating", getValueFromEntry: (e) => e.attributes?.rating ?? e.attributes?.pressureClass ?? "", sortValues: defaultSortNps },
    { key: "faceType", label: "Face type", getValueFromEntry: (e) => e.attributes?.faceType ?? "RF", sortValues: defaultSortString },
  ],
  "asme-b16-47-b": [
    { key: "nps", label: "NPS", getValueFromEntry: (e) => e.nps ?? "", sortValues: defaultSortNps },
    { key: "schedule", label: "Schedule", getValueFromEntry: (e) => e.thickness ?? "", sortValues: defaultSortString },
    { key: "rating", label: "Rating", getValueFromEntry: (e) => e.attributes?.rating ?? e.attributes?.pressureClass ?? "", sortValues: defaultSortNps },
    { key: "faceType", label: "Face type", getValueFromEntry: (e) => e.attributes?.faceType ?? "RF", sortValues: defaultSortString },
  ],
  "asme-orifice": [
    { key: "nps", label: "NPS", getValueFromEntry: (e) => e.nps ?? "", sortValues: defaultSortNps },
    { key: "schedule", label: "Schedule", getValueFromEntry: (e) => e.thickness ?? "", sortValues: defaultSortString },
    { key: "rating", label: "Rating", getValueFromEntry: (e) => e.attributes?.rating ?? e.attributes?.pressureClass ?? "", sortValues: defaultSortNps },
  ],
  "api-6b": [
    { key: "nps", label: "NPS", getValueFromEntry: (e) => e.nps ?? "", sortValues: defaultSortNps },
    { key: "schedule", label: "Schedule", getValueFromEntry: (e) => e.thickness ?? "", sortValues: defaultSortString },
    { key: "rating", label: "Rating", getValueFromEntry: (e) => e.attributes?.rating ?? e.attributes?.pressureClass ?? "", sortValues: defaultSortNps },
  ],
  "api-6bx": [
    { key: "nps", label: "NPS", getValueFromEntry: (e) => e.nps ?? "", sortValues: defaultSortNps },
    { key: "schedule", label: "Schedule", getValueFromEntry: (e) => e.thickness ?? "", sortValues: defaultSortString },
    { key: "rating", label: "Rating", getValueFromEntry: (e) => e.attributes?.rating ?? e.attributes?.pressureClass ?? "", sortValues: defaultSortNps },
  ],
  "asme-reducing": [
    { key: "nps", label: "NPS", getValueFromEntry: (e) => e.nps ?? "", sortValues: defaultSortNps },
    { key: "schedule", label: "Schedule", getValueFromEntry: (e) => e.thickness ?? "", sortValues: defaultSortString },
    { key: "rating", label: "Rating", getValueFromEntry: (e) => e.attributes?.rating ?? e.attributes?.pressureClass ?? "", sortValues: defaultSortNps },
  ],
  "asme-compact": [
    { key: "nps", label: "NPS", getValueFromEntry: (e) => e.nps ?? "", sortValues: defaultSortNps },
    { key: "schedule", label: "Schedule", getValueFromEntry: (e) => e.thickness ?? "", sortValues: defaultSortString },
    { key: "rating", label: "Rating", getValueFromEntry: (e) => e.attributes?.rating ?? e.attributes?.pressureClass ?? "", sortValues: defaultSortNps },
  ],
  "hub-and-clamp": [
    { key: "nps", label: "NPS", getValueFromEntry: (e) => e.nps ?? "", sortValues: defaultSortNps },
    { key: "schedule", label: "Schedule", getValueFromEntry: (e) => e.thickness ?? "", sortValues: defaultSortString },
  ],
  "en-1092-1": [
    { key: "nps", label: "NPS", getValueFromEntry: (e) => e.nps ?? "", sortValues: defaultSortNps },
    { key: "schedule", label: "Schedule", getValueFromEntry: (e) => e.thickness ?? "", sortValues: defaultSortString },
    { key: "rating", label: "Rating", getValueFromEntry: (e) => e.attributes?.rating ?? e.attributes?.pressureClass ?? "", sortValues: defaultSortNps },
  ],
  "bs-10": [
    { key: "nps", label: "NPS", getValueFromEntry: (e) => e.nps ?? "", sortValues: defaultSortNps },
    { key: "schedule", label: "Schedule", getValueFromEntry: (e) => e.thickness ?? "", sortValues: defaultSortString },
  ],

  // Pipe: Form (seamless/welded) → NPS → Schedule
  pipe: [
    { key: "pipeForm", label: "Form", getValueFromEntry: (e) => e.attributes?.pipeForm ?? "Seamless", sortValues: defaultSortString },
    { key: "nps", label: "NPS", getValueFromEntry: (e) => e.nps ?? "", sortValues: defaultSortNps },
    { key: "schedule", label: "Schedule", getValueFromEntry: (e) => e.thickness ?? "", sortValues: defaultSortString },
  ],

  // Fittings (butt weld): Type (elbow/tee/…) → Radius → Angle → NPS → Schedule
  "fittings-butt-weld": [
    { key: "fittingType", label: "Fitting type", getValueFromEntry: (e) => e.attributes?.fittingType ?? e.partTypeLabel ?? "", sortValues: defaultSortString },
    { key: "radius", label: "Radius", getValueFromEntry: (e) => e.attributes?.radius ?? "", sortValues: defaultSortString },
    { key: "angle", label: "Angle", getValueFromEntry: (e) => e.attributes?.angle ?? "", sortValues: defaultSortNps },
    { key: "nps", label: "NPS", getValueFromEntry: (e) => e.nps ?? "", sortValues: defaultSortNps },
    { key: "schedule", label: "Schedule", getValueFromEntry: (e) => e.thickness ?? "", sortValues: defaultSortString },
  ],
};

/**
 * Returns the ordered hierarchy steps for a category, or empty array if unknown.
 */
export function getHierarchyForCategory(categoryId) {
  return catalogHierarchyConfig[categoryId] ?? [];
}

/**
 * Given entries for a category and current hierarchy state (object keyed by step key),
 * returns the list of unique values for the next step (the first step with no value in state).
 * If all steps have values, returns [].
 */
export function getOptionsForNextStep(entries, hierarchyState, categoryId) {
  const steps = getHierarchyForCategory(categoryId);
  const firstEmpty = steps.findIndex((s) => {
    const v = hierarchyState[s.key];
    return v === undefined || v === "";
  });
  if (firstEmpty < 0) return [];
  return getOptionsForStep(entries, hierarchyState, categoryId, steps[firstEmpty].key);
}

/**
 * Returns unique options for a specific step, filtering entries by previous steps' state.
 */
export function getOptionsForStep(entries, hierarchyState, categoryId, stepKey) {
  const steps = getHierarchyForCategory(categoryId);
  const stepIndex = steps.findIndex((s) => s.key === stepKey);
  if (stepIndex < 0) return [];

  const step = steps[stepIndex];
  const partialState = {};
  for (let j = 0; j < stepIndex; j++) {
    const k = steps[j].key;
    const v = hierarchyState[k];
    if (v !== undefined && v !== "") partialState[k] = v;
  }

  const filtered = entries.filter((e) => {
    return Object.entries(partialState).every(([k, stateVal]) => {
      const s = steps.find((st) => st.key === k);
      if (!s) return true;
      const entryVal = s.getValueFromEntry(e);
      return String(entryVal) === String(stateVal);
    });
  });

  const values = [...new Set(filtered.map((e) => step.getValueFromEntry(e)).filter((v) => v !== undefined && v !== ""))];
  if (step.sortValues) values.sort(step.sortValues);
  return values;
}

/**
 * Find the single catalog entry matching full hierarchy state for the category.
 */
export function findEntryByHierarchy(entries, hierarchyState, categoryId) {
  const steps = getHierarchyForCategory(categoryId);
  const filtered = entries.filter((e) => {
    return steps.every((step) => {
      const stateVal = hierarchyState[step.key];
      if (stateVal === undefined || stateVal === "") return false;
      const entryVal = step.getValueFromEntry(e);
      return String(entryVal) === String(stateVal);
    });
  });
  return filtered[0] ?? null;
}

/**
 * Build hierarchy state from an existing catalog entry (e.g. when loading a part that has catalogPartId).
 */
export function getHierarchyStateFromEntry(entry, categoryId) {
  if (!entry) return {};
  const steps = getHierarchyForCategory(categoryId);
  const state = {};
  for (const step of steps) {
    const v = step.getValueFromEntry(entry);
    if (v !== undefined && v !== "") state[step.key] = v;
  }
  return state;
}
