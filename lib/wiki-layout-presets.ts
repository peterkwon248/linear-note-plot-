/**
 * Wiki layout presets — 재편-C (2026-04-19).
 *
 * "모드 = 메타 슬롯 배치의 결과적 이름".
 * preset 을 선택하면 WikiArticle.slots 가 해당 조합으로 덮어 씌워진다.
 * `custom` 은 사용자가 직접 지정한 slots 조합 — preset 과 동일하지 않음.
 */

import type { WikiArticle } from "./types"

export type WikiLayoutPresetId = "default" | "namu" | "custom"

export interface WikiLayoutPreset {
  id: Exclude<WikiLayoutPresetId, "custom">
  label: string
  description: string
  slots: NonNullable<WikiArticle["slots"]>
}

export const WIKI_LAYOUT_PRESETS: WikiLayoutPreset[] = [
  {
    id: "default",
    label: "Default",
    description: "위키피디아 스타일 — 본문 상단 TOC + 우측 float Infobox",
    slots: {
      toc: { position: "top" },
      infobox: { position: "right-float" },
      references: { position: "bottom" },
    },
  },
  {
    id: "namu",
    label: "Namu",
    description: "나무위키 스타일 — 상단 full-width Infobox + 우측 sticky TOC",
    slots: {
      toc: { position: "right-sticky" },
      infobox: { position: "top-full" },
      references: { position: "bottom" },
    },
  },
]

/** Return the preset that *exactly* matches the given slots, or null. */
export function matchPreset(
  slots: WikiArticle["slots"] | undefined,
): Exclude<WikiLayoutPresetId, "custom"> | null {
  if (!slots) return null
  for (const preset of WIKI_LAYOUT_PRESETS) {
    const p = preset.slots
    const tocMatch = (slots.toc?.position ?? undefined) === (p.toc?.position ?? undefined)
    const infoboxMatch = (slots.infobox?.position ?? undefined) === (p.infobox?.position ?? undefined)
    const refMatch = (slots.references?.position ?? undefined) === (p.references?.position ?? undefined)
    if (tocMatch && infoboxMatch && refMatch) return preset.id
  }
  return null
}

/** Merge preset slot positions into article, preserving non-preset fields (collapsed, hiddenLevels 등). */
export function applyPresetSlots(
  existing: WikiArticle["slots"] | undefined,
  presetId: Exclude<WikiLayoutPresetId, "custom">,
): NonNullable<WikiArticle["slots"]> {
  const preset = WIKI_LAYOUT_PRESETS.find((p) => p.id === presetId)
  if (!preset) return existing ?? {}
  return {
    toc: { ...(existing?.toc ?? {}), position: preset.slots.toc?.position },
    infobox: { ...(existing?.infobox ?? {}), position: preset.slots.infobox?.position },
    references: { ...(existing?.references ?? {}), position: preset.slots.references?.position },
  }
}
