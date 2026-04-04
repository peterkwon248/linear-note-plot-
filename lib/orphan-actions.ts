import type { Note, Tag, Folder } from "./types"
import { discoverRelated, type DiscoverNoteInput } from "./search/discover-engine"

export interface OrphanAction {
  type: "link" | "move" | "tag" | "delete"
  label: string
  targetId?: string
  targetTitle?: string
  score: number
}

export function getOrphanActions(
  note: Note,
  allNotes: Note[],
  backlinksMap: Record<string, string[]>,
  allTags: Tag[],
  folders: Folder[],
): OrphanAction[] {
  const inputs: DiscoverNoteInput[] = allNotes.map((n) => ({
    id: n.id,
    title: n.title,
    tags: n.tags,
    linksOut: n.linksOut,
    folderId: n.folderId,
    preview: n.content?.slice(0, 200),
  }))

  const { relatedNotes, suggestedTags } = discoverRelated({
    noteId: note.id,
    noteTitle: note.title,
    noteBody: note.content ?? "",
    noteTags: note.tags,
    noteLinksOut: note.linksOut,
    noteFolderId: note.folderId,
    allNotes: inputs,
    backlinksMap,
    allTags: allTags.filter((t) => !t.trashed).map((t) => ({ id: t.id, name: t.name })),
  })

  const actions: OrphanAction[] = []

  // Link suggestions
  for (const r of relatedNotes) {
    if (r.score >= 3) {
      const target = allNotes.find((n) => n.id === r.noteId)
      if (target) {
        actions.push({
          type: "link",
          label: `Link to "${target.title}"`,
          targetId: r.noteId,
          targetTitle: target.title,
          score: r.score,
        })
      }
    }
  }

  // Move suggestion
  if (!note.folderId && folders.length > 0) {
    const folderCounts: Record<string, number> = {}
    for (const n of allNotes) {
      if (n.folderId) folderCounts[n.folderId] = (folderCounts[n.folderId] ?? 0) + 1
    }
    const topFolderId = Object.entries(folderCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
    const topFolder = topFolderId ? folders.find((f) => f.id === topFolderId) : null
    if (topFolder) {
      actions.push({
        type: "move",
        label: `Move to "${topFolder.name}"`,
        targetId: topFolder.id,
        targetTitle: topFolder.name,
        score: 1,
      })
    }
  }

  // Tag suggestions
  if (note.tags.length === 0) {
    for (const s of suggestedTags) {
      actions.push({
        type: "tag",
        label: `Add #${s.tagName}`,
        targetId: s.tagId,
        targetTitle: s.tagName,
        score: s.score,
      })
    }
  }

  // Delete suggestion
  const isOld = Date.now() - new Date(note.createdAt).getTime() > 7 * 24 * 60 * 60 * 1000
  const isShort = (note.content?.trim().length ?? 0) < 50
  if (isOld && isShort) {
    actions.push({ type: "delete", label: "Short & old", score: 0.5 })
  }

  return actions.sort((a, b) => b.score - a.score).slice(0, 2)
}
