import type { WikiArticle } from "./types"

/**
 * A WikiArticle is a "stub" if the user hasn't modified it from the default template.
 * Default template = 3 section blocks + 1 empty text block = 4 blocks total.
 * Stub if: block count <= 4 AND all text blocks have empty content.
 */
const DEFAULT_BLOCK_COUNT = 4

export function isWikiStub(article: WikiArticle): boolean {
  // blocks=[] means not yet loaded from IDB — don't treat as stub
  if (article.blocks.length === 0) return false
  if (article.blocks.length > DEFAULT_BLOCK_COUNT) return false
  const textBlocks = article.blocks.filter((b) => b.type === "text")
  if (textBlocks.length === 0) return true // no text blocks = only section headers = stub
  return textBlocks.every((b) => !b.content?.trim())
}
