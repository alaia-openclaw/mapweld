/**
 * Shared helpers for flange catalog rows (facet options + panel filtering).
 */

export function rowMatchesFlangeSubtype(row, activeSubtypeId, subtypes) {
  if (!subtypes?.length || !activeSubtypeId) return true;
  const ft = row.attributes?.flangeType;
  if (ft) return ft === activeSubtypeId;
  return true;
}

export function showWallScheduleOnBar(subtypeId, subtypes) {
  if (!subtypes?.length) return false;
  if (!subtypeId) return true;
  return ["weldneck", "lapped", "long-welding-neck"].includes(subtypeId);
}

/** All dimension rows for a flange standard (every rating / class), filtered by unit system only. */
export function flattenFlangeStandardRows(standard, catalogUnitSystem) {
  const rows = [];
  for (const cls of standard?.classes ?? []) {
    for (const ds of cls.datasets ?? []) {
      if (catalogUnitSystem && ds.system && ds.system !== catalogUnitSystem) continue;
      for (const row of ds.rows ?? []) {
        rows.push({
          ...row,
          system: ds.system,
          standardLabel: standard.label,
          pressureClass: cls.pressureClass,
        });
      }
    }
  }
  return rows;
}
