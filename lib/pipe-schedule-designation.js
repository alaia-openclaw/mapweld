/**
 * True if a string looks like an ASME pipe schedule (STD, XS, 40, 80S, …), not a wall thickness in mm/in.
 * Used for pipe, butt-weld fittings (per-file schedule), and flange bore (CSV Sch / Schedule column).
 */
export function looksLikePipeScheduleDesignation(value) {
  const t = String(value ?? "").trim();
  if (!t) return false;
  if (/^\d+[.,]\d+$/.test(t)) return false;
  const up = t.toUpperCase();
  if (/^(STD|XS|XXS)$/.test(up)) return true;
  if (/^\d+S$/i.test(t)) return true;
  if (/^\d+$/.test(t)) {
    const n = Number(t);
    return [5, 10, 20, 30, 40, 60, 80, 100, 120, 140, 160].includes(n);
  }
  return false;
}
