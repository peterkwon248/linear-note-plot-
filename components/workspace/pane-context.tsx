"use client"

import { createContext, useContext, useCallback } from "react"
import { usePlotStore } from "@/lib/store"
import { setRouteInterceptForSecondary, useActiveRoute as useGlobalActiveRoute, useSecondaryRoute } from "@/lib/table-route"

export type PaneId = 'primary' | 'secondary'

const PaneContext = createContext<PaneId>('primary')

export function PaneProvider({ pane, children }: { pane: PaneId; children: React.ReactNode }) {
  if (pane === 'secondary') {
    return (
      <PaneContext.Provider value={pane}>
        <div
          className="contents"
          onClickCapture={() => setRouteInterceptForSecondary(true)}
          onMouseUpCapture={() => {
            setTimeout(() => setRouteInterceptForSecondary(false), 0)
          }}
        >
          {children}
        </div>
      </PaneContext.Provider>
    )
  }
  return <PaneContext.Provider value={pane}>{children}</PaneContext.Provider>
}

export function usePane(): PaneId {
  return useContext(PaneContext)
}

/**
 * Returns an openNote function that automatically routes to the correct pane.
 * When inside a PaneProvider with pane='secondary', openNote will open in the secondary panel.
 */
export function usePaneOpenNote() {
  const pane = useContext(PaneContext)
  const openNote = usePlotStore((s) => s.openNote)
  return useCallback(
    (id: string, opts?: { forceNewTab?: boolean }) => {
      openNote(id, { ...opts, pane })
    },
    [openNote, pane]
  )
}

/**
 * Returns true when this pane is the active pane in a split view.
 * Returns false in single-pane mode (no visual indicator needed).
 */
export function useIsActivePane(): boolean {
  const pane = useContext(PaneContext)
  const activePane = usePlotStore((s) => s.activePane)
  const hasSecondaryNote = usePlotStore((s) => !!s.secondaryNoteId)
  const secondaryRoute = useSecondaryRoute()
  const hasSplit = hasSecondaryNote || !!secondaryRoute
  return hasSplit && pane === activePane
}

/**
 * Returns the active route for the current pane.
 * In secondary pane, reads from secondaryRoute instead of global activeRoute.
 */
export function usePaneActiveRoute(): string | null {
  const pane = useContext(PaneContext)
  const globalRoute = useGlobalActiveRoute()
  const secondaryRoute = useSecondaryRoute()
  return pane === 'secondary' ? secondaryRoute : globalRoute
}
