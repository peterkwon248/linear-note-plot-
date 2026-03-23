"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { usePlotStore } from "@/lib/store"
import { isEditableTarget } from "@/lib/keyboard-utils"
import { popUndo, popRedo } from "@/lib/undo-manager"
import { setActiveRoute, routeGoBack } from "@/lib/table-route"

/**
 * Single global keydown listener that consolidates all app-wide keyboard
 * shortcuts.  Mounted once in `app/(app)/layout.tsx`.
 *
 * Processing order (intentional):
 *   1. Esc          — clear selection (always, even in editable)
 *   2. Ctrl/Cmd+K   — toggle command palette (always)
 *   3. ?            — toggle shortcut overlay (BEFORE isEditableTarget guard
 *                     so "?" can close the overlay when it is already open)
 *   4. ── isEditableTarget guard ── (block remaining keys when typing)
 *   5. /            — open search
 *   6. G-sequence   — navigation (G+I, G+C, G+M, G+N)
 *   7. C            — create new note
 */
export function useGlobalShortcuts() {
  const router = useRouter()
  const pendingG = useRef(false)
  const gTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const mod = e.metaKey || e.ctrlKey

      // ── Editor Tab Shortcuts ──────────────────────────────
      // Cmd+W — close current tab
      if (mod && e.key === "w") {
        e.preventDefault()
        const s = usePlotStore.getState()
        if (s.activeTabId) {
          s.closeEditorTab(s.activeTabId)
        }
        return
      }

      // Cmd+Alt+Left/Right — switch tabs
      if (mod && e.altKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        e.preventDefault()
        const s = usePlotStore.getState()
        const tabs = s.editorTabs
        if (tabs.length > 1 && s.activeTabId) {
          const currentIdx = tabs.findIndex((t: any) => t.id === s.activeTabId)
          if (currentIdx !== -1) {
            const nextIdx = e.key === "ArrowLeft"
              ? (currentIdx - 1 + tabs.length) % tabs.length
              : (currentIdx + 1) % tabs.length
            s.setActiveEditorTab(tabs[nextIdx].id)
          }
        }
        return
      }

      // ── 1. Esc ─────────────────────────────────────────────
      // Multi-stage dismissal:
      //   0th Esc: close side peek (return to context)
      //   1st Esc: close details panel (keep editor)
      //   2nd Esc: close editor (clear selection)
      if (e.key === "Escape") {
        if (
          target.closest("[role='dialog']") ||
          target.closest("[data-radix-popper-content-wrapper]")
        ) {
          return // let dialog handle it
        }
        const s = usePlotStore.getState()
        // 0th: close side peek first
        if (s.sidePanelMode === 'peek' && s.sidePanelPeekNoteId) {
          s.closeSidePeek()
          e.preventDefault()
          return
        }
        if (s.selectedNoteId !== null && s.sidePanelOpen) {
          s.setSidePanelOpen(false)
          return
        }
        if (s.selectedNoteId !== null) {
          s.setSelectedNoteId(null)
          return
        }
        return
      }

      // ── 2. Ctrl/Cmd+K ──────────────────────────────────────
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setActiveRoute("/search")
        router.push("/search")
        return
      }

      // ── 2a. Ctrl/Cmd+Z — global undo ──────────────────────────
      if (e.key === "z" && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        // Let editable targets handle their own undo
        if (isEditableTarget(target)) return
        e.preventDefault()
        const label = popUndo()
        if (label) {
          toast(`Undone: ${label}`)
        }
        return
      }

      // ── 2a-2. Ctrl/Cmd+Y or Ctrl/Cmd+Shift+Z — global redo ────────
      if (
        ((e.key === "y" || e.key === "Y") && (e.metaKey || e.ctrlKey)) ||
        (e.key === "z" && (e.metaKey || e.ctrlKey) && e.shiftKey)
      ) {
        if (isEditableTarget(target)) return
        e.preventDefault()
        const label = popRedo()
        if (label) {
          toast(`Redone: ${label}`)
        }
        return
      }

      // ── 2b. Ctrl/Cmd+Shift+F — toggle sidebar collapse ────────────
      if (
        (e.key === "f" || e.key === "F") &&
        e.shiftKey &&
        (e.metaKey || e.ctrlKey)
      ) {
        e.preventDefault()
        if (
          target.closest("[role='dialog']") ||
          target.closest("[data-radix-popper-content-wrapper]")
        ) {
          return
        }
        const s = usePlotStore.getState()
        s.setSidebarCollapsed(!s.sidebarCollapsed)
        return
      }

      // ── 2c. Cmd+B — toggle side panel ─────────────────────────
      if (mod && e.key === 'b' && !e.shiftKey) {
        if (target.closest('[contenteditable]') || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
          // let editor handle bold
        } else {
          usePlotStore.getState().toggleSidePanel()
          e.preventDefault()
          return
        }
      }

      // ── 2d. Cmd+\ — close secondary editor ────────────────────
      if (mod && e.key === '\\') {
        const s = usePlotStore.getState()
        if (s.secondaryNoteId) {
          s.closeSecondary()
        }
        e.preventDefault()
        return
      }

      // ── 3. ? — toggle shortcut overlay ─────────────────────
      // MUST run BEFORE isEditableTarget guard so that pressing
      // "?" while the overlay dialog is open can close it.
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        const s = usePlotStore.getState()
        if (s.shortcutOverlayOpen) {
          // Already open → close (regardless of target)
          e.preventDefault()
          s.setShortcutOverlayOpen(false)
          return
        }
        // Not open → apply guard then open
        if (!isEditableTarget(target)) {
          e.preventDefault()
          s.setShortcutOverlayOpen(true)
        }
        return
      }

      // ── Guard: skip remaining shortcuts inside editable ────
      if (isEditableTarget(target)) return

      // ── 4a. Backspace — navigate back ──────────────────────
      if (e.key === "Backspace" && !mod && !e.altKey && !e.shiftKey) {
        e.preventDefault()
        const s = usePlotStore.getState()
        if (s.selectedNoteId) {
          const handled = s.goBack()
          if (handled) return
        }
        routeGoBack()
        return
      }

      // ── 5. / — open search ─────────────────────────────────
      if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        setActiveRoute("/search")
        return
      }

      // ── 6. G-sequence navigation ───────────────────────────
      if ((e.key === "g" || e.key === "G") && !e.ctrlKey && !e.metaKey && !e.altKey) {
        pendingG.current = true
        if (gTimer.current) clearTimeout(gTimer.current)
        gTimer.current = setTimeout(() => {
          pendingG.current = false
        }, 500)
        return
      }

      if (pendingG.current) {
        pendingG.current = false
        if (gTimer.current) clearTimeout(gTimer.current)
        const k = e.key.toLowerCase()
        if (k === "i") { e.preventDefault(); router.push("/inbox"); return }
        if (k === "c") { e.preventDefault(); router.push("/capture"); return }
        if (k === "m") { e.preventDefault(); router.push("/permanent"); return }
        if (k === "n") { e.preventDefault(); router.push("/notes"); return }
        return
      }

      // ── 7. C — create new note ─────────────────────────────
      if ((e.key === "c" || e.key === "C") && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        usePlotStore.getState().createNote({})
        return
      }
    }

    window.addEventListener("keydown", handler)
    return () => {
      window.removeEventListener("keydown", handler)
      if (gTimer.current) clearTimeout(gTimer.current)
    }
  }, [router])
}
