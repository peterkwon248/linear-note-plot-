"use client"

/**
 * GlobalTopBar — workspace-wide chrome that stays visible regardless of which
 * panels (activity bar / sidebar / detail) are collapsed. Houses the controls
 * that used to live inside `linear-sidebar.tsx` (recently viewed clock, back/
 * forward, search) and `activity-bar.tsx` (theme toggle), plus the footer
 * shortcuts (settings, trash) so the user can reach them even with "Hide all
 * panels" mode active.
 *
 * Reference: 2026-05-24 brainstorm (single header + workspace identity).
 * Plot has no multi-workspace concept yet, so the brand mark and back/forward
 * cluster sits on the left, search lives in the middle, and chrome shortcuts
 * sit on the right. Width spans the full viewport so it survives every
 * panel-toggle state.
 */

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
  ChevronLeft as CaretLeft,
  ChevronRight as CaretRight,
  Clock as IconClock,
  Search as MagnifyingGlass,
  Moon as IconMoon,
  Sun as IconSun,
  FileText as IconDoc,
} from "lucide-react"
import { usePlotStore } from "@/lib/store"
import { useSettingsStore } from "@/lib/settings-store"
import { useT } from "@/lib/i18n"
import { routeGoBack, routeGoForward } from "@/lib/table-route"
import { UserAvatar } from "@/components/user-avatar"

export function GlobalTopBar() {
  const t = useT()

  const openNote = usePlotStore((s) => s.openNote)
  const notes = usePlotStore((s) => s.notes)
  const navigationHistory = usePlotStore((s) => s.navigationHistory)
  const navigationIndex = usePlotStore((s) => s.navigationIndex)
  const setSearchOpen = usePlotStore((s) => s.setSearchOpen)

  const theme = useSettingsStore((s) => s.theme)
  const setTheme = useSettingsStore((s) => s.setTheme)
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark")

  const [recentlyViewedOpen, setRecentlyViewedOpen] = useState(false)
  const recentlyViewedRef = useRef<HTMLDivElement>(null)

  // Close recently viewed on outside click — same pattern as linear-sidebar.
  useEffect(() => {
    if (!recentlyViewedOpen) return
    const handler = (e: MouseEvent) => {
      if (recentlyViewedRef.current && !recentlyViewedRef.current.contains(e.target as Node)) {
        setRecentlyViewedOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [recentlyViewedOpen])

  // Recently viewed = walk navigationHistory backwards, dedup, take 10.
  const recentlyViewed = useMemo(() => {
    const seen = new Set<string>()
    const result: { id: string; title: string }[] = []
    for (let i = navigationIndex; i >= 0 && result.length < 10; i--) {
      const noteId = navigationHistory[i]
      if (!seen.has(noteId)) {
        seen.add(noteId)
        const note = notes.find((n) => n.id === noteId && !n.trashed)
        if (note) result.push({ id: note.id, title: note.title || t("common.untitled") })
      }
    }
    return result
  }, [navigationHistory, navigationIndex, notes, t])

  const handleGoBack = () => {
    const s = usePlotStore.getState()
    if (s.selectedNoteId) s.setSelectedNoteId(null)
    routeGoBack()
  }
  const handleGoForward = () => {
    const s = usePlotStore.getState()
    if (s.selectedNoteId) s.setSelectedNoteId(null)
    routeGoForward()
  }

  return (
    /* Group A (refine): h-11 → h-12, gap-1 → gap-1.5, px-3 → px-4 — Linear-grade air room.
     * Group D (refine): visual dividers split the bar into three clusters
     * (PanelsMenu | nav+clock | search | right tools). */
    <header className="flex h-12 shrink-0 items-center gap-1.5 border-b border-border bg-background px-4">
      {/* ── Left cluster: workspace identity → navigation ────────────────
       *  Avatar = workspace anchor + chrome single entry point (chunk 3).
       *  Click avatar → dropdown with panel toggles + settings + trash.
       *  Divider | separates identity from navigation (clock/back/forward). */}
      <UserAvatar />

      <div className="mx-2 h-5 w-px shrink-0 bg-border" aria-hidden="true" />

      {/* Recently viewed (history clock) */}
      <div className="relative" ref={recentlyViewedRef}>
        <button
          onClick={() => setRecentlyViewedOpen(!recentlyViewedOpen)}
          className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
            recentlyViewedOpen
              ? "bg-hover-bg text-foreground"
              : "text-muted-foreground/70 hover:bg-hover-bg hover:text-foreground"
          }`}
          aria-label={t("topbar.recently_viewed.aria")}
          title={t("topbar.recently_viewed.aria")}
        >
          <IconClock size={14} strokeWidth={2} />
        </button>
        {recentlyViewedOpen && (
          <div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-lg border border-border bg-surface-overlay shadow-lg">
            <div className="border-b border-border px-3 py-2">
              <span className="text-2xs font-medium text-muted-foreground">
                {t("topbar.recently_viewed.title")}
              </span>
            </div>
            {recentlyViewed.length === 0 ? (
              <div className="px-3 py-4 text-center text-note text-muted-foreground">
                {t("topbar.recently_viewed.empty")}
              </div>
            ) : (
              <div className="max-h-[320px] overflow-y-auto py-1">
                {recentlyViewed.map((item) => (
                  <button
                    key={item.id}
                    onClick={(e) => {
                      openNote(item.id, { forceNewTab: e.ctrlKey || e.metaKey })
                      setRecentlyViewedOpen(false)
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-hover-bg"
                  >
                    <IconDoc size={14} className="shrink-0 text-muted-foreground" strokeWidth={2} />
                    <span className="truncate text-note text-foreground">{item.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Back / Forward */}
      <button
        onClick={handleGoBack}
        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/70 transition-colors hover:bg-hover-bg hover:text-foreground"
        title={t("topbar.nav.back")}
        aria-label={t("topbar.nav.back")}
      >
        <CaretLeft size={14} strokeWidth={2} />
      </button>
      <button
        onClick={handleGoForward}
        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/70 transition-colors hover:bg-hover-bg hover:text-foreground"
        title={t("topbar.nav.forward")}
        aria-label={t("topbar.nav.forward")}
      >
        <CaretRight size={14} strokeWidth={2} />
      </button>

      {/* ── Center: search input — Group C refine: max-w-xl, py-2, softer
       *  default border, stronger hover. Linear-grade prominence as the
       *  primary chrome action of the whole bar. */}
      <div className="mx-4 flex flex-1 justify-center">
        <button
          onClick={() => setSearchOpen(true)}
          className="group flex w-full max-w-xl items-center gap-2 rounded-md border border-border-subtle bg-secondary/50 px-3 py-2 text-note text-muted-foreground/70 transition-colors hover:border-border hover:bg-secondary/70 hover:text-foreground"
          aria-label={t("common.search")}
        >
          <MagnifyingGlass size={14} strokeWidth={2} className="shrink-0 opacity-70" />
          <span className="flex-1 text-left">{t("topbar.search.placeholder")}</span>
          <span className="shrink-0 rounded border border-border-subtle bg-background/60 px-1.5 py-px text-[10px] font-medium tabular-nums text-muted-foreground/70">
            ⌘K
          </span>
        </button>
      </div>

      {/* Group D refine: divider before the right cluster makes the
       *  three-region split (nav | search | tools) explicit. */}
      <div className="mx-2 h-5 w-px shrink-0 bg-border" aria-hidden="true" />

      {/* ── Right cluster: theme only ───────────────────────────────────
       *  Chunk 3 (2026-05-25): settings + trash moved into UserAvatar
       *  dropdown. Theme stays in the right cluster — frequent 1-click
       *  action where dropdown overhead is unwarranted. */}
      <button
        onClick={toggleTheme}
        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/70 transition-colors hover:bg-hover-bg hover:text-foreground"
        aria-label={theme === "dark" ? t("nav.theme.toggle_to_light") : t("nav.theme.toggle_to_dark")}
        title={theme === "dark" ? t("nav.theme.light_mode") : t("nav.theme.dark_mode")}
      >
        {theme === "dark" ? <IconSun size={14} strokeWidth={2} /> : <IconMoon size={14} strokeWidth={2} />}
      </button>
    </header>
  )
}
