"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import {
  SPIRAL_WOUND_GASKET_STANDARDS,
  getSpiralRowsForStandard,
  uniqueSortedDns,
  uniqueSortedClasses,
  findSpiralRow,
  buildSpiralGasketTitle,
  matchSpiralWoundRow,
} from "@/lib/spiral-wound-gaskets-data";

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
 * Schematic spiral-wound cross-section: compressed height + four horizontal diameters (mm).
 */
function SpiralWoundDiagramSvg({ d1, d2, d3, d4, compressedMm }) {
  const maxD = Math.max(d1, d2, d3, d4, 1);
  const scale = 145 / maxD;
  const cx = 215;
  const baseY = 118;
  const w1 = (d1 * scale) / 2;
  const w2 = (d2 * scale) / 2;
  const w3 = (d3 * scale) / 2;
  const w4 = (d4 * scale) / 2;
  const th = Math.max(12, compressedMm * 3.2);

  const dimYs = [200, 222, 244, 266];

  function dimLine(y, halfW, value) {
    return (
      <g key={`${y}-${value}`}>
        <line x1={cx - halfW} y1={y} x2={cx + halfW} y2={y} stroke="currentColor" strokeWidth="0.75" />
        <line x1={cx - halfW} y1={y - 3} x2={cx - halfW} y2={y + 3} stroke="currentColor" strokeWidth="0.75" />
        <line x1={cx + halfW} y1={y - 3} x2={cx + halfW} y2={y + 3} stroke="currentColor" strokeWidth="0.75" />
        <text x={cx} y={y + 12} textAnchor="middle" className="text-[10px] font-mono font-semibold fill-current">
          {value}
        </text>
      </g>
    );
  }

  return (
    <svg viewBox="0 0 430 285" className="w-full max-w-2xl mx-auto h-auto text-base-content" aria-hidden>
      <defs>
        <pattern id="sw-hatch" patternUnits="userSpaceOnUse" width="5" height="5">
          <path d="M0 5 L5 0" stroke="currentColor" strokeWidth="0.4" opacity="0.35" />
        </pattern>
        <linearGradient id="sw-metal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.12" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.22" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="430" height="285" fill="white" />

      {/* Bolt + nut */}
      <rect x="72" y="42" width="11" height="88" fill="currentColor" opacity="0.22" />
      <rect x="70" y="36" width="15" height="9" rx="1" fill="currentColor" opacity="0.32" />

      {/* Left flange */}
      <path
        d="M 92 68 L 92 128 L 128 123 L 128 73 Z"
        fill="url(#sw-hatch)"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.88"
      />

      {/* Spiral-wind stack (simplified concentric rings, cross-section) */}
      <rect
        x={cx - w1}
        y={baseY - th}
        width={w1 * 2}
        height={th}
        fill="url(#sw-metal)"
        stroke="currentColor"
        strokeWidth="0.6"
        opacity="0.95"
      />
      <rect
        x={cx - w2}
        y={baseY - th - 1}
        width={w2 * 2}
        height={th + 2}
        fill="none"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeDasharray="2 2"
        opacity="0.55"
      />
      <rect
        x={cx - w3}
        y={baseY - th - 2}
        width={w3 * 2}
        height={th + 4}
        fill="none"
        stroke="currentColor"
        strokeWidth="0.6"
        opacity="0.4"
      />
      <rect
        x={cx - w4}
        y={baseY - th - 3}
        width={w4 * 2}
        height={th + 6}
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
        opacity="0.35"
      />
      {/* Zig hint */}
      <path
        d={`M ${cx - w3} ${baseY - th / 2} L ${cx - w2} ${baseY - th / 2 + 2} L ${cx - w1} ${baseY - th / 2}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
        opacity="0.45"
      />

      {/* Right flange */}
      <path
        d={`M ${cx + w4 + 6} 68 L ${cx + w4 + 6} 128 L ${cx + w1 + 6} 123 L ${cx + w1 + 6} 73 Z`}
        fill="url(#sw-hatch)"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.88"
      />

      {/* Vertical — compressed */}
      <line x1="48" y1={baseY - th} x2="48" y2={baseY} stroke="currentColor" strokeWidth="0.75" />
      <line x1="44" y1={baseY - th} x2="52" y2={baseY - th} stroke="currentColor" strokeWidth="0.75" />
      <line x1="44" y1={baseY} x2="52" y2={baseY} stroke="currentColor" strokeWidth="0.75" />
      <text
        x="38"
        y={baseY - th / 2}
        className="text-[9px] font-mono font-semibold fill-current"
        textAnchor="middle"
      >
        {compressedMm}
      </text>
      <text x="38" y={baseY - th / 2 + 11} className="text-[8px] fill-current opacity-90" textAnchor="middle">
        Compressed
      </text>

      {/* Horizontal diameters */}
      {dimLine(dimYs[0], w1, d1)}
      {dimLine(dimYs[1], w2, d2)}
      {dimLine(dimYs[2], w3, d3)}
      {dimLine(dimYs[3], w4, d4)}
    </svg>
  );
}

export default function PanelCatalogSpiralWoundGaskets({ selectionId, search = "" }) {
  const standard = useMemo(
    () => SPIRAL_WOUND_GASKET_STANDARDS.find((s) => s.selectionId === selectionId) || null,
    [selectionId]
  );

  const allRows = useMemo(() => (standard ? getSpiralRowsForStandard(standard.id) : []), [standard]);

  const rowsFiltered = useMemo(() => {
    return allRows.filter((row) => matchSpiralWoundRow(row, search));
  }, [allRows, search]);

  const dns = useMemo(() => uniqueSortedDns(rowsFiltered.length ? rowsFiltered : allRows), [rowsFiltered, allRows]);
  const classes = useMemo(
    () => uniqueSortedClasses(rowsFiltered.length ? rowsFiltered : allRows),
    [rowsFiltered, allRows]
  );

  const [dn, setDn] = useState(dns[0] ?? 600);
  const [pressureClass, setPressureClass] = useState(classes[0] ?? "600#");

  useEffect(() => {
    if (dns.length && !dns.includes(dn)) setDn(dns[0]);
  }, [dns, dn]);

  useEffect(() => {
    if (classes.length && !classes.includes(pressureClass)) setPressureClass(classes[0]);
  }, [classes, pressureClass]);

  const activeRow = useMemo(() => {
    const pool = rowsFiltered.length ? rowsFiltered : allRows;
    return findSpiralRow(pool, dn, pressureClass) || pool[0] || null;
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

  const title = activeRow ? buildSpiralGasketTitle(standard, activeRow) : standard.label;

  return (
    <div className="flex flex-col rounded-xl border border-base-300 bg-base-100 overflow-hidden min-h-[480px]">
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
              Weight = <strong>{activeRow.weightKg}</strong> kg · Compressed ≈ <strong>{activeRow.compressedMm}</strong>{" "}
              mm
            </p>
          )}
        </div>

        {activeRow ? (
          <div className="rounded-lg border border-base-300 bg-white p-4">
            <SpiralWoundDiagramSvg
              d1={activeRow.d1}
              d2={activeRow.d2}
              d3={activeRow.d3}
              d4={activeRow.d4}
              compressedMm={activeRow.compressedMm}
            />
            <p className="text-right text-[11px] text-base-content/55 mt-2 pr-1">{standard.referenceStandard}</p>
          </div>
        ) : (
          <p className="text-base-content/60 text-sm">No rows match the current filters.</p>
        )}

        <p className="text-[11px] text-base-content/50 max-w-prose">
          Schematic cross-section. Four horizontal values are key diameters across the inner ring, winding, and
          centering ring (per ASME B16.20). Confirm against the standard and project data before procurement.
        </p>
      </div>
    </div>
  );
}
