import type { WikiBlock, WikiSectionIndex } from "./types"

/** Build a lightweight section index from a blocks array */
export function buildSectionIndex(blocks: WikiBlock[]): WikiSectionIndex[] {
  const index: WikiSectionIndex[] = []
  let currentSection: WikiSectionIndex | null = null
  let count = 0

  for (const block of blocks) {
    if (block.type === "section") {
      if (currentSection) {
        currentSection.blockCount = count
        index.push(currentSection)
      }
      currentSection = {
        id: block.id,
        title: block.title ?? "",
        level: block.level ?? 2,
        blockCount: 0,
        collapsed: block.collapsed,
      }
      count = 1 // count the section block itself
    } else {
      count++
    }
  }
  if (currentSection) {
    currentSection.blockCount = count
    index.push(currentSection)
  }
  return index
}
