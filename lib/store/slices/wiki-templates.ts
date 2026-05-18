import type { WikiArticle, WikiBlock, WikiInfoboxEntry, WikiTemplate } from "../../types"
import { genId, now, persistBlockBody, persistArticleBlocks, type AppendEventFn } from "../helpers"
import { buildSectionIndex } from "../../wiki-section-index"
import { extractLinksFromWikiBlocks } from "../../body-helpers"
import { expandPlaceholders, expandPlaceholdersInJson } from "./templates"

type Set = (fn: ((state: any) => any) | any) => void
type Get = () => any

/**
 * Clone a WikiBlock array with fresh ids + placeholder-expanded text content.
 * - block.id → genId() (unique within new article / insertion location)
 * - text block content / contentJson → placeholder expand
 * - section title, captions, URL titles, navbox/banner labels도 expand
 *
 * Image attachmentId는 보존 (IDB blob 공유, template은 보통 image 안 가짐).
 */
function cloneAndExpandBlocks(blocks: WikiBlock[]): WikiBlock[] {
  return blocks.map((b) => {
    const next: WikiBlock = { ...b, id: genId() }
    if (b.title) next.title = expandPlaceholders(b.title)
    if (b.content) next.content = expandPlaceholders(b.content)
    if (b.contentJson) next.contentJson = expandPlaceholdersInJson(b.contentJson)
    if (b.caption) next.caption = expandPlaceholders(b.caption)
    if (b.urlTitle) next.urlTitle = expandPlaceholders(b.urlTitle)
    if (b.tableCaption) next.tableCaption = expandPlaceholders(b.tableCaption)
    if (b.navTitle) next.navTitle = expandPlaceholders(b.navTitle)
    if (b.navboxTitle) next.navboxTitle = expandPlaceholders(b.navboxTitle)
    if (b.navboxFooterText) next.navboxFooterText = expandPlaceholders(b.navboxFooterText)
    if (b.bannerSubtitle) next.bannerSubtitle = expandPlaceholders(b.bannerSubtitle)
    return next
  })
}

function cloneAndExpandInfobox(infobox: WikiInfoboxEntry[]): WikiInfoboxEntry[] {
  return infobox.map((e) => ({
    ...e,
    key: expandPlaceholders(e.key),
    value: expandPlaceholders(e.value),
  }))
}

/**
 * Wiki Templates slice — NoteTemplate (slices/templates.ts) 1:1 패턴 정합.
 * 추가 핵심: blocks + infobox + infoboxPreset + Wiki display defaults.
 *
 * Apply paths:
 *   - `createWikiArticleFromTemplate`: 새 Wiki article + template 전체
 *   - `getWikiTemplateBlocksExpanded`: slash insert용, blocks만 expanded 반환
 */
export function createWikiTemplatesSlice(set: Set, get: Get, appendEvent: AppendEventFn) {
  return {
    createWikiTemplate: (template: Omit<WikiTemplate, "id" | "createdAt" | "updatedAt">) => {
      const id = `wtmpl-${genId()}`
      const newTemplate: WikiTemplate = {
        ...template,
        id,
        createdAt: now(),
        updatedAt: now(),
      }
      set((state: any) => ({
        wikiTemplates: [...(state.wikiTemplates ?? []), newTemplate],
      }))
      // appendEvent kind "wikiTemplate" 확장은 별도 PR (Activity unification 시점).
      // 현재 entityEvents kind union은 "note" | "wiki" | "template" | "book" 등 한정.
      return id
    },

    updateWikiTemplate: (id: string, updates: Partial<WikiTemplate>) => {
      set((state: any) => ({
        wikiTemplates: (state.wikiTemplates ?? []).map((t: WikiTemplate) =>
          t.id === id ? { ...t, ...updates, updatedAt: now() } : t
        ),
      }))
    },

    deleteWikiTemplate: (id: string) => {
      set((state: any) => ({
        wikiTemplates: (state.wikiTemplates ?? []).map((t: WikiTemplate) =>
          t.id === id ? { ...t, trashed: true, trashedAt: new Date().toISOString() } : t
        ),
      }))
    },

    restoreWikiTemplate: (id: string) => {
      set((state: any) => ({
        wikiTemplates: (state.wikiTemplates ?? []).map((t: WikiTemplate) =>
          t.id === id ? { ...t, trashed: false, trashedAt: null } : t
        ),
      }))
    },

    permanentlyDeleteWikiTemplate: (id: string) => {
      set((state: any) => ({
        wikiTemplates: (state.wikiTemplates ?? []).filter((t: WikiTemplate) => t.id !== id),
      }))
    },

    toggleWikiTemplatePin: (id: string) => {
      set((state: any) => ({
        wikiTemplates: (state.wikiTemplates ?? []).map((t: WikiTemplate) =>
          t.id === id ? { ...t, pinned: !t.pinned, updatedAt: now() } : t
        ),
      }))
    },

    /**
     * 생성 picker apply — 빈 Wiki article 신규 생성 + WikiTemplate 전체 적용.
     * blocks (new ids + expanded) + infobox + 분류 메타 + display 메타.
     * WikiArticle.templateId = origin (reverse-lookup용).
     */
    createWikiArticleFromTemplate: (templateId: string): string => {
      const state = get()
      const template = ((state.wikiTemplates ?? []) as WikiTemplate[]).find((t) => t.id === templateId)
      if (!template) return ""

      const articleId = genId()
      const blocks = cloneAndExpandBlocks(template.blocks)
      const article: WikiArticle = {
        id: articleId,
        title: expandPlaceholders(template.title),
        aliases: (template.aliases ?? []).map(expandPlaceholders),
        infobox: cloneAndExpandInfobox(template.infobox),
        infoboxPreset: template.infoboxPreset,
        infoboxHeaderColor: template.infoboxHeaderColor,
        infoboxHero: template.infoboxHero ? { ...template.infoboxHero } : undefined,
        blocks,
        sectionIndex: buildSectionIndex(blocks),
        tags: [...(template.defaultTags ?? [])],
        categoryIds: [...(template.defaultCategoryIds ?? [])],
        labelId: template.defaultLabelId ?? null,
        folderIds: [...(template.defaultFolderIds ?? [])],
        layout: template.defaultLayout,
        fontSize: template.defaultFontSize,
        linksOut: extractLinksFromWikiBlocks(blocks),
        reads: 0,
        templateId,
        createdAt: now(),
        updatedAt: now(),
      }

      set((s: any) => ({
        wikiArticles: [...s.wikiArticles, article],
      }))
      // Persist text block bodies to IDB
      for (const b of article.blocks) {
        if (b.type === "text" && b.content) {
          persistBlockBody({ id: b.id, content: b.content })
        }
      }
      persistArticleBlocks(articleId, article.blocks)
      appendEvent({ kind: "wiki", id: articleId }, "created", {
        title: article.title,
        templateId,
        templateName: template.name,
      })
      return articleId
    },

    /**
     * slash insert apply — template의 blocks만 placeholder expand + new
     * ids로 반환. caller (UI)가 article에 splice. article level 메타
     * (categoryIds / labelId / layout)는 건드리지 않음.
     */
    getWikiTemplateBlocksExpanded: (templateId: string): WikiBlock[] | null => {
      const state = get()
      const template = ((state.wikiTemplates ?? []) as WikiTemplate[]).find((t) => t.id === templateId)
      if (!template) return null
      return cloneAndExpandBlocks(template.blocks)
    },
  }
}
