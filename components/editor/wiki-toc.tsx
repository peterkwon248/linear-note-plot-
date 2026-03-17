"use client"

import { useState, useMemo, useCallback } from "react"
import { ChevronDown, ChevronRight, List } from "lucide-react"
import { cn } from "@/lib/utils"

interface TOCHeading {
  id: string
  level: number
  text: string
  index: number
}

interface WikiTOCProps {
  content: string
  onScrollTo?: (headingIndex: number) => void
  className?: string
}

function extractHeadingsFromContent(content: string): TOCHeading[] {
  const lines = content.split("\n")
  const headings: TOCHeading[] = []
  let idx = 0
  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)/)
    if (match) {
      headings.push({
        id: `toc-${idx}`,
        level: match[1].length,
        text: match[2].trim(),
        index: idx,
      })
      idx++
    }
  }
  return headings
}

export function WikiTOC({ content, onScrollTo, className }: WikiTOCProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const headings = useMemo(() => extractHeadingsFromContent(content), [content])

  const handleClick = useCallback(
    (heading: TOCHeading) => {
      setActiveIndex(heading.index)
      onScrollTo?.(heading.index)
    },
    [onScrollTo],
  )

  if (headings.length === 0) return null

  // Normalize levels: find minimum level and subtract
  const minLevel = Math.min(...headings.map((h) => h.level))

  return (
    <div className={cn("rounded-lg border border-border bg-card/50 p-3", className)}>
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="flex w-full items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
        <List className="h-3.5 w-3.5" />
        Contents
        <span className="ml-auto text-2xs font-normal tabular-nums text-muted-foreground/60">
          {headings.length}
        </span>
      </button>

      {!collapsed && (
        <nav className="mt-2 space-y-0.5">
          {headings.map((h) => (
            <button
              key={h.id}
              onClick={() => handleClick(h)}
              className={cn(
                "flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-note transition-colors",
                activeIndex === h.index
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
              )}
              style={{ paddingLeft: `${(h.level - minLevel) * 12 + 8}px` }}
            >
              <span className="shrink-0 text-[10px] font-mono text-muted-foreground/40">
                {"H" + h.level}
              </span>
              <span className="truncate">{h.text}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}
