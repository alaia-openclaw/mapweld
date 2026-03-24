"use client";

import { findNodeById } from "@/lib/catalog-tree-path";

/**
 * Parent nodes in the Pipedata tree: quick links to children when no tabular panel exists.
 */
export default function PanelCatalogBranchOverview({ tree, selectedId, onSelectChild }) {
  const node = findNodeById(tree, selectedId);
  if (!node) return null;
  const children = node.children ?? [];
  return (
    <div className="rounded-xl border border-base-300 bg-base-100 p-6 space-y-4">
      <h2 className="text-lg font-semibold text-base-content">{node.label}</h2>
      <p className="text-sm text-base-content/70">
        Open a subcategory in the sidebar, or jump to one below. Data-backed tables appear for flanges, pipe, fittings,
        gaskets, and valves where the reference database is available.
      </p>
      {children.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {children.map((c) => (
            <button
              key={c.id}
              type="button"
              className="btn btn-sm btn-outline border-base-300"
              onClick={() => onSelectChild?.(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-base-content/60">No further subcategories.</p>
      )}
    </div>
  );
}
