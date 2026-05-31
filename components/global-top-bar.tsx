"use client"

/**
 * GlobalTopBar — workspace-wide chrome that stays visible regardless of which
 * panels (activity bar / sidebar / detail) are collapsed. Houses the controls
 * that used to live inside `linear-sidebar.tsx` (recently viewed clock, back/
 * forward, search).
 *
 * Reference: 2026-05-24 brainstorm (single header + workspace identity).
 * Plot has no multi-workspace concept yet, so the workspace badge + back/
 * forward cluster sits on the left and search lives in the middle. Width spans
 * the full viewport so it survives every panel-toggle state.
 *
 * Shell pass B (2026-05-30): theme · settings · trash were folded out of the
 * right cluster into the workspace menu (UserAvatar 'P' badge dropdown), so
 * the right side is now empty — those shortcuts (plus keyboard shortcuts) are
 * still reachable in every panel-toggle state via the badge.
 */

import { useEffect, useMemo, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import {
  ChevronLeft as CaretLeft,
  ChevronRight as CaretRight,
  Clock as IconClock,
  Search as MagnifyingGlass,
  FileText as IconDoc,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"
import { usePlotStore } from "@/lib/store"
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
  const activitybarCollapsed = usePlotStore((s) => s.activitybarCollapsed)
  const setActivitybarCollapsed = usePlotStore((s) => s.setActivitybarCollapsed)

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
     * Group D (refine): visual dividers split the bar into clusters
     * (identity | nav+clock | search | right tools). */
    <header className="flex h-12 shrink-0 items-center gap-1.5 border-b border-border bg-background px-4">
      {/* ── Left cluster: workspace identity → navigation ──
       *  Avatar = workspace identity anchor (visual only, no dropdown).
       *  §10 Phase 3: the central PanelsMenu hamburger was removed — panel
       *  toggles now live on the panels themselves (activity bar + sidebar
       *  hover-reveal collapse/expand; detail at the content top-right). */}
      <UserAvatar />

      <div className="mx-2 h-5 w-px shrink-0 bg-border" aria-hidden="true" />

      {/* §10 Phase 3 — Activity bar toggle. Moved here from the activity bar
          itself (a narrow icon rail has no good in-panel home for it); sits left
          of the recently-viewed clock, where the old PanelsMenu hamburger was.
          Directional icon shows the action; ⌘⇧A toggles too. */}
      <button
        onClick={() => setActivitybarCollapsed(!activitybarCollapsed)}
        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
        aria-label={activitybarCollapsed ? "Show activity bar" : "Hide activity bar"}
        title={`${activitybarCollapsed ? "Show" : "Hide"} activity bar  ⌘⇧A`}
      >
        {activitybarCollapsed ? (
          <PanelLeftOpen size={14} strokeWidth={2.25} />
        ) : (
          <PanelLeftClose size={14} strokeWidth={2.25} />
        )}
      </button>

      {/* Recently viewed (history clock) */}
      <div className="relative" ref={recentlyViewedRef}>
        <button
          onClick={() => setRecentlyViewedOpen(!recentlyViewedOpen)}
          className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
            recentlyViewedOpen
              ? "bg-hover-bg text-foreground"
              : "text-muted-foreground hover:bg-hover-bg hover:text-foreground"
          }`}
          aria-label={t("topbar.recently_viewed.aria")}
          title={t("topbar.recently_viewed.aria")}
        >
          <IconClock size={14} strokeWidth={2.25} />
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
        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
        title={t("topbar.nav.back")}
        aria-label={t("topbar.nav.back")}
      >
        <CaretLeft size={14} strokeWidth={2.25} />
      </button>
      <button
        onClick={handleGoForward}
        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
        title={t("topbar.nav.forward")}
        aria-label={t("topbar.nav.forward")}
      >
        <CaretRight size={14} strokeWidth={2.25} />
      </button>

      {/* ── Center: real search input = quick global search (Linear/Notion).
       *  Linear 3-way 정리 (2026-05-30): 이 input은 "빠른 전역 검색" 진입점
       *  (Linear의 `/` · 검색 버튼 역할). Focus → /search 자동 이동(SearchView가
       *  globalSearchQuery store를 소비). 타이핑은 store를 실시간 갱신 — SearchView가
       *  단일 진실로 읽음. Esc clears + blur. ⌘K는 더 이상 이 input을 포커스하지
       *  않고 command palette(SearchDialog)를 연다 — 역할 분리. 단축키 힌트도
       *  ⌘K → `/`로 교체. */}
      <div className="mx-4 flex flex-1 justify-center">
        <div className="relative flex w-full max-w-xl items-center">
          <MagnifyingGlass
            size={14}
            strokeWidth={2.25}
            className="pointer-events-none absolute left-3 shrink-0 text-muted-foreground"
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
            /
          </span>
        </div>
      </div>

      {/* ── Right cluster folded into the workspace menu (UserAvatar, left).
       *  Shell pass B (2026-05-30): theme · settings · trash moved out of the
       *  top bar into the 'P' badge dropdown (Linear workspace-menu pattern),
       *  so the right side stays empty and the search input can breathe. */}
    </header>
  )
}
