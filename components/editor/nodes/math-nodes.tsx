"use client"

import { useEffect, useRef, useState } from "react"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { NodeViewWrapper } from "@tiptap/react"
import type { NodeViewProps } from "@tiptap/react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { InlineMath, BlockMath } from "@tiptap/extension-mathematics"
import katex from "katex"

// ── KaTeX render helper ───────────────────────────────────────────────────────

function renderKatex(
  container: HTMLElement,
  latex: string,
  displayMode: boolean,
): void {
  if (!latex.trim()) {
    container.innerHTML = ""
    return
  }
  try {
    katex.render(latex, container, {
      displayMode,
      throwOnError: false,
      trust: false,
    })
  } catch {
    container.textContent = latex
  }
}

// ── Inline Math NodeView ──────────────────────────────────────────────────────

function InlineMathView({ node, updateAttributes, editor }: NodeViewProps) {
  const editable = editor.isEditable
  const latex = (node.attrs.latex as string) || ""
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(latex)
  const inputRef = useRef<HTMLInputElement>(null)
  const renderRef = useRef<HTMLSpanElement>(null)
  const previewRef = useRef<HTMLSpanElement>(null)

  // Render KaTeX inside the chip
  useEffect(() => {
    if (renderRef.current) {
      renderKatex(renderRef.current, latex, false)
    }
  }, [latex])

  // Live preview inside popover
  useEffect(() => {
    if (previewRef.current) {
      renderKatex(previewRef.current, draft, false)
    }
  }, [draft])

  // Sync draft when popover opens
  useEffect(() => {
    if (open) {
      setDraft(latex)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open, latex])

  function save() {
    if (draft.trim()) {
      updateAttributes({ latex: draft.trim() })
    }
    setOpen(false)
  }

  const isEmpty = !latex.trim()

  const chipClass =
    "inline-flex items-center align-middle rounded px-1 py-0.5 text-[0.9em] " +
    "bg-secondary/30 border border-border/40 " +
    (editable
      ? "cursor-pointer hover:bg-secondary/50 hover:border-border/70 transition-colors"
      : "")

  const chip = (
    <span contentEditable={false} className={chipClass}>
      {isEmpty ? (
        <span className="text-muted-foreground text-xs font-mono">$ math $</span>
      ) : (
        <span ref={renderRef} />
      )}
    </span>
  )

  if (!editable) {
    return (
      <NodeViewWrapper as="span">
        {isEmpty ? (
          <span contentEditable={false} className={chipClass}>
            <span className="text-muted-foreground text-xs font-mono">$ math $</span>
          </span>
        ) : (
          <span contentEditable={false} className={chipClass}>
            <span ref={renderRef} />
          </span>
        )}
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper as="span">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{chip}</PopoverTrigger>
        <PopoverContent
          className="w-72 p-3"
          align="start"
          side="bottom"
          sideOffset={6}
          collisionPadding={16}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div className="flex flex-col gap-3">
            <label className="text-xs font-medium text-muted-foreground">
              Inline LaTeX
            </label>
            <input
              ref={inputRef}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  save()
                }
                if (e.key === "Escape") {
                  setOpen(false)
                }
              }}
              placeholder="E = mc^2"
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm font-mono outline-none focus:ring-1 focus:ring-ring"
            />
            {/* Live preview */}
            <div className="min-h-[2rem] rounded-md bg-muted/40 px-3 py-2 text-center text-sm flex items-center justify-center">
              {draft.trim() ? (
                <span ref={previewRef} />
              ) : (
                <span className="text-muted-foreground text-xs">Preview</span>
              )}
            </div>
            <button
              type="button"
              onClick={save}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Save
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </NodeViewWrapper>
  )
}

// ── Block Math NodeView ───────────────────────────────────────────────────────

function BlockMathView({ node, updateAttributes, editor }: NodeViewProps) {
  const editable = editor.isEditable
  const latex = (node.attrs.latex as string) || ""
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(latex)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const renderRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (renderRef.current) {
      renderKatex(renderRef.current, latex, true)
    }
  }, [latex])

  useEffect(() => {
    if (previewRef.current) {
      renderKatex(previewRef.current, draft, true)
    }
  }, [draft])

  useEffect(() => {
    if (open) {
      setDraft(latex)
      setTimeout(() => {
        textareaRef.current?.focus()
        textareaRef.current?.select()
      }, 50)
    }
  }, [open, latex])

  function save() {
    if (draft.trim()) {
      updateAttributes({ latex: draft.trim() })
    }
    setOpen(false)
  }

  const isEmpty = !latex.trim()

  const blockClass =
    "my-2 flex w-full items-center justify-center rounded-lg border border-border/40 px-4 py-3 " +
    (editable
      ? "cursor-pointer hover:bg-secondary/30 hover:border-border/70 transition-colors"
      : "")

  const blockContent = isEmpty ? (
    <span className="text-muted-foreground text-sm font-mono">$$ math $$</span>
  ) : (
    <div ref={renderRef} className="overflow-x-auto" />
  )

  if (!editable) {
    return (
      <NodeViewWrapper>
        <div contentEditable={false} className={blockClass}>
          {isEmpty ? (
            <span className="text-muted-foreground text-sm font-mono">$$ math $$</span>
          ) : (
            <div ref={renderRef} className="overflow-x-auto" />
          )}
        </div>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div contentEditable={false} className={blockClass}>
            {blockContent}
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-96 p-3"
          align="center"
          side="bottom"
          sideOffset={6}
          collisionPadding={16}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div className="flex flex-col gap-3">
            <label className="text-xs font-medium text-muted-foreground">
              Block LaTeX
            </label>
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault()
                  save()
                }
                if (e.key === "Escape") {
                  setOpen(false)
                }
              }}
              rows={4}
              placeholder="\sum_{i=1}^{n} x_i"
              className="w-full resize-none rounded-md border border-border bg-background px-2 py-1.5 text-sm font-mono outline-none focus:ring-1 focus:ring-ring"
            />
            {/* Live preview */}
            <div className="min-h-[3rem] rounded-md bg-muted/40 px-3 py-2 text-center text-sm flex items-center justify-center overflow-x-auto">
              {draft.trim() ? (
                <div ref={previewRef} />
              ) : (
                <span className="text-muted-foreground text-xs">Preview</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Ctrl+Enter to save</span>
              <button
                type="button"
                onClick={save}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </NodeViewWrapper>
  )
}

// ── Extended Nodes (override addNodeView only) ────────────────────────────────

export const InlineMathNode = InlineMath.extend({
  addNodeView() {
    return ReactNodeViewRenderer(InlineMathView)
  },
})

export const BlockMathNode = BlockMath.extend({
  addNodeView() {
    return ReactNodeViewRenderer(BlockMathView)
  },
})
