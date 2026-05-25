"use client"

/**
 * UserAvatar — workspace identity anchor + chrome single entry (GlobalTopBar left).
 *
 * Chunk 1+2 (2026-05-25): 'P' brand mark moved from activity bar to GlobalTopBar
 * as workspace identity anchor. `.a-brand__mark` className preserves the gradient
 * badge visual (28×28 rounded-7px, space-home→space-wiki gradient, white "P").
 *
 * Chunk 3 (2026-05-25): Avatar becomes the **single entry point for all chrome
 * tools**. Click → popover with:
 *   1. Panel toggles (Activity bar / Sidebar / Detail) — absorbed from PanelsMenu
 *   2. Show all / Hide all presets — absorbed from PanelsMenu
 *   3. Settings link (was right cluster, now consolidated)
 *   4. Trash link (was right cluster, now consolidated)
 *
 * Theme toggle remains in the right cluster — frequent 1-click action where
 * dropdown overhead is unwarranted (Linear/Notion pattern parity).
 *
 * Note: PanelsMenu component is still used by `note-editor.tsx` (primary pane
 * header) and `book-detail-page.tsx` (book detail header) — those are separate
 * view headers, not the global chrome. We share `PanelToggle` between both
 * popovers (DRY) by exporting it from panels-menu.tsx.
 */

import Link from "next/link"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { usePlotStore } from "@/lib/store"
import { useT } from "@/lib/i18n"
import { Settings as IconGear, Trash2 as IconTrash } from "lucide-react"
import { PanelToggle } from "@/components/panels-menu"

export function UserAvatar() {
  const t = useT()

  const sidebarCollapsed = usePlotStore((s) => s.sidebarCollapsed)
  const setSidebarCollapsed = usePlotStore((s) => s.setSidebarCollapsed)
  const activitybarCollapsed = usePlotStore((s) => s.activitybarCollapsed)
  const setActivitybarCollapsed = usePlotStore((s) => s.setActivitybarCollapsed)
  const sidePanelOpen = usePlotStore((s) => s.sidePanelOpen)
  const setSidePanelOpen = usePlotStore((s) => s.setSidePanelOpen)

  const actbarOpen = !activitybarCollapsed
  const sidebarOpen = !sidebarCollapsed
  const detailOpen = sidePanelOpen

  const showAll = () => {
    setActivitybarCollapsed(false)
    setSidebarCollapsed(false)
    setSidePanelOpen(true)
  }

  const hideAll = () => {
    setActivitybarCollapsed(true)
    setSidebarCollapsed(true)
    setSidePanelOpen(false)
  }

  // settings.userName will populate this once a userName field is added
  // (separate chunk). For now, the workspace initial is hardcoded "P" to
  // preserve the existing identity users are familiar with.
  const initial = "P"

  return (
    <Popover>
      {/* asChild removed: Radix Popover with asChild + Slot pattern produces
       *  React 19 SSR hydration mismatch on `aria-controls` (Radix useId
       *  generates different IDs on server vs client because the Slot tree
       *  shifts useId call order). PopoverTrigger renders a <button> by
       *  default, so we pass className/aria props directly. */}
      <PopoverTrigger
        className="a-brand__mark shrink-0 cursor-pointer transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-label="Workspace menu"
        title="Workspace menu"
      >
        {initial}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-[220px] rounded-lg border border-border-subtle bg-surface-overlay p-1 shadow-lg"
      >
        <div className="px-2 pt-1.5 pb-1 text-2xs font-medium uppercase tracking-wider text-muted-foreground/70">
          Panels
        </div>
        <PanelToggle
          label="Activity bar"
          panel="activity"
          checked={actbarOpen}
          onClick={() => setActivitybarCollapsed(!activitybarCollapsed)}
          shortcut="⌘⇧A"
        />
        <PanelToggle
          label="Sidebar"
          panel="sidebar"
          checked={sidebarOpen}
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          shortcut="⌘⇧F"
        />
        <PanelToggle
          label="Detail"
          panel="detail"
          checked={detailOpen}
          onClick={() => setSidePanelOpen(!sidePanelOpen)}
          shortcut="⌘B"
        />
        <div className="my-1 border-t border-border-subtle" />
        <button
          onClick={showAll}
          className="flex w-full items-center rounded-md px-2 py-1.5 text-note text-foreground/80 transition-colors hover:bg-hover-bg hover:text-foreground"
        >
          Show all panels
        </button>
        <button
          onClick={hideAll}
          className="flex w-full items-center rounded-md px-2 py-1.5 text-note text-foreground/80 transition-colors hover:bg-hover-bg hover:text-foreground"
        >
          Hide all panels
        </button>
        <div className="my-1 border-t border-border-subtle" />
        <Link
          href="/settings"
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-note text-foreground/80 transition-colors hover:bg-hover-bg hover:text-foreground"
        >
          <IconGear size={14} strokeWidth={2} className="shrink-0 text-muted-foreground" />
          <span className="flex-1 text-left">{t("nav.settings")}</span>
        </Link>
        <Link
          href="/trash"
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-note text-foreground/80 transition-colors hover:bg-hover-bg hover:text-foreground"
        >
          <IconTrash size={14} strokeWidth={2} className="shrink-0 text-muted-foreground" />
          <span className="flex-1 text-left">{t("nav.trash")}</span>
        </Link>
      </PopoverContent>
    </Popover>
  )
}
