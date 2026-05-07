"use client"

/**
 * PanelsMenu — mockup `Toggle panels` popover spec.
 *
 * Hamburger button (≡) → popover with Activity bar / Sidebar / Detail
 * checkboxes + Show all / Hide all presets. Replaces individual panel
 * close buttons (mockup pattern: centralized panel control).
 *
 * Position: workspace top-left (ViewHeader 좌측).
 */

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { usePlotStore } from "@/lib/store"
import { List as ListIcon } from "@phosphor-icons/react/dist/ssr/List"
import { Check } from "@phosphor-icons/react/dist/ssr/Check"

export function PanelsMenu() {
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

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/70 transition-colors hover:bg-hover-bg hover:text-foreground"
          aria-label="Toggle panels"
          title="Toggle panels"
        >
          <ListIcon size={14} weight="regular" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-[200px] rounded-lg border border-border-subtle bg-surface-overlay p-1 shadow-lg"
      >
        <div className="px-2 pt-1.5 pb-1 text-2xs font-medium uppercase tracking-wider text-muted-foreground/70">
          Panels
        </div>
        <PanelToggle
          label="Activity bar"
          checked={actbarOpen}
          onClick={() => setActivitybarCollapsed(!activitybarCollapsed)}
          shortcut="⌘⇧A"
        />
        <PanelToggle
          label="Sidebar"
          checked={sidebarOpen}
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          shortcut="⌘⇧F"
        />
        <PanelToggle
          label="Detail"
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
      </PopoverContent>
    </Popover>
  )
}

function PanelToggle({
  label,
  checked,
  onClick,
  shortcut,
}: {
  label: string
  checked: boolean
  onClick: () => void
  shortcut?: string
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-note text-foreground/80 transition-colors hover:bg-hover-bg hover:text-foreground"
      data-active={checked ? "true" : undefined}
    >
      <span className="flex-1 text-left">{label}</span>
      {shortcut && (
        <span className="text-2xs text-muted-foreground/60 tabular-nums">{shortcut}</span>
      )}
      {checked && <Check size={12} weight="bold" className="text-accent" />}
    </button>
  )
}
