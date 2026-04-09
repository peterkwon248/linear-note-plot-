"use client"

import { cn } from "@/lib/utils"
import { usePlotStore } from "@/lib/store"
import { SidePanelDetail } from "./side-panel-detail"
import { SidePanelConnections } from "./side-panel-connections"
import { SidePanelActivity } from "./side-panel-activity"
import { SidePanelPeek } from "./side-panel-peek"
import { PeekEmptyState } from "./peek-empty-state"
import { SidePanelBookmarks } from "./side-panel-bookmarks"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { SidebarSimple } from "@phosphor-icons/react/dist/ssr/SidebarSimple"
import { Graph } from "@phosphor-icons/react/dist/ssr/Graph"
import { ClockCounterClockwise } from "@phosphor-icons/react/dist/ssr/ClockCounterClockwise"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { BookmarkSimple } from "@phosphor-icons/react/dist/ssr/BookmarkSimple"
import { CaretLeft } from "@phosphor-icons/react/dist/ssr/CaretLeft"
import { CaretRight } from "@phosphor-icons/react/dist/ssr/CaretRight"
import { PushPinSimple } from "@phosphor-icons/react/dist/ssr/PushPinSimple"
import type { SidePanelMode, PeekContext } from "@/lib/store/types"

/**
 * Single SmartSidePanel — one instance regardless of split-view state.
 * State (open / mode) is GLOBAL. Content is resolved by entity hooks
 * (useSidePanelEntity) which use `usePane()` to read the currently active pane.
 *
 * Consumers should wrap this in `<PaneProvider pane={activePane}>` so the
 * entity hooks pick up the right note/wiki context.
 */
export function SmartSidePanel() {
  const sidePanelOpen = usePlotStore((s) => s.sidePanelOpen)
  const sidePanelMode = usePlotStore((s) => s.sidePanelMode)
  const sidePanelPeekContext = usePlotStore((s) => s.sidePanelPeekContext)

  const setOpen = (open: boolean) => {
    usePlotStore.getState().setSidePanelOpen(open)
  }

  if (!sidePanelOpen) return null

  const showDetail = sidePanelMode === 'detail'
  const showConnections = sidePanelMode === 'connections'
  const showActivity = sidePanelMode === 'activity'
  const showPeek = sidePanelMode === 'peek'
  const showBookmarks = sidePanelMode === 'bookmarks'

  const setMode = (mode: SidePanelMode) => {
    usePlotStore.setState({ sidePanelMode: mode })
  }

  // Compact tab style — smaller padding & text so all 5 tab labels fit at min Peek width
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

      {/* Content — entity hooks (useSidePanelEntity / usePane) resolve the active pane */}
      <div className="flex flex-1 flex-col overflow-hidden animate-in fade-in duration-150">
        {showDetail && <SidePanelDetail />}
        {showConnections && <SidePanelConnections />}
        {showActivity && <SidePanelActivity />}
        {showPeek && (
          <>
            {/* Peek sub-header — only nav + pin controls. Fixed height. */}
            <PeekSubHeader />
            {sidePanelPeekContext ? <SidePanelPeek /> : <PeekEmptyState />}
          </>
        )}
        {showBookmarks && <SidePanelBookmarks />}
      </div>
    </aside>
  )
}

// ── Peek sub-header ──────────────────────────────────────────────────────────

function peekKey(ctx: PeekContext): string { return `${ctx.type}:${ctx.id}` }

function PeekSubHeader() {
  return (
    <div className="flex items-center justify-start gap-0.5 border-b border-border-subtle px-2 h-9 shrink-0">
      <PeekNavControls />
    </div>
  )
}

// ── Peek navigation + pin controls ──────────────────────────────────────────

function PeekNavControls() {
  const peekNavStack = usePlotStore((s) => s.peekNavStack)
  const peekNavIndex = usePlotStore((s) => s.peekNavIndex)
  const peekGoBack = usePlotStore((s) => s.peekGoBack)
  const peekGoForward = usePlotStore((s) => s.peekGoForward)
  const peekContext = usePlotStore((s) => s.sidePanelPeekContext)
  const peekPins = usePlotStore((s) => s.peekPins)
  const togglePeekPin = usePlotStore((s) => s.togglePeekPin)

  const canGoBack = peekNavIndex > 0
  const canGoForward = peekNavIndex >= 0 && peekNavIndex < peekNavStack.length - 1
  const canPin = !!peekContext
  const isPinned = !!(
    peekContext && peekPins.some((p) => peekKey(p) === peekKey(peekContext))
  )

  // Maximum contrast — use bordered button group with solid background so controls stand out
  const btnClass = (opts: { active?: boolean; disabled?: boolean }) =>
    cn(
      "inline-flex items-center justify-center rounded-md size-7 transition-colors",
      opts.disabled
        ? "text-foreground/30 cursor-not-allowed"
        : opts.active
          ? "bg-accent/15 text-accent hover:bg-accent/20"
          : "text-foreground hover:bg-hover-bg"
    )

  return (
    <div className="inline-flex items-center gap-0.5 rounded-md border border-border bg-background p-0.5">
      <button
        onClick={peekGoBack}
        disabled={!canGoBack}
        className={btnClass({ disabled: !canGoBack })}
        title="Back"
        aria-label="Back"
      >
        <CaretLeft size={14} weight="bold" />
      </button>
      <button
        onClick={peekGoForward}
        disabled={!canGoForward}
        className={btnClass({ disabled: !canGoForward })}
        title="Forward"
        aria-label="Forward"
      >
        <CaretRight size={14} weight="bold" />
      </button>
      <div className="w-px h-4 bg-border-subtle mx-0.5" aria-hidden />
      <button
        onClick={() => peekContext && togglePeekPin(peekContext)}
        disabled={!canPin}
        className={btnClass({ active: isPinned, disabled: !canPin })}
        title={isPinned ? "Unpin" : "Pin"}
        aria-label={isPinned ? "Unpin" : "Pin"}
        aria-pressed={isPinned}
      >
        <PushPinSimple size={14} weight={isPinned ? "fill" : "regular"} />
      </button>
    </div>
  )
}
