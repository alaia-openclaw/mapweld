/**
 * Declarative hierarchy of selection steps per catalog category.
 * Used by SidePanelPartForm and AddDefaultsBar to render category-aware selectors
 * and to resolve catalogPartId from hierarchy selections.
 */

import { FLANGED_VALVE_TYPES } from "./flanged-valves-data";
import { BUTTWELDED_VALVE_TYPES } from "./buttwelded-valves-data";
import { THREADED_VALVE_TYPES } from "./threaded-valves-data";
import { SOCKETWELDED_VALVE_TYPES } from "./socketwelded-valves-data";

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

function buildFlangedValveHierarchy() {
  const face = [
    { key: "nps", label: "DN", getValueFromEntry: (e) => e.nps ?? "", sortValues: defaultSortNps },
    {
      key: "rating",
      label: "Class",
      getValueFromEntry: (e) => e.attributes?.rating ?? e.attributes?.pressureClass ?? "",
      sortValues: defaultSortString,
    },
    {
      key: "faceType",
      label: "Face type",
      getValueFromEntry: (e) => e.attributes?.faceType ?? "",
      sortValues: defaultSortString,
    },
  ];
  const act = [
    { key: "nps", label: "DN", getValueFromEntry: (e) => e.nps ?? "", sortValues: defaultSortNps },
    {
      key: "rating",
      label: "Class",
      getValueFromEntry: (e) => e.attributes?.rating ?? e.attributes?.pressureClass ?? "",
      sortValues: defaultSortString,
    },
    {
      key: "actuator",
      label: "Actuator",
      getValueFromEntry: (e) => e.attributes?.actuator ?? "",
      sortValues: defaultSortString,
    },
  ];
  /** @type {Record<string, object[]>} */
  const out = {};
  for (const t of FLANGED_VALVE_TYPES) {
    out[t.selectionId] = t.toolbar === "face" ? face : act;
  }
  return out;
}

function buildButtweldedValveHierarchy() {
  const steps = [
    { key: "nps", label: "DN", getValueFromEntry: (e) => e.nps ?? "", sortValues: defaultSortNps },
    {
      key: "rating",
      label: "Class",
      getValueFromEntry: (e) => e.attributes?.rating ?? e.attributes?.pressureClass ?? "",
      sortValues: defaultSortString,
    },
  ];
  /** @type {Record<string, object[]>} */
  const out = {};
  for (const t of BUTTWELDED_VALVE_TYPES) {
    out[t.selectionId] = steps;
  }
  return out;
}

function buildThreadedValveHierarchy() {
  const steps = [
    { key: "nps", label: "DN", getValueFromEntry: (e) => e.nps ?? "", sortValues: defaultSortNps },
    {
      key: "rating",
      label: "Valve class",
      getValueFromEntry: (e) => e.attributes?.rating ?? e.attributes?.pressureClass ?? "",
      sortValues: defaultSortString,
    },
  ];
  /** @type {Record<string, object[]>} */
  const out = {};
  for (const t of THREADED_VALVE_TYPES) {
    out[t.selectionId] = steps;
  }
  return out;
}

function buildSocketweldedValveHierarchy() {
  const steps = [
    { key: "nps", label: "DN", getValueFromEntry: (e) => e.nps ?? "", sortValues: defaultSortNps },
    {
      key: "rating",
      label: "Valve class",
      getValueFromEntry: (e) => e.attributes?.rating ?? e.attributes?.pressureClass ?? "",
      sortValues: defaultSortString,
    },
  ];
  /** @type {Record<string, object[]>} */
  const out = {};
  for (const t of SOCKETWELDED_VALVE_TYPES) {
    out[t.selectionId] = steps;
  }
  return out;
}

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

  "fittings-threaded": [
    { key: "fittingType", label: "Fitting type", getValueFromEntry: (e) => e.attributes?.fittingType ?? e.partTypeLabel ?? "", sortValues: defaultSortString },
    { key: "radius", label: "Radius", getValueFromEntry: (e) => e.attributes?.radius ?? "", sortValues: defaultSortString },
    { key: "angle", label: "Angle", getValueFromEntry: (e) => e.attributes?.angle ?? "", sortValues: defaultSortNps },
    { key: "nps", label: "NPS", getValueFromEntry: (e) => e.nps ?? "", sortValues: defaultSortNps },
    { key: "schedule", label: "Schedule", getValueFromEntry: (e) => e.thickness ?? "", sortValues: defaultSortString },
  ],

  "fittings-socket-weld": [
    { key: "fittingType", label: "Fitting type", getValueFromEntry: (e) => e.attributes?.fittingType ?? e.partTypeLabel ?? "", sortValues: defaultSortString },
    { key: "radius", label: "Radius", getValueFromEntry: (e) => e.attributes?.radius ?? "", sortValues: defaultSortString },
    { key: "angle", label: "Angle", getValueFromEntry: (e) => e.attributes?.angle ?? "", sortValues: defaultSortNps },
    { key: "nps", label: "NPS", getValueFromEntry: (e) => e.nps ?? "", sortValues: defaultSortNps },
    { key: "schedule", label: "Schedule", getValueFromEntry: (e) => e.thickness ?? "", sortValues: defaultSortString },
  ],

  ...buildFlangedValveHierarchy(),
  ...buildButtweldedValveHierarchy(),
  ...buildThreadedValveHierarchy(),
  ...buildSocketweldedValveHierarchy(),
};

/**
 * Returns the ordered hierarchy steps for a category, or empty array if unknown.
 */
export function getHierarchyForCategory(categoryId) {
  return catalogHierarchyConfig[categoryId] ?? [];
}

/**
 * Fills every empty step whose option list has exactly one value (e.g. angle "90" for 90° elbows).
 * Call after user changes; merge result into hierarchy state so findEntryByHierarchy resolves.
 */
export function expandHierarchyStateWithAutoFills(categoryId, entries, hierarchyState) {
  const steps = getHierarchyForCategory(categoryId);
  if (!steps.length || !entries?.length) return { ...hierarchyState };
  let state = { ...hierarchyState };
  let changed = true;
  while (changed) {
    changed = false;
    for (const step of steps) {
      const k = step.key;
      if (state[k] !== undefined && state[k] !== "") continue;
      const opts = getOptionsForStep(entries, state, categoryId, k);
      if (opts.length === 1) {
        state[k] = opts[0];
        changed = true;
      }
    }
  }
  return state;
}

/**
 * Returns true if `expanded` differs from `state` on any key (for auto-fill commit).
 */
export function hierarchyStateDiffers(state, expanded) {
  if (!expanded) return false;
  const keys = new Set([...Object.keys(state), ...Object.keys(expanded)]);
  for (const k of keys) {
    if ((state[k] ?? "") !== (expanded[k] ?? "")) return true;
  }
  return false;
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
