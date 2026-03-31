"use client"

import { extractTasks } from "./body-helpers"
import type { NoteBody } from "./types"

/* ── Types ──────────────────────────────────────────── */

export interface TaskItem {
  id: string           // `${noteId}:${position}`
  noteId: string
  noteTitle: string
  text: string
  checked: boolean
  position: number     // order within the note
}

/* ── TodoIndex (in-memory, BacklinksIndex pattern) ── */

class TodoIndexImpl {
  private tasksByNote = new Map<string, TaskItem[]>()

  /** Full rebuild from all note bodies */
  async buildFromScratch(
    notes: Array<{ id: string; title: string; trashed: boolean }>,
    getAllBodies: () => Promise<NoteBody[]>,
  ): Promise<TaskItem[]> {
    this.tasksByNote.clear()
    const bodies = await getAllBodies()
    const bodyMap = new Map(bodies.map((b) => [b.id, b]))

    for (const note of notes) {
      if (note.trashed) continue
      const body = bodyMap.get(note.id)
      if (body?.contentJson) {
        this.upsertNote(note.id, note.title, body.contentJson as Record<string, unknown>)
      }
    }
    return this.getAllTasks()
  }

  /** Incremental update for a single note */
  upsertNote(noteId: string, noteTitle: string, contentJson: Record<string, unknown> | null): void {
    if (!contentJson) {
      this.tasksByNote.delete(noteId)
      return
    }
    const raw = extractTasks(contentJson)
    if (raw.length === 0) {
      this.tasksByNote.delete(noteId)
      return
    }
    const tasks: TaskItem[] = raw.map((t) => ({
      id: `${noteId}:${t.position}`,
      noteId,
      noteTitle,
      text: t.text,
      checked: t.checked,
      position: t.position,
    }))
    this.tasksByNote.set(noteId, tasks)
  }

  /** Remove all tasks for a note */
  removeNote(noteId: string): void {
    this.tasksByNote.delete(noteId)
  }

  /** Get all tasks across all notes */
  getAllTasks(): TaskItem[] {
    const all: TaskItem[] = []
    for (const tasks of this.tasksByNote.values()) {
      all.push(...tasks)
    }
    return all
  }

  /** Get tasks for a specific note */
  getTasksByNote(noteId: string): TaskItem[] {
    return this.tasksByNote.get(noteId) ?? []
  }

  /** Get incomplete tasks */
  getIncompleteTasks(): TaskItem[] {
    return this.getAllTasks().filter((t) => !t.checked)
  }

  /** Get completed tasks */
  getCompletedTasks(): TaskItem[] {
    return this.getAllTasks().filter((t) => t.checked)
  }

  /** Get task counts */
  getTaskCount(): { total: number; completed: number; incomplete: number } {
    const all = this.getAllTasks()
    const completed = all.filter((t) => t.checked).length
    return { total: all.length, completed, incomplete: all.length - completed }
  }
}

/** Singleton instance */
export const todoIndex = new TodoIndexImpl()
