"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Node, mergeAttributes } from "@tiptap/core"
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react"
import type { NodeViewProps } from "@tiptap/react"
import { ListBullets } from "@phosphor-icons/react/dist/ssr/ListBullets"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { BookmarkSimple } from "@phosphor-icons/react/dist/ssr/BookmarkSimple"
import { Plus } from "@phosphor-icons/react/dist/ssr/Plus"
import { DotsSixVertical } from "@phosphor-icons/react/dist/ssr/DotsSixVertical"

interface TocItem {
  id: string
  level: number
  textContent: string
  pos: number
  isActive: boolean
  isScrolledOver: boolean
}

interface DocumentSection {
  id: string
  title: string
  pos: number
}

/** Scan the editor document for all sectionBlock nodes. */
function collectSectionsFromDoc(editor: { state: { doc: { descendants: (cb: (node: any, pos: number) => boolean | void) => void } } }): DocumentSection[] {
  const result: DocumentSection[] = []
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === "sectionBlock") {
      result.push({
        id: node.attrs.id as string,
        title: node.attrs.title as string,
        pos,
      })
    }
  })
  return result
}

function TocNodeView({ editor, getPos, node, deleteNode }: NodeViewProps) {
  const [items, setItems] = useState<TocItem[]>([])
  const [sections, setSections] = useState<DocumentSection[]>([])
  const [addingSection, setAddingSection] = useState(false)
  const [sectionInput, setSectionInput] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync TOC headings + document sections on every editor update
  useEffect(() => {
    const update = () => {
      const content = editor.storage?.tableOfContents?.content as TocItem[] | undefined
      setItems(content ?? [])
      setSections(collectSectionsFromDoc(editor))
    }

    update()
    editor.on("update", update)
    return () => {
      editor.off("update", update)
    }
  }, [editor])

  useEffect(() => {
    if (addingSection) {
      inputRef.current?.focus()
    }
  }, [addingSection])

  const scrollToPos = useCallback((pos: number) => {
    // Focus editor first (clicking inside contentEditable=false TOC loses focus)
    editor.chain().focus().setTextSelection(pos).run()
    // Try nodeDOM first (works for block nodes like sectionBlock), fall back to domAtPos
    try {
      const dom = editor.view.nodeDOM(pos) as HTMLElement | null
      if (dom) {
        dom.scrollIntoView({ behavior: "smooth", block: "center" })
        return
      }
      const domInfo = editor.view.domAtPos(pos)
      const el = (domInfo.node instanceof HTMLElement ? domInfo.node : domInfo.node.parentElement) as HTMLElement | null
      el?.scrollIntoView?.({ behavior: "smooth", block: "center" })
    } catch {
      // ignore if DOM pos resolution fails
    }
  }, [editor])

  const handleHeadingClick = (item: TocItem) => {
    scrollToPos(item.pos)
  }

  const handleSectionClick = (section: DocumentSection) => {
    scrollToPos(section.pos)
  }

  const handleAddSection = () => {
    const title = sectionInput.trim()
    if (!title) {
      setAddingSection(false)
      setSectionInput("")
      return
    }

    // Get cursor position — if it's inside the TOC block, place section right after the TOC block
    const { from } = editor.state.selection
    const tocPos = typeof getPos === "function" ? getPos() : undefined
    const tocEnd = tocPos != null ? tocPos + node.nodeSize : -1

    const insertPos = (tocPos != null && from >= tocPos && from <= tocEnd) ? tocEnd : from

    editor
      .chain()
      .focus()
      .insertContentAt(insertPos, {
        type: "sectionBlock",
        attrs: { id: `section-${Date.now()}`, title },
        content: [{ type: "paragraph" }],
      })
      .run()

    setAddingSection(false)
    setSectionInput("")
  }

  const handleDeleteSection = (sectionId: string) => {
    // Find the sectionBlock node and unwrap it (keep its content)
    let targetPos: number | null = null
    editor.state.doc.descendants((n, pos) => {
      if (n.type.name === "sectionBlock" && n.attrs.id === sectionId) {
        targetPos = pos
        return false
      }
    })
    if (targetPos !== null) {
      const blockNode = editor.state.doc.nodeAt(targetPos)
      if (blockNode) {
        const { tr } = editor.state
        tr.replaceWith(targetPos, targetPos + blockNode.nodeSize, blockNode.content)
        editor.view.dispatch(tr)
      }
    }
  }

  const indentClass: Record<number, string> = {
    1: "",
    2: "ml-4",
    3: "ml-8",
    4: "ml-12",
    5: "ml-16",
    6: "ml-20",
  }

  return (
    <NodeViewWrapper>
      <div
        contentEditable={false}
        className="bg-secondary/30 border border-border/50 rounded-lg p-4 my-2 select-none group/toc relative"
      >
        {/* Drag handle */}
        {editor.isEditable && (
          <div
            contentEditable={false}
            data-drag-handle
            className="absolute left-0 top-0 bottom-0 w-5 flex items-center justify-center opacity-0 group-hover/toc:opacity-100 transition-opacity cursor-grab active:cursor-grabbing -translate-x-full"
          >
            <DotsSixVertical size={14} weight="bold" className="text-muted-foreground/40 hover:text-muted-foreground" />
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-2 mb-3 text-muted-foreground">
          <ListBullets size={14} weight="bold" />
          <span className="text-xs font-semibold uppercase tracking-wider flex-1">
            Table of Contents
          </span>
          {editor.isEditable && (
            <button
              type="button"
              onClick={() => deleteNode()}
              className="rounded p-0.5 text-muted-foreground/50 hover:text-foreground hover:bg-hover-bg transition-colors"
              title="Remove TOC block"
            >
              <PhX size={12} weight="bold" />
            </button>
          )}
        </div>

        {/* TOC items */}
        {items.length === 0 && sections.length === 0 ? (
          <p className="text-xs text-muted-foreground/50 italic">
            No headings found. Add headings to populate the outline.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {items.map((item) => (
              <li
                key={item.id}
                className={indentClass[item.level] ?? ""}
              >
                <button
                  type="button"
                  onClick={() => handleHeadingClick(item)}
                  className={[
                    "w-full text-left text-sm leading-relaxed rounded px-1 py-0.5 transition-colors duration-75 cursor-pointer",
                    item.isActive
                      ? "text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-hover-bg",
                  ].join(" ")}
                >
                  {item.textContent || <span className="opacity-40 italic">Untitled</span>}
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Document sections */}
        {sections.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-border/30">
            <span className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider">
              Sections
            </span>
            <ul className="mt-1 space-y-0.5">
              {sections.map((section) => (
                <li key={section.id} className="flex items-center gap-1 group">
                  <button
                    type="button"
                    onClick={() => handleSectionClick(section)}
                    className="flex items-center gap-1.5 flex-1 text-left text-sm leading-relaxed rounded px-1 py-0.5 text-foreground hover:text-accent hover:bg-hover-bg transition-colors duration-75 cursor-pointer"
                  >
                    <BookmarkSimple size={11} weight="fill" className="shrink-0 text-accent" />
                    {section.title}
                  </button>
                  {editor.isEditable && (
                    <button
                      type="button"
                      onClick={() => handleDeleteSection(section.id)}
                      className="opacity-0 group-hover:opacity-100 rounded p-0.5 text-muted-foreground/50 hover:text-foreground hover:bg-hover-bg transition-all"
                      title="Remove section (keep content)"
                    >
                      <PhX size={10} weight="bold" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Add section */}
        {editor.isEditable && (
          <div className="mt-2">
            {addingSection ? (
              <div className="flex items-center gap-1.5">
                <BookmarkSimple size={11} weight="fill" className="text-accent shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={sectionInput}
                  onChange={(e) => setSectionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); handleAddSection() }
                    if (e.key === "Escape") { setAddingSection(false); setSectionInput("") }
                  }}
                  onBlur={handleAddSection}
                  placeholder="Section title..."
                  className="flex-1 text-xs bg-transparent border-b border-border/50 focus:border-primary outline-none py-0.5 text-foreground placeholder:text-muted-foreground/40"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAddingSection(true)}
                className="flex items-center gap-1 text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors cursor-pointer rounded px-1 py-0.5 hover:bg-hover-bg"
              >
                <Plus size={10} weight="bold" />
                Add section
              </button>
            )}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  )
}

export const TocBlockNode = Node.create({
  name: "tocBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  parseHTML() {
    return [{ tag: 'div[data-type="toc-block"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "toc-block" })]
  },

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor: e }) => {
        const sel = e.state.selection as any
        if (sel.node?.type.name === "tocBlock") {
          e.commands.deleteSelection()
          return true
        }
        // Check if cursor is right after a tocBlock
        const { $from } = e.state.selection
        const before = $from.nodeBefore
        if (before?.type.name === "tocBlock") {
          e.commands.deleteRange({ from: $from.pos - before.nodeSize, to: $from.pos })
          return true
        }
        return false
      },
      Delete: ({ editor: e }) => {
        const sel = e.state.selection as any
        if (sel.node?.type.name === "tocBlock") {
          e.commands.deleteSelection()
          return true
        }
        return false
      },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(TocNodeView)
  },
})
