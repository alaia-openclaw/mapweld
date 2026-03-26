"use client";

import { useMemo, useState, useEffect } from "react";
import { CATEGORY_TREE, injectFlangeChildrenFromPartCatalog } from "@/lib/catalog-structure";
import { findPathToLeaf, findNodeById } from "@/lib/catalog-tree-path";

const selectCls =
  "select select-bordered select-xs h-7 min-h-7 py-0.5 max-w-[10rem] text-xs";

/**
 * Cascading dropdowns for Pipedata-aligned catalog (marker defaults / part form).
 */
export default function CatalogTreeCascade({
  tree = CATEGORY_TREE,
  catalogCategories = [],
  valueLeafId = "",
  onLeafChange,
  variant = "compact",
  idPrefix = "catalog-cascade",
}) {
  const resolvedTree = useMemo(
    () => injectFlangeChildrenFromPartCatalog(tree, catalogCategories),
    [tree, catalogCategories]
  );

  /** Selected id at each level (only leaves trigger onLeafChange). */
  const [pathIds, setPathIds] = useState([]);

  useEffect(() => {
    if (!valueLeafId) {
      setPathIds([]);
      return;
    }
    const path = findPathToLeaf(resolvedTree, valueLeafId);
    if (path?.length) setPathIds(path.map((n) => n.id));
    else setPathIds([]);
  }, [valueLeafId, resolvedTree]);

  const maxLevels = 10;

  function optionsAtLevel(levelIndex) {
    if (levelIndex === 0) return resolvedTree;
    const parentId = pathIds[levelIndex - 1];
    if (!parentId) return [];
    const parent = findNodeById(resolvedTree, parentId);
    return parent?.children ?? [];
  }

  function handleLevelChange(levelIndex, newId) {
    const nextPath = [...pathIds.slice(0, levelIndex), newId];
    setPathIds(nextPath);
    const node = findNodeById(resolvedTree, newId);
    if (!node) return;
    if (!node.children?.length) {
      onLeafChange?.(newId);
    }
  }

  const lastId = pathIds[pathIds.length - 1];
  const lastNode = lastId ? findNodeById(resolvedTree, lastId) : null;
  const hasMoreChildren = Boolean(lastNode?.children?.length);
  const depthToShow = Math.min(Math.max(1, pathIds.length + (hasMoreChildren ? 1 : 0)), maxLevels);

  return (
    <div className={variant === "compact" ? "flex flex-wrap items-center gap-1" : "flex flex-col gap-2"}>
      {Array.from({ length: depthToShow }, (_, levelIndex) => {
        const options = optionsAtLevel(levelIndex);
        const value = pathIds[levelIndex] ?? "";
        return (
          <select
            key={`${idPrefix}-lvl-${levelIndex}`}
            id={`${idPrefix}-lvl-${levelIndex}`}
            className={selectCls}
            value={value}
            onChange={(e) => handleLevelChange(levelIndex, e.target.value)}
            aria-label={levelIndex === 0 ? "Catalog" : `Subcategory ${levelIndex + 1}`}
          >
            <option value="">—</option>
            {options.map((n) => (
              <option key={n.id} value={n.id}>
                {n.label}
              </option>
            ))}
          </select>
        );
      })}
    </div>
  );
}
