"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import {
  getRingRowsForType,
  getRingJointTypeBySelectionId,
  findRingRow,
  buildRingJointTitle,
  matchRingJointRow,
} from "@/lib/ring-joint-gaskets-data";

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

/** Type R — octagonal and oval cross-sections (schematic). */
function DiagramTypeR({ row }) {
  const { octBaseWidth, octCenterline, octHeight, octTopFlat, octRad, octAngle, ovalWidth, ovalCenterline, ovalHeight } =
    row;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-lg border border-base-300 bg-white p-3">
        <p className="text-[11px] font-semibold text-center mb-2">Octagonal</p>
        <svg viewBox="0 0 220 200" className="w-full h-auto text-base-content" aria-hidden>
          <rect width="220" height="200" fill="white" />
          <defs>
            <pattern id="rj-h-oct" patternUnits="userSpaceOnUse" width="5" height="5">
              <path d="M0 5 L5 0" stroke="currentColor" strokeWidth="0.4" opacity="0.35" />
            </pattern>
          </defs>
          <polygon
            points="110,40 155,55 170,100 155,145 110,160 65,145 50,100 65,55"
            fill="url(#rj-h-oct)"
            stroke="currentColor"
            strokeWidth="1"
          />
          <text x="110" y="28" textAnchor="middle" className="text-[9px] fill-current opacity-70">
            {octAngle}°
          </text>
          <text x="175" y="105" className="text-[9px] font-mono fill-current">
            {octCenterline}
          </text>
          <text x="110" y="188" textAnchor="middle" className="text-[10px] font-mono font-semibold fill-current">
            {octBaseWidth}
          </text>
          <text x="25" y="105" className="text-[8px] fill-current opacity-80">
            h {octHeight}
          </text>
          <text x="110" y="78" textAnchor="middle" className="text-[8px] font-mono fill-current">
            flat {octTopFlat}
          </text>
          <text x="140" y="52" className="text-[7px] fill-current opacity-70">
            R{octRad}
          </text>
        </svg>
      </div>
      <div className="rounded-lg border border-base-300 bg-white p-3">
        <p className="text-[11px] font-semibold text-center mb-2">Oval</p>
        <svg viewBox="0 0 220 200" className="w-full h-auto text-base-content" aria-hidden>
          <rect width="220" height="200" fill="white" />
          <defs>
            <pattern id="rj-h-oval" patternUnits="userSpaceOnUse" width="5" height="5">
              <path d="M0 5 L5 0" stroke="currentColor" strokeWidth="0.4" opacity="0.35" />
            </pattern>
          </defs>
          <ellipse cx="110" cy="100" rx="55" ry="38" fill="url(#rj-h-oval)" stroke="currentColor" strokeWidth="1" />
          <text x="175" y="105" className="text-[9px] font-mono fill-current">
            {ovalCenterline}
          </text>
          <text x="110" y="188" textAnchor="middle" className="text-[10px] font-mono font-semibold fill-current">
            {ovalWidth}
          </text>
          <text x="25" y="105" className="text-[8px] fill-current opacity-80">
            h {ovalHeight}
          </text>
        </svg>
      </div>
    </div>
  );
}

/** Type RX — single section profile. */
function DiagramTypeRx({ row }) {
  return (
    <div className="rounded-lg border border-base-300 bg-white p-4">
      <svg viewBox="0 0 360 220" className="w-full max-w-2xl mx-auto h-auto text-base-content" aria-hidden>
        <rect width="360" height="220" fill="white" />
        <defs>
          <pattern id="rx-h" patternUnits="userSpaceOnUse" width="5" height="5">
            <path d="M0 5 L5 0" stroke="currentColor" strokeWidth="0.4" opacity="0.35" />
          </pattern>
        </defs>
        <path
          d="M 80 170 L 80 50 L 120 35 L 240 35 L 280 50 L 280 170 L 240 185 L 120 185 Z"
          fill="url(#rx-h)"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        <text x="40" y="115" className="text-[9px] font-mono fill-current">
          ID {row.innerD}
        </text>
        <text x="300" y="115" className="text-[9px] font-mono fill-current">
          OD {row.outerD}
        </text>
        <text x="180" y="28" textAnchor="middle" className="text-[9px] font-mono fill-current">
          {row.topFlat}
        </text>
        <text x="300" y="60" className="text-[8px] fill-current">
          {row.angleDeg}°
        </text>
        <text x="125" y="120" className="text-[8px] font-mono fill-current">
          H {row.heightTotal}
        </text>
        <text x="200" y="150" className="text-[8px] font-mono fill-current">
          taper {row.taperH}
        </text>
        <text x="180" y="205" textAnchor="middle" className="text-[9px] font-mono fill-current">
          sect {row.sectionW} · R{row.cornerRad}
        </text>
      </svg>
    </div>
  );
}

/** Type BX — profile with center break lines. */
function DiagramTypeBx({ row }) {
  return (
    <div className="rounded-lg border border-base-300 bg-white p-4">
      <svg viewBox="0 0 380 240" className="w-full max-w-2xl mx-auto h-auto text-base-content" aria-hidden>
        <rect width="380" height="240" fill="white" />
        <defs>
          <pattern id="bx-h" patternUnits="userSpaceOnUse" width="5" height="5">
            <path d="M0 5 L5 0" stroke="currentColor" strokeWidth="0.4" opacity="0.35" />
          </pattern>
        </defs>
        {/* Break lines (center) */}
        <path d="M 175 30 L 178 50 M 182 50 L 185 30 M 175 210 L 178 190 M 182 190 L 185 210" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
        <text x="180" y="25" textAnchor="middle" className="text-[7px] fill-current opacity-60">
          break
        </text>
        <path
          d="M 100 180 L 100 80 L 130 55 L 230 55 L 260 80 L 260 180 L 230 205 L 130 205 Z"
          fill="url(#bx-h)"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        <text x="50" y="130" className="text-[9px] font-mono fill-current">
          OD {row.od}
        </text>
        <text x="300" y="130" className="text-[9px] font-mono fill-current">
          ID {row.id}
        </text>
        <text x="60" y="95" className="text-[8px] font-mono fill-current">
          H {row.height}
        </text>
        <text x="60" y="165" className="text-[8px] font-mono fill-current">
          W {row.profileW}
        </text>
        <text x="200" y="228" textAnchor="middle" className="text-[9px] font-mono fill-current">
          flat {row.flatW} · {row.angleDeg}° · R{row.filletRad}
        </text>
        <text x="270" y="100" className="text-[8px] fill-current">
          Ø{row.holeDia} hole
        </text>
      </svg>
    </div>
  );
}

export default function PanelCatalogRingJointGaskets({ selectionId, search = "" }) {
  const typeDef = useMemo(() => getRingJointTypeBySelectionId(selectionId), [selectionId]);

  const allRows = useMemo(() => (typeDef ? getRingRowsForType(typeDef.id) : []), [typeDef]);

  const rowsFiltered = useMemo(() => {
    return allRows.filter((row) => matchRingJointRow(row, search));
  }, [allRows, search]);

  const sizeCodes = useMemo(() => {
    const pool = rowsFiltered.length ? rowsFiltered : allRows;
    return [...new Set(pool.map((r) => r.sizeCode))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [rowsFiltered, allRows]);

  const [sizeCode, setSizeCode] = useState(sizeCodes[0] || "");

  useEffect(() => {
    if (sizeCodes.length && !sizeCodes.includes(sizeCode)) setSizeCode(sizeCodes[0]);
  }, [sizeCodes, sizeCode]);

  const activeRow = useMemo(() => {
    const pool = rowsFiltered.length ? rowsFiltered : allRows;
    return findRingRow(pool, sizeCode) || pool[0] || null;
  }, [rowsFiltered, allRows, sizeCode]);

  const indexList = useMemo(() => {
    const pool = rowsFiltered.length ? rowsFiltered : allRows;
    return [...pool].sort((a, b) => a.sizeCode.localeCompare(b.sizeCode, undefined, { numeric: true }));
  }, [rowsFiltered, allRows]);

  const currentIndex = useMemo(() => {
    if (!activeRow) return -1;
    return indexList.findIndex((r) => r.sizeCode === activeRow.sizeCode);
  }, [indexList, activeRow]);

  const step = useCallback(
    (delta) => {
      if (indexList.length === 0) return;
      const next = (currentIndex + delta + indexList.length) % indexList.length;
      setSizeCode(indexList[next].sizeCode);
    },
    [indexList, currentIndex]
  );

  const goFirst = useCallback(() => {
    if (indexList[0]) setSizeCode(indexList[0].sizeCode);
  }, [indexList]);

  const goLast = useCallback(() => {
    const r = indexList[indexList.length - 1];
    if (r) setSizeCode(r.sizeCode);
  }, [indexList]);

  if (!typeDef) {
    return (
      <div className="rounded-xl border border-base-300 bg-base-200/60 p-8 text-center text-base-content/60">
        Unknown ring-joint type.
      </div>
    );
  }

  const title = activeRow ? buildRingJointTitle(typeDef, activeRow) : typeDef.label;

  return (
    <div className="flex flex-col rounded-xl border border-base-300 bg-base-100 overflow-hidden min-h-[460px]">
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
          <div className="flex-1 min-w-[8rem] text-xs font-semibold truncate px-1">{typeDef.label}</div>
          <label className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase opacity-90">Size</span>
            <select
              className="select select-bordered select-xs bg-base-100 text-base-content border-primary-content/30 min-w-[6rem]"
              value={sizeCode}
              onChange={(e) => setSizeCode(e.target.value)}
            >
              {sizeCodes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <div className="hidden sm:flex items-center gap-0.5 ml-auto">
            <ToolbarIconButton title="Search" onClick={() => {}}>
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
              Weight = <strong>{activeRow.weightKg}</strong> kg
            </p>
          )}
        </div>

        {activeRow && typeDef.id === "r" && <DiagramTypeR row={activeRow} />}
        {activeRow && typeDef.id === "rx" && <DiagramTypeRx row={activeRow} />}
        {activeRow && typeDef.id === "bx" && <DiagramTypeBx row={activeRow} />}

        {!activeRow && (
          <p className="text-base-content/60 text-sm">No sizes match the current search.</p>
        )}

        <p className="text-right text-[11px] text-base-content/55">{typeDef.referenceStandard}</p>

        <p className="text-[11px] text-base-content/50 max-w-prose">
          Drawings are schematic. Verify groove dimensions, hardness, and identification against ASME B16.20 and
          project specifications.
        </p>
      </div>
    </div>
  );
}
