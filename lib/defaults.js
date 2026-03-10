import { WELD_TYPES, NDT_REQUIRED_OPTIONS } from "./constants";

export const DEFAULT_DRAWING_SETTINGS = {
  ndtRequirements: [],
  weldingSpec: "",
};

export function createDefaultWeldingRecord() {
  return {
    id: `wr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    welderIds: [],
    welderName: "",
    weldingProcesses: [],
    electrodeNumbers: [""],
    date: "",
  };
}

export function createDefaultSpool(overrides = {}) {
  return {
    id: `spool-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name: "",
    dimX: "",
    dimY: "",
    dimZ: "",
    weight: "",
    pressureTestValue: "",
    pressureTestUnit: "bar",
    ...overrides,
  };
}

export function createDefaultPart(overrides = {}) {
  return {
    id: `part-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    displayNumber: 1,
    partType: "",
    nps: "",
    thickness: "",
    materialGrade: "",
    length: "",
    spoolId: null,
    heatNumber: "",
    ...overrides,
  };
}

export function createDefaultWeld(overrides = {}) {
  return {
    weldType: WELD_TYPES.BUTT,
    weldLocation: "shop",
    welderName: "",
    weldingDate: "",
    fitterName: "",
    dateFitUp: "",
    heatNumber1: "",
    heatNumber2: "",
    partId1: null,
    partId2: null,
    electrodeNumbers: [""],
    wps: "",
    welderIds: [],
    weldingProcesses: [],
    weldingRecords: [],
    ndtRequired: NDT_REQUIRED_OPTIONS.AUTO,
    visualInspection: false,
    spoolId: null,
    labelFontSize: 12,
    lineBendXPercent: null,
    lineBendYPercent: null,
    ...overrides,
  };
}
