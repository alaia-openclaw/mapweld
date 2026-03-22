"use client";

import { useMemo } from "react";
import {
  FLANGED_VALVE_TYPES,
  getFlangedValveRowsForType,
  getFlangedValveTypeBySelectionId,
  matchFlangedValveRow,
  buildFlangedValveTitle,
  FLANGED_VALVE_FACE_TYPES,
  FLANGED_VALVE_ACTUATORS,
} from "@/lib/flanged-valves-data";
import {
  catalogPanelOuterClass,
  catalogMainGridClass,
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
    if (a.pressureClass !== b.pressureClass)
      return (pcOrder[a.pressureClass] ?? 0) - (pcOrder[b.pressureClass] ?? 0);
    if (a.faceType && b.faceType)
      return FLANGED_VALVE_FACE_TYPES.indexOf(a.faceType) - FLANGED_VALVE_FACE_TYPES.indexOf(b.faceType);
    if (a.actuator && b.actuator)
      return FLANGED_VALVE_ACTUATORS.indexOf(a.actuator) - FLANGED_VALVE_ACTUATORS.indexOf(b.actuator);
    return 0;
  });
}

function findFlangedRowFromFacets(rows, facets, typeDef) {
  if (!rows?.length || !typeDef) return null;
  const dn = facets.v_dn !== undefined && facets.v_dn !== "" ? Number(facets.v_dn) : null;
  const pc = facets.v_class !== undefined && facets.v_class !== "" ? facets.v_class : null;
  const face = facets.v_face !== undefined && facets.v_face !== "" ? facets.v_face : null;
  const act = facets.v_actuator !== undefined && facets.v_actuator !== "" ? facets.v_actuator : null;
  const toolbarFace = typeDef.toolbar === "face";
  const match = rows.find((r) => {
    if (dn != null && r.dn !== dn) return false;
    if (pc != null && r.pressureClass !== pc) return false;
    if (toolbarFace) {
      if (face != null && r.faceType !== face) return false;
    } else if (act != null && r.actuator !== act) return false;
    return true;
  });
  return match ?? rows[0];
}

/**
 * Schematic diagrams — representative geometry; labels use row dimensions (mm / kg).
 */
function FlangedValveDiagramSvg({ valveTypeId, dims }) {
  const d = dims || {};
  if (valveTypeId === "gate") {
    const { handwheelH = 680, stemToCL = 1468, faceToFace = 838 } = d;
    return (
      <svg viewBox="0 0 420 320" className="w-full max-w-3xl mx-auto h-auto text-base-content" aria-hidden>
        <rect width="420" height="320" fill="white" />
        <line x1="210" y1="200" x2="210" y2="40" stroke="currentColor" strokeWidth="0.8" strokeDasharray="6 4" />
        <line x1="80" y1="200" x2="340" y2="200" stroke="currentColor" strokeWidth="0.8" strokeDasharray="6 4" />
        <rect x="120" y="175" width="180" height="50" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="210" cy="55" r="28" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <line x1="182" y1="55" x2="238" y2="55" stroke="currentColor" strokeWidth="1" />
        <text x="260" y="58" className="text-[10px] fill-current font-mono font-semibold">
          {handwheelH}
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
    const { handwheelDia = 560, stemToCL = 1468, faceToFace = 838 } = d;
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
    const { offset395 = 395, faceToFace = 838, offset133 = 133, height710 = 710, handwheelDia = 635 } = d;
    return (
      <svg viewBox="0 0 480 300" className="w-full max-w-4xl mx-auto h-auto text-base-content" aria-hidden>
        <rect width="480" height="300" fill="white" />
        <text x="90" y="155" textAnchor="middle" className="text-[9px] fill-current opacity-70">
          End
        </text>
        <circle cx="90" cy="120" r="55" fill="none" stroke="currentColor" strokeWidth="1" />
        <circle cx="90" cy="120" r="22" fill="none" stroke="currentColor" strokeWidth="0.8" />
        <line x1="90" y1="120" x2="145" y2="120" stroke="currentColor" strokeWidth="0.75" />
        <text x="118" y="112" className="text-[10px] fill-current font-mono font-semibold">
          {offset395}
        </text>
        <line x1="200" y1="180" x2="380" y2="180" stroke="currentColor" strokeWidth="0.8" strokeDasharray="6 4" />
        <rect x="210" y="150" width="160" height="60" rx="4" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="320" cy="55" r="32" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <text x="360" y="58" className="text-[10px] fill-current font-mono font-semibold">
          {handwheelDia}
        </text>
        <line x1="290" y1="180" x2="290" y2="55" stroke="currentColor" strokeWidth="0.75" />
        <text x="302" y="120" className="text-[10px] fill-current font-mono font-semibold">
          {height710}
        </text>
        <line x1="210" y1="235" x2="370" y2="235" stroke="currentColor" strokeWidth="0.75" />
        <text x="290" y="252" textAnchor="middle" className="text-[10px] fill-current font-mono font-semibold">
          {faceToFace}
        </text>
        <line x1="250" y1="180" x2="250" y2="200" stroke="currentColor" strokeWidth="0.6" />
        <text x="255" y="198" className="text-[9px] fill-current font-mono font-semibold">
          {offset133}
        </text>
      </svg>
    );
  }
  if (valveTypeId === "control") {
    const { topWidth = 635, height = 1625.6, faceToFace = 850.9 } = d;
    return (
      <svg viewBox="0 0 420 300" className="w-full max-w-3xl mx-auto h-auto text-base-content" aria-hidden>
        <rect width="420" height="300" fill="white" />
        <line x1="210" y1="240" x2="210" y2="35" stroke="currentColor" strokeWidth="0.8" strokeDasharray="6 4" />
        <ellipse cx="210" cy="70" rx={Math.min(80, topWidth / 10)} ry="22" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <text x="300" y="74" className="text-[10px] fill-current font-mono font-semibold">
          {topWidth}
        </text>
        <rect x="150" y="175" width="120" height="65" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <line x1="330" y1="240" x2="330" y2="70" stroke="currentColor" strokeWidth="0.75" />
        <text x="340" y="158" className="text-[10px] fill-current font-mono font-semibold">
          {height}
        </text>
        <line x1="140" y1="265" x2="280" y2="265" stroke="currentColor" strokeWidth="0.75" />
        <text x="210" y="282" textAnchor="middle" className="text-[10px] fill-current font-mono font-semibold">
          {faceToFace}
        </text>
      </svg>
    );
  }
  if (valveTypeId === "swing-check") {
    const { faceToFace = 787, height483 = 483 } = d;
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
  if (valveTypeId === "wafer-check") {
    const { faceToFace = 213, id273 = 273.05, od400 = 400.05 } = d;
    return (
      <svg viewBox="0 0 460 260" className="w-full max-w-4xl mx-auto h-auto text-base-content" aria-hidden>
        <rect width="460" height="260" fill="white" />
        <circle cx="120" cy="130" r="72" fill="url(#wc-h)" stroke="currentColor" strokeWidth="1" />
        <defs>
          <pattern id="wc-h" patternUnits="userSpaceOnUse" width="6" height="6">
            <path d="M0 6 L6 0" stroke="currentColor" strokeWidth="0.4" opacity="0.25" />
          </pattern>
        </defs>
        <circle cx="120" cy="130" r="38" fill="none" stroke="currentColor" strokeWidth="0.8" />
        <text x="120" y="134" textAnchor="middle" className="text-[9px] fill-current font-mono font-semibold">
          {id273}
        </text>
        <line x1="48" y1="130" x2="192" y2="130" stroke="currentColor" strokeWidth="0.75" />
        <text x="120" y="118" textAnchor="middle" className="text-[9px] fill-current font-mono font-semibold">
          {od400}
        </text>
        <rect x="280" y="95" width="24" height="70" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <line x1="260" y1="200" x2="324" y2="200" stroke="currentColor" strokeWidth="0.8" strokeDasharray="6 4" />
        <line x1="270" y1="225" x2="314" y2="225" stroke="currentColor" strokeWidth="0.75" />
        <text x="292" y="242" textAnchor="middle" className="text-[10px] fill-current font-mono font-semibold">
          {faceToFace}
        </text>
      </svg>
    );
  }
  if (valveTypeId === "wafer-butterfly") {
    const { lever450 = 450, height285 = 285, thickness117 = 117 } = d;
    return (
      <svg viewBox="0 0 460 260" className="w-full max-w-4xl mx-auto h-auto text-base-content" aria-hidden>
        <rect width="460" height="260" fill="white" />
        <circle cx="140" cy="140" r="62" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <line x1="140" y1="140" x2="200" y2="60" stroke="currentColor" strokeWidth="1.4" />
        <line x1="200" y1="60" x2="240" y2="40" stroke="currentColor" strokeWidth="1.2" />
        <line x1="140" y1="140" x2="290" y2="140" stroke="currentColor" strokeWidth="0.75" />
        <text x="215" y="132" className="text-[10px] fill-current font-mono font-semibold">
          {lever450}
        </text>
        <line x1="300" y1="200" x2="300" y2="60" stroke="currentColor" strokeWidth="0.75" />
        <text x="308" y="134" className="text-[10px] fill-current font-mono font-semibold">
          {height285}
        </text>
        <rect x="320" y="115" width={thickness117 / 4} height="50" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <line x1="310" y1="210" x2="350" y2="210" stroke="currentColor" strokeWidth="0.75" />
        <text x="330" y="226" textAnchor="middle" className="text-[10px] fill-current font-mono font-semibold">
          {thickness117}
        </text>
      </svg>
    );
  }
  if (valveTypeId === "lug-butterfly") {
    const { diag495 = 495, lever304 = 304, vert304 = 304, thickness117 = 117 } = d;
    return (
      <svg viewBox="0 0 460 280" className="w-full max-w-4xl mx-auto h-auto text-base-content" aria-hidden>
        <rect width="460" height="280" fill="white" />
        <circle cx="150" cy="160" r="68" fill="none" stroke="currentColor" strokeWidth="1.2" />
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          const x1 = 150 + Math.cos(a) * 58;
          const y1 = 160 + Math.sin(a) * 58;
          const x2 = 150 + Math.cos(a) * 74;
          const y2 = 160 + Math.sin(a) * 74;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="0.8" />;
        })}
        <line x1="150" y1="160" x2="210" y2="70" stroke="currentColor" strokeWidth="1.4" />
        <line x1="210" y1="70" x2="250" y2="55" stroke="currentColor" strokeWidth="1.2" />
        <line x1="150" y1="220" x2="250" y2="70" stroke="currentColor" strokeWidth="0.6" strokeDasharray="4 3" />
        <text x="200" y="148" className="text-[10px] fill-current font-mono font-semibold">
          {diag495}
        </text>
        <line x1="150" y1="160" x2="280" y2="160" stroke="currentColor" strokeWidth="0.75" />
        <text x="215" y="152" className="text-[10px] fill-current font-mono font-semibold">
          {lever304}
        </text>
        <line x1="310" y1="200" x2="310" y2="90" stroke="currentColor" strokeWidth="0.75" />
        <text x="318" y="148" className="text-[10px] fill-current font-mono font-semibold">
          {vert304}
        </text>
        <rect x="330" y="130" width={thickness117 / 4} height="60" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <line x1="320" y1="230" x2="360" y2="230" stroke="currentColor" strokeWidth="0.75" />
        <text x="340" y="246" textAnchor="middle" className="text-[10px] fill-current font-mono font-semibold">
          {thickness117}
        </text>
      </svg>
    );
  }
  return null;
}

export default function PanelCatalogFlangedValves({
  selectionId,
  search = "",
  catalogFacets = {},
  mergeFacets = () => {},
}) {
  const typeDef = useMemo(() => getFlangedValveTypeBySelectionId(selectionId), [selectionId]);
  const allRows = useMemo(
    () => (typeDef ? getFlangedValveRowsForType(typeDef.id) : []),
    [typeDef]
  );

  const rowsFiltered = useMemo(() => {
    return allRows.filter((row) => matchFlangedValveRow(row, search));
  }, [allRows, search]);

  const sortedRows = useMemo(() => sortRows(rowsFiltered), [rowsFiltered]);

  const currentRow = useMemo(
    () => findFlangedRowFromFacets(sortedRows, catalogFacets, typeDef),
    [sortedRows, catalogFacets, typeDef]
  );

  if (!typeDef) {
    return (
      <div className="rounded-xl border border-base-300 bg-base-200/60 p-6 text-sm text-base-content/70">
        Unknown flanged valve category.
      </div>
    );
  }

  const valveTypeId = typeDef.id;

  const title = buildFlangedValveTitle(typeDef, currentRow);
  const weightLine =
    valveTypeId === "ball"
      ? `Weight = ${currentRow?.weightKg ?? "—"}kg`
      : `Valve Weight = ${currentRow?.weightKg ?? "—"}kg`;

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
                  <th>{typeDef.toolbar === "face" ? "Face" : "Actuator"}</th>
                  <th>Wt (kg)</th>
                  <th>F-F (mm)</th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row, idx) => {
                  const isSel =
                    currentRow &&
                    row.dn === currentRow.dn &&
                    row.pressureClass === currentRow.pressureClass &&
                    (typeDef.toolbar === "face"
                      ? row.faceType === currentRow.faceType
                      : row.actuator === currentRow.actuator);
                  return (
                    <tr
                      key={`${row.dn}-${row.pressureClass}-${row.faceType ?? ""}-${row.actuator ?? ""}-${idx}`}
                      className={isSel ? "bg-primary/10 cursor-pointer" : "cursor-pointer hover:bg-base-200/80"}
                      onClick={() =>
                        mergeFacets(
                          typeDef.toolbar === "face"
                            ? {
                                v_dn: String(row.dn),
                                v_class: row.pressureClass,
                                v_face: row.faceType ?? "",
                              }
                            : {
                                v_dn: String(row.dn),
                                v_class: row.pressureClass,
                                v_actuator: row.actuator ?? "",
                              }
                        )
                      }
                    >
                      <td>{row.dn}</td>
                      <td>{row.pressureClass}</td>
                      <td>{typeDef.toolbar === "face" ? row.faceType ?? "—" : row.actuator ?? "—"}</td>
                      <td>{row.weightKg ?? "—"}</td>
                      <td>{faceToFaceDisplay(row)}</td>
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
                  <FlangedValveDiagramSvg valveTypeId={valveTypeId} dims={currentRow?.dims} />
                </div>
                <div className="flex flex-wrap justify-between gap-2 text-[11px] text-base-content/75">
                  <div className="space-y-0.5">
                    {typeDef.weightNote ? <p>{typeDef.weightNote}</p> : null}
                    {typeDef.dimNote ? <p>{typeDef.dimNote}</p> : null}
                    {typeDef.extraNotes?.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                  <p className="font-bold text-base-content">{typeDef.referenceStandard}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
