"use client"

/**
 * WikiTitle — Phase 2-1A.
 *
 * Renders `article.title + aliases` per `WikiTitleStyle` (alignment / size /
 * showAliases / themeColorBg). Lives ABOVE the column area (fixed at top of
 * article) — never inside a column. Mirrors 위키백과/나무위키 convention.
 *
 * Phase 2-1A: stand-alone component. Phase 2-1B: replaces hand-rolled title
 * blocks in wiki-article-view.tsx + wiki-article-encyclopedia.tsx.
 *
 * Editing: when `editable` + `onTitleChange`/`onAliasesChange` provided, title
 * becomes a text input and aliases become a comma-separated input below.
 */

import { useState, type CSSProperties } from "react"
import type { WikiTitleStyle, WikiThemeColor } from "@/lib/types"
import { cn } from "@/lib/utils"

export interface WikiTitleProps {
  title: string
  aliases?: string[]
  titleStyle?: WikiTitleStyle
  themeColor?: WikiThemeColor
  editable?: boolean
  onTitleChange?: (next: string) => void
  onAliasesChange?: (next: string[]) => void
  className?: string
}

const SIZE_CLASSES = {
  default: "text-[1.75em]",
  large: "text-[2.25em]",
  hero: "text-[3em]",
} as const

export function WikiTitle({
  title,
  aliases = [],
  titleStyle,
  themeColor,
  editable = false,
  onTitleChange,
  onAliasesChange,
  className,
}: WikiTitleProps) {
  const alignment = titleStyle?.alignment ?? "left"
  const size = titleStyle?.size ?? "default"
  const showAliases = titleStyle?.showAliases !== false && aliases.length > 0
  const themeColorBg = titleStyle?.themeColorBg && themeColor

  // Aliases input mirrors a draft string so users can type freely (commas, spaces).
  const [aliasDraft, setAliasDraft] = useState<string | null>(null)
  const aliasDisplay = aliasDraft ?? aliases.join(", ")

  const wrapperStyle: CSSProperties = themeColorBg
    ? {
        // var(--wiki-theme-active) is set by an enclosing <WikiThemeProvider>
        // which auto-cascades light/dark via globals.css `.wiki-theme-scope`.
        // Fallback to the article's own light value if no provider in scope.
        backgroundColor: `var(--wiki-theme-active, ${themeColor!.light})`,
        padding: "1rem 1.25rem",
        borderRadius: "0.5rem",
      }
    : {}

  return (
    <header
      className={cn(
        "wiki-title-area mb-6",
        alignment === "center" ? "text-center" : "text-left",
        className,
      )}
      style={wrapperStyle}
      data-size={size}
      data-alignment={alignment}
    >
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
