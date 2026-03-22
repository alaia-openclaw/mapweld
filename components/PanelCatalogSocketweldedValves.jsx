"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import {
  SOCKETWELDED_VALVE_TYPES,
  getSocketweldedValveRowsForType,
  getSocketweldedValveTypeBySelectionId,
  matchSocketweldedValveRow,
  buildSocketweldedValveTitle,
  SOCKETWELDED_VALVE_DNS,
  SOCKETWELDED_VALVE_PRESSURE_CLASSES,
} from "@/lib/socketwelded-valves-data";
import {
  CatalogToolbarIconButton,
  catalogPanelOuterClass,
  catalogPanelToolbarClass,
  catalogTableScrollClass,
  catalogTableClassName,
} from "@/components/CatalogCategoryToolbar";

function lengthMmDisplay(row) {
  const d = row?.dims || {};
  const v =
    d.faceToFace ?? d.endToEnd ?? d.spanH ?? d.bodyLen ?? d.outerW ?? d.totalH;
  return v != null && !Number.isNaN(v) ? String(Math.round(v * 100) / 100) : "—";
}

function sortRows(rows) {
  const pcOrder = { "150#": 0, "300#": 1, "600#": 2, "800#": 3 };
  return rows.slice().sort((a, b) => {
    if (a.dn !== b.dn) return a.dn - b.dn;
    return (pcOrder[a.pressureClass] ?? 0) - (pcOrder[b.pressureClass] ?? 0);
  });
}

function SocketweldedValveDiagramSvg({ valveTypeId, dims }) {
  const d = dims || {};
  return (
    <svg viewBox="0 0 420 280" className="w-full max-w-3xl mx-auto h-auto text-base-content" aria-hidden>
      <rect width="420" height="280" fill="white" />
      <line x1="210" y1="200" x2="210" y2="60" stroke="currentColor" strokeWidth="0.8" strokeDasharray="6 4" />
      <line x1="80" y1="200" x2="340" y2="200" stroke="currentColor" strokeWidth="0.8" strokeDasharray="6 4" />
      <text x="210" y="40" textAnchor="middle" className="text-[11px] fill-current font-semibold">
        {valveTypeId.replace(/-/g, " ")}
      </text>
      <text x="210" y="250" textAnchor="middle" className="text-[10px] fill-current font-mono">
        {Object.keys(d).length
          ? Object.entries(d)
              .map(([k, v]) => `${k}: ${typeof v === "number" ? Math.round(v * 100) / 100 : v}`)
              .join(" · ")
          : "—"}
      </text>
    </svg>
  );
}

export default function PanelCatalogSocketweldedValves({ selectionId, search = "", onSelectCategory }) {
  const typeDef = useMemo(() => getSocketweldedValveTypeBySelectionId(selectionId), [selectionId]);
  const allRows = useMemo(
    () => (typeDef ? getSocketweldedValveRowsForType(typeDef.id) : []),
    [typeDef]
  );

  const rowsFiltered = useMemo(() => {
    return allRows.filter((row) => matchSocketweldedValveRow(row, search));
  }, [allRows, search]);

  const sortedRows = useMemo(() => sortRows(rowsFiltered), [rowsFiltered]);

  const dnsOptions = useMemo(() => {
    const s = new Set(sortedRows.map((r) => r.dn));
    return s.size ? [...s].sort((a, b) => a - b) : SOCKETWELDED_VALVE_DNS;
  }, [sortedRows]);

  const classOptions = useMemo(() => {
    const pcOrder = { "150#": 0, "300#": 1, "600#": 2, "800#": 3 };
    const s = new Set(sortedRows.map((r) => r.pressureClass));
    return s.size
      ? [...s].sort((a, b) => (pcOrder[a] ?? 99) - (pcOrder[b] ?? 99))
      : SOCKETWELDED_VALVE_PRESSURE_CLASSES;
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
        Unknown socketwelded valve category.
      </div>
    );
  }

  const valveTypeId = typeDef.id;
  const title = buildSocketweldedValveTitle(typeDef, currentRow);
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
              {SOCKETWELDED_VALVE_TYPES.map((t) => (
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
                  <SocketweldedValveDiagramSvg valveTypeId={valveTypeId} dims={currentRow?.dims} />
                </div>
                <p className="text-[11px] text-base-content/75 font-bold">{typeDef.referenceStandard}</p>
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
                  <th>L (mm)</th>
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
                      <td>{lengthMmDisplay(row)}</td>
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
