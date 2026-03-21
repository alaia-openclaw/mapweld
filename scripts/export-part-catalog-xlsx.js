/**
 * Build data/part-catalog-review.xlsx from data/part-catalog.json for category verification.
 * Run from project root: npm run export:part-catalog-xlsx
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as XLSX from "xlsx";
import { catalogHierarchyConfig } from "../lib/catalog-hierarchy.js";
import { CATEGORY_TREE, injectFlangeChildren } from "../lib/catalog-structure.js";
import { flangesStandards } from "../lib/flanges-config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const jsonPath = path.join(projectRoot, "data", "part-catalog.json");
const outPath = path.join(projectRoot, "data", "part-catalog-review.xlsx");

function mapUiLeafToCatalog(leafId) {
  const id = String(leafId ?? "");
  if (id.startsWith("flange-")) {
    return {
      mapsToCatalogCategory: id.slice("flange-".length),
      notes: "",
    };
  }
  if (id === "pipe") {
    return { mapsToCatalogCategory: "pipe", notes: "" };
  }
  if (id.startsWith("fittings-buttwelding-")) {
    return {
      mapsToCatalogCategory: "fittings-butt-weld",
      notes: "UI filters entries by subtype keyword in partTypeLabel.",
    };
  }
  if (id.startsWith("fittings-threaded-") || id.startsWith("fittings-socketwelded-")) {
    return {
      mapsToCatalogCategory: "",
      notes: "No catalog data yet (filter returns empty).",
    };
  }
  if (id === "gasket" || id === "valves" || id === "line-blanks") {
    return {
      mapsToCatalogCategory: "",
      notes: "Placeholder leaf; no part-catalog entries yet.",
    };
  }
  return { mapsToCatalogCategory: "", notes: "" };
}

function flattenUiTree(nodes, parentLabels = []) {
  const rows = [];
  for (const node of nodes) {
    const labels = [...parentLabels, node.label];
    if (node.children?.length) {
      rows.push(...flattenUiTree(node.children, labels));
    } else {
      const { mapsToCatalogCategory, notes } = mapUiLeafToCatalog(node.id);
      rows.push({
        path: labels.join(" / "),
        leafId: node.id,
        mapsToCatalogCategory,
        notes,
      });
    }
  }
  return rows;
}

function buildCategoriesSheet(categories, entries) {
  const byCat = new Map();
  for (const e of entries) {
    const c = e.catalogCategory;
    if (!byCat.has(c)) byCat.set(c, { count: 0, partTypes: new Set() });
    const agg = byCat.get(c);
    agg.count += 1;
    if (e.partTypeLabel) agg.partTypes.add(e.partTypeLabel);
  }

  return categories.map((cat) => {
    const agg = byCat.get(cat.id) ?? { count: 0, partTypes: new Set() };
    const steps = catalogHierarchyConfig[cat.id] ?? [];
    const hierarchyStepKeys = steps.map((s) => s.key).join("|");
    return {
      id: cat.id,
      label: cat.label,
      entryCount: agg.count,
      distinctPartTypes: agg.partTypes.size,
      hierarchyStepKeys,
    };
  });
}

function buildPartTypesSheet(categories, entries) {
  const labelById = new Map(categories.map((c) => [c.id, c.label]));
  const keyCounts = new Map();
  for (const e of entries) {
    const cat = e.catalogCategory;
    const pt = e.partTypeLabel ?? "";
    const k = `${cat}\t${pt}`;
    keyCounts.set(k, (keyCounts.get(k) ?? 0) + 1);
  }
  const rows = [];
  for (const [k, rowCount] of keyCounts) {
    const [catalogCategory, partTypeLabel] = k.split("\t");
    rows.push({
      catalogCategory,
      categoryLabel: labelById.get(catalogCategory) ?? "",
      partTypeLabel,
      rowCount,
    });
  }
  rows.sort((a, b) =>
    a.catalogCategory.localeCompare(b.catalogCategory) ||
    a.partTypeLabel.localeCompare(b.partTypeLabel)
  );
  return rows;
}

function buildEntriesSheet(categories, entries) {
  const labelById = new Map(categories.map((c) => [c.id, c.label]));
  return entries.map((e) => ({
    catalogPartId: e.catalogPartId,
    catalogCategory: e.catalogCategory,
    categoryLabel: labelById.get(e.catalogCategory) ?? "",
    partTypeLabel: e.partTypeLabel ?? "",
    nps: e.nps ?? "",
    thickness: e.thickness ?? "",
    weightKg: e.weightKg ?? "",
    surfaceM2: e.surfaceM2 ?? "",
    attributesJson: JSON.stringify(e.attributes ?? {}),
  }));
}

const raw = fs.readFileSync(jsonPath, "utf8");
const { categories = [], entries = [] } = JSON.parse(raw);

const tree = injectFlangeChildren(CATEGORY_TREE, flangesStandards);
const uiRows = flattenUiTree(tree);

const wb = XLSX.utils.book_new();

const categoriesData = buildCategoriesSheet(categories, entries);
XLSX.utils.book_append_sheet(
  wb,
  XLSX.utils.json_to_sheet(categoriesData),
  "Categories"
);

const partTypesData = buildPartTypesSheet(categories, entries);
XLSX.utils.book_append_sheet(
  wb,
  XLSX.utils.json_to_sheet(partTypesData),
  "Part_types_by_category"
);

XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(uiRows), "UI_tree");

const entriesData = buildEntriesSheet(categories, entries);
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(entriesData), "Entries");

fs.mkdirSync(path.dirname(outPath), { recursive: true });
XLSX.writeFile(wb, outPath);

console.log(
  `Wrote ${outPath} (${categoriesData.length} categories, ${partTypesData.length} part-type rows, ${uiRows.length} UI leaves, ${entriesData.length} entries)`
);
