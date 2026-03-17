"use client"

import { Maximize2, Columns3, SplitSquareHorizontal, LayoutGrid } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { usePlotStore } from "@/lib/store"
import type { LayoutMode } from "@/lib/types"
import { useState } from "react"

const LAYOUT_MODES: { mode: LayoutMode; label: string; shortcut: string; icon: typeof Maximize2 }[] = [
  { mode: "focus",        label: "Focus",         shortcut: "Ctrl+1", icon: Maximize2 },
  { mode: "three-column", label: "List + Editor",  shortcut: "Ctrl+2", icon: Columns3 },
  { mode: "split",        label: "Research",       shortcut: "Ctrl+3", icon: SplitSquareHorizontal },
]

export function LayoutModeSwitcher() {
  const layoutMode = usePlotStore((s) => s.layoutMode) as LayoutMode
  const setLayoutMode = usePlotStore((s) => s.setLayoutMode)
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "inline-flex items-center justify-center rounded-md p-1.5",
                "text-muted-foreground hover:text-foreground hover:bg-secondary",
                "transition-colors"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Layout Mode
        </TooltipContent>
      </Tooltip>

      <PopoverContent
        align="end"
        className="w-56 p-1.5"
        sideOffset={8}
      >
        {LAYOUT_MODES.map(({ mode, label, shortcut, icon: Icon }) => (
          <button
            key={mode}
            onClick={() => {
              setLayoutMode(mode)
              setOpen(false)
            }}
            className={cn(
              "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors",
              layoutMode === mode
                ? "bg-secondary/80 text-foreground"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-note font-medium">{label}</span>
            <kbd className="text-2xs text-muted-foreground/60 font-mono">{shortcut}</kbd>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}
