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
  IconCalendar,
  IconSun,
  IconMoon,
} from "@/components/plot-icons"
import { Sidebar } from "@/components/icons/imperial"
import { WikiBook, OntologyWide, Bookshelf } from "@/components/icons/imperial-extras"
import { useSettingsStore } from "@/lib/settings-store"
import { SPACE_COLORS } from "@/lib/colors"

/* ── Space definitions ──────────────────────────────── */

const SPACES: {
  id: ActivitySpace
  label: string
  icon: (props: { size?: number }) => React.ReactNode
  shortcut: string
}[] = [
  { id: "home",     label: "Home",     icon: IconHome,     shortcut: "G then H" },
  { id: "notes",    label: "Notes",    icon: IconNotes,    shortcut: "G then N" },
  { id: "wiki",     label: "Wiki",     icon: WikiBook,       shortcut: "" },
  { id: "calendar", label: "Calendar", icon: IconCalendar,  shortcut: "" },
  { id: "ontology", label: "Ontology", icon: OntologyWide,  shortcut: "" },
  { id: "library",  label: "Library",  icon: Bookshelf,     shortcut: "" },
]

/* ── Component ──────────────────────────────────────── */

export function ActivityBar() {
  const router = useRouter()
  const activeSpace = useActiveSpace()

  const sidebarCollapsed = usePlotStore((s) => s.sidebarCollapsed)
  const setSidebarCollapsed = usePlotStore((s) => s.setSidebarCollapsed)

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

  return (
    <aside
      className="a-actbar h-full shrink-0"
      style={{ width: "var(--a-actbar-w, 72px)" }}
    >
      {/* Brand mark — gradient "P" logo */}
      <div className="a-actbar__head">
        <div className="a-brand__mark">P</div>
      </div>

      {/* Sidebar open button — only when collapsed (Plot 패턴 보존) */}
      {sidebarCollapsed && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="a-ab"
              aria-label="Open sidebar"
            >
              <Sidebar size={20} />
              <span className="a-ab__label">Sidebar</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-2xs">Open sidebar</TooltipContent>
        </Tooltip>
      )}

      {/* Tier 1 — primary spaces */}
      {SPACES.map(({ id, label, icon: Icon, shortcut }) => {
        const isActive = activeSpace === id
        const spaceColor = id in SPACE_COLORS ? SPACE_COLORS[id as keyof typeof SPACE_COLORS] : null
        // Plot preserves per-space colors (SPACE_COLORS lib/colors.ts) — v3
        // mockup uses single --space-notes for all active states; we override
        // via inline style to keep 6 distinct space colors.
        const activeStyle = isActive && spaceColor
          ? {
              background: `color-mix(in srgb, ${spaceColor} 16%, transparent)`,
              color: spaceColor,
              boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${spaceColor} 24%, transparent)`,
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

      {/* Spacer — pushes theme toggle to bottom */}
      <div className="flex-1" />

      {/* Tier 2 — theme toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={toggleTheme}
            className="a-ab"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <IconSun size={20} /> : <IconMoon size={20} />}
            <span className="a-ab__label">{theme === "dark" ? "Light" : "Dark"}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="text-2xs">
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </TooltipContent>
      </Tooltip>
    </aside>
  )
}
