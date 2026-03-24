/**
 * Nonmetallic flat gasket catalog data (ASME B16.21 style dimensions).
 * Values are representative for UI/browse; verify against project specs for procurement.
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
      if (standardId === "b16-5" && dn === 40 && pressureClass === "600#") {
        rows.push({
          standardId,
          dn,
          pressureClass,
          innerMm: 48,
          outerMm: 95,
          thicknessMm: 1.6,
          weightKg: 0.02,
        });
        continue;
      }
      if (standardId === "b16-47a" && dn === 650 && pressureClass === "600#") {
        rows.push({
          standardId,
          dn,
          pressureClass,
          innerMm: 660,
          outerMm: 867,
          thicknessMm: 3,
          weightKg: 0.85,
        });
        continue;
      }
      if (standardId === "b16-47b" && dn === 650 && pressureClass === "600#") {
        rows.push({
          standardId,
          dn,
          pressureClass,
          innerMm: 660,
          outerMm: 765,
          thicknessMm: 3,
          weightKg: 0.85,
        });
        continue;
      }

      let innerMm;
      let outerMm;
      const thicknessMm = dn >= 300 ? 3 : dn >= 100 ? 2.4 : 1.6;
      let weightKg;

      if (standardId === "b16-5") {
        innerMm = Math.round(dn * 1.05 + 6);
        const classBoost =
          pressureClass === "150#" ? 0 : pressureClass === "300#" ? 4 : pressureClass === "600#" ? 8 : 14;
        outerMm = Math.round(dn * 1.35 + 42 + classBoost);
        weightKg = Math.max(0.001, ((outerMm - innerMm) * thicknessMm * 1.2e-6) * 2.7);
      } else if (standardId === "b16-47a") {
        innerMm = Math.round(dn * 1.02 + 8);
        outerMm = Math.round(dn * 1.28 + 52);
        if (dn >= 650) outerMm = Math.round(innerMm * 1.315);
        weightKg = Math.max(0.01, ((outerMm - innerMm) * thicknessMm * 1.1e-6) * 2.5);
      } else {
        innerMm = Math.round(dn * 1.02 + 8);
        outerMm = Math.round(dn * 1.22 + 48);
        if (dn >= 650) outerMm = Math.round(innerMm * 1.16);
        weightKg = Math.max(0.01, ((outerMm - innerMm) * thicknessMm * 1.1e-6) * 2.5);
      }

      rows.push({
        standardId,
        dn,
        pressureClass,
        innerMm,
        outerMm,
        thicknessMm,
        weightKg: Math.round(weightKg * 1000) / 1000,
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

export const NONMETALLIC_FLAT_GASKET_STANDARDS = [
  {
    id: "b16-5",
    selectionId: "gasket-nonmetallic-flat-b16-5",
    label: "Nonmetallic Flat Gasket for ASME B16.5 Flanges",
    shortTitle: "ASME B16.5",
    referenceStandard: "ASME B16.21-2016",
    face: "RF",
  },
  {
    id: "b16-47a",
    selectionId: "gasket-nonmetallic-flat-b16-47a",
    label: "Nonmetallic Flat Gasket for ASME B16.47 Series A Flanges",
    shortTitle: "ASME B16.47 Series A",
    referenceStandard: "ASME B16.21-2016",
    face: "RF",
  },
  {
    id: "b16-47b",
    selectionId: "gasket-nonmetallic-flat-b16-47b",
    label: "Nonmetallic Flat Gasket for ASME B16.47 Series B Flanges",
    shortTitle: "ASME B16.47 Series B",
    referenceStandard: "ASME B16.21-2016",
    face: "RF",
  },
];

export function loadNonmetallicFlatGasketRows() {
  return ALL_ROWS;
}

export function getStandardBySelectionId(selectionId) {
  return NONMETALLIC_FLAT_GASKET_STANDARDS.find((s) => s.selectionId === selectionId) || null;
}

export function getRowsForStandard(standardId) {
  return ALL_ROWS.filter((r) => r.standardId === standardId);
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

export function findGasketRow(rows, dn, pressureClass) {
  return rows.find((r) => r.dn === dn && r.pressureClass === pressureClass) || null;
}

export function buildGasketTitle(standard, row) {
  if (!standard || !row) return "";
  return `DN${row.dn} ${standard.label} ${row.pressureClass} ${standard.face}`;
}

export function matchNonmetallicFlatRow(row, search) {
  if (!search?.trim()) return true;
  const q = search.trim().toLowerCase();
  const blob = [
    row.dn,
    row.pressureClass,
    row.innerMm,
    row.outerMm,
    row.standardId,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return blob.includes(q);
}
