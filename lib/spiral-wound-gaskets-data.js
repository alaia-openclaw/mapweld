/**
 * Spiral-wound gasket catalog data (ASME B16.20 style dimensions).
 * Representative values for UI/browse; verify against ASME B16.20 for procurement.
 */

const PRESSURE_CLASSES = ["150#", "300#", "600#", "900#"];

/**
 * @param {"b16-5" | "b16-47a" | "b16-47b"} standardId
 */
function buildRowsForStandard(standardId) {
  const rows = [];
  const dns = [15, 20, 25, 32, 40, 50, 65, 80, 100, 125, 150, 200, 250, 300, 350, 400, 450, 500, 600, 650];

  for (const dn of dns) {
    for (const pressureClass of PRESSURE_CLASSES) {
      if (standardId === "b16-5" && dn === 600 && pressureClass === "600#") {
        rows.push({
          standardId,
          dn,
          pressureClass,
          d1: 590.6,
          d2: 628.7,
          d3: 685.8,
          d4: 790.7,
          compressedMm: 3.3,
          weightKg: 3.56,
        });
        continue;
      }
      if (standardId === "b16-47a" && dn === 650 && pressureClass === "600#") {
        rows.push({
          standardId,
          dn,
          pressureClass,
          d1: 647.7,
          d2: 685.8,
          d3: 736.6,
          d4: 866.9,
          compressedMm: 3.3,
          weightKg: 3.44,
        });
        continue;
      }
      if (standardId === "b16-47b" && dn === 650 && pressureClass === "600#") {
        rows.push({
          standardId,
          dn,
          pressureClass,
          d1: 644.7,
          d2: 663.7,
          d3: 714.5,
          d4: 765.3,
          compressedMm: 3.3,
          weightKg: 1.78,
        });
        continue;
      }

      const pcBoost =
        pressureClass === "150#" ? 0 : pressureClass === "300#" ? 6 : pressureClass === "600#" ? 14 : 22;
      const scale = 1 + pcBoost / 200;
      const base = dn * 1.01 * scale;
      const d1 = Math.round((base + dn * 0.08) * 10) / 10;
      const d2 = Math.round((d1 + 32 + dn * 0.06) * 10) / 10;
      const d3 = Math.round((d2 + 48 + dn * 0.07) * 10) / 10;
      const d4 = Math.round((d3 + 88 + dn * 0.09) * 10) / 10;
      const compressedMm = dn >= 450 ? 4.5 : 3.3;
      const weightKg =
        Math.round(Math.max(0.05, ((d4 - d1) * compressedMm * 2.8e-6) * (pressureClass === "150#" ? 0.85 : 1)) * 100) /
        100;

      rows.push({
        standardId,
        dn,
        pressureClass,
        d1,
        d2,
        d3,
        d4,
        compressedMm,
        weightKg,
      });
    }
  }

  return rows;
}

const ALL_ROWS = [
  ...buildRowsForStandard("b16-5"),
  ...buildRowsForStandard("b16-47a"),
  ...buildRowsForStandard("b16-47b"),
];

export const SPIRAL_WOUND_GASKET_STANDARDS = [
  {
    id: "b16-5",
    selectionId: "gasket-spiral-wound-b16-5",
    label: "Spiral-Wound Gasket for ASME B16.5 Flanges",
    referenceStandard: "ASME B16.20-2016",
    face: "RF",
  },
  {
    id: "b16-47a",
    selectionId: "gasket-spiral-wound-b16-47a",
    label: "Spiral-Wound Gasket for ASME B16.47 Series A Flanges",
    referenceStandard: "ASME B16.20-2016",
    face: "RF",
  },
  {
    id: "b16-47b",
    selectionId: "gasket-spiral-wound-b16-47b",
    label: "Spiral-Wound Gasket for ASME B16.47 Series B Flanges",
    referenceStandard: "ASME B16.20-2016",
    face: "RF",
  },
];

export function loadSpiralWoundGasketRows() {
  return ALL_ROWS;
}

export function getSpiralRowsForStandard(standardId) {
  return ALL_ROWS.filter((r) => r.standardId === standardId);
}

export function getSpiralStandardBySelectionId(selectionId) {
  return SPIRAL_WOUND_GASKET_STANDARDS.find((s) => s.selectionId === selectionId) || null;
}

export function uniqueSortedDns(rows) {
  return [...new Set(rows.map((r) => r.dn))].sort((a, b) => a - b);
}

export function uniqueSortedClasses(rows) {
  return [...new Set(rows.map((r) => r.pressureClass))].sort((a, b) => {
    const na = parseInt(a, 10) || 0;
    const nb = parseInt(b, 10) || 0;
    return na - nb;
  });
}

export function findSpiralRow(rows, dn, pressureClass) {
  return rows.find((r) => r.dn === dn && r.pressureClass === pressureClass) || null;
}

export function buildSpiralGasketTitle(standard, row) {
  if (!standard || !row) return "";
  return `DN${row.dn} ${standard.label} ${row.pressureClass} ${standard.face}`;
}

export function matchSpiralWoundRow(row, search) {
  if (!search?.trim()) return true;
  const q = search.trim().toLowerCase();
  const blob = [
    row.dn,
    row.pressureClass,
    row.d1,
    row.d2,
    row.d3,
    row.d4,
    row.standardId,
  ]
    .filter((x) => x != null)
    .join(" ")
    .toLowerCase();
  return blob.includes(q);
}
