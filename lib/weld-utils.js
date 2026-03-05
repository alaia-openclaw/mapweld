/**
 * Compute weld display name (SW1, FW2, etc.) from weldPoints.
 * Shop welds: SW1, SW2, ...
 * Field welds: FW1, FW2, ...
 * Order: pageNumber, then yPercent, then xPercent, then id.
 */
export function getWeldName(weld, weldPoints = []) {
  if (!weld || !weldPoints.length) return weld?.id ?? "";

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
  const prefix = isField ? "FW" : "SW";
  return idx >= 0 ? `${prefix}${idx + 1}` : weld.id ?? "";
}
