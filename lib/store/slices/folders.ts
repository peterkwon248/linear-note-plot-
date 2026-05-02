import type { Note, Folder, ActiveView } from "../../types"
import { genId } from "../helpers"

type Set = (fn: ((state: any) => any) | any) => void

export function createFoldersSlice(set: Set) {
  return {
    createFolder: (name: string, color: string, opts?: Partial<Folder>) => {
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
        }],
      }))
      return id
    },

    updateFolder: (id: string, updates: Partial<Folder>) => {
      set((state: any) => ({
        folders: state.folders.map((f: Folder) =>
          f.id === id ? { ...f, ...updates } : f
        ),
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
          notes: state.notes.map((n: Note) =>
            n.folderId === id ? { ...n, folderId: null } : n
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
  }
}
