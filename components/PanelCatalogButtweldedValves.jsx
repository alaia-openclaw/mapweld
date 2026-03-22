"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import {
  BUTTWELDED_VALVE_TYPES,
  getButtweldedValveRowsForType,
  getButtweldedValveTypeBySelectionId,
  matchButtweldedValveRow,
  buildButtweldedValveTitle,
  BUTTWELDED_VALVE_DNS,
  BUTTWELDED_VALVE_PRESSURE_CLASSES,
} from "@/lib/buttwelded-valves-data";
import {
  CatalogToolbarIconButton,
  catalogPanelOuterClass,
  catalogPanelToolbarClass,
  catalogTableScrollClass,
  catalogTableClassName,
} from "@/components/CatalogCategoryToolbar";

function faceToFaceDisplay(row) {
  const v = row?.dims?.faceToFace;
  return v != null && !Number.isNaN(v) ? String(v) : "—";
}

function sortRows(rows) {
  const pcOrder = { "150#": 0, "300#": 1, "600#": 2, "900#": 3 };
  return rows.slice().sort((a, b) => {
    if (a.dn !== b.dn) return a.dn - b.dn;
    return (pcOrder[a.pressureClass] ?? 0) - (pcOrder[b.pressureClass] ?? 0);
  });
}

/** Schematic diagrams — buttweld ends; dimensions in mm from row data. */
function ButtweldedValveDiagramSvg({ valveTypeId, dims }) {
  const d = dims || {};
  if (valveTypeId === "gate") {
    const { handwheelDia = 640, stemToCL = 1279, faceToFace = 510 } = d;
    return (
      <svg viewBox="0 0 420 320" className="w-full max-w-3xl mx-auto h-auto text-base-content" aria-hidden>
        <rect width="420" height="320" fill="white" />
        <line x1="210" y1="200" x2="210" y2="40" stroke="currentColor" strokeWidth="0.8" strokeDasharray="6 4" />
        <line x1="80" y1="200" x2="340" y2="200" stroke="currentColor" strokeWidth="0.8" strokeDasharray="6 4" />
        <path d="M 115 200 L 115 175 L 305 175 L 305 200" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <path d="M 115 175 L 125 165 L 295 165 L 305 175" fill="none" stroke="currentColor" strokeWidth="0.9" opacity="0.85" />
        <circle cx="210" cy="55" r="28" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <line x1="150" y1="55" x2="150" y2="83" stroke="currentColor" strokeWidth="0.75" />
        <line x1="146" y1="55" x2="154" y2="55" stroke="currentColor" strokeWidth="0.75" />
        <line x1="146" y1="83" x2="154" y2="83" stroke="currentColor" strokeWidth="0.75" />
        <text x="138" y="72" className="text-[10px] fill-current font-mono font-semibold" textAnchor="middle">
          {handwheelDia}
        </text>
        <line x1="350" y1="200" x2="350" y2="55" stroke="currentColor" strokeWidth="0.75" />
        <line x1="346" y1="200" x2="354" y2="200" stroke="currentColor" strokeWidth="0.75" />
        <line x1="346" y1="55" x2="354" y2="55" stroke="currentColor" strokeWidth="0.75" />
        <text x="362" y="132" className="text-[10px] fill-current font-mono font-semibold">
          {stemToCL}
        </text>
        <line x1="120" y1="255" x2="300" y2="255" stroke="currentColor" strokeWidth="0.75" />
        <line x1="120" y1="251" x2="120" y2="259" stroke="currentColor" strokeWidth="0.75" />
        <line x1="300" y1="251" x2="300" y2="259" stroke="currentColor" strokeWidth="0.75" />
        <text x="210" y="272" textAnchor="middle" className="text-[10px] fill-current font-mono font-semibold">
          {faceToFace}
        </text>
      </svg>
    );
  }
  if (valveTypeId === "globe") {
    const { handwheelDia = 560, stemToCL = 1411, faceToFace = 787 } = d;
    return (
      <svg viewBox="0 0 420 320" className="w-full max-w-3xl mx-auto h-auto text-base-content" aria-hidden>
        <rect width="420" height="320" fill="white" />
        <line x1="210" y1="200" x2="210" y2="40" stroke="currentColor" strokeWidth="0.8" strokeDasharray="6 4" />
        <line x1="80" y1="200" x2="340" y2="200" stroke="currentColor" strokeWidth="0.8" strokeDasharray="6 4" />
        <path
          d="M 150 200 Q 210 120 270 200 L 250 175 L 170 175 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        <circle cx="210" cy="55" r="28" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <text x="268" y="58" className="text-[10px] fill-current font-mono font-semibold">
          {handwheelDia}
        </text>
        <line x1="350" y1="200" x2="350" y2="55" stroke="currentColor" strokeWidth="0.75" />
        <text x="362" y="132" className="text-[10px] fill-current font-mono font-semibold">
          {stemToCL}
        </text>
        <line x1="130" y1="255" x2="290" y2="255" stroke="currentColor" strokeWidth="0.75" />
        <text x="210" y="272" textAnchor="middle" className="text-[10px] fill-current font-mono font-semibold">
          {faceToFace}
        </text>
      </svg>
    );
  }
  if (valveTypeId === "ball") {
    const {
      offset395 = 395,
      faceToFace = 787,
      offset133 = 133,
      height460 = 460,
      handwheelDia = 635,
    } = d;
    return (
      <svg viewBox="0 0 480 300" className="w-full max-w-4xl mx-auto h-auto text-base-content" aria-hidden>
        <rect width="480" height="300" fill="white" />
        <circle cx="90" cy="120" r="55" fill="none" stroke="currentColor" strokeWidth="1" />
        <circle cx="90" cy="120" r="22" fill="none" stroke="currentColor" strokeWidth="0.8" />
        <line x1="90" y1="120" x2="145" y2="120" stroke="currentColor" strokeWidth="0.75" />
        <text x="118" y="112" className="text-[10px] fill-current font-mono font-semibold">
          {offset395}
        </text>
        <line x1="200" y1="180" x2="380" y2="180" stroke="currentColor" strokeWidth="0.8" strokeDasharray="6 4" />
        <path d="M 210 190 L 210 170 L 370 170 L 370 190" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="320" cy="55" r="32" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <text x="360" y="58" className="text-[10px] fill-current font-mono font-semibold">
          {handwheelDia}
        </text>
        <line x1="290" y1="180" x2="290" y2="55" stroke="currentColor" strokeWidth="0.75" />
        <text x="302" y="120" className="text-[10px] fill-current font-mono font-semibold">
          {height460}
        </text>
        <line x1="250" y1="180" x2="250" y2="200" stroke="currentColor" strokeWidth="0.6" />
        <text x="255" y="198" className="text-[9px] fill-current font-mono font-semibold">
          {offset133}
        </text>
        <line x1="210" y1="235" x2="370" y2="235" stroke="currentColor" strokeWidth="0.75" />
        <text x="290" y="252" textAnchor="middle" className="text-[10px] fill-current font-mono font-semibold">
          {faceToFace}
        </text>
      </svg>
    );
  }
  if (valveTypeId === "swing-check") {
    const { faceToFace = 711, height483 = 483 } = d;
    return (
      <svg viewBox="0 0 420 280" className="w-full max-w-3xl mx-auto h-auto text-base-content" aria-hidden>
        <rect width="420" height="280" fill="white" />
        <line x1="210" y1="200" x2="210" y2="80" stroke="currentColor" strokeWidth="0.8" strokeDasharray="6 4" />
        <line x1="100" y1="200" x2="320" y2="200" stroke="currentColor" strokeWidth="0.8" strokeDasharray="6 4" />
        <path d="M 130 200 L 210 110 L 290 200 Z" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <line x1="320" y1="200" x2="320" y2="110" stroke="currentColor" strokeWidth="0.75" />
        <text x="332" y="158" className="text-[10px] fill-current font-mono font-semibold">
          {height483}
        </text>
        <line x1="130" y1="235" x2="290" y2="235" stroke="currentColor" strokeWidth="0.75" />
        <text x="210" y="252" textAnchor="middle" className="text-[10px] fill-current font-mono font-semibold">
          {faceToFace}
        </text>
      </svg>
    );
  }
  return null;
}

export default function PanelCatalogButtweldedValves({ selectionId, search = "", onSelectCategory }) {
  const typeDef = useMemo(() => getButtweldedValveTypeBySelectionId(selectionId), [selectionId]);
  const allRows = useMemo(
    () => (typeDef ? getButtweldedValveRowsForType(typeDef.id) : []),
    [typeDef]
  );

  const rowsFiltered = useMemo(() => {
    return allRows.filter((row) => matchButtweldedValveRow(row, search));
  }, [allRows, search]);

  const sortedRows = useMemo(() => sortRows(rowsFiltered), [rowsFiltered]);

  const dnsOptions = useMemo(() => {
    const s = new Set(sortedRows.map((r) => r.dn));
    return s.size ? [...s].sort((a, b) => a - b) : BUTTWELDED_VALVE_DNS;
  }, [sortedRows]);

  const classOptions = useMemo(() => {
    const pcOrder = { "150#": 0, "300#": 1, "600#": 2, "900#": 3 };
    const s = new Set(sortedRows.map((r) => r.pressureClass));
    return s.size
      ? [...s].sort((a, b) => (pcOrder[a] ?? 99) - (pcOrder[b] ?? 99))
      : BUTTWELDED_VALVE_PRESSURE_CLASSES;
  }, [sortedRows]);

  const [rowIndex, setRowIndex] = useState(0);

  useEffect(() => {
    setRowIndex(0);
  }, [selectionId, search]);

  useEffect(() => {
    if (rowIndex >= sortedRows.length) setRowIndex(Math.max(0, sortedRows.length - 1));
  }, [sortedRows.length, rowIndex]);

  const currentRow = sortedRows[rowIndex] ?? null;

  const goFirst = useCallback(() => setRowIndex(0), []);
  const goPrev = useCallback(() => {
    setRowIndex((i) => (sortedRows.length ? (i - 1 + sortedRows.length) % sortedRows.length : 0));
  }, [sortedRows.length]);
  const goNext = useCallback(() => {
    setRowIndex((i) => (sortedRows.length ? (i + 1) % sortedRows.length : 0));
  }, [sortedRows.length]);
  const goLast = useCallback(() => {
    setRowIndex(Math.max(0, sortedRows.length - 1));
  }, [sortedRows.length]);

  const onDnChange = useCallback(
    (dn) => {
      const idx = sortedRows.findIndex(
        (r) => r.dn === dn && r.pressureClass === currentRow?.pressureClass
      );
      if (idx >= 0) setRowIndex(idx);
    },
    [sortedRows, currentRow]
  );

  const onClassChange = useCallback(
    (pc) => {
      const idx = sortedRows.findIndex((r) => r.dn === currentRow?.dn && r.pressureClass === pc);
      if (idx >= 0) setRowIndex(idx);
    },
    [sortedRows, currentRow]
  );

  if (!typeDef) {
    return (
      <div className="rounded-xl border border-base-300 bg-base-200/60 p-6 text-sm text-base-content/70">
        Unknown buttwelded valve category.
      </div>
    );
  }

  const valveTypeId = typeDef.id;
  const title = buildButtweldedValveTitle(typeDef, currentRow);
  const weightLine = `Weight = ${currentRow?.weightKg ?? "—"}kg`;

  return (
    <div className={catalogPanelOuterClass}>
      <div className="flex flex-col flex-1 min-h-0">
        <div className={catalogPanelToolbarClass}>
          <div className="flex items-center gap-0.5 shrink-0">
            <CatalogToolbarIconButton title="First" onClick={goFirst}>
              <span className="text-xs font-mono">|◀</span>
            </CatalogToolbarIconButton>
            <CatalogToolbarIconButton title="Previous" onClick={goPrev}>
              <span className="text-xs">◀</span>
            </CatalogToolbarIconButton>
            <select
              className="select select-bordered select-xs max-w-[13rem]"
              value={selectionId}
              onChange={(e) => onSelectCategory?.(e.target.value)}
            >
              {BUTTWELDED_VALVE_TYPES.map((t) => (
                <option key={t.selectionId} value={t.selectionId}>
                  {t.label}
                </option>
              ))}
            </select>
            <CatalogToolbarIconButton title="Next" onClick={goNext}>
              <span className="text-xs">▶</span>
            </CatalogToolbarIconButton>
            <CatalogToolbarIconButton title="Last" onClick={goLast}>
              <span className="text-xs font-mono">▶|</span>
            </CatalogToolbarIconButton>
          </div>

          <div className="flex flex-wrap items-end gap-2 flex-1 justify-center">
            <label className="form-control">
              <span className="label-text text-[10px] text-base-content/60">Size (DN)</span>
              <select
                className="select select-bordered select-xs w-[4.5rem]"
                value={currentRow?.dn ?? ""}
                onChange={(e) => onDnChange(Number(e.target.value))}
                disabled={!sortedRows.length}
              >
                {dnsOptions.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-control">
              <span className="label-text text-[10px] text-base-content/60">Class</span>
              <select
                className="select select-bordered select-xs w-[4.5rem]"
                value={currentRow?.pressureClass ?? ""}
                onChange={(e) => onClassChange(e.target.value)}
                disabled={!sortedRows.length}
              >
                {classOptions.map((c) => (
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
            {!sortedRows.length ? (
              <p className="text-sm text-base-content/60">No rows match the current search.</p>
            ) : (
              <>
                <div>
                  <h2 className="text-sm font-semibold text-base-content">{title}</h2>
                  <p className="text-xs font-medium text-base-content/90">{weightLine}</p>
                </div>
                <div className="rounded-lg border border-base-300 bg-base-200/40 p-3 flex justify-center">
                  <ButtweldedValveDiagramSvg valveTypeId={valveTypeId} dims={currentRow?.dims} />
                </div>
                <div className="flex flex-wrap justify-between gap-2 text-[11px] text-base-content/75">
                  <div className="space-y-0.5">
                    {typeDef.weightNote ? <p>{typeDef.weightNote}</p> : null}
                  </div>
                  <p className="font-bold text-base-content">{typeDef.referenceStandard}</p>
                </div>
              </>
            )}
          </div>
          <div className={`${catalogTableScrollClass} min-h-[200px] lg:min-h-0`}>
            <table className={catalogTableClassName}>
              <thead>
                <tr>
                  <th>DN</th>
                  <th>Class</th>
                  <th>Wt (kg)</th>
                  <th>F-F (mm)</th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row, idx) => {
                  const isSel = rowIndex === idx;
                  return (
                    <tr
                      key={`${row.dn}-${row.pressureClass}-${idx}`}
                      className={isSel ? "bg-primary/10 cursor-pointer" : "cursor-pointer hover:bg-base-200/80"}
                      onClick={() => setRowIndex(idx)}
                    >
                      <td>{row.dn}</td>
                      <td>{row.pressureClass}</td>
                      <td>{row.weightKg ?? "—"}</td>
                      <td>{faceToFaceDisplay(row)}</td>
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
