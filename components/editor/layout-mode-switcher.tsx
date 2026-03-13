"use client"

import { Maximize2, Columns3, AppWindow, PanelRight, SplitSquareHorizontal } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { usePlotStore } from "@/lib/store"
import type { LayoutMode } from "@/lib/types"
import { useState } from "react"

const LAYOUT_MODES: { mode: LayoutMode; label: string; shortcut: string; icon: typeof Maximize2 }[] = [
  { mode: "focus",        label: "Focus",        shortcut: "Ctrl+1", icon: Maximize2 },
  { mode: "three-column", label: "Three Column", shortcut: "Ctrl+2", icon: Columns3 },
  { mode: "tabs",         label: "Tabs",         shortcut: "Ctrl+3", icon: AppWindow },
  { mode: "panels",       label: "Panels",       shortcut: "Ctrl+4", icon: PanelRight },
  { mode: "split",        label: "Split",        shortcut: "Ctrl+5", icon: SplitSquareHorizontal },
]

export function LayoutModeSwitcher() {
  const layoutMode = usePlotStore((s) => s.layoutMode)
  const setLayoutMode = usePlotStore((s) => s.setLayoutMode)
  const [open, setOpen] = useState(false)

  const current = LAYOUT_MODES.find((m) => m.mode === layoutMode) ?? LAYOUT_MODES[2]
  const CurrentIcon = current.icon

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
              <CurrentIcon className="h-4 w-4" />
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Layout: {current.label}
        </TooltipContent>
      </Tooltip>

      <PopoverContent
        align="end"
        className="w-52 p-1"
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
              "flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left transition-colors",
              mode === layoutMode
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1 text-xs font-medium">{label}</span>
            <kbd className="text-[10px] text-muted-foreground/60 font-mono">{shortcut}</kbd>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}
