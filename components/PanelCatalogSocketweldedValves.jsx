"use client";

import { useMemo } from "react";
import {
  getSocketweldedValveRowsForType,
  getSocketweldedValveTypeBySelectionId,
  matchSocketweldedValveRow,
  buildSocketweldedValveTitle,
} from "@/lib/socketwelded-valves-data";
import {
  catalogPanelOuterClass,
  catalogMainGridClass,
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

export default function PanelCatalogSocketweldedValves({
  selectionId,
  search = "",
  catalogFacets = {},
  mergeFacets = () => {},
}) {
  const typeDef = useMemo(() => getSocketweldedValveTypeBySelectionId(selectionId), [selectionId]);
  const allRows = useMemo(
    () => (typeDef ? getSocketweldedValveRowsForType(typeDef.id) : []),
    [typeDef]
  );

  const rowsFiltered = useMemo(() => {
    return allRows.filter((row) => matchSocketweldedValveRow(row, search));
  }, [allRows, search]);

  const sortedRows = useMemo(() => sortRows(rowsFiltered), [rowsFiltered]);

  const currentRow = useMemo(
    () => findBvRowFromFacets(sortedRows, catalogFacets),
    [sortedRows, catalogFacets]
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
        <div className={catalogMainGridClass}>
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
                  const isSel =
                    currentRow &&
                    row.dn === currentRow.dn &&
                    row.pressureClass === currentRow.pressureClass;
                  return (
                    <tr
                      key={`${row.dn}-${row.pressureClass}-${idx}`}
                      className={isSel ? "bg-primary/10 cursor-pointer" : "cursor-pointer hover:bg-base-200/80"}
                      onClick={() =>
                        mergeFacets({
                          bv_dn: String(row.dn),
                          bv_class: row.pressureClass,
                        })
                      }
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
        </div>
      </div>
    </div>
  );
}
