/**
 * Human-readable labels for catalog hierarchy steps (pipe schedule vs flange wall mm, etc.).
 */

/**
 * @param {string} categoryId
 * @returns {string}
 */
export function getCatalogWallStepShortLabel(categoryId) {
  if (categoryId === "pipe") return "Schedule";
  if (categoryId === "fittings-butt-weld") return "Schedule / wall";
  if (
    categoryId === "asme-b16-5" ||
    categoryId === "asme-b16-47-a" ||
    categoryId === "asme-b16-47-b" ||
    categoryId === "asme-orifice" ||
    categoryId === "api-6b" ||
    categoryId === "api-6bx" ||
    categoryId === "asme-reducing" ||
    categoryId === "asme-compact" ||
    categoryId === "hub-and-clamp" ||
    categoryId === "en-1092-1" ||
    categoryId === "bs-10"
  ) {
    return "Wall / WN thk (mm)";
  }
  return "Schedule / wall";
}

/**
 * @param {string} categoryId
 * @param {{ key: string, label: string }} step
 */
export function getHierarchyStepDisplayLabel(categoryId, step) {
  if (!step) return "";
  if (step.key === "schedule") return getCatalogWallStepShortLabel(categoryId);
  return step.label;
}
