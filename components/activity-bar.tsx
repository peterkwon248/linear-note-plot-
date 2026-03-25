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
  IconInbox,
  IconNotes,
  IconWiki,
  IconCalendar,
  IconSun,
  IconMoon,
} from "@/components/plot-icons"
import { Graph } from "@phosphor-icons/react/dist/ssr/Graph"
import { SidebarSimple } from "@phosphor-icons/react/dist/ssr/SidebarSimple"
import { useSettingsStore } from "@/lib/settings-store"

/* ── Space definitions ──────────────────────────────── */

const SPACES: {
  id: ActivitySpace
  label: string
  icon: (props: { size?: number }) => React.ReactNode
  shortcut: string
}[] = [
  { id: "inbox",    label: "Inbox",    icon: IconInbox,    shortcut: "G then I" },
  { id: "notes",    label: "Notes",    icon: IconNotes,    shortcut: "G then N" },
  { id: "wiki",     label: "Wiki",     icon: IconWiki,     shortcut: "" },
  { id: "calendar", label: "Calendar", icon: IconCalendar, shortcut: "" },
  { id: "ontology", label: "Graph",    icon: Graph,        shortcut: "" },
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
    <div className="flex h-full w-12 shrink-0 flex-col items-center border-r border-border bg-background pt-3">
      {/* Sidebar open button — only when collapsed */}
      {sidebarCollapsed && (
        <div className="flex flex-col items-center mb-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
                aria-label="Open sidebar"
              >
                <SidebarSimple size={18} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-[11px]">Open sidebar</TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Tier 1 — primary spaces */}
      <div className="flex flex-col items-center gap-1">
        {SPACES.map(({ id, label, icon: Icon, shortcut }) => {
          const isActive = activeSpace === id
          return (
            <Tooltip key={id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleSpaceClick(id)}
                  className={cn(
                    "relative flex h-8 w-8 items-center justify-center rounded-md transition-all duration-150",
                    isActive
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  )}
                  aria-label={label}
                >
                  <Icon size={18} />
                  {isActive && (
                    <div className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-foreground" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-[11px]">
                {label}
                {shortcut && (
                  <span className="ml-2 text-muted-foreground">{shortcut}</span>
                )}
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>

      {/* Spacer — pushes settings to bottom */}
      <div className="flex-1" />

      {/* Tier 2 — theme toggle */}
      <div className="pb-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={toggleTheme}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <IconSun size={18} /> : <IconMoon size={18} />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-[11px]">
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
