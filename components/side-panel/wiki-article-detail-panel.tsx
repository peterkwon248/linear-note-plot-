"use client"

import { useMemo, useState } from "react"
import { usePlotStore } from "@/lib/store"
import { format, formatDistanceToNow } from "date-fns"
import { CalendarBlank } from "@phosphor-icons/react/dist/ssr/CalendarBlank"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { TextAlignLeft } from "@phosphor-icons/react/dist/ssr/TextAlignLeft"
import { Tag as PhTag } from "@phosphor-icons/react/dist/ssr/Tag"
import { Info as PhInfo } from "@phosphor-icons/react/dist/ssr/Info"
import { Layout } from "@phosphor-icons/react/dist/ssr/Layout"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { Image as PhImage } from "@phosphor-icons/react/dist/ssr/Image"
import { PushPin } from "@phosphor-icons/react/dist/ssr/PushPin"
import { FolderOpen } from "@phosphor-icons/react/dist/ssr/FolderOpen"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { FolderPicker } from "@/components/folder-picker"
import { IconWiki } from "@/components/plot-icons"
import { setActiveRoute } from "@/lib/table-route"
import type { WikiArticle } from "@/lib/types"

function InspectorSection({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="px-4 py-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-2xs font-medium text-muted-foreground">
          {title}
        </span>
      </div>
      {children}
    </div>
  )
}

export function WikiArticleDetailPanel({ article }: { article: WikiArticle | null }) {
  const wikiCategories = usePlotStore((s) => s.wikiCategories)
  const toggleWikiArticlePin = usePlotStore((s) => s.toggleWikiArticlePin)
  const tags = usePlotStore((s) => s.tags)
  const notes = usePlotStore((s) => s.notes)
  const attachments = usePlotStore((s) => s.attachments)
  const folders = usePlotStore((s) => s.folders)
  // PR (c): N:M membership actions for the wiki Folders chip strip.
  // Mirrors the note side panel — chips with X to remove, "+ Add" to open
  // the multi-select picker.
  const removeWikiFromFolder = usePlotStore((s) => s.removeWikiFromFolder)
  const setWikiFolders = usePlotStore((s) => s.setWikiFolders)
  const [folderOpen, setFolderOpen] = useState(false)

  const articleFolders = useMemo(() => {
    if (!article?.folderIds?.length) return []
    return folders.filter(
      (f) => f.kind === "wiki" && article.folderIds.includes(f.id),
    )
  }, [article?.folderIds, folders])

  const articleCategories = useMemo(() => {
    if (!article?.categoryIds?.length) return []
    return wikiCategories.filter((c) => article.categoryIds!.includes(c.id))
  }, [article?.categoryIds, wikiCategories])

  const articleTags = useMemo(() => {
    if (!article?.tags?.length) return []
    return tags.filter((t) => article.tags.includes(t.id) && !t.trashed)
  }, [article?.tags, tags])

  const sources = useMemo(() => {
    if (!article) return []
    const items: { id: string; blockId: string; type: "note" | "image"; label: string; sub?: string }[] = []
    const seenNotes = new Set<string>()
    const seenAttachments = new Set<string>()

    for (const block of article.blocks ?? []) {
      if (block.type === "note-ref" && block.noteId && !seenNotes.has(block.noteId)) {
        seenNotes.add(block.noteId)
        const note = notes.find(n => n.id === block.noteId)
        items.push({
          id: block.noteId,
          blockId: block.id,
          type: "note",
          label: note?.title || "Untitled",
          sub: note?.status,
        })
      }
      if (block.type === "image" && block.attachmentId && !seenAttachments.has(block.attachmentId)) {
        seenAttachments.add(block.attachmentId)
        const att = attachments.find(a => a.id === block.attachmentId)
        items.push({
          id: block.attachmentId,
          blockId: block.id,
          type: "image",
          label: att?.name || block.caption || "Image",
          sub: att ? `${(att.size / 1024).toFixed(0)} KB` : undefined,
        })
      }
    }
    return items
  }, [article, notes, attachments])

  const stats = useMemo(() => {
    if (!article) return { blocks: 0, sections: 0, images: 0, noteRefs: 0, textBlocks: 0 }
    const blocks = article.blocks ?? []
    return {
      blocks: blocks.length,
      sections: blocks.filter((b) => b.type === "section").length,
      images: blocks.filter((b) => b.type === "image").length,
      noteRefs: blocks.filter((b) => b.type === "note-ref").length,
      textBlocks: blocks.filter((b) => b.type === "text").length,
    }
  }, [article])

  if (!article) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground px-4">
        <PhInfo size={24} weight="light" className="text-muted-foreground/70" />
        <p className="text-note text-center">Select a wiki article to see details</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Title & Type Badge */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-border">
        <span className="flex items-center gap-1 rounded-md bg-chart-1/10 px-2 py-0.5 text-2xs font-medium text-chart-1">
          <IconWiki size={14} />
          Wiki Article
        </span>
        {typeof article.layout === "string" && article.layout && article.layout !== "default" && (
          <span className="flex items-center gap-1 rounded-md bg-chart-2/10 px-2 py-0.5 text-2xs font-medium text-chart-2">
            <Layout size={14} weight="regular" />
            {article.layout.charAt(0).toUpperCase() + article.layout.slice(1)}
          </span>
        )}
        <button
          type="button"
          onClick={() => toggleWikiArticlePin(article.id)}
          className={`ml-auto flex items-center gap-1 rounded-md px-2 py-0.5 text-2xs font-medium transition-colors ${
            article.pinned
              ? "bg-accent/15 text-accent"
              : "text-muted-foreground hover:bg-hover-bg hover:text-foreground"
          }`}
          title={article.pinned ? "Unpin from Quicklinks" : "Pin to Quicklinks"}
        >
          <PushPin size={12} weight={article.pinned ? "fill" : "regular"} />
          {article.pinned ? "Pinned" : "Pin"}
        </button>
      </div>

      {/* Aliases */}
      {article.aliases.length > 0 && (
        <>
          <InspectorSection title="Aliases" icon={<PhInfo size={16} weight="regular" />}>
            <div className="flex flex-wrap gap-1.5">
              {article.aliases.map((alias, i) => (
                <span
                  key={i}
                  className="rounded-md bg-secondary/50 px-2 py-0.5 text-note text-foreground/80"
                >
                  {alias}
                </span>
              ))}
            </div>
          </InspectorSection>
          <div className="mx-4 border-b border-border" />
        </>
      )}

      {/* Categories */}
      {articleCategories.length > 0 && (
        <>
          <InspectorSection title="Categories" icon={<PhTag size={16} weight="regular" />}>
            <div className="flex flex-wrap gap-1.5">
              {articleCategories.map((cat) => (
                <span
                  key={cat.id}
                  className="rounded-full bg-accent/10 px-2.5 py-0.5 text-2xs font-medium text-accent"
                >
                  {cat.name}
                </span>
              ))}
            </div>
          </InspectorSection>
          <div className="mx-4 border-b border-border" />
        </>
      )}

      {/* Folders — PR (c) N:M chip strip
          Mirrors the note side panel. Always rendered (even empty) since
          folder management is the primary surface for the N:M model in
          the wiki context too. Click "+ Add" to open the multi-select
          picker; click chip X to remove from that folder. */}
      <InspectorSection title="Folders" icon={<FolderOpen size={16} weight="regular" />}>
        <div className="flex flex-wrap items-center gap-1.5">
          {articleFolders.map((f) => (
            <span
              key={f.id}
              className="flex items-center gap-1 rounded-md px-2 py-0.5 text-2xs font-medium"
              style={{
                backgroundColor: `${f.color}1a`,
                color: f.color,
              }}
              title={f.name}
            >
              <FolderOpen size={10} weight="regular" />
              <span className="truncate max-w-[120px]">{f.name}</span>
              <button
                type="button"
                onClick={() => removeWikiFromFolder(article.id, f.id)}
                className="rounded-sm p-0.5 transition-colors hover:bg-hover-bg/40"
                title={`Remove from ${f.name}`}
              >
                <PhX size={10} weight="bold" />
              </button>
            </span>
          ))}
          <Popover open={folderOpen} onOpenChange={setFolderOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1 rounded-md border border-dashed border-border px-2 py-0.5 text-2xs text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground">
                <PhPlus size={10} weight="regular" />
                {articleFolders.length === 0 ? "Add to folders" : "Add"}
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-56 p-1">
              <FolderPicker
                kind="wiki"
                currentFolderIds={article.folderIds}
                selectMode="multi"
                onApply={(ids) => {
                  setWikiFolders(article.id, ids)
                  setFolderOpen(false)
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </InspectorSection>
      <div className="mx-4 border-b border-border" />

      {/* Tags */}
      {articleTags.length > 0 && (
        <>
          <InspectorSection title="Tags" icon={<PhTag size={16} weight="regular" />}>
            <div className="flex flex-wrap gap-1.5">
              {articleTags.map((tag) => (
                <span
                  key={tag.id}
                  className="flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-medium"
                  style={{
                    backgroundColor: `${tag.color}18`,
                    color: tag.color,
                  }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </InspectorSection>
          <div className="mx-4 border-b border-border" />
        </>
      )}

      {/* Infobox 사이드바 섹션 제거됨 (2026-04-14 밤)
          - Default/Encyclopedia 둘 다 이제 본문에 inline WikiInfobox 렌더링됨
          - 사이드바 중복 표시 방지. Infobox 편집/색상 변경 = 본문 인포박스에서 */}

      {/* Sections (Outline) */}
      <InspectorSection title="Outline" icon={<TextAlignLeft size={16} weight="regular" />}>
        {stats.sections > 0 ? (
          <div className="space-y-1">
            {article.blocks
              .filter((b) => b.type === "section")
              .map((section) => (
                <div
                  key={section.id}
                  className="flex items-center gap-1.5 text-note text-muted-foreground transition-colors hover:text-foreground cursor-default"
                  style={{ paddingLeft: `${((section.level ?? 2) - 2) * 12}px` }}
                >
                  <span className="shrink-0 text-2xs font-mono font-semibold text-accent/80">
                    {"H" + (section.level ?? 2)}
                  </span>
                  <span className="truncate">{section.title ?? "Untitled section"}</span>
                </div>
              ))}
          </div>
        ) : (
          <span className="text-note text-muted-foreground">No sections</span>
        )}
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* Dates */}
      <InspectorSection title="Dates" icon={<CalendarBlank size={16} weight="regular" />}>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Created</span>
            <span className="text-note text-foreground">
              {format(new Date(article.createdAt), "MMM d, yyyy")}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Updated</span>
            <span className="text-note text-foreground">
              {formatDistanceToNow(new Date(article.updatedAt), { addSuffix: true })}
            </span>
          </div>
        </div>
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* Properties */}
      <InspectorSection title="Properties" icon={<FileText size={16} weight="regular" />}>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Blocks</span>
            <span className="text-note tabular-nums text-foreground">{stats.blocks}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Sections</span>
            <span className="text-note tabular-nums text-foreground">{stats.sections}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Text blocks</span>
            <span className="text-note tabular-nums text-foreground">{stats.textBlocks}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Note refs</span>
            <span className="text-note tabular-nums text-foreground">{stats.noteRefs}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Images</span>
            <span className="text-note tabular-nums text-foreground">{stats.images}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Layout</span>
            <span className="text-note text-foreground capitalize">
              {typeof article.layout === "string" ? article.layout : "default"}
            </span>
          </div>
        </div>
      </InspectorSection>

      {/* Sources */}
      {sources.length > 0 && (
        <>
          <div className="mx-4 border-b border-border" />
          <InspectorSection title="Sources" icon={<FileText size={16} weight="regular" />}>
            <div className="space-y-px">
              {sources.map((src, i) => (
                <button
                  key={`${src.type}-${src.id}`}
                  onClick={(e) => {
                    if (src.type === "note") {
                      if (e.ctrlKey || e.metaKey) {
                        usePlotStore.getState().openInSecondary(src.id)
                      } else {
                        setActiveRoute("/notes")
                        usePlotStore.getState().openNote(src.id)
                      }
                    } else {
                      document.getElementById(`wiki-block-${src.blockId}`)?.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      })
                    }
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors duration-100 hover:bg-hover-bg"
                >
                  <span className="shrink-0 text-2xs font-semibold text-accent tabular-nums w-4">
                    {i + 1}
                  </span>
                  {src.type === "note" && <FileText className="shrink-0 text-muted-foreground" size={12} weight="bold" />}
                  {src.type === "image" && <PhImage className="shrink-0 text-muted-foreground" size={12} weight="bold" />}
                  <span className="flex-1 min-w-0 truncate text-note text-foreground">
                    {src.label}
                  </span>
                  {src.sub && (
                    <span className="shrink-0 text-2xs text-muted-foreground/70">{src.sub}</span>
                  )}
                </button>
              ))}
            </div>
          </InspectorSection>
        </>
      )}

      {/* Actions */}
      <div className="px-4 py-3 border-t border-border">
        <button
          onClick={() => {
            if (confirm("Delete this wiki article?")) {
              usePlotStore.getState().deleteWikiArticle(article.id)
            }
          }}
          className="flex items-center gap-2 text-2xs text-red-400 hover:text-red-300 transition-colors"
        >
          <Trash size={14} weight="regular" />
          Delete article
        </button>
      </div>

    </div>
  )
}
