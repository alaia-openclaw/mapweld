/**
 * Part labels on drawings: "kind.instance" (e.g. 1.1, 1.2, 2.1) — kind = catalog spec
 * order on the drawing; instance = nth part of that spec on the same drawing.
 */

function partSpecKey(part) {
  if (!part) return "";
  const cid = String(part.catalogPartId ?? "").trim();
  if (cid) return `id:${cid}`;
  return `m:${String(part.partType ?? "").trim()}|${String(part.nps ?? "").trim()}|${String(part.thickness ?? "").trim()}`;
}

/**
 * @param {object} opts
 * @param {object[]} opts.parts
 * @param {object[]} opts.partMarkers
 * @param {string|null} opts.drawingId
 * @param {object} opts.newPart — part row about to be added (spec from catalog/custom)
 * @returns {string}
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
