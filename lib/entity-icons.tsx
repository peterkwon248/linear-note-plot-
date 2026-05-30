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
 *  - 태그 = Tag / 카테고리 = Layers / 라벨 = Badge → 셋 다 다른 글리프
 *  - 라벨 = Badge (활동 그룹의 북마크 Bookmark와도 안 겹침)
 *  - 책 = BookMarked (위키 BookOpen, space 자료실 Archive와 구분)
 */
import {
  FileText,
  BookOpen,
  BookMarked,
  Tag,
  Layers,
  Badge,
  Quote,
  Paperclip,
  StickyNote,
} from "lucide-react"

export const ENTITY_ICONS = {
  notes:      FileText,
  wiki:       BookOpen,
  books:      BookMarked,
  tags:       Tag,
  categories: Layers,
  labels:     Badge,
  references: Quote,
  files:      Paperclip,
  stickers:   StickyNote,
} as const

export type EntityIconKey = keyof typeof ENTITY_ICONS
