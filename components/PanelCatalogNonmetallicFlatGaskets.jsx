"use client";

import { useMemo, useState, useEffect } from "react";
import {
  NONMETALLIC_FLAT_GASKET_STANDARDS,
  getRowsForStandard,
  uniqueSortedDns,
  uniqueSortedClasses,
  findGasketRow,
  buildGasketTitle,
  matchNonmetallicFlatRow,
} from "@/lib/nonmetallic-flat-gaskets-data";
import {
  catalogPanelOuterClass,
  catalogPanelToolbarClass,
  catalogTableScrollClass,
  catalogTableClassName,
} from "@/components/CatalogCategoryToolbar";

/**
 * Schematic cross-section (not to scale) — inner / outer gasket dimensions in mm.
 */
function GasketDiagramSvg({ innerMm, outerMm, thicknessMm }) {
  const scale = 200 / Math.max(outerMm, 120);
  const innerW = innerMm * scale;
  const outerW = outerMm * scale;
  const th = Math.max(6, thicknessMm * scale * 2);
  const cx = 200;
  const baseY = 160;

  return (
    <svg
      viewBox="0 0 400 220"
      className="w-full max-w-xl mx-auto h-auto text-base-content"
      aria-hidden
    >
      <defs>
        <pattern id="hatch" patternUnits="userSpaceOnUse" width="6" height="6">
          <path d="M0 6 L6 0" stroke="currentColor" strokeWidth="0.5" opacity="0.35" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="400" height="220" fill="white" />
      {/* Bolt */}
      <rect x="78" y="40" width="10" height="95" fill="currentColor" opacity="0.25" />
      <rect x="76" y="35" width="14" height="8" rx="1" fill="currentColor" opacity="0.35" />
      <text x="84" y="30" textAnchor="middle" className="text-[8px] fill-current opacity-60">
        Bolt
      </text>
      {/* Left flange */}
      <path
        d="M 95 70 L 95 130 L 130 125 L 130 75 Z"
        fill="url(#hatch)"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.85"
      />
      {/* Gasket */}
      <rect
        x={cx - innerW / 2}
        y={baseY - th}
        width={innerW}
        height={th}
        fill="currentColor"
        opacity="0.18"
        stroke="currentColor"
        strokeWidth="1"
      />
      <rect
        x={cx - outerW / 2}
        y={baseY - th}
        width={outerW}
        height={th}
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="3 2"
        opacity="0.5"
      />
      {/* Right flange */}
      <path
        d={`M ${cx + outerW / 2 + 5} 70 L ${cx + outerW / 2 + 5} 130 L ${cx + innerW / 2 + 5} 125 L ${cx + innerW / 2 + 5} 75 Z`}
        fill="url(#hatch)"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.85"
      />
      {/* Dimension — inner */}
      <line
        x1={cx - innerW / 2}
        y1={baseY + 18}
        x2={cx + innerW / 2}
        y2={baseY + 18}
        stroke="currentColor"
        strokeWidth="0.75"
      />
      <line x1={cx - innerW / 2} y1={baseY + 14} x2={cx - innerW / 2} y2={baseY + 22} stroke="currentColor" />
      <line x1={cx + innerW / 2} y1={baseY + 14} x2={cx + innerW / 2} y2={baseY + 22} stroke="currentColor" />
      <text x={cx} y={baseY + 32} textAnchor="middle" className="text-[11px] font-mono font-semibold fill-current">
        {innerMm}
      </text>
      {/* Dimension — outer */}
      <line
        x1={cx - outerW / 2}
        y1={baseY + 48}
        x2={cx + outerW / 2}
        y2={baseY + 48}
        stroke="currentColor"
        strokeWidth="0.75"
      />
      <line x1={cx - outerW / 2} y1={baseY + 44} x2={cx - outerW / 2} y2={baseY + 52} stroke="currentColor" />
      <line x1={cx + outerW / 2} y1={baseY + 44} x2={cx + outerW / 2} y2={baseY + 52} stroke="currentColor" />
      <text x={cx} y={baseY + 62} textAnchor="middle" className="text-[11px] font-mono font-semibold fill-current">
        {outerMm}
      </text>
      {/* Callouts */}
      <text x={cx + outerW / 2 + 12} y={baseY - th / 2} className="text-[8px] fill-current opacity-80">
        Client specified
      </text>
      <text x={cx + outerW / 2 + 12} y={baseY - th - 4} className="text-[8px] fill-current opacity-80">
        Self centering
      </text>
    </svg>
  );
}

export default function PanelCatalogNonmetallicFlatGaskets({ selectionId, search = "" }) {
  const standard = useMemo(
    () => NONMETALLIC_FLAT_GASKET_STANDARDS.find((s) => s.selectionId === selectionId) || null,
    [selectionId]
  );

  const allRows = useMemo(() => (standard ? getRowsForStandard(standard.id) : []), [standard]);

  const rowsFiltered = useMemo(() => {
    return allRows.filter((row) => matchNonmetallicFlatRow(row, search));
  }, [allRows, search]);

  const dns = useMemo(() => uniqueSortedDns(rowsFiltered.length ? rowsFiltered : allRows), [rowsFiltered, allRows]);
  const classes = useMemo(
    () => uniqueSortedClasses(rowsFiltered.length ? rowsFiltered : allRows),
    [rowsFiltered, allRows]
  );

  const [dn, setDn] = useState(dns[0] ?? 40);
  const [pressureClass, setPressureClass] = useState(classes[0] ?? "600#");

  useEffect(() => {
    if (dns.length && !dns.includes(dn)) setDn(dns[0]);
  }, [dns, dn]);

  useEffect(() => {
    if (classes.length && !classes.includes(pressureClass)) setPressureClass(classes[0]);
  }, [classes, pressureClass]);

  const activeRow = useMemo(() => {
    const pool = rowsFiltered.length ? rowsFiltered : allRows;
    return findGasketRow(pool, dn, pressureClass) || pool[0] || null;
  }, [rowsFiltered, allRows, dn, pressureClass]);

  const indexList = useMemo(() => {
    const pool = rowsFiltered.length ? rowsFiltered : allRows;
    return [...pool].sort((a, b) => a.dn - b.dn || a.pressureClass.localeCompare(b.pressureClass));
  }, [rowsFiltered, allRows]);

  if (!standard) {
    return (
      <div className="rounded-xl border border-base-300 bg-base-200/60 p-8 text-center text-base-content/60">
        Unknown gasket standard.
      </div>
    );
  }

  const title = activeRow ? buildGasketTitle(standard, activeRow) : standard.label;

  return (
    <div className={catalogPanelOuterClass}>
      <div className="flex flex-col flex-1 min-h-0">
        <div className={catalogPanelToolbarClass}>
          <div className="flex flex-wrap items-end gap-2 flex-1 justify-center w-full">
            <label className="form-control">
              <span className="label-text text-[10px] text-base-content/60">Size (DN)</span>
              <select
                className="select select-bordered select-xs w-[4.5rem]"
                value={String(dn)}
                onChange={(e) => setDn(Number(e.target.value))}
              >
                {dns.map((d) => (
                  <option key={d} value={String(d)}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-control">
              <span className="label-text text-[10px] text-base-content/60">Class</span>
              <select
                className="select select-bordered select-xs w-[4.5rem]"
                value={pressureClass}
                onChange={(e) => setPressureClass(e.target.value)}
              >
                {classes.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)] gap-3 p-3 min-h-0">
          <div className="rounded-lg border border-base-300 bg-base-100 p-3 flex flex-col gap-2 min-h-0 overflow-y-auto">
            <h2 className="text-sm font-semibold leading-snug">{title}</h2>
            {activeRow && (
              <p className="text-xs text-base-content/70">
                Weight = <strong>{activeRow.weightKg}</strong> kg · Thickness ≈ {activeRow.thicknessMm} mm
              </p>
            )}
            {activeRow ? (
              <div className="rounded-lg border border-base-300 bg-base-200/40 p-3">
                <GasketDiagramSvg
                  innerMm={activeRow.innerMm}
                  outerMm={activeRow.outerMm}
                  thicknessMm={activeRow.thicknessMm}
                />
                <p className="text-right text-[11px] text-base-content/55 mt-2 pr-1">{standard.referenceStandard}</p>
              </div>
            ) : (
              <p className="text-base-content/60 text-sm">No rows match the current filters.</p>
            )}
            <p className="text-[11px] text-base-content/50">
              Diagram is schematic. Confirm dimensions against ASME B16.21 and project requirements.
            </p>
          </div>
          <div className={`${catalogTableScrollClass} min-h-[200px] lg:min-h-0`}>
            <table className={catalogTableClassName}>
              <thead>
                <tr>
                  <th>DN</th>
                  <th>Class</th>
                  <th>Inner (mm)</th>
                  <th>Outer (mm)</th>
                  <th>Thk (mm)</th>
                  <th>Weight (kg)</th>
                </tr>
              </thead>
              <tbody>
                {indexList.map((row) => {
                  const isSel =
                    activeRow && row.dn === activeRow.dn && row.pressureClass === activeRow.pressureClass;
                  return (
                    <tr
                      key={`${row.dn}-${row.pressureClass}`}
                      className={isSel ? "bg-primary/10 cursor-pointer" : "cursor-pointer hover:bg-base-200/80"}
                      onClick={() => {
                        setDn(row.dn);
                        setPressureClass(row.pressureClass);
                      }}
                    >
                      <td>{row.dn}</td>
                      <td>{row.pressureClass}</td>
                      <td>{row.innerMm}</td>
                      <td>{row.outerMm}</td>
                      <td>{row.thicknessMm}</td>
                      <td>{row.weightKg}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
