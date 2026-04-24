import type { Comment, CommentAnchor } from "../../types"
import { genId } from "../helpers"

type Set = (fn: ((state: any) => any) | any) => void

export function createCommentsSlice(set: Set) {
  return {
    addComment: (anchor: CommentAnchor, body: string): string => {
      const id = genId()
      const now = new Date().toISOString()
      const comment: Comment = {
        id,
        anchor,
        body,
        createdAt: now,
        updatedAt: now,
        resolved: false,
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

    toggleCommentResolved: (commentId: string) => {
      set((state: any) => {
        const existing = state.comments[commentId]
        if (!existing) return {}
        return {
          comments: {
            ...state.comments,
            [commentId]: { ...existing, resolved: !existing.resolved, updatedAt: new Date().toISOString() },
          },
        }
      })
    },

    deleteComment: (commentId: string) => {
      set((state: any) => {
        const { [commentId]: _, ...rest } = state.comments
        return { comments: rest }
      })
    },
  }
}
