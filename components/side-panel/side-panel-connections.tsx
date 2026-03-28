"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { Link as PhLink } from "@phosphor-icons/react/dist/ssr/Link"
import { Sparkle } from "@phosphor-icons/react/dist/ssr/Sparkle"
import { Check as PhCheck } from "@phosphor-icons/react/dist/ssr/Check"
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr/ArrowUpRight"
import { ArrowDownLeft } from "@phosphor-icons/react/dist/ssr/ArrowDownLeft"
import { Warning } from "@phosphor-icons/react/dist/ssr/Warning"
import { Graph } from "@phosphor-icons/react/dist/ssr/Graph"
import { cn } from "@/lib/utils"
import { usePlotStore } from "@/lib/store"
import { useState, useMemo } from "react"
import { useBacklinksFor } from "@/lib/search/use-backlinks-for"
import { suggestBacklinks } from "@/lib/backlinks"
import { RelationPicker } from "@/components/inspector/relation-picker"
import type { Relation, RelationType, RelationSuggestion } from "@/lib/types"
import { RELATION_TYPE_CONFIG, RELATION_TYPES, getRelationLabel } from "@/lib/relation-helpers"
import { detectUnlinkedMentions } from "@/lib/unlinked-mentions"
import { SidePanelDiscover } from "./side-panel-discover"

// ── Shared section component ──────────────────────────────────

function InspectorSection({
  title,
  icon,
  children,
  className,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("px-4 py-3", className)}>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-xs font-medium text-muted-foreground">
          {title}
        </span>
      </div>
      {children}
    </div>
  )
}

// ── Relation Row ──────────────────────────────────────────────

function RelationRow({
  relation,
  noteTitle,
  isSource,
  onNavigate,
  onRemove,
  onChangeType,
}: {
  relation: Relation
  noteTitle: string
  isSource: boolean
  onNavigate: () => void
  onRemove: () => void
  onChangeType: (type: RelationType) => void
}) {
  const label = getRelationLabel(relation.type, isSource)
  const config = RELATION_TYPE_CONFIG[relation.type]

  return (
    <div className="flex items-center gap-2 w-full px-1 py-0.5 rounded group hover:bg-secondary/50 transition-colors">
      {isSource ? (
        <ArrowUpRight className="shrink-0 text-muted-foreground/60" size={14} weight="regular" />
      ) : (
        <ArrowDownLeft className="shrink-0 text-muted-foreground/60" size={14} weight="regular" />
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="text-2xs px-1.5 py-0.5 rounded-sm font-medium shrink-0"
            style={{ color: config.color, backgroundColor: `${config.color}15` }}
          >
            {label}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[160px]">
          {RELATION_TYPES.map((t) => (
            <DropdownMenuItem
              key={t}
              onClick={() => onChangeType(t)}
              className="text-note"
            >
              <span
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: RELATION_TYPE_CONFIG[t].color }}
              />
              {getRelationLabel(t, isSource)}
              {t === relation.type && <PhCheck className="ml-auto" size={14} weight="bold" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <button
        onClick={onNavigate}
        className="text-note text-muted-foreground hover:text-foreground truncate flex-1 text-left"
      >
        {noteTitle || "Untitled"}
      </button>

      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/10 transition-opacity"
      >
        <PhX className="text-muted-foreground hover:text-destructive" size={12} weight="regular" />
      </button>
    </div>
  )
}

// ── Suggestion Row ────────────────────────────────────────────

function SuggestionRow({
  suggestion,
  noteTitle,
  onAccept,
  onDismiss,
}: {
  suggestion: RelationSuggestion
  noteTitle: string
  onAccept: (type: RelationType) => void
  onDismiss: () => void
}) {
  const [selectedType, setSelectedType] = useState<RelationType>(suggestion.suggestedType)
  const config = RELATION_TYPE_CONFIG[selectedType]

  return (
    <div className="flex items-center gap-2 px-1 py-0.5 rounded group hover:bg-secondary/50 transition-colors">
      <Sparkle className="shrink-0 text-chart-3" size={14} weight="regular" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="text-2xs px-1.5 py-0.5 rounded-sm font-medium shrink-0"
            style={{ color: config.color, backgroundColor: `${config.color}15` }}
          >
            {RELATION_TYPE_CONFIG[selectedType].label}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[160px]">
          {RELATION_TYPES.map((t) => (
            <DropdownMenuItem
              key={t}
              onClick={() => setSelectedType(t)}
              className="text-note"
            >
              <span
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: RELATION_TYPE_CONFIG[t].color }}
              />
              {RELATION_TYPE_CONFIG[t].label}
              {t === selectedType && <PhCheck className="ml-auto" size={14} weight="bold" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <span className="truncate flex-1 text-note text-muted-foreground">
        {noteTitle || "Untitled"}
      </span>
      <span className="text-2xs text-muted-foreground/40 shrink-0">
        {suggestion.reason}
      </span>
      <button
        onClick={() => onAccept(selectedType)}
        className="shrink-0 text-2xs text-green-500 opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
      >
        Accept
      </button>
      <button
        onClick={() => onDismiss()}
        className="shrink-0 text-2xs text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
      >
        Skip
      </button>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────

export function SidePanelConnections() {
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)
  const previewNoteId = usePlotStore((s) => s.previewNoteId)
  const noteId = selectedNoteId || previewNoteId
  const notes = usePlotStore((s) => s.notes)
  const openSidePeek = usePlotStore((s) => s.openSidePeek)
  const relations = usePlotStore((s) => s.relations)
  const addRelation = usePlotStore((s) => s.addRelation)
  const removeRelation = usePlotStore((s) => s.removeRelation)
  const updateRelationType = usePlotStore((s) => s.updateRelationType)
  const addWikiLink = usePlotStore((s) => s.addWikiLink)
  const relationSuggestions = usePlotStore((s) => s.relationSuggestions)
  const acceptRelationSuggestion = usePlotStore((s) => s.acceptRelationSuggestion)
  const dismissRelationSuggestion = usePlotStore((s) => s.dismissRelationSuggestion)

  const backlinkNotes = useBacklinksFor(noteId)

  const [relationPickerOpen, setRelationPickerOpen] = useState(false)

  const note = notes.find((n) => n.id === noteId) ?? null

  const noteRelations = useMemo(() => {
    if (!noteId) return { outgoing: [], incoming: [] }
    return {
      outgoing: (relations ?? []).filter((r: Relation) => r.sourceNoteId === noteId),
      incoming: (relations ?? []).filter((r: Relation) => r.targetNoteId === noteId),
    }
  }, [relations, noteId])

  const related = useMemo(() => {
    if (!noteId) return []
    const backlinkIds = new Set(backlinkNotes.map((n) => n.id))
    return suggestBacklinks(noteId, notes, { limit: 5 }).filter(
      (r) => !backlinkIds.has(r.noteId)
    )
  }, [noteId, notes, backlinkNotes])

  const unlinkedMentions = useMemo(() => {
    if (!noteId) return []
    return detectUnlinkedMentions(noteId, notes)
  }, [noteId, notes])

  const pendingSuggestions = useMemo(() => {
    if (!noteId) return []
    return (relationSuggestions ?? []).filter(
      (s) => s.status === "pending" &&
      (s.sourceNoteId === noteId || s.targetNoteId === noteId)
    )
  }, [relationSuggestions, noteId])

  if (!note) return (
    <div className="flex flex-1 items-center justify-center p-8 text-center">
      <p className="text-sm text-muted-foreground">Select a note to see connections</p>
    </div>
  )

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Linked References */}
      <InspectorSection title="References" icon={<PhLink size={16} weight="regular" />}>
        {backlinkNotes.length === 0 && related.length === 0 ? (
          <span className="text-sm text-muted-foreground">No linked references</span>
        ) : (
          <div className="space-y-2">
            {backlinkNotes.length > 0 && (
              <div className="space-y-0.5">
                <span className="text-2xs font-medium uppercase tracking-wider text-muted-foreground/60 px-1">Backlinks</span>
                {backlinkNotes.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => openSidePeek(n.id)}
                    className="flex items-center gap-2 w-full text-left px-1 py-0.5 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                  >
                    <FileText className="shrink-0 text-muted-foreground/60" size={14} weight="regular" />
                    <span className="truncate">{n.title || "Untitled"}</span>
                  </button>
                ))}
              </div>
            )}
            {related.length > 0 && (
              <div className="space-y-0.5">
                <span className="text-2xs font-medium uppercase tracking-wider text-muted-foreground/60 px-1">Related</span>
                {related.map((r) => {
                  const rNote = notes.find((n) => n.id === r.noteId)
                  if (!rNote) return null
                  return (
                    <button
                      key={r.noteId}
                      onClick={() => openSidePeek(r.noteId)}
                      className="flex items-center gap-2 w-full text-left px-1 py-0.5 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors group"
                    >
                      <Sparkle className="shrink-0 text-muted-foreground/40" size={14} weight="regular" />
                      <span className="truncate flex-1">{rNote.title || "Untitled"}</span>
                      <span className="text-2xs text-muted-foreground/40 shrink-0 group-hover:text-muted-foreground/60">
                        {r.reasons[r.reasons.length - 1]}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </InspectorSection>

      {/* Unlinked Mentions */}
      {unlinkedMentions.length > 0 && (
        <>
          <div className="mx-4 border-b border-border" />
          <InspectorSection title="Unlinked Mentions" icon={<Warning size={16} weight="regular" />}>
            <div className="space-y-0.5">
              {unlinkedMentions.map((m) => {
                const mNote = notes.find((n) => n.id === m.noteId)
                if (!mNote) return null
                return (
                  <div
                    key={m.noteId + m.title}
                    className="flex items-center gap-2 group px-1 py-0.5 rounded hover:bg-secondary/50 transition-colors"
                  >
                    <FileText className="shrink-0 text-muted-foreground/60" size={14} weight="regular" />
                    <span className="truncate flex-1 text-sm text-muted-foreground">
                      {m.title}
                    </span>
                    <span className="text-2xs text-muted-foreground/40">
                      {m.count}×
                    </span>
                    <button
                      onClick={() => addWikiLink(note!.id, m.title)}
                      className="shrink-0 text-2xs text-accent opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                    >
                      Link
                    </button>
                  </div>
                )
              })}
            </div>
          </InspectorSection>
        </>
      )}

      <div className="mx-4 border-b border-border" />

      {/* Relations */}
      <InspectorSection title="Relations" icon={<Graph size={16} weight="regular" />}>
        {noteRelations.outgoing.length === 0 && noteRelations.incoming.length === 0 && !relationPickerOpen ? (
          <div className="space-y-2">
            <span className="text-note text-muted-foreground">No relations</span>
            <button
              onClick={() => setRelationPickerOpen(true)}
              className="flex items-center gap-1.5 text-note text-muted-foreground hover:text-foreground transition-colors"
            >
              <PhPlus size={14} weight="regular" />
              Add relation
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {noteRelations.outgoing.length > 0 && (
              <div className="space-y-0.5">
                <span className="text-2xs font-medium uppercase tracking-wider text-muted-foreground/60 px-1">
                  Outgoing
                </span>
                {noteRelations.outgoing.map((rel: Relation) => {
                  const target = notes.find(n => n.id === rel.targetNoteId)
                  if (!target) return null
                  return (
                    <RelationRow
                      key={rel.id}
                      relation={rel}
                      noteTitle={target.title}
                      isSource={true}
                      onNavigate={() => openSidePeek(rel.targetNoteId)}
                      onRemove={() => removeRelation(rel.id)}
                      onChangeType={(newType) => updateRelationType(rel.id, newType)}
                    />
                  )
                })}
              </div>
            )}

            {noteRelations.incoming.length > 0 && (
              <div className="space-y-0.5">
                <span className="text-2xs font-medium uppercase tracking-wider text-muted-foreground/60 px-1">
                  Incoming
                </span>
                {noteRelations.incoming.map((rel: Relation) => {
                  const source = notes.find(n => n.id === rel.sourceNoteId)
                  if (!source) return null
                  return (
                    <RelationRow
                      key={rel.id}
                      relation={rel}
                      noteTitle={source.title}
                      isSource={false}
                      onNavigate={() => openSidePeek(rel.sourceNoteId)}
                      onRemove={() => removeRelation(rel.id)}
                      onChangeType={(newType) => updateRelationType(rel.id, newType)}
                    />
                  )
                })}
              </div>
            )}

            {/* Relation Suggestions */}
            {pendingSuggestions.length > 0 && (
              <div className="space-y-0.5 mt-2">
                <span className="text-2xs font-medium uppercase tracking-wider text-muted-foreground/60 px-1">
                  Suggestions
                </span>
                {pendingSuggestions.map((s) => {
                  const otherId = s.sourceNoteId === noteId ? s.targetNoteId : s.sourceNoteId
                  const otherNote = notes.find((n) => n.id === otherId)
                  if (!otherNote) return null
                  return (
                    <SuggestionRow
                      key={s.id}
                      suggestion={s}
                      noteTitle={otherNote.title}
                      onAccept={(type) => acceptRelationSuggestion(s.id, type)}
                      onDismiss={() => dismissRelationSuggestion(s.id)}
                    />
                  )
                })}
              </div>
            )}

            {!relationPickerOpen && (
              <button
                onClick={() => setRelationPickerOpen(true)}
                className="flex items-center gap-1.5 text-note text-muted-foreground hover:text-foreground transition-colors mt-1"
              >
                <PhPlus size={14} weight="regular" />
                Add relation
              </button>
            )}
          </div>
        )}

        {relationPickerOpen && (
          <RelationPicker
            sourceNoteId={note.id}
            onAdd={(targetId, type) => {
              addRelation(note.id, targetId, type)
              setRelationPickerOpen(false)
            }}
            onClose={() => setRelationPickerOpen(false)}
          />
        )}
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* Discover (Related Notes, Related Wiki, Suggested Tags) */}
      <SidePanelDiscover />
    </div>
  )
}
