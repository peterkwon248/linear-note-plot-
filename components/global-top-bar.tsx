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
import { usePathname } from "next/navigation"
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
import { routeGoBack, routeGoForward, setActiveRoute } from "@/lib/table-route"
import { UserAvatar } from "@/components/user-avatar"

export function GlobalTopBar() {
  const t = useT()
  const pathname = usePathname()

  const openNote = usePlotStore((s) => s.openNote)
  const notes = usePlotStore((s) => s.notes)
  const navigationHistory = usePlotStore((s) => s.navigationHistory)
  const navigationIndex = usePlotStore((s) => s.navigationIndex)
  const globalSearchQuery = usePlotStore((s) => s.globalSearchQuery)
  const setGlobalSearchQuery = usePlotStore((s) => s.setGlobalSearchQuery)
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

      {/* ── Center: real search input (Linear/Notion pattern).
       *  Path A (2026-05-25): Replaces the previous button trigger with a
       *  real <input>. Focus → auto-navigate to /search (so SearchView mounts
       *  to consume globalSearchQuery via store). Typing updates the store
       *  in real time — SearchView reads it as the source of truth, removing
       *  the redundant in-page input. Esc clears and blurs. The id
       *  "global-search-input" lets use-global-shortcuts focus this input
       *  when ⌘K fires. */}
      <div className="mx-4 flex flex-1 justify-center">
        <div className="relative flex w-full max-w-xl items-center">
          <MagnifyingGlass
            size={14}
            strokeWidth={2}
            className="pointer-events-none absolute left-3 shrink-0 text-muted-foreground/70"
          />
          <input
            id="global-search-input"
            type="text"
            value={globalSearchQuery}
            onChange={(e) => setGlobalSearchQuery(e.target.value)}
            onFocus={() => {
              if (pathname !== "/search") {
                setActiveRoute("/search")
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setGlobalSearchQuery("")
                e.currentTarget.blur()
              }
            }}
            placeholder={t("topbar.search.placeholder")}
            aria-label={t("common.search")}
            className="w-full rounded-md border border-border-subtle bg-secondary/50 py-2 pl-9 pr-12 text-note text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 hover:border-border hover:bg-secondary/70 focus:border-border focus:bg-secondary/70"
          />
          <span className="pointer-events-none absolute right-3 shrink-0 rounded border border-border-subtle bg-background/60 px-1.5 py-px text-[10px] font-medium tabular-nums text-muted-foreground/70">
            ⌘K
          </span>
        </div>
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
