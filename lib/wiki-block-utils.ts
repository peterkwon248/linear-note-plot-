import type { WikiBlock } from "@/lib/types"

/** Compute section numbers (1., 2., 2.1., etc.) for section blocks */
export function computeSectionNumbers(blocks: WikiBlock[]): Map<string, string> {
  const result = new Map<string, string>()
  const sectionBlocks = blocks.filter((b) => b.type === "section")
  if (sectionBlocks.length === 0) return result

  const minLevel = Math.min(...sectionBlocks.map((b) => b.level ?? 2))
  const counters: number[] = []

  for (const block of blocks) {
    if (block.type !== "section") continue
    const depth = (block.level ?? 2) - minLevel
    while (counters.length <= depth) counters.push(0)
    counters[depth]++
    for (let i = depth + 1; i < counters.length; i++) counters[i] = 0
    result.set(block.id, counters.slice(0, depth + 1).join("."))
  }
  return result
}

/** Initial content JSON for compound block types */
export function getInitialContentJson(subtype: string): Record<string, unknown> {
  switch (subtype) {
    case "infobox":
      return {
        type: "doc",
        content: [{ type: "infoboxBlock", attrs: { entries: [{ key: "Key", value: "Value" }] } }]
      }
    case "callout":
      return {
        type: "doc",
        content: [{ type: "calloutBlock", content: [{ type: "paragraph", content: [{ type: "text", text: "Callout text here" }] }] }]
      }
    case "blockquote":
      return {
        type: "doc",
        content: [{ type: "blockquote", content: [{ type: "paragraph", content: [{ type: "text", text: "Quote text here" }] }] }]
      }
    case "toggle":
      return {
        type: "doc",
        content: [{ type: "details", content: [
          { type: "detailsSummary", content: [{ type: "paragraph", content: [{ type: "text", text: "Toggle title" }] }] },
          { type: "detailsContent", content: [{ type: "paragraph", content: [{ type: "text", text: "Toggle content" }] }] },
        ]}]
      }
    case "divider":
      return {
        type: "doc",
        content: [{ type: "horizontalRule" }, { type: "paragraph" }]
      }
    case "spacer":
      // 1 empty paragraph ≈ 24px gap. 더 필요하면 엔터로 늘릴 수 있음.
      return {
        type: "doc",
        content: [{ type: "paragraph" }]
      }
    default:
      return { type: "doc", content: [{ type: "paragraph" }] }
  }
}

/** Build visible blocks by hiding children of collapsed sections */
export function buildVisibleBlocks(
  blocks: WikiBlock[],
  isCollapsed: (blockId: string) => boolean
): WikiBlock[] {
  const result: WikiBlock[] = []
  let collapsingLevel: number | null = null

  for (const block of blocks) {
    if (block.type === "section") {
      const level = block.level ?? 2
      if (collapsingLevel !== null && level <= collapsingLevel) {
        collapsingLevel = null
      }
      result.push(block)
      if (isCollapsed(block.id)) {
        collapsingLevel = level
      }
    } else if (collapsingLevel === null) {
      result.push(block)
    }
  }
  return result
}
