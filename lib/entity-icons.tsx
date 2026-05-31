/**
 * ENTITY_ICONS — single source of truth for entity icons (2026-05-31, IA 헌법 §13).
 *
 * 색이 `KNOWLEDGE_INDEX_COLORS`(lib/colors.ts)에서 단일 정의되듯, 아이콘은 여기서
 * 단일 정의된다. 같은 엔티티는 어느 표면(Home stats / 자료실 overview / detail
 * panel / 사이드바 / 그래프)에서도 같은 아이콘을 받는다.
 *
 * ⚠️ 표면별 하드코딩 금지 — 특히 Label/Categories/Tags가 detail panel에서 전부
 * `PhTag`로 같았던 문제(2026-05-31 사용자 적발)의 재발 방지. 반드시 여기서 import.
 *
 * 충돌 회피:
 *  - 태그 = Tag / 카테고리 = Layers / 라벨 = Ribbon → 셋 다 다른 글리프
 *  - 라벨 = Ribbon (리본형. 활동 그룹의 Bookmark와도 안 겹침)
 *  - 책 = BookMarked (위키 BookOpen, space 자료실 Library와 구분)
 */
import {
  createLucideIcon,
  FileText,
  BookOpen,
  BookMarked,
  Tag,
  Layers,
  Ribbon,
  Quote,
  Paperclip,
  House,
  Inbox,
  CalendarDays,
  Waypoints,
  Library,
} from "lucide-react"

/**
 * StickerPlain — 둥근 사각 + 우상단 접힌 모서리(dog-ear), 표정 없는 커스텀 글리프.
 * 사용자 결정(2026-05-31): lucide `Sticker`는 (1)웃는 표정(눈2+미소)이 잡다하고
 * (2)접힌 모서리가 너무 작다 → 표정 제거 + dog-ear를 8u(뷰박스 24의 1/3)로 확대.
 *
 * body = 우상단만 대각선으로 잘린 둥근사각 외곽(`z`가 (13,3)→(21,11) 대각선 컷).
 * fold = 잘린 삼각형의 세로·가로 두 변으로 접힌 면 표현(꼭짓점 (13,3)/(13,11)/(21,11)).
 * `createLucideIcon`으로 빌드 → 다른 ENTITY_ICONS(lucide)와 stroke 규약·props 동일.
 */
const StickerPlain = createLucideIcon("sticker-plain", [
  [
    "path",
    {
      d: "M21 11V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8z",
      key: "plot-sticker-body",
    },
  ],
  ["path", { d: "M13 3v7a1 1 0 0 0 1 1h7", key: "plot-sticker-fold" }],
])

export const ENTITY_ICONS = {
  notes:      FileText,
  wiki:       BookOpen,
  books:      BookMarked,
  tags:       Tag,
  categories: Layers,
  labels:     Ribbon,  // 리본형 라벨 (사용자 최종 선택 2026-05-31, Milestone 깃발 기각)
  references: Quote,
  files:      Paperclip,
  stickers:   StickerPlain,
} as const

export type EntityIconKey = keyof typeof ENTITY_ICONS

/**
 * SPACE_ICONS — 7개 공간(destination) 아이콘의 단일 정의. ENTITY_ICONS의 공간판.
 * 활동바·사이드바·뷰헤더가 같은 공간엔 같은 글리프를 받도록 SOT로 강제.
 *
 * ⚠️ 표면별 하드코딩 금지 — 특히 `Archive`를 books/library/references에 섞어
 * 쓰며 표면마다 Books↔자료실 아이콘이 뒤바뀌던 drift(2026-05-31 사용자 적발)의
 * 재발 방지. 공간 아이콘이 필요한 모든 곳은 여기서 import.
 *
 * notes/wiki/books 공간 = 해당 엔티티 아이콘과 동일(ENTITY_ICONS 재사용 →
 * 이중 정의로 인한 drift 차단). 나머지(home/inbox/calendar/ontology/library)는
 * 공간 전용 글리프.
 */
export const SPACE_ICONS = {
  home:     House,
  inbox:    Inbox,
  notes:    ENTITY_ICONS.notes, // FileText
  wiki:     ENTITY_ICONS.wiki,  // BookOpen
  books:    ENTITY_ICONS.books, // BookMarked
  calendar: CalendarDays,
  ontology: Waypoints,
  library:  Library,
} as const

export type SpaceIconKey = keyof typeof SPACE_ICONS
