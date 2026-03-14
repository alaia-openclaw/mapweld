"use client";

import PanelCatalogFlanges from "@/components/PanelCatalogFlanges";
import PanelCatalogPipe from "@/components/PanelCatalogPipe";
import PanelCatalogFittings from "@/components/PanelCatalogFittings";
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

export default function CatalogContent({
  selectedId,
  search = "",
  filters = [],
  flangesStandards = [],
  pipeEntries = [],
  fittingsEntries = [],
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

  if (selectedId === "gasket") {
    return <EmptyCategory categoryLabel="Gasket" />;
  }
  if (selectedId === "valves") {
    return <EmptyCategory categoryLabel="Valves" />;
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
