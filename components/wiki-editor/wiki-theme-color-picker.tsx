"use client"

/**
 * Wiki theme color picker (PR-E2).
 *
 * Triggered from WikiInfobox's edit-mode footer ("Theme color…"). Picks a
 * solid hex color that cascades to:
 *   - Infobox header fallback (when no explicit infoboxHeaderColor)
 *   - Group header tint (future follow-up — skipped this PR for minimal diff)
 *   - Hatnote left accent border
 *   - Section h2 left border (3px accent)
 *
 * Persisted as `WikiArticle.themeColor` (hex string or null). null = plain
 * (영구 룰 #67 "Gentle by default" — opt-in).
 *
 * Wikipedia / 나무위키 pattern정합: 18-color PRESET_COLORS grid + custom hex
 * picker + Clear option. Apply가 명시적 — preset 클릭만으로는 close 안 함
 * (사용자 확정 액션 의무, "Replace all" UX 정합).
 */

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PRESET_COLORS, PRESET_COLOR_NAMES } from "@/lib/colors"
import { cn } from "@/lib/utils"
import { Check as PhCheck } from "@phosphor-icons/react/dist/ssr/Check"

interface WikiThemeColorPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Current themeColor (hex or null). null = no theme color set. */
  currentValue: string | null
  /** Called on Apply. Pass null to clear. */
  onApply: (color: string | null) => void
}

export function WikiThemeColorPicker({
  open,
  onOpenChange,
  currentValue,
  onApply,
}: WikiThemeColorPickerProps) {
  // Local draft state — only committed on Apply. Cancel discards.
  const [draft, setDraft] = useState<string | null>(currentValue)

  // Reset draft whenever the dialog opens to track the latest currentValue.
  useEffect(() => {
    if (open) setDraft(currentValue)
  }, [open, currentValue])

  const handleApply = () => {
    onApply(draft)
    onOpenChange(false)
  }

  const handleClear = () => {
    onApply(null)
    onOpenChange(false)
  }

  // Custom hex input — default to violet (Plot accent) when nothing set.
  const customValue = draft && /^#[0-9a-f]{6}$/i.test(draft) ? draft : "#8b5cf6"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Theme color</DialogTitle>
          <DialogDescription>
            Cascades to infobox header, hatnote accent, and h2 section borders.
            Leave unset for plain (no chrome).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Preset grid — 18 colors, 6 columns × 3 rows */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Choose a color
            </label>
            <div className="grid grid-cols-6 gap-2">
              {PRESET_COLORS.map((hex) => {
                const isActive = (draft ?? null) === hex
                return (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setDraft(hex)}
                    title={PRESET_COLOR_NAMES[hex] ?? hex}
                    className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center transition-all",
                      "ring-1 ring-black/5 dark:ring-white/10 hover:scale-110 hover:ring-2 hover:ring-foreground/20",
                      isActive && "ring-2 ring-offset-2 ring-offset-popover ring-foreground",
                    )}
                    style={{ backgroundColor: hex }}
                  >
                    {isActive && (
                      <PhCheck size={14} weight="bold" className="text-white drop-shadow" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Custom hex picker */}
          <div className="flex items-center gap-2 pt-2 border-t border-border-subtle">
            <label
              className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full ring-1 ring-black/5 dark:ring-white/10 bg-gradient-to-br from-red-400 via-yellow-300 to-blue-400 hover:scale-110 transition-transform"
              title="Custom color"
            >
              <input
                type="color"
                value={customValue}
                onChange={(e) => setDraft(e.target.value.toLowerCase())}
                className="pointer-events-none h-0 w-0 opacity-0"
              />
            </label>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-foreground">Custom</span>
              {draft && /^#[0-9a-f]{6}$/i.test(draft) && (
                <span className="text-2xs text-muted-foreground font-mono uppercase">
                  {draft}
                </span>
              )}
            </div>
            {draft && !PRESET_COLORS.includes(draft as (typeof PRESET_COLORS)[number]) && (
              <span
                className="ml-auto h-5 w-5 rounded-full ring-1 ring-black/5 dark:ring-white/10"
                style={{ backgroundColor: draft }}
                aria-hidden
              />
            )}
          </div>
        </div>

        <DialogFooter>
          {currentValue !== null && (
            <button
              type="button"
              onClick={handleClear}
              className="mr-auto rounded-md border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground hover:bg-hover-bg hover:text-foreground transition-colors"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground hover:bg-hover-bg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
          >
            Apply
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
