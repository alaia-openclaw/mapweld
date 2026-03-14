"use client";

import { useState } from "react";
import { CATEGORY_TREE } from "@/lib/catalog-structure";

function hasSelectedDescendant(node, selectedId) {
  if (node.id === selectedId) return true;
  if (!node.children?.length) return false;
  return node.children.some((c) => hasSelectedDescendant(c, selectedId));
}

/** Sum of counts for this node: leaf uses counts[id], parent sums children. */
function getNodeCount(node, counts) {
  if (!counts) return undefined;
  if (!node.children?.length) return counts[node.id] ?? 0;
  return node.children.reduce((sum, c) => sum + getNodeCount(c, counts), 0);
}

function CategoryNode({ node, level, selectedId, onSelect, counts }) {
  const hasChildren = node.children?.length > 0;
  const isSelected = selectedId === node.id;
  const expanded = hasChildren && (isSelected || hasSelectedDescendant(node, selectedId));
  const [userExpanded, setUserExpanded] = useState(expanded);
  const isExpanded = hasChildren ? (expanded || userExpanded) : false;
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
          onClick={() => setUserExpanded((e) => !e)}
        >
          <span className="text-base-content/60 w-4 shrink-0">
            {isExpanded ? "▼" : "▶"}
          </span>
          <span className={`flex-1 truncate ${isSelected ? "font-semibold text-primary" : ""}`}>
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
      <span className="flex-1 truncate">{node.label}</span>
      {showCount && (
        <span className={`badge badge-sm shrink-0 tabular-nums ${isSelected ? "badge-primary" : "badge-ghost"}`}>
          {count}
        </span>
      )}
    </button>
  );
}

export default function CatalogSidebar({ tree = CATEGORY_TREE, selectedId, onSelect, counts }) {
  return (
    <nav
      className="w-56 shrink-0 border-r border-base-300 bg-base-100 flex flex-col overflow-y-auto"
      aria-label="Catalog categories"
    >
      <div className="p-2 border-b border-base-300 bg-base-200/60 text-xs font-semibold uppercase tracking-wide text-base-content/70 sticky top-0">
        Categories
      </div>
      <div className="flex-1 p-1">
        {tree.map((node) => (
          <CategoryNode
            key={node.id}
            node={node}
            level={0}
            selectedId={selectedId}
            onSelect={onSelect}
            counts={counts}
          />
        ))}
      </div>
    </nav>
  );
}
