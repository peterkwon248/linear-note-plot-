import type { Note, NoteTemplate } from "../../types"
import { genId, now, workflowDefaults, persistBody, type AppendEventFn } from "../helpers"
import { extractPreview, extractLinksOut } from "../../body-helpers"

type Set = (fn: ((state: any) => any) | any) => void
type Get = () => any

/** Expand placeholders in template strings */
export function expandPlaceholders(template: string): string {
  const d = new Date()
  return template
    .replace(/\{date\}/g, d.toISOString().split("T")[0])
    .replace(/\{time\}/g, d.toTimeString().split(" ")[0].slice(0, 5))
    .replace(/\{datetime\}/g, `${d.toISOString().split("T")[0]} ${d.toTimeString().split(" ")[0].slice(0, 5)}`)
    .replace(/\{year\}/g, String(d.getFullYear()))
    .replace(/\{month\}/g, String(d.getMonth() + 1).padStart(2, "0"))
    .replace(/\{day\}/g, String(d.getDate()).padStart(2, "0"))
}

export function createTemplatesSlice(set: Set, get: Get, appendEvent: AppendEventFn) {
  return {
    createTemplate: (template: Omit<NoteTemplate, "id" | "createdAt" | "updatedAt">) => {
      const newTemplate: NoteTemplate = {
        ...template,
        id: `tmpl-${genId()}`,
        createdAt: now(),
        updatedAt: now(),
      }
      set((state: any) => ({
        templates: [...state.templates, newTemplate],
      }))
      return newTemplate.id
    },

    updateTemplate: (id: string, updates: Partial<NoteTemplate>) => {
      set((state: any) => ({
        templates: state.templates.map((t: NoteTemplate) =>
          t.id === id ? { ...t, ...updates, updatedAt: now() } : t
        ),
      }))
    },

    deleteTemplate: (id: string) => {
      set((state: any) => ({
        templates: state.templates.filter((t: NoteTemplate) => t.id !== id),
      }))
    },

    toggleTemplatePin: (id: string) => {
      set((state: any) => ({
        templates: state.templates.map((t: NoteTemplate) =>
          t.id === id ? { ...t, pinned: !t.pinned, updatedAt: now() } : t
        ),
      }))
    },

    createNoteFromTemplate: (templateId: string) => {
      const state = get()
      const template = (state.templates as NoteTemplate[]).find((t) => t.id === templateId)
      if (!template) return ""

      const id = genId()
      const title = expandPlaceholders(template.title)
      const content = expandPlaceholders(template.content)
      const activeView = state.activeView

      const newNote: Note = {
        id,
        title,
        content,
        contentJson: template.contentJson ?? null,
        folderId: template.folderId ?? (activeView.type === "folder" ? activeView.folderId : null),
        tags: [...template.tags],
        labelId: template.labelId,
        status: template.status,
        priority: template.priority,
        reads: 0,
        pinned: false,
        archived: false,
        trashed: false,
        createdAt: now(),
        updatedAt: now(),
        preview: extractPreview(content),
        linksOut: extractLinksOut(content),
        ...workflowDefaults(template.status),
        isWiki: false,
        source: "manual",
        aliases: [],
        wikiInfobox: [],
      }

      set((s: any) => ({
        notes: [newNote, ...s.notes],
        selectedNoteId: id,
      }))
      persistBody({ id, content, contentJson: template.contentJson ?? null })
      appendEvent(id, "created", { templateId, templateName: template.name })
      // Open in workspace editor (same pattern as addNote)
      get().openNoteInLeaf(id)
      return id
    },
  }
}
