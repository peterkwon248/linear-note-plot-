"use client"

import { Extension } from "@tiptap/core"
import Suggestion from "@tiptap/suggestion"
import { PluginKey } from "@tiptap/pm/state"
import { ReactRenderer } from "@tiptap/react"
import tippy, { Instance as TippyInstance, Props as TippyProps } from "tippy.js"
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
} from "react"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { BookOpen } from "@phosphor-icons/react/dist/ssr/BookOpen"
import { usePlotStore } from "@/lib/store"
// ── Types ─────────────────────────────────────────────────────────────────────

interface WikilinkItem {
  id: string
  title: string
  status: string
  isAlias?: boolean
  isWiki?: boolean
  isNewNote?: boolean
}

interface WikilinkListProps {
  items: WikilinkItem[]
  command: (item: WikilinkItem) => void
}

export interface WikilinkListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

// ── Dropdown Component ────────────────────────────────────────────────────────

const WikilinkList = forwardRef<WikilinkListRef, WikilinkListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    // Reset selection when items change
    useEffect(() => {
      setSelectedIndex(0)
    }, [items])

    const selectItem = useCallback(
      (index: number) => {
        const item = items[index]
        if (item) command(item)
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
          selectItem(selectedIndex)
          return true
        }
        return false
      },
    }))

    if (items.length === 0) return null

    return (
      <div className="z-50 min-w-[200px] max-w-[300px] overflow-hidden rounded-md border border-border bg-surface-overlay shadow-md">
        <div className="px-2 py-1 border-b border-border-subtle">
          <span className="text-2xs font-medium text-muted-foreground">
            Link to...
          </span>
        </div>
        <div className="max-h-[240px] overflow-y-auto py-1">
          {items.map((item, index) => (
            <button
              key={item.id}
              onClick={() => selectItem(index)}
              className={[
                "flex w-full items-center gap-2 px-2 py-1.5 text-left text-note transition-colors",
                index === selectedIndex
                  ? "bg-active-bg text-foreground"
                  : "text-foreground hover:bg-hover-bg",
              ].join(" ")}
            >
              {item.isNewNote ? (
                <>
                  <span className="text-muted-foreground text-2xs">+</span>
                  <span className="text-muted-foreground">
                    Create as Note{" "}
                    <span className="font-medium text-foreground">
                      [[{item.title}]]
                    </span>
                  </span>
                </>
              ) : (
                <>
                  {item.isWiki ? (
                    <BookOpen className="shrink-0 text-muted-foreground" size={14} weight="regular" />
                  ) : (
                    <FileText className="shrink-0 text-muted-foreground" size={14} weight="regular" />
                  )}
                  <span className="truncate">{item.title}</span>
                  {item.isAlias && (
                    <span className="shrink-0 text-2xs italic text-muted-foreground">
                      (alias)
                    </span>
                  )}
                  {item.isWiki && (
                    <span className="shrink-0 text-2xs font-medium text-muted-foreground bg-secondary rounded px-1 py-0.5">
                      Wiki
                    </span>
                  )}
                  <span className="ml-auto shrink-0 rounded px-1 py-0.5 text-2xs font-medium bg-secondary text-muted-foreground">
                    {item.status}
                  </span>
                </>
              )}
            </button>
          ))}
        </div>
      </div>
    )
  }
)
WikilinkList.displayName = "WikilinkList"

// ── Suggestion Plugin Key ─────────────────────────────────────────────────────

const wikilinkSuggestionKey = new PluginKey("wikilink-suggestion")

// ── Extension ─────────────────────────────────────────────────────────────────

export const WikilinkSuggestion = Extension.create({
  name: "wikilinkSuggestion",

  addOptions() {
    return {
      suggestion: {
        char: "[[",
        allowSpaces: true,
        allowedPrefixes: [" ", "\n", null],
        pluginKey: wikilinkSuggestionKey,

        items: ({ query }: { query: string }) => {
          const store = usePlotStore.getState()
          const notes = store.notes
          const currentNoteId = store.selectedNoteId

          // Strip trailing ] characters (user typed closing brackets before suggestion resolves)
          const q = query.trim().replace(/[\]]+$/g, '').toLowerCase().trim()

          // Empty query: show recent 8 notes/wikis
          if (q.length === 0) {
            const pool = notes.filter((n) => !n.trashed && n.title.trim() && n.id !== currentNoteId)
            return pool
              .sort(
                (a, b) =>
                  new Date(b.updatedAt).getTime() -
                  new Date(a.updatedAt).getTime()
              )
              .slice(0, 8)
              .map((n) => ({ id: n.id, title: n.title, status: n.status, isWiki: n.isWiki ?? false }))
          }

          // Title matches: exact > startsWith > contains, then by length
          const pool = notes.filter((n) => !n.trashed && n.id !== currentNoteId)
          const titleMatches = pool
            .filter(
              (n) =>
                n.title.trim() &&
                n.title.toLowerCase().includes(q)
            )
            .sort((a, b) => {
              const aExact = a.title.toLowerCase() === q ? 0 : 1
              const bExact = b.title.toLowerCase() === q ? 0 : 1
              if (aExact !== bExact) return aExact - bExact
              const aStarts = a.title.toLowerCase().startsWith(q) ? 0 : 1
              const bStarts = b.title.toLowerCase().startsWith(q) ? 0 : 1
              if (aStarts !== bStarts) return aStarts - bStarts
              return a.title.length - b.title.length
            })

          // Alias matches
          const titleIds = new Set(titleMatches.map((n) => n.id))
          const aliasMatches = pool
            .filter(
              (n) =>
                !titleIds.has(n.id)
            )
            .filter((n) =>
              n.aliases?.some((a) => a.toLowerCase().includes(q))
            )
            .map((n) => ({
              id: n.id,
              title: n.title,
              status: n.status,
              isAlias: true,
              isWiki: n.isWiki ?? false,
            }))

          const combined: WikilinkItem[] = [
            ...titleMatches
              .slice(0, 6)
              .map((n) => ({ id: n.id, title: n.title, status: n.status, isWiki: n.isWiki ?? false })),
            ...aliasMatches.slice(0, 2),
          ].slice(0, 8)

          // "Create as Note" option if no exact match
          const hasExact = pool.some(
            (n) =>
              n.title.toLowerCase() === q ||
              n.aliases?.some((a) => a.toLowerCase() === q)
          )
          if (!hasExact && q.length > 0) {
            combined.push({
              id: `__new_note__${q}`,
              title: q,
              status: "inbox",
              isNewNote: true,
            })
          }

          return combined
        },

        render: () => {
          let component: ReactRenderer<WikilinkListRef, WikilinkListProps> | null =
            null
          let popup: TippyInstance[] | null = null

          return {
            onStart: (
              props: Parameters<
                NonNullable<
                  ReturnType<
                    NonNullable<
                      Parameters<typeof Suggestion>[0]["render"]
                    >
                  >["onStart"]
                >
              >[0]
            ) => {
              component = new ReactRenderer(WikilinkList, {
                props,
                editor: props.editor,
              })

              if (!props.clientRect) return

              popup = tippy("body", {
                getReferenceClientRect:
                  props.clientRect as () => DOMRect,
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

            onUpdate: (
              props: Parameters<
                NonNullable<
                  ReturnType<
                    NonNullable<
                      Parameters<typeof Suggestion>[0]["render"]
                    >
                  >["onUpdate"]
                >
              >[0]
            ) => {
              component?.updateProps(props)

              if (!props.clientRect) return

              popup?.[0]?.setProps({
                getReferenceClientRect:
                  props.clientRect as () => DOMRect,
              })
            },

            onKeyDown: (props: { event: KeyboardEvent }) => {
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
        }: {
          editor: import("@tiptap/core").Editor
          range: import("@tiptap/core").Range
          props: WikilinkItem
        }) => {
          const store = usePlotStore.getState()
          if (props.isNewNote) {
            // Create regular note
            const exists = store.notes.some(
              (n) => n.title.toLowerCase() === props.title.toLowerCase()
            )
            if (!exists) store.createNote({ title: props.title })
          }

          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent("[[" + props.title + "]] ")
            .run()
        },
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})
