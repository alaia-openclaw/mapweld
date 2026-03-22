"use client";

import { useMemo, useState, useEffect } from "react";
import {
  matchFlangeRowSearch,
  CATALOG_UNIT_SYSTEMS,
  getFlangePipeScheduleDisplay,
  uniqueSortedFacetValues,
  catalogFacetMatchesScalar,
} from "@/lib/catalog-structure";
import { flangeDrawingFallbackImage } from "@/lib/flanges-config";
import {
  CatalogFacetDropdown,
  catalogPanelOuterClass,
  catalogPanelToolbarClass,
  catalogTableScrollClass,
  catalogTableClassName,
} from "@/components/CatalogCategoryToolbar";

function flangePipeScheduleCell(row) {
  return getFlangePipeScheduleDisplay(row) || "—";
}

function rowMatchesFlangeSubtype(row, activeSubtypeId, subtypes) {
  if (!subtypes?.length || !activeSubtypeId) return true;
  const ft = row.attributes?.flangeType;
  if (ft) return ft === activeSubtypeId;
  return true;
}

function showWallScheduleOnBar(subtypeId, subtypes) {
  if (!subtypes?.length) return false;
  if (!subtypeId) return true;
  return ["weldneck", "lapped", "long-welding-neck"].includes(subtypeId);
}

/** All dimension rows for a flange standard (every rating / class), filtered by unit system only. */
function flattenFlangeStandardRows(standard, catalogUnitSystem) {
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

function CardFlangeDrawing({ standard, activeSubtype, selectedRow }) {
  const subtypeImage =
    standard.subtypes?.find((t) => t.id === activeSubtype)?.image ?? null;

  const chosenImage = subtypeImage || standard.primaryImage;

  const pipedataSrc =
    chosenImage && standard.databaseFolder
      ? `/api/pipedata-image?folder=${encodeURIComponent(
          standard.databaseFolder
        )}&file=${encodeURIComponent(chosenImage)}`
      : null;

  const [drawingSrc, setDrawingSrc] = useState(
    () => pipedataSrc || flangeDrawingFallbackImage
  );

  useEffect(() => {
    setDrawingSrc(pipedataSrc || flangeDrawingFallbackImage);
  }, [pipedataSrc, standard?.id, activeSubtype]);

  const id = selectedRow?.attributes?.ID ?? selectedRow?.attributes?.id;
  const od = selectedRow?.od ?? selectedRow?.attributes?.od;
  const pcd = selectedRow?.pcd ?? selectedRow?.attributes?.pcd;
  const faceThickness = selectedRow?.attributes?.thickness;
  const hubHeight =
    selectedRow?.attributes?.["hub-x"] ??
    selectedRow?.attributes?.["hub height"] ??
    null;

  return (
    <div className="rounded-lg border border-base-300 bg-base-100 p-3 flex flex-col gap-2 h-full">
      <h2 className="text-sm font-semibold truncate">{standard.label}</h2>
      <div className="flex-1 flex flex-col gap-2 bg-base-200 rounded-md overflow-hidden border border-base-300/70">
        <div className="flex-1 flex items-center justify-center bg-base-100 min-h-[160px]">
          {/* eslint-disable-next-line @next/next/no-img-element -- pipedata PNG may 404; need reliable onError fallback */}
          <img
            src={drawingSrc}
            alt={standard.label}
            onError={() =>
              setDrawingSrc((prev) =>
                prev === flangeDrawingFallbackImage ? prev : flangeDrawingFallbackImage
              )
            }
            className="max-h-full max-w-full object-contain pointer-events-none select-none"
          />
        </div>
        <div className="px-2 pb-2 pt-1 bg-base-100/90 border-t border-base-300 text-[11px] text-base-content/80 grid grid-cols-2 gap-x-3 gap-y-0.5">
          <div>
            <span className="font-semibold">ID</span>{" "}
            <span>{id ?? "—"}</span>
          </div>
          <div>
            <span className="font-semibold">OD</span>{" "}
            <span>{od ?? "—"}</span>
          </div>
          <div>
            <span className="font-semibold">PCD</span>{" "}
            <span>{pcd ?? "—"}</span>
          </div>
          <div>
            <span className="font-semibold">Face</span>{" "}
            <span>{faceThickness ?? "—"}</span>
          </div>
          <div>
            <span className="font-semibold">Hub height</span>{" "}
            <span>{hubHeight ?? "—"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TableFlangeDimensions({
  baseRows = [],
  activeRatingFilter = "",
  selectedRowId,
  onSelectRow,
  search = "",
  catalogUnitSystem = "",
  activeFaceType = "",
  activeNps = "",
  activeWall = "",
  showWallBar = true,
  activeOd = "",
  activePcd = "",
}) {
  const rowsToShow = useMemo(() => {
    return baseRows.filter((row) => {
      if (activeRatingFilter && String(row.pressureClass) !== String(activeRatingFilter)) return false;
      if (search?.trim() && !matchFlangeRowSearch(row, search)) return false;
      if (activeFaceType) {
        const ft = row.attributes?.faceType;
        if (String(ft ?? "").trim() !== activeFaceType) return false;
      }
      if (activeNps) {
        if (String(row.nps ?? "").trim() !== activeNps) return false;
      }
      if (showWallBar && activeWall) {
        if (getFlangePipeScheduleDisplay(row) !== activeWall) return false;
      }
      if (!catalogFacetMatchesScalar(row.od, activeOd)) return false;
      if (!catalogFacetMatchesScalar(row.pcd, activePcd)) return false;
      return true;
    });
  }, [
    baseRows,
    activeRatingFilter,
    search,
    activeFaceType,
    activeNps,
    activeWall,
    showWallBar,
    activeOd,
    activePcd,
  ]);

  if (!baseRows.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 h-full text-xs text-base-content/60 px-4 text-center">
        <span>No dimensions for the selected unit system.</span>
        <span className="text-[11px] text-base-content/50">
          Switch <strong>Units</strong> (Imperial / Metric) in the catalog toolbar.
        </span>
      </div>
    );
  }

  const isMetric = catalogUnitSystem === "Metric";

  return (
    <div className={`h-full min-h-0 ${catalogTableScrollClass}`}>
      <table className={catalogTableClassName}>
        <thead>
          <tr>
            <th>System</th>
            <th>Rating</th>
            <th>NPS / NB</th>
            <th title="Same ASME pipe wall schedule as Pipe and butt-weld fittings (bore / mating pipe): STD, XS, 40, 80S, … — from Pipedata CSV columns such as Sch or Schedule when present; not the flange face column named thickness.">
              Pipe schedule
            </th>
            <th>{isMetric ? "OD (mm)" : "OD (in)"}</th>
            <th>{isMetric ? "PCD (mm)" : "PCD (in)"}</th>
          </tr>
        </thead>
        <tbody>
          {rowsToShow.map((row) => {
            const isActive = row.id === selectedRowId;
            return (
              <tr
                key={row.id}
                className={isActive ? "bg-primary/10 cursor-pointer" : "cursor-pointer"}
                onClick={() => onSelectRow?.(row)}
              >
                <td>{row.system}</td>
                <td>{row.pressureClass ?? "—"}</td>
                <td>{row.nps}</td>
                <td>{flangePipeScheduleCell(row)}</td>
                <td>{row.od ?? "—"}</td>
                <td>{row.pcd ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PanelCatalogFlanges({
  standards,
  initialStandardId,
  search = "",
  catalogUnitSystem = CATALOG_UNIT_SYSTEMS[0],
}) {
  const [activeStandardId, setActiveStandardId] = useState(() => {
    if (initialStandardId && standards.some((s) => s.id === initialStandardId))
      return initialStandardId;
    return standards.find((s) => s.classes?.length)?.id || standards[0]?.id;
  });

  useEffect(() => {
    if (initialStandardId && standards.some((s) => s.id === initialStandardId)) {
      setActiveStandardId(initialStandardId);
    }
  }, [initialStandardId, standards]);

  const activeStandard = useMemo(
    () => standards.find((s) => s.id === activeStandardId) || standards[0],
    [standards, activeStandardId]
  );

  const classes = useMemo(() => activeStandard?.classes ?? [], [activeStandard]);

  const [activeSubtypeId, setActiveSubtypeId] = useState("");

  useEffect(() => {
    setActiveSubtypeId("");
  }, [activeStandardId, standards]);

  const [activeRatingFilter, setActiveRatingFilter] = useState("");
  const [activeFaceType, setActiveFaceType] = useState("");
  const [activeNps, setActiveNps] = useState("");
  const [activeWall, setActiveWall] = useState("");
  const [activeOd, setActiveOd] = useState("");
  const [activePcd, setActivePcd] = useState("");

  useEffect(() => {
    setActiveRatingFilter("");
    setActiveFaceType("");
    setActiveNps("");
    setActiveWall("");
    setActiveOd("");
    setActivePcd("");
  }, [activeStandardId, activeSubtypeId, catalogUnitSystem]);

  const allBaseRows = useMemo(
    () => flattenFlangeStandardRows(activeStandard, catalogUnitSystem),
    [activeStandard, catalogUnitSystem]
  );

  const baseRowsForSubtype = useMemo(
    () =>
      allBaseRows.filter((row) =>
        rowMatchesFlangeSubtype(row, activeSubtypeId, activeStandard?.subtypes)
      ),
    [allBaseRows, activeSubtypeId, activeStandard]
  );

  const uniqueFaceTypes = useMemo(
    () => uniqueSortedFacetValues(baseRowsForSubtype.map((r) => r.attributes?.faceType)),
    [baseRowsForSubtype]
  );

  const uniqueNps = useMemo(
    () => uniqueSortedFacetValues(baseRowsForSubtype.map((r) => r.nps)),
    [baseRowsForSubtype]
  );

  const uniqueWall = useMemo(
    () =>
      uniqueSortedFacetValues(
        baseRowsForSubtype.map((r) => getFlangePipeScheduleDisplay(r)).filter(Boolean)
      ),
    [baseRowsForSubtype]
  );

  const uniqueRatings = useMemo(
    () => uniqueSortedFacetValues(allBaseRows.map((r) => r.pressureClass)),
    [allBaseRows]
  );

  const uniqueOd = useMemo(
    () => uniqueSortedFacetValues(baseRowsForSubtype.map((r) => r.od)),
    [baseRowsForSubtype]
  );

  const uniquePcd = useMemo(
    () => uniqueSortedFacetValues(baseRowsForSubtype.map((r) => r.pcd)),
    [baseRowsForSubtype]
  );

  const showPipeScheduleFacet =
    showWallScheduleOnBar(activeSubtypeId, activeStandard?.subtypes) && uniqueWall.length > 0;

  const [selectedRow, setSelectedRow] = useState(null);

  const drawingSubtypeId =
    activeSubtypeId || activeStandard?.subtypes?.[0]?.id || "";

  const classOptions = useMemo(
    () => uniqueRatings.map((pc) => ({ id: String(pc), label: String(pc) })),
    [uniqueRatings]
  );

  const subtypeOptions = useMemo(
    () =>
      (activeStandard?.subtypes ?? []).map((t) => ({
        id: t.id,
        label: t.label,
      })),
    [activeStandard]
  );

  const faceOptions = useMemo(
    () => uniqueFaceTypes.map((ft) => ({ id: ft, label: ft })),
    [uniqueFaceTypes]
  );

  const npsOptions = useMemo(
    () => uniqueNps.map((n) => ({ id: n, label: n })),
    [uniqueNps]
  );

  const wallOptions = useMemo(
    () => uniqueWall.map((w) => ({ id: w, label: w })),
    [uniqueWall]
  );

  const odLabel = catalogUnitSystem === "Metric" ? "OD (mm)" : "OD (in)";
  const pcdLabel = catalogUnitSystem === "Metric" ? "PCD (mm)" : "PCD (in)";

  return (
    <div className={catalogPanelOuterClass}>
      <div className="flex-1 flex flex-col min-w-0">
        <div className={catalogPanelToolbarClass}>
          {subtypeOptions.length > 1 ? (
            <CatalogFacetDropdown
              label="Flange type"
              options={[{ id: "", label: "All types" }, ...subtypeOptions]}
              activeId={activeSubtypeId}
              onSelect={setActiveSubtypeId}
            />
          ) : null}
          {classOptions.length > 0 ? (
            <CatalogFacetDropdown
              label="Rating (class)"
              options={[{ id: "", label: "All ratings" }, ...classOptions]}
              activeId={activeRatingFilter}
              onSelect={setActiveRatingFilter}
            />
          ) : null}
          {faceOptions.length > 0 ? (
            <CatalogFacetDropdown
              label="Face type"
              options={[{ id: "", label: "All" }, ...faceOptions]}
              activeId={activeFaceType}
              onSelect={(id) => setActiveFaceType(id)}
            />
          ) : null}
          {npsOptions.length > 0 ? (
            <CatalogFacetDropdown
              label="Size (NPS / NB)"
              options={[{ id: "", label: "All sizes" }, ...npsOptions]}
              activeId={activeNps}
              onSelect={(id) => setActiveNps(id)}
            />
          ) : null}
          {showPipeScheduleFacet ? (
            <CatalogFacetDropdown
              label="Pipe schedule"
              options={[{ id: "", label: "All" }, ...wallOptions]}
              activeId={activeWall}
              onSelect={(id) => setActiveWall(id)}
            />
          ) : null}
          {uniqueOd.length > 0 ? (
            <CatalogFacetDropdown
              label={odLabel}
              options={[{ id: "", label: "All" }, ...uniqueOd.map((o) => ({ id: o, label: o }))]}
              activeId={activeOd}
              onSelect={(id) => setActiveOd(id)}
            />
          ) : null}
          {uniquePcd.length > 0 ? (
            <CatalogFacetDropdown
              label={pcdLabel}
              options={[{ id: "", label: "All" }, ...uniquePcd.map((p) => ({ id: p, label: p }))]}
              activeId={activePcd}
              onSelect={(id) => setActivePcd(id)}
            />
          ) : null}
        </div>
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)] gap-3 p-3 min-h-0">
          <CardFlangeDrawing
            standard={activeStandard}
            activeSubtype={drawingSubtypeId}
            selectedRow={selectedRow}
          />
          <TableFlangeDimensions
            baseRows={baseRowsForSubtype}
            activeRatingFilter={activeRatingFilter}
            selectedRowId={selectedRow?.id}
            onSelectRow={setSelectedRow}
            search={search}
            catalogUnitSystem={catalogUnitSystem}
            activeFaceType={activeFaceType}
            activeNps={activeNps}
            activeWall={activeWall}
            showWallBar={showPipeScheduleFacet}
            activeOd={activeOd}
            activePcd={activePcd}
          />
        </div>
      </div>
    </div>
  );
}

export default PanelCatalogFlanges;
