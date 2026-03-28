"use client"

import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from "react"
import { Extension } from "@tiptap/core"
import Suggestion from "@tiptap/suggestion"
import { PluginKey } from "@tiptap/pm/state"
import { ReactRenderer } from "@tiptap/react"
import type { Editor, Range } from "@tiptap/core"
import type { SuggestionProps, SuggestionKeyDownProps } from "@tiptap/suggestion"
// Import to pick up module augmentation for setDetails / unsetDetails
import "@tiptap/extension-details"
import { usePlotStore } from "@/lib/store"
import { expandPlaceholders } from "@/lib/store/slices/templates"
import type { NoteTemplate } from "@/lib/types"
import { TextHOne } from "@phosphor-icons/react/dist/ssr/TextHOne"
import { TextHTwo } from "@phosphor-icons/react/dist/ssr/TextHTwo"
import { TextHThree } from "@phosphor-icons/react/dist/ssr/TextHThree"
import { ListBullets } from "@phosphor-icons/react/dist/ssr/ListBullets"
import { ListNumbers } from "@phosphor-icons/react/dist/ssr/ListNumbers"
import { CheckSquare } from "@phosphor-icons/react/dist/ssr/CheckSquare"
import { Quotes } from "@phosphor-icons/react/dist/ssr/Quotes"
import { Code as PhCode } from "@phosphor-icons/react/dist/ssr/Code"
import { Minus as PhMinus } from "@phosphor-icons/react/dist/ssr/Minus"
import { Table as PhTable } from "@phosphor-icons/react/dist/ssr/Table"
import { CaretRight } from "@phosphor-icons/react/dist/ssr/CaretRight"
import { MathOperations } from "@phosphor-icons/react/dist/ssr/MathOperations"
import { Layout } from "@phosphor-icons/react/dist/ssr/Layout"
import { Info } from "@phosphor-icons/react/dist/ssr/Info"
import { Article } from "@phosphor-icons/react/dist/ssr/Article"
import { Columns as PhColumns } from "@phosphor-icons/react/dist/ssr/Columns"
import { Note as PhNote } from "@phosphor-icons/react/dist/ssr/Note"
import { IdentificationCard } from "@phosphor-icons/react/dist/ssr/IdentificationCard"
import { Cube } from "@phosphor-icons/react/dist/ssr/Cube"

interface CommandItem {
  title: string
  description: string
  icon: React.ElementType
  command: (props: { editor: Editor; range: Range }) => void
}

const COMMANDS: CommandItem[] = [
  {
    title: "Heading 1",
    description: "Large heading",
    icon: TextHOne,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run()
    },
  },
  {
    title: "Heading 2",
    description: "Medium heading",
    icon: TextHTwo,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run()
    },
  },
  {
    title: "Heading 3",
    description: "Small heading",
    icon: TextHThree,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run()
    },
  },
  {
    title: "Bullet List",
    description: "Unordered list",
    icon: ListBullets,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run()
    },
  },
  {
    title: "Numbered List",
    description: "Ordered list",
    icon: ListNumbers,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run()
    },
  },
  {
    title: "Checklist",
    description: "Task list with checkboxes",
    icon: CheckSquare,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run()
    },
  },
  {
    title: "Blockquote",
    description: "Blockquote",
    icon: Quotes,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run()
    },
  },
  {
    title: "Code Block",
    description: "Code with syntax highlighting",
    icon: PhCode,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run()
    },
  },
  {
    title: "Toggle",
    description: "Collapsible content",
    icon: CaretRight,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setDetails().run()
    },
  },
  {
    title: "Divider",
    description: "Horizontal rule",
    icon: PhMinus,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run()
    },
  },
  {
    title: "Table",
    description: "3×3 table with header",
    icon: PhTable,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
    },
  },
  {
    title: "Math",
    description: "LaTeX math equation",
    icon: MathOperations,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertContent("$$\n\\displaystyle \n$$").run()
    },
  },
  {
    title: "Table of Contents (TOC)",
    description: "Auto-generated heading outline",
    icon: Layout,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertContent({ type: "tocBlock" }).run()
    },
  },
  {
    title: "Callout",
    description: "Colored info/warning/tip box",
    icon: Info,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({ type: "calloutBlock", attrs: { calloutType: "info" }, content: [{ type: "paragraph" }] })
        .run()
    },
  },
  {
    title: "Summary",
    description: "Collapsible summary / TL;DR section",
    icon: Article,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({ type: "summaryBlock", content: [{ type: "paragraph" }] })
        .run()
    },
  },
  {
    title: "Columns",
    description: "2-column side-by-side layout",
    icon: PhColumns,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: "columnsBlock",
          content: [
            { type: "columnCell", content: [{ type: "paragraph" }] },
            { type: "columnCell", content: [{ type: "paragraph" }] },
          ],
        })
        .run()
    },
  },
  {
    title: "Embed Note",
    description: "Embed a note preview",
    icon: PhNote,
    command: ({ editor, range }) => {
      // Insert with no noteId — shows "Note not found" placeholder
      // TODO: Wire up note picker UI
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({ type: "noteEmbed", attrs: { noteId: null } })
        .run()
    },
  },
  {
    title: "Infobox",
    description: "Key-value info card",
    icon: IdentificationCard,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: "infoboxBlock",
          attrs: {
            title: "Info",
            rows: [{ label: "", value: "" }],
          },
        })
        .run()
    },
  },
  {
    title: "Block",
    description: "Wrap content in a draggable block",
    icon: Cube,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({ type: "contentBlock", content: [{ type: "paragraph" }] })
        .run()
    },
  },
]

interface CommandListRef {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean
}

interface CommandListProps extends SuggestionProps {
  items: CommandItem[]
}

const CommandList = forwardRef<CommandListRef, CommandListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      setSelectedIndex(0)
    }, [items])

    // Scroll selected item into view
    useEffect(() => {
      const container = containerRef.current
      if (!container) return
      const item = container.children[selectedIndex] as HTMLElement | undefined
      if (item) {
        item.scrollIntoView({ block: "nearest" })
      }
    }, [selectedIndex])

    const selectItem = useCallback(
      (index: number) => {
        const item = items[index]
        if (item) command(item)
      },
      [items, command]
    )

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: SuggestionKeyDownProps) => {
        if (event.key === "ArrowUp") {
          setSelectedIndex((i) => (i + items.length - 1) % items.length)
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
      <div
        ref={containerRef}
        className="min-w-[220px] max-h-[320px] overflow-y-auto bg-[var(--popover)] border border-[var(--border)] rounded-[10px] shadow-[0_8px_32px_rgba(0,0,0,0.2)] p-1"
      >
        {items.map((item, index) => {
          const Icon = item.icon
          return (
            <button
              key={item.title}
              onClick={() => selectItem(index)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={[
                "w-full flex items-center gap-[10px] px-[10px] py-2 rounded-[7px] border-none outline-none cursor-pointer text-left transition-[background] duration-100",
                index === selectedIndex
                  ? "bg-[rgba(94,106,210,0.12)] text-[var(--foreground)]"
                  : "bg-transparent text-[var(--muted-foreground)]",
              ].join(" ")}
            >
              <div className="w-7 h-7 rounded-[6px] flex items-center justify-center bg-[rgba(94,106,210,0.08)] shrink-0">
                <Icon size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-note font-medium leading-[1.3]">
                  {item.title}
                </div>
                <div className="text-2xs opacity-60 leading-[1.3] mt-px">
                  {item.description}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    )
  }
)

CommandList.displayName = "CommandList"

const slashCommandPluginKey = new PluginKey("slashCommand")

export const SlashCommandExtension = Extension.create({
  name: "slashCommand",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        pluginKey: slashCommandPluginKey,
        command: ({ editor, range, props }: { editor: Editor; range: Range; props: CommandItem }) => {
          props.command({ editor, range })
        },
        items: ({ query }: { query: string }) => {
          const q = query.toLowerCase()
          const baseItems = COMMANDS.filter((item) =>
            item.title.toLowerCase().includes(q)
          )

          // Dynamically add template items from the store
          const templates = (usePlotStore.getState().templates ?? []) as NoteTemplate[]
          const templateItems: CommandItem[] = templates
            .filter((t) => t.name.toLowerCase().includes(q) || "template".includes(q))
            .map((t) => ({
              title: `Template: ${t.name}`,
              description: t.description || "Insert template content",
              icon: Layout,
              command: ({ editor, range }: { editor: Editor; range: Range }) => {
                const expanded = expandPlaceholders(t.content)
                editor.chain().focus().deleteRange(range).insertContent(expanded).run()
              },
            }))

          return [...baseItems, ...templateItems]
        },
        render: () => {
          let component: ReactRenderer<CommandListRef> | null = null
          let popup: HTMLDivElement | null = null

          return {
            onStart: (props: SuggestionProps) => {
              component = new ReactRenderer(CommandList, {
                props,
                editor: props.editor,
              })

              popup = document.createElement("div")
              popup.style.position = "fixed"
              popup.style.zIndex = "1000"
              document.body.appendChild(popup)

              // Position popup
              const { view } = props.editor
              const coords = view.coordsAtPos(props.range.from)
              popup.style.left = `${coords.left}px`
              popup.style.top = `${coords.bottom + 6}px`

              if (component.element) {
                popup.appendChild(component.element)
              }
            },

            onUpdate(props: SuggestionProps) {
              component?.updateProps(props)
              if (popup) {
                const { view } = props.editor
                const coords = view.coordsAtPos(props.range.from)
                popup.style.left = `${coords.left}px`
                popup.style.top = `${coords.bottom + 6}px`
              }
            },

            onKeyDown(props: SuggestionKeyDownProps) {
              if (props.event.key === "Escape") {
                popup?.remove()
                component?.destroy()
                popup = null
                component = null
                return true
              }
              return component?.ref?.onKeyDown(props) ?? false
            },

            onExit() {
              popup?.remove()
              component?.destroy()
              popup = null
              component = null
            },
          }
        },
      } as const,
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
