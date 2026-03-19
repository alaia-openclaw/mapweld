/**
 * Joint NPS / schedule (wall) per weld side: weld-level overrides + inheritance from linked parts.
 *
 * Semantics (policy B — no auto-copy on part change):
 * - For each field (nps, schedule), a non-empty trimmed value on `weld.jointDimensions.sideN`
 *   wins; otherwise the value comes from the linked part (`part.nps`, `part.thickness` as schedule).
 * - Empty or missing override fields inherit from the part.
 */

/**
 * @typedef {'weld' | 'part' | 'none'} JointFieldSource
 */

/**
 * @param {unknown} val
 * @returns {string}
 */
function trimStr(val) {
  return String(val ?? "").trim();
}

/**
 * @returns {{ side1: { nps: string, schedule: string }, side2: { nps: string, schedule: string } }}
 */
export function createDefaultJointDimensions() {
  return {
    side1: { nps: "", schedule: "" },
    side2: { nps: "", schedule: "" },
  };
}

/**
 * Normalize stored jointDimensions from file/API.
 * @param {unknown} raw
 */
export function normalizeJointDimensions(raw) {
  if (!raw || typeof raw !== "object") return createDefaultJointDimensions();
  const s1 = raw.side1 && typeof raw.side1 === "object" ? raw.side1 : {};
  const s2 = raw.side2 && typeof raw.side2 === "object" ? raw.side2 : {};
  return {
    side1: {
      nps: trimStr(s1.nps),
      schedule: trimStr(s1.schedule),
    },
    side2: {
      nps: trimStr(s2.nps),
      schedule: trimStr(s2.schedule),
    },
  };
}

/**
 * @param {string} overrideVal
 * @param {string} partVal
 * @returns {{ value: string, source: JointFieldSource }}
 */
function resolveField(overrideVal, partVal) {
  const o = trimStr(overrideVal);
  if (o !== "") return { value: o, source: "weld" };
  const p = trimStr(partVal);
  if (p !== "") return { value: p, source: "part" };
  return { value: "", source: "none" };
}

/**
 * Effective diameter (NPS) and wall (schedule / thk string) for one side.
 * @param {object} weld
 * @param {object|null|undefined} part — linked part for this side (from partId1 / partId2)
 * @param {1|2} side
 * @returns {{
 *   nps: string,
 *   schedule: string,
 *   sourceNps: JointFieldSource,
 *   sourceSchedule: JointFieldSource,
 * }}
 */
export function getEffectiveJointSide(weld, part, side) {
  const key = side === 1 ? "side1" : "side2";
  const jd = weld?.jointDimensions?.[key] ?? {};
  const npsRes = resolveField(jd.nps, part?.nps);
  const schedRes = resolveField(jd.schedule, part?.thickness);
  return {
    nps: npsRes.value,
    schedule: schedRes.value,
    sourceNps: npsRes.source,
    sourceSchedule: schedRes.source,
  };
}

/**
 * @param {{ nps: string, schedule: string }} effective
 * @returns {boolean}
 */
export function isJointSideDimensionallyComplete(effective) {
  return trimStr(effective?.nps) !== "" && trimStr(effective?.schedule) !== "";
}

/**
 * Both sides must have NPS and schedule (from weld override and/or parts).
 * @param {object} weld
 * @param {object|null|undefined} part1
 * @param {object|null|undefined} part2
 */
export function isWeldJointDimensionallyComplete(weld, part1, part2) {
  const a = getEffectiveJointSide(weld, part1, 1);
  const b = getEffectiveJointSide(weld, part2, 2);
  return isJointSideDimensionallyComplete(a) && isJointSideDimensionallyComplete(b);
}

/**
 * Both part links required for fit-up policy ("always two parts").
 * @param {object} weld
 */
export function weldHasBothPartsLinked(weld) {
  return Boolean(weld?.partId1 && weld?.partId2);
}

/**
 * Short label for UI: "4 · Sch 40 (part)" / "6 · 9.7 mm (weld)".
 * @param {{ nps: string, schedule: string, sourceNps: string, sourceSchedule: string }} eff
 */
export function formatEffectiveJointSideSummary(eff) {
  const n = trimStr(eff?.nps);
  const s = trimStr(eff?.schedule);
  if (!n && !s) return "—";
  const dim = [n, s].filter(Boolean).join(" · ");
  const srcN = eff?.sourceNps;
  const srcS = eff?.sourceSchedule;
  if (srcN === "weld" || srcS === "weld") {
    const fromWeld = [srcN === "weld" ? "NPS" : null, srcS === "weld" ? "wall" : null].filter(Boolean);
    return fromWeld.length ? `${dim} (weld ${fromWeld.join(", ")})` : `${dim} (weld)`;
  }
  if (srcN === "part" || srcS === "part") return `${dim} (part)`;
  return dim;
}
