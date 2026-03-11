"use client"

import { useState, useMemo } from "react"
import { AlertCircle, AlertTriangle, Info, ChevronDown, ChevronUp, Lightbulb, SlidersHorizontal, LayoutList, LayoutGrid, Calendar } from "lucide-react"
import { usePlotStore } from "@/lib/store"
import { useSettingsStore } from "@/lib/settings-store"
import { useBacklinksIndex } from "@/lib/search/use-backlinks-index"
import { runAnalysis } from "@/lib/analysis/engine"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { AnalysisResult, AnalysisSeverity } from "@/lib/analysis/types"

/* ── Severity helpers ─────────────────────────────────── */

const SEVERITY_ORDER: Record<AnalysisSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
}

const SEVERITY_CONFIG: Record<AnalysisSeverity, {
  dot: string
  badge: string
  icon: typeof AlertCircle
}> = {
  critical: {
    dot: "bg-red-500",
    badge: "bg-red-500/15 text-red-400 border-red-500/20",
    icon: AlertCircle,
  },
  warning: {
    dot: "bg-amber-500",
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    icon: AlertTriangle,
  },
  info: {
    dot: "bg-blue-500",
    badge: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    icon: Info,
  },
}

/* ── InsightCard ──────────────────────────────────────── */

const INITIAL_SHOW = 5

function InsightCard({ result }: { result: AnalysisResult }) {
  const [expanded, setExpanded] = useState(false)
  const notes = usePlotStore((s) => s.notes)
  const openNote = usePlotStore((s) => s.openNote)

  const config = SEVERITY_CONFIG[result.severity]
  const Icon = config.icon

  const matchedNotes = useMemo(() => {
    const idSet = new Set(result.noteIds)
    return notes.filter((n) => idSet.has(n.id))
  }, [notes, result.noteIds])

  const visibleNotes = expanded ? matchedNotes : matchedNotes.slice(0, INITIAL_SHOW)
  const remaining = matchedNotes.length - INITIAL_SHOW

  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-4">
      {/* Header row */}
      <div className="flex items-start gap-3">
        <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${config.dot}`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-[14px] font-semibold text-foreground">{result.label}</span>
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${config.badge}`}>
              {result.count}
            </span>
          </div>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{result.description}</p>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Note list (collapsed by default — shows first 5) */}
      {(expanded || matchedNotes.length <= INITIAL_SHOW) && matchedNotes.length > 0 && (
        <div className="mt-3 space-y-1 pl-5">
          {visibleNotes.map((note) => (
            <button
              key={note.id}
              onClick={() => openNote(note.id)}
              className="block w-full truncate rounded px-2 py-1 text-left text-[13px] text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
            >
              {note.title || "Untitled"}
            </button>
          ))}
          {!expanded && remaining > 0 && (
            <button
              onClick={() => setExpanded(true)}
              className="px-2 py-1 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Show {remaining} more...
            </button>
          )}
        </div>
      )}

      {/* When collapsed and more than INITIAL_SHOW items, show clickable summary */}
      {!expanded && matchedNotes.length > INITIAL_SHOW && (
        <div className="mt-3 pl-5">
          <button
            onClick={() => setExpanded(true)}
            className="flex items-center gap-1 px-2 py-1 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronDown className="h-3 w-3" />
            Show {matchedNotes.length} notes...
          </button>
        </div>
      )}
    </div>
  )
}

/* ── InsightsView ─────────────────────────────────────── */

export function InsightsView() {
  const notes = usePlotStore((s) => s.notes)
  const srsMap = usePlotStore((s) => s.srsStateByNoteId)
  const backlinks = useBacklinksIndex()
  const viewMode = useSettingsStore((s) => s.viewMode)
  const setViewMode = useSettingsStore((s) => s.setViewMode)

  const results = useMemo(
    () => runAnalysis(notes, srsMap, backlinks),
    [notes, srsMap, backlinks],
  )

  const sorted = useMemo(
    () => [...results].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]),
    [results],
  )

  const counts = useMemo(() => {
    const c = { critical: 0, warning: 0, info: 0 }
    for (const r of results) c[r.severity] += 1
    return c
  }, [results])

  const total = results.length

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <Lightbulb className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-[16px] font-semibold text-foreground">Insights</h2>
          {total > 0 && (
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[12px] font-medium text-muted-foreground">
              {total} issue{total !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Display
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0" align="end">
            <div className="flex gap-1 px-3 py-2.5">
              <button
                onClick={() => setViewMode("table")}
                className={`flex flex-1 flex-col items-center gap-1 rounded-md py-2 text-[13px] font-medium transition-colors ${
                  viewMode === "table" || viewMode === "list"
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <LayoutList className="h-4 w-4" />
                List
              </button>
              <button
                onClick={() => setViewMode("board")}
                className={`flex flex-1 flex-col items-center gap-1 rounded-md py-2 text-[13px] font-medium transition-colors ${
                  viewMode === "board"
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
                Board
              </button>
              <button
                onClick={() => setViewMode("insights")}
                className={`flex flex-1 flex-col items-center gap-1 rounded-md py-2 text-[13px] font-medium transition-colors ${
                  viewMode === "insights"
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <Lightbulb className="h-4 w-4" />
                Insights
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className={`flex flex-1 flex-col items-center gap-1 rounded-md py-2 text-[13px] font-medium transition-colors ${
                  viewMode === "calendar"
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <Calendar className="h-4 w-4" />
                Calendar
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Summary chips */}
      {total > 0 && (
        <div className="flex items-center gap-2 border-b border-border px-6 py-3">
          {counts.critical > 0 && (
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium ${SEVERITY_CONFIG.critical.badge}`}>
              <span className={`h-2 w-2 rounded-full ${SEVERITY_CONFIG.critical.dot}`} />
              {counts.critical} critical
            </span>
          )}
          {counts.warning > 0 && (
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium ${SEVERITY_CONFIG.warning.badge}`}>
              <span className={`h-2 w-2 rounded-full ${SEVERITY_CONFIG.warning.dot}`} />
              {counts.warning} warning{counts.warning !== 1 ? "s" : ""}
            </span>
          )}
          {counts.info > 0 && (
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium ${SEVERITY_CONFIG.info.badge}`}>
              <span className={`h-2 w-2 rounded-full ${SEVERITY_CONFIG.info.dot}`} />
              {counts.info} info
            </span>
          )}
        </div>
      )}

      {/* Card list */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {total === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Lightbulb className="mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-[15px] font-medium text-foreground/70">All good! No issues detected.</p>
            <p className="mt-1 text-[13px] text-muted-foreground">Your notes are in great shape.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((result) => (
              <InsightCard key={result.ruleId} result={result} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
