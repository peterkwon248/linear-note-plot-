"use client"

import { extractTasks } from "./body-helpers"
import type { NoteBody, WikiArticle, WikiBlock } from "./types"

/* ── Types ──────────────────────────────────────────── */

export interface TaskItem {
  id: string           // `${noteId}:${position}` or `wiki:${wikiId}:${position}`
  noteId: string       // Owning entity id — note id OR wiki id (overloaded via entityKind)
  noteTitle: string    // Display label — note title OR wiki title
  text: string
  checked: boolean
  position: number     // order within the entity
  /** Owning entity kind — Phase α-2. Defaults to "note" when omitted for
   *  backward compatibility with persisted state from α-1. */
  entityKind?: "note" | "wiki"
}

/* ── TodoIndex (in-memory, BacklinksIndex pattern) ── */

class TodoIndexImpl {
  /** Keyed by note id OR `wiki:${wikiId}` to avoid id collisions across kinds. */
  private tasksByNote = new Map<string, TaskItem[]>()

  /** Full rebuild from all note bodies + wiki article blocks (Phase α-2). */
  async buildFromScratch(
    notes: Array<{ id: string; title: string; trashed: boolean }>,
    wikis: WikiArticle[],
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
    for (const wiki of wikis) {
      if (wiki.trashed) continue
      this.upsertWiki(wiki.id, wiki.title, wiki.blocks)
    }
    return this.getAllTasks()
  }

  /** Incremental update for a wiki article. Walks every `text` block's
   *  contentJson (TipTap JSON) and collects taskItems. Phase α-2. */
  upsertWiki(wikiId: string, wikiTitle: string, blocks: WikiBlock[] | null | undefined): void {
    const key = `wiki:${wikiId}`
    if (!blocks || blocks.length === 0) {
      this.tasksByNote.delete(key)
      return
    }
    const tasks: TaskItem[] = []
    let pos = 0
    for (const block of blocks) {
      if (block.type !== "text" || !block.contentJson) continue
      const raw = extractTasks(block.contentJson as Record<string, unknown>)
      for (const t of raw) {
        tasks.push({
          id: `${key}:${pos}`,
          noteId: wikiId,
          noteTitle: wikiTitle,
          text: t.text,
          checked: t.checked,
          position: pos,
          entityKind: "wiki",
        })
        pos++
      }
    }
    if (tasks.length === 0) {
      this.tasksByNote.delete(key)
      return
    }
    this.tasksByNote.set(key, tasks)
  }

  /** Remove all tasks for a wiki article. */
  removeWiki(wikiId: string): void {
    this.tasksByNote.delete(`wiki:${wikiId}`)
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
      entityKind: "note" as const,
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
