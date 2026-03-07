import type { Note, Folder, ActiveView } from "../../types"
import { genId } from "../helpers"

type Set = (fn: ((state: any) => any) | any) => void

export function createFoldersSlice(set: Set) {
  return {
    createFolder: (name: string, color: string) => {
      set((state: any) => ({
        folders: [...state.folders, { id: genId(), name, color }],
      }))
    },

    updateFolder: (id: string, updates: Partial<Folder>) => {
      set((state: any) => ({
        folders: state.folders.map((f: Folder) =>
          f.id === id ? { ...f, ...updates } : f
        ),
      }))
    },

    deleteFolder: (id: string) => {
      set((state: any) => ({
        folders: state.folders.filter((f: Folder) => f.id !== id),
        notes: state.notes.map((n: Note) =>
          n.folderId === id ? { ...n, folderId: null } : n
        ),
        activeView:
          state.activeView.type === "folder" &&
          state.activeView.folderId === id
            ? ({ type: "all" } as ActiveView)
            : state.activeView,
      }))
    },
  }
}
