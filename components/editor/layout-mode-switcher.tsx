"use client"

import { Maximize2, Columns3, SplitSquareHorizontal, ChevronRight } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { usePlotStore } from "@/lib/store"
import type { WorkspaceMode } from "@/lib/types"
import type { ResearchPreset } from "@/lib/workspace/types"
import { RESEARCH_PRESETS, RESEARCH_PRESET_LABELS } from "@/lib/workspace/presets"
import { useState } from "react"

const WORKSPACE_MODES: { mode: WorkspaceMode; label: string; shortcut: string; icon: typeof Maximize2 }[] = [
  { mode: "default",  label: "Default",   shortcut: "Ctrl+0", icon: Columns3 },
  { mode: "zen",      label: "Zen",       shortcut: "Ctrl+1", icon: Maximize2 },
  { mode: "research", label: "Research",  shortcut: "Ctrl+2", icon: SplitSquareHorizontal },
]

/** Mini layout icon for research sub-presets */
function ResearchPresetIcon({ preset, className }: { preset: ResearchPreset; className?: string }) {
  const base = "rounded-[2px] border border-current"
  const cell = "rounded-[1px] bg-current opacity-40"

  switch (preset) {
    case "two-cols":
      return (
        <div className={cn("flex gap-[2px] w-6 h-4", base, "p-[2px]", className)}>
          <div className={cn(cell, "flex-1")} />
          <div className={cn(cell, "flex-1")} />
        </div>
      )
    case "three-cols":
      return (
        <div className={cn("flex gap-[2px] w-6 h-4", base, "p-[2px]", className)}>
          <div className={cn(cell, "flex-1")} />
          <div className={cn(cell, "flex-1")} />
          <div className={cn(cell, "flex-1")} />
        </div>
      )
    case "two-rows":
      return (
        <div className={cn("flex flex-col gap-[2px] w-6 h-4", base, "p-[2px]", className)}>
          <div className={cn(cell, "flex-1")} />
          <div className={cn(cell, "flex-1")} />
        </div>
      )
    case "left-right2":
      return (
        <div className={cn("flex gap-[2px] w-6 h-4", base, "p-[2px]", className)}>
          <div className={cn(cell, "flex-1")} />
          <div className="flex flex-1 flex-col gap-[2px]">
            <div className={cn(cell, "flex-1")} />
            <div className={cn(cell, "flex-1")} />
          </div>
        </div>
      )
    case "left2-right":
      return (
        <div className={cn("flex gap-[2px] w-6 h-4", base, "p-[2px]", className)}>
          <div className="flex flex-1 flex-col gap-[2px]">
            <div className={cn(cell, "flex-1")} />
            <div className={cn(cell, "flex-1")} />
          </div>
          <div className={cn(cell, "flex-1")} />
        </div>
      )
    case "grid-2x2":
      return (
        <div className={cn("grid grid-cols-2 gap-[2px] w-6 h-4", base, "p-[2px]", className)}>
          <div className={cn(cell)} />
          <div className={cn(cell)} />
          <div className={cn(cell)} />
          <div className={cn(cell)} />
        </div>
      )
  }
}

export function LayoutModeSwitcher() {
  const workspaceMode = usePlotStore((s) => s.workspaceMode) as WorkspaceMode
  const researchPreset = usePlotStore((s) => s.researchPreset) as ResearchPreset
  const setWorkspaceMode = usePlotStore((s) => s.setWorkspaceMode)
  const setResearchPreset = usePlotStore((s) => s.setResearchPreset)
  const [open, setOpen] = useState(false)
  const [showResearchSub, setShowResearchSub] = useState(false)

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setShowResearchSub(false) }}>
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
              <Columns3 className="h-4 w-4" />
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Layout Mode
        </TooltipContent>
      </Tooltip>

      <PopoverContent
        align="start"
        className="w-56 p-1.5"
        sideOffset={8}
      >
        {WORKSPACE_MODES.map(({ mode, label, shortcut, icon: Icon }) => {
          const isResearch = mode === "research"
          const isActive = workspaceMode === mode

          if (isResearch) {
            return (
              <div key={mode}>
                <button
                  onMouseEnter={() => setShowResearchSub(true)}
                  onClick={() => {
                    setWorkspaceMode(mode)
                    setOpen(false)
                    setShowResearchSub(false)
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors",
                    isActive
                      ? "bg-secondary/80 text-foreground"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  )}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  <span className="flex-1 text-sm font-medium">{label}</span>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                </button>

                {/* Research sub-presets panel */}
                {showResearchSub && (
                  <div
                    className="ml-2 mt-0.5 mb-0.5 border-l border-border pl-1"
                    onMouseLeave={() => setShowResearchSub(false)}
                  >
                    {RESEARCH_PRESETS.map((rp) => (
                      <button
                        key={rp}
                        onClick={() => {
                          setResearchPreset(rp)
                          setOpen(false)
                          setShowResearchSub(false)
                        }}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left transition-colors",
                          workspaceMode === "research" && researchPreset === rp
                            ? "bg-secondary/80 text-foreground"
                            : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                        )}
                      >
                        <ResearchPresetIcon preset={rp} className="!w-6 !h-4" />
                        <span className="text-[13px] font-medium">{RESEARCH_PRESET_LABELS[rp]}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          return (
            <button
              key={mode}
              onMouseEnter={() => setShowResearchSub(false)}
              onClick={() => {
                setWorkspaceMode(mode)
                setOpen(false)
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors",
                isActive
                  ? "bg-secondary/80 text-foreground"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span className="flex-1 text-sm font-medium">{label}</span>
              <kbd className="text-2xs text-muted-foreground/60 font-mono">{shortcut}</kbd>
            </button>
          )
        })}
      </PopoverContent>
    </Popover>
  )
}
