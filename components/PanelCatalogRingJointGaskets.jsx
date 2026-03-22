"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import {
  getRingRowsForType,
  getRingJointTypeBySelectionId,
  findRingRow,
  buildRingJointTitle,
  matchRingJointRow,
} from "@/lib/ring-joint-gaskets-data";
import {
  CatalogToolbarIconButton,
  catalogPanelOuterClass,
  catalogPanelToolbarClass,
  catalogTableScrollClass,
  catalogTableClassName,
} from "@/components/CatalogCategoryToolbar";

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
    <div className={catalogPanelOuterClass}>
      <div className="flex flex-col flex-1 min-h-0">
        <div className={catalogPanelToolbarClass}>
          <div className="flex items-center gap-0.5 shrink-0">
            <CatalogToolbarIconButton title="First" onClick={goFirst}>
              <span className="text-xs font-mono">|◀</span>
            </CatalogToolbarIconButton>
            <CatalogToolbarIconButton title="Previous" onClick={() => step(-1)}>
              <span className="text-xs">◀</span>
            </CatalogToolbarIconButton>
            <CatalogToolbarIconButton title="Next" onClick={() => step(1)}>
              <span className="text-xs">▶</span>
            </CatalogToolbarIconButton>
            <CatalogToolbarIconButton title="Last" onClick={goLast}>
              <span className="text-xs font-mono">▶|</span>
            </CatalogToolbarIconButton>
          </div>
          <div className="flex-1 min-w-[8rem] text-xs font-semibold truncate px-1 text-base-content/90">
            {typeDef.label}
          </div>
          <label className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-base-content/60">Size</span>
            <select
              className="select select-bordered select-xs min-w-[6rem]"
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
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)] gap-3 p-3 min-h-0">
          <div className="rounded-lg border border-base-300 bg-base-100 p-3 flex flex-col gap-2 min-h-0 overflow-y-auto">
            <h2 className="text-sm font-semibold leading-snug">{title}</h2>
            {activeRow && (
              <p className="text-xs text-base-content/70">
                Weight = <strong>{activeRow.weightKg}</strong> kg
              </p>
            )}
            {activeRow && typeDef.id === "r" && <DiagramTypeR row={activeRow} />}
            {activeRow && typeDef.id === "rx" && <DiagramTypeRx row={activeRow} />}
            {activeRow && typeDef.id === "bx" && <DiagramTypeBx row={activeRow} />}
            {!activeRow && (
              <p className="text-base-content/60 text-sm">No sizes match the current search.</p>
            )}
            <p className="text-right text-[11px] text-base-content/55">{typeDef.referenceStandard}</p>
            <p className="text-[11px] text-base-content/50">
              Schematic drawings — verify against ASME B16.20 and project specifications.
            </p>
          </div>
          <div className={`${catalogTableScrollClass} min-h-[200px] lg:min-h-0`}>
            <table className={catalogTableClassName}>
              <thead>
                <tr>
                  <th>Size</th>
                  <th>Weight (kg)</th>
                </tr>
              </thead>
              <tbody>
                {indexList.map((row) => {
                  const isSel = activeRow && row.sizeCode === activeRow.sizeCode;
                  return (
                    <tr
                      key={row.sizeCode}
                      className={isSel ? "bg-primary/10 cursor-pointer" : "cursor-pointer hover:bg-base-200/80"}
                      onClick={() => setSizeCode(row.sizeCode)}
                    >
                      <td className="font-mono">{row.sizeCode}</td>
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
