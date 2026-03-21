/**
 * Flanged valves catalog (ASME B16.10 style face-to-face / reference dimensions).
 * Representative data for UI; verify against vendor drawings and ASME B16.10 for procurement.
 */

export const FLANGED_VALVE_DNS = [50, 65, 80, 100, 125, 150, 200, 250, 300, 350, 400];
export const FLANGED_VALVE_PRESSURE_CLASSES = ["150#", "300#", "600#", "900#"];
export const FLANGED_VALVE_FACE_TYPES = ["RF", "FF", "RTJ"];
export const FLANGED_VALVE_ACTUATORS = ["Lever", "Gear"];

const DNS = FLANGED_VALVE_DNS;
const PRESSURE_CLASSES = FLANGED_VALVE_PRESSURE_CLASSES;
const FACE_TYPES = FLANGED_VALVE_FACE_TYPES;
const ACTUATORS = FLANGED_VALVE_ACTUATORS;

export const FLANGED_VALVE_TYPES = [
  {
    id: "gate",
    selectionId: "valves-flanged-gate",
    label: "Flanged Gate Valve",
    toolbar: "face",
    referenceStandard: "ASME B16.10-2017",
    weightNote: "Weight based on 'SLB' valves",
  },
  {
    id: "globe",
    selectionId: "valves-flanged-globe",
    label: "Flanged Globe Valve",
    toolbar: "face",
    referenceStandard: "ASME B16.10-2017",
    weightNote: "Weight based on 'SLB' valves",
  },
  {
    id: "ball",
    selectionId: "valves-flanged-ball",
    label: "Flanged Ball Valve",
    toolbar: "face",
    referenceStandard: "ASME B16.10-2017",
    weightNote: "Weight based on 'SLB' valves",
  },
  {
    id: "control",
    selectionId: "valves-flanged-control",
    label: "Control Valve",
    toolbar: "face",
    referenceStandard: "ASME B16.10-2017",
    dimNote: "Control Dimensions are Approximate",
  },
  {
    id: "swing-check",
    selectionId: "valves-flanged-swing-check",
    label: "Flanged Swing Check Valve",
    toolbar: "face",
    referenceStandard: "ASME B16.10-2017",
    weightNote: "Weight based on 'SLB' check valves",
  },
  {
    id: "wafer-check",
    selectionId: "valves-flanged-wafer-check",
    label: "Flanged Wafer Check Valve",
    toolbar: "face",
    referenceStandard: "ASME B16.10-2017",
    weightNote: null,
  },
  {
    id: "wafer-butterfly",
    selectionId: "valves-flanged-wafer-butterfly",
    label: "Wafer Type Butterfly Valve",
    toolbar: "actuator",
    referenceStandard: "ASME B16.10-2017",
    extraNotes: [
      "Steel Offset Seat Style",
      "Only the face-to-face dimension is standardized by ASME",
      'Stud Bolts: 16qty x M33 (or 1+1/4" UNC) x 350 Long',
    ],
  },
  {
    id: "lug-butterfly",
    selectionId: "valves-flanged-lug-butterfly",
    label: "Lug Type Butterfly Valve",
    toolbar: "actuator",
    referenceStandard: "ASME B16.10-2017",
    extraNotes: [
      "Steel Offset Seat Style",
      "Only the face-to-face dimension is standardized by ASME",
      'Bolts: 16qty x M33 (or 1+1/4" UNC)',
    ],
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

  function pushFaceRow(dn, pressureClass, faceType, weightKg, dims) {
    rows.push({
      valveTypeId,
      dn,
      pressureClass,
      faceType,
      actuator: null,
      weightKg,
      dims,
    });
  }

  function pushActRow(dn, pressureClass, actuator, weightKg, dims) {
    rows.push({
      valveTypeId,
      dn,
      pressureClass,
      faceType: null,
      actuator,
      weightKg,
      dims,
    });
  }

  if (valveTypeId === "gate") {
    for (const dn of DNS) {
      for (const pressureClass of PRESSURE_CLASSES) {
        for (const faceType of FACE_TYPES) {
          const isAnchor = dn === 300 && pressureClass === "600#" && faceType === "RF";
          const w = isAnchor ? 981 : Math.round(40 * Math.pow(dn / 100, 2.2) * (pressureClass === "150#" ? 0.35 : 1));
          const dims = isAnchor
            ? { handwheelH: 680, stemToCL: 1468, faceToFace: 838 }
            : {
                handwheelH: scale(dn, 300, 680),
                stemToCL: scale(dn, 300, 1468),
                faceToFace: scale(dn, 300, 838),
              };
          pushFaceRow(dn, pressureClass, faceType, w, dims);
        }
      }
    }
  } else if (valveTypeId === "globe") {
    for (const dn of DNS) {
      for (const pressureClass of PRESSURE_CLASSES) {
        for (const faceType of FACE_TYPES) {
          const isAnchor = dn === 300 && pressureClass === "600#" && faceType === "RF";
          const w = isAnchor ? 900 : Math.round(38 * Math.pow(dn / 100, 2.15) * (pressureClass === "150#" ? 0.35 : 1));
          const dims = isAnchor
            ? { handwheelDia: 560, stemToCL: 1468, faceToFace: 838 }
            : {
                handwheelDia: scale(dn, 300, 560),
                stemToCL: scale(dn, 300, 1468),
                faceToFace: scale(dn, 300, 838),
              };
          pushFaceRow(dn, pressureClass, faceType, w, dims);
        }
      }
    }
  } else if (valveTypeId === "ball") {
    for (const dn of DNS) {
      for (const pressureClass of PRESSURE_CLASSES) {
        for (const faceType of FACE_TYPES) {
          const isAnchor = dn === 300 && pressureClass === "600#" && faceType === "RF";
          const w = isAnchor ? 1339 : Math.round(55 * Math.pow(dn / 100, 2.25) * (pressureClass === "150#" ? 0.35 : 1));
          const dims = isAnchor
            ? { offset395: 395, faceToFace: 838, offset133: 133, height710: 710, handwheelDia: 635 }
            : {
                offset395: scale(dn, 300, 395),
                faceToFace: scale(dn, 300, 838),
                offset133: scale(dn, 300, 133),
                height710: scale(dn, 300, 710),
                handwheelDia: scale(dn, 300, 635),
              };
          pushFaceRow(dn, pressureClass, faceType, w, dims);
        }
      }
    }
  } else if (valveTypeId === "control") {
    for (const dn of DNS) {
      for (const pressureClass of PRESSURE_CLASSES) {
        for (const faceType of FACE_TYPES) {
          const isAnchor = dn === 250 && pressureClass === "600#" && faceType === "RF";
          const w = isAnchor ? 852 : Math.round(45 * Math.pow(dn / 100, 2.1) * (pressureClass === "150#" ? 0.4 : 1));
          const dims = isAnchor
            ? { topWidth: 635, height: 1625.6, faceToFace: 850.9 }
            : {
                topWidth: scale(dn, 250, 635),
                height: scale(dn, 250, 1625.6),
                faceToFace: scale(dn, 250, 850.9),
              };
          pushFaceRow(dn, pressureClass, faceType, w, dims);
        }
      }
    }
  } else if (valveTypeId === "swing-check") {
    for (const dn of DNS) {
      for (const pressureClass of PRESSURE_CLASSES) {
        for (const faceType of FACE_TYPES) {
          const isAnchor = dn === 250 && pressureClass === "600#" && faceType === "RF";
          const w = isAnchor ? 628 : Math.round(28 * Math.pow(dn / 100, 2) * (pressureClass === "150#" ? 0.4 : 1));
          const dims = isAnchor
            ? { faceToFace: 787, height483: 483 }
            : { faceToFace: scale(dn, 250, 787), height483: scale(dn, 250, 483) };
          pushFaceRow(dn, pressureClass, faceType, w, dims);
        }
      }
    }
  } else if (valveTypeId === "wafer-check") {
    for (const dn of DNS) {
      for (const pressureClass of PRESSURE_CLASSES) {
        for (const faceType of FACE_TYPES) {
          const isAnchor = dn === 250 && pressureClass === "600#" && faceType === "RF";
          const w = isAnchor ? 117 : Math.round(8 * Math.pow(dn / 100, 1.6) * (pressureClass === "150#" ? 0.5 : 1));
          const dims = isAnchor
            ? { faceToFace: 213, id273: 273.05, od400: 400.05 }
            : {
                faceToFace: scale(dn, 250, 213),
                id273: scale(dn, 250, 273.05),
                od400: scale(dn, 250, 400.05),
              };
          pushFaceRow(dn, pressureClass, faceType, w, dims);
        }
      }
    }
  } else if (valveTypeId === "wafer-butterfly") {
    for (const dn of DNS) {
      for (const pressureClass of PRESSURE_CLASSES) {
        for (const actuator of ACTUATORS) {
          const isAnchor = dn === 250 && pressureClass === "600#" && actuator === "Lever";
          const w = isAnchor ? 113.18 : Math.round(12 * Math.pow(dn / 100, 1.7) * (actuator === "Gear" ? 1.25 : 1));
          const dims = isAnchor
            ? { lever450: 450, height285: 285, thickness117: 117 }
            : {
                lever450: scale(dn, 250, 450),
                height285: scale(dn, 250, 285),
                thickness117: scale(dn, 250, 117),
              };
          pushActRow(dn, pressureClass, actuator, w, dims);
        }
      }
    }
  } else if (valveTypeId === "lug-butterfly") {
    for (const dn of DNS) {
      for (const pressureClass of PRESSURE_CLASSES) {
        for (const actuator of ACTUATORS) {
          const isAnchor = dn === 250 && pressureClass === "600#" && actuator === "Lever";
          const w = isAnchor ? 181 : Math.round(18 * Math.pow(dn / 100, 1.75) * (actuator === "Gear" ? 1.3 : 1));
          const dims = isAnchor
            ? { diag495: 495, lever304: 304, vert304: 304, thickness117: 117 }
            : {
                diag495: scale(dn, 250, 495),
                lever304: scale(dn, 250, 304),
                vert304: scale(dn, 250, 304),
                thickness117: scale(dn, 250, 117),
              };
          pushActRow(dn, pressureClass, actuator, w, dims);
        }
      }
    }
  }

  return rows;
}

const ALL_ROWS = FLANGED_VALVE_TYPES.flatMap((t) => buildRowsForValveType(t.id));

export function getFlangedValveRowsForType(valveTypeId) {
  return ALL_ROWS.filter((r) => r.valveTypeId === valveTypeId);
}

export function getFlangedValveTypeBySelectionId(selectionId) {
  return FLANGED_VALVE_TYPES.find((t) => t.selectionId === selectionId) || null;
}

export function findFlangedValveRow(rows, { dn, pressureClass, faceType, actuator }) {
  return (
    rows.find(
      (r) =>
        r.dn === dn &&
        r.pressureClass === pressureClass &&
        (faceType != null ? r.faceType === faceType : r.actuator === actuator)
    ) || null
  );
}

export function matchFlangedValveRow(row, search) {
  if (!search?.trim()) return true;
  const q = search.trim().toLowerCase();
  const blob = [row.dn, row.pressureClass, row.faceType, row.actuator, row.weightKg]
    .filter((x) => x != null)
    .join(" ")
    .toLowerCase();
  return blob.includes(q);
}

export function buildFlangedValveTitle(typeDef, row) {
  if (!typeDef || !row) return "";
  if (typeDef.toolbar === "face") {
    return `DN${row.dn} ${typeDef.label} ${row.pressureClass} ${row.faceType}`;
  }
  return `DN${row.dn} ${typeDef.label} ${row.pressureClass}`;
}
