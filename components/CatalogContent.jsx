"use client";

import PanelCatalogFlanges from "@/components/PanelCatalogFlanges";
import PanelCatalogPipe from "@/components/PanelCatalogPipe";
import PanelCatalogFittings from "@/components/PanelCatalogFittings";
import PanelCatalogNonmetallicFlatGaskets from "@/components/PanelCatalogNonmetallicFlatGaskets";
import PanelCatalogSpiralWoundGaskets from "@/components/PanelCatalogSpiralWoundGaskets";
import PanelCatalogRingJointGaskets from "@/components/PanelCatalogRingJointGaskets";
import PanelCatalogFlangedValves from "@/components/PanelCatalogFlangedValves";
import PanelCatalogButtweldedValves from "@/components/PanelCatalogButtweldedValves";
import PanelCatalogThreadedValves from "@/components/PanelCatalogThreadedValves";
import PanelCatalogSocketweldedValves from "@/components/PanelCatalogSocketweldedValves";
import PanelCatalogBranchOverview from "@/components/PanelCatalogBranchOverview";
import { THREADED_VALVE_TYPES } from "@/lib/threaded-valves-data";
import { findNodeById } from "@/lib/catalog-tree-path";
import {
  parseFittingsSelectionId,
  filterFittingsBySubtype,
  CATALOG_UNIT_SYSTEMS,
} from "@/lib/catalog-structure";

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

const BUTTWELDED_VALVE_LEAF_IDS = new Set([
  "valves-buttwelded-gate",
  "valves-buttwelded-globe",
  "valves-buttwelded-ball",
  "valves-buttwelded-swing-check",
]);

const THREADED_VALVE_LEAF_IDS = new Set(THREADED_VALVE_TYPES.map((t) => t.selectionId));

const SOCKETWELDED_VALVE_LEAF_IDS = new Set([
  "valves-socketwelded-gate",
  "valves-socketwelded-globe",
  "valves-socketwelded-horizontal-check",
  "valves-socketwelded-vertical-check",
  "valves-socketwelded-ball",
]);

export default function CatalogContent({
  tree = [],
  selectedId,
  search = "",
  flangesStandards = [],
  pipeEntries = [],
  fittingsEntries = [],
  onSelectCategory,
  catalogUnitSystem = CATALOG_UNIT_SYSTEMS[0],
  catalogFacets = {},
  mergeFacets = () => {},
}) {
  if (!selectedId) {
    return (
      <div className="rounded-xl border border-base-300 bg-base-200/60 p-8 text-center text-base-content/60">
        Select a category from the sidebar.
      </div>
    );
  }

  if (selectedId === "pipe") {
    return (
      <PanelCatalogPipe entries={pipeEntries} search={search} catalogUnitSystem={catalogUnitSystem} />
    );
  }

  if (selectedId?.startsWith("flange-")) {
    if (!flangesStandards.length) {
      return (
        <div className="rounded-xl border border-base-300 bg-base-200/60 p-8 text-center text-sm text-base-content/70">
          No flange reference data found. Ensure the Pipedata <code className="text-xs">Database</code> folder is
          present.
        </div>
      );
    }
    const standardId = selectedId.slice(7);
    return (
      <PanelCatalogFlanges
        standards={flangesStandards}
        initialStandardId={standardId}
        search={search}
        catalogUnitSystem={catalogUnitSystem}
        catalogFacets={catalogFacets}
      />
    );
  }

  if (
    selectedId === "gasket-nonmetallic-flat-b16-5" ||
    selectedId === "gasket-nonmetallic-flat-b16-47a" ||
    selectedId === "gasket-nonmetallic-flat-b16-47b"
  ) {
    return (
      <PanelCatalogNonmetallicFlatGaskets
        selectionId={selectedId}
        search={search}
        catalogFacets={catalogFacets}
        mergeFacets={mergeFacets}
      />
    );
  }

  if (
    selectedId === "gasket-spiral-wound-b16-5" ||
    selectedId === "gasket-spiral-wound-b16-47a" ||
    selectedId === "gasket-spiral-wound-b16-47b"
  ) {
    return (
      <PanelCatalogSpiralWoundGaskets
        selectionId={selectedId}
        search={search}
        catalogFacets={catalogFacets}
        mergeFacets={mergeFacets}
      />
    );
  }

  if (
    selectedId === "gasket-ring-joint-r" ||
    selectedId === "gasket-ring-joint-rx" ||
    selectedId === "gasket-ring-joint-bx"
  ) {
    return (
      <PanelCatalogRingJointGaskets
        selectionId={selectedId}
        search={search}
        catalogFacets={catalogFacets}
        mergeFacets={mergeFacets}
      />
    );
  }

  if (FLANGED_VALVE_LEAF_IDS.has(selectedId)) {
    return (
      <PanelCatalogFlangedValves
        selectionId={selectedId}
        search={search}
        catalogFacets={catalogFacets}
        mergeFacets={mergeFacets}
      />
    );
  }

  if (BUTTWELDED_VALVE_LEAF_IDS.has(selectedId)) {
    return (
      <PanelCatalogButtweldedValves
        selectionId={selectedId}
        search={search}
        catalogFacets={catalogFacets}
        mergeFacets={mergeFacets}
      />
    );
  }

  if (THREADED_VALVE_LEAF_IDS.has(selectedId)) {
    return (
      <PanelCatalogThreadedValves
        selectionId={selectedId}
        search={search}
        catalogFacets={catalogFacets}
        mergeFacets={mergeFacets}
      />
    );
  }

  if (SOCKETWELDED_VALVE_LEAF_IDS.has(selectedId)) {
    return (
      <PanelCatalogSocketweldedValves
        selectionId={selectedId}
        search={search}
        catalogFacets={catalogFacets}
        mergeFacets={mergeFacets}
      />
    );
  }

  if (selectedId === "valves-flanged") {
    return (
      <div className="rounded-xl border border-base-300 bg-base-200/60 p-8 text-center text-base-content/70 text-sm">
        Select a flanged valve type in the sidebar (e.g. <strong>Flanged Gate Valve</strong> or{" "}
        <strong>Wafer Type Butterfly Valve</strong>).
      </div>
    );
  }

  if (selectedId === "valves-buttwelded") {
    return (
      <div className="rounded-xl border border-base-300 bg-base-200/60 p-8 text-center text-base-content/70 text-sm">
        Select a buttwelded valve type in the sidebar (e.g. <strong>Buttwelded Gate Valve</strong> or{" "}
        <strong>Buttwelded Ball Valve</strong>).
      </div>
    );
  }

  if (selectedId === "valves-threaded") {
    return (
      <div className="rounded-xl border border-base-300 bg-base-200/60 p-8 text-center text-base-content/70 text-sm">
        Select a threaded valve type in the sidebar (e.g. <strong>Threaded Gate Valve</strong> or{" "}
        <strong>Threaded Ball Valve</strong>).
      </div>
    );
  }

  if (selectedId === "valves-socketwelded") {
    return (
      <div className="rounded-xl border border-base-300 bg-base-200/60 p-8 text-center text-base-content/70 text-sm">
        Select a socketwelded valve type in the sidebar (e.g. <strong>Socketwelded Gate Valve</strong>).
      </div>
    );
  }

  const fittingsParsed = parseFittingsSelectionId(selectedId);
  if (fittingsParsed) {
    const { connectionType, subtypeId } = fittingsParsed;
    const filtered = filterFittingsBySubtype(
      fittingsEntries,
      connectionType,
      subtypeId
    );
    return (
      <PanelCatalogFittings
        key={selectedId}
        entries={filtered}
        search={search}
        catalogUnitSystem={catalogUnitSystem}
        catalogFacets={catalogFacets}
      />
    );
  }

  if (tree?.length) {
    const node = findNodeById(tree, selectedId);
    if (node?.children?.length) {
      return (
        <PanelCatalogBranchOverview
          tree={tree}
          selectedId={selectedId}
          onSelectChild={onSelectCategory}
        />
      );
    }
    if (node && !node.children?.length) {
      return (
        <div className="rounded-xl border border-base-300 bg-base-200/60 p-8 text-center">
          <p className="font-semibold text-base-content">{node.label}</p>
          <p className="mt-2 text-sm text-base-content/70">
            No spreadsheet-style table is bundled for this catalog entry. Use pipe, flanges, fittings, gaskets, or
            valves for data-backed tables when the reference database is installed.
          </p>
        </div>
      );
    }
  }

  return (
    <div className="rounded-xl border border-base-300 bg-base-200/60 p-8 text-center text-base-content/60">
      Unknown category.
    </div>
  );
}
