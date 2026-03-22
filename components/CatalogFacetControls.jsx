"use client";

import { useMemo } from "react";
import { CatalogFacetDropdown } from "@/components/CatalogCategoryToolbar";
import {
  uniqueSortedFacetValues,
  parseFittingsSelectionId,
  filterFittingsBySubtype,
  getFlangePipeScheduleDisplay,
} from "@/lib/catalog-structure";
import {
  flattenFlangeStandardRows,
  rowMatchesFlangeSubtype,
  showWallScheduleOnBar,
} from "@/lib/flange-catalog-rows";
import {
  NONMETALLIC_FLAT_GASKET_STANDARDS,
  getRowsForStandard,
  uniqueSortedDns,
  uniqueSortedClasses,
  matchNonmetallicFlatRow,
} from "@/lib/nonmetallic-flat-gaskets-data";
import {
  SPIRAL_WOUND_GASKET_STANDARDS,
  getSpiralRowsForStandard,
  matchSpiralWoundRow,
} from "@/lib/spiral-wound-gaskets-data";
import {
  getRingRowsForType,
  getRingJointTypeBySelectionId,
  matchRingJointRow,
} from "@/lib/ring-joint-gaskets-data";
import {
  getFlangedValveRowsForType,
  getFlangedValveTypeBySelectionId,
  matchFlangedValveRow,
  FLANGED_VALVE_FACE_TYPES,
  FLANGED_VALVE_ACTUATORS,
} from "@/lib/flanged-valves-data";
import {
  getButtweldedValveRowsForType,
  getButtweldedValveTypeBySelectionId,
  matchButtweldedValveRow,
} from "@/lib/buttwelded-valves-data";
import {
  getThreadedValveRowsForType,
  getThreadedValveTypeBySelectionId,
  matchThreadedValveRow,
} from "@/lib/threaded-valves-data";
import {
  getSocketweldedValveRowsForType,
  getSocketweldedValveTypeBySelectionId,
  matchSocketweldedValveRow,
  SOCKETWELDED_VALVE_TYPES,
} from "@/lib/socketwelded-valves-data";
import { BUTTWELDED_VALVE_TYPES } from "@/lib/buttwelded-valves-data";
import { THREADED_VALVE_TYPES } from "@/lib/threaded-valves-data";

const FLANGED_VALVE_LEAF_IDS = new Set([
  "valves-flanged-gate",
  "valves-flanged-globe",
  "valves-flanged-ball",
  "valves-flanged-control",
  "valves-flanged-swing-check",
  "valves-flanged-wafer-check",
  "valves-flanged-wafer-butterfly",
  "valves-flanged-lug-butterfly",
]);

const BUTTWELDED_VALVE_LEAF_IDS = new Set(BUTTWELDED_VALVE_TYPES.map((t) => t.selectionId));
const THREADED_VALVE_LEAF_IDS = new Set(THREADED_VALVE_TYPES.map((t) => t.selectionId));
const SOCKETWELDED_VALVE_LEAF_IDS = new Set(SOCKETWELDED_VALVE_TYPES.map((t) => t.selectionId));

function sortFlangedValveRows(rows) {
  const pcOrder = { "150#": 0, "300#": 1, "600#": 2, "900#": 3 };
  return rows.slice().sort((a, b) => {
    if (a.dn !== b.dn) return a.dn - b.dn;
    if (a.pressureClass !== b.pressureClass)
      return (pcOrder[a.pressureClass] ?? 0) - (pcOrder[b.pressureClass] ?? 0);
    if (a.faceType && b.faceType)
      return FLANGED_VALVE_FACE_TYPES.indexOf(a.faceType) - FLANGED_VALVE_FACE_TYPES.indexOf(b.faceType);
    if (a.actuator && b.actuator)
      return FLANGED_VALVE_ACTUATORS.indexOf(a.actuator) - FLANGED_VALVE_ACTUATORS.indexOf(b.actuator);
    return 0;
  });
}

function sortValveRowsPc800(rows) {
  const pcOrder = { "150#": 0, "300#": 1, "600#": 2, "800#": 3, "900#": 4 };
  return rows.slice().sort((a, b) => {
    if (a.dn !== b.dn) return a.dn - b.dn;
    return (pcOrder[a.pressureClass] ?? 0) - (pcOrder[b.pressureClass] ?? 0);
  });
}

export default function CatalogFacetControls({
  selectedId,
  search = "",
  catalogUnitSystem,
  pipeEntries = [],
  fittingsEntries = [],
  flangesStandards = [],
  catalogFacets = {},
  onFacetChange,
}) {
  const pipeBlock = useMemo(() => {
    if (selectedId !== "pipe") return null;
    const entries = Array.isArray(pipeEntries) ? pipeEntries : [];
    const scheduleOptions = uniqueSortedFacetValues(entries.map((e) => e.attributes?.schedule));
    const formOptions = uniqueSortedFacetValues(
      entries.map((e) => e.attributes?.pipeForm ?? "Seamless")
    );
    const npsOptions = uniqueSortedFacetValues(entries.map((e) => e.nps));
    const odOptions = uniqueSortedFacetValues(entries.map((e) => e.attributes?.od));
    const wallThkOptions = uniqueSortedFacetValues(entries.map((e) => e.attributes?.wallThk));
    const idOptions = uniqueSortedFacetValues(entries.map((e) => e.attributes?.id));
    const isMetric = catalogUnitSystem === "Metric";

    return (
      <>
        {npsOptions.length > 0 ? (
          <CatalogFacetDropdown
            label="Size (NPS / NB)"
            options={[{ id: "", label: "All sizes" }, ...npsOptions.map((n) => ({ id: n, label: n }))]}
            activeId={catalogFacets.p_nps ?? ""}
            onSelect={(id) => onFacetChange("p_nps", id)}
          />
        ) : null}
        {scheduleOptions.length > 0 ? (
          <CatalogFacetDropdown
            label="Schedule"
            options={[{ id: "", label: "All schedules" }, ...scheduleOptions.map((s) => ({ id: s, label: s }))]}
            activeId={catalogFacets.p_schedule ?? ""}
            onSelect={(id) => onFacetChange("p_schedule", id)}
          />
        ) : null}
        {formOptions.length > 0 ? (
          <CatalogFacetDropdown
            label="Form"
            options={[{ id: "", label: "All" }, ...formOptions.map((f) => ({ id: f, label: f }))]}
            activeId={catalogFacets.p_form ?? ""}
            onSelect={(id) => onFacetChange("p_form", id)}
          />
        ) : null}
        {odOptions.length > 0 ? (
          <CatalogFacetDropdown
            label={isMetric ? "OD (mm)" : "OD (in)"}
            options={[{ id: "", label: "All" }, ...odOptions.map((o) => ({ id: o, label: o }))]}
            activeId={catalogFacets.p_od ?? ""}
            onSelect={(id) => onFacetChange("p_od", id)}
          />
        ) : null}
        {wallThkOptions.length > 0 ? (
          <CatalogFacetDropdown
            label={isMetric ? "Wall thk (mm)" : "Wall thk (in)"}
            options={[{ id: "", label: "All" }, ...wallThkOptions.map((w) => ({ id: w, label: w }))]}
            activeId={catalogFacets.p_wall ?? ""}
            onSelect={(id) => onFacetChange("p_wall", id)}
          />
        ) : null}
        {idOptions.length > 0 ? (
          <CatalogFacetDropdown
            label={isMetric ? "ID (mm)" : "ID (in)"}
            options={[{ id: "", label: "All" }, ...idOptions.map((i) => ({ id: i, label: i }))]}
            activeId={catalogFacets.p_id ?? ""}
            onSelect={(id) => onFacetChange("p_id", id)}
          />
        ) : null}
      </>
    );
  }, [selectedId, pipeEntries, catalogUnitSystem, catalogFacets, onFacetChange]);

  const fittingsBlock = useMemo(() => {
    const parsed = parseFittingsSelectionId(selectedId);
    if (!parsed) return null;
    const { connectionType, subtypeId } = parsed;
    const entries = filterFittingsBySubtype(fittingsEntries, connectionType, subtypeId);
    if (!entries.length) return null;

    const scheduleOptions = uniqueSortedFacetValues(entries.map((e) => e.attributes?.schedule ?? e.thickness));
    const radiusOptions = uniqueSortedFacetValues(entries.map((e) => e.attributes?.radius));
    const angleOptions = uniqueSortedFacetValues(entries.map((e) => e.attributes?.angle));
    const npsOptions = uniqueSortedFacetValues(entries.map((e) => e.nps));
    const partTypeOptions = uniqueSortedFacetValues(entries.map((e) => e.partTypeLabel));
    const odOptions = uniqueSortedFacetValues(entries.map((e) => e.attributes?.od));
    const isMetric = catalogUnitSystem === "Metric";

    return (
      <>
        {partTypeOptions.length > 1 ? (
          <CatalogFacetDropdown
            label="Part type"
            options={[{ id: "", label: "All types" }, ...partTypeOptions.map((p) => ({ id: p, label: p }))]}
            activeId={catalogFacets.f_part ?? ""}
            onSelect={(id) => onFacetChange("f_part", id)}
          />
        ) : null}
        {npsOptions.length > 0 ? (
          <CatalogFacetDropdown
            label="Size (NPS / NB)"
            options={[{ id: "", label: "All sizes" }, ...npsOptions.map((n) => ({ id: n, label: n }))]}
            activeId={catalogFacets.f_nps ?? ""}
            onSelect={(id) => onFacetChange("f_nps", id)}
          />
        ) : null}
        {scheduleOptions.length > 0 ? (
          <CatalogFacetDropdown
            label="Schedule"
            options={[{ id: "", label: "All schedules" }, ...scheduleOptions.map((s) => ({ id: s, label: s }))]}
            activeId={catalogFacets.f_schedule ?? ""}
            onSelect={(id) => onFacetChange("f_schedule", id)}
          />
        ) : null}
        {radiusOptions.length > 0 ? (
          <CatalogFacetDropdown
            label="Radius"
            options={[{ id: "", label: "All" }, ...radiusOptions.map((r) => ({ id: r, label: r }))]}
            activeId={catalogFacets.f_radius ?? ""}
            onSelect={(id) => onFacetChange("f_radius", id)}
          />
        ) : null}
        {angleOptions.length > 0 ? (
          <CatalogFacetDropdown
            label="Angle"
            options={[{ id: "", label: "All" }, ...angleOptions.map((a) => ({ id: a, label: a }))]}
            activeId={catalogFacets.f_angle ?? ""}
            onSelect={(id) => onFacetChange("f_angle", id)}
          />
        ) : null}
        {odOptions.length > 0 ? (
          <CatalogFacetDropdown
            label={isMetric ? "OD (mm)" : "OD (in)"}
            options={[{ id: "", label: "All" }, ...odOptions.map((o) => ({ id: o, label: o }))]}
            activeId={catalogFacets.f_od ?? ""}
            onSelect={(id) => onFacetChange("f_od", id)}
          />
        ) : null}
      </>
    );
  }, [selectedId, fittingsEntries, catalogUnitSystem, catalogFacets, onFacetChange]);

  const flangeBlock = useMemo(() => {
    if (!selectedId?.startsWith("flange-")) return null;
    const standardId = selectedId.slice(7);
    const activeStandard = flangesStandards.find((s) => s.id === standardId);
    if (!activeStandard) return null;

    const activeSubtypeId = catalogFacets.fl_sub ?? "";
    const allBaseRows = flattenFlangeStandardRows(activeStandard, catalogUnitSystem);
    const baseRowsForSubtype = allBaseRows.filter((row) =>
      rowMatchesFlangeSubtype(row, activeSubtypeId, activeStandard?.subtypes)
    );

    const uniqueFaceTypes = uniqueSortedFacetValues(baseRowsForSubtype.map((r) => r.attributes?.faceType));
    const uniqueNps = uniqueSortedFacetValues(baseRowsForSubtype.map((r) => r.nps));
    const uniqueWall = uniqueSortedFacetValues(
      baseRowsForSubtype.map((r) => getFlangePipeScheduleDisplay(r)).filter(Boolean)
    );
    const uniqueRatings = uniqueSortedFacetValues(allBaseRows.map((r) => r.pressureClass));
    const uniqueOd = uniqueSortedFacetValues(baseRowsForSubtype.map((r) => r.od));
    const uniquePcd = uniqueSortedFacetValues(baseRowsForSubtype.map((r) => r.pcd));

    const showPipeScheduleFacet =
      showWallScheduleOnBar(activeSubtypeId, activeStandard?.subtypes) && uniqueWall.length > 0;

    const subtypeOptions = (activeStandard?.subtypes ?? []).map((t) => ({ id: t.id, label: t.label }));
    const classOptions = uniqueRatings.map((pc) => ({ id: String(pc), label: String(pc) }));
    const faceOptions = uniqueFaceTypes.map((ft) => ({ id: ft, label: ft }));
    const npsOptions = uniqueNps.map((n) => ({ id: n, label: n }));
    const wallOptions = uniqueWall.map((w) => ({ id: w, label: w }));
    const odLabel = catalogUnitSystem === "Metric" ? "OD (mm)" : "OD (in)";
    const pcdLabel = catalogUnitSystem === "Metric" ? "PCD (mm)" : "PCD (in)";

    return (
      <>
        {subtypeOptions.length > 1 ? (
          <CatalogFacetDropdown
            label="Flange type"
            options={[{ id: "", label: "All types" }, ...subtypeOptions]}
            activeId={activeSubtypeId}
            onSelect={(id) => onFacetChange("fl_sub", id)}
          />
        ) : null}
        {classOptions.length > 0 ? (
          <CatalogFacetDropdown
            label="Rating (class)"
            options={[{ id: "", label: "All ratings" }, ...classOptions]}
            activeId={catalogFacets.fl_rating ?? ""}
            onSelect={(id) => onFacetChange("fl_rating", id)}
          />
        ) : null}
        {faceOptions.length > 0 ? (
          <CatalogFacetDropdown
            label="Face type"
            options={[{ id: "", label: "All" }, ...faceOptions]}
            activeId={catalogFacets.fl_face ?? ""}
            onSelect={(id) => onFacetChange("fl_face", id)}
          />
        ) : null}
        {npsOptions.length > 0 ? (
          <CatalogFacetDropdown
            label="Size (NPS / NB)"
            options={[{ id: "", label: "All sizes" }, ...npsOptions]}
            activeId={catalogFacets.fl_nps ?? ""}
            onSelect={(id) => onFacetChange("fl_nps", id)}
          />
        ) : null}
        {showPipeScheduleFacet ? (
          <CatalogFacetDropdown
            label="Pipe schedule"
            options={[{ id: "", label: "All" }, ...wallOptions]}
            activeId={catalogFacets.fl_wall ?? ""}
            onSelect={(id) => onFacetChange("fl_wall", id)}
          />
        ) : null}
        {uniqueOd.length > 0 ? (
          <CatalogFacetDropdown
            label={odLabel}
            options={[{ id: "", label: "All" }, ...uniqueOd.map((o) => ({ id: o, label: o }))]}
            activeId={catalogFacets.fl_od ?? ""}
            onSelect={(id) => onFacetChange("fl_od", id)}
          />
        ) : null}
        {uniquePcd.length > 0 ? (
          <CatalogFacetDropdown
            label={pcdLabel}
            options={[{ id: "", label: "All" }, ...uniquePcd.map((p) => ({ id: p, label: p }))]}
            activeId={catalogFacets.fl_pcd ?? ""}
            onSelect={(id) => onFacetChange("fl_pcd", id)}
          />
        ) : null}
      </>
    );
  }, [selectedId, flangesStandards, catalogUnitSystem, catalogFacets, onFacetChange]);

  const gasketFlatSpiralBlock = useMemo(() => {
    const isNon =
      selectedId === "gasket-nonmetallic-flat-b16-5" ||
      selectedId === "gasket-nonmetallic-flat-b16-47a" ||
      selectedId === "gasket-nonmetallic-flat-b16-47b";
    const isSpiral =
      selectedId === "gasket-spiral-wound-b16-5" ||
      selectedId === "gasket-spiral-wound-b16-47a" ||
      selectedId === "gasket-spiral-wound-b16-47b";
    if (!isNon && !isSpiral) return null;

    const standard = isNon
      ? NONMETALLIC_FLAT_GASKET_STANDARDS.find((s) => s.selectionId === selectedId)
      : SPIRAL_WOUND_GASKET_STANDARDS.find((s) => s.selectionId === selectedId);
    if (!standard) return null;

    const allRows = isNon
      ? getRowsForStandard(standard.id)
      : getSpiralRowsForStandard(standard.id);
    const rowsFiltered = allRows.filter((row) =>
      isNon ? matchNonmetallicFlatRow(row, search) : matchSpiralWoundRow(row, search)
    );
    const pool = rowsFiltered.length ? rowsFiltered : allRows;
    const dns = uniqueSortedDns(pool);
    const classes = uniqueSortedClasses(pool);

    return (
      <>
        {dns.length > 0 ? (
          <CatalogFacetDropdown
            label="Size (DN)"
            options={dns.map((d) => ({ id: String(d), label: String(d) }))}
            activeId={catalogFacets.g_dn != null && catalogFacets.g_dn !== "" ? String(catalogFacets.g_dn) : String(dns[0])}
            onSelect={(id) => onFacetChange("g_dn", id)}
          />
        ) : null}
        {classes.length > 0 ? (
          <CatalogFacetDropdown
            label="Class"
            options={classes.map((c) => ({ id: c, label: c }))}
            activeId={catalogFacets.g_class !== undefined && catalogFacets.g_class !== "" ? catalogFacets.g_class : classes[0]}
            onSelect={(id) => onFacetChange("g_class", id)}
          />
        ) : null}
      </>
    );
  }, [selectedId, search, catalogFacets, onFacetChange]);

  const ringJointBlock = useMemo(() => {
    if (
      selectedId !== "gasket-ring-joint-r" &&
      selectedId !== "gasket-ring-joint-rx" &&
      selectedId !== "gasket-ring-joint-bx"
    )
      return null;
    const typeDef = getRingJointTypeBySelectionId(selectedId);
    if (!typeDef) return null;
    const allRows = getRingRowsForType(typeDef.id);
    const rowsFiltered = allRows.filter((row) => matchRingJointRow(row, search));
    const pool = rowsFiltered.length ? rowsFiltered : allRows;
    const sizeCodes = [...new Set(pool.map((r) => r.sizeCode))].sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true })
    );
    if (!sizeCodes.length) return null;
    return (
      <CatalogFacetDropdown
        label="Size"
        options={sizeCodes.map((c) => ({ id: c, label: c }))}
        activeId={
          catalogFacets.rj_size !== undefined && catalogFacets.rj_size !== ""
            ? catalogFacets.rj_size
            : sizeCodes[0]
        }
        onSelect={(id) => onFacetChange("rj_size", id)}
      />
    );
  }, [selectedId, search, catalogFacets, onFacetChange]);

  const flangedValveBlock = useMemo(() => {
    if (!FLANGED_VALVE_LEAF_IDS.has(selectedId)) return null;
    const typeDef = getFlangedValveTypeBySelectionId(selectedId);
    if (!typeDef) return null;
    const allRows = getFlangedValveRowsForType(typeDef.id);
    const rowsFiltered = allRows.filter((row) => matchFlangedValveRow(row, search));
    const sortedRows = sortFlangedValveRows(rowsFiltered);
    const dns = [...new Set(sortedRows.map((r) => r.dn))].sort((a, b) => a - b);
    const classes = [...new Set(sortedRows.map((r) => r.pressureClass))].sort(
      (a, b) => (["150#", "300#", "600#", "900#"].indexOf(a) - ["150#", "300#", "600#", "900#"].indexOf(b))
    );
    const faceSet = [...new Set(sortedRows.map((r) => r.faceType).filter(Boolean))].sort();
    const actSet = [...new Set(sortedRows.map((r) => r.actuator).filter(Boolean))].sort();
    const faceOpts = faceSet.length ? faceSet : FLANGED_VALVE_FACE_TYPES;
    const actOpts = actSet.length ? actSet : FLANGED_VALVE_ACTUATORS;
    const toolbarFace = typeDef.toolbar === "face";

    return (
      <>
        {dns.length > 0 ? (
          <CatalogFacetDropdown
            label="Size (DN)"
            options={dns.map((n) => ({ id: String(n), label: String(n) }))}
            activeId={catalogFacets.v_dn !== undefined && catalogFacets.v_dn !== "" ? String(catalogFacets.v_dn) : String(dns[0])}
            onSelect={(id) => onFacetChange("v_dn", id)}
          />
        ) : null}
        {classes.length > 0 ? (
          <CatalogFacetDropdown
            label="Class"
            options={classes.map((c) => ({ id: c, label: c }))}
            activeId={catalogFacets.v_class !== undefined && catalogFacets.v_class !== "" ? catalogFacets.v_class : classes[0]}
            onSelect={(id) => onFacetChange("v_class", id)}
          />
        ) : null}
        {toolbarFace ? (
          <CatalogFacetDropdown
            label="Face"
            options={faceOpts.map((f) => ({ id: f, label: f }))}
            activeId={catalogFacets.v_face !== undefined && catalogFacets.v_face !== "" ? catalogFacets.v_face : faceOpts[0]}
            onSelect={(id) => onFacetChange("v_face", id)}
          />
        ) : (
          <CatalogFacetDropdown
            label="Actuator"
            options={actOpts.map((a) => ({ id: a, label: a }))}
            activeId={catalogFacets.v_actuator !== undefined && catalogFacets.v_actuator !== "" ? catalogFacets.v_actuator : actOpts[0]}
            onSelect={(id) => onFacetChange("v_actuator", id)}
          />
        )}
      </>
    );
  }, [selectedId, search, catalogFacets, onFacetChange]);

  const genericValveBlock = useMemo(() => {
    let getRows;
    let match;
    if (BUTTWELDED_VALVE_LEAF_IDS.has(selectedId)) {
      const typeDef = getButtweldedValveTypeBySelectionId(selectedId);
      if (!typeDef) return null;
      getRows = () => getButtweldedValveRowsForType(typeDef.id);
      match = matchButtweldedValveRow;
    } else if (THREADED_VALVE_LEAF_IDS.has(selectedId)) {
      const typeDef = getThreadedValveTypeBySelectionId(selectedId);
      if (!typeDef) return null;
      getRows = () => getThreadedValveRowsForType(typeDef.id);
      match = matchThreadedValveRow;
    } else if (SOCKETWELDED_VALVE_LEAF_IDS.has(selectedId)) {
      const typeDef = getSocketweldedValveTypeBySelectionId(selectedId);
      if (!typeDef) return null;
      getRows = () => getSocketweldedValveRowsForType(typeDef.id);
      match = matchSocketweldedValveRow;
    } else {
      return null;
    }

    const allRows = getRows();
    const rowsFiltered = allRows.filter((row) => match(row, search));
    const sortedRows = sortValveRowsPc800(rowsFiltered);
    const dns = [...new Set(sortedRows.map((r) => r.dn))].sort((a, b) => a - b);
    const classes = [...new Set(sortedRows.map((r) => r.pressureClass))];
    const pcOrder = { "150#": 0, "300#": 1, "600#": 2, "800#": 3, "900#": 4 };
    classes.sort((a, b) => (pcOrder[a] ?? 99) - (pcOrder[b] ?? 99));

    return (
      <>
        {dns.length > 0 ? (
          <CatalogFacetDropdown
            label="Size (DN)"
            options={dns.map((n) => ({ id: String(n), label: String(n) }))}
            activeId={catalogFacets.bv_dn !== undefined && catalogFacets.bv_dn !== "" ? String(catalogFacets.bv_dn) : String(dns[0])}
            onSelect={(id) => onFacetChange("bv_dn", id)}
          />
        ) : null}
        {classes.length > 0 ? (
          <CatalogFacetDropdown
            label="Class"
            options={classes.map((c) => ({ id: c, label: c }))}
            activeId={catalogFacets.bv_class !== undefined && catalogFacets.bv_class !== "" ? catalogFacets.bv_class : classes[0]}
            onSelect={(id) => onFacetChange("bv_class", id)}
          />
        ) : null}
      </>
    );
  }, [selectedId, search, catalogFacets, onFacetChange]);

  return (
    <>
      {pipeBlock}
      {fittingsBlock}
      {flangeBlock}
      {gasketFlatSpiralBlock}
      {ringJointBlock}
      {flangedValveBlock}
      {genericValveBlock}
    </>
  );
}
