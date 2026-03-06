/**
 * Compute weld display name (SW1, FW2, etc.).
 * Uses stable weldNumber when present; otherwise falls back to position-based order.
 */
export function getWeldName(weld, weldPoints = []) {
  if (!weld) return weld?.id ?? "";

  const prefix = weld.weldLocation === "field" ? "FW" : "SW";

  if (weld.weldNumber != null) {
    return `${prefix}${weld.weldNumber}`;
  }

  if (!weldPoints.length) return weld.id ?? "";

  const isField = weld.weldLocation === "field";
  const sameType = weldPoints
    .filter((w) => (w.weldLocation === "field") === isField)
    .sort((a, b) => {
      const pa = a.pageNumber ?? 0;
      const pb = b.pageNumber ?? 0;
      if (pa !== pb) return pa - pb;
      const ya = a.yPercent ?? 0;
      const yb = b.yPercent ?? 0;
      if (ya !== yb) return ya - yb;
      const xa = a.xPercent ?? 0;
      const xb = b.xPercent ?? 0;
      if (xa !== xb) return xa - xb;
      return (a.id ?? "").localeCompare(b.id ?? "");
    });

  const idx = sameType.findIndex((w) => w.id === weld.id);
  return idx >= 0 ? `${prefix}${idx + 1}` : weld.id ?? "";
}
