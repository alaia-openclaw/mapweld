/** Weld status workflow */
export const WELD_STATUS = {
  NOT_STARTED: "not_started",
  WELDED: "welded",
  NDT_COMPLETE: "ndt_complete",
  FINALIZED: "finalized",
};

export const WELD_STATUS_LABELS = {
  [WELD_STATUS.NOT_STARTED]: "Not started",
  [WELD_STATUS.WELDED]: "Welded",
  [WELD_STATUS.NDT_COMPLETE]: "NDT complete",
  [WELD_STATUS.FINALIZED]: "Finalized",
};

/** Weld point types (shape/icon) */
export const WELD_TYPES = {
  BUTT: "butt",
  FILLET: "fillet",
  SOCKET: "socket",
  TEE: "tee",
  LAP: "lap",
};

export const WELD_TYPE_LABELS = {
  [WELD_TYPES.BUTT]: "Butt",
  [WELD_TYPES.FILLET]: "Fillet",
  [WELD_TYPES.SOCKET]: "Socket",
  [WELD_TYPES.TEE]: "Tee",
  [WELD_TYPES.LAP]: "Lap",
};

/** Shop vs field weld location */
export const WELD_LOCATION = {
  SHOP: "shop",
  FIELD: "field",
};

export const WELD_LOCATION_LABELS = {
  [WELD_LOCATION.SHOP]: "Shop",
  [WELD_LOCATION.FIELD]: "Field",
};

/** NDT requirement options for weld */
export const NDT_REQUIRED_OPTIONS = {
  YES: "yes",
  NO: "no",
  AUTO: "auto",
};

export const NDT_REQUIRED_LABELS = {
  [NDT_REQUIRED_OPTIONS.YES]: "Yes",
  [NDT_REQUIRED_OPTIONS.NO]: "No",
  [NDT_REQUIRED_OPTIONS.AUTO]: "Auto (from drawing)",
};

/** NDT override options per method (exempt = not required, required = must do) */
export const NDT_OVERRIDE_OPTIONS = {
  AUTO: "",
  EXEMPT: "exempt",
  REQUIRED: "required",
};

export const NDT_OVERRIDE_LABELS = {
  [NDT_OVERRIDE_OPTIONS.AUTO]: "Auto",
  [NDT_OVERRIDE_OPTIONS.EXEMPT]: "Excluded",
  [NDT_OVERRIDE_OPTIONS.REQUIRED]: "Required",
};

/** NDT methods for drawing-level requirements */
export const NDT_METHODS = ["VT", "MPI", "RT", "UT"];

export const NDT_METHOD_LABELS = {
  VT: "Visual inspection",
  MPI: "MPI",
  RT: "RT",
  UT: "UT",
};

/** Drawing-level NDT presets (quick select) */
export const DRAWING_NDT_PRESETS = [
  { id: "10_pct_mpi", label: "10% MPI", pct: 10, method: "MPI" },
  { id: "100_pct_mpi", label: "100% MPI", pct: 100, method: "MPI" },
  { id: "10_pct_rt", label: "10% RT", pct: 10, method: "RT" },
  { id: "100_pct_rt", label: "100% RT", pct: 100, method: "RT" },
  { id: "100_pct_ut", label: "100% UT", pct: 100, method: "UT" },
  { id: "vt_only", label: "VT only", pct: 100, method: "VT" },
];

/** Welding processes */
export const WELDING_PROCESSES = ["GTAW", "SMAW", "FCAW", "GMAW", "SAW", "PAW", "Other"];

export const WELDING_PROCESS_LABELS = {
  GTAW: "GTAW",
  SMAW: "SMAW",
  FCAW: "FCAW",
  GMAW: "GMAW",
  SAW: "SAW",
  PAW: "PAW",
  Other: "Other",
};

/** Format ndtRequirements for display (e.g. weld form auto label) */
export function formatNdtRequirements(ndtRequirements = []) {
  if (ndtRequirements.length === 0) return "";
  return ndtRequirements
    .map((r) => `${r.pct}% ${r.method}`)
    .join(", ");
}
