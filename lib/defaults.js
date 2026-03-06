import { WELD_TYPES, NDT_REQUIRED_OPTIONS } from "./constants";

export const DEFAULT_DRAWING_SETTINGS = {
  ndtRequirements: [],
  weldingSpec: "",
};

export function createDefaultWeldingRecord() {
  return {
    id: `wr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    welderIds: [],
    weldingProcesses: [],
    electrodeNumbers: [""],
    date: "",
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
    heatNumber: "",
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
