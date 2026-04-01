"use client"

import { usePlotStore } from "@/lib/store"
import { routeGoBack, routeGoForward } from "@/lib/table-route"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { IconChevronLeft, IconChevronRight, IconSearch } from "@/components/plot-icons"

export function TopUtilityBar() {
  const goBack = usePlotStore((s) => s.goBack)
  const goForward = usePlotStore((s) => s.goForward)
  const setSearchOpen = usePlotStore((s) => s.setSearchOpen)

  const handleGoBack = () => {
    const s = usePlotStore.getState()
    if (s.selectedNoteId) {
      const handled = goBack()
      if (handled) return
    }
    routeGoBack()
  }

  const handleGoForward = () => {
    const s = usePlotStore.getState()
    if (s.selectedNoteId) {
      const handled = goForward()
      if (handled) return
    }
    routeGoForward()
  }

  return (
    <div className="flex h-11 shrink-0 items-center border-b border-border bg-background px-4 gap-1.5">
      {/* Navigation buttons */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleGoBack}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
            aria-label="Go back"
          >
            <IconChevronLeft size={16} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-2xs">Back</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleGoForward}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
            aria-label="Go forward"
          >
            <IconChevronRight size={16} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-2xs">Forward</TooltipContent>
      </Tooltip>

      <div className="w-2" />

      {/* Search trigger — opens SearchDialog, not a real input */}
      <button
        onClick={() => setSearchOpen(true)}
        className="flex h-8 max-w-[260px] flex-1 items-center gap-2 rounded-md border border-border px-2.5 text-note text-muted-foreground transition-colors hover:border-foreground/20"
      >
        <IconSearch size={14} className="shrink-0" />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="font-mono text-2xs opacity-40">⌘K</kbd>
      </button>
    </div>
  )
}
