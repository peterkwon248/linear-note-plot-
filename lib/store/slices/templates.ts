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
/**
 * Recursively expand placeholders in a TipTap/ProseMirror JSON document.
 *
 * 2026-05-13: previously `createNoteFromTemplate` only expanded
 * `template.content` (plain text), but TipTap editor uses `contentJson`
 * (richer source of truth) when present — so placeholders like
 * `{{YYYY}}-{{MM}}-{{DD}}` survived into the new note unchanged.
 *
 * Only `text` fields are expanded (TipTap text nodes). Attribute /
 * metadata fields are passed through verbatim to avoid clobbering
 * URL params, IDs, etc. that may legitimately contain `{...}`.
 */
export function expandPlaceholdersInJson<T>(node: T): T {
  if (node === null || node === undefined) return node
  if (Array.isArray(node)) {
    return node.map(expandPlaceholdersInJson) as unknown as T
  }
  if (typeof node === "object") {
    const result: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      if (k === "text" && typeof v === "string") {
        result[k] = expandPlaceholders(v)
      } else {
        result[k] = expandPlaceholdersInJson(v)
      }
    }
    return result as unknown as T
  }
  return node
}

/**
 * Regex matching every supported placeholder token (UpNote double-brace
 * + Plot legacy single-brace). Shared with `countPlaceholders` so the
 * Detail panel surfaces only patterns that `expandPlaceholders` actually
 * substitutes — never a stat that lies about behavior.
 */
const PLACEHOLDER_PATTERN =
  /\{\{(?:YYYY|MM|DD|HH|mm|date|time)\}\}|\{(?:date|time|datetime|year|month|day)\}/g

/**
 * Count placeholder tokens in a template body. ContentJson takes
 * priority (it's what `createNoteFromTemplate` actually expands when
 * present); plain `content` is the fallback for older templates.
 *
 * Only text nodes inside contentJson are scanned — attrs / metadata are
 * skipped to avoid false positives from URL params or IDs that may
 * legitimately contain `{...}`. Mirrors `expandPlaceholdersInJson`.
 */
export function countPlaceholders(
  content: string,
  contentJson?: Record<string, unknown> | null,
): number {
  if (contentJson) {
    let count = 0
    const walk = (node: unknown) => {
      if (node === null || node === undefined) return
      if (Array.isArray(node)) {
        node.forEach(walk)
        return
      }
      if (typeof node !== "object") return
      for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
        if (k === "text" && typeof v === "string") {
          const matches = v.match(PLACEHOLDER_PATTERN)
          if (matches) count += matches.length
        } else {
          walk(v)
        }
      }
    }
    walk(contentJson)
    return count
  }
  const matches = content.match(PLACEHOLDER_PATTERN)
  return matches ? matches.length : 0
}

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
      const title = expandPlaceholders(template.title)
      const content = expandPlaceholders(template.content)
      // 2026-05-13: contentJson도 placeholder expand. TipTap editor가
      // contentJson 우선 사용하므로 expand 누락 시 `{{YYYY}}` 등이 그대로 남음.
      const contentJson = template.contentJson
        ? expandPlaceholdersInJson(template.contentJson)
        : null
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
        contentJson,
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
      persistBody({ id, content, contentJson })
      appendEvent(id, "created", { templateId, templateName: template.name })
      return id
    },
  }
}
