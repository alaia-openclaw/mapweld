"use client";

import { useState, useEffect, useCallback } from "react";
import { CATEGORY_TREE } from "@/lib/catalog-structure";

/** Parent node ids on the path to selectedId (so that branch can be auto-expanded). */
function getAncestorIdsToExpand(nodes, selectedId) {
  const ids = new Set();
  if (!selectedId) return ids;
  function walk(list, ancestors) {
    for (const n of list) {
      if (n.id === selectedId) {
        ancestors.forEach((id) => ids.add(id));
        return true;
      }
      if (n.children?.length) {
        if (walk(n.children, [...ancestors, n.id])) return true;
      }
    }
    return false;
  }
  walk(nodes, []);
  return ids;
}

/** Sum of counts for this node: leaf uses counts[id], parent sums children. */
function getNodeCount(node, counts) {
  if (!counts) return undefined;
  if (!node.children?.length) return counts[node.id] ?? 0;
  return node.children.reduce((sum, c) => sum + getNodeCount(c, counts), 0);
}

function CategoryNode({ node, level, selectedId, onSelect, counts, expandedIds, onToggleExpand }) {
  const hasChildren = node.children?.length > 0;
  const isSelected = selectedId === node.id;
  const isExpanded = hasChildren && expandedIds.has(node.id);
  const paddingLeft = level * 12 + 8;
  const count = getNodeCount(node, counts);
  const showCount = count !== undefined && count >= 0;

  if (hasChildren) {
    return (
      <div className="flex flex-col">
        <button
          type="button"
          className="flex items-center gap-1 w-full text-left px-2 py-1.5 rounded-md hover:bg-base-200 text-sm"
          style={{ paddingLeft: `${paddingLeft}px` }}
          onClick={() => onToggleExpand(node.id)}
        >
          <span className="text-base-content/60 w-4 shrink-0">
            {isExpanded ? "▼" : "▶"}
          </span>
          <span
            className={`flex-1 min-w-0 text-left leading-snug break-words ${isSelected ? "font-semibold text-primary" : ""}`}
          >
            {node.label}
          </span>
          {showCount && (
            <span className="badge badge-sm badge-ghost shrink-0 tabular-nums">
              {count}
            </span>
          )}
        </button>
        {isExpanded && (
          <div className="flex flex-col">
            {node.children.map((child) => (
              <CategoryNode
                key={child.id}
                node={child}
                level={level + 1}
                selectedId={selectedId}
                onSelect={onSelect}
                counts={counts}
                expandedIds={expandedIds}
                onToggleExpand={onToggleExpand}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`flex items-center gap-1 w-full text-left px-2 py-1.5 rounded-md hover:bg-base-200 text-sm ${
        isSelected ? "bg-primary text-primary-content font-medium" : ""
      }`}
      style={{ paddingLeft: `${paddingLeft}px` }}
      onClick={() => onSelect(node.id)}
    >
      <span className="w-4 shrink-0" aria-hidden />
      <span className="flex-1 min-w-0 text-left leading-snug break-words">{node.label}</span>
      {showCount && (
        <span className={`badge badge-sm shrink-0 tabular-nums ${isSelected ? "badge-primary" : "badge-ghost"}`}>
          {count}
        </span>
      )}
    </button>
  );
}

export default function CatalogSidebar({ tree = CATEGORY_TREE, selectedId, onSelect, counts }) {
  const [expandedIds, setExpandedIds] = useState(() => getAncestorIdsToExpand(tree, selectedId));

  useEffect(() => {
    const pathIds = getAncestorIdsToExpand(tree, selectedId);
    setExpandedIds((prev) => {
      const next = new Set(prev);
      pathIds.forEach((id) => next.add(id));
      return next;
    });
  }, [selectedId, tree]);

  const onToggleExpand = useCallback((nodeId) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

  return (
    <nav
      className="w-64 sm:w-72 shrink-0 border-r border-base-300 bg-base-100 flex flex-col overflow-y-auto"
      aria-label="Catalog categories"
    >
      <div className="px-2 pt-2 pb-0.5 text-[10px] font-semibold uppercase tracking-wide text-base-content/70">
        Browse
      </div>
      <div className="flex-1 p-1 pt-0">
        {tree.map((node) => (
          <CategoryNode
            key={node.id}
            node={node}
            level={0}
            selectedId={selectedId}
            onSelect={onSelect}
            counts={counts}
            expandedIds={expandedIds}
            onToggleExpand={onToggleExpand}
          />
        ))}
      </div>
    </nav>
  );
}
