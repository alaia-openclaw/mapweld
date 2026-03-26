/**
 * Buttwelded valves catalog (ASME B16.10 end-to-end / reference dimensions).
 * Representative UI data; verify against vendor drawings and ASME B16.10 for procurement.
 */

export const BUTTWELDED_VALVE_DNS = [50, 65, 80, 100, 125, 150, 200, 250, 300, 350, 400];
export const BUTTWELDED_VALVE_PRESSURE_CLASSES = ["150#", "300#", "600#", "900#"];

const DNS = BUTTWELDED_VALVE_DNS;
const PRESSURE_CLASSES = BUTTWELDED_VALVE_PRESSURE_CLASSES;

export const BUTTWELDED_VALVE_TYPES = [
  {
    id: "gate",
    selectionId: "valves-buttwelded-gate",
    label: "Buttwelded Gate Valve",
    referenceStandard: "ASME B16.10-2017",
    weightNote: "Weight based on 'SLB' valves",
  },
  {
    id: "globe",
    selectionId: "valves-buttwelded-globe",
    label: "Buttwelded Globe Valve",
    referenceStandard: "ASME B16.10-2017",
    weightNote: "Weight based on 'SLB' valves",
  },
  {
    id: "ball",
    selectionId: "valves-buttwelded-ball",
    label: "Buttwelded Ball Valve",
    referenceStandard: "ASME B16.10-2017",
    weightNote: "Weight based on 'SLB' reduced bore valves",
  },
  {
    id: "swing-check",
    selectionId: "valves-buttwelded-swing-check",
    label: "Buttwelded Swing Check Valve",
    referenceStandard: "ASME B16.10-2017",
    weightNote: "Weight based on 'SLB' valves",
  },
];

function scale(n, ref, val) {
  return Math.round(val * (n / ref) * 100) / 100;
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
        const isAnchor = dn === 250 && pressureClass === "600#";
        const w = isAnchor
          ? 529
          : Math.round(22 * Math.pow(dn / 100, 2.05) * (pressureClass === "150#" ? 0.35 : 1));
        const dims = isAnchor
          ? { handwheelDia: 640, stemToCL: 1279, faceToFace: 510 }
          : {
              handwheelDia: scale(dn, 250, 640),
              stemToCL: scale(dn, 250, 1279),
              faceToFace: scale(dn, 250, 510),
            };
        pushRow(dn, pressureClass, w, dims);
      }
    }
  } else if (valveTypeId === "globe") {
    for (const dn of DNS) {
      for (const pressureClass of PRESSURE_CLASSES) {
        const isAnchor = dn === 250 && pressureClass === "600#";
        const w = isAnchor
          ? 595
          : Math.round(24 * Math.pow(dn / 100, 2.08) * (pressureClass === "150#" ? 0.35 : 1));
        const dims = isAnchor
          ? { handwheelDia: 560, stemToCL: 1411, faceToFace: 787 }
          : {
              handwheelDia: scale(dn, 250, 560),
              stemToCL: scale(dn, 250, 1411),
              faceToFace: scale(dn, 250, 787),
            };
        pushRow(dn, pressureClass, w, dims);
      }
    }
  } else if (valveTypeId === "ball") {
    for (const dn of DNS) {
      for (const pressureClass of PRESSURE_CLASSES) {
        const isAnchor = dn === 250 && pressureClass === "600#";
        const w = isAnchor
          ? 565
          : Math.round(23 * Math.pow(dn / 100, 2.12) * (pressureClass === "150#" ? 0.35 : 1));
        const dims = isAnchor
          ? { offset395: 395, faceToFace: 787, offset133: 133, height460: 460, handwheelDia: 635 }
          : {
              offset395: scale(dn, 250, 395),
              faceToFace: scale(dn, 250, 787),
              offset133: scale(dn, 250, 133),
              height460: scale(dn, 250, 460),
              handwheelDia: scale(dn, 250, 635),
            };
        pushRow(dn, pressureClass, w, dims);
      }
    }
  } else if (valveTypeId === "swing-check") {
    for (const dn of DNS) {
      for (const pressureClass of PRESSURE_CLASSES) {
        const isAnchor = dn === 250 && pressureClass === "600#";
        const w = isAnchor
          ? 534
          : Math.round(22 * Math.pow(dn / 100, 1.95) * (pressureClass === "150#" ? 0.4 : 1));
        const dims = isAnchor
          ? { faceToFace: 711, height483: 483 }
          : { faceToFace: scale(dn, 250, 711), height483: scale(dn, 250, 483) };
        pushRow(dn, pressureClass, w, dims);
      }
    }
  }

  return rows;
}

const ALL_ROWS = BUTTWELDED_VALVE_TYPES.flatMap((t) => buildRowsForValveType(t.id));

export function getButtweldedValveRowsForType(valveTypeId) {
  return ALL_ROWS.filter((r) => r.valveTypeId === valveTypeId);
}

export function getButtweldedValveTypeBySelectionId(selectionId) {
  return BUTTWELDED_VALVE_TYPES.find((t) => t.selectionId === selectionId) || null;
}

export function matchButtweldedValveRow(row, search) {
  if (!search?.trim()) return true;
  const q = search.trim().toLowerCase();
  const blob = [row.dn, row.pressureClass, row.weightKg].join(" ").toLowerCase();
  return blob.includes(q);
}

export function buildButtweldedValveTitle(typeDef, row) {
  if (!typeDef || !row) return "";
  return `DN${row.dn} ${typeDef.label} ${row.pressureClass}`;
}
