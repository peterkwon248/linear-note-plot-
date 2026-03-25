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
      // Same space → toggle sidebar
      setSidebarCollapsed(!sidebarCollapsed)
      return
    }
    // Different space → switch + ensure sidebar open
    setActiveSpace(space)
    router.push(DEFAULT_ROUTES[space])
    setSidebarCollapsed(false)
  }

  const theme = useSettingsStore((s) => s.theme)
  const setTheme = useSettingsStore((s) => s.setTheme)

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <div className="flex h-full w-11 shrink-0 flex-col items-center border-r border-border bg-background pt-2">
      {/* Tier 1 — primary spaces */}
      <div className="flex flex-col items-center gap-0.5">
        {SPACES.map(({ id, label, icon: Icon, shortcut }) => {
          const isActive = activeSpace === id
          return (
            <Tooltip key={id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleSpaceClick(id)}
                  className={cn(
                    "relative flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-150",
                    isActive
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  )}
                  aria-label={label}
                >
                  <Icon size={20} />
                  {isActive && (
                    <div className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-foreground" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
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
      <div className="pb-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <IconSun size={20} /> : <IconMoon size={20} />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
