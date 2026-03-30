"use client"

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
export function WikiQuoteNode({ node }: NodeViewProps) {
  const { sourceTitle, quotedText, quotedAt } = node.attrs

  return (
    <NodeViewWrapper className="wiki-quote-wrapper my-4" data-type="wikiQuote">
      <blockquote className="relative border-l-[3px] border-accent/60 bg-accent/5 rounded-r-md pl-4 pr-4 py-3 not-prose">
        <p className="text-note text-foreground/90 leading-relaxed whitespace-pre-wrap">
          {quotedText || "Empty quote"}
        </p>
        <footer className="mt-2 flex items-center gap-1.5 text-2xs text-muted-foreground">
          <FileText className="shrink-0" size={12} weight="regular" />
          <span className="font-medium">{sourceTitle || "Unknown source"}</span>
          {quotedAt && (
            <span className="text-muted-foreground/60">
              · {new Date(quotedAt).toLocaleDateString()}
            </span>
          )}
        </footer>
      </blockquote>
    </NodeViewWrapper>
  )
}
