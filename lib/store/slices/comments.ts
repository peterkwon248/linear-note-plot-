import type { Comment, CommentAnchor, CommentStatus } from "../../types"
import { genId } from "../helpers"

type Set = (fn: ((state: any) => any) | any) => void

export function createCommentsSlice(set: Set) {
  return {
    addComment: (anchor: CommentAnchor, body: string, opts?: { parentId?: string; status?: CommentStatus }): string => {
      const id = genId()
      const now = new Date().toISOString()
      const comment: Comment = {
        id,
        anchor,
        body,
        createdAt: now,
        updatedAt: now,
        status: opts?.status ?? "backlog",
        parentId: opts?.parentId,
        resolved: opts?.status === "done",
      }
      set((state: any) => ({
        comments: { ...state.comments, [id]: comment },
      }))
      return id
    },

    updateComment: (commentId: string, body: string) => {
      set((state: any) => {
        const existing = state.comments[commentId]
        if (!existing) return {}
        return {
          comments: {
            ...state.comments,
            [commentId]: { ...existing, body, updatedAt: new Date().toISOString() },
          },
        }
      })
    },

    setCommentStatus: (commentId: string, status: CommentStatus) => {
      set((state: any) => {
        const existing = state.comments[commentId]
        if (!existing) return {}
        return {
          comments: {
            ...state.comments,
            [commentId]: {
              ...existing,
              status,
              resolved: status === "done",
              updatedAt: new Date().toISOString(),
            },
          },
        }
      })
    },

    /** Legacy: toggles between "backlog" ↔ "done". Prefer setCommentStatus. */
    toggleCommentResolved: (commentId: string) => {
      set((state: any) => {
        const existing = state.comments[commentId]
        if (!existing) return {}
        const isDone = existing.status === "done"
        const nextStatus: CommentStatus = isDone ? "backlog" : "done"
        return {
          comments: {
            ...state.comments,
            [commentId]: {
              ...existing,
              status: nextStatus,
              resolved: !isDone,
              updatedAt: new Date().toISOString(),
            },
          },
        }
      })
    },

    deleteComment: (commentId: string) => {
      set((state: any) => {
        // Cascade delete replies (parentId === commentId)
        const next = { ...state.comments }
        delete next[commentId]
        for (const id of Object.keys(next)) {
          if (next[id].parentId === commentId) delete next[id]
        }
        return { comments: next }
      })
    },
  }
}
