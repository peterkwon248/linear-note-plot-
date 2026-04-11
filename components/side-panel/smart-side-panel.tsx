"use client"

import { cn } from "@/lib/utils"
import { usePlotStore } from "@/lib/store"
import { SidePanelDetail } from "./side-panel-detail"
import { SidePanelConnections } from "./side-panel-connections"
import { SidePanelActivity } from "./side-panel-activity"
import { SidePanelBookmarks } from "./side-panel-bookmarks"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { SidebarSimple } from "@phosphor-icons/react/dist/ssr/SidebarSimple"
import { Graph } from "@phosphor-icons/react/dist/ssr/Graph"
import { ClockCounterClockwise } from "@phosphor-icons/react/dist/ssr/ClockCounterClockwise"
import { BookmarkSimple } from "@phosphor-icons/react/dist/ssr/BookmarkSimple"
import type { SidePanelMode } from "@/lib/store/types"

/**
 * Single SmartSidePanel — one instance regardless of split-view state.
 * State (open / mode) is GLOBAL. Content is resolved by entity hooks
 * (useSidePanelEntity) which read `sidePanelContext` directly.
 *
 * Context swapping happens in setActivePane / openInSecondary / openNote,
 * so this component just reads sidePanelContext and renders accordingly.
 */
export function SmartSidePanel() {
  const sidePanelOpen = usePlotStore((s) => s.sidePanelOpen)
  const sidePanelMode = usePlotStore((s) => s.sidePanelMode)

  const setOpen = (open: boolean) => {
    usePlotStore.getState().setSidePanelOpen(open)
  }

  if (!sidePanelOpen) return null

  const showDetail = sidePanelMode === 'detail'
  const showConnections = sidePanelMode === 'connections'
  const showActivity = sidePanelMode === 'activity'
  const showBookmarks = sidePanelMode === 'bookmarks'

  const setMode = (mode: SidePanelMode) => {
    usePlotStore.setState({ sidePanelMode: mode })
  }

  // Compact tab style — smaller padding & text so all 4 tab labels fit
  const tabClass = (active: boolean) =>
    cn(
      "rounded-md px-1.5 py-1 text-2xs font-medium transition-colors whitespace-nowrap",
      active
        ? "bg-active-bg text-foreground"
        : "text-muted-foreground hover:text-foreground hover:bg-hover-bg"
    )

  return (
    <aside className="flex h-full flex-col overflow-hidden bg-card">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-2 py-2 gap-1">
        <div className="flex items-center gap-0.5 min-w-0">
          <button
            onClick={() => setMode('detail')}
            className={tabClass(sidePanelMode === 'detail')}
          >
            <SidebarSimple className="inline mr-0.5" size={13} weight="regular" />
            Detail
          </button>
          <button
            onClick={() => setMode('connections')}
            className={tabClass(sidePanelMode === 'connections')}
          >
            <Graph className="inline mr-0.5" size={13} weight="regular" />
            Connections
          </button>
          <button
            onClick={() => setMode('activity')}
            className={tabClass(sidePanelMode === 'activity')}
          >
            <ClockCounterClockwise className="inline mr-0.5" size={13} weight="regular" />
            Activity
          </button>
          <button
            onClick={() => setMode('bookmarks')}
            className={tabClass(sidePanelMode === 'bookmarks')}
          >
            <BookmarkSimple className="inline mr-0.5" size={13} weight="regular" />
            Bookmarks
          </button>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
          aria-label="Close panel"
        >
          <PhX size={14} weight="regular" />
        </button>
      </header>

      {/* Content — entity hooks (useSidePanelEntity) resolve via sidePanelContext */}
      <div className="flex flex-1 flex-col overflow-hidden animate-in fade-in duration-150">
        {showDetail && <SidePanelDetail />}
        {showConnections && <SidePanelConnections />}
        {showActivity && <SidePanelActivity />}
        {showBookmarks && <SidePanelBookmarks />}
      </div>
    </aside>
  )
}
