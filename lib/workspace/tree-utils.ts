import { nanoid } from "nanoid"
import type {
  WorkspaceNode,
  WorkspaceLeaf,
  WorkspaceBranch,
  PanelContent,
  SplitDirection,
  WorkspaceTab,
} from "./types"
import { isLeaf, isBranch } from "./types"

/* ── Create ────────────────────────────────────────────── */

export function createLeaf(
  content: PanelContent,
  tabs: WorkspaceTab[] = [],
  activeTabId: string | null = null,
): WorkspaceLeaf {
  return { kind: "leaf", id: nanoid(), content, tabs, activeTabId }
}

export function createBranch(
  direction: SplitDirection,
  children: [WorkspaceNode, WorkspaceNode],
  ratio = 0.5,
): WorkspaceBranch {
  return { kind: "branch", id: nanoid(), direction, children, ratio }
}

/* ── Find ──────────────────────────────────────────────── */

/** Find a node by ID anywhere in the tree */
export function findNode(root: WorkspaceNode, id: string): WorkspaceNode | null {
  if (root.id === id) return root
  if (isBranch(root)) {
    return findNode(root.children[0], id) ?? findNode(root.children[1], id)
  }
  return null
}

/** Find the parent branch of a node with the given ID */
export function findParent(
  root: WorkspaceNode,
  id: string,
): { parent: WorkspaceBranch; childIndex: 0 | 1 } | null {
  if (isBranch(root)) {
    for (const idx of [0, 1] as const) {
      if (root.children[idx].id === id) {
        return { parent: root, childIndex: idx }
      }
      const found = findParent(root.children[idx], id)
      if (found) return found
    }
  }
  return null
}

/* ── Transform (immutable) ─────────────────────────────── */

/** Replace a node by ID (returns new tree) */
export function replaceNode(
  root: WorkspaceNode,
  id: string,
  replacement: WorkspaceNode,
): WorkspaceNode {
  if (root.id === id) return replacement
  if (isBranch(root)) {
    return {
      ...root,
      children: [
        replaceNode(root.children[0], id, replacement),
        replaceNode(root.children[1], id, replacement),
      ] as [WorkspaceNode, WorkspaceNode],
    }
  }
  return root
}

/** Remove a leaf and collapse its parent branch.
 *  Returns null if the leaf was the root. */
export function removeLeaf(
  root: WorkspaceNode,
  leafId: string,
): WorkspaceNode | null {
  // If root IS the leaf, return null (can't remove root)
  if (root.id === leafId) return null

  if (isBranch(root)) {
    // Direct child?
    if (root.children[0].id === leafId) return root.children[1]
    if (root.children[1].id === leafId) return root.children[0]

    // Recurse
    const newChildren = root.children.map((child) => {
      if (isBranch(child)) {
        const result = removeLeaf(child, leafId)
        return result ?? child
      }
      return child
    }) as [WorkspaceNode, WorkspaceNode]

    // Check if anything changed
    if (newChildren[0] !== root.children[0] || newChildren[1] !== root.children[1]) {
      return { ...root, children: newChildren }
    }
  }
  return root
}

const MAX_DEPTH = 4

/** Split a leaf: replace it with a branch containing the original + a new leaf.
 *  Respects MAX_DEPTH cap — if tree is already at max depth, returns unchanged. */
export function splitLeaf(
  root: WorkspaceNode,
  leafId: string,
  direction: SplitDirection,
  newContent: PanelContent,
  position: "before" | "after" = "after",
): WorkspaceNode {
  // Prevent exceeding max nesting depth
  if (treeDepth(root) >= MAX_DEPTH) return root

  const newLeaf = createLeaf(newContent)
  const originalNode = findNode(root, leafId)
  if (!originalNode) return root

  const children: [WorkspaceNode, WorkspaceNode] =
    position === "before"
      ? [newLeaf, originalNode]
      : [originalNode, newLeaf]

  const branch = createBranch(direction, children, 0.5)
  return replaceNode(root, leafId, branch)
}

/* ── Query ─────────────────────────────────────────────── */

/** Get all leaves as flat array (DFS, left-to-right) */
export function getAllLeaves(root: WorkspaceNode): WorkspaceLeaf[] {
  if (isLeaf(root)) return [root]
  return [
    ...getAllLeaves(root.children[0]),
    ...getAllLeaves(root.children[1]),
  ]
}

/** Count all leaves */
export function countLeaves(root: WorkspaceNode): number {
  if (isLeaf(root)) return 1
  return countLeaves(root.children[0]) + countLeaves(root.children[1])
}

/** Get max tree depth */
export function treeDepth(root: WorkspaceNode): number {
  if (isLeaf(root)) return 0
  return 1 + Math.max(treeDepth(root.children[0]), treeDepth(root.children[1]))
}

/** Find the first leaf with content type "editor" */
export function findFirstEditorLeaf(root: WorkspaceNode): WorkspaceLeaf | null {
  if (isLeaf(root)) {
    return root.content.type === "editor" ? root : null
  }
  return findFirstEditorLeaf(root.children[0]) ?? findFirstEditorLeaf(root.children[1])
}

/** Find leaf by content type */
export function findLeafByContentType(
  root: WorkspaceNode,
  type: PanelContent["type"],
): WorkspaceLeaf | null {
  if (isLeaf(root)) {
    return root.content.type === type ? root : null
  }
  return findLeafByContentType(root.children[0], type) ?? findLeafByContentType(root.children[1], type)
}

/* ── Update leaf (immutable) ───────────────────────────── */

/** Update a leaf's content */
export function updateLeafContent(
  root: WorkspaceNode,
  leafId: string,
  content: PanelContent,
): WorkspaceNode {
  if (isLeaf(root)) {
    if (root.id === leafId) return { ...root, content }
    return root
  }
  return {
    ...root,
    children: [
      updateLeafContent(root.children[0], leafId, content),
      updateLeafContent(root.children[1], leafId, content),
    ] as [WorkspaceNode, WorkspaceNode],
  }
}

/** Update a leaf's tabs */
export function updateLeafTabs(
  root: WorkspaceNode,
  leafId: string,
  tabs: WorkspaceTab[],
  activeTabId: string | null,
): WorkspaceNode {
  if (isLeaf(root)) {
    if (root.id === leafId) return { ...root, tabs, activeTabId }
    return root
  }
  return {
    ...root,
    children: [
      updateLeafTabs(root.children[0], leafId, tabs, activeTabId),
      updateLeafTabs(root.children[1], leafId, tabs, activeTabId),
    ] as [WorkspaceNode, WorkspaceNode],
  }
}

/** Update a branch's ratio */
export function updateBranchRatio(
  root: WorkspaceNode,
  branchId: string,
  ratio: number,
): WorkspaceNode {
  if (isBranch(root)) {
    if (root.id === branchId) {
      return { ...root, ratio: Math.max(0.15, Math.min(0.85, ratio)) }
    }
    return {
      ...root,
      children: [
        updateBranchRatio(root.children[0], branchId, ratio),
        updateBranchRatio(root.children[1], branchId, ratio),
      ] as [WorkspaceNode, WorkspaceNode],
    }
  }
  return root
}
