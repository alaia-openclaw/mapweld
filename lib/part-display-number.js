/**
 * Part labels on drawings: "kind.instance" (e.g. 1.1, 1.2, 2.1).
 * kind = order of first appearance of each spec on that drawing (marker order).
 * instance = nth part with the same spec on the same drawing.
 */

/**
 * Stable identity for grouping — must change when the user picks a different preset (e.g. WN vs elbow).
 * @param {object} part
 * @returns {string}
 */
export function partSpecKey(part) {
  if (!part) return "";
  const cid = String(part.catalogPartId ?? "").trim();
  if (cid) return `id:${cid}`;
  const cat = String(part.catalogCategory ?? "").trim();
  const pt = String(part.partType ?? "").trim();
  const nps = String(part.nps ?? "").trim();
  const th = String(part.thickness ?? "").trim();
  const vari = String(part.variation ?? "").trim();
  return `m:${cat}|${pt}|${nps}|${th}|${vari}`;
}

/**
 * Recompute displayNumber for every part that has a marker on a drawing.
 * Call after add / save / delete so changing catalog preset updates the leading digit.
 * @param {object[]} parts
 * @param {object[]} partMarkers
 * @returns {object[]}
 */
export function assignPartDisplayNumbersForAllDrawings(parts, partMarkers) {
  const safeParts = Array.isArray(parts) ? parts : [];
  const safeMarkers = Array.isArray(partMarkers) ? partMarkers : [];
  const byDrawing = new Map();
  for (const m of safeMarkers) {
    const did = m?.drawingId;
    if (!did) continue;
    if (!byDrawing.has(did)) byDrawing.set(did, []);
    byDrawing.get(did).push(m);
  }

  const partIdToLabel = new Map();

  byDrawing.forEach((markers) => {
    const ordered = [...markers].sort((a, b) => String(a.id).localeCompare(String(b.id)));
    const specToKind = new Map();
    let nextKind = 1;
    const instanceBySpec = new Map();

    for (const m of ordered) {
      const p = safeParts.find((x) => x.id === m.partId);
      if (!p) continue;
      const sk = partSpecKey(p);
      if (!specToKind.has(sk)) {
        specToKind.set(sk, nextKind);
        nextKind += 1;
      }
      const kindIdx = specToKind.get(sk);
      const inst = (instanceBySpec.get(sk) || 0) + 1;
      instanceBySpec.set(sk, inst);
      partIdToLabel.set(m.partId, `${kindIdx}.${inst}`);
    }
  });

  return safeParts.map((p) => {
    const label = partIdToLabel.get(p.id);
    if (label == null) return p;
    return { ...p, displayNumber: label };
  });
}

/**
 * @deprecated Prefer assignPartDisplayNumbersForAllDrawings after push; kept for single-shot add math.
 */
export function computePartDisplayNumber({ parts, partMarkers, drawingId, newPart }) {
  const key = partSpecKey(newPart);
  const markersOnDrawing = (partMarkers || []).filter((m) => m.drawingId === drawingId);
  const ordered = [...markersOnDrawing].sort((a, b) => String(a.id).localeCompare(String(b.id)));

  const specToKind = new Map();
  let nextKind = 1;
  for (const m of ordered) {
    const p = (parts || []).find((x) => x.id === m.partId);
    if (!p) continue;
    const k = partSpecKey(p);
    if (!specToKind.has(k)) {
      specToKind.set(k, nextKind);
      nextKind += 1;
    }
  }

  const kindIdx = specToKind.has(key) ? specToKind.get(key) : nextKind;
  const instanceIdx =
    ordered.filter((m) => {
      const p = (parts || []).find((x) => x.id === m.partId);
      return p && partSpecKey(p) === key;
    }).length + 1;

  return `${kindIdx}.${instanceIdx}`;
}

export function comparePartDisplayNumbers(a, b) {
  const sa = String(a?.displayNumber ?? "");
  const sb = String(b?.displayNumber ?? "");
  return sa.localeCompare(sb, undefined, { numeric: true });
}
