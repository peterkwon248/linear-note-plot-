import type { Note, Folder, ActiveView, WikiArticle } from "../../types"
import { genId } from "../helpers"

type Set = (fn: ((state: any) => any) | any) => void

export function createFoldersSlice(set: Set) {
  return {
    /**
     * Create a folder of the given kind. v107: `kind` is required because a
     * folder accepts only its declared entity type (notes XOR wikis). The
     * caller (sidebar / picker / dialog) decides based on the active context.
     *
     * Mutability: kind is intentionally NOT changeable after creation — see
     * `.omc/plans/folder-nm-migration.md` §"Must NOT Have". Use `updateFolder`
     * for cosmetic edits (name/color/parentId/pin); attempting to change
     * `kind` is silently ignored at the action layer (UI should disable it).
     */
    createFolder: (name: string, kind: "note" | "wiki", color: string, opts?: Partial<Folder>) => {
      const now = new Date().toISOString()
      // Generate id outside the set callback so we can return it for
      // immediate use (e.g. inline "+ New folder" → apply to selected note).
      const id = genId()
      set((state: any) => ({
        folders: [...state.folders, {
          id,
          name,
          color,
          parentId: null,
          lastAccessedAt: null,
          pinned: false,
          pinnedOrder: 0,
          createdAt: now,
          ...opts,
          kind,  // kind always wins — opts cannot override the declared kind
        }],
      }))
      return id
    },

    updateFolder: (id: string, updates: Partial<Folder>) => {
      set((state: any) => ({
        folders: state.folders.map((f: Folder) => {
          if (f.id !== id) return f
          // Strip `kind` from updates — kind is immutable post-creation.
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { kind: _kind, ...safe } = updates
          return { ...f, ...safe }
        }),
      }))
    },

    deleteFolder: (id: string) => {
      set((state: any) => {
        // Move children to root
        const updatedFolders = state.folders
          .filter((f: Folder) => f.id !== id)
          .map((f: Folder) => f.parentId === id ? { ...f, parentId: null } : f)

        return {
          folders: updatedFolders,
          // N:M cascade — strip `id` from every note's folderIds.
          notes: state.notes.map((n: Note) =>
            n.folderIds.includes(id)
              ? { ...n, folderIds: n.folderIds.filter((fid: string) => fid !== id) }
              : n
          ),
          // N:M cascade — strip `id` from every wiki article's folderIds.
          wikiArticles: state.wikiArticles.map((w: WikiArticle) =>
            w.folderIds.includes(id)
              ? { ...w, folderIds: w.folderIds.filter((fid: string) => fid !== id) }
              : w
          ),
          activeView:
            state.activeView.type === "folder" &&
            state.activeView.folderId === id
              ? ({ type: "all" } as ActiveView)
              : state.activeView,
        }
      })
    },

    accessFolder: (id: string) => {
      set((state: any) => ({
        folders: state.folders.map((f: Folder) =>
          f.id === id ? { ...f, lastAccessedAt: new Date().toISOString() } : f
        ),
      }))
    },

    toggleFolderPin: (id: string) => {
      set((state: any) => {
        const folder = state.folders.find((f: Folder) => f.id === id)
        if (!folder) return state

        if (folder.pinned) {
          // Unpin
          return {
            folders: state.folders.map((f: Folder) =>
              f.id === id ? { ...f, pinned: false, pinnedOrder: 0 } : f
            ),
          }
        } else {
          // Pin: set pinnedOrder to max + 1
          const maxOrder = Math.max(0, ...state.folders
            .filter((f: Folder) => f.pinned)
            .map((f: Folder) => f.pinnedOrder))
          return {
            folders: state.folders.map((f: Folder) =>
              f.id === id ? { ...f, pinned: true, pinnedOrder: maxOrder + 1 } : f
            ),
          }
        }
      })
    },

    /* ── N:M Membership Actions (v107) ──────────────────────────────────
     *
     * These shape the relationship between Note/WikiArticle and Folder as
     * an N:M join. Each action is idempotent on the relationship level —
     * adding an already-present folder is a no-op, removing an absent one
     * is a no-op. Kind validation prevents cross-type membership: a Note
     * can only join a `kind="note"` folder, a WikiArticle a `kind="wiki"`
     * folder. Wrong-kind attempts are silently ignored at the action layer
     * (UI in PR (b) blocks them upstream).
     */

    /** Add a note to a folder (idempotent + kind-validated). */
    addNoteToFolder: (noteId: string, folderId: string) => {
      set((state: any) => {
        const folder = state.folders.find((f: Folder) => f.id === folderId)
        if (!folder || folder.kind !== "note") return state
        let mutated = false
        const notes = state.notes.map((n: Note) => {
          if (n.id !== noteId) return n
          if (n.folderIds.includes(folderId)) return n  // idempotent
          mutated = true
          return { ...n, folderIds: [...n.folderIds, folderId] }
        })
        return mutated ? { notes } : state
      })
    },

    /** Remove a note from a single folder (idempotent — no-op if absent). */
    removeNoteFromFolder: (noteId: string, folderId: string) => {
      set((state: any) => {
        let mutated = false
        const notes = state.notes.map((n: Note) => {
          if (n.id !== noteId) return n
          if (!n.folderIds.includes(folderId)) return n  // idempotent
          mutated = true
          return { ...n, folderIds: n.folderIds.filter((fid: string) => fid !== folderId) }
        })
        return mutated ? { notes } : state
      })
    },

    /**
     * Replace a note's folder set wholesale. Caller is responsible for
     * passing only `kind="note"` folder ids — invalid ids are filtered
     * here as a safety net so the action layer never persists membership
     * in a wrong-kind folder.
     */
    setNoteFolders: (noteId: string, folderIds: string[]) => {
      set((state: any) => {
        const validIds = folderIds.filter((fid) => {
          const f = state.folders.find((x: Folder) => x.id === fid)
          return f?.kind === "note"
        })
        // Dedup while preserving caller order.
        const dedup = Array.from(new Set(validIds))
        return {
          notes: state.notes.map((n: Note) =>
            n.id === noteId ? { ...n, folderIds: dedup } : n
          ),
        }
      })
    },

    /** Add a wiki article to a folder (idempotent + kind-validated). */
    addWikiToFolder: (articleId: string, folderId: string) => {
      set((state: any) => {
        const folder = state.folders.find((f: Folder) => f.id === folderId)
        if (!folder || folder.kind !== "wiki") return state
        let mutated = false
        const wikiArticles = state.wikiArticles.map((w: WikiArticle) => {
          if (w.id !== articleId) return w
          if (w.folderIds.includes(folderId)) return w
          mutated = true
          return { ...w, folderIds: [...w.folderIds, folderId] }
        })
        return mutated ? { wikiArticles } : state
      })
    },

    /** Remove a wiki article from a single folder. */
    removeWikiFromFolder: (articleId: string, folderId: string) => {
      set((state: any) => {
        let mutated = false
        const wikiArticles = state.wikiArticles.map((w: WikiArticle) => {
          if (w.id !== articleId) return w
          if (!w.folderIds.includes(folderId)) return w
          mutated = true
          return { ...w, folderIds: w.folderIds.filter((fid: string) => fid !== folderId) }
        })
        return mutated ? { wikiArticles } : state
      })
    },

    /** Replace a wiki article's folder set wholesale (kind-filtered). */
    setWikiFolders: (articleId: string, folderIds: string[]) => {
      set((state: any) => {
        const validIds = folderIds.filter((fid) => {
          const f = state.folders.find((x: Folder) => x.id === fid)
          return f?.kind === "wiki"
        })
        const dedup = Array.from(new Set(validIds))
        return {
          wikiArticles: state.wikiArticles.map((w: WikiArticle) =>
            w.id === articleId ? { ...w, folderIds: dedup } : w
          ),
        }
      })
    },
  }
}
