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
      </PopoverContent>
    </Popover>
  )
}

function PanelToggle({
  label,
  panel,
  checked,
  onClick,
  shortcut,
}: {
  label: string
  panel: "activity" | "sidebar" | "detail"
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
      <PanelMini highlight={panel} active={checked} />
      <span className="flex-1 text-left">{label}</span>
      {shortcut && (
        <span className="text-2xs text-muted-foreground/60 tabular-nums">{shortcut}</span>
      )}
      {checked && <Check size={12} weight="bold" className="text-accent" />}
    </button>
  )
}

/**
 * 4-region layout miniature. Highlights the panel this row controls
 * (filled when active, outlined when inactive). Other regions render
 * as faint outlines for spatial context. Linear/Plain pattern.
 */
function PanelMini({
  highlight,
  active,
}: {
  highlight: "activity" | "sidebar" | "detail"
  active: boolean
}) {
  // 4 regions in a 16×12 viewBox: actbar (1.5w) | sidebar (3.5w) | editor (5.5w) | detail (3w)
  const fill = active ? "currentColor" : "none"
  const opacity = active ? 0.85 : 0.45
  return (
    <svg
      width={16}
      height={12}
      viewBox="0 0 16 12"
      className="shrink-0 text-muted-foreground/70"
      aria-hidden="true"
    >
      {/* Activity bar (leftmost narrow strip) */}
      <rect
        x={0.75}
        y={0.75}
        width={1.5}
        height={10.5}
        rx={0.5}
        fill={highlight === "activity" ? fill : "none"}
        stroke="currentColor"
        strokeWidth={0.6}
        opacity={highlight === "activity" ? opacity : 0.35}
      />
      {/* Sidebar */}
      <rect
        x={2.75}
        y={0.75}
        width={3.5}
        height={10.5}
        rx={0.5}
        fill={highlight === "sidebar" ? fill : "none"}
        stroke="currentColor"
        strokeWidth={0.6}
        opacity={highlight === "sidebar" ? opacity : 0.35}
      />
      {/* Editor (always faint outline — main content area, not toggleable here) */}
      <rect
        x={6.75}
        y={0.75}
        width={5.5}
        height={10.5}
        rx={0.5}
        fill="none"
        stroke="currentColor"
        strokeWidth={0.6}
        opacity={0.35}
      />
      {/* Detail */}
      <rect
        x={12.75}
        y={0.75}
        width={2.5}
        height={10.5}
        rx={0.5}
        fill={highlight === "detail" ? fill : "none"}
        stroke="currentColor"
        strokeWidth={0.6}
        opacity={highlight === "detail" ? opacity : 0.35}
      />
    </svg>
  )
}
