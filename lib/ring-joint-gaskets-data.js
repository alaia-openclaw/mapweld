/**
 * Ring-joint gasket catalog (ASME B16.20). Representative dimensions for UI; verify for procurement.
 */

export const RING_JOINT_TYPES = [
  {
    id: "r",
    selectionId: "gasket-ring-joint-r",
    label: "Type R Ring Gasket",
    referenceStandard: "ASME B16.20-2016",
  },
  {
    id: "rx",
    selectionId: "gasket-ring-joint-rx",
    label: "Type RX Ring Gasket",
    referenceStandard: "ASME B16.20-2016",
  },
  {
    id: "bx",
    selectionId: "gasket-ring-joint-bx",
    label: "Type BX Ring Gasket",
    referenceStandard: "ASME B16.20-2016",
  },
];

/** @param {string} typeId */
function buildRowsForType(typeId) {
  /** @type {object[]} */
  const rows = [];

  if (typeId === "r") {
    const sizes = ["R-8", "R-9", "R-10", "R-11", "R-12", "R-13", "R-14", "R-15"];
    for (const code of sizes) {
      const n = parseInt(code.replace("R-", ""), 10) || 11;
      const scale = n / 11;
      const isAnchor = code === "R-11";
      rows.push({
        typeId,
        sizeCode: code,
        weightKg: isAnchor ? 0.03 : Math.round(0.03 * scale * scale * 1000) / 1000,
        octBaseWidth: isAnchor ? 6.35 : Math.round(6.35 * scale * 100) / 100,
        octCenterline: isAnchor ? 34.14 : Math.round(34.14 * scale * 100) / 100,
        octHeight: isAnchor ? 9.7 : Math.round(9.7 * scale * 10) / 10,
        octTopFlat: isAnchor ? 4.32 : Math.round(4.32 * scale * 100) / 100,
        octRad: 1.5,
        octAngle: 23,
        ovalWidth: isAnchor ? 6.35 : Math.round(6.35 * scale * 100) / 100,
        ovalCenterline: isAnchor ? 34.14 : Math.round(34.14 * scale * 100) / 100,
        ovalHeight: isAnchor ? 11.2 : Math.round(11.2 * scale * 10) / 10,
      });
    }
  } else if (typeId === "rx") {
    const sizes = ["RX-15", "RX-18", "RX-20", "RX-24", "RX-27", "RX-31", "RX-35"];
    for (const code of sizes) {
      const n = parseInt(code.replace("RX-", ""), 10) || 20;
      const scale = n / 20;
      const isAnchor = code === "RX-20";
      rows.push({
        typeId,
        sizeCode: code,
        weightKg: isAnchor ? 0.24 : Math.round(0.24 * scale * scale * 100) / 100,
        topFlat: isAnchor ? 4.62 : Math.round(4.62 * scale * 100) / 100,
        heightTotal: isAnchor ? 19.05 : Math.round(19.05 * scale * 100) / 100,
        taperH: isAnchor ? 3.18 : Math.round(3.18 * scale * 100) / 100,
        sectionW: isAnchor ? 8.74 : Math.round(8.74 * scale * 100) / 100,
        angleDeg: 23,
        cornerRad: 1.5,
        innerD: isAnchor ? 58.72 : Math.round(58.72 * scale * 100) / 100,
        outerD: isAnchor ? 76.2 : Math.round(76.2 * scale * 100) / 100,
      });
    }
  } else {
    for (let d = -2; d <= 3; d += 1) {
      const num = 150 + d;
      const code = `BX-${num}`;
      const isAnchor = code === "BX-150";
      const scale = isAnchor ? 1 : 1 + d * 0.012;
      rows.push({
        typeId,
        sizeCode: code,
        weightKg: isAnchor ? 0.13 : Math.round(0.13 * scale * scale * 1000) / 1000,
        od: isAnchor ? 72.19 : Math.round(72.19 * scale * 100) / 100,
        id: isAnchor ? 53.59 : Math.round(53.59 * scale * 100) / 100,
        height: isAnchor ? 9.3 : Math.round(9.3 * scale * 100) / 100,
        profileW: isAnchor ? 9.3 : Math.round(9.3 * scale * 100) / 100,
        flatW: isAnchor ? 7.98 : Math.round(7.98 * scale * 100) / 100,
        angleDeg: 23,
        filletRad: isAnchor ? 0.93 : Math.round(0.93 * scale * 100) / 100,
        holeDia: 1.5,
      });
    }
  }

  return rows;
}

const ALL_ROWS = [...buildRowsForType("r"), ...buildRowsForType("rx"), ...buildRowsForType("bx")];

export function loadRingJointRows() {
  return ALL_ROWS;
}

export function getRingRowsForType(typeId) {
  return ALL_ROWS.filter((r) => r.typeId === typeId);
}

export function getRingJointTypeBySelectionId(selectionId) {
  return RING_JOINT_TYPES.find((t) => t.selectionId === selectionId) || null;
}

export function findRingRow(rows, sizeCode) {
  return rows.find((r) => r.sizeCode === sizeCode) || null;
}

export function matchRingJointRow(row, search) {
  if (!search?.trim()) return true;
  const q = search.trim().toLowerCase();
  const blob = [row.sizeCode, row.typeId, row.weightKg].join(" ").toLowerCase();
  return blob.includes(q);
}

export function buildRingJointTitle(typeDef, row) {
  if (!typeDef || !row) return "";
  return `${typeDef.label} ${row.sizeCode}`;
}
