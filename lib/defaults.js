import { WELD_TYPES, NDT_REQUIRED_OPTIONS } from "./constants";

export const DEFAULT_DRAWING_SETTINGS = {
  ndtRequirements: [],
  weldingSpec: "",
};

export function createDefaultWeld(overrides = {}) {
  return {
    weldType: WELD_TYPES.BUTT,
    weldLocation: "shop",
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
