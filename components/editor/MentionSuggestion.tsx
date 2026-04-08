"use client"

import { PluginKey } from "@tiptap/pm/state"
import { ReactRenderer } from "@tiptap/react"
import tippy, { Instance as TippyInstance, Props as TippyProps } from "tippy.js"
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
  forwardRef,
} from "react"
import { FileText, BookOpen, Tag, CalendarBlank, Asterisk } from "@/lib/editor/editor-icons"
import { usePlotStore } from "@/lib/store"
import { parseMentionDate } from "@/lib/mention-date-parser"
import type { SuggestionOptions, SuggestionProps, SuggestionKeyDownProps } from "@tiptap/suggestion"
import type { MentionNodeAttrs } from "@tiptap/extension-mention"

// ── Types ─────────────────────────────────────────────────────────────────────

interface MentionItem {
  id: string
  label: string
  mentionType: "note" | "wiki" | "tag" | "date" | "reference"
  color?: string // for tags
  referenceContent?: string // Reference.content
  referenceUrl?: string // URL field value (for auto-branching)
}

interface MentionListProps {
  items: MentionItem[]
  command: (item: MentionItem) => void
}

export interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

// ── Category header labels ───────────────────────────────────────────────────

const categoryLabels: Record<MentionItem["mentionType"], string> = {
  date: "Dates",
  note: "Notes",
  wiki: "Wiki",
  tag: "Tags",
  reference: "References",
}

const categoryOrder: MentionItem["mentionType"][] = ["date", "note", "wiki", "tag", "reference"]

// ── Dropdown Component ────────────────────────────────────────────────────────

const MentionList = forwardRef<MentionListRef, MentionListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    // Reset selection when items change
    useEffect(() => {
      setSelectedIndex(0)
    }, [items])

    const selectItem = useCallback(
      (index: number, shiftKey = false) => {
        const item = items[index]
        if (item) command({ ...item, _shiftKey: shiftKey } as any)
      },
      [items, command]
    )

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === "ArrowUp") {
          setSelectedIndex((i) => (i - 1 + items.length) % items.length)
          return true
        }
        if (event.key === "ArrowDown") {
          setSelectedIndex((i) => (i + 1) % items.length)
          return true
        }
        if (event.key === "Enter") {
          selectItem(selectedIndex, event.shiftKey)
          return true
        }
        return false
      },
    }))

    if (items.length === 0) return null

    // Group items by mentionType, preserving order
    const grouped: { type: MentionItem["mentionType"]; items: { item: MentionItem; globalIndex: number }[] }[] = []
    const typeMap = new Map<string, { item: MentionItem; globalIndex: number }[]>()

    items.forEach((item, idx) => {
      const arr = typeMap.get(item.mentionType) || []
      arr.push({ item, globalIndex: idx })
      typeMap.set(item.mentionType, arr)
    })

    for (const type of categoryOrder) {
      const arr = typeMap.get(type)
      if (arr && arr.length > 0) {
        grouped.push({ type, items: arr })
      }
    }

    return (
      <div className="z-50 min-w-[220px] max-w-[320px] overflow-hidden rounded-md border border-border bg-surface-overlay shadow-md">
        <div className="px-2 py-1 border-b border-border-subtle">
          <span className="text-2xs font-medium text-muted-foreground">
            Mention...
          </span>
        </div>
        <div className="max-h-[280px] overflow-y-auto py-1">
          {grouped.map((group) => (
            <div key={group.type}>
              <div className="px-2 py-0.5">
                <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                  {categoryLabels[group.type]}
                </span>
              </div>
              {group.items.map(({ item, globalIndex }) => (
                <button
                  key={item.id}
                  onClick={(e) => selectItem(globalIndex, e.shiftKey)}
                  className={[
                    "flex w-full items-center gap-2 px-2 py-1.5 text-left text-note transition-colors",
                    globalIndex === selectedIndex
                      ? "bg-active-bg text-foreground"
                      : "text-foreground hover:bg-hover-bg",
                  ].join(" ")}
                >
                  {item.id.startsWith("__new_ref__") ? (
                    <>
                      <span className="text-amber-500 text-2xs">+</span>
                      <ItemIcon item={item} />
                      <span className="truncate font-medium">{item.label}</span>
                      <span className="ml-auto shrink-0 text-2xs text-amber-500">+ Create Ref</span>
                    </>
                  ) : (
                    <>
                      <ItemIcon item={item} />
                      <span className="truncate">{item.label}</span>
                    </>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }
)
MentionList.displayName = "MentionList"

// ── Icon helper ──────────────────────────────────────────────────────────────

function ItemIcon({ item }: { item: MentionItem }) {
  switch (item.mentionType) {
    case "date":
      return <CalendarBlank className="shrink-0 text-muted-foreground" size={14} />
    case "tag":
      return (
        <Tag
          className="shrink-0"
          size={14}
                   style={item.color ? { color: item.color } : undefined}
        />
      )
    case "wiki":
      return <BookOpen className="shrink-0 text-muted-foreground" size={14} />
    case "note":
      return <FileText className="shrink-0 text-muted-foreground" size={14} />
    case "reference":
      return <Asterisk className="shrink-0 text-amber-500" size={14} />
  }
}

// ── Suggestion Config ─────────────────────────────────────────────────────────

export const mentionSuggestionConfig: Omit<SuggestionOptions<MentionItem, MentionNodeAttrs>, "editor"> = {
  char: "@",
  allowSpaces: true,
  allowedPrefixes: null,
  pluginKey: new PluginKey("mention-suggestion"),

  items: ({ query }: { query: string }) => {
    const store = usePlotStore.getState()
    const q = query.trim().toLowerCase()
    const results: MentionItem[] = []

    // 1. Date parsing
    const dateResult = parseMentionDate(q)
    if (dateResult) {
      results.push({
        id: dateResult.iso,
        label: dateResult.display,
        mentionType: "date",
      })
    }

    // 2. Note search
    const currentNoteId = store.selectedNoteId
    const notes = store.notes.filter((n) => !n.trashed && n.id !== currentNoteId)

    if (q.length === 0) {
      const recent = notes
        .filter((n) => n.title.trim())
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5)
      for (const n of recent) {
        results.push({ id: n.id, label: n.title, mentionType: "note" })
      }
    } else {
      const matched = notes
        .filter((n) => n.title.trim() && n.title.toLowerCase().includes(q))
        .sort((a, b) => {
          const aExact = a.title.toLowerCase() === q ? 0 : 1
          const bExact = b.title.toLowerCase() === q ? 0 : 1
          if (aExact !== bExact) return aExact - bExact
          const aStarts = a.title.toLowerCase().startsWith(q) ? 0 : 1
          const bStarts = b.title.toLowerCase().startsWith(q) ? 0 : 1
          if (aStarts !== bStarts) return aStarts - bStarts
          return a.title.length - b.title.length
        })
        .slice(0, 5)
      for (const n of matched) {
        results.push({ id: n.id, label: n.title, mentionType: "note" })
      }
    }

    // 3. Wiki article search (separate entity from notes)
    const wikiArticles = (store as any).wikiArticles ?? []
    if (q.length === 0) {
      const recentWiki = wikiArticles
        .filter((w: any) => w.title?.trim())
        .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 3)
      for (const w of recentWiki) {
        results.push({ id: w.id, label: w.title, mentionType: "wiki" })
      }
    } else {
      const matchedWiki = wikiArticles
        .filter((w: any) => w.title?.trim() && w.title.toLowerCase().includes(q))
        .slice(0, 3)
      for (const w of matchedWiki) {
        results.push({ id: w.id, label: w.title, mentionType: "wiki" })
      }
    }

    // 4. Tag search
    const tags = store.tags.filter((t) => !t.trashed)
    const matchedTags =
      q.length === 0
        ? tags.slice(0, 3)
        : tags.filter((t) => t.name.toLowerCase().includes(q)).slice(0, 3)
    for (const t of matchedTags) {
      results.push({
        id: t.id,
        label: t.name,
        mentionType: "tag",
        color: t.color,
      })
    }

    // 5. Reference search
    const references = (store as any).references ?? {}
    const refEntries = Object.values(references) as Array<{ id: string; title: string; content: string; fields: Array<{ key: string; value: string }>; updatedAt: string }>
    const matchedRefs = q.length === 0
      ? refEntries.filter((r) => r.title?.trim() && !(r as any).trashed).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 3)
      : refEntries.filter((r) => !(r as any).trashed && (r.title.toLowerCase().includes(q) || r.content.toLowerCase().includes(q))).slice(0, 3)
    for (const r of matchedRefs) {
      const urlField = (r.fields || []).find((f) => f.key.toLowerCase() === "url")
      results.push({
        id: r.id,
        label: r.title,
        mentionType: "reference",
        referenceContent: r.content,
        referenceUrl: urlField?.value,
      })
    }

    // 6. Create Reference option (always when query exists)
    if (q.length > 0) {
      results.push({
        id: `__new_ref__${q}`,
        label: q,
        mentionType: "reference",
        referenceContent: q,
      })
    }

    return results.slice(0, 12)
  },

  render: () => {
    let component: ReactRenderer<MentionListRef, MentionListProps> | null = null
    let popup: TippyInstance[] | null = null

    return {
      onStart: (props: SuggestionProps<MentionItem, MentionNodeAttrs>) => {
        component = new ReactRenderer(MentionList, {
          props,
          editor: props.editor,
        })

        if (!props.clientRect) return

        popup = tippy("body", {
          getReferenceClientRect: props.clientRect as () => DOMRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: "manual",
          placement: "bottom-start",
          theme: "none",
          arrow: false,
          offset: [0, 4],
          popperOptions: {
            strategy: "fixed",
            modifiers: [
              { name: "flip", enabled: true },
              { name: "preventOverflow", enabled: true },
            ],
          },
        } as Partial<TippyProps>)
      },

      onUpdate: (props: SuggestionProps<MentionItem, MentionNodeAttrs>) => {
        component?.updateProps(props)

        if (!props.clientRect) return

        popup?.[0]?.setProps({
          getReferenceClientRect: props.clientRect as () => DOMRect,
        })
      },

      onKeyDown: (props: SuggestionKeyDownProps) => {
        if (props.event.key === "Escape") {
          popup?.[0]?.hide()
          return true
        }
        return component?.ref?.onKeyDown(props) ?? false
      },

      onExit: () => {
        popup?.[0]?.destroy()
        component?.destroy()
        popup = null
        component = null
      },
    }
  },

  command: ({
    editor,
    range,
    props,
  }) => {
    const item = props as unknown as MentionItem

    // Reference → 기본 footnoteRef, Shift 시 referenceLink
    if (item.mentionType === "reference") {
      const store = usePlotStore.getState()
      let refId = item.id
      let refContent = item.referenceContent || item.label
      let refUrl = item.referenceUrl

      // Create new Reference if __new_ref__
      if (item.id.startsWith("__new_ref__")) {
        refId = (store as any).createReference({
          title: item.label,
          content: item.label,
          fields: [],
        })
        refContent = item.label
        refUrl = undefined
      }

      const useInlineLink = (item as any)._shiftKey && refUrl

      if (useInlineLink) {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent([
            {
              type: "referenceLink",
              attrs: {
                referenceId: refId,
                title: item.label,
              },
            },
            { type: "text", text: " " },
          ])
          .run()
      } else {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent([
            {
              type: "footnoteRef",
              attrs: {
                id: crypto.randomUUID().slice(0, 8),
                referenceId: refId,
                content: refContent,
              },
            },
            { type: "text", text: " " },
          ])
          .run()
      }
      return
    }

    editor
      .chain()
      .focus()
      .deleteRange(range)
      .insertContent([
        {
          type: "mention",
          attrs: {
            id: props.id,
            label: props.label,
            mentionType: item.mentionType,
          },
        },
        { type: "text", text: " " },
      ])
      .run()
  },
}
