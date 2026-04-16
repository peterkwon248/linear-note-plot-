import type { WikiArticle } from "./types"

/**
 * A WikiArticle is a "stub" if the user hasn't modified it from the default template.
 * Default template = 3 section blocks + 1 empty text block = 4 blocks of "content".
 * Phase 2-2-C: infobox/toc blocks are meta — not counted toward "content" volume.
 * Stub if: content block count <= 4 AND all text blocks have empty content.
 */
const DEFAULT_BLOCK_COUNT = 4

export function isWikiStub(article: WikiArticle): boolean {
  // blocks=[] means not yet loaded from IDB — don't treat as stub
  if (article.blocks.length === 0) return false
  // Phase 2-2-C: meta blocks don't count toward content volume.
  const contentBlocks = article.blocks.filter((b) => b.type !== "infobox" && b.type !== "toc")
  if (contentBlocks.length > DEFAULT_BLOCK_COUNT) return false
  const textBlocks = contentBlocks.filter((b) => b.type === "text")
  if (textBlocks.length === 0) return true // no text blocks = only section headers = stub
  return textBlocks.every((b) => !b.content?.trim())
}
