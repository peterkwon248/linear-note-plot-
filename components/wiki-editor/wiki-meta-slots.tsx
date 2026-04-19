"use client"

/**
 * WikiMetaSlots — 재편-A (2026-04-19).
 *
 * TOC / Infobox 를 WikiArticle 의 article-level 메타 데이터로 환원한 뒤,
 * slots.position 에 따라 article 전체 레이아웃 안에서 위치를 결정한다.
 * 기존 `WikiInfoboxBlock` / `WikiTocBlock` 컴포넌트를 virtual block 으로
 * 감싸서 재활용 — 렌더 표현은 동일, 데이터 소스만 article 로 옮김.
 */

import { useMemo } from "react"
import type { WikiArticle, WikiBlock } from "@/lib/types"
import { usePlotStore } from "@/lib/store"
import { WikiInfoboxBlock } from "./wiki-infobox-block"
import { WikiTocBlock } from "./wiki-toc-block"

export interface WikiInfoboxSlotProps {
  article: WikiArticle
  editable?: boolean
}

/** Virtual block used to reuse WikiInfoboxBlock's presentation. Never persisted. */
function buildInfoboxVirtualBlock(article: WikiArticle): WikiBlock | null {
  const meta = article.infobox
  if (!meta) return null
  return {
    id: `__infobox__${article.id}`,
    type: "infobox",
    fields: meta.fields ?? [],
    headerColor: meta.headerColor ?? null,
    width: meta.width,
    density: meta.density,
    fontSize: meta.fontSize,
  }
}

export function WikiInfoboxSlot({ article, editable = false }: WikiInfoboxSlotProps) {
  const updateWikiArticle = usePlotStore((s) => s.updateWikiArticle)
  const virtualBlock = useMemo(() => buildInfoboxVirtualBlock(article), [article])

  if (!virtualBlock) {
    // 빈 상태 + editable 이면 placeholder 렌더 (사용자가 infobox 추가할 수 있게).
    // 최소 구현: editable 일 때 "Add infobox" 버튼만 노출.
    if (!editable) return null
    return (
      <div className="wiki-infobox-slot-empty">
        <button
          type="button"
          onClick={() => {
            updateWikiArticle(article.id, {
              infobox: { fields: [{ key: "Field", value: "" }], headerColor: null },
              slots: {
                ...(article.slots ?? {}),
                infobox: { position: article.slots?.infobox?.position ?? "right-float" },
              },
            })
          }}
          className="rounded-md border border-dashed border-border-subtle px-3 py-2 text-2xs text-muted-foreground/50 hover:text-muted-foreground hover:border-border transition-colors"
        >
          + Infobox
        </button>
      </div>
    )
  }

  const handleUpdate = (patch: Partial<Omit<WikiBlock, "id">>) => {
    const nextMeta = {
      fields: (patch.fields ?? article.infobox?.fields ?? []),
      headerColor: patch.headerColor ?? article.infobox?.headerColor ?? null,
      width: patch.width ?? article.infobox?.width,
      density: patch.density ?? article.infobox?.density,
      fontSize: patch.fontSize ?? article.infobox?.fontSize,
    }
    updateWikiArticle(article.id, { infobox: nextMeta })
  }

  const handleDelete = () => {
    updateWikiArticle(article.id, {
      infobox: undefined,
      slots: {
        ...(article.slots ?? {}),
        infobox: { position: "none" },
      },
    })
  }

  return (
    <WikiInfoboxBlock
      block={virtualBlock}
      articleId={article.id}
      editable={editable}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  )
}

export interface WikiTocSlotProps {
  article: WikiArticle
  editable?: boolean
}

function buildTocVirtualBlock(article: WikiArticle): WikiBlock {
  const tocSlot = article.slots?.toc
  return {
    id: `__toc__${article.id}`,
    type: "toc",
    tocCollapsed: tocSlot?.collapsed ?? false,
    hiddenLevels: tocSlot?.hiddenLevels,
    density: tocSlot?.density,
    fontSize: tocSlot?.fontSize,
  }
}

export function WikiTocSlot({ article, editable = false }: WikiTocSlotProps) {
  const updateWikiArticle = usePlotStore((s) => s.updateWikiArticle)
  const virtualBlock = useMemo(() => buildTocVirtualBlock(article), [article])

  const handleUpdate = (patch: Partial<Omit<WikiBlock, "id">>) => {
    const current = article.slots?.toc ?? { position: "top" as const }
    updateWikiArticle(article.id, {
      slots: {
        ...(article.slots ?? {}),
        toc: {
          ...current,
          collapsed: patch.tocCollapsed ?? current.collapsed,
          hiddenLevels: patch.hiddenLevels ?? current.hiddenLevels,
          density: patch.density ?? current.density,
          fontSize: patch.fontSize ?? current.fontSize,
        },
      },
    })
  }

  const handleDelete = () => {
    updateWikiArticle(article.id, {
      slots: {
        ...(article.slots ?? {}),
        toc: { position: "none" },
      },
    })
  }

  return (
    <WikiTocBlock
      block={virtualBlock}
      articleId={article.id}
      editable={editable}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  )
}
