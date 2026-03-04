import { WELD_STATUS, WELD_TYPES, NDT_REQUIRED_OPTIONS } from "./constants";

export const DEFAULT_DRAWING_SETTINGS = {
  ndtPresetId: "",
  ndtPresetLabel: "",
  weldingSpec: "",
};

export function createDefaultWeld(overrides = {}) {
  return {
    status: WELD_STATUS.NOT_STARTED,
    weldType: WELD_TYPES.BUTT,
    welderName: "",
    weldingDate: "",
    fitterName: "",
    dateFitUp: "",
    partNumber1: "",
    partNumber2: "",
    heatNumber1: "",
    heatNumber2: "",
    ndtRequired: NDT_REQUIRED_OPTIONS.AUTO,
    visualInspection: false,
    spoolId: null,
    ...overrides,
  };
}
