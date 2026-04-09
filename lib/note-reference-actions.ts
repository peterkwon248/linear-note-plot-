/**
 * Shared actions for note references (wikilinks, @mentions, note embeds).
 * Provides unified click/hover behavior across all reference types.
 */

import { usePlotStore } from "@/lib/store"
import { setActiveRoute } from "@/lib/table-route"
import { navigateToWikiArticle } from "@/lib/wiki-article-nav"

/**
 * Resolve a title (or alias) to a noteId.
 * Checks notes first, then wiki articles.
 */
export function resolveNoteByTitle(title: string): { id: string; type: "note" | "wiki" } | null {
  const store = usePlotStore.getState()
  const lower = title.toLowerCase()

  // Check notes
  const note = store.notes.find(
    (n) =>
      !n.trashed &&
      (n.title.toLowerCase() === lower ||
        n.aliases?.some((a) => a.toLowerCase() === lower))
  )
  if (note) return { id: note.id, type: "note" }

  // Check wiki articles
  const wiki = store.wikiArticles.find(
    (a) =>
      a.title.toLowerCase() === lower ||
      a.aliases.some((al) => al.toLowerCase() === lower)
  )
  if (wiki) return { id: wiki.id, type: "wiki" }

  return null
}

/**
 * Check if a given ID belongs to a note or wiki article.
 */
export function resolveNoteById(id: string): { id: string; type: "note" | "wiki" } | null {
  const store = usePlotStore.getState()

  const note = store.notes.find((n) => n.id === id && !n.trashed)
  if (note) return { id: note.id, type: "note" }

  const wiki = store.wikiArticles.find((a) => a.id === id)
  if (wiki) return { id: wiki.id, type: "wiki" }

  return null
}

/**
 * Scroll to an anchor element after a short delay (to allow the editor to render).
 */
function scrollToAnchor(anchorId: string) {
  requestAnimationFrame(() => {
    setTimeout(() => {
      const el = document.querySelector(`[data-anchor-id="${anchorId}"]`)
      el?.scrollIntoView({ behavior: "smooth", block: "center" })
    }, 300)
  })
}

/**
 * Unified click handler for note references.
 * - Ctrl/Cmd + Click → navigate to the note
 * - Click → open in side peek panel
 */
export function handleNoteReferenceClick(
  noteId: string,
  noteType: "note" | "wiki",
  event: MouseEvent | React.MouseEvent,
  anchorId?: string | null
) {
  event.preventDefault()
  event.stopPropagation()

  const store = usePlotStore.getState()

  if (event.ctrlKey || event.metaKey) {
    // Ctrl+Click → navigate to note in the currently focused pane
    if (noteType === "wiki") {
      // Wiki navigation always goes to Wiki space (left pane)
      setActiveRoute("/wiki")
      navigateToWikiArticle(noteId)
    } else {
      const pane = store.activePane
      if (pane === 'secondary') {
        // Open in secondary pane (independent navigation)
        store.openNote(noteId, { pane: 'secondary' })
      } else {
        setActiveRoute("/notes")
        store.openNote(noteId)
      }
    }
    if (anchorId) scrollToAnchor(anchorId)
  } else {
    // Regular click → peek in side panel (supports both notes and wiki)
    store.openSidePeek({ type: noteType, id: noteId })
    if (anchorId) scrollToAnchor(anchorId)
  }
}

/**
 * Handle click on a wikilink by title.
 * Resolves title → noteId, then delegates to handleNoteReferenceClick.
 */
export function handleWikilinkClick(title: string, event: MouseEvent, anchorId?: string | null) {
  const resolved = resolveNoteByTitle(title)
  if (resolved) {
    handleNoteReferenceClick(resolved.id, resolved.type, event, anchorId)
  } else {
    // Dangling link: create wiki article and navigate
    const store = usePlotStore.getState()
    const newId = store.createWikiArticle({ title })
    if (newId) {
      setActiveRoute("/wiki")
      navigateToWikiArticle(newId)
    }
  }
}

/**
 * Handle click on a mention by id.
 * Determines if the mention points to a note/wiki, then delegates.
 */
export function handleMentionClick(id: string, event: MouseEvent) {
  const resolved = resolveNoteById(id)
  if (resolved) {
    handleNoteReferenceClick(resolved.id, resolved.type, event)
  }
}
