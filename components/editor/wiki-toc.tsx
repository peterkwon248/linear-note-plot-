"use client"

import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus"

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
  /** Called with (sectionTitle, level) when user adds a new section */
  onAddSection?: (title: string, level: number) => void
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
        sectionNumber: "",
      })
      idx++
    }
  }
  return headings
}

function assignSectionNumbers(headings: TOCHeading[]): TOCHeading[] {
  if (headings.length === 0) return headings

  const minLevel = Math.min(...headings.map((h) => h.level))
  const counters: number[] = []

  return headings.map((h) => {
    const depth = h.level - minLevel
    while (counters.length <= depth) counters.push(0)
    counters[depth]++
    for (let i = depth + 1; i < counters.length; i++) {
      counters[i] = 0
    }
    const parts = counters.slice(0, depth + 1)
    const sectionNumber = parts.join(".")
    return { ...h, sectionNumber }
  })
}

export function WikiTOC({ content, onScrollTo, onAddSection, className }: WikiTOCProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const rawHeadings = useMemo(() => extractHeadingsFromContent(content), [content])
  const headings = useMemo(() => assignSectionNumbers(rawHeadings), [rawHeadings])

  // Inline add state
  const [addingLevel, setAddingLevel] = useState<number | null>(null)
  const [newTitle, setNewTitle] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (addingLevel !== null) inputRef.current?.focus()
  }, [addingLevel])

  const handleClick = useCallback(
    (heading: TOCHeading) => {
      setActiveIndex(heading.index)
      onScrollTo?.(heading.index)
    },
    [onScrollTo],
  )

  const handleSubmitNew = useCallback(() => {
    if (!newTitle.trim() || addingLevel === null) return
    onAddSection?.(newTitle.trim(), addingLevel)
    setNewTitle("")
    setAddingLevel(null)
  }, [newTitle, addingLevel, onAddSection])

  const handleCancelAdd = useCallback(() => {
    setNewTitle("")
    setAddingLevel(null)
  }, [])

  if (headings.length === 0 && !onAddSection) return null

  const minLevel = headings.length > 0 ? Math.min(...headings.map((h) => h.level)) : 2

  return (
    <div className={cn("", className)}>
      <h4 className="text-2xs text-muted-foreground uppercase tracking-wider mb-2">
        Contents
      </h4>

      {headings.length > 0 && (
        <nav className="space-y-0.5">
          {headings.map((h) => (
            <button
              key={h.id}
              onClick={() => handleClick(h)}
              className={cn(
                "flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-note transition-colors duration-150",
                activeIndex === h.index
                  ? "border-l-2 border-accent text-accent bg-accent/5 font-medium"
                  : "text-muted-foreground hover:bg-hover-bg hover:text-foreground",
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
      )}

      {headings.length === 0 && (
        <p className="px-2 text-2xs text-muted-foreground/40">No sections yet</p>
      )}

      {/* Inline add input */}
      {addingLevel !== null && (
        <div className="mt-1.5 px-1">
          <div className="flex items-center gap-1 rounded-md border border-accent/30 bg-background px-2 py-1">
            <span className="text-2xs text-accent/50 shrink-0">
              {addingLevel === 2 ? "##" : addingLevel === 3 ? "###" : "####"}
            </span>
            <input
              ref={inputRef}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmitNew()
                if (e.key === "Escape") handleCancelAdd()
              }}
              onBlur={() => { if (!newTitle.trim()) handleCancelAdd() }}
              placeholder={addingLevel === 2 ? "e.g. Background" : addingLevel === 3 ? "e.g. Key Points" : "e.g. Details"}
              className="flex-1 bg-transparent text-2xs text-foreground outline-none placeholder:text-muted-foreground/30"
            />
          </div>
        </div>
      )}

      {/* Add buttons */}
      {onAddSection && addingLevel === null && (
        <div className="mt-2 space-y-0.5">
          <button
            onClick={() => setAddingLevel(2)}
            className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-2xs text-muted-foreground/40 hover:text-muted-foreground hover:bg-hover-bg transition-colors duration-100"
          >
            <PhPlus size={12} weight="regular" />
            Section
          </button>
          <button
            onClick={() => setAddingLevel(3)}
            className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-2xs text-muted-foreground/30 hover:text-muted-foreground hover:bg-hover-bg transition-colors duration-100"
            style={{ paddingLeft: "20px" }}
          >
            <PhPlus size={10} weight="regular" />
            Subsection
          </button>
        </div>
      )}
    </div>
  )
}
