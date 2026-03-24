/**
 * Threaded valves — reference dimensions for catalog UI (Pipedata-style).
 * Footer "ASME Unadopted" matches reference; verify against standards / vendors for procurement.
 */

export const THREADED_VALVE_DNS = [15, 20, 25, 32, 40, 50, 65, 80, 100];
export const THREADED_VALVE_PRESSURE_CLASSES = ["150#", "300#", "600#", "800#"];

const DNS = THREADED_VALVE_DNS;
const PRESSURE_CLASSES = THREADED_VALVE_PRESSURE_CLASSES;

export const THREADED_VALVE_TYPES = [
  {
    id: "gate",
    selectionId: "valves-threaded-gate",
    label: "Threaded Gate Valve",
    referenceStandard: "ASME Unadopted",
  },
  {
    id: "globe",
    selectionId: "valves-threaded-globe",
    label: "Threaded Globe Valve",
    referenceStandard: "ASME Unadopted",
  },
  {
    id: "horizontal-check",
    selectionId: "valves-threaded-horizontal-check",
    label: "Horizontal Check Valve",
    referenceStandard: "ASME Unadopted",
  },
  {
    id: "vertical-check",
    selectionId: "valves-threaded-vertical-check",
    label: "Vertical Check Valve",
    referenceStandard: "ASME Unadopted",
  },
  {
    id: "ball",
    selectionId: "valves-threaded-ball",
    label: "Threaded Ball Valve",
    referenceStandard: "ASME Unadopted",
  },
];

function scale(n, ref, val) {
  return Math.round(val * (n / ref) * 100) / 100;
}

function weightScale(dn, refDn, pressureClass, baseKg) {
  const classFactor =
    pressureClass === "150#"
      ? 0.45
      : pressureClass === "300#"
        ? 0.65
        : pressureClass === "600#"
          ? 0.85
          : 1;
  return Math.round(baseKg * Math.pow(dn / refDn, 1.85) * classFactor * 10) / 10;
}

/**
 * @param {string} valveTypeId
 */
function buildRowsForValveType(valveTypeId) {
  /** @type {object[]} */
  const rows = [];

  function pushRow(dn, pressureClass, weightKg, dims) {
    rows.push({
      valveTypeId,
      dn,
      pressureClass,
      weightKg,
      dims,
    });
  }

  if (valveTypeId === "gate") {
    for (const dn of DNS) {
      for (const pressureClass of PRESSURE_CLASSES) {
        const isAnchor = dn === 50 && pressureClass === "800#";
        const w = isAnchor ? 8.4 : weightScale(dn, 50, pressureClass, 8.4);
        const dims = isAnchor
          ? { handwheelW: 146.05, heightCL: 258.76, endToEnd: 130.17 }
          : {
              handwheelW: scale(dn, 50, 146.05),
              heightCL: scale(dn, 50, 258.76),
              endToEnd: scale(dn, 50, 130.17),
            };
        pushRow(dn, pressureClass, w, dims);
      }
    }
  } else if (valveTypeId === "globe") {
    for (const dn of DNS) {
      for (const pressureClass of PRESSURE_CLASSES) {
        const isAnchor = dn === 50 && pressureClass === "800#";
        const w = isAnchor ? 11.4 : weightScale(dn, 50, pressureClass, 11.4);
        const dims = isAnchor
          ? { heightCL: 280.98, handwheelW: 152, endToEnd: 177.8 }
          : {
              heightCL: scale(dn, 50, 280.98),
              handwheelW: scale(dn, 50, 152),
              endToEnd: scale(dn, 50, 177.8),
            };
        pushRow(dn, pressureClass, w, dims);
      }
    }
  } else if (valveTypeId === "horizontal-check") {
    for (const dn of DNS) {
      for (const pressureClass of PRESSURE_CLASSES) {
        const isAnchor = dn === 50 && pressureClass === "800#";
        const w = isAnchor ? 14.5 : weightScale(dn, 50, pressureClass, 14.5);
        const dims = isAnchor
          ? { spanH: 228.6, heightV: 150.01 }
          : { spanH: scale(dn, 50, 228.6), heightV: scale(dn, 50, 150.01) };
        pushRow(dn, pressureClass, w, dims);
      }
    }
  } else if (valveTypeId === "vertical-check") {
    for (const dn of DNS) {
      for (const pressureClass of PRESSURE_CLASSES) {
        const isAnchor = dn === 50 && pressureClass === "800#";
        const w = isAnchor ? 7.8 : weightScale(dn, 50, pressureClass, 7.8);
        const dims = isAnchor
          ? { outerW: 139.7, bodyW: 77.78, totalH: 131.76 }
          : {
              outerW: scale(dn, 50, 139.7),
              bodyW: scale(dn, 50, 77.78),
              totalH: scale(dn, 50, 131.76),
            };
        pushRow(dn, pressureClass, w, dims);
      }
    }
  } else if (valveTypeId === "ball") {
    for (const dn of DNS) {
      for (const pressureClass of PRESSURE_CLASSES) {
        const isAnchor = dn === 50 && pressureClass === "800#";
        const w = isAnchor ? 9 : weightScale(dn, 50, pressureClass, 9);
        const dims = isAnchor
          ? { bodyLen: 160, handleLen: 260, handleH: 130 }
          : {
              bodyLen: scale(dn, 50, 160),
              handleLen: scale(dn, 50, 260),
              handleH: scale(dn, 50, 130),
            };
        pushRow(dn, pressureClass, w, dims);
      }
    }
  }

  return rows;
}

const ALL_ROWS = THREADED_VALVE_TYPES.flatMap((t) => buildRowsForValveType(t.id));

export function getThreadedValveRowsForType(valveTypeId) {
  return ALL_ROWS.filter((r) => r.valveTypeId === valveTypeId);
}

export function getThreadedValveTypeBySelectionId(selectionId) {
  return THREADED_VALVE_TYPES.find((t) => t.selectionId === selectionId) || null;
}

export function matchThreadedValveRow(row, search) {
  if (!search?.trim()) return true;
  const q = search.trim().toLowerCase();
  const blob = [row.dn, row.pressureClass, row.weightKg].join(" ").toLowerCase();
  return blob.includes(q);
}

export function buildThreadedValveTitle(typeDef, row) {
  if (!typeDef || !row) return "";
  return `DN${row.dn} ${typeDef.label} ${row.pressureClass}`;
}
