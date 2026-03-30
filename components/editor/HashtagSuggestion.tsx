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
import { usePlotStore } from "@/lib/store"
import type { Tag } from "@/lib/types"

// ── Types ─────────────────────────────────────────────────────────────────────

interface HashtagItem {
  id: string
  name: string
  color: string
  isNew?: boolean
}

interface HashtagListProps {
  items: HashtagItem[]
  command: (item: HashtagItem) => void
}

export interface HashtagListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

// ── Dropdown Component ────────────────────────────────────────────────────────

const HashtagList = forwardRef<HashtagListRef, HashtagListProps>(
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
      <div className="z-50 min-w-[160px] max-w-[240px] overflow-hidden rounded-md border border-border bg-surface-overlay shadow-md">
        <div className="px-2 py-1 border-b border-border-subtle">
          <span className="text-2xs font-medium text-muted-foreground">
            Tags
          </span>
        </div>
        <div className="max-h-[200px] overflow-y-auto py-1">
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
              {item.isNew ? (
                <>
                  <span className="text-muted-foreground text-2xs">+</span>
                  <span className="text-muted-foreground">
                    Create{" "}
                    <span className="font-medium text-foreground">
                      #{item.name}
                    </span>
                  </span>
                </>
              ) : (
                <>
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate">#{item.name}</span>
                </>
              )}
            </button>
          ))}
        </div>
      </div>
    )
  }
)
HashtagList.displayName = "HashtagList"

// ── Suggestion Plugin Key ─────────────────────────────────────────────────────

const hashtagSuggestionKey = new PluginKey("hashtag-suggestion")

// ── Extension ─────────────────────────────────────────────────────────────────

export const HashtagSuggestion = Extension.create({
  name: "hashtagSuggestion",

  addOptions() {
    return {
      suggestion: {
        char: "#",
        allowSpaces: false,
        allowedPrefixes: [" ", "\n", null],
        pluginKey: hashtagSuggestionKey,

        items: ({ query }: { query: string }) => {
          const tags: Tag[] = usePlotStore.getState().tags
          const q = query.toLowerCase().trim()

          const filtered = tags
            .filter((tag) => tag.name.toLowerCase().includes(q))
            .slice(0, 8)
            .map((tag) => ({
              id: tag.id,
              name: tag.name,
              color: tag.color,
            }))

          // Show "Create" option only when no exact match and query is non-empty
          const hasExact =
            q.length > 0 &&
            tags.some((tag) => tag.name.toLowerCase() === q)

          if (q.length > 0 && !hasExact) {
            filtered.push({
              id: `__new__${q}`,
              name: q,
              color: "var(--accent)",
              isNew: true,
            } as HashtagItem)
          }

          return filtered
        },

        render: () => {
          let component: ReactRenderer<HashtagListRef, HashtagListProps> | null =
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
              component = new ReactRenderer(HashtagList, {
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
          props: HashtagItem
        }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent("#" + props.name + " ")
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
