"use client"

/**
 * PeekEmptyState — shown when Peek tab is active but nothing is currently peeked.
 * Provides:
 *  - Search input (autofocused) to open any note/wiki
 *  - Pinned section (max 2) — user favorites
 *  - Recent section (max 10) — peekHistory
 *
 * When the user picks a result, openSidePeek is called with the matching PeekContext.
 */

import { useEffect, useMemo, useRef, useState } from "react"
import { usePlotStore } from "@/lib/store"
import type { PeekContext } from "@/lib/store/types"
import {
  searchPeekable,
  resolvePeekEntity,
  isPeekEntityAlive,
  type PeekSearchResult,
} from "@/lib/peek/peek-search"
import {
  getPeekSuggestions,
  getPeekSuggestionsLabel,
} from "@/lib/peek/peek-suggestions"
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass"
import { PushPinSimple } from "@phosphor-icons/react/dist/ssr/PushPinSimple"
import { Clock } from "@phosphor-icons/react/dist/ssr/Clock"
import { Sparkle } from "@phosphor-icons/react/dist/ssr/Sparkle"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { IconWiki } from "@/components/plot-icons"
import { StatusShapeIcon } from "@/components/status-icon"
import { WIKI_STATUS_HEX } from "@/lib/colors"
import type { NoteStatus } from "@/lib/types"

interface Props {
  /** Optional — passed when empty state is rendered as a full pane (stretch vertically). */
  className?: string
}

/**
 * Type-aware entity icon:
 *  - note → workflow status shape (cyan/orange/green)
 *  - wiki → violet book icon (matches --wiki-complete)
 */
function EntityIcon({
  type,
  status,
}: {
  type: PeekContext["type"]
  status?: NoteStatus
}) {
  if (type === "wiki") {
    return (
      <IconWiki
        size={14}
        className="shrink-0"
        style={{ color: WIKI_STATUS_HEX.article }}
      />
    )
  }
  // note
  return <StatusShapeIcon status={status ?? "capture"} size={14} />
}

export function PeekEmptyState({ className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)

  const openSidePeek = usePlotStore((s) => s.openSidePeek)
  const togglePeekPin = usePlotStore((s) => s.togglePeekPin)
  const removeFromPeekHistory = usePlotStore((s) => s.removeFromPeekHistory)
  const peekHistory = usePlotStore((s) => s.peekHistory)
  const peekPins = usePlotStore((s) => s.peekPins)
  // Needed so suggestions refresh as note content changes (linksOut re-compute)
  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)

  // Autofocus on mount
  useEffect(() => {
    const id = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [])

  // Fresh search results whenever query changes. When query is empty, show curated list
  // with pins + recent inline; when query is non-empty, show search results.
  const results = useMemo<PeekSearchResult[]>(() => {
    if (query.trim().length === 0) return []
    return searchPeekable(query)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, notes, wikiArticles])

  // Filter out dead entries from stored history/pins
  const alivePins = useMemo(
    () => peekPins.filter(isPeekEntityAlive),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [peekPins, notes, wikiArticles],
  )
  const aliveHistory = useMemo(
    () => peekHistory.filter(isPeekEntityAlive).slice(0, 10),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [peekHistory, notes, wikiArticles],
  )

  // Contextual suggestions — exclude items already shown in Pinned / Recent sections
  const suggestions = useMemo(() => {
    const pinnedKeys = new Set(alivePins.map((p) => `${p.type}:${p.id}`))
    const historyKeys = new Set(aliveHistory.map((h) => `${h.type}:${h.id}`))
    const exclude = [...alivePins, ...aliveHistory]
    const raw = getPeekSuggestions({ currentNoteId: selectedNoteId, exclude, limit: 6 })
    return raw.filter((ctx) => {
      const key = `${ctx.type}:${ctx.id}`
      return !pinnedKeys.has(key) && !historyKeys.has(key)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNoteId, alivePins, aliveHistory, notes, wikiArticles])

  const suggestionsLabel = useMemo(
    () => getPeekSuggestionsLabel(selectedNoteId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedNoteId, notes],
  )

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const isSearching = query.trim().length > 0

  function handleSelect(ctx: PeekContext) {
    openSidePeek(ctx)
    setQuery("")
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isSearching || results.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((i) => (i + 1) % results.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((i) => (i - 1 + results.length) % results.length)
    } else if (e.key === "Enter") {
      e.preventDefault()
      const picked = results[selectedIndex]
      if (picked) handleSelect({ type: picked.type, id: picked.id })
    }
  }

  return (
    <div className={`flex h-full flex-col overflow-hidden ${className ?? ""}`}>
      {/* Search input */}
      <div className="relative border-b border-border-subtle px-3 py-2">
        <MagnifyingGlass
          size={14}
          className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground/60"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search notes and wiki..."
          className="w-full rounded-md border border-transparent bg-hover-bg/40 pl-7 pr-2 py-1.5 text-note text-foreground placeholder:text-muted-foreground/50 focus:border-border focus:bg-background focus:outline-none"
        />
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {isSearching ? (
          <SearchResults
            results={results}
            selectedIndex={selectedIndex}
            onSelect={(ctx) => handleSelect(ctx)}
            onHover={(i) => setSelectedIndex(i)}
          />
        ) : (
          <>
            <PinsSection
              pins={alivePins}
              onSelect={handleSelect}
              onUnpin={(ctx) => togglePeekPin(ctx)}
            />
            <SuggestedSection
              label={suggestionsLabel}
              items={suggestions}
              onSelect={handleSelect}
              onPin={(ctx) => togglePeekPin(ctx)}
            />
            <RecentSection
              history={aliveHistory}
              pinned={alivePins}
              onSelect={handleSelect}
              onPin={(ctx) => togglePeekPin(ctx)}
              onRemove={(ctx) => removeFromPeekHistory(ctx)}
            />
          </>
        )}
      </div>

    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({
  icon,
  children,
}: {
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-1.5 px-3 pt-3 pb-1 text-2xs font-semibold uppercase tracking-wide text-muted-foreground/60">
      {icon}
      {children}
    </div>
  )
}

function PeekRow({
  ctx,
  active,
  onSelect,
  onHover,
  action,
}: {
  ctx: PeekContext
  active?: boolean
  onSelect: () => void
  onHover?: () => void
  action?: React.ReactNode
}) {
  const entity = resolvePeekEntity(ctx)
  if (!entity) return null
  const status = entity.kind === "note" ? entity.status : undefined
  return (
    <div
      className={`group flex items-center gap-2 px-3 py-1 mx-1 rounded-md cursor-pointer transition-colors ${
        active ? "bg-active-bg" : "hover:bg-hover-bg"
      }`}
      onClick={onSelect}
      onMouseEnter={onHover}
      role="button"
    >
      <EntityIcon type={ctx.type} status={status} />
      <span className="flex-1 truncate text-note text-foreground">{entity.title}</span>
      {action}
    </div>
  )
}

function PinsSection({
  pins,
  onSelect,
  onUnpin,
}: {
  pins: PeekContext[]
  onSelect: (ctx: PeekContext) => void
  onUnpin: (ctx: PeekContext) => void
}) {
  if (pins.length === 0) return null
  return (
    <div>
      <SectionLabel icon={<PushPinSimple size={11} weight="fill" />}>Pinned</SectionLabel>
      <div className="space-y-0.5 pb-2">
        {pins.map((p) => (
          <PeekRow
            key={`${p.type}:${p.id}`}
            ctx={p}
            onSelect={() => onSelect(p)}
            action={
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onUnpin(p)
                }}
                className="opacity-0 group-hover:opacity-100 rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-background/50 transition-opacity"
                title="Unpin"
              >
                <PhX size={12} weight="regular" />
              </button>
            }
          />
        ))}
      </div>
    </div>
  )
}

function RecentSection({
  history,
  pinned,
  onSelect,
  onPin,
  onRemove,
}: {
  history: PeekContext[]
  pinned: PeekContext[]
  onSelect: (ctx: PeekContext) => void
  onPin: (ctx: PeekContext) => void
  onRemove: (ctx: PeekContext) => void
}) {
  // Exclude items that are currently pinned — pinned section already shows them
  const pinnedKeys = new Set(pinned.map((p) => `${p.type}:${p.id}`))
  const filtered = history.filter((h) => !pinnedKeys.has(`${h.type}:${h.id}`))
  if (filtered.length === 0) return null
  return (
    <div>
      <SectionLabel icon={<Clock size={11} weight="regular" />}>Recent</SectionLabel>
      <div className="space-y-0.5 pb-3">
        {filtered.map((h) => {
          const key = `${h.type}:${h.id}`
          return (
            <PeekRow
              key={key}
              ctx={h}
              onSelect={() => onSelect(h)}
              action={
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onPin(h)
                    }}
                    className="rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-background/50"
                    title="Pin"
                  >
                    <PushPinSimple size={12} weight="regular" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemove(h)
                    }}
                    className="rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-background/50"
                    title="Remove from history"
                  >
                    <PhX size={12} weight="regular" />
                  </button>
                </div>
              }
            />
          )
        })}
      </div>
    </div>
  )
}

function SuggestedSection({
  label,
  items,
  onSelect,
  onPin,
}: {
  label: "Related" | "Suggested"
  items: PeekContext[]
  onSelect: (ctx: PeekContext) => void
  onPin: (ctx: PeekContext) => void
}) {
  if (items.length === 0) return null
  return (
    <div>
      <SectionLabel icon={<Sparkle size={11} weight="fill" />}>{label}</SectionLabel>
      <div className="space-y-0.5 pb-3">
        {items.map((ctx) => {
          const key = `${ctx.type}:${ctx.id}`
          return (
            <PeekRow
              key={key}
              ctx={ctx}
              onSelect={() => onSelect(ctx)}
              action={
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onPin(ctx)
                  }}
                  className="opacity-0 group-hover:opacity-100 rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-background/50 transition-opacity"
                  title="Pin"
                >
                  <PushPinSimple size={12} weight="regular" />
                </button>
              }
            />
          )
        })}
      </div>
    </div>
  )
}

function SearchResults({
  results,
  selectedIndex,
  onSelect,
  onHover,
}: {
  results: PeekSearchResult[]
  selectedIndex: number
  onSelect: (ctx: PeekContext) => void
  onHover: (i: number) => void
}) {
  if (results.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-6 py-8 text-note text-muted-foreground/70">
        No matches
      </div>
    )
  }

  // Group by type. peek-search returns notes first then wikis, so the flat
  // `results` index matches (notes at the top of the list, wikis after).
  // This lets us preserve selectedIndex navigation across the whole result set.
  const notes: Array<{ item: PeekSearchResult; index: number }> = []
  const wikis: Array<{ item: PeekSearchResult; index: number }> = []
  results.forEach((r, i) => {
    if (r.type === "wiki") wikis.push({ item: r, index: i })
    else notes.push({ item: r, index: i })
  })

  return (
    <div className="pb-2">
      {notes.length > 0 && (
        <div>
          <SectionLabel>Notes</SectionLabel>
          <div className="space-y-0.5">
            {notes.map(({ item: r, index: i }) => (
              <PeekRow
                key={`${r.type}:${r.id}`}
                ctx={{ type: r.type, id: r.id }}
                active={i === selectedIndex}
                onSelect={() => onSelect({ type: r.type, id: r.id })}
                onHover={() => onHover(i)}
              />
            ))}
          </div>
        </div>
      )}
      {wikis.length > 0 && (
        <div>
          <SectionLabel>Wiki</SectionLabel>
          <div className="space-y-0.5">
            {wikis.map(({ item: r, index: i }) => (
              <PeekRow
                key={`${r.type}:${r.id}`}
                ctx={{ type: r.type, id: r.id }}
                active={i === selectedIndex}
                onSelect={() => onSelect({ type: r.type, id: r.id })}
                onHover={() => onHover(i)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

