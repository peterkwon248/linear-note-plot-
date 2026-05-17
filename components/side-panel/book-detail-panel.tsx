"use client"

/**
 * BookDetailPanel — right-side panel for a Book entity.
 *
 * Entity-Side-Panel-Uniformity PR 2 (2026-05-14): Book gains the 4-tab
 * side panel that Note / Wiki / Template already have. Detail mirrors
 * the Wiki / Template pattern — Properties = stats, entity-essence info
 * inlined (Kind / Smart sources / Chapters / Reading position).
 *
 *   - Kind badge (Smart / Hybrid / Manual) — derived from `getBookKind`.
 *   - Smart sources section (Smart / Hybrid only) — 5-kind chips
 *     (folder / category / tag / label / sticker) with name resolved
 *     from the store. "(removed X)" fallback when refId is dangling.
 *   - Chapters section — `chapter-heading` items inline (Outline role).
 *   - Properties (= stats only): Total / Notes / Wikis / Chapters /
 *     Smart / Manual. Mirrors Wiki article's stats layout.
 *   - Reading section (only when `lastReadAt` is set) — Resume button.
 *
 * Resolver re-use: `resolveBookItems` runs here to derive accurate
 * counts (manual + smart). The view-engine elsewhere does the same, so
 * the panel never disagrees with the book's reading view.
 */

import { useMemo } from "react"
import { format, formatDistanceToNow } from "date-fns"
import { usePlotStore } from "@/lib/store"
import { resolveBookItems, type ResolvedBookItem } from "@/lib/books/resolver"
import { getBookKind, type BookKind } from "@/lib/view-engine/use-books-view"
import { CalendarBlank } from "@phosphor-icons/react/dist/ssr/CalendarBlank"
import { TextAlignLeft } from "@phosphor-icons/react/dist/ssr/TextAlignLeft"
import { Lightning } from "@phosphor-icons/react/dist/ssr/Lightning"
import { Books as BooksIcon } from "@phosphor-icons/react/dist/ssr/Books"
import { PushPin } from "@phosphor-icons/react/dist/ssr/PushPin"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { Sparkle } from "@phosphor-icons/react/dist/ssr/Sparkle"
import { Folder as PhFolder } from "@phosphor-icons/react/dist/ssr/Folder"
import { Tag as PhTag } from "@phosphor-icons/react/dist/ssr/Tag"
import { Hash as PhHash } from "@phosphor-icons/react/dist/ssr/Hash"
import { Stack } from "@phosphor-icons/react/dist/ssr/Stack"
import { Sticker as PhSticker } from "@phosphor-icons/react/dist/ssr/Sticker"
import { Play } from "@phosphor-icons/react/dist/ssr/Play"
import { BookOpen } from "@phosphor-icons/react/dist/ssr/BookOpen"
import { cn } from "@/lib/utils"
import { SPACE_COLORS } from "@/lib/colors"
import type { Book, AutoSourceKind } from "@/lib/types"
import { TagPicker, LabelPicker } from "@/components/note-fields"
import { CategoryPicker } from "@/components/category-picker"

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
        <span className="text-2xs font-medium text-muted-foreground">
          {title}
        </span>
      </div>
      {children}
    </div>
  )
}

function KindBadge({ kind }: { kind: BookKind }) {
  const config: Record<BookKind, { label: string; bg: string; text: string }> = {
    smart: { label: "Smart", bg: "bg-violet-500/10", text: "text-violet-400" },
    hybrid: { label: "Hybrid", bg: "bg-amber-500/10", text: "text-amber-400" },
    manual: { label: "Manual", bg: "bg-secondary/40", text: "text-muted-foreground" },
  }
  const c = config[kind]
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-2xs font-medium", c.bg, c.text)}>
      <Sparkle size={11} weight="regular" />
      {c.label}
    </span>
  )
}

const SOURCE_KIND_ICON: Record<AutoSourceKind, React.ComponentType<{ size?: number; weight?: "regular" | "fill" | "bold" }>> = {
  folder: PhFolder,
  category: Stack,
  tag: PhHash,
  label: PhTag,
  sticker: PhSticker,
}

export function BookDetailPanel({ book }: { book: Book }) {
  const updateBook = usePlotStore((s) => s.updateBook)
  const deleteBook = usePlotStore((s) => s.deleteBook)
  const notes = usePlotStore((s) => s.notes)
  const folders = usePlotStore((s) => s.folders)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const wikiCategories = usePlotStore((s) => s.wikiCategories)
  const tags = usePlotStore((s) => s.tags)
  const labels = usePlotStore((s) => s.labels)
  const stickers = usePlotStore((s) => s.stickers)
  const createLabel = usePlotStore((s) => s.createLabel)
  const createTag = usePlotStore((s) => s.createTag)
  const createWikiCategory = usePlotStore((s) => s.createWikiCategory)

  const kind = useMemo(() => getBookKind(book), [book])

  const resolved: ResolvedBookItem[] = useMemo(
    () =>
      resolveBookItems(book, {
        notes,
        folders,
        wikiArticles,
        wikiCategories,
        tags,
        labels,
        stickers,
      }),
    [book, notes, folders, wikiArticles, wikiCategories, tags, labels, stickers],
  )

  const stats = useMemo(() => {
    const totalItems = resolved.length
    const notesCount = resolved.filter((r) => r.kind === "note").length
    const wikisCount = resolved.filter((r) => r.kind === "wiki").length
    const chaptersCount = book.items.filter((i) => i.kind === "chapter-heading").length
    const smartCount = resolved.filter((r) => r.source === "auto").length
    const manualCount = resolved.filter((r) => r.source === "manual").length
    return { totalItems, notesCount, wikisCount, chaptersCount, smartCount, manualCount }
  }, [resolved, book.items])

  const chapters = useMemo(
    () =>
      book.items
        .filter((i): i is Extract<typeof i, { kind: "chapter-heading" }> => i.kind === "chapter-heading")
        .map((i, idx) => ({ id: i.id, title: i.title || "Untitled chapter", index: idx + 1 })),
    [book.items],
  )

  const smartSources = useMemo(() => {
    return (book.smartSources ?? []).map((s) => {
      let label = ""
      switch (s.kind) {
        case "folder":
          label = folders.find((x) => x.id === s.refId)?.name ?? "(removed folder)"
          break
        case "category":
          label = wikiCategories.find((x) => x.id === s.refId)?.name ?? "(removed category)"
          break
        case "tag":
          label = tags.find((x) => x.id === s.refId)?.name ?? "(removed tag)"
          break
        case "label":
          label = labels.find((x) => x.id === s.refId)?.name ?? "(removed label)"
          break
        case "sticker":
          label = stickers.find((x) => x.id === s.refId)?.name ?? "(removed sticker)"
          break
      }
      return { kind: s.kind, refId: s.refId, label }
    })
  }, [book.smartSources, folders, wikiCategories, tags, labels, stickers])

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-2xs font-medium"
            style={{
              backgroundColor: `${SPACE_COLORS.books}1a`,
              color: SPACE_COLORS.books,
            }}
          >
            <BooksIcon size={11} weight="regular" />
            Book
          </span>
          <KindBadge kind={kind} />
          {book.pinned && (
            <span className="inline-flex items-center gap-1 rounded-md bg-accent/10 px-1.5 py-0.5 text-2xs font-medium text-accent">
              <PushPin size={11} weight="fill" />
              Pinned
            </span>
          )}
        </div>
        <button
          onClick={() => updateBook(book.id, { pinned: !book.pinned })}
          title={book.pinned ? "Unpin book" : "Pin book"}
          className="flex items-center justify-center h-7 w-7 rounded-md hover:bg-hover-bg text-muted-foreground hover:text-foreground transition-colors"
        >
          <PushPin
            size={14}
            weight={book.pinned ? "fill" : "regular"}
            className={book.pinned ? "text-accent" : ""}
          />
        </button>
      </div>

      {/* ── Description ──────────────────────────────────── */}
      {book.description && (
        <>
          <div className="px-4 py-3">
            <p className="text-note text-foreground/80 leading-relaxed whitespace-pre-wrap">
              {book.description}
            </p>
          </div>
          <div className="mx-4 border-b border-border" />
        </>
      )}

      {/* ── Dates ────────────────────────────────────────── */}
      <InspectorSection title="Dates" icon={<CalendarBlank size={16} weight="regular" />}>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Created</span>
            <span className="text-note text-foreground" title={book.createdAt}>
              {format(new Date(book.createdAt), "MMM d, yyyy")}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Updated</span>
            <span className="text-note text-foreground" title={book.updatedAt}>
              {formatDistanceToNow(new Date(book.updatedAt), { addSuffix: true })}
            </span>
          </div>
        </div>
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* ── Smart Sources (Smart / Hybrid only) ──────────── */}
      {smartSources.length > 0 && (
        <>
          <InspectorSection
            title="Smart sources"
            icon={<Sparkle size={16} weight="regular" />}
          >
            <div className="flex flex-col gap-1">
              {smartSources.map((s, i) => {
                const Icon = SOURCE_KIND_ICON[s.kind]
                return (
                  <div key={`${s.kind}-${s.refId}-${i}`} className="flex items-center gap-2 text-note">
                    <span className="shrink-0 text-muted-foreground/70">
                      <Icon size={12} weight="regular" />
                    </span>
                    <span className="uppercase tracking-wider text-[9px] text-muted-foreground/60 w-14 shrink-0">
                      {s.kind}
                    </span>
                    <span className="truncate text-foreground/80">{s.label}</span>
                  </div>
                )
              })}
            </div>
          </InspectorSection>
          <div className="mx-4 border-b border-border" />
        </>
      )}

      {/* ── Chapters (Outline role) ──────────────────────── */}
      {chapters.length > 0 && (
        <>
          <InspectorSection
            title="Chapters"
            icon={<TextAlignLeft size={16} weight="regular" />}
          >
            <div className="space-y-1">
              {chapters.map((ch) => (
                <div
                  key={ch.id}
                  className="flex items-center gap-1.5 text-note text-muted-foreground"
                >
                  <span className="shrink-0 text-2xs font-mono tabular-nums text-muted-foreground/70 w-5">
                    {ch.index}.
                  </span>
                  <span className="truncate">{ch.title}</span>
                </div>
              ))}
            </div>
          </InspectorSection>
          <div className="mx-4 border-b border-border" />
        </>
      )}

      {/* ── 2026-05-17 cross-entity Label / Category / Tag ── */}
      <InspectorSection title="Label" icon={<PhTag size={16} weight="regular" />}>
        <LabelPicker
          noteId={book.id}
          currentLabelId={book.labelId ?? null}
          allLabels={labels.filter((l) => !(l as { trashed?: boolean }).trashed)}
          onSetLabel={(_id, labelId) => {
            updateBook(book.id, { labelId } as Partial<Book>)
          }}
          onCreateLabel={(name, color) => {
            createLabel(name, color)
            const newLabel = usePlotStore.getState().labels.find((l) => l.name === name)
            if (newLabel) {
              updateBook(book.id, { labelId: newLabel.id } as Partial<Book>)
            }
          }}
        />
      </InspectorSection>
      <div className="mx-4 border-b border-border" />

      <InspectorSection title="Categories" icon={<PhTag size={16} weight="regular" />}>
        <CategoryPicker
          entityId={book.id}
          selectedCategoryIds={book.categoryIds ?? []}
          allCategories={wikiCategories}
          onAddCategory={(_id, catId) => {
            const current = book.categoryIds ?? []
            if (current.includes(catId)) return
            updateBook(book.id, { categoryIds: [...current, catId] } as Partial<Book>)
          }}
          onRemoveCategory={(_id, catId) => {
            const current = book.categoryIds ?? []
            updateBook(book.id, {
              categoryIds: current.filter((x) => x !== catId),
            } as Partial<Book>)
          }}
          onCreateCategory={(name) => {
            const newId = createWikiCategory(name)
            if (newId) {
              const current = book.categoryIds ?? []
              if (!current.includes(newId)) {
                updateBook(book.id, {
                  categoryIds: [...current, newId],
                } as Partial<Book>)
              }
            }
            return newId
          }}
        />
      </InspectorSection>
      <div className="mx-4 border-b border-border" />

      <InspectorSection title="Tags" icon={<PhTag size={16} weight="regular" />}>
        <TagPicker
          noteId={book.id}
          selectedTagIds={book.tags ?? []}
          allTags={tags}
          onAddTag={(_id, tagId) => {
            const current = book.tags ?? []
            if (current.includes(tagId)) return
            updateBook(book.id, { tags: [...current, tagId] } as Partial<Book>)
          }}
          onRemoveTag={(_id, tagId) => {
            const current = book.tags ?? []
            updateBook(book.id, { tags: current.filter((x) => x !== tagId) } as Partial<Book>)
          }}
          onCreateTag={(name) => {
            const tagId = createTag(name)
            if (tagId) {
              const current = book.tags ?? []
              if (!current.includes(tagId)) {
                updateBook(book.id, { tags: [...current, tagId] } as Partial<Book>)
              }
            }
          }}
        />
      </InspectorSection>
      <div className="mx-4 border-b border-border" />

      {/* ── Properties (stats only) ──────────────────────── */}
      <InspectorSection title="Properties" icon={<FileText size={16} weight="regular" />}>
        <div className="space-y-2">
          <Stat label="Total items" value={stats.totalItems} />
          <Stat label="Notes" value={stats.notesCount} />
          <Stat label="Wikis" value={stats.wikisCount} />
          <Stat label="Chapters" value={stats.chaptersCount} />
          {kind !== "manual" && <Stat label="Smart items" value={stats.smartCount} />}
          {kind !== "smart" && <Stat label="Manual items" value={stats.manualCount} />}
        </div>
      </InspectorSection>

      {/* ── Reading (only when lastReadAt set) ───────────── */}
      {book.lastReadAt && book.lastReadItemId && (
        <>
          <div className="mx-4 border-b border-border" />
          <InspectorSection title="Reading" icon={<BookOpen size={16} weight="regular" />}>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-note text-muted-foreground">Last read</span>
                <span
                  className="text-note text-foreground"
                  title={book.lastReadAt ?? undefined}
                >
                  {formatDistanceToNow(new Date(book.lastReadAt), { addSuffix: true })}
                </span>
              </div>
              {/* Resume nudge — actual navigation is handled by the
                  BookDetailPage's "Resume" header button, which scrolls
                  to the lastReadItemId. Surfacing here would duplicate
                  navigation paths, so we just show a static cue. */}
              <p className="text-2xs text-muted-foreground/70 italic">
                Use the &ldquo;Resume&rdquo; button in the book header to jump back.
              </p>
            </div>
          </InspectorSection>
        </>
      )}

      <div className="mx-4 border-b border-border" />

      {/* ── Actions ──────────────────────────────────────── */}
      <InspectorSection title="Actions" icon={<Lightning size={16} weight="regular" />}>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => {
              if (confirm(`Delete "${book.title}"? This cannot be undone.`)) {
                deleteBook(book.id)
              }
            }}
            className="flex items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-note text-muted-foreground hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-colors"
          >
            <Trash size={14} weight="regular" />
            Delete book
          </button>
        </div>
      </InspectorSection>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-note text-muted-foreground">{label}</span>
      <span className="text-note tabular-nums text-foreground">{value}</span>
    </div>
  )
}
