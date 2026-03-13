"use client";

import { useMemo, useState } from "react";

function MenuFlangesStandard({ standards, activeId, onChange }) {
  return (
    <div className="w-60 border-r border-base-300 bg-base-100 flex flex-col">
      <div className="px-3 py-2 border-b border-base-300 bg-base-200/60 text-xs font-semibold uppercase tracking-wide text-base-content/70">
        Flanges
      </div>
      <nav className="flex-1 overflow-y-auto">
        <ul className="menu menu-xs p-2 gap-0.5">
          {standards.map((standard) => (
            <li key={standard.id}>
              <button
                type="button"
                className={
                  activeId === standard.id
                    ? "flex items-center justify-between rounded-md bg-primary text-primary-content px-2 py-1.5 text-xs"
                    : "flex items-center justify-between rounded-md hover:bg-base-200 px-2 py-1.5 text-xs"
                }
                onClick={() => onChange(standard.id)}
              >
                <span className="truncate">{standard.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
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

  const src = chosenImage
    ? `/api/pipedata-image?folder=${encodeURIComponent(
        standard.databaseFolder
      )}&file=${encodeURIComponent(chosenImage)}`
    : null;
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
        <div className="flex-1 flex items-center justify-center bg-base-100">
          {src ? (
            <img
              src={src}
              alt={standard.label}
              className="max-h-full max-w-full object-contain pointer-events-none select-none"
            />
          ) : (
            <div className="text-xs text-base-content/60">
              No drawing configured for this standard.
            </div>
          )}
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

function TableFlangeDimensions({ selectedClass, selectedRowId, onSelectRow }) {
  const allRows = useMemo(() => {
    if (!selectedClass) return [];
    const rows = [];
    selectedClass.datasets.forEach((ds) => {
      ds.rows.forEach((row) => {
        rows.push({
          ...row,
          system: ds.system,
        });
      });
    });
    return rows;
  }, [selectedClass]);

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
            <th>Thickness</th>
            <th>OD</th>
            <th>PCD</th>
          </tr>
        </thead>
        <tbody>
          {allRows.map((row) => {
            const isActive = row.id === selectedRowId;
            return (
              <tr
                key={row.id}
                className={isActive ? "bg-primary/10 cursor-pointer" : "cursor-pointer"}
                onClick={() => onSelectRow?.(row)}
              >
                <td>{row.system}</td>
                <td>{row.nps}</td>
                <td>{row.thickness}</td>
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

function PanelCatalogFlanges({ standards }) {
  const [activeStandardId, setActiveStandardId] = useState(
    () => standards.find((s) => s.classes?.length)?.id || standards[0]?.id
  );

  const activeStandard = useMemo(
    () => standards.find((s) => s.id === activeStandardId) || standards[0],
    [standards, activeStandardId]
  );

  const [activeClassId, setActiveClassId] = useState(() => {
    const initialStandard =
      standards.find((s) => s.classes?.length) || standards[0];
    return initialStandard?.classes?.[0]?.pressureClass ?? "";
  });

  const classes = activeStandard?.classes ?? [];

  const [activeSubtypeId, setActiveSubtypeId] = useState(
    () => activeStandard?.subtypes?.[0]?.id ?? ""
  );

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
      <MenuFlangesStandard
        standards={standards}
        activeId={activeStandardId}
        onChange={(id) => {
          setActiveStandardId(id);
          const std = standards.find((s) => s.id === id);
          const firstClass = std?.classes?.[0];
          setActiveClassId(firstClass?.pressureClass ?? "");
        }}
      />
      <div className="flex-1 flex flex-col min-w-0">
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
          />
        </div>
      </div>
    </div>
  );
}

export default PanelCatalogFlanges;

