import { describe, it, expect } from "vitest"
import { wikiArticleToBook, wikiBlockToBlock, bookBlockToWikiBlock } from "../adapter"
import type { WikiArticle, WikiBlock } from "../../types"

const mkWiki = (overrides: Partial<WikiArticle> = {}): WikiArticle =>
  ({
    id: "w1",
    title: "Sample",
    blocks: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  }) as WikiArticle

describe("wikiBlockToBlock", () => {
  it("maps section → heading with title as text", () => {
    const wb: WikiBlock = { id: "b1", type: "section", title: "History", level: 2 }
    const b = wikiBlockToBlock(wb, 0)
    expect(b.type).toBe("heading")
    expect(b.text).toBe("History")
    expect(b.col).toBe(1)
    expect(b.span).toBe(12)
    expect(b.row).toBe(1)
    expect(b.props?.level).toBe(2)
    expect(b.props?.originalType).toBe("section")
  })

  it("maps text → paragraph with content as text", () => {
    const wb: WikiBlock = { id: "b2", type: "text", content: "Hello world" }
    const b = wikiBlockToBlock(wb, 1)
    expect(b.type).toBe("paragraph")
    expect(b.text).toBe("Hello world")
    expect(b.row).toBe(2)
  })

  it("maps infobox preserving fields in props", () => {
    const fields = [{ key: "Type", value: "Technique" }]
    const wb: WikiBlock = { id: "b3", type: "infobox", fields, headerColor: "#f00" }
    const b = wikiBlockToBlock(wb, 0)
    expect(b.type).toBe("infobox")
    expect(b.props?.fields).toEqual(fields)
    expect(b.props?.headerColor).toBe("#f00")
  })

  it("maps toc preserving collapsed state", () => {
    const wb: WikiBlock = { id: "b4", type: "toc", tocCollapsed: true, hiddenLevels: [4, 5] }
    const b = wikiBlockToBlock(wb, 0)
    expect(b.type).toBe("toc")
    expect(b.props?.tocCollapsed).toBe(true)
    expect(b.props?.hiddenLevels).toEqual([4, 5])
  })

  it("maps pull-quote → pullquote with quoteText as text", () => {
    const wb: WikiBlock = {
      id: "b5",
      type: "pull-quote",
      quoteText: "To be or not to be",
      quoteAttribution: "Shakespeare",
    }
    const b = wikiBlockToBlock(wb, 0)
    expect(b.type).toBe("pullquote")
    expect(b.text).toBe("To be or not to be")
    expect(b.props?.quoteAttribution).toBe("Shakespeare")
  })

  it("maps unknown types (table, note-ref, url) to paragraph with originalType preserved", () => {
    const wb: WikiBlock = { id: "b6", type: "table", tableHeaders: ["A"], tableRows: [["1"]] }
    const b = wikiBlockToBlock(wb, 0)
    expect(b.type).toBe("paragraph")
    expect(b.props?.originalType).toBe("table")
    expect(b.props?.tableHeaders).toEqual(["A"])
  })
})

describe("wikiArticleToBook", () => {
  it("wraps WikiArticle as Book with shell=wiki, renderMode=scroll", () => {
    const article = mkWiki({
      blocks: [
        { id: "b1", type: "section", title: "Intro", level: 2 },
        { id: "b2", type: "text", content: "Body text" },
      ],
    })
    const book = wikiArticleToBook(article)
    expect(book.id).toBe("w1")
    expect(book.title).toBe("Sample")
    expect(book.shell).toBe("wiki")
    expect(book.renderMode).toBe("scroll")
    expect(book.blocks).toHaveLength(2)
    expect(book.blocks[0].type).toBe("heading")
    expect(book.blocks[1].type).toBe("paragraph")
  })

  it("preserves createdAt/updatedAt as strings (matches WikiArticle shape)", () => {
    const article = mkWiki({ createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-02-01T00:00:00Z" })
    const book = wikiArticleToBook(article)
    expect(book.createdAt).toBe("2026-01-01T00:00:00Z")
    expect(book.updatedAt).toBe("2026-02-01T00:00:00Z")
  })

  it("derives theme.accentColor from themeColor.light if present", () => {
    const article = mkWiki({
      themeColor: { light: "#3366cc", dark: "#6688ee" },
    } as Partial<WikiArticle>)
    const book = wikiArticleToBook(article)
    expect(book.theme.accentColor).toBe("#3366cc")
  })

  it("defaults to empty theme/decoration/pages for articles with no Book-specific fields", () => {
    const article = mkWiki()
    const book = wikiArticleToBook(article)
    expect(book.theme.bgColor).toBe("")
    expect(book.theme.fontPair).toBe("default")
    expect(book.theme.margins).toBe("standard")
    expect(book.decoration.ribbon).toBe(false)
    expect(book.pages).toEqual([])
  })

  it("collapses all blocks to full-width sequential rows (Phase 1A-2 simple mapping)", () => {
    const article = mkWiki({
      blocks: [
        { id: "a", type: "text", content: "First" },
        { id: "b", type: "text", content: "Second" },
        { id: "c", type: "text", content: "Third" },
      ],
    })
    const book = wikiArticleToBook(article)
    expect(book.blocks.map((b) => b.row)).toEqual([1, 2, 3])
    expect(book.blocks.every((b) => b.col === 1 && b.span === 12)).toBe(true)
  })
})

describe("bookBlockToWikiBlock (reverse)", () => {
  it("roundtrips text block (text → paragraph → text)", () => {
    const wb: WikiBlock = { id: "b1", type: "text", content: "Hello" }
    const b = wikiBlockToBlock(wb, 0)
    const wb2 = bookBlockToWikiBlock(b)
    expect(wb2.type).toBe("text")
    expect(wb2.content).toBe("Hello")
    expect(wb2.id).toBe("b1")
  })

  it("roundtrips section block preserving level", () => {
    const wb: WikiBlock = { id: "b2", type: "section", title: "Intro", level: 3 }
    const b = wikiBlockToBlock(wb, 0)
    const wb2 = bookBlockToWikiBlock(b)
    expect(wb2.type).toBe("section")
    expect(wb2.title).toBe("Intro")
    expect(wb2.level).toBe(3)
  })

  it("roundtrips infobox preserving fields and headerColor", () => {
    const fields = [
      { key: "Born", value: "1885" },
      { key: "Type", value: "Technique" },
    ]
    const wb: WikiBlock = { id: "b3", type: "infobox", fields, headerColor: "#333" }
    const b = wikiBlockToBlock(wb, 0)
    const wb2 = bookBlockToWikiBlock(b)
    expect(wb2.type).toBe("infobox")
    expect(wb2.fields).toEqual(fields)
    expect(wb2.headerColor).toBe("#333")
  })
})
