/**
 * Walk the Pipedata category tree (from lib/pipedata-category-tree.js + inject).
 */

/**
 * @param {object[]} tree
 * @param {string} leafId
 * @returns {object[] | null} path of nodes from root to leaf (inclusive)
 */
export function findPathToLeaf(tree, leafId) {
  function walk(nodes, acc) {
    for (const node of nodes) {
      if (node.id === leafId) return [...acc, node];
      if (node.children?.length) {
        const found = walk(node.children, [...acc, node]);
        if (found) return found;
      }
    }
    return null;
  }
  return walk(tree, []);
}

/**
 * @param {object[]} tree
 * @param {string} nodeId
 * @returns {object | null}
 */
export function findNodeById(tree, nodeId) {
  for (const node of tree) {
    if (node.id === nodeId) return node;
    if (node.children?.length) {
      const found = findNodeById(node.children, nodeId);
      if (found) return found;
    }
  }
  return null;
}
