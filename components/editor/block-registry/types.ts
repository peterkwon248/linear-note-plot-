/**
 * Block Registry — single source of truth for insertable blocks.
 *
 * Previously the same block (Callout, Infobox, Columns, etc.) had to be
 * registered in THREE places:
 *   - components/editor/SlashCommand.tsx (COMMANDS array)
 *   - components/insert-menu.tsx (JSX DropdownMenuItem)
 *   - components/editor/FixedToolbar.tsx (individual ToolbarButton handlers)
 *
 * This registry centralizes all insertable block operations. Adding a new
 * block now means adding ONE entry here; consuming surfaces (slash menu,
 * insert dropdown, toolbar) read from this registry.
 *
 * Scope:
 *   - Insertable blocks and special inline insertions (Math, Date, Footnote, Reference, etc.)
 *   - NOT inline marks (bold/italic/link) — those are format operations,
 *     managed directly in FixedToolbar since their shape (toggle + active state)
 *     differs substantially from insertable blocks.
 *   - NOT attachments (Image/File) — those require ref-based file input and
 *     are kept as InsertMenu-local JSX. Adding them to the registry would
 *     force all surfaces to handle file pickers, which is out of scope.
 */

import type { Editor, Range } from "@tiptap/core"
import type { ComponentType } from "react"

/** Icon component shape — matches @/lib/editor/editor-icons (Remix icons).
 *  Remix icons accept `size` (number) and `className`; they do NOT have
 *  a `weight` prop like Phosphor. */
export type BlockIcon = ComponentType<{ size?: number; className?: string }>

/** Surface on which this block is exposed. */
export type BlockSurface = "slash" | "insertMenu" | "toolbar"

/** Tier gate — "모든 새 기능 = base 티어" 결정 준수. */
export type BlockTier = "base" | "note" | "wiki"

/** Grouping for visual organization (separators in menus, section labels). */
export type BlockGroup =
  | "text"       // heading, list, checklist, blockquote, code block
  | "structure"  // table, toc, callout, summary, columns, infobox
  | "layout"     // divider, bookmark, toggle
  | "embed"      // note embed, wiki embed, url embed
  | "field"      // footnote, reference, query, block wrapper, date
  | "math"       // inline math, block math

/** Context passed to execute. */
export interface BlockExecuteContext {
  editor: Editor
  /** Slash command consumers pass a Range for the `/` trigger to delete.
   *  Menu / toolbar consumers omit this (nothing to delete). */
  range?: Range
  /** Note/Wiki ID for context-dependent blocks (currently only attachments
   *  need this, and attachments are not in the registry — kept here for
   *  future extension). */
  noteId?: string
}

export interface BlockRegistryEntry {
  /** Stable identifier — referenced by toolbar buttons via callBlock(id). */
  id: string

  /** Menu label (also used as search text in slash command). */
  label: string

  /** Short description — shown as subtitle in slash menu. */
  description?: string

  /** Alternative search aliases for slash command. Useful for discoverability
   *  (e.g. ["alert", "note"] → surface Callout when user types /alert). */
  aliases?: string[]

  /** Icon component. */
  icon: BlockIcon

  /** Where this block is exposed. A single entry can appear on multiple surfaces. */
  surfaces: readonly BlockSurface[]

  /** Grouping for separators/sections in menus. */
  group: BlockGroup

  /** Tier gating — base appears in both note and wiki editors. */
  tier: BlockTier

  /** Execute the insertion.
   *
   *  Implementations should branch on `range` presence:
   *  - With range (slash): delete the slash trigger range before inserting.
   *    Initial attrs should be MINIMAL (user will type next).
   *  - Without range (menu/toolbar click): insert with placeholder/example attrs.
   *
   *  This is why we can't just store a static JSON doc — the placeholder
   *  strategy differs by trigger path. */
  execute: (ctx: BlockExecuteContext) => void | Promise<void>
}

/** Helper: run the chain.deleteRange if range exists. */
export function chainWithRange(editor: Editor, range?: Range) {
  const chain = editor.chain().focus()
  if (range) chain.deleteRange(range)
  return chain
}
