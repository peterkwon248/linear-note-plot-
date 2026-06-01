/**
 * Realistic sample data for the Home preview. Mirrors the live icon + color
 * vocabulary exactly (stats-row.tsx / mixed-quicklinks.tsx) so the preview
 * reads like the real app with a populated knowledge base.
 */
import { IconNotes } from "@/components/plot-icons"
import { ENTITY_ICONS, SPACE_ICONS } from "@/lib/entity-icons"
import { KNOWLEDGE_INDEX_COLORS } from "@/lib/colors"
import {
  FileText,
  BookOpen,
  Folder as PhFolder,
  Filter as Funnel,
  Bookmark as BookmarkSimple,
} from "lucide-react"
import type { HomeViewModel } from "./home.types"

const C = KNOWLEDGE_INDEX_COLORS

export const homeMock: HomeViewModel = {
  capturePlaceholder: "생각을 빠르게 기록…",
  knowledgeBaseLabel: "지식 베이스",
  statGroups: [
    {
      key: "bodies",
      label: "본체",
      items: [
        { id: "/notes", label: "노트", value: 142, sub: "72% 연결됨", colorClass: C.notes.text, bgClass: C.notes.bg, icon: <IconNotes size={12} /> },
        { id: "/wiki", label: "위키", value: 38, sub: "5개 미완성", colorClass: C.wiki.text, bgClass: C.wiki.bg, icon: <ENTITY_ICONS.wiki size={12} strokeWidth={2} /> },
        { id: "/books", label: "책", value: 7, sub: "", colorClass: C.books.text, bgClass: C.books.bg, icon: <ENTITY_ICONS.books size={12} strokeWidth={2} /> },
      ],
    },
    {
      key: "classify",
      label: "분류",
      items: [
        { id: "/library/tags", label: "태그", value: 24, sub: "12개 사용 중", colorClass: C.tags.text, bgClass: C.tags.bg, icon: <ENTITY_ICONS.tags size={12} strokeWidth={2} /> },
        { id: "/library/categories", label: "카테고리", value: 8, sub: "", colorClass: C.categories.text, bgClass: C.categories.bg, icon: <ENTITY_ICONS.categories size={12} strokeWidth={2} /> },
        { id: "/library/labels", label: "라벨", value: 11, sub: "", colorClass: C.labels.text, bgClass: C.labels.bg, icon: <ENTITY_ICONS.labels size={12} strokeWidth={2} /> },
        { id: "/stickers", label: "스티커", value: 5, sub: "2 in use", colorClass: C.stickers.text, bgClass: C.stickers.bg, icon: <ENTITY_ICONS.stickers size={12} strokeWidth={2} /> },
      ],
    },
    {
      key: "source",
      label: "출처",
      items: [
        { id: "/library/references", label: "레퍼런스", value: 16, sub: "3 unused", colorClass: C.references.text, bgClass: C.references.bg, icon: <ENTITY_ICONS.references size={12} strokeWidth={2} /> },
        { id: "/library/files", label: "파일", value: 9, sub: "4.2 MB", colorClass: C.files.text, bgClass: C.files.bg, icon: <ENTITY_ICONS.files size={12} strokeWidth={2} /> },
      ],
    },
  ],
  mostConnected: {
    label: "가장 많이 연결됨",
    items: [
      { id: "n1", title: "제텔카스텐 방법론 정리", meta: "18 links" },
      { id: "n2", title: "팔란티어 온톨로지 모델", meta: "14 links" },
      { id: "n3", title: "지식 그래프 설계 노트", meta: "11 links" },
      { id: "n4", title: "Linear 디자인 원칙", meta: "9 links" },
    ],
  },
  mostVisited: {
    label: "많이 본 항목",
    items: [
      { id: "v1", rank: 1, icon: <ENTITY_ICONS.notes className="shrink-0 text-muted-foreground" size={14} strokeWidth={2.5} />, title: "이번 분기 목표", count: 47 },
      { id: "v2", rank: 2, icon: <ENTITY_ICONS.books className="shrink-0 text-muted-foreground" size={14} strokeWidth={2.5} />, title: "독서 노트 모음", count: 33 },
      { id: "v3", rank: 3, icon: <ENTITY_ICONS.notes className="shrink-0 text-muted-foreground" size={14} strokeWidth={2.5} />, title: "회의록 2026-05", count: 28 },
      { id: "v4", rank: 4, icon: <ENTITY_ICONS.notes className="shrink-0 text-muted-foreground" size={14} strokeWidth={2.5} />, title: "아이디어 스크래치패드", count: 21 },
      { id: "v5", rank: 5, icon: <ENTITY_ICONS.books className="shrink-0 text-muted-foreground" size={14} strokeWidth={2.5} />, title: "기술 서적 리스트", count: 15 },
    ],
  },
  quicklinksLabel: "Quicklinks",
  quicklinks: [
    { key: "q1", title: "온톨로지 엔진 설계", meta: "Note · 2h ago", icon: <FileText size={14} strokeWidth={2} />, colorClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
    { key: "q2", title: "제텔카스텐", meta: "Wiki · 5h ago", icon: <BookOpen size={14} strokeWidth={2} />, colorClass: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
    { key: "q3", title: "디자인 리서치", meta: "Folder · 8 notes", icon: <PhFolder size={14} strokeWidth={2} />, colorClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
    { key: "q4", title: "미완성 위키", meta: "View · Wiki", icon: <Funnel size={14} strokeWidth={2} />, colorClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
    { key: "q5", title: "핵심 인용구", meta: "Bookmark · 독서 노트", icon: <BookmarkSimple size={14} fill="currentColor" strokeWidth={2} />, colorClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
    { key: "q6", title: "2026 로드맵", meta: "Book · 12 items", icon: <SPACE_ICONS.books size={14} strokeWidth={2} />, colorClass: "bg-rose-700/10 text-rose-700 dark:text-rose-400" },
    { key: "q7", title: "주간 회고", meta: "Note · 1d ago", icon: <FileText size={14} strokeWidth={2} />, colorClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
    { key: "q8", title: "팔란티어 패턴", meta: "Wiki · 3d ago", icon: <BookOpen size={14} strokeWidth={2} />, colorClass: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  ],
  ctaLabel: "Improve your knowledge graph",
}
