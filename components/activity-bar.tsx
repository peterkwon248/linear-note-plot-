"use client"

import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  useActiveSpace,
  setActiveSpace,
  DEFAULT_ROUTES,
} from "@/lib/table-route"
import { usePlotStore } from "@/lib/store"
import type { ActivitySpace } from "@/lib/types"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  IconHome,
  IconNotes,
  IconWiki,
  IconOntology,
  IconCalendar,
  IconSun,
  IconMoon,
} from "@/components/plot-icons"
// Sidebar / CaretRight / PhX removed — PanelsMenu replaces actbar's own panel controls
// 2026-05-24: imperial-extras (WikiBook/OntologyWide/Bookshelf) replaced with
// lucide for activity-bar consistency. WikiBook → IconWiki (BookOpen),
// OntologyWide → IconOntology (Waypoints), Bookshelf → SPACE_ICONS.library.
import { SPACE_ICONS } from "@/lib/entity-icons"
import { useSettingsStore } from "@/lib/settings-store"
import { useT } from "@/lib/i18n"
import { SPACE_COLORS } from "@/lib/colors"

/* ── Space definitions ──────────────────────────────── */

const SPACES: {
  id: ActivitySpace
  labelKey: string
  icon: (props: { size?: number }) => React.ReactNode
  shortcut: string
}[] = [
  { id: "home",     labelKey: "nav.space.home",     icon: IconHome,     shortcut: "G then H" },
  { id: "notes",    labelKey: "nav.space.notes",    icon: IconNotes,    shortcut: "G then N" },
  { id: "wiki",     labelKey: "nav.space.wiki",     icon: IconWiki,     shortcut: "" },
  { id: "books",    labelKey: "nav.space.books",    icon: (p: { size?: number }) => <SPACE_ICONS.books size={p.size} />, shortcut: "" },
  { id: "calendar", labelKey: "nav.space.calendar", icon: IconCalendar, shortcut: "" },
  { id: "ontology", labelKey: "nav.space.ontology", icon: IconOntology, shortcut: "" },
  { id: "library",  labelKey: "nav.space.library",  icon: (p: { size?: number }) => <SPACE_ICONS.library size={p.size} />, shortcut: "" },
]

/* ── Component ──────────────────────────────────────── */

export function ActivityBar() {
  const t = useT()
  const router = useRouter()
  const activeSpace = useActiveSpace()

  const sidebarCollapsed = usePlotStore((s) => s.sidebarCollapsed)
  const setSidebarCollapsed = usePlotStore((s) => s.setSidebarCollapsed)
  const activitybarCollapsed = usePlotStore((s) => s.activitybarCollapsed)
  const setActivitybarCollapsed = usePlotStore((s) => s.setActivitybarCollapsed)

  const setSelectedNoteId = usePlotStore((s) => s.setSelectedNoteId)

  const handleSpaceClick = (space: ActivitySpace) => {
    // Always clear selected note so editor closes and list view appears
    setSelectedNoteId(null)

    if (space === activeSpace) {
      // Same space → do nothing (use dedicated sidebar toggle button)
      return
    }
    // Clear stale side panel context — a wiki article's Detail tab shouldn't
    // remain pinned when switching to Notes/Library/etc. The new space's
    // selection logic will repopulate context when the user clicks something.
    usePlotStore.getState().setSidePanelContext(null)
    // PR 7: Home no longer has section drill-downs; nothing to reset on space switch.
    // Different space → switch (don't touch sidebar state)
    setActiveSpace(space)
    router.push(DEFAULT_ROUTES[space])
  }

  const theme = useSettingsStore((s) => s.theme)
  const setTheme = useSettingsStore((s) => s.setTheme)

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  // Collapsed state: render nothing. Re-open via the GlobalTopBar activity-bar
  // toggle (left of the recently-viewed clock) or ⌘⇧A. (§10 Phase 3: the old
  // PanelsMenu hamburger was removed; its activity-bar toggle moved to the top bar.)
  if (activitybarCollapsed) {
    return null
  }

  return (
    <aside
      className="a-actbar h-full shrink-0"
      style={{ width: "var(--a-actbar-w, 72px)" }}
      data-actbar="open"
    >
      {/* Brand mark moved to GlobalTopBar as UserAvatar (chrome single source, #119).
       * Activity bar is now a pure space switcher — no chrome / no identity marker. */}

      {/* Tier 1 — primary spaces */}
      {SPACES.map(({ id, labelKey, icon: Icon, shortcut }) => {
        const label = t(labelKey)
        const isActive = activeSpace === id
        const spaceColor = id in SPACE_COLORS ? SPACE_COLORS[id as keyof typeof SPACE_COLORS] : null
        // Plot preserves per-space colors (SPACE_COLORS lib/colors.ts) — v3
        // mockup uses single --space-notes for all active states; we override
        // via inline style to keep 6 distinct space colors.
        // §10 레일 톤다운 — active 톤 14%/22% (목업 shell-linear-mirror 정합,
        // 기존 16%/24%에서 살짝 절제).
        const activeStyle = isActive && spaceColor
          ? {
              background: `color-mix(in srgb, ${spaceColor} 14%, transparent)`,
              color: spaceColor,
              boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${spaceColor} 22%, transparent)`,
            }
          : undefined
        return (
          <Tooltip key={id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleSpaceClick(id)}
                className="a-ab a-ab--space"
                data-active={isActive}
                style={activeStyle}
                aria-label={label}
              >
                <Icon size={20} />
                <span
                  className="a-ab__label"
                  style={isActive && spaceColor ? { color: spaceColor } : undefined}
                >
                  {label}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-2xs">
              {label}
              {shortcut && (
                <span className="ml-2 text-muted-foreground">{shortcut}</span>
              )}
            </TooltipContent>
          </Tooltip>
        )
      })}

      {/* Theme toggle moved to GlobalTopBar (right cluster). Activity bar is
       *  now a pure space switcher — no chrome controls. */}
    </aside>
  )
}
