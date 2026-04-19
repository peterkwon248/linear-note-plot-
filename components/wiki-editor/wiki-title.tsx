"use client"

/**
 * WikiTitle — Phase 2-1A.
 *
 * Renders `article.title + aliases` per `WikiTitleStyle`. Lives ABOVE the
 * column area (fixed at top of article) — never inside a card. Mirrors
 * 위키백과/나무위키 convention.
 *
 * 2026-04-19 Pivot: article-level theme color picker 제거. 다크모드 중심 Linear
 * 스타일로 회귀 — 배경색 없음. `onThemeColorChange`/`themeColor` prop 은 caller
 * 호환을 위해 남겨두지만 UI 는 렌더하지 않는다.
 */

import { useState } from "react"
import type { WikiTitleStyle, WikiThemeColor } from "@/lib/types"
import { cn } from "@/lib/utils"

export interface WikiTitleProps {
  title: string
  aliases?: string[]
  titleStyle?: WikiTitleStyle
  /** @deprecated 2026-04-19 — theme color 시스템 폐기. 무시됨. */
  themeColor?: WikiThemeColor
  editable?: boolean
  onTitleChange?: (next: string) => void
  onAliasesChange?: (next: string[]) => void
  /** @deprecated 2026-04-19 — theme color 시스템 폐기. 무시됨. */
  onThemeColorChange?: (next: WikiThemeColor | null) => void
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
  editable = false,
  onTitleChange,
  onAliasesChange,
  className,
}: WikiTitleProps) {
  const alignment = titleStyle?.alignment ?? "left"
  const size = titleStyle?.size ?? "default"
  const showAliases = titleStyle?.showAliases !== false && aliases.length > 0

  // Aliases input mirrors a draft string so users can type freely (commas, spaces).
  const [aliasDraft, setAliasDraft] = useState<string | null>(null)
  const aliasDisplay = aliasDraft ?? aliases.join(", ")

  return (
    <header
      className={cn(
        "wiki-title-area relative mb-6",
        alignment === "center" ? "text-center" : "text-left",
        className,
      )}
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
