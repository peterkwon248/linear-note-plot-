"use client"

/**
 * SecondaryOpenPicker — modal dialog for opening a note or wiki article in the
 * secondary (right) split pane. Triggered by Cmd+Shift+\ shortcut or programmatic
 * `setSecondaryPickerOpen(true)`.
 *
 * Sections:
 *  - Search input (autofocused) — type to search notes/wiki by title
 *  - Pinned (max 5) — user favorites, persisted across sessions
 *  - Suggested / Related — context-aware (backlinks/outlinks of current note)
 *  - Recent — derived from secondaryHistory
 *
 * Selecting any row calls `openInSecondary(id)` and closes the dialog.
 */

import { useEffect, useMemo, useRef, useState } from "react"
import { usePlotStore } from "@/lib/store"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  searchSecondaryEntities,
  resolveSecondaryEntity,
  isSecondaryEntityAlive,
  type SecondaryEntityRef,
  type SecondaryEntitySearchResult,
} from "@/lib/workspace/entity-search"
import {
  getSecondarySuggestions,
  getSecondarySuggestionsLabel,
} from "@/lib/workspace/secondary-suggestions"
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass"
import { PushPinSimple } from "@phosphor-icons/react/dist/ssr/PushPinSimple"
import { Clock } from "@phosphor-icons/react/dist/ssr/Clock"
import { Sparkle } from "@phosphor-icons/react/dist/ssr/Sparkle"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { IconWiki } from "@/components/plot-icons"
import { StatusShapeIcon } from "@/components/status-icon"
import { WIKI_STATUS_HEX } from "@/lib/colors"
import type { NoteStatus } from "@/lib/types"

/**
 * Type-aware entity icon:
 *  - note → workflow status shape (cyan/orange/green)
 *  - wiki → violet book icon
 */
function EntityIcon({
  type,
  status,
}: {
  type: SecondaryEntityRef["type"]
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
  return <StatusShapeIcon status={status ?? "capture"} size={14} />
}

export function SecondaryOpenPicker() {
  const open = usePlotStore((s) => s.secondaryPickerOpen)
  const setOpen = usePlotStore((s) => s.setSecondaryPickerOpen)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="sm:max-w-lg p-0 gap-0 overflow-hidden"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Open in side panel</DialogTitle>
        {open && <PickerBody onClose={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function PickerBody({ onClose }: { onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)

  const openInSecondary = usePlotStore((s) => s.openInSecondary)
  const toggleSecondaryPin = usePlotStore((s) => s.toggleSecondaryPin)
  const secondaryHistory = usePlotStore((s) => s.secondaryHistory)
  const secondaryPins = usePlotStore((s) => s.secondaryPins)
  // Reactive deps for memos so list refreshes as data changes
  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)

  // Autofocus on mount
  useEffect(() => {
    const id = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [])

  // Convert secondaryHistory (string[] of IDs) → SecondaryEntityRef[] by lookup
  const aliveHistory = useMemo<SecondaryEntityRef[]>(() => {
    const seen = new Set<string>()
    const refs: SecondaryEntityRef[] = []
    // newest first
    for (const id of [...secondaryHistory].reverse()) {
      if (seen.has(id)) continue
      seen.add(id)
      if (notes.some((n) => n.id === id && !n.trashed)) {
        refs.push({ type: "note", id })
      } else if (wikiArticles.some((w) => w.id === id)) {
        refs.push({ type: "wiki", id })
      }
      if (refs.length >= 10) break
    }
    return refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondaryHistory, notes, wikiArticles])

  // Filter dead entries from stored pins
  const alivePins = useMemo<SecondaryEntityRef[]>(
    () => secondaryPins.filter(isSecondaryEntityAlive),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [secondaryPins, notes, wikiArticles],
  )

  // Search results when query is non-empty
  const results = useMemo<SecondaryEntitySearchResult[]>(() => {
    if (query.trim().length === 0) return []
    return searchSecondaryEntities(query)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, notes, wikiArticles])

  // Contextual suggestions — exclude items already in pinned/recent
  const suggestions = useMemo(() => {
    const pinnedKeys = new Set(alivePins.map((p) => `${p.type}:${p.id}`))
    const historyKeys = new Set(aliveHistory.map((h) => `${h.type}:${h.id}`))
    const exclude = [...alivePins, ...aliveHistory]
    const raw = getSecondarySuggestions({ currentNoteId: selectedNoteId, exclude, limit: 6 })
    return raw.filter((ref) => {
      const key = `${ref.type}:${ref.id}`
      return !pinnedKeys.has(key) && !historyKeys.has(key)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNoteId, alivePins, aliveHistory, notes, wikiArticles])

  const suggestionsLabel = useMemo(
    () => getSecondarySuggestionsLabel(selectedNoteId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedNoteId, notes],
  )

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const isSearching = query.trim().length > 0

  function handleSelect(ref: SecondaryEntityRef) {
    openInSecondary(ref.id)
    onClose()
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
    <div className="flex flex-col max-h-[60vh]">
      {/* Search input */}
      <div className="relative border-b border-border-subtle px-3 py-2.5">
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
          placeholder="Search notes and wiki to open in side panel..."
          className="w-full rounded-md border border-transparent bg-hover-bg/40 pl-7 pr-2 py-1.5 text-note text-foreground placeholder:text-muted-foreground/50 focus:border-border focus:bg-background focus:outline-none"
        />
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {isSearching ? (
          <SearchResults
            results={results}
            selectedIndex={selectedIndex}
            onSelect={(ref) => handleSelect(ref)}
            onHover={(i) => setSelectedIndex(i)}
          />
        ) : (
          <>
            <PinsSection
              pins={alivePins}
              onSelect={handleSelect}
              onUnpin={(ref) => toggleSecondaryPin(ref)}
            />
            <SuggestedSection
              label={suggestionsLabel}
              items={suggestions}
              onSelect={handleSelect}
              onPin={(ref) => toggleSecondaryPin(ref)}
            />
            <RecentSection
              history={aliveHistory}
              pinned={alivePins}
              onSelect={handleSelect}
              onPin={(ref) => toggleSecondaryPin(ref)}
            />
            {alivePins.length === 0 && suggestions.length === 0 && aliveHistory.length === 0 && (
              <div className="flex h-32 items-center justify-center px-6 text-note text-muted-foreground/70">
                Start typing to search notes and wiki
              </div>
            )}
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

function PickerRow({
  ref: ref_,
  active,
  onSelect,
  onHover,
  action,
}: {
  ref: SecondaryEntityRef
  active?: boolean
  onSelect: () => void
  onHover?: () => void
  action?: React.ReactNode
}) {
  const entity = resolveSecondaryEntity(ref_)
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
      <EntityIcon type={ref_.type} status={status} />
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
  pins: SecondaryEntityRef[]
  onSelect: (ref: SecondaryEntityRef) => void
  onUnpin: (ref: SecondaryEntityRef) => void
}) {
  if (pins.length === 0) return null
  return (
    <div>
      <SectionLabel icon={<PushPinSimple size={11} weight="fill" />}>Pinned</SectionLabel>
      <div className="space-y-0.5 pb-2">
        {pins.map((p) => (
          <PickerRow
            key={`${p.type}:${p.id}`}
            ref={p}
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
}: {
  history: SecondaryEntityRef[]
  pinned: SecondaryEntityRef[]
  onSelect: (ref: SecondaryEntityRef) => void
  onPin: (ref: SecondaryEntityRef) => void
}) {
  // Exclude items currently pinned — pinned section already shows them
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
            <PickerRow
              key={key}
              ref={h}
              onSelect={() => onSelect(h)}
              action={
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onPin(h)
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

function SuggestedSection({
  label,
  items,
  onSelect,
  onPin,
}: {
  label: "Related" | "Suggested"
  items: SecondaryEntityRef[]
  onSelect: (ref: SecondaryEntityRef) => void
  onPin: (ref: SecondaryEntityRef) => void
}) {
  if (items.length === 0) return null
  return (
    <div>
      <SectionLabel icon={<Sparkle size={11} weight="fill" />}>{label}</SectionLabel>
      <div className="space-y-0.5 pb-3">
        {items.map((ref) => {
          const key = `${ref.type}:${ref.id}`
          return (
            <PickerRow
              key={key}
              ref={ref}
              onSelect={() => onSelect(ref)}
              action={
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onPin(ref)
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
  results: SecondaryEntitySearchResult[]
  selectedIndex: number
  onSelect: (ref: SecondaryEntityRef) => void
  onHover: (i: number) => void
}) {
  if (results.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-6 py-8 text-note text-muted-foreground/70">
        No matches
      </div>
    )
  }

  // Group by type while preserving global index for keyboard navigation
  const notes: Array<{ item: SecondaryEntitySearchResult; index: number }> = []
  const wikis: Array<{ item: SecondaryEntitySearchResult; index: number }> = []
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
              <PickerRow
                key={`${r.type}:${r.id}`}
                ref={{ type: r.type, id: r.id }}
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
              <PickerRow
                key={`${r.type}:${r.id}`}
                ref={{ type: r.type, id: r.id }}
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
