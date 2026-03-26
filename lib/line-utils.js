/** Matches default auto names like "Line 1", "line 12" */
const LINE_AUTO_NAME = /^Line\s+(\d+)$/i;

/**
 * Next default name `Line N` that does not duplicate any existing `Line <number>` name
 * in the project (case-insensitive). Ignores custom names that do not match the pattern.
 *
 * @param {Array<{ name?: string }>} lines
 * @returns {string}
 */
export function getNextUniqueLineName(lines = []) {
  let max = 0;
  for (const line of lines) {
    const m = String(line?.name ?? "").trim().match(LINE_AUTO_NAME);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `Line ${max + 1}`;
}
