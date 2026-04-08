"use client"

import { cn } from "@/lib/utils"
import { usePlotStore } from "@/lib/store"
import { SidePanelDetail } from "./side-panel-detail"
import { SidePanelConnections } from "./side-panel-connections"
import { SidePanelActivity } from "./side-panel-activity"
import { SidePanelPeek } from "./side-panel-peek"
import { SidePanelBookmarks } from "./side-panel-bookmarks"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { SidebarSimple } from "@phosphor-icons/react/dist/ssr/SidebarSimple"
import { Graph } from "@phosphor-icons/react/dist/ssr/Graph"
import { ClockCounterClockwise } from "@phosphor-icons/react/dist/ssr/ClockCounterClockwise"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { BookmarkSimple } from "@phosphor-icons/react/dist/ssr/BookmarkSimple"
import type { SidePanelMode } from "@/lib/store/types"

interface SmartSidePanelProps {
  pane?: 'primary' | 'secondary'
}

export function SmartSidePanel({ pane = 'primary' }: SmartSidePanelProps) {
  // Use different state depending on which pane this side panel belongs to
  const primaryOpen = usePlotStore((s) => s.sidePanelOpen)
  const primaryMode = usePlotStore((s) => s.sidePanelMode)
  const primaryPeekNoteId = usePlotStore((s) => s.sidePanelPeekNoteId)
  const secondaryOpen = usePlotStore((s) => s.secondarySidePanelOpen)
  const secondaryMode = usePlotStore((s) => s.secondarySidePanelMode)

  const sidePanelOpen = pane === 'secondary' ? secondaryOpen : primaryOpen
  const sidePanelMode = pane === 'secondary' ? secondaryMode : primaryMode
  const sidePanelPeekNoteId = pane === 'secondary' ? null : primaryPeekNoteId // Peek only for primary

  const closeSidePeek = usePlotStore((s) => s.closeSidePeek)

  const setOpen = (open: boolean) => {
    if (pane === 'secondary') {
      usePlotStore.getState().setSecondarySidePanelOpen(open)
    } else {
      usePlotStore.getState().setSidePanelOpen(open)
    }
  }

  if (!sidePanelOpen) return null

  const showDetail = sidePanelMode === 'detail'
  const showConnections = sidePanelMode === 'connections'
  const showActivity = sidePanelMode === 'activity'
  const showPeek = sidePanelMode === 'peek' && !!sidePanelPeekNoteId
  const showBookmarks = sidePanelMode === 'bookmarks'

  const hasPeekNote = !!sidePanelPeekNoteId

  const setMode = (mode: SidePanelMode) => {
    if (pane === 'secondary') {
      usePlotStore.setState({ secondarySidePanelMode: mode })
    } else {
      usePlotStore.setState({ sidePanelMode: mode })
    }
  }

  const tabClass = (active: boolean) =>
    cn(
      "rounded-md px-2 py-1 text-note font-medium transition-colors",
      active
        ? "bg-active-bg text-foreground"
        : "text-muted-foreground hover:text-foreground hover:bg-hover-bg"
    )

  return (
    <aside className="flex h-full flex-col overflow-hidden bg-card">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-1">
          {/* Detail tab */}
          <button
            onClick={() => setMode('detail')}
            className={tabClass(sidePanelMode === 'detail')}
          >
            <SidebarSimple className="inline mr-1" size={14} weight="regular" />
            Detail
          </button>
          {/* Connections tab */}
          <button
            onClick={() => setMode('connections')}
            className={tabClass(sidePanelMode === 'connections')}
          >
            <Graph className="inline mr-1" size={14} weight="regular" />
            Connections
          </button>
          {/* Activity tab */}
          <button
            onClick={() => setMode('activity')}
            className={tabClass(sidePanelMode === 'activity')}
          >
            <ClockCounterClockwise className="inline mr-1" size={14} weight="regular" />
            Activity
          </button>
          {/* Bookmarks tab */}
          <button
            onClick={() => setMode('bookmarks')}
            className={tabClass(sidePanelMode === 'bookmarks')}
          >
            <BookmarkSimple className="inline mr-1" size={14} weight="regular" />
            Bookmarks
          </button>
          {/* Peek tab - only when peek note exists (primary only) */}
          {hasPeekNote && (
            <button
              onClick={() => sidePanelMode === 'peek' ? closeSidePeek() : setMode('peek')}
              className={tabClass(sidePanelMode === 'peek')}
            >
              <FileText className="inline mr-1" size={14} weight="regular" />
              Peek
            </button>
          )}
        </div>
        <button
          onClick={() => setOpen(false)}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
          aria-label="Close panel"
        >
          <PhX size={14} weight="regular" />
        </button>
      </header>

      {/* Content */}
      {showDetail && <SidePanelDetail />}
      {showConnections && <SidePanelConnections />}
      {showActivity && <SidePanelActivity />}
      {showPeek && <SidePanelPeek />}
      {showBookmarks && <SidePanelBookmarks />}
    </aside>
  )
}
