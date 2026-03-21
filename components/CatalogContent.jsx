"use client";

import PanelCatalogFlanges from "@/components/PanelCatalogFlanges";
import PanelCatalogPipe from "@/components/PanelCatalogPipe";
import PanelCatalogFittings from "@/components/PanelCatalogFittings";
import PanelCatalogNonmetallicFlatGaskets from "@/components/PanelCatalogNonmetallicFlatGaskets";
import PanelCatalogSpiralWoundGaskets from "@/components/PanelCatalogSpiralWoundGaskets";
import PanelCatalogRingJointGaskets from "@/components/PanelCatalogRingJointGaskets";
import PanelCatalogFlangedValves from "@/components/PanelCatalogFlangedValves";
import PanelCatalogButtweldedValves from "@/components/PanelCatalogButtweldedValves";
import {
  parseFittingsSelectionId,
  filterFittingsBySubtype,
} from "@/lib/catalog-structure";

function EmptyCategory({ categoryLabel }) {
  return (
    <div className="rounded-xl border border-base-300 bg-base-200/60 p-8 text-center">
      <p className="text-base-content/70">
        No data available for <strong>{categoryLabel}</strong> yet.
      </p>
    </div>
  );
}

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

export default function CatalogContent({
  selectedId,
  search = "",
  filters = [],
  flangesStandards = [],
  pipeEntries = [],
  fittingsEntries = [],
  onSelectCategory,
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
      <PanelCatalogPipe
        entries={pipeEntries}
        search={search}
        filters={filters}
      />
    );
  }

  if (selectedId?.startsWith("flange-")) {
    if (!flangesStandards.length) {
      return <EmptyCategory categoryLabel="Flange" />;
    }
    const standardId = selectedId.slice(7); // "flange-".length
    return (
      <PanelCatalogFlanges
        standards={flangesStandards}
        initialStandardId={standardId}
        search={search}
        filters={filters}
      />
    );
  }

  if (
    selectedId === "gasket-nonmetallic-flat-b16-5" ||
    selectedId === "gasket-nonmetallic-flat-b16-47a" ||
    selectedId === "gasket-nonmetallic-flat-b16-47b"
  ) {
    return (
      <PanelCatalogNonmetallicFlatGaskets selectionId={selectedId} search={search} />
    );
  }

  if (
    selectedId === "gasket-spiral-wound-b16-5" ||
    selectedId === "gasket-spiral-wound-b16-47a" ||
    selectedId === "gasket-spiral-wound-b16-47b"
  ) {
    return <PanelCatalogSpiralWoundGaskets selectionId={selectedId} search={search} />;
  }

  if (
    selectedId === "gasket-ring-joint-r" ||
    selectedId === "gasket-ring-joint-rx" ||
    selectedId === "gasket-ring-joint-bx"
  ) {
    return <PanelCatalogRingJointGaskets selectionId={selectedId} search={search} />;
  }

  if (
    selectedId === "gasket" ||
    selectedId === "gasket-nonmetallic-flat" ||
    selectedId === "gasket-spiral-wound" ||
    selectedId === "gasket-ring-joint"
  ) {
    return (
      <div className="rounded-xl border border-base-300 bg-base-200/60 p-8 text-center text-base-content/70 text-sm">
        Select a gasket type in the sidebar (e.g. <strong>Nonmetallic Flat</strong>, <strong>Spiral-Wound</strong>, or{" "}
        <strong>Ring-Joint</strong> → type).
      </div>
    );
  }
  if (FLANGED_VALVE_LEAF_IDS.has(selectedId)) {
    return (
      <PanelCatalogFlangedValves
        selectionId={selectedId}
        search={search}
        onSelectCategory={onSelectCategory}
      />
    );
  }

  if (BUTTWELDED_VALVE_LEAF_IDS.has(selectedId)) {
    return (
      <PanelCatalogButtweldedValves
        selectionId={selectedId}
        search={search}
        onSelectCategory={onSelectCategory}
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

  if (selectedId === "valves") {
    return (
      <div className="rounded-xl border border-base-300 bg-base-200/60 p-8 text-center text-base-content/70 text-sm">
        Expand <strong>Valves</strong> → <strong>Flanged Valves</strong> or <strong>Buttwelded Valves</strong>, then pick
        a valve type.
      </div>
    );
  }
  if (selectedId === "line-blanks") {
    return <EmptyCategory categoryLabel="Line Blanks" />;
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
        entries={filtered}
        search={search}
        filters={filters}
      />
    );
  }

  return (
    <div className="rounded-xl border border-base-300 bg-base-200/60 p-8 text-center text-base-content/60">
      Unknown category.
    </div>
  );
}
