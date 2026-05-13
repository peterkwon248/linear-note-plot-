import type { Note, NoteTemplate } from "../../types"
import { genId, now, workflowDefaults, persistBody, type AppendEventFn } from "../helpers"
import { extractPreview, extractLinksOut } from "../../body-helpers"

type Set = (fn: ((state: any) => any) | any) => void
type Get = () => any

/**
 * Expand placeholders in template strings (33-decisions §15 v1, opt A).
 *
 * Two pattern families are supported simultaneously (additive — both
 * work, no conflict because `{` and `{{` are distinct prefixes):
 *
 *   - **Plot legacy** (single brace, lowercase, semantic name):
 *     `{date}` `{time}` `{datetime}` `{year}` `{month}` `{day}`
 *   - **UpNote-compatible** (double brace, mixed case, format token):
 *     `{{YYYY}}` `{{MM}}` `{{DD}}` `{{HH}}` `{{mm}}` `{{date}}` `{{time}}`
 *
 * Substitutions run in this order: UpNote double-brace first, Plot
 * single-brace second. Order matters because UpNote tokens like
 * `{{date}}` would otherwise get consumed by the single-brace `{date}`
 * pass mid-replacement.
 */
export function expandPlaceholders(template: string): string {
  const d = new Date()
  const yyyy = String(d.getFullYear())
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  const hh = String(d.getHours()).padStart(2, "0")
  const min = String(d.getMinutes()).padStart(2, "0")
  const isoDate = d.toISOString().split("T")[0]
  const isoTime = d.toTimeString().split(" ")[0].slice(0, 5)
  return template
    // UpNote double-brace tokens (must run first)
    .replace(/\{\{YYYY\}\}/g, yyyy)
    .replace(/\{\{MM\}\}/g, mm)
    .replace(/\{\{DD\}\}/g, dd)
    .replace(/\{\{HH\}\}/g, hh)
    .replace(/\{\{mm\}\}/g, min)
    .replace(/\{\{date\}\}/g, isoDate)
    .replace(/\{\{time\}\}/g, isoTime)
    // Plot legacy single-brace tokens
    .replace(/\{date\}/g, isoDate)
    .replace(/\{time\}/g, isoTime)
    .replace(/\{datetime\}/g, `${isoDate} ${isoTime}`)
    .replace(/\{year\}/g, yyyy)
    .replace(/\{month\}/g, mm)
    .replace(/\{day\}/g, dd)
}

/**
 * Recursively expand `{date}` / `{{YYYY}}` style placeholders inside a
 * TipTap contentJson document. Only string `text` fields are transformed;
 * the document structure (nodes, marks, attrs) is preserved. UpNote-style:
 * users put variables anywhere in the body (heading, paragraph, table cell,
 * etc.) and they expand on `createNoteFromTemplate`.
 *
 * Returns a new object tree (does not mutate the original template).
 */
export function expandContentJsonPlaceholders(node: unknown): unknown {
  if (node === null || typeof node !== "object") return node
  if (Array.isArray(node)) {
    return node.map(expandContentJsonPlaceholders)
  }
  const obj = node as Record<string, unknown>
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(obj)) {
    const val = obj[key]
    if (key === "text" && typeof val === "string") {
      out[key] = expandPlaceholders(val)
    } else if (typeof val === "object" && val !== null) {
      out[key] = expandContentJsonPlaceholders(val)
    } else {
      out[key] = val
    }
  }
  return out
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
        templates: state.templates.map((t: NoteTemplate) =>
          t.id === id ? { ...t, trashed: true, trashedAt: new Date().toISOString() } : t
        ),
      }))
    },

    restoreTemplate: (id: string) => {
      set((state: any) => ({
        templates: state.templates.map((t: NoteTemplate) =>
          t.id === id ? { ...t, trashed: false, trashedAt: null } : t
        ),
      }))
    },

    permanentlyDeleteTemplate: (id: string) => {
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
      // UpNote-style title extraction (2026-05-13): expand body variables
      // first, then pull the title from the first block of the resulting
      // contentJson. The separate `template.title` field is deprecated —
      // users now write "Weekly - {date}" in the first line of the body.
      // Falls back to expanded `template.name` if contentJson is missing.
      const expandedContentJson = template.contentJson
        ? (expandContentJsonPlaceholders(template.contentJson) as Record<string, unknown>)
        : null
      let title = ""
      if (expandedContentJson) {
        const doc = expandedContentJson as { content?: Array<{ content?: Array<{ text?: string }> }> }
        if (doc.content?.[0]?.content) {
          title = doc.content[0].content.map((n) => n.text || "").join("") || ""
        }
      }
      if (!title) {
        // Fallback chain — keeps legacy templates (title-pattern-only) working:
        //   1. expanded template.name (synced to first block on edit)
        //   2. expanded template.title (legacy title-pattern field)
        //   3. "Untitled"
        title = expandPlaceholders(template.name)
          || expandPlaceholders(template.title || "")
          || "Untitled"
      }
      const content = expandPlaceholders(template.content)
      const activeView = state.activeView

      // Templates still use single `folderId` semantics (default folder for
      // newly created notes). v107: convert to N:M `folderIds[]` at the
      // creation boundary. Active-view folder wins when the template has
      // none, matching createNote's auto-classify behavior.
      const folderFromTemplate = template.folderId
      const folderFromView = activeView.type === "folder" ? activeView.folderId : null
      const seedFolder = folderFromTemplate ?? folderFromView
      const folderIds = seedFolder ? [seedFolder] : []

      // v108: NoteTemplate dropped `status` / `priority` fields — new notes
      // start at sensible defaults ("stone" / "none"), matching createNote's
      // baseline. Users override on first edit if needed.
      const newNote: Note = {
        id,
        title,
        content,
        contentJson: expandedContentJson,
        folderIds,
        tags: [...template.tags],
        labelId: template.labelId,
        status: "stone",
        priority: "none",
        reads: 0,
        pinned: false,
        trashed: false,
        createdAt: now(),
        updatedAt: now(),
        preview: extractPreview(content),
        linksOut: extractLinksOut(content),
        ...workflowDefaults("stone"),
        noteType: "note" as const,
        source: "manual",
        aliases: [],
        wikiInfobox: [],
        referenceIds: [],
      }

      set((s: any) => ({
        notes: [newNote, ...s.notes],
        selectedNoteId: id,
      }))
      persistBody({ id, content, contentJson: expandedContentJson })
      appendEvent(id, "created", { templateId, templateName: template.name })
      return id
    },
  }
}
