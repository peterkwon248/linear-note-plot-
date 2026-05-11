"use client"

/**
 * Books → GalleryView adapter (books-view-engine-4).
 *
 * Reuses the entity-agnostic `GalleryView` shipped in 2026-05-11 for
 * Notes/Wiki/References. Books contributes:
 *  - accentColor: Smart/Hybrid/Manual kind hints (cool→warm gradient family).
 *    Books-space rose accent reserved for now to keep the gallery readable
 *    without an explicit Book.color field.
 *  - badge: kind label
 *  - coverIcon: cover emoji, else Books glyph
 *  - metaLeft: source kind names (folder/category/tag/label/sticker)
 *  - metaRight: item count + relative time
 *  - groups: maps useBooksView groups (kind / pinned / none) to GalleryGroup
 */

import { Lightning } from "@phosphor-icons/react/dist/ssr/Lightning"
import { PencilSimple } from "@phosphor-icons/react/dist/ssr/PencilSimple"
import { Sparkle } from "@phosphor-icons/react/dist/ssr/Sparkle"
import { PushPin } from "@phosphor-icons/react/dist/ssr/PushPin"
import { PushPinSimple } from "@phosphor-icons/react/dist/ssr/PushPinSimple"
import { GalleryView, type GalleryItem, type GalleryGroup } from "@/components/views/gallery-view"
import { BookKindIcon } from "@/components/property-chips"
import { getBookKind, type BookGroup } from "@/lib/view-engine/use-books-view"
import type { Book } from "@/lib/types"
import type { GroupBy } from "@/lib/view-engine/types"
import { shortRelative } from "@/lib/format-utils"

/** Kind-driven accent color. Warm/cool split matches BookKindChip semantics. */
function accentFor(book: Book): string {
  const kind = getBookKind(book)
  if (kind === "smart") return "#7C8AE7"   // violet — Smart
  if (kind === "hybrid") return "#f59e0b"  // amber — Hybrid (mix)
  return "#94a3b8"                          // slate — Manual (neutral)
}

const SOURCE_LABEL: Record<"folder" | "category" | "tag" | "label" | "sticker", string> = {
  folder:   "Folder",
  category: "Wiki",
  tag:      "Tag",
  label:    "Label",
  sticker:  "Sticker",
}

function bookToGalleryItem(book: Book): GalleryItem {
  const kind = getBookKind(book)
  const uniqueSources = Array.from(new Set((book.smartSources ?? []).map((s) => s.kind)))
  const metaLeft = uniqueSources.slice(0, 2).map((k) => SOURCE_LABEL[k])

  const itemCount = book.items?.length ?? 0
  const metaRight = [
    `${itemCount} ${itemCount === 1 ? "item" : "items"}`,
    shortRelative(book.updatedAt),
  ]

  const badgeLabel = kind === "smart" ? "Smart" : kind === "hybrid" ? "Hybrid" : "Manual"

  return {
    id: book.id,
    title: book.title || "Untitled book",
    excerpt: book.description,
    accentColor: accentFor(book),
    badge: { label: badgeLabel },
    coverIcon: book.coverEmoji
      ? <span className="text-base leading-none">{book.coverEmoji}</span>
      : <BookKindIcon kind={kind} size={14} />,
    metaLeft,
    metaRight,
  }
}

function groupHeaderIcon(groupBy: GroupBy, key: string): React.ReactNode {
  if (groupBy === "kind") {
    if (key === "smart") return <Lightning size={12} weight="regular" />
    if (key === "manual") return <PencilSimple size={12} weight="regular" />
    if (key === "hybrid") return <Sparkle size={12} weight="regular" />
  }
  if (groupBy === "pinned") {
    if (key === "pinned") return <PushPin size={12} weight="fill" className="text-amber-500" />
    return <PushPinSimple size={12} weight="regular" />
  }
  return null
}

interface BooksGalleryAdapterProps {
  /** Flat list (groupBy === "none"). */
  books: Book[]
  /** Grouped list (groupBy === "kind" | "pinned"). */
  groups: BookGroup[]
  groupBy: GroupBy
  onOpen: (id: string) => void
  activeId?: string | null
}

export function BooksGalleryAdapter({
  books,
  groups,
  groupBy,
  onOpen,
  activeId,
}: BooksGalleryAdapterProps) {
  // groupBy === "none" → flat single bucket; render flat items for cleaner UI.
  if (groupBy === "none" || groups.length <= 1) {
    return (
      <GalleryView
        items={books.map(bookToGalleryItem)}
        activeId={activeId ?? null}
        onItemClick={onOpen}
      />
    )
  }

  const galleryGroups: GalleryGroup[] = groups.map((g) => ({
    id: g.key,
    label: g.label,
    icon: groupHeaderIcon(groupBy, g.key),
    items: g.books.map(bookToGalleryItem),
  }))

  return (
    <GalleryView
      groups={galleryGroups}
      activeId={activeId ?? null}
      onItemClick={onOpen}
    />
  )
}
