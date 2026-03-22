"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import CatalogSidebar from "@/components/CatalogSidebar";
import CatalogContent from "@/components/CatalogContent";
import CatalogFilterBar from "@/components/CatalogFilterBar";
import {
  CATEGORY_TREE,
  getFirstSelectableCategoryId,
  computeCategoryCounts,
  injectFlangeChildren,
  CATALOG_UNIT_SYSTEMS,
} from "@/lib/catalog-structure";

export default function CatalogView({
  flangesStandards = [],
  pipeEntries = [],
  fittingsEntries = [],
}) {
  const tree = useMemo(
    () => injectFlangeChildren(CATEGORY_TREE, flangesStandards),
    [flangesStandards]
  );

  const defaultSelected = useMemo(() => {
    if (pipeEntries.length > 0) return "pipe";
    if (flangesStandards.length > 0)
      return `flange-${flangesStandards[0].id}`;
    if (fittingsEntries.length > 0) return "fittings-buttwelding-elbow";
    return getFirstSelectableCategoryId(tree);
  }, [tree, pipeEntries, flangesStandards, fittingsEntries]);

  const [selectedId, setSelectedId] = useState(defaultSelected);
  const [search, setSearch] = useState("");
  const [catalogUnitSystem, setCatalogUnitSystem] = useState(
    () => CATALOG_UNIT_SYSTEMS[0]
  );

  /** Category-specific property filters (DN, class, NPS, …) — rendered in the top catalog bar only. */
  const [catalogFacets, setCatalogFacets] = useState({});

  useEffect(() => {
    setCatalogFacets({});
  }, [selectedId, catalogUnitSystem]);

  const handleFacetChange = useCallback((key, value) => {
    setCatalogFacets((prev) => ({ ...prev, [key]: value }));
  }, []);

  const mergeFacets = useCallback((patch) => {
    setCatalogFacets((prev) => ({ ...prev, ...patch }));
  }, []);

  const counts = useMemo(
    () =>
      computeCategoryCounts(search, [], {
        pipeEntries,
        fittingsEntries,
        flangesStandards,
        tree,
        catalogUnitSystem,
      }),
    [search, pipeEntries, fittingsEntries, flangesStandards, tree, catalogUnitSystem]
  );

  return (
    <div className="flex flex-col rounded-xl border border-base-300 bg-base-100 overflow-hidden min-h-[calc(100dvh-7rem)]">
      <CatalogFilterBar
        search={search}
        onSearchChange={setSearch}
        catalogUnitSystem={catalogUnitSystem}
        onCatalogUnitSystemChange={setCatalogUnitSystem}
        selectedId={selectedId}
        catalogFacets={catalogFacets}
        onFacetChange={handleFacetChange}
        pipeEntries={pipeEntries}
        fittingsEntries={fittingsEntries}
        flangesStandards={flangesStandards}
      />
      <div className="flex flex-1 min-h-0">
        <CatalogSidebar
          tree={tree}
          selectedId={selectedId}
          onSelect={setSelectedId}
          counts={counts}
        />
        <div className="flex-1 min-w-0 p-3 overflow-auto">
          <CatalogContent
            tree={tree}
            selectedId={selectedId}
            search={search}
            flangesStandards={flangesStandards}
            pipeEntries={pipeEntries}
            fittingsEntries={fittingsEntries}
            onSelectCategory={setSelectedId}
            catalogUnitSystem={catalogUnitSystem}
            catalogFacets={catalogFacets}
            mergeFacets={mergeFacets}
          />
        </div>
      </div>
    </div>
  );
}
