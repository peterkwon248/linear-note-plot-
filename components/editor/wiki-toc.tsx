"use client"

import { useState, useMemo, useCallback } from "react"
import { cn } from "@/lib/utils"

interface TOCHeading {
  id: string
  level: number
  text: string
  index: number
  sectionNumber: string
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
        sectionNumber: "", // will be computed below
      })
      idx++
    }
  }
  return headings
}

/**
 * Compute hierarchical section numbers like 1, 2, 2.1, 2.2, 3, 3.1.1
 * H2 = top level, H3 = sub, H4 = sub-sub, etc.
 */
function assignSectionNumbers(headings: TOCHeading[]): TOCHeading[] {
  if (headings.length === 0) return headings

  const minLevel = Math.min(...headings.map((h) => h.level))
  // counters[0] = top-level counter, counters[1] = sub, etc.
  const counters: number[] = []

  return headings.map((h) => {
    const depth = h.level - minLevel
    // Ensure counters array is long enough
    while (counters.length <= depth) counters.push(0)
    // Increment current depth counter
    counters[depth]++
    // Reset all deeper counters
    for (let i = depth + 1; i < counters.length; i++) {
      counters[i] = 0
    }
    // Build section number string
    const parts = counters.slice(0, depth + 1)
    const sectionNumber = parts.join(".")
    return { ...h, sectionNumber }
  })
}

export function WikiTOC({ content, onScrollTo, className }: WikiTOCProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const rawHeadings = useMemo(() => extractHeadingsFromContent(content), [content])
  const headings = useMemo(() => assignSectionNumbers(rawHeadings), [rawHeadings])

  const handleClick = useCallback(
    (heading: TOCHeading) => {
      setActiveIndex(heading.index)
      onScrollTo?.(heading.index)
    },
    [onScrollTo],
  )

  if (headings.length === 0) return null

  const minLevel = Math.min(...headings.map((h) => h.level))

  return (
    <div className={cn("", className)}>
      <h4 className="text-2xs text-muted-foreground uppercase tracking-wider mb-2">
        Contents
      </h4>

      <nav className="space-y-0.5">
        {headings.map((h) => (
          <button
            key={h.id}
            onClick={() => handleClick(h)}
            className={cn(
              "flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-note transition-colors duration-150",
              activeIndex === h.index
                ? "border-l-2 border-accent text-accent bg-accent/5 font-medium"
                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
            )}
            style={{ paddingLeft: `${(h.level - minLevel) * 12 + 8}px` }}
          >
            <span className="shrink-0 text-accent font-semibold text-2xs">
              {h.sectionNumber}.
            </span>
            <span className="truncate">{h.text}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
