"use client";

import { useMemo, useState, useEffect } from "react";
import { matchFlangeRowSearch, matchFlangeRowFilters } from "@/lib/catalog-structure";
import { flangeDrawingFallbackImage } from "@/lib/flanges-config";

/** Wall / schedule for display — matches filter property `schedule` in catalog-structure. */
function flangeScheduleOrWall(row) {
  const a = row.attributes || {};
  const t = row.thickness;
  if (t != null && String(t).trim() !== "") return String(t);
  if (a.schedule != null && String(a.schedule).trim() !== "") return String(a.schedule);
  if (a.thickness != null && String(a.thickness).trim() !== "") return String(a.thickness);
  return "—";
}

function rowMatchesFlangeSubtype(row, activeSubtypeId, subtypes) {
  if (!subtypes?.length || !activeSubtypeId) return true;
  const ft = row.attributes?.flangeType;
  if (ft) return ft === activeSubtypeId;
  return true;
}

function DropdownFlangesStandard({ standards, activeId, onChange }) {
  const active = standards.find((s) => s.id === activeId);
  return (
    <div className="dropdown dropdown-start w-full min-w-0 sm:max-w-md">
      <div
        tabIndex={0}
        role="button"
        className="btn btn-sm btn-outline border-base-300 bg-base-100 h-auto min-h-12 py-2 px-3 w-full flex flex-col items-stretch gap-0.5 normal-case font-normal"
      >
        <span className="text-[10px] font-semibold uppercase tracking-wide text-base-content/60 text-left">
          Flange standard
        </span>
        <span className="text-xs font-medium text-left whitespace-normal leading-snug">
          {active?.label ?? "Select standard"}
        </span>
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content z-[40] menu p-2 shadow-lg bg-base-100 rounded-box w-[min(100vw-1.5rem,28rem)] max-h-[min(70vh,22rem)] overflow-y-auto border border-base-300 mt-1"
      >
        {standards.map((standard) => (
          <li key={standard.id} className="w-full">
            <button
              type="button"
              className={`w-full text-left whitespace-normal leading-snug py-2.5 min-h-0 h-auto rounded-lg text-xs ${
                activeId === standard.id ? "active bg-primary text-primary-content font-medium" : ""
              }`}
              onClick={() => {
                onChange(standard.id);
                if (typeof document !== "undefined") (document.activeElement)?.blur?.();
              }}
            >
              {standard.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TabsPressureClass({ classes, activeClass, onChange }) {
  if (!classes.length) return null;

  return (
    <div className="flex items-center gap-1 px-3 py-1 border-b border-base-300 bg-base-200/60">
      <span className="text-xs font-semibold text-base-content/70 mr-1" title="Same as Rating in part selection">
        Rating (class)
      </span>
      <div className="tabs tabs-sm tabs-boxed bg-base-100/80">
        {classes.map((cls) => (
          <button
            key={cls.pressureClass}
            type="button"
            className={
              activeClass === cls.pressureClass
                ? "tab tab-active text-xs"
                : "tab text-xs"
            }
            onClick={() => onChange(cls.pressureClass)}
          >
            {cls.pressureClass}
          </button>
        ))}
      </div>
    </div>
  );
}

function TabsFlangeSubtype({ subtypes, activeSubtype, onChange }) {
  if (!subtypes || !subtypes.length) return null;

  return (
    <div className="flex items-center gap-1 px-3 py-1 border-b border-base-300 bg-base-200/60">
      <span className="text-xs font-semibold text-base-content/70 mr-1">
        Flange type
      </span>
      <div className="tabs tabs-sm tabs-boxed bg-base-100/80">
        {subtypes.map((t) => (
          <button
            key={t.id}
            type="button"
            className={
              activeSubtype === t.id ? "tab tab-active text-xs" : "tab text-xs"
            }
            onClick={() => onChange(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
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
}) {
  const allRows = useMemo(() => {
    if (!selectedClass) return [];
    const rows = [];
    selectedClass.datasets.forEach((ds) => {
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
  }, [selectedClass, standardLabel]);

  const filteredRows = useMemo(() => {
    return allRows.filter((row) => {
      if (search?.trim() && !matchFlangeRowSearch(row, search)) return false;
      if (!matchFlangeRowFilters(row, filters)) return false;
      return true;
    });
  }, [allRows, search, filters]);

  const rowsForSubtype = useMemo(() => {
    return filteredRows.filter((row) => rowMatchesFlangeSubtype(row, flangeSubtypeId, subtypes));
  }, [filteredRows, flangeSubtypeId, subtypes]);

  if (!selectedClass || !allRows.length) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-base-content/60">
        Select a pressure class to see dimensions.
      </div>
    );
  }

  return (
    <div className="overflow-auto h-full rounded-lg border border-base-300 bg-base-100">
      <table className="table table-xs">
        <thead>
          <tr>
            <th>System</th>
            <th>NPS / NB</th>
            <th title="Pipe schedule or flange wall thickness (same field as part catalog)">Schedule / wall</th>
            <th>OD</th>
            <th>PCD</th>
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
                <td>{flangeScheduleOrWall(row)}</td>
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

function PanelCatalogFlanges({ standards, initialStandardId, search = "", filters = [] }) {
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
    return initialStandard?.classes?.[0]?.pressureClass ?? "";
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
    if (std?.subtypes?.length) {
      setActiveSubtypeId(std.subtypes[0].id);
    }
  }, [activeStandardId, standards]);

  const selectedClass = useMemo(
    () => classes.find((cls) => cls.pressureClass === activeClassId) || classes[0],
    [classes, activeClassId]
  );

  const [selectedRow, setSelectedRow] = useState(null);

  const handleSelectRow = (row) => {
    setSelectedRow(row);
  };

  return (
    <div className="flex h-[calc(100dvh-7rem)] min-h-[420px] rounded-xl border border-base-300 bg-base-200/60 overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-3 py-2 border-b border-base-300 bg-base-200/60 flex flex-wrap items-end gap-3">
          <DropdownFlangesStandard
            standards={standards}
            activeId={activeStandardId}
            onChange={(id) => {
              setActiveStandardId(id);
              const std = standards.find((s) => s.id === id);
              const firstClass = std?.classes?.[0];
              setActiveClassId(firstClass?.pressureClass ?? "");
            }}
          />
        </div>
        <TabsFlangeSubtype
          subtypes={activeStandard?.subtypes}
          activeSubtype={activeSubtypeId}
          onChange={setActiveSubtypeId}
        />
        <TabsPressureClass
          classes={classes}
          activeClass={selectedClass?.pressureClass}
          onChange={setActiveClassId}
        />
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)] gap-3 p-3">
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
          />
        </div>
      </div>
    </div>
  );
}

export default PanelCatalogFlanges;

