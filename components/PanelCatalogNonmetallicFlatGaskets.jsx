"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import {
  NONMETALLIC_FLAT_GASKET_STANDARDS,
  getRowsForStandard,
  uniqueSortedDns,
  uniqueSortedClasses,
  findGasketRow,
  buildGasketTitle,
  matchNonmetallicFlatRow,
} from "@/lib/nonmetallic-flat-gaskets-data";

function ToolbarIconButton({ title, children, onClick }) {
  return (
    <button
      type="button"
      className="btn btn-ghost btn-xs text-primary-content border-0 hover:bg-primary-focus/30"
      title={title}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

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

  const currentIndex = useMemo(() => {
    if (!activeRow) return -1;
    return indexList.findIndex(
      (r) => r.dn === activeRow.dn && r.pressureClass === activeRow.pressureClass
    );
  }, [indexList, activeRow]);

  const step = useCallback(
    (delta) => {
      if (indexList.length === 0) return;
      const next = (currentIndex + delta + indexList.length) % indexList.length;
      const r = indexList[next];
      setDn(r.dn);
      setPressureClass(r.pressureClass);
    },
    [indexList, currentIndex]
  );

  const goFirst = useCallback(() => {
    const r = indexList[0];
    if (r) {
      setDn(r.dn);
      setPressureClass(r.pressureClass);
    }
  }, [indexList]);

  const goLast = useCallback(() => {
    const r = indexList[indexList.length - 1];
    if (r) {
      setDn(r.dn);
      setPressureClass(r.pressureClass);
    }
  }, [indexList]);

  if (!standard) {
    return (
      <div className="rounded-xl border border-base-300 bg-base-200/60 p-8 text-center text-base-content/60">
        Unknown gasket standard.
      </div>
    );
  }

  const title = activeRow ? buildGasketTitle(standard, activeRow) : standard.label;

  return (
    <div className="flex flex-col rounded-xl border border-base-300 bg-base-100 overflow-hidden min-h-[420px]">
      {/* Blue toolbar — Pipedata-style */}
      <div className="bg-primary text-primary-content shrink-0">
        <div className="flex flex-wrap items-center gap-2 px-2 py-2">
          <div className="flex items-center gap-0.5 shrink-0">
            <ToolbarIconButton title="First" onClick={goFirst}>
              <span className="text-xs font-mono">|◀</span>
            </ToolbarIconButton>
            <ToolbarIconButton title="Previous" onClick={() => step(-1)}>
              <span className="text-xs">◀</span>
            </ToolbarIconButton>
            <ToolbarIconButton title="Next" onClick={() => step(1)}>
              <span className="text-xs">▶</span>
            </ToolbarIconButton>
            <ToolbarIconButton title="Last" onClick={goLast}>
              <span className="text-xs font-mono">▶|</span>
            </ToolbarIconButton>
          </div>
          <div className="flex-1 min-w-[8rem] text-xs font-semibold truncate px-1">{standard.label}</div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase opacity-90">Size</span>
              <select
                className="select select-bordered select-xs bg-base-100 text-base-content border-primary-content/30 min-w-[5rem]"
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
            <label className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase opacity-90">Class</span>
              <select
                className="select select-bordered select-xs bg-base-100 text-base-content border-primary-content/30 min-w-[5rem]"
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
          <div className="hidden sm:flex items-center gap-0.5 ml-auto">
            <ToolbarIconButton title="Search (use catalog search)" onClick={() => {}}>
              <span className="text-[10px] px-0.5">Sr</span>
            </ToolbarIconButton>
            <ToolbarIconButton title="Print" onClick={() => globalThis.print?.()}>
              <span className="text-[10px] px-0.5">Prt</span>
            </ToolbarIconButton>
            <ToolbarIconButton title="Export" onClick={() => {}}>
              <span className="text-[10px] px-0.5">Exp</span>
            </ToolbarIconButton>
            <ToolbarIconButton title="Settings" onClick={() => {}}>
              <span className="text-[10px] px-0.5">Set</span>
            </ToolbarIconButton>
            <ToolbarIconButton title="Help" onClick={() => {}}>
              <span className="text-[10px] px-0.5">?</span>
            </ToolbarIconButton>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6 space-y-4 overflow-auto">
        <div>
          <h2 className="text-lg md:text-xl font-bold leading-snug">{title}</h2>
          {activeRow && (
            <p className="text-sm text-base-content/70 mt-1">
              Weight = <strong>{activeRow.weightKg}</strong> kg · Thickness ≈ {activeRow.thicknessMm} mm
            </p>
          )}
        </div>

        {activeRow ? (
          <div className="rounded-lg border border-base-300 bg-white p-4">
            <GasketDiagramSvg
              innerMm={activeRow.innerMm}
              outerMm={activeRow.outerMm}
              thicknessMm={activeRow.thicknessMm}
            />
            <p className="text-right text-[11px] text-base-content/55 mt-2 pr-1">
              {standard.referenceStandard}
            </p>
          </div>
        ) : (
          <p className="text-base-content/60 text-sm">No rows match the current filters.</p>
        )}

        <p className="text-[11px] text-base-content/50 max-w-prose">
          Diagram is schematic. Dimensions shown are inner / outer gasket OD (mm) for the selected DN and pressure
          class. Confirm material and dimensions against ASME B16.21 and project requirements.
        </p>
      </div>
    </div>
  );
}
