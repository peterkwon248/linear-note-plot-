"use client"

import { cn } from "@/lib/utils"
import { usePlotStore } from "@/lib/store"
import { SidePanelDetail } from "./side-panel-detail"
import { SidePanelConnections } from "./side-panel-connections"
import { SidePanelActivity } from "./side-panel-activity"
import { SidePanelPeek } from "./side-panel-peek"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { SidebarSimple } from "@phosphor-icons/react/dist/ssr/SidebarSimple"
import { Graph } from "@phosphor-icons/react/dist/ssr/Graph"
import { ClockCounterClockwise } from "@phosphor-icons/react/dist/ssr/ClockCounterClockwise"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import type { SidePanelMode } from "@/lib/store/types"

export function SmartSidePanel() {
  const sidePanelOpen = usePlotStore((s) => s.sidePanelOpen)
  const sidePanelMode = usePlotStore((s) => s.sidePanelMode)
  const sidePanelPeekNoteId = usePlotStore((s) => s.sidePanelPeekNoteId)
  const setSidePanelOpen = usePlotStore((s) => s.setSidePanelOpen)
  const closeSidePeek = usePlotStore((s) => s.closeSidePeek)

  if (!sidePanelOpen) return null

  const showDetail = sidePanelMode === 'detail'
  const showConnections = sidePanelMode === 'connections'
  const showActivity = sidePanelMode === 'activity'
  const showPeek = sidePanelMode === 'peek' && !!sidePanelPeekNoteId

  const hasPeekNote = !!sidePanelPeekNoteId

  const setMode = (mode: SidePanelMode) => {
    usePlotStore.setState({ sidePanelMode: mode })
  }

  const tabClass = (active: boolean) =>
    cn(
      "rounded-md px-2 py-1 text-note font-medium transition-colors",
      active
        ? "bg-secondary text-foreground"
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
          {/* Peek tab - only when peek note exists */}
          {hasPeekNote && (
            <button
              onClick={() => setMode('peek')}
              className={tabClass(sidePanelMode === 'peek')}
            >
              <FileText className="inline mr-1" size={14} weight="regular" />
              Peek
            </button>
          )}
        </div>
        <button
          onClick={() => {
            if (sidePanelMode === 'peek') {
              closeSidePeek()
            } else {
              setSidePanelOpen(false)
            }
          }}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
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
    </aside>
  )
}
