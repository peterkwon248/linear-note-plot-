"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { usePlotStore } from "@/lib/store"
import { isEditableTarget } from "@/lib/keyboard-utils"

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

  // preFocusLayout ref removed — now using store._preFocusLayoutMode

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const mod = e.metaKey || e.ctrlKey

      // ── Editor Tab Shortcuts ──────────────────────────────
      // Cmd+W — close current tab
      if (mod && e.key === "w") {
        e.preventDefault()
        const s = usePlotStore.getState()
        const es = s.editorState
        if (!es) return
        const panel = es.panels.find((p: any) => p.id === es.activePanelId)
        if (panel?.activeTabId) {
          s.closeTab(panel.activeTabId, panel.id)
        }
        return
      }

      // Cmd+Alt+Left/Right — switch tabs
      if (mod && e.altKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        e.preventDefault()
        const s = usePlotStore.getState()
        const es = s.editorState
        if (!es) return
        const panel = es.panels.find((p: any) => p.id === es.activePanelId)
        if (!panel || panel.tabs.length < 2) return
        const currentIdx = panel.tabs.findIndex((t: any) => t.id === panel.activeTabId)
        if (currentIdx === -1) return
        const nextIdx = e.key === "ArrowLeft"
          ? (currentIdx - 1 + panel.tabs.length) % panel.tabs.length
          : (currentIdx + 1) % panel.tabs.length
        s.setActiveTab(panel.tabs[nextIdx].id, panel.id)
        return
      }

      // Cmd+\ — toggle split
      if (mod && e.key === "\\") {
        e.preventDefault()
        const s = usePlotStore.getState()
        if (s.selectedNoteId !== null) {
          s.toggleSplit()
        }
        return
      }

      // ── 1. Esc ─────────────────────────────────────────────
      // Two-stage dismissal:
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
        if (s.selectedNoteId !== null && s.detailsOpen) {
          s.setDetailsOpen(false)
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
        const s = usePlotStore.getState()
        s.setSearchOpen(!s.searchOpen)
        return
      }

      // ── 2b. Ctrl/Cmd+Shift+F — toggle Focus Mode ────────────
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
        if (s.selectedNoteId === null) return

        if (s.layoutMode === "focus") {
          // Exit focus → restore previous mode
          s.setLayoutMode(s._preFocusLayoutMode ?? "tabs")
        } else {
          s.setLayoutMode("focus")
        }
        return
      }

      // ── 2c. Ctrl/Cmd+1~5 — Layout Mode Shortcuts ────────────
      if (mod && !e.shiftKey && !e.altKey && ["1", "2", "3", "4", "5"].includes(e.key)) {
        const s = usePlotStore.getState()
        if (s.selectedNoteId === null) return
        e.preventDefault()
        const modes = ["focus", "three-column", "tabs", "panels", "split"] as const
        s.setLayoutMode(modes[parseInt(e.key) - 1])
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

      // ── 5. / — open search ─────────────────────────────────
      if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        usePlotStore.getState().setSearchOpen(true)
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
