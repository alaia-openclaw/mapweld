"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import {
  THREADED_VALVE_TYPES,
  getThreadedValveRowsForType,
  getThreadedValveTypeBySelectionId,
  matchThreadedValveRow,
  buildThreadedValveTitle,
  THREADED_VALVE_DNS,
  THREADED_VALVE_PRESSURE_CLASSES,
} from "@/lib/threaded-valves-data";

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

function sortRows(rows) {
  const pcOrder = { "150#": 0, "300#": 1, "600#": 2, "800#": 3 };
  return rows.slice().sort((a, b) => {
    if (a.dn !== b.dn) return a.dn - b.dn;
    return (pcOrder[a.pressureClass] ?? 0) - (pcOrder[b.pressureClass] ?? 0);
  });
}

/** Schematic placeholder — dimensions (mm) from reference data in threaded-valves-data. */
function ThreadedValveDiagramSvg({ valveTypeId, dims }) {
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

export default function PanelCatalogThreadedValves({ selectionId, search = "", onSelectCategory }) {
  const typeDef = useMemo(() => getThreadedValveTypeBySelectionId(selectionId), [selectionId]);
  const allRows = useMemo(
    () => (typeDef ? getThreadedValveRowsForType(typeDef.id) : []),
    [typeDef]
  );

  const rowsFiltered = useMemo(() => {
    return allRows.filter((row) => matchThreadedValveRow(row, search));
  }, [allRows, search]);

  const sortedRows = useMemo(() => sortRows(rowsFiltered), [rowsFiltered]);

  const dnsOptions = useMemo(() => {
    const s = new Set(sortedRows.map((r) => r.dn));
    return s.size ? [...s].sort((a, b) => a - b) : THREADED_VALVE_DNS;
  }, [sortedRows]);

  const classOptions = useMemo(() => {
    const pcOrder = { "150#": 0, "300#": 1, "600#": 2, "800#": 3 };
    const s = new Set(sortedRows.map((r) => r.pressureClass));
    return s.size
      ? [...s].sort((a, b) => (pcOrder[a] ?? 99) - (pcOrder[b] ?? 99))
      : THREADED_VALVE_PRESSURE_CLASSES;
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
        Unknown threaded valve category.
      </div>
    );
  }

  const valveTypeId = typeDef.id;
  const title = buildThreadedValveTitle(typeDef, currentRow);
  const weightLine = `Weight = ${currentRow?.weightKg ?? "—"}kg`;

  return (
    <div className="flex flex-col rounded-lg border border-base-300 bg-base-100 overflow-hidden min-h-[420px]">
      <div className="bg-primary text-primary-content px-2 py-2 flex flex-wrap items-end gap-2 shrink-0">
        <div className="flex items-center gap-0.5">
          <ToolbarIconButton title="First" onClick={goFirst}>
            <span className="text-xs font-mono">|◀</span>
          </ToolbarIconButton>
          <ToolbarIconButton title="Previous" onClick={goPrev}>
            <span className="text-xs">◀</span>
          </ToolbarIconButton>
          <select
            className="select select-bordered select-xs bg-primary text-primary-content border-primary-content/30 max-w-[14rem]"
            value={selectionId}
            onChange={(e) => onSelectCategory?.(e.target.value)}
          >
            {THREADED_VALVE_TYPES.map((t) => (
              <option key={t.selectionId} value={t.selectionId} className="text-base-content bg-base-100">
                {t.label}
              </option>
            ))}
          </select>
          <ToolbarIconButton title="Next" onClick={goNext}>
            <span className="text-xs">▶</span>
          </ToolbarIconButton>
          <ToolbarIconButton title="Last" onClick={goLast}>
            <span className="text-xs font-mono">▶|</span>
          </ToolbarIconButton>
        </div>

        <div className="flex flex-wrap items-end gap-2 flex-1 justify-center">
          <label className="form-control">
            <span className="label-text text-[10px] text-primary-content/90">Size</span>
            <select
              className="select select-bordered select-xs bg-primary text-primary-content border-primary-content/30 w-[4.5rem]"
              value={currentRow?.dn ?? ""}
              onChange={(e) => onDnChange(Number(e.target.value))}
              disabled={!sortedRows.length}
            >
              {dnsOptions.map((n) => (
                <option key={n} value={n} className="text-base-content bg-base-100">
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className="form-control">
            <span className="label-text text-[10px] text-primary-content/90">Class</span>
            <select
              className="select select-bordered select-xs bg-primary text-primary-content border-primary-content/30 w-[4.5rem]"
              value={currentRow?.pressureClass ?? ""}
              onChange={(e) => onClassChange(e.target.value)}
              disabled={!sortedRows.length}
            >
              {classOptions.map((c) => (
                <option key={c} value={c} className="text-base-content bg-base-100">
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1 min-h-0">
        {!sortedRows.length ? (
          <p className="text-sm text-base-content/60">No rows match the current search.</p>
        ) : (
          <>
            <div>
              <h2 className="text-lg font-bold text-base-content">{title}</h2>
              <p className="text-sm font-medium text-base-content/90">{weightLine}</p>
            </div>
            <div className="rounded-lg border border-base-300 bg-white p-3 flex justify-center">
              <ThreadedValveDiagramSvg valveTypeId={valveTypeId} dims={currentRow?.dims} />
            </div>
            <p className="text-[11px] text-base-content/75 font-bold">{typeDef.referenceStandard}</p>
          </>
        )}
      </div>
    </div>
  );
}
