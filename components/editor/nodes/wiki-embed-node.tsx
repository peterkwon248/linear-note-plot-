"use client"

import { useMemo } from "react"
import { Node, mergeAttributes } from "@tiptap/core"
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react"
import type { NodeViewProps } from "@tiptap/react"
import { BookOpen, ArrowSquareOut, X as PhX, ArrowsIn } from "@/lib/editor/editor-icons"
import { usePlotStore } from "@/lib/store"
import { useBlockResize } from "@/components/editor/hooks/use-block-resize"
import { BlockResizeHandles } from "@/components/editor/hooks/block-resize-handles"
import { WikiArticleEncyclopedia } from "@/components/wiki-editor/wiki-article-encyclopedia"
import type { WikiArticle } from "@/lib/types"

// ── Helpers ──────────────────────────────────────────────────────────

/** Filter article blocks to only include specified sections and their children */
function filterArticleBySections(article: WikiArticle, sectionIds: string[]): WikiArticle {
  if (!sectionIds || sectionIds.length === 0) return article

  const sectionIdSet = new Set(sectionIds)
  const filteredBlocks: typeof article.blocks = []
  let includeChildren = false

  for (const block of article.blocks) {
    if (block.type === "section") {
      if (sectionIdSet.has(block.id)) {
        includeChildren = true
        filteredBlocks.push(block)
      } else {
        includeChildren = false
      }
    } else if (includeChildren) {
      filteredBlocks.push(block)
    }
  }

  return { ...article, blocks: filteredBlocks }
}

// ── WikiEmbed View ───────────────────────────────────────────────────

function WikiEmbedView({ node, deleteNode, editor: parentEditor, updateAttributes }: NodeViewProps) {
  const articleId = node.attrs.articleId as string
  const sectionIds = node.attrs.sectionIds as string[] | null
  const embedWidth = node.attrs.width as number | null
  const embedHeight = node.attrs.height as number | null
  const article = usePlotStore((s) => s.wikiArticles.find((a) => a.id === articleId))
  const parentEditable = parentEditor?.isEditable ?? true
  const { containerRef: resizeRef, isResizing, onResizeStart } = useBlockResize(embedWidth, embedHeight, updateAttributes)

  // Apply section filter
  const displayArticle = useMemo(() => {
    if (!article) return null
    if (!sectionIds || sectionIds.length === 0) return article
    return filterArticleBySections(article, sectionIds)
  }, [article, sectionIds])

  // Compute section label for header
  const sectionLabel = useMemo(() => {
    if (!sectionIds || sectionIds.length === 0 || !article) return null
    const names = sectionIds
      .map((id) => article.blocks.find((b) => b.id === id)?.title)
      .filter(Boolean)
    return names.length > 0 ? names.join(", ") : null
  }, [sectionIds, article])

  // Not found
  if (!article || !displayArticle) {
    return (
      <NodeViewWrapper>
        <div
          contentEditable={false}
          className="not-draggable border-l-4 border-destructive/40 rounded-lg p-3 my-2 select-none bg-secondary/20"
        >
          <div className="flex items-center gap-2 text-muted-foreground/70">
            <BookOpen size={14} />
            <span className="text-2xs italic">Wiki article not found</span>
            <button
              type="button"
              onClick={() => deleteNode()}
              className="ml-auto rounded p-0.5 text-muted-foreground/60 hover:text-foreground hover:bg-hover-bg transition-colors"
              title="Remove embed"
            >
              <PhX size={12} />
            </button>
          </div>
        </div>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper>
      <div
        contentEditable={false}
        ref={resizeRef}
        className={`not-draggable border border-border-subtle rounded-lg my-2 select-none hover:border-border transition-colors group block-resize-wrapper overflow-hidden ${isResizing ? "is-resizing" : ""}`}
        style={{
          ...(embedWidth ? { width: `${embedWidth}px` } : {}),
          ...(embedHeight ? { height: `${embedHeight}px`, overflowY: "auto" as const } : {}),
        }}
      >
        {parentEditable && <BlockResizeHandles onResizeStart={onResizeStart} />}
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle bg-secondary/20">
          <BookOpen size={14} className="text-teal-500 shrink-0" />
          <span className="text-note font-medium text-foreground truncate flex-1">
            {article.title}
            {sectionLabel && (
              <span className="text-2xs text-muted-foreground/60 ml-1.5">
                &sect; {sectionLabel}
              </span>
            )}
          </span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                import("@/lib/table-route").then(({ setActiveRoute }) => setActiveRoute("/wiki"))
                import("@/lib/wiki-article-nav").then(({ navigateToWikiArticle }) => navigateToWikiArticle(articleId))
              }}
              className="rounded p-0.5 text-muted-foreground/70 hover:text-foreground hover:bg-hover-bg transition-colors"
              title="Open wiki article"
            >
              <ArrowSquareOut size={12} />
            </button>
            {(embedWidth || embedHeight) && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); updateAttributes({ width: null, height: null }) }}
                className="rounded p-0.5 text-muted-foreground/60 hover:text-foreground hover:bg-hover-bg transition-colors"
                title="Reset size"
              >
                <ArrowsIn size={12} />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); deleteNode() }}
              className="rounded p-0.5 text-muted-foreground/60 hover:text-foreground hover:bg-hover-bg transition-colors"
              title="Remove embed"
            >
              <PhX size={12} />
            </button>
          </div>
        </div>
        {/* Wiki content — read-only encyclopedia view */}
        <div className={embedHeight ? "overflow-y-auto h-full" : ""}>
          <WikiArticleEncyclopedia
            article={displayArticle}
            isEditing={false}
            onBack={() => {}}
          />
        </div>
      </div>
    </NodeViewWrapper>
  )
}

// ── Node Definition ──────────────────────────────────────────────────

export const WikiEmbedNode = Node.create({
  name: "wikiEmbed",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      articleId: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute("data-article-id"),
        renderHTML: (attributes: Record<string, string>) => ({
          "data-article-id": attributes.articleId,
        }),
      },
      sectionIds: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const raw = element.getAttribute("data-section-ids")
          return raw ? JSON.parse(raw) : null
        },
        renderHTML: (attributes: Record<string, any>) =>
          attributes.sectionIds ? { "data-section-ids": JSON.stringify(attributes.sectionIds) } : {},
      },
      width: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const w = element.getAttribute("data-width")
          return w ? parseInt(w, 10) : null
        },
        renderHTML: (attributes: Record<string, any>) => attributes.width ? { "data-width": attributes.width } : {},
      },
      height: {
        default: null,
        parseHTML: (el: HTMLElement) => {
          const h = el.getAttribute("data-height")
          return h ? parseInt(h, 10) : null
        },
        renderHTML: (attrs: Record<string, any>) => attrs.height ? { "data-height": attrs.height } : {},
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="wiki-embed"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "wiki-embed" })]
  },

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor: e }) => {
        const sel = e.state.selection as any
        if (sel.node?.type.name === "wikiEmbed") {
          e.commands.deleteSelection()
          return true
        }
        const { $from } = e.state.selection
        const before = $from.nodeBefore
        if (before?.type.name === "wikiEmbed") {
          e.commands.deleteRange({
            from: $from.pos - before.nodeSize,
            to: $from.pos,
          })
          return true
        }
        return false
      },
      Delete: ({ editor: e }) => {
        const sel = e.state.selection as any
        if (sel.node?.type.name === "wikiEmbed") {
          e.commands.deleteSelection()
          return true
        }
        return false
      },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(WikiEmbedView)
  },
})
