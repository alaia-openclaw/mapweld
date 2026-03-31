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

const LINE_BLANK_IDS = new Set([
  "line-blanks",
  "line-blanks-figure-8",
  "line-blanks-paddle-spacer",
  "line-blanks-rtj-figure-8",
  "line-blanks-rtj-paddle",
]);

const WELDED_BRANCH_IDS = new Set([
  "welded-branches",
  "wb-weldolet",
  "wb-elbowlet",
  "wb-latrolet",
  "wb-threadolet",
  "wb-threaded-elbowlet",
  "wb-threaded-latrolet",
  "wb-sockolet",
  "wb-socketweld-elbowlet",
  "wb-socketweld-latrolet",
  "wb-weldoflange",
  "wb-elbowflange",
  "wb-latroflange",
  "wb-nipoflange",
]);

const STRAINER_IDS = new Set([
  "strainers",
  "strainers-y-type",
  "strainers-y-flanged",
  "strainers-y-buttwelded",
  "strainers-y-threaded",
  "strainers-y-socketwelded",
  "strainers-basket",
  "strainers-basket-single",
  "strainers-basket-duplex",
  "strainers-witch-hat",
  "strainers-top-hat",
  "strainers-bath-tub",
]);

const SPACING_IDS = new Set([
  "spacing",
  "spacing-pipe",
  "spacing-pipe-insul",
  "spacing-flanged",
  "spacing-flanged-insul",
]);

const SAFE_SPAN_IDS = new Set([
  "safe-spans",
  "safe-spans-rack",
  "safe-spans-process",
]);

const PIPE_FLEX_IDS = new Set([
  "pipe-flexibility",
  "pipe-flex-loop",
  "pipe-flex-first-guide",
]);

const LINE_BLANK_TYPE_OPTIONS = [
  { id: "figure-8", label: "Figure-8 Blank" },
  { id: "paddle-spacer", label: "Paddle Blank and Spacer" },
  { id: "rtj-figure-8", label: "RTJ Male Figure-8 Blank" },
  { id: "rtj-paddle", label: "RTJ Male Paddle Blank and Spacer" },
];

const WELDED_BRANCH_TYPE_OPTIONS = [
  { id: "weldolet", label: "Weldolet" },
  { id: "elbowlet", label: "Elbowlet" },
  { id: "latrolet", label: "Latrolet" },
  { id: "threadolet", label: "Threadolet" },
  { id: "threaded-elbowlet", label: "Threaded Elbowlet" },
  { id: "threaded-latrolet", label: "Threaded Latrolet" },
  { id: "sockolet", label: "Sockolet" },
  { id: "socketweld-elbowlet", label: "Socketweld Elbowlet" },
  { id: "socketweld-latrolet", label: "Socketweld Latrolet" },
  { id: "weldoflange", label: "Weldoflange" },
  { id: "elbowflange", label: "Elbowflange" },
  { id: "latroflange", label: "Latroflange" },
  { id: "nipoflange", label: "Nipoflange" },
];

const CLASS_OPTIONS = ["150#", "300#", "600#", "800#", "900#"].map((id) => ({ id, label: id }));
const FACE_OPTIONS = ["RF", "FF", "RTJ"].map((id) => ({ id, label: id }));
const INSUL_OPTIONS = ["0", "25", "40", "50", "75", "100"].map((id) => ({ id, label: id }));

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
    const npsOptions = uniqueSortedFacetValues(entries.map((e) => e.nps));

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
    const npsOptions = uniqueSortedFacetValues(entries.map((e) => e.nps));
    const lowerSubtype = String(subtypeId || "").toLowerCase();
    const isBwReducing =
      lowerSubtype.includes("reducer") ||
      lowerSubtype.includes("reducing") ||
      lowerSubtype.includes("tee");
    const isThreadedOrSw =
      connectionType === "fittings-threaded" ||
      connectionType === "fittings-socketwelded";

    return (
      <>
        {npsOptions.length > 0 ? (
          <CatalogFacetDropdown
            label={isBwReducing ? "Size" : "Size (NPS / NB)"}
            options={[{ id: "", label: "All sizes" }, ...npsOptions.map((n) => ({ id: n, label: n }))]}
            activeId={catalogFacets.f_nps ?? ""}
            onSelect={(id) => onFacetChange("f_nps", id)}
          />
        ) : null}
        {scheduleOptions.length > 0 ? (
          <CatalogFacetDropdown
            label={isThreadedOrSw ? "Rating" : "Schedule"}
            options={[{ id: "", label: "All schedules" }, ...scheduleOptions.map((s) => ({ id: s, label: s }))]}
            activeId={catalogFacets.f_schedule ?? ""}
            onSelect={(id) => onFacetChange("f_schedule", id)}
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
    const showPipeScheduleFacet =
      showWallScheduleOnBar(activeSubtypeId, activeStandard?.subtypes) && uniqueWall.length > 0;

    const subtypeOptions = (activeStandard?.subtypes ?? []).map((t) => ({ id: t.id, label: t.label }));
    const classOptions = uniqueRatings.map((pc) => ({ id: String(pc), label: String(pc) }));
    const faceOptions = uniqueFaceTypes.map((ft) => ({ id: ft, label: ft }));
    const npsOptions = uniqueNps.map((n) => ({ id: n, label: n }));
    const wallOptions = uniqueWall.map((w) => ({ id: w, label: w }));
    const styleNoFaceType = new Set(["lapped", "asme-compact"]);
    const hideFaceType = styleNoFaceType.has(activeSubtypeId) || activeStandard.id === "asme-compact";
    const isApi = activeStandard.id === "api-6b" || activeStandard.id === "api-6bx";

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
            label={isApi ? "API Rating" : "Class"}
            options={[{ id: "", label: "All ratings" }, ...classOptions]}
            activeId={catalogFacets.fl_rating ?? ""}
            onSelect={(id) => onFacetChange("fl_rating", id)}
          />
        ) : null}
        {!hideFaceType && faceOptions.length > 0 ? (
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

  const architectureBlock = useMemo(() => {
    if (LINE_BLANK_IDS.has(selectedId)) {
      return (
        <>
          <CatalogFacetDropdown
            label="Type"
            options={LINE_BLANK_TYPE_OPTIONS}
            activeId={catalogFacets.lb_type ?? LINE_BLANK_TYPE_OPTIONS[0].id}
            onSelect={(id) => onFacetChange("lb_type", id)}
          />
          <CatalogFacetDropdown
            label="Size (DN)"
            options={[{ id: "50", label: "50" }, { id: "80", label: "80" }, { id: "150", label: "150" }]}
            activeId={catalogFacets.lb_size ?? "50"}
            onSelect={(id) => onFacetChange("lb_size", id)}
          />
          <CatalogFacetDropdown
            label="Class"
            options={CLASS_OPTIONS}
            activeId={catalogFacets.lb_class ?? "600#"}
            onSelect={(id) => onFacetChange("lb_class", id)}
          />
          <CatalogFacetDropdown
            label="Face Type"
            options={FACE_OPTIONS}
            activeId={catalogFacets.lb_face ?? "RF"}
            onSelect={(id) => onFacetChange("lb_face", id)}
          />
        </>
      );
    }

    if (WELDED_BRANCH_IDS.has(selectedId)) {
      return (
        <>
          <CatalogFacetDropdown
            label="Type"
            options={WELDED_BRANCH_TYPE_OPTIONS}
            activeId={catalogFacets.wb_type ?? WELDED_BRANCH_TYPE_OPTIONS[0].id}
            onSelect={(id) => onFacetChange("wb_type", id)}
          />
          <CatalogFacetDropdown
            label="Size"
            options={[{ id: "450", label: "450" }, { id: "300", label: "300" }, { id: "150", label: "150" }]}
            activeId={catalogFacets.wb_size ?? "450"}
            onSelect={(id) => onFacetChange("wb_size", id)}
          />
          <CatalogFacetDropdown
            label="Small Size"
            options={[{ id: "20", label: "20" }, { id: "40", label: "40" }, { id: "80", label: "80" }]}
            activeId={catalogFacets.wb_small ?? "20"}
            onSelect={(id) => onFacetChange("wb_small", id)}
          />
          <CatalogFacetDropdown
            label="Rating / Class"
            options={[...CLASS_OPTIONS, { id: "3000#", label: "3000#" }, { id: "6000#", label: "6000#" }]}
            activeId={catalogFacets.wb_rating ?? "6000#"}
            onSelect={(id) => onFacetChange("wb_rating", id)}
          />
          <CatalogFacetDropdown
            label="Schedule"
            options={[{ id: "STD", label: "STD" }, { id: "XS", label: "XS" }]}
            activeId={catalogFacets.wb_schedule ?? "STD"}
            onSelect={(id) => onFacetChange("wb_schedule", id)}
          />
        </>
      );
    }

    if (selectedId === "nuts" || selectedId === "nuts-unc" || selectedId === "nuts-iso") {
      return (
        <CatalogFacetDropdown
          label="Size"
          options={
            selectedId === "nuts-iso"
              ? [{ id: "M 14", label: "M 14" }, { id: "M 20", label: "M 20" }, { id: "M 24", label: "M 24" }]
              : [{ id: '0+9/16"', label: '0+9/16"' }, { id: '0+3/4"', label: '0+3/4"' }, { id: '1"', label: '1"' }]
          }
          activeId={catalogFacets.n_size ?? (selectedId === "nuts-iso" ? "M 14" : '0+9/16"')}
          onSelect={(id) => onFacetChange("n_size", id)}
        />
      );
    }

    if (STRAINER_IDS.has(selectedId)) {
      return (
        <>
          <CatalogFacetDropdown
            label="Size (DN)"
            options={[{ id: "50", label: "50" }, { id: "150", label: "150" }, { id: "300", label: "300" }]}
            activeId={catalogFacets.st_size ?? "50"}
            onSelect={(id) => onFacetChange("st_size", id)}
          />
          <CatalogFacetDropdown
            label="Class"
            options={CLASS_OPTIONS}
            activeId={catalogFacets.st_class ?? "150#"}
            onSelect={(id) => onFacetChange("st_class", id)}
          />
        </>
      );
    }

    if (SPACING_IDS.has(selectedId)) {
      return (
        <>
          <CatalogFacetDropdown
            label="Size 1"
            options={[{ id: "65", label: "65" }, { id: "100", label: "100" }, { id: "150", label: "150" }]}
            activeId={catalogFacets.sp_size1 ?? "65"}
            onSelect={(id) => onFacetChange("sp_size1", id)}
          />
          <CatalogFacetDropdown
            label="Size 2"
            options={[{ id: "25", label: "25" }, { id: "50", label: "50" }, { id: "80", label: "80" }]}
            activeId={catalogFacets.sp_size2 ?? "25"}
            onSelect={(id) => onFacetChange("sp_size2", id)}
          />
          <CatalogFacetDropdown
            label="Class 1"
            options={CLASS_OPTIONS}
            activeId={catalogFacets.sp_class1 ?? "150#"}
            onSelect={(id) => onFacetChange("sp_class1", id)}
          />
          <CatalogFacetDropdown
            label="Class 2"
            options={CLASS_OPTIONS}
            activeId={catalogFacets.sp_class2 ?? "150#"}
            onSelect={(id) => onFacetChange("sp_class2", id)}
          />
          <CatalogFacetDropdown
            label="Insul Thk 1"
            options={INSUL_OPTIONS}
            activeId={catalogFacets.sp_ins1 ?? "25"}
            onSelect={(id) => onFacetChange("sp_ins1", id)}
          />
          <CatalogFacetDropdown
            label="Insul Thk 2"
            options={INSUL_OPTIONS}
            activeId={catalogFacets.sp_ins2 ?? "25"}
            onSelect={(id) => onFacetChange("sp_ins2", id)}
          />
        </>
      );
    }

    if (SAFE_SPAN_IDS.has(selectedId)) {
      return (
        <>
          <CatalogFacetDropdown
            label="Size"
            options={[{ id: "65", label: "65" }, { id: "100", label: "100" }, { id: "150", label: "150" }]}
            activeId={catalogFacets.ss_size ?? "65"}
            onSelect={(id) => onFacetChange("ss_size", id)}
          />
          <CatalogFacetDropdown
            label="Schedule"
            options={[{ id: "STD", label: "STD" }, { id: "XS", label: "XS" }, { id: "40", label: "40" }]}
            activeId={catalogFacets.ss_schedule ?? "STD"}
            onSelect={(id) => onFacetChange("ss_schedule", id)}
          />
          <CatalogFacetDropdown
            label="Material"
            options={[{ id: "Carbon Steel", label: "Carbon Steel" }, { id: "Stainless Steel", label: "Stainless Steel" }]}
            activeId={catalogFacets.ss_material ?? "Carbon Steel"}
            onSelect={(id) => onFacetChange("ss_material", id)}
          />
          <CatalogFacetDropdown
            label="Full / Empty"
            options={[{ id: "Full", label: "Full" }, { id: "Empty", label: "Empty" }]}
            activeId={catalogFacets.ss_fill ?? "Full"}
            onSelect={(id) => onFacetChange("ss_fill", id)}
          />
          <CatalogFacetDropdown
            label="Insul Thk"
            options={INSUL_OPTIONS}
            activeId={catalogFacets.ss_insul ?? "25"}
            onSelect={(id) => onFacetChange("ss_insul", id)}
          />
        </>
      );
    }

    if (PIPE_FLEX_IDS.has(selectedId)) {
      return (
        <>
          <CatalogFacetDropdown
            label="Size"
            options={[{ id: "65", label: "65" }, { id: "100", label: "100" }, { id: "150", label: "150" }]}
            activeId={catalogFacets.pf_size ?? "65"}
            onSelect={(id) => onFacetChange("pf_size", id)}
          />
          <CatalogFacetDropdown
            label="Material"
            options={[{ id: "Carbon Steel", label: "Carbon Steel" }, { id: "Stainless Steel", label: "Stainless Steel" }]}
            activeId={catalogFacets.pf_material ?? "Carbon Steel"}
            onSelect={(id) => onFacetChange("pf_material", id)}
          />
          <CatalogFacetDropdown
            label="Ambient"
            options={[{ id: "20", label: "20°C" }, { id: "86", label: "86°C" }]}
            activeId={catalogFacets.pf_ambient ?? "86"}
            onSelect={(id) => onFacetChange("pf_ambient", id)}
          />
          <CatalogFacetDropdown
            label="Design"
            options={[{ id: "120", label: "120°C" }, { id: "176", label: "176°C" }, { id: "250", label: "250°C" }]}
            activeId={catalogFacets.pf_design ?? "176"}
            onSelect={(id) => onFacetChange("pf_design", id)}
          />
          <CatalogFacetDropdown
            label="Dim A"
            options={[{ id: "2000", label: "2000" }, { id: "3000", label: "3000" }, { id: "5000", label: "5000" }]}
            activeId={catalogFacets.pf_dimA ?? "2000"}
            onSelect={(id) => onFacetChange("pf_dimA", id)}
          />
        </>
      );
    }

    if (selectedId === "pressure-temperature-ratings") {
      return (
        <>
          <CatalogFacetDropdown
            label="Material"
            options={[
              { id: "group-1-1", label: "Carbon Steel and low-alloy steels" },
              { id: "group-2-1", label: "Austenitic stainless steels" },
              { id: "group-3-1", label: "Duplex stainless steels" },
            ]}
            activeId={catalogFacets.ptr_material ?? "group-1-1"}
            onSelect={(id) => onFacetChange("ptr_material", id)}
          />
          <CatalogFacetDropdown
            label="Class"
            options={CLASS_OPTIONS}
            activeId={catalogFacets.ptr_class ?? "600#"}
            onSelect={(id) => onFacetChange("ptr_class", id)}
          />
          <CatalogFacetDropdown
            label="Temperature"
            options={[{ id: "100", label: "100°C" }, { id: "200", label: "200°C" }, { id: "300", label: "300°C" }]}
            activeId={catalogFacets.ptr_temp ?? "200"}
            onSelect={(id) => onFacetChange("ptr_temp", id)}
          />
        </>
      );
    }

    return null;
  }, [selectedId, catalogFacets, onFacetChange]);

  return (
    <>
      {pipeBlock}
      {fittingsBlock}
      {flangeBlock}
      {gasketFlatSpiralBlock}
      {ringJointBlock}
      {flangedValveBlock}
      {genericValveBlock}
      {architectureBlock}
    </>
  );
}
