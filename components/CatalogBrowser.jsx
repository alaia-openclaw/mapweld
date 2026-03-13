"use client";

import { useMemo, useState } from "react";

function parseNpsForSort(value) {
  const s = String(value);
  const m = s.match(/^(\d+)(?:\+(\d+)\/(\d+))?$/);
  if (m) {
    const whole = parseInt(m[1], 10);
    const num = m[2] ? whole + parseInt(m[2], 10) / parseInt(m[3], 10) : whole;
    return num;
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function SchematicFlange({ entry }) {
  if (!entry) {
    return (
      <div className="flex items-center justify-center h-48 text-xs text-base-content/60">
        Select a part to see its schematic.
      </div>
    );
  }

  // Try to pull some useful dimensions from attributes; fall back to main fields.
  const attrs = entry.attributes || {};
  const od = attrs.od || attrs.OD || attrs["od,mm"] || attrs["od (mm)"];
  const thickness = attrs.thickness || attrs.thk || attrs["thickness,mm"] || entry.thickness;
  const pcd = attrs.pcd || attrs["pcd,mm"] || attrs["pcd (mm)"];

  return (
    <svg
      viewBox="0 0 200 200"
      className="w-full h-48 bg-base-200 rounded-lg border border-base-300"
    >
      {/* outer ring */}
      <circle cx="100" cy="100" r="80" className="fill-base-100 stroke-base-content/40" />
      {/* bore */}
      <circle cx="100" cy="100" r="35" className="fill-base-100 stroke-base-content/40" />
      {/* bolt circle */}
      <circle
        cx="100"
        cy="100"
        r="60"
        className="fill-transparent stroke-base-content/20 stroke-dashed"
      />
      {/* a few bolt holes */}
      {[0, 72, 144, 216, 288].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x = 100 + 60 * Math.cos(rad);
        const y = 100 + 60 * Math.sin(rad);
        return (
          <circle key={deg} cx={x} cy={y} r="4" className="fill-base-100 stroke-base-content/60" />
        );
      })}

      {/* OD dimension */}
      <line x1="20" y1="100" x2="180" y2="100" className="stroke-primary" strokeWidth="1" />
      <polygon points="24,96 20,100 24,104" className="fill-primary" />
      <polygon points="176,96 180,100 176,104" className="fill-primary" />
      <text
        x="100"
        y="92"
        className="fill-primary text-[9px]"
        textAnchor="middle"
      >
        OD {od ?? "—"}
      </text>

      {/* thickness dimension */}
      <line x1="140" y1="40" x2="140" y2="160" className="stroke-secondary" strokeWidth="1" />
      <polygon points="136,44 140,40 144,44" className="fill-secondary" />
      <polygon points="136,156 140,160 144,156" className="fill-secondary" />
      <text
        x="146"
        y="104"
        className="fill-secondary text-[9px]"
        transform="rotate(90 146 104)"
        textAnchor="middle"
      >
        Thk {thickness ?? "—"}
      </text>

      {/* PCD label */}
      <text x="100" y="150" className="fill-base-content/70 text-[9px]" textAnchor="middle">
        PCD {pcd ?? "—"}
      </text>
    </svg>
  );
}

function CatalogBrowser({ categories, entries }) {
  const [categoryId, setCategoryId] = useState(
    categories.length ? categories[0].id : ""
  );
  const [partType, setPartType] = useState("");
  const [nps, setNps] = useState("");
  const [thickness, setThickness] = useState("");

  const entriesForCategory = useMemo(
    () => entries.filter((e) => e.catalogCategory === categoryId),
    [entries, categoryId]
  );

  const filterEntries = useMemo(
    () =>
      function filterEntriesLocal({ type, npsValue, thicknessValue }) {
        return entriesForCategory.filter((e) => {
          if (type && e.partTypeLabel !== type) return false;
          if (npsValue && e.nps !== npsValue) return false;
          if (thicknessValue && e.thickness !== thicknessValue) return false;
          return true;
        });
      },
    [entriesForCategory]
  );

  const partTypeOptions = useMemo(() => {
    const filtered = filterEntries({ type: "", npsValue: nps, thicknessValue: thickness });
    return Array.from(new Set(filtered.map((e) => e.partTypeLabel))).sort();
  }, [filterEntries, nps, thickness]);

  const npsOptions = useMemo(() => {
    const filtered = filterEntries({ type: partType, npsValue: "", thicknessValue: thickness });
    return Array.from(new Set(filtered.map((e) => e.nps))).sort(
      (a, b) => parseNpsForSort(a) - parseNpsForSort(b)
    );
  }, [filterEntries, partType, thickness]);

  const thicknessOptions = useMemo(() => {
    const filtered = filterEntries({ type: partType, npsValue: nps, thicknessValue: "" });
    return Array.from(new Set(filtered.map((e) => e.thickness))).sort();
  }, [filterEntries, partType, nps]);

  const visibleEntries = useMemo(
    () => filterEntries({ type: partType, npsValue: nps, thicknessValue: thickness }),
    [filterEntries, partType, nps, thickness]
  );

  const selectedEntry = visibleEntries[0] || null;

  function handleCategoryChange(id) {
    setCategoryId(id);
    setPartType("");
    setNps("");
    setThickness("");
  }

  return (
    <div className="flex flex-col gap-4 h-[calc(100dvh-8rem)] min-h-0">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-base-content/60">Category</span>
          <select
            className="select select-bordered select-sm min-w-[10rem]"
            value={categoryId}
            onChange={(e) => handleCategoryChange(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id} — {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-base-content/60">Part type</span>
          <select
            className="select select-bordered select-sm min-w-[10rem]"
            value={partType}
            onChange={(e) => {
              setPartType(e.target.value);
              setNps("");
              setThickness("");
            }}
          >
            <option value="">Any</option>
            {partTypeOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-base-content/60">NPS</span>
          <select
            className="select select-bordered select-sm min-w-[6rem]"
            value={nps}
            onChange={(e) => {
              setNps(e.target.value);
              setThickness("");
            }}
          >
            <option value="">Any</option>
            {npsOptions.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-base-content/60">Thickness</span>
          <select
            className="select select-bordered select-sm min-w-[6rem]"
            value={thickness}
            onChange={(e) => setThickness(e.target.value)}
          >
            <option value="">Any</option>
            {thicknessOptions.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex gap-4">
        <div className="flex-1 min-w-0 min-h-0 overflow-auto rounded-lg border border-base-300 bg-base-100">
          <table className="table table-xs">
            <thead>
              <tr>
                <th>NPS</th>
                <th>Thickness</th>
                <th>Part type</th>
                <th>Weight (kg)</th>
              </tr>
            </thead>
            <tbody>
              {visibleEntries.slice(0, 200).map((e) => (
                <tr
                  key={e.catalogPartId}
                  className={
                    selectedEntry && selectedEntry.catalogPartId === e.catalogPartId
                      ? "bg-primary/10"
                      : ""
                  }
                  onClick={() => {
                    setPartType(e.partTypeLabel);
                    setNps(e.nps);
                    setThickness(e.thickness);
                  }}
                >
                  <td>{e.nps}</td>
                  <td>{e.thickness}</td>
                  <td>{e.partTypeLabel}</td>
                  <td>{e.weightKg ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="w-80 flex-shrink-0 flex flex-col gap-3">
          <div className="rounded-lg border border-base-300 bg-base-100 p-3">
            <h3 className="font-semibold text-sm mb-2">Schematic</h3>
            <SchematicFlange entry={selectedEntry} />
          </div>
          <div className="rounded-lg border border-base-300 bg-base-100 p-3 overflow-auto max-h-full">
            <h3 className="font-semibold text-sm mb-2">Entry details</h3>
            {selectedEntry ? (
              <div className="space-y-1 text-xs">
                <div>
                  <span className="font-medium">catalogPartId:</span> {selectedEntry.catalogPartId}
                </div>
                <div>
                  <span className="font-medium">partType:</span> {selectedEntry.partTypeLabel}
                </div>
                <div>
                  <span className="font-medium">NPS:</span> {selectedEntry.nps}
                </div>
                <div>
                  <span className="font-medium">Thickness:</span> {selectedEntry.thickness}
                </div>
                <div>
                  <span className="font-medium">Weight (kg):</span>{" "}
                  {selectedEntry.weightKg ?? "—"}
                </div>
                {selectedEntry.attributes && (
                  <>
                    <div className="mt-2 font-semibold">Attributes</div>
                    {Object.entries(selectedEntry.attributes).map(([key, val]) => (
                      <div key={key}>
                        <span className="font-medium">{key}:</span>{" "}
                        <span className="break-all">{String(val)}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            ) : (
              <p className="text-xs text-base-content/60">Select a row to see details.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CatalogBrowser;

