import type { Note, NoteBody, ActiveView, WikiInfoboxEntry } from "../../types"
import { extractPreview, extractLinksOut } from "../../body-helpers"
import { genId, now, workflowDefaults, persistBody, removeBody, type AppendEventFn } from "../helpers"

type Set = (fn: ((state: any) => any) | any) => void
type Get = () => any

export function createNotesSlice(set: Set, get: Get, appendEvent: AppendEventFn) {
  return {
    createNote: (partial?: Partial<Note>) => {
      const id = genId()
      const { activeView } = get()
      const content = partial?.content ?? ""
      const newNote: Note = {
        id,
        title: partial?.title ?? "",
        content,
        contentJson: partial?.contentJson ?? null,
        folderId:
          partial?.folderId ??
          (activeView.type === "folder" ? activeView.folderId : null),
        tags: partial?.tags ?? [],
        status: partial?.status ?? "inbox",
        priority: partial?.priority ?? "none",
        reads: 0,
        pinned: partial?.pinned ?? false,
        archived: false,
        trashed: false,
        createdAt: now(),
        updatedAt: now(),
        labelId: partial?.labelId ?? null,
        preview: extractPreview(content),
        linksOut: extractLinksOut(content),
        isWiki: partial?.isWiki ?? false,
        aliases: partial?.aliases ?? [],
        wikiInfobox: partial?.wikiInfobox ?? [],
        ...workflowDefaults(partial?.status ?? "inbox"),
        ...(partial?.source != null ? { source: partial.source } : {}),
      }
      set((state: any) => ({
        notes: [newNote, ...state.notes],
        selectedNoteId: id,
      }))
      persistBody({ id, content, contentJson: partial?.contentJson ?? null })
      appendEvent(id, "created")
      // Sync workspace editor tab
      get().openNoteInLeaf(id)
      return id
    },

    updateNote: (id: string, updates: Partial<Note>) => {
      const contentUpdates = updates.content !== undefined
        ? { preview: extractPreview(updates.content), linksOut: extractLinksOut(updates.content) }
        : {}
      set((state: any) => ({
        notes: state.notes.map((n: Note) =>
          n.id === id ? { ...n, ...updates, ...contentUpdates, updatedAt: now(), lastTouchedAt: now() } : n
        ),
      }))
      if (updates.content !== undefined || updates.contentJson !== undefined) {
        const note = get().notes.find((n: Note) => n.id === id)
        if (note) {
          persistBody({ id, content: note.content, contentJson: note.contentJson })
        }
      }
      appendEvent(id, "updated")
    },

    batchUpdateNotes: (ids: string[], updates: Partial<Note>) => {
      const contentUpdates = updates.content !== undefined
        ? { preview: extractPreview(updates.content), linksOut: extractLinksOut(updates.content) }
        : {}
      set((state: any) => ({
        notes: state.notes.map((n: Note) =>
          ids.includes(n.id)
            ? { ...n, ...updates, ...contentUpdates, updatedAt: now(), lastTouchedAt: now() }
            : n
        ),
      }))
      if (updates.content !== undefined || updates.contentJson !== undefined) {
        const currentNotes = get().notes
        for (const id of ids) {
          const note = currentNotes.find((n: Note) => n.id === id)
          if (note) persistBody({ id, content: note.content, contentJson: note.contentJson })
        }
      }
      ids.forEach((id) => appendEvent(id, "updated"))
    },

    touchNote: (id: string) => {
      set((state: any) => ({
        notes: state.notes.map((n: Note) =>
          n.id === id ? { ...n, lastTouchedAt: now() } : n
        ),
      }))
    },

    deleteNote: (id: string) => {
      set((state: any) => {
        const navigationHistory = (state.navigationHistory as string[]).filter((nId: string) => nId !== id)
        const navigationIndex = Math.min(state.navigationIndex as number, Math.max(0, navigationHistory.length - 1))
        const { [id]: _, ...restSRS } = state.srsStateByNoteId
        return {
          notes: state.notes
            .map((n: Note) => n.parentNoteId === id ? { ...n, parentNoteId: null } : n)
            .filter((n: Note) => n.id !== id),
          selectedNoteId: state.selectedNoteId === id ? null : state.selectedNoteId,
          noteEvents: state.noteEvents.filter((e: any) => e.noteId !== id),
          srsStateByNoteId: restSRS,
          threads: state.threads.filter((c: any) => c.noteId !== id),
          relations: state.relations.filter(
            (r: any) => r.sourceNoteId !== id && r.targetNoteId !== id
          ),
          attachments: state.attachments.filter(
            (a: any) => a.noteId !== id
          ),
          relationSuggestions: state.relationSuggestions.filter(
            (s: any) => s.sourceNoteId !== id && s.targetNoteId !== id
          ),
          navigationHistory,
          navigationIndex,
        }
      })
      removeBody(id)
    },

    duplicateNote: (id: string) => {
      const note = get().notes.find((n: Note) => n.id === id)
      if (!note) return
      const newId = genId()
      set((state: any) => ({
        notes: [
          {
            ...note,
            id: newId,
            title: `${note.title} (copy)`,
            createdAt: now(),
            updatedAt: now(),
            ...workflowDefaults(note.status),
            pinned: false,
            reads: 0,
            parentNoteId: null,
            aliases: [],
            wikiInfobox: [...(note.wikiInfobox ?? [])],
          },
          ...state.notes,
        ],
        selectedNoteId: newId,
      }))
      persistBody({ id: newId, content: note.content, contentJson: note.contentJson })
      appendEvent(newId, "created")
    },

    mergeNotes: (targetId: string, sourceIds: string[]) => {
      const state = get()
      const target = state.notes.find((n: Note) => n.id === targetId)
      if (!target) return
      const sources = sourceIds
        .map((sid: string) => state.notes.find((n: Note) => n.id === sid))
        .filter(Boolean) as Note[]
      if (sources.length === 0) return

      // ── 1. Merge content ──
      const mergedContent = [
        target.content,
        ...sources.map(
          (s: Note) => `\n\n---\n\n## Merged from: ${s.title || "Untitled"}\n\n${s.content}`
        ),
      ].join("")

      // ── 2. Merge tags (union) ──
      const tagSet = new Set([...target.tags, ...sources.flatMap((s: Note) => s.tags)])
      const mergedTags = Array.from(tagSet)

      // ── 3. Merge reads (sum) ──
      const mergedReads = target.reads + sources.reduce((sum: number, s: Note) => sum + (s.reads ?? 0), 0)

      // ── 4. Update target note ──
      const contentUpdates = {
        preview: extractPreview(mergedContent),
        linksOut: extractLinksOut(mergedContent),
      }
      const sourceIdSet = new Set(sourceIds)

      set((s: any) => ({
        notes: s.notes.map((n: Note) => {
          if (n.id === targetId) {
            return {
              ...n,
              content: mergedContent,
              contentJson: null,  // force markdown re-parse
              tags: mergedTags,
              reads: mergedReads,
              ...contentUpdates,
              updatedAt: now(),
              lastTouchedAt: now(),
            }
          }
          // ── 5. Archive source notes ──
          if (sourceIdSet.has(n.id)) {
            return {
              ...n,
              archived: true,
              archivedAt: now(),
              content: `> *This note was merged into [[${target.title || "Untitled"}]]*\n\n${n.content}`,
              preview: extractPreview(`> *This note was merged into [[${target.title || "Untitled"}]]*\n\n${n.content}`),
              updatedAt: now(),
              lastTouchedAt: now(),
            }
          }
          // ── 6. Reparent children of source notes ──
          if (n.parentNoteId && sourceIdSet.has(n.parentNoteId)) {
            return { ...n, parentNoteId: targetId }
          }
          return n
        }),
        // ── 7. Relations: remap source references → target ──
        relations: s.relations.map((r: any) => {
          if (sourceIdSet.has(r.sourceNoteId)) return { ...r, sourceNoteId: targetId }
          if (sourceIdSet.has(r.targetNoteId)) return { ...r, targetNoteId: targetId }
          return r
        }).filter((r: any, idx: number, arr: any[]) => {
          if (r.sourceNoteId === r.targetNoteId) return false
          return arr.findIndex((x: any) =>
            x.sourceNoteId === r.sourceNoteId &&
            x.targetNoteId === r.targetNoteId &&
            x.type === r.type
          ) === idx
        }),
      }))

      // ── 8. Persist bodies (target + sources) ──
      const updatedNotes = get().notes
      const updatedTarget = updatedNotes.find((n: Note) => n.id === targetId)
      if (updatedTarget) {
        persistBody({ id: targetId, content: updatedTarget.content, contentJson: updatedTarget.contentJson })
      }
      for (const source of sources) {
        const updatedSource = updatedNotes.find((n: Note) => n.id === source.id)
        if (updatedSource) {
          persistBody({ id: source.id, content: updatedSource.content, contentJson: updatedSource.contentJson })
        }
      }

      // ── 9. Events ──
      appendEvent(targetId, "updated", { type: "merge", sourceIds })
      for (const source of sources) {
        appendEvent(source.id, "archived", { type: "merged_into", targetId })
      }
    },

    togglePin: (id: string) => {
      set((state: any) => ({
        notes: state.notes.map((n: Note) =>
          n.id === id ? { ...n, pinned: !n.pinned, updatedAt: now(), lastTouchedAt: now() } : n
        ),
      }))
    },

    toggleArchive: (id: string) => {
      const note = get().notes.find((n: Note) => n.id === id)
      const wasArchived = note?.archived ?? false
      set((state: any) => ({
        notes: state.notes.map((n: Note) =>
          n.id === id ? { ...n, archived: !n.archived, updatedAt: now(), lastTouchedAt: now() } : n
        ),
      }))
      appendEvent(id, wasArchived ? "unarchived" : "archived")
    },

    toggleTrash: (id: string) => {
      const note = get().notes.find((n: Note) => n.id === id)
      const wasTrashed = note?.trashed ?? false
      set((state: any) => ({
        notes: state.notes.map((n: Note) =>
          n.id === id
            ? { ...n, trashed: !n.trashed, trashedAt: wasTrashed ? null : now(), updatedAt: now(), lastTouchedAt: now() }
            : n
        ),
      }))
      appendEvent(id, wasTrashed ? "untrashed" : "trashed")
    },

    createChainNote: (parentId: string) => {
      const parent = get().notes.find((n: Note) => n.id === parentId)
      if (!parent) return ""
      const id = genId()
      const newNote: Note = {
        id,
        title: "",
        content: "",
        contentJson: null,
        folderId: parent.folderId,
        tags: [...parent.tags],
        status: parent.status,
        priority: "none",
        reads: 0,
        pinned: false,
        archived: false,
        trashed: false,
        createdAt: now(),
        updatedAt: now(),
        labelId: null,
        preview: "",
        linksOut: [],
        ...workflowDefaults(parent.status),
        parentNoteId: parentId,
        isWiki: false,
        aliases: [],
        wikiInfobox: [],
      }
      set((state: any) => ({
        notes: [newNote, ...state.notes],
        selectedNoteId: id,
      }))
      persistBody({ id, content: "", contentJson: null })
      appendEvent(id, "created")
      return id
    },

    setNoteAliases: (noteId: string, aliases: string[]) => {
      set((state: any) => ({
        notes: state.notes.map((n: Note) =>
          n.id === noteId
            ? { ...n, aliases, updatedAt: now(), lastTouchedAt: now() }
            : n
        ),
      }))
      appendEvent(noteId, "alias_changed", { aliases })
    },

    setWikiInfobox: (noteId: string, infobox: WikiInfoboxEntry[]) => {
      set((state: any) => ({
        notes: state.notes.map((n: Note) =>
          n.id === noteId
            ? { ...n, wikiInfobox: infobox, updatedAt: now(), lastTouchedAt: now() }
            : n
        ),
      }))
      appendEvent(noteId, "updated", { field: "wikiInfobox" })
    },

    createWikiStub: (title: string, aliases?: string[]) => {
      const id = genId()
      const newNote: Note = {
        id,
        title,
        content: "",
        contentJson: null,
        folderId: null,
        tags: [],
        status: "inbox",
        priority: "none",
        reads: 0,
        pinned: false,
        archived: false,
        trashed: false,
        createdAt: now(),
        updatedAt: now(),
        labelId: null,
        preview: "",
        linksOut: [],
        isWiki: true,
        aliases: aliases ?? [],
        wikiInfobox: [],
        ...workflowDefaults("inbox"),
      }
      set((state: any) => ({
        notes: [newNote, ...state.notes],
      }))
      persistBody({ id, content: "", contentJson: null })
      appendEvent(id, "created", { isWikiStub: true })
      return id
    },

    convertToWiki: (noteId: string) => {
      set((state: any) => ({
        notes: state.notes.map((n: Note) =>
          n.id === noteId
            ? { ...n, isWiki: true, updatedAt: now(), lastTouchedAt: now() }
            : n
        ),
      }))
      appendEvent(noteId, "wiki_converted")
    },

    revertFromWiki: (noteId: string) => {
      set((state: any) => ({
        notes: state.notes.map((n: Note) =>
          n.id === noteId
            ? { ...n, isWiki: false, updatedAt: now(), lastTouchedAt: now() }
            : n
        ),
      }))
      appendEvent(noteId, "wiki_converted", { reverted: true })
    },
  }
}
