import { nanoid } from "nanoid"
import type {
  WorkspaceNode,
  WorkspaceLeaf,
  WorkspaceTab,
  PanelContent,
  SplitDirection,
  DropZone,
  WorkspacePreset,
} from "@/lib/workspace/types"
import { isLeaf } from "@/lib/workspace/types"
import {
  findNode,
  getAllLeaves,
  replaceNode,
  removeLeaf,
  splitLeaf as splitLeafUtil,
  updateLeafContent,
  updateLeafTabs,
  updateBranchRatio,
  findFirstEditorLeaf,
} from "@/lib/workspace/tree-utils"
import { buildPreset } from "@/lib/workspace/presets"

type Set = (fn: ((state: any) => any) | any) => void
type Get = () => any

export function createWorkspaceSlice(set: Set, get: Get) {
  const _defaultRoot = buildPreset("editor-only")
  const _defaultLeaf = findFirstEditorLeaf(_defaultRoot)

  return {
    // Default: single editor leaf
    workspaceRoot: _defaultRoot as WorkspaceNode,
    activeLeafId: (_defaultLeaf?.id ?? null) as string | null,

    /* ── Tree mutations ─────────────────────────────────── */

    setWorkspaceRoot: (root: WorkspaceNode) => {
      set({ workspaceRoot: root })
    },

    setActiveLeaf: (leafId: string) => {
      set((state: any) => {
        const node = findNode(state.workspaceRoot, leafId)
        if (!node || !isLeaf(node)) return state

        // If this is an editor leaf, sync selectedNoteId
        let selectedNoteId = state.selectedNoteId
        if (node.content.type === "editor" && node.activeTabId) {
          const tab = node.tabs.find((t: WorkspaceTab) => t.id === node.activeTabId)
          if (tab) selectedNoteId = tab.noteId
        }

        return { activeLeafId: leafId, selectedNoteId }
      })
    },

    setLeafContent: (leafId: string, content: PanelContent) => {
      set((state: any) => ({
        workspaceRoot: updateLeafContent(state.workspaceRoot, leafId, content),
      }))
    },

    splitLeaf: (
      leafId: string,
      direction: SplitDirection,
      content: PanelContent,
      position: "before" | "after" = "after",
    ) => {
      set((state: any) => ({
        workspaceRoot: splitLeafUtil(state.workspaceRoot, leafId, direction, content, position),
      }))
    },

    closeLeaf: (leafId: string) => {
      set((state: any) => {
        const newRoot = removeLeaf(state.workspaceRoot, leafId)
        if (!newRoot) return state // Can't remove the only leaf

        // If closed leaf was active, activate first editor leaf or first leaf
        let activeLeafId = state.activeLeafId
        let selectedNoteId = state.selectedNoteId
        if (activeLeafId === leafId) {
          const editorLeaf = findFirstEditorLeaf(newRoot)
          const allLeaves = getAllLeaves(newRoot)
          const newActive = editorLeaf ?? allLeaves[0]
          activeLeafId = newActive?.id ?? null
          if (newActive && isLeaf(newActive) && newActive.content.type === "editor") {
            const tab = newActive.tabs.find((t: WorkspaceTab) => t.id === newActive.activeTabId)
            selectedNoteId = tab?.noteId ?? null
          }
        }

        return { workspaceRoot: newRoot, activeLeafId, selectedNoteId }
      })
    },

    setBranchRatio: (branchId: string, ratio: number) => {
      set((state: any) => ({
        workspaceRoot: updateBranchRatio(state.workspaceRoot, branchId, ratio),
      }))
    },

    /* ── Editor tab management (for editor leaves) ─────── */

    openNoteInLeaf: (noteId: string, leafId?: string) => {
      set((state: any) => {
        const targetId = leafId ?? state.activeLeafId
        if (!targetId) return state

        const node = findNode(state.workspaceRoot, targetId)
        if (!node || !isLeaf(node)) return state

        // If leaf is not an editor, convert it
        if (node.content.type !== "editor") {
          const newTab: WorkspaceTab = { id: nanoid(), noteId }
          const newRoot = replaceNode(state.workspaceRoot, targetId, {
            ...node,
            content: { type: "editor", noteId },
            tabs: [newTab],
            activeTabId: newTab.id,
          })
          return { workspaceRoot: newRoot, selectedNoteId: noteId }
        }

        // Already an editor — check if note is open
        const existingTab = node.tabs.find((t: WorkspaceTab) => t.noteId === noteId)
        if (existingTab) {
          const newRoot = updateLeafTabs(state.workspaceRoot, targetId, node.tabs, existingTab.id)
          return { workspaceRoot: newRoot, selectedNoteId: noteId }
        }

        // Create new tab after active tab
        const newTab: WorkspaceTab = { id: nanoid(), noteId }
        const tabs = [...node.tabs]
        const activeIdx = tabs.findIndex((t: WorkspaceTab) => t.id === node.activeTabId)
        if (activeIdx >= 0) {
          tabs.splice(activeIdx + 1, 0, newTab)
        } else {
          tabs.push(newTab)
        }

        const newRoot = updateLeafTabs(state.workspaceRoot, targetId, tabs, newTab.id)
        return { workspaceRoot: newRoot, selectedNoteId: noteId }
      })
    },

    closeTabInLeaf: (tabId: string, leafId: string) => {
      set((state: any) => {
        const node = findNode(state.workspaceRoot, leafId)
        if (!node || !isLeaf(node) || node.content.type !== "editor") return state

        const tab = node.tabs.find((t: WorkspaceTab) => t.id === tabId)
        if (!tab || tab.isPinned) return state

        const idx = node.tabs.indexOf(tab)
        const newTabs = node.tabs.filter((t: WorkspaceTab) => t.id !== tabId)

        let newActiveTabId = node.activeTabId
        let selectedNoteId = state.selectedNoteId

        if (node.activeTabId === tabId) {
          if (newTabs.length === 0) {
            newActiveTabId = null
            if (state.activeLeafId === leafId) selectedNoteId = null
          } else {
            const newIdx = Math.min(idx, newTabs.length - 1)
            newActiveTabId = newTabs[newIdx].id
            if (state.activeLeafId === leafId) {
              selectedNoteId = newTabs[newIdx].noteId
            }
          }
        }

        const newRoot = updateLeafTabs(state.workspaceRoot, leafId, newTabs, newActiveTabId)
        return { workspaceRoot: newRoot, selectedNoteId }
      })
    },

    setActiveTabInLeaf: (tabId: string, leafId: string) => {
      set((state: any) => {
        const node = findNode(state.workspaceRoot, leafId)
        if (!node || !isLeaf(node)) return state

        const tab = node.tabs.find((t: WorkspaceTab) => t.id === tabId)
        const newRoot = updateLeafTabs(state.workspaceRoot, leafId, node.tabs, tabId)

        const selectedNoteId = (state.activeLeafId === leafId && tab)
          ? tab.noteId
          : state.selectedNoteId

        return { workspaceRoot: newRoot, selectedNoteId }
      })
    },

    moveTabToLeaf: (tabId: string, fromLeafId: string, toLeafId: string) => {
      set((state: any) => {
        const from = findNode(state.workspaceRoot, fromLeafId)
        const to = findNode(state.workspaceRoot, toLeafId)
        if (!from || !to || !isLeaf(from) || !isLeaf(to)) return state

        const tab = from.tabs.find((t: WorkspaceTab) => t.id === tabId)
        if (!tab) return state

        // Remove from source
        const fromTabs = from.tabs.filter((t: WorkspaceTab) => t.id !== tabId)
        let fromActiveTabId = from.activeTabId
        if (fromActiveTabId === tabId) {
          fromActiveTabId = fromTabs[0]?.id ?? null
        }

        // Add to target (or activate if same note exists)
        let toTabs = [...to.tabs]
        let toActiveTabId: string
        const existing = toTabs.find((t: WorkspaceTab) => t.noteId === tab.noteId)
        if (existing) {
          toActiveTabId = existing.id
        } else {
          toTabs.push(tab)
          toActiveTabId = tab.id
        }

        let root = updateLeafTabs(state.workspaceRoot, fromLeafId, fromTabs, fromActiveTabId)
        root = updateLeafTabs(root, toLeafId, toTabs, toActiveTabId)

        return { workspaceRoot: root, selectedNoteId: tab.noteId }
      })
    },

    /* ── Drag move ──────────────────────────────────────── */

    moveLeaf: (leafId: string, targetLeafId: string, zone: DropZone) => {
      set((state: any) => {
        if (leafId === targetLeafId) return state

        const sourceNode = findNode(state.workspaceRoot, leafId)
        if (!sourceNode || !isLeaf(sourceNode)) return state

        if (zone === "center") {
          // Swap contents
          const targetNode = findNode(state.workspaceRoot, targetLeafId)
          if (!targetNode || !isLeaf(targetNode)) return state

          let root = replaceNode(state.workspaceRoot, leafId, {
            ...sourceNode,
            content: targetNode.content,
            tabs: targetNode.tabs,
            activeTabId: targetNode.activeTabId,
          })
          root = replaceNode(root, targetLeafId, {
            ...targetNode,
            content: sourceNode.content,
            tabs: sourceNode.tabs,
            activeTabId: sourceNode.activeTabId,
          })
          return { workspaceRoot: root }
        }

        // Edge drop: remove source, split target
        const direction: SplitDirection = (zone === "left" || zone === "right") ? "horizontal" : "vertical"
        const position = (zone === "left" || zone === "top") ? "before" : "after"

        // Remove source leaf first
        let root = removeLeaf(state.workspaceRoot, leafId)
        if (!root) return state

        // Split target with source's content
        root = splitLeafUtil(root, targetLeafId, direction, sourceNode.content, position)

        // Copy tabs if editor
        if (sourceNode.content.type === "editor" && sourceNode.tabs.length > 0) {
          const allLeaves = getAllLeaves(root)
          // Find the newly created leaf (it won't have tabs yet)
          const newLeaf = allLeaves.find((l) =>
            l.content.type === "editor" && l.tabs.length === 0 && l.id !== targetLeafId
          )
          if (newLeaf) {
            root = updateLeafTabs(root, newLeaf.id, sourceNode.tabs, sourceNode.activeTabId)
          }
        }

        return { workspaceRoot: root }
      })
    },

    /* ── Presets ─────────────────────────────────────────── */

    applyPreset: (preset: WorkspacePreset) => {
      set((state: any) => {
        const newRoot = buildPreset(preset)

        // Try to preserve the current note in the first editor leaf
        const currentNoteId = state.selectedNoteId
        if (currentNoteId) {
          const editorLeaf = findFirstEditorLeaf(newRoot)
          if (editorLeaf) {
            const tab: WorkspaceTab = { id: nanoid(), noteId: currentNoteId }
            const updated = updateLeafTabs(newRoot, editorLeaf.id, [tab], tab.id)
            const firstLeaf = findFirstEditorLeaf(updated)

            // Handle focus preset: collapse sidebar
            if (preset === "focus") {
              return {
                workspaceRoot: updated,
                activeLeafId: firstLeaf?.id ?? null,
                sidebarCollapsed: true,
              }
            }

            return {
              workspaceRoot: updated,
              activeLeafId: firstLeaf?.id ?? null,
            }
          }
        }

        const leaves = getAllLeaves(newRoot)
        const activeLeaf = findFirstEditorLeaf(newRoot) ?? leaves[0]

        if (preset === "focus") {
          return {
            workspaceRoot: newRoot,
            activeLeafId: activeLeaf?.id ?? null,
            sidebarCollapsed: true,
          }
        }

        return {
          workspaceRoot: newRoot,
          activeLeafId: activeLeaf?.id ?? null,
        }
      })
    },
  }
}
