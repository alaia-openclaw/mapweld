import { WELD_TYPES, NDT_REQUIRED_OPTIONS } from "./constants";
import { createDefaultJointDimensions } from "./joint-dimensions";

export const DEFAULT_DRAWING_SETTINGS = {
  ndtRequirements: [],
  weldingSpec: "",
};

export function createDefaultWeldingRecord() {
  return {
    id: `wr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    welderIds: [],
    wqrIds: [],
    welderName: "",
    weldingProcesses: [],
    electrodeNumbers: [""],
    date: "",
  };
}

export function createDefaultDrawing(overrides = {}) {
  return {
    id: `dwg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    filename: "",
    pdfBase64: "",
    revision: "",
    lineIds: [],
    ...overrides,
  };
}

export function createDefaultSystem(overrides = {}) {
  return {
    id: `sys-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name: "",
    description: "",
    /** Default WPS code for lines/welds under this system (inheritance). */
    wps: "",
    /** Optional NDT % overrides; merged per method with project → line (see ndt-resolution). */
    ndtRequirements: [],
    ...overrides,
  };
}

export function createDefaultLine(overrides = {}) {
  return {
    id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    systemId: null,
    name: "",
    /** Default WPS code for welds on this line (overrides system; weld can override further). */
    wps: "",
    fluidType: "",
    pressure: "",
    diameterRange: "",
    thickness: "",
    material: "",
    drawingIds: [],
    /** Optional NDT % overrides; merged per method with project → system (see ndt-resolution). */
    ndtRequirements: [],
    ...overrides,
  };
}

export function createDefaultSpool(overrides = {}) {
  return {
    id: `spool-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    lineId: null,
    /** Kanban stage: not_started | workshop | storage_area | painting | shipped */
    lifecycleStage: "not_started",
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
    catalogPartId: null,
    weightKg: null,
    variation: "",
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
    /** Optional id of project WPS library row — for retrieval / filtering (not required). */
    wpsLibraryEntryId: null,
    welderIds: [],
    weldingProcesses: [],
    weldingRecords: [],
    ndtRequired: NDT_REQUIRED_OPTIONS.AUTO,
    visualInspection: false,
    spoolId: null,
    labelFontSize: 12,
    lineBendXPercent: null,
    lineBendYPercent: null,
    /** Per-side NPS / schedule overrides; empty fields inherit from linked parts. */
    jointDimensions: createDefaultJointDimensions(),
    ...overrides,
  };
}
