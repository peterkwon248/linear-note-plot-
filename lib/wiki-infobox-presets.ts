/**
 * Wiki Infobox Preset Registry — PR1 of "나무위키 리서치 기능 도입"
 *
 * Each preset bundles:
 *   - a Korean human label (드롭다운에서 노출)
 *   - a default header color (적용 시 자동 색상 — 나무위키 색상 테마 모방)
 *   - a curated set of seed entries (field rows + group-header dividers)
 *
 * "custom" 은 빈 인포박스 (사용자 자유 편집).
 *
 * 색상은 rgba alpha=0.65 — 헤더에서 글자가 흰 톤으로 읽히는 깊은 톤.
 * (나무위키 인물/장소/작품 인포박스의 진한 색 헤더 미관 모방.)
 */

import type { WikiInfoboxEntry, WikiInfoboxPreset } from "./types"

export interface PresetDefinition {
  preset: WikiInfoboxPreset
  /** Korean label shown in the preset dropdown. */
  label: string
  /** Optional sub-label for additional context (used in some UIs). */
  hint?: string
  /** Default header background color applied when this preset is selected. null = leave existing. */
  defaultHeaderColor: string | null
  /** Seed entries inserted when switching to this preset (replaces current entries). */
  defaultEntries: WikiInfoboxEntry[]
}

/* ── Color tokens — deep, alpha 0.65 for header presence ───────────────────── */
const C = {
  slate:    "rgba(30,41,59,0.65)",
  blue:     "rgba(37,99,235,0.65)",
  teal:     "rgba(13,148,136,0.65)",
  emerald:  "rgba(5,150,105,0.65)",
  amber:    "rgba(217,119,6,0.65)",
  red:      "rgba(220,38,38,0.65)",
  rose:     "rgba(225,29,72,0.65)",
  violet:   "rgba(124,58,237,0.65)",
  indigo:   "rgba(79,70,229,0.65)",
  sky:      "rgba(2,132,199,0.65)",
  stone:    "rgba(68,64,60,0.65)",
} as const

/* ── Helpers ──────────────────────────────────────────────────────────────── */
function field(key: string): WikiInfoboxEntry {
  return { type: "field", key, value: "" }
}
function groupHeader(key: string, opts?: { defaultCollapsed?: boolean }): WikiInfoboxEntry {
  return {
    type: "group-header",
    key,
    value: "",
    color: null,
    defaultCollapsed: opts?.defaultCollapsed ?? false,
  }
}

/* ── Registry ─────────────────────────────────────────────────────────────── */
export const INFOBOX_PRESETS: PresetDefinition[] = [
  {
    preset: "custom",
    label: "기본 (빈 인포박스)",
    hint: "사용자가 자유롭게 필드를 추가",
    defaultHeaderColor: null,
    defaultEntries: [],
  },
  {
    preset: "person",
    label: "인물",
    defaultHeaderColor: C.slate,
    defaultEntries: [
      field("본명"),
      field("출생"),
      field("국적"),
      field("직업"),
      field("주요 업적"),
      groupHeader("추가 정보", { defaultCollapsed: true }),
      field("학력"),
      field("활동 기간"),
      field("웹사이트"),
    ],
  },
  {
    preset: "character",
    label: "캐릭터",
    defaultHeaderColor: C.violet,
    defaultEntries: [
      field("이름"),
      field("종/분류"),
      field("소속"),
      field("성별"),
      field("첫 등장"),
      field("성우"),
      field("능력/특기"),
    ],
  },
  {
    preset: "place",
    label: "장소",
    defaultHeaderColor: C.emerald,
    defaultEntries: [
      field("공식 명칭"),
      field("국가"),
      field("행정구역"),
      field("면적"),
      field("인구"),
      field("설립/건설"),
      field("수장"),
      field("좌표"),
    ],
  },
  {
    preset: "organization",
    label: "조직/단체",
    defaultHeaderColor: C.indigo,
    defaultEntries: [
      field("설립일"),
      field("설립자"),
      field("본사"),
      field("대표"),
      field("업종"),
      groupHeader("추가 정보", { defaultCollapsed: true }),
      field("임직원 수"),
      field("웹사이트"),
      field("법적 형태"),
    ],
  },
  {
    preset: "work-film",
    label: "작품 — 영화",
    defaultHeaderColor: C.red,
    defaultEntries: [
      field("감독"),
      field("출연진"),
      field("장르"),
      field("개봉일"),
      field("상영시간"),
      groupHeader("제작 정보", { defaultCollapsed: true }),
      field("제작사"),
      field("배급사"),
      field("제작 국가"),
    ],
  },
  {
    preset: "work-book",
    label: "작품 — 책",
    defaultHeaderColor: C.amber,
    defaultEntries: [
      field("저자"),
      field("출판사"),
      field("출판일"),
      field("장르"),
      field("페이지 수"),
      groupHeader("추가 정보", { defaultCollapsed: true }),
      field("ISBN"),
      field("언어"),
      field("시리즈"),
    ],
  },
  {
    preset: "work-music",
    label: "작품 — 음악",
    defaultHeaderColor: C.rose,
    defaultEntries: [
      field("아티스트"),
      field("레이블"),
      field("발매일"),
      field("장르"),
      groupHeader("추가 정보", { defaultCollapsed: true }),
      field("트랙 수"),
      field("러닝타임"),
      field("프로듀서"),
    ],
  },
  {
    preset: "work-game",
    label: "작품 — 게임",
    defaultHeaderColor: C.sky,
    defaultEntries: [
      field("개발사"),
      field("퍼블리셔"),
      field("장르"),
      field("플랫폼"),
      field("출시일"),
      groupHeader("추가 정보", { defaultCollapsed: true }),
      field("등급"),
      field("게임 엔진"),
      field("플레이 모드"),
    ],
  },
  {
    preset: "event",
    label: "사건/사고",
    defaultHeaderColor: C.stone,
    defaultEntries: [
      field("발생일"),
      field("발생지"),
      field("원인"),
      field("결과"),
      groupHeader("추가 정보", { defaultCollapsed: true }),
      field("참여자"),
      field("피해 규모"),
      field("기간"),
    ],
  },
  {
    preset: "concept",
    label: "개념/이론",
    defaultHeaderColor: C.teal,
    defaultEntries: [
      field("분야"),
      field("기원/등장 시기"),
      field("제안자"),
      groupHeader("추가 정보", { defaultCollapsed: true }),
      field("관련 개념"),
      field("적용 사례"),
      field("참고 문헌"),
    ],
  },
]

/* ── Lookups ──────────────────────────────────────────────────────────────── */
const BY_KEY = new Map<WikiInfoboxPreset, PresetDefinition>(
  INFOBOX_PRESETS.map((p) => [p.preset, p]),
)

export function getPresetDefinition(preset: WikiInfoboxPreset | undefined | null): PresetDefinition {
  return BY_KEY.get((preset ?? "custom") as WikiInfoboxPreset) ?? BY_KEY.get("custom")!
}

/**
 * Returns a fresh deep-clone of a preset's seed entries.
 * Always returns a new array so callers can safely mutate.
 */
export function clonePresetEntries(preset: WikiInfoboxPreset): WikiInfoboxEntry[] {
  const def = getPresetDefinition(preset)
  return def.defaultEntries.map((e) => ({ ...e }))
}
