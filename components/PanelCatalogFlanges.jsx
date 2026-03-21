"use client";

import { useMemo, useState, useEffect } from "react";
import {
  matchFlangeRowSearch,
  matchFlangeRowFilters,
  CATALOG_UNIT_SYSTEMS,
  getFlangePipeScheduleDisplay,
} from "@/lib/catalog-structure";
import { flangeDrawingFallbackImage } from "@/lib/flanges-config";

function flangePipeScheduleCell(row) {
  return getFlangePipeScheduleDisplay(row) || "—";
}

function rowMatchesFlangeSubtype(row, activeSubtypeId, subtypes) {
  if (!subtypes?.length || !activeSubtypeId) return true;
  const ft = row.attributes?.flangeType;
  if (ft) return ft === activeSubtypeId;
  return true;
}

/**
 * Reference: data/pipedata-catalog-tree.md — Schedule on bar for Weldneck / Lapped / long neck (B16.5).
 * Standards without a flange-type submenu (e.g. B16.47) do not show Schedule on the bar in the reference.
 */
function showWallScheduleOnBar(subtypeId, subtypes) {
  if (!subtypes?.length) return false;
  if (!subtypeId) return true;
  return ["weldneck", "lapped", "long-welding-neck"].includes(subtypeId);
}

function uniqueSortedStrings(values) {
  const set = new Set();
  for (const v of values) {
    const s = v != null && String(v).trim() !== "" ? String(v).trim() : null;
    if (s) set.add(s);
  }
  return Array.from(set).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
  );
}

/**
 * Pipedata-style toolbar control: label on top, current value below, menu opens on click.
 * Matches the “blue bar” dropdown pattern described in data/pipedata-catalog-tree.md.
 */
function FlangeToolbarDropdown({
  label,
  valueDisplay,
  options,
  activeId,
  onSelect,
  disabled = false,
  placeholder = "—",
  menuClassName = "",
}) {
  const active = options.find((o) => String(o.id) === String(activeId));
  const display = active?.label ?? valueDisplay ?? placeholder;

  return (
    <div
      className={`dropdown dropdown-start min-w-[7.5rem] max-w-[min(100vw-2rem,16rem)] flex-1 sm:flex-none ${
        disabled ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      <div
        tabIndex={disabled ? -1 : 0}
        role="button"
        className="btn btn-sm btn-outline border-base-300 bg-base-100 h-auto min-h-12 py-2 px-3 w-full flex flex-col items-stretch gap-0.5 normal-case font-normal"
      >
        <span className="text-[10px] font-semibold uppercase tracking-wide text-base-content/60 text-left">
          {label}
        </span>
        <span className="text-xs font-medium text-left whitespace-normal leading-snug truncate">
          {display}
        </span>
      </div>
      {!disabled && options.length > 0 ? (
        <ul
          tabIndex={0}
          className={`dropdown-content z-[40] menu p-2 shadow-lg bg-base-100 rounded-box w-[min(100vw-1.5rem,18rem)] max-h-[min(70vh,22rem)] overflow-y-auto border border-base-300 mt-1 ${menuClassName}`}
        >
          {options.map((opt) => (
            <li key={opt.id} className="w-full">
              <button
                type="button"
                className={`w-full text-left whitespace-normal leading-snug py-2.5 min-h-0 h-auto rounded-lg text-xs ${
                  String(activeId) === String(opt.id)
                    ? "active bg-primary text-primary-content font-medium"
                    : ""
                }`}
                onClick={() => {
                  onSelect(opt.id);
                  if (typeof document !== "undefined") document.activeElement?.blur?.();
                }}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
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
  const faceThickness =
    selectedRow?.attributes?.thickness ?? selectedRow?.thickness;
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
  selectedClass,
  selectedRowId,
  onSelectRow,
  search = "",
  filters = [],
  standardLabel = "",
  flangeSubtypeId = "",
  subtypes = null,
  catalogUnitSystem = "",
  activeFaceType = "",
  activeNps = "",
  activeWall = "",
  showWallBar = true,
}) {
  const allRows = useMemo(() => {
    if (!selectedClass) return [];
    const rows = [];
    selectedClass.datasets.forEach((ds) => {
      if (catalogUnitSystem && ds.system && ds.system !== catalogUnitSystem) return;
      ds.rows.forEach((row) => {
        rows.push({
          ...row,
          system: ds.system,
          standardLabel,
          pressureClass: selectedClass.pressureClass,
        });
      });
    });
    return rows;
  }, [selectedClass, standardLabel, catalogUnitSystem]);

  const filteredRows = useMemo(() => {
    return allRows.filter((row) => {
      if (search?.trim() && !matchFlangeRowSearch(row, search)) return false;
      if (!matchFlangeRowFilters(row, filters)) return false;
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
      return true;
    });
  }, [allRows, search, filters, activeFaceType, activeNps, activeWall, showWallBar]);

  const rowsForSubtype = useMemo(() => {
    return filteredRows.filter((row) => rowMatchesFlangeSubtype(row, flangeSubtypeId, subtypes));
  }, [filteredRows, flangeSubtypeId, subtypes]);

  if (!selectedClass) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-base-content/60">
        Select a pressure class to see dimensions.
      </div>
    );
  }

  if (!allRows.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 h-full text-xs text-base-content/60 px-4 text-center">
        <span>No dimensions for the selected unit system in this rating.</span>
        <span className="text-[11px] text-base-content/50">
          Switch <strong>Units</strong> (Imperial / Metric) in the catalog toolbar.
        </span>
      </div>
    );
  }

  const isMetric = catalogUnitSystem === "Metric";

  return (
    <div className="overflow-auto h-full rounded-lg border border-base-300 bg-base-100">
      <table className="table table-xs">
        <thead>
          <tr>
            <th>System</th>
            <th>NPS / NB</th>
            <th title="Same ASME pipe wall schedule as Pipe and butt-weld fittings (bore / mating pipe): STD, XS, 40, 80S, … — from the Schedule column in Pipedata CSV when present; not flange neck thickness.">
              Pipe schedule
            </th>
            <th>{isMetric ? "OD (mm)" : "OD (in)"}</th>
            <th>{isMetric ? "PCD (mm)" : "PCD (in)"}</th>
          </tr>
        </thead>
        <tbody>
          {rowsForSubtype.map((row) => {
            const isActive = row.id === selectedRowId;
            return (
              <tr
                key={row.id}
                className={isActive ? "bg-primary/10 cursor-pointer" : "cursor-pointer"}
                onClick={() => onSelectRow?.(row)}
              >
                <td>{row.system}</td>
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
  filters = [],
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

  const [activeClassId, setActiveClassId] = useState(() => {
    const initialStandard =
      standards.find((s) => s.classes?.length) || standards[0];
    return String(initialStandard?.classes?.[0]?.pressureClass ?? "");
  });

  const classes = useMemo(
    () => activeStandard?.classes ?? [],
    [activeStandard]
  );

  const [activeSubtypeId, setActiveSubtypeId] = useState(
    () => activeStandard?.subtypes?.[0]?.id ?? ""
  );

  useEffect(() => {
    const std = standards.find((s) => s.id === activeStandardId);
    if (std?.subtypes?.length) setActiveSubtypeId(std.subtypes[0].id);
    else setActiveSubtypeId("");
  }, [activeStandardId, standards]);

  const selectedClass = useMemo(
    () =>
      classes.find((cls) => String(cls.pressureClass) === String(activeClassId)) ||
      classes[0],
    [classes, activeClassId]
  );

  const [activeFaceType, setActiveFaceType] = useState("");
  const [activeNps, setActiveNps] = useState("");
  const [activeWall, setActiveWall] = useState("");

  useEffect(() => {
    setActiveFaceType("");
    setActiveNps("");
    setActiveWall("");
  }, [activeClassId, activeStandardId, activeSubtypeId, catalogUnitSystem]);

  const baseRowsForOptions = useMemo(() => {
    if (!selectedClass) return [];
    const rows = [];
    selectedClass.datasets.forEach((ds) => {
      if (catalogUnitSystem && ds.system && ds.system !== catalogUnitSystem) return;
      ds.rows.forEach((row) => {
        rows.push({
          ...row,
          system: ds.system,
          standardLabel: activeStandard?.label ?? "",
          pressureClass: selectedClass.pressureClass,
        });
      });
    });
    return rows.filter((row) =>
      rowMatchesFlangeSubtype(row, activeSubtypeId, activeStandard?.subtypes)
    );
  }, [selectedClass, catalogUnitSystem, activeSubtypeId, activeStandard]);

  const uniqueFaceTypes = useMemo(
    () => uniqueSortedStrings(baseRowsForOptions.map((r) => r.attributes?.faceType)),
    [baseRowsForOptions]
  );

  const uniqueNps = useMemo(
    () => uniqueSortedStrings(baseRowsForOptions.map((r) => r.nps)),
    [baseRowsForOptions]
  );

  const uniqueWall = useMemo(
    () =>
      uniqueSortedStrings(
        baseRowsForOptions.map((r) => getFlangePipeScheduleDisplay(r)).filter(Boolean)
      ),
    [baseRowsForOptions]
  );

  const showWallDropdown =
    showWallScheduleOnBar(activeSubtypeId, activeStandard?.subtypes) && uniqueWall.length > 1;

  const [selectedRow, setSelectedRow] = useState(null);

  const handleSelectRow = (row) => {
    setSelectedRow(row);
  };

  const standardOptions = useMemo(
    () => standards.map((s) => ({ id: s.id, label: s.label })),
    [standards]
  );

  const classOptions = useMemo(
    () =>
      classes.map((cls) => ({
        id: String(cls.pressureClass),
        label: String(cls.pressureClass),
      })),
    [classes]
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

  return (
    <div className="flex h-[calc(100dvh-7rem)] min-h-[420px] rounded-xl border border-base-300 bg-base-200/60 overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-3 py-2 border-b border-base-300 bg-base-200/60 flex flex-wrap items-end gap-2 gap-y-2">
          <FlangeToolbarDropdown
            label="Flange standard"
            options={standardOptions}
            activeId={activeStandardId}
            onSelect={(id) => {
              setActiveStandardId(id);
              const std = standards.find((s) => s.id === id);
              const firstClass = std?.classes?.[0];
              setActiveClassId(String(firstClass?.pressureClass ?? ""));
            }}
          />
          {subtypeOptions.length > 1 ? (
            <FlangeToolbarDropdown
              label="Flange type"
              options={subtypeOptions}
              activeId={activeSubtypeId}
              onSelect={setActiveSubtypeId}
            />
          ) : null}
          {classOptions.length >= 1 ? (
            <FlangeToolbarDropdown
              label="Rating (class)"
              options={classOptions}
              activeId={activeClassId}
              onSelect={setActiveClassId}
            />
          ) : null}
          {faceOptions.length > 1 ? (
            <FlangeToolbarDropdown
              label="Face type"
              options={[{ id: "", label: "All" }, ...faceOptions]}
              activeId={activeFaceType}
              onSelect={(id) => setActiveFaceType(id)}
            />
          ) : null}
          {npsOptions.length > 1 ? (
            <FlangeToolbarDropdown
              label="Size (NPS / NB)"
              options={[{ id: "", label: "All sizes" }, ...npsOptions]}
              activeId={activeNps}
              onSelect={(id) => setActiveNps(id)}
            />
          ) : null}
          {showWallDropdown ? (
            <FlangeToolbarDropdown
              label="Pipe schedule"
              options={[{ id: "", label: "All" }, ...wallOptions]}
              activeId={activeWall}
              onSelect={(id) => setActiveWall(id)}
            />
          ) : null}
        </div>
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)] gap-3 p-3 min-h-0">
          <CardFlangeDrawing
            standard={activeStandard}
            activeSubtype={activeSubtypeId}
            selectedRow={selectedRow}
          />
          <TableFlangeDimensions
            selectedClass={selectedClass}
            selectedRowId={selectedRow?.id}
            onSelectRow={handleSelectRow}
            search={search}
            filters={filters}
            standardLabel={activeStandard?.label ?? ""}
            flangeSubtypeId={activeSubtypeId}
            subtypes={activeStandard?.subtypes}
            catalogUnitSystem={catalogUnitSystem}
            activeFaceType={activeFaceType}
            activeNps={activeNps}
            activeWall={activeWall}
            showWallBar={showWallDropdown}
          />
        </div>
      </div>
    </div>
  );
}

export default PanelCatalogFlanges;
