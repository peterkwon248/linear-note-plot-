"use client"

/**
 * WikiTitle — Phase 2-1A + Phase 3.1-A (article theme picker).
 *
 * Renders `article.title + aliases` per `WikiTitleStyle`. Lives ABOVE the
 * column area (fixed at top of article) — never inside a card. Mirrors
 * 위키백과/나무위키 convention.
 *
 * Phase 3.1-A: editable mode exposes a paint-bucket button on hover that
 * opens an article-level theme color picker. The chosen color propagates
 * through `WikiThemeProvider` to tint the whole article (including this
 * title area) so the page gets a unified identity.
 */

import { useEffect, useRef, useState, type CSSProperties } from "react"
import type { WikiTitleStyle, WikiThemeColor } from "@/lib/types"
import { cn } from "@/lib/utils"
import { PaintBucket } from "@phosphor-icons/react/dist/ssr/PaintBucket"

export interface WikiTitleProps {
  title: string
  aliases?: string[]
  titleStyle?: WikiTitleStyle
  themeColor?: WikiThemeColor
  editable?: boolean
  onTitleChange?: (next: string) => void
  onAliasesChange?: (next: string[]) => void
  /** Phase 3.1-A: article-level theme color picker. Pass null to clear. */
  onThemeColorChange?: (next: WikiThemeColor | null) => void
  className?: string
}

const SIZE_CLASSES = {
  default: "text-[1.75em]",
  large: "text-[2.25em]",
  hero: "text-[3em]",
} as const

/** Article theme presets. `light` used in light mode, `dark` in dark mode. */
const ARTICLE_THEME_PRESETS: Array<{ label: string; value: WikiThemeColor | null; swatch: string }> = [
  { label: "Default", value: null, swatch: "transparent" },
  { label: "Blue", value: { light: "#3b82f6", dark: "#60a5fa" }, swatch: "#3b82f6" },
  { label: "Purple", value: { light: "#8b5cf6", dark: "#a78bfa" }, swatch: "#8b5cf6" },
  { label: "Pink", value: { light: "#ec4899", dark: "#f472b6" }, swatch: "#ec4899" },
  { label: "Red", value: { light: "#ef4444", dark: "#f87171" }, swatch: "#ef4444" },
  { label: "Orange", value: { light: "#f97316", dark: "#fb923c" }, swatch: "#f97316" },
  { label: "Yellow", value: { light: "#eab308", dark: "#facc15" }, swatch: "#eab308" },
  { label: "Green", value: { light: "#22c55e", dark: "#4ade80" }, swatch: "#22c55e" },
  { label: "Teal", value: { light: "#14b8a6", dark: "#2dd4bf" }, swatch: "#14b8a6" },
  { label: "Slate", value: { light: "#64748b", dark: "#94a3b8" }, swatch: "#64748b" },
]

function hexToWikiTheme(hex: string): WikiThemeColor | null {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return null
  return { light: hex, dark: hex }
}

export function WikiTitle({
  title,
  aliases = [],
  titleStyle,
  themeColor,
  editable = false,
  onTitleChange,
  onAliasesChange,
  onThemeColorChange,
  className,
}: WikiTitleProps) {
  const alignment = titleStyle?.alignment ?? "left"
  const size = titleStyle?.size ?? "default"
  const showAliases = titleStyle?.showAliases !== false && aliases.length > 0
  const themeColorBg = titleStyle?.themeColorBg && themeColor

  // Aliases input mirrors a draft string so users can type freely (commas, spaces).
  const [aliasDraft, setAliasDraft] = useState<string | null>(null)
  const aliasDisplay = aliasDraft ?? aliases.join(", ")

  // Theme color picker state
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!pickerOpen) return
    const onClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false)
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [pickerOpen])

  const activePresetLabel = themeColor
    ? ARTICLE_THEME_PRESETS.find(
        (p) => p.value?.light?.toLowerCase() === themeColor.light?.toLowerCase(),
      )?.label
    : "Default"

  const wrapperStyle: CSSProperties = themeColorBg
    ? {
        backgroundColor: `var(--wiki-theme-active, ${themeColor!.light})`,
        padding: "1rem 1.25rem",
        borderRadius: "0.5rem",
      }
    : {}

  return (
    <header
      className={cn(
        "wiki-title-area group/title relative mb-6",
        alignment === "center" ? "text-center" : "text-left",
        className,
      )}
      style={wrapperStyle}
      data-size={size}
      data-alignment={alignment}
    >
      {/* Article theme color picker — paint-bucket on hover */}
      {editable && onThemeColorChange && (
        <div className="absolute right-0 top-1 z-10" ref={pickerRef}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setPickerOpen((v) => !v) }}
            title={themeColor ? `Article theme: ${activePresetLabel ?? "Custom"}` : "Set article theme"}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
              pickerOpen || themeColor
                ? "text-foreground bg-hover-bg"
                : "text-muted-foreground/40 opacity-0 group-hover/title:opacity-100 hover:bg-hover-bg hover:text-foreground",
            )}
          >
            <PaintBucket size={14} weight="regular" />
          </button>
          {pickerOpen && (
            <div
              className="absolute right-0 top-full mt-1 rounded-lg border border-border-subtle bg-popover p-2 shadow-md"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                Article theme
              </div>
              <div className="grid grid-cols-5 gap-1">
                {ARTICLE_THEME_PRESETS.map((preset) => {
                  const isActive =
                    (preset.value === null && !themeColor) ||
                    (preset.value && themeColor && preset.value.light.toLowerCase() === themeColor.light.toLowerCase())
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        onThemeColorChange(preset.value)
                        setPickerOpen(false)
                      }}
                      title={preset.label}
                      className={cn(
                        "h-6 w-6 rounded-md border transition-transform hover:scale-110",
                        isActive ? "border-foreground ring-1 ring-foreground" : "border-border-subtle",
                        preset.value === null && "bg-transparent",
                      )}
                      style={preset.value ? { backgroundColor: preset.swatch } : undefined}
                    >
                      {preset.value === null && (
                        <span className="block h-full w-full rounded-[inherit] bg-gradient-to-br from-transparent via-border-subtle to-transparent" />
                      )}
                    </button>
                  )
                })}
                <label
                  className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border border-border-subtle bg-gradient-to-br from-red-400 via-yellow-300 to-blue-400 hover:scale-110 transition-transform"
                  title="Custom color"
                >
                  <input
                    type="color"
                    value={themeColor?.light && /^#/.test(themeColor.light) ? themeColor.light : "#5e6ad2"}
                    onChange={(e) => {
                      const next = hexToWikiTheme(e.target.value)
                      if (next) onThemeColorChange(next)
                    }}
                    className="pointer-events-none h-0 w-0 opacity-0"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {editable && onTitleChange ? (
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Untitled"
          className={cn(
            "wiki-title-input w-full bg-transparent font-bold text-foreground outline-none",
            "border-b border-transparent focus:border-border",
            SIZE_CLASSES[size],
            alignment === "center" && "text-center",
            // Leave room for paint-bucket on the right
            editable && onThemeColorChange && "pr-9",
          )}
        />
      ) : (
        <h1
          className={cn(
            "wiki-title font-bold text-foreground",
            SIZE_CLASSES[size],
          )}
        >
          {title || "Untitled"}
        </h1>
      )}

      {showAliases && (
        editable && onAliasesChange ? (
          <input
            value={aliasDisplay}
            onChange={(e) => setAliasDraft(e.target.value)}
            onBlur={() => {
              if (aliasDraft !== null) {
                const next = aliasDraft
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
                onAliasesChange(next)
                setAliasDraft(null)
              }
            }}
            placeholder="Aliases (comma-separated)"
            className={cn(
              "mt-1 w-full bg-transparent text-note text-muted-foreground outline-none",
              "border-b border-transparent focus:border-border",
              alignment === "center" && "text-center",
            )}
          />
        ) : (
          <p className="mt-1 text-note text-muted-foreground">
            {aliases.join(" · ")}
          </p>
        )
      )}
    </header>
  )
}
