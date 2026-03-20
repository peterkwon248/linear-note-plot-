"use client"

import { usePlotStore } from "@/lib/store"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { IconChevronLeft, IconChevronRight, IconSearch, IconPlus } from "@/components/plot-icons"

export function TopUtilityBar() {
  const goBack = usePlotStore((s) => s.goBack)
  const goForward = usePlotStore((s) => s.goForward)
  const setSearchOpen = usePlotStore((s) => s.setSearchOpen)

  const handleNewNote = () => {
    const state = usePlotStore.getState()
    const id = state.createNote({})
    if (id) state.openNote(id)
  }

  return (
    <div className="flex h-11 shrink-0 items-center border-b border-border bg-background px-4 gap-1.5">
      {/* Navigation buttons */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={goBack}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Go back"
          >
            <IconChevronLeft size={16} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">Back</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={goForward}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Go forward"
          >
            <IconChevronRight size={16} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">Forward</TooltipContent>
      </Tooltip>

      <div className="w-2" />

      {/* Search trigger — opens SearchDialog, not a real input */}
      <button
        onClick={() => setSearchOpen(true)}
        className="flex h-[30px] max-w-[260px] flex-1 items-center gap-2 rounded-md border border-border px-2.5 text-sm text-muted-foreground transition-colors hover:border-foreground/20"
      >
        <IconSearch size={14} className="shrink-0" />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="font-mono text-[11px] opacity-40">⌘K</kbd>
      </button>

      <div className="flex-1" />

      {/* New Note CTA */}
      <button
        onClick={handleNewNote}
        className="flex h-[30px] items-center gap-1.5 rounded-md bg-accent px-3.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
      >
        <IconPlus size={14} />
        New Note
      </button>
    </div>
  )
}
