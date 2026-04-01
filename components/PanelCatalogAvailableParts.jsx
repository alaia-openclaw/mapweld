"use client";

import { useMemo } from "react";

function normalizeToken(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function equivalentToken(a, b) {
  const na = normalizeToken(a);
  const nb = normalizeToken(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.endsWith("s") && na.slice(0, -1) === nb) return true;
  if (nb.endsWith("s") && nb.slice(0, -1) === na) return true;
  return false;
}

function filterRowsForSelection(rows, selectedPath, selectedNodeHasChildren) {
  if (!rows?.length || !selectedPath?.length) return [];
  const rootLabel = selectedPath[0]?.label ?? "";
  const selectedLabel = selectedPath[selectedPath.length - 1]?.label ?? "";
  const parentLabel = selectedPath.length > 1 ? selectedPath[selectedPath.length - 2]?.label ?? "" : "";

  if (selectedNodeHasChildren) {
    if (selectedPath.length === 1) {
      return rows.filter((row) => equivalentToken(row.category, selectedLabel));
    }
    return rows.filter(
      (row) =>
        equivalentToken(row.category, rootLabel) &&
        equivalentToken(row.subcategory, selectedLabel)
    );
  }

  return rows.filter((row) => {
    const byLabel = equivalentToken(row.submenuElement, selectedLabel);
    const byHierarchy =
      equivalentToken(row.category, rootLabel) &&
      (!row.subcategory || equivalentToken(row.subcategory, parentLabel));
    return byLabel && byHierarchy;
  });
}

export default function PanelCatalogAvailableParts({
  rows = [],
  selectedPath = [],
  selectedNodeHasChildren = false,
  search = "",
}) {
  const filteredRows = useMemo(() => {
    const scoped = filterRowsForSelection(rows, selectedPath, selectedNodeHasChildren);
    if (!search?.trim()) return scoped;
    const q = search.trim().toLowerCase();
    return scoped.filter((row) =>
      [
        row.submenuElement,
        row.databaseFolder,
        row.setFile,
        row.backupDataFiles,
        row.subcategory,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [rows, selectedPath, selectedNodeHasChildren, search]);

  if (!filteredRows.length) {
    return (
      <div className="rounded-xl border border-base-300 bg-base-200/60 p-6 text-sm text-base-content/70">
        No mapped submenu entries were found for this selection yet.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-base-300 bg-base-100 overflow-hidden">
      <div className="px-3 py-2 border-b border-base-300 bg-base-200/50 text-xs text-base-content/70">
        Available parts for this selection ({filteredRows.length})
      </div>
      <div className="overflow-auto max-h-[60vh]">
        <table className="table table-xs w-full">
          <thead>
            <tr>
              <th>Part / submenu</th>
              <th>Folder</th>
              <th>Set file</th>
              <th>Data files</th>
              <th>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, idx) => (
              <tr key={`${row.category}-${row.subcategory}-${row.submenuElement}-${row.setFile}-${idx}`}>
                <td>{row.submenuElement || "—"}</td>
                <td>{row.databaseFolder || "—"}</td>
                <td>{row.setFile || "—"}</td>
                <td className="max-w-[24rem] break-words">{row.backupDataFiles || "—"}</td>
                <td>{row.confidence || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
