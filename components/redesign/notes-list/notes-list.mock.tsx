/**
 * Realistic sample data for the Notes-list preview.
 * Mirrors the live COLUMN_DEFS column ids/widths verbatim (notes-table.tsx L138-L152).
 * Status 4종(backlog/todo/in_progress/done), 3 groups (status 기반), 12 notes.
 * Folder/label chips, pinned, source icon variants, tag chipless (tags moved to facet).
 */
import type {
  NotesListViewModel,
  NoteColumnDef,
  NotesListGroup,
} from "./notes-list.types"

// Fixed reference "now" → deterministic timestamps. Using Date.now() at module
// eval would differ between the SSR pass and client hydration, tripping a React
// hydration mismatch on the title=ISO tooltip. Mirrors shortRelative's anchor.
const PREVIEW_NOW = Date.parse("2026-06-01T12:00:00.000Z")

/* ── Column defs (verbatim from live COLUMN_DEFS L138-L152) ── */
const COLUMN_DEFS: NoteColumnDef[] = [
  { id: "title",     label: "이름",      width: "flex-1 min-w-0",          sortField: "title" },
  { id: "status",    label: "상태",      width: "w-[120px] shrink-0",      sortField: "status" },
  { id: "folder",    label: "폴더",      width: "w-[80px] shrink-0",       align: "text-center", sortField: "folder" },
  { id: "parent",    label: "상위",      width: "w-[100px] shrink-0",      align: "text-center" },
  { id: "children",  label: "하위",      width: "w-[72px] shrink-0",       align: "text-center" },
  { id: "links",     label: "백링크",    width: "w-[72px] shrink-0",       align: "text-center", sortField: "links" },
  { id: "reads",     label: "열람",      width: "w-[72px] shrink-0",       align: "text-center", sortField: "reads" },
  { id: "wordCount", label: "단어",      width: "w-[72px] shrink-0",       align: "text-right",  sortField: "reads" },
  { id: "updatedAt", label: "수정일",    width: "w-[80px] shrink-0",       align: "text-right",  sortField: "updatedAt" },
  { id: "createdAt", label: "생성일",    width: "w-[80px] shrink-0",       align: "text-right",  sortField: "createdAt" },
]

/** Visible columns for the preview (wide viewport — all non-min-width cols) */
const VISIBLE: Array<"title"|"status"|"folder"|"links"|"reads"|"updatedAt"> =
  ["title", "status", "folder", "links", "reads", "updatedAt"]

/** CSS grid-template-columns — mirrors live gridTemplate computation (L992-L1003) */
const GRID = "32px 1fr 120px 80px 72px 72px 80px"

/* ── Sample folders ─────────────────────────────────────── */
const F_DESIGN  = { id: "f1", name: "디자인 리서치", color: "#f97316" }
const F_DEV     = { id: "f2", name: "개발 노트",     color: "#06b6d4" }
const F_IDEAS   = { id: "f3", name: "아이디어",       color: "#8b5cf6" }

/* ── Sample labels ──────────────────────────────────────── */
const L_IMPORTANT = { id: "l1", name: "중요", color: "#ef4444" }
const L_REVIEW    = { id: "l2", name: "검토 중", color: "#f59e0b" }

/* ── Groups (status 기준, 3개) ──────────────────────────── */
const GROUPS: NotesListGroup[] = [
  {
    key: "in_progress",
    label: "진행 중",
    count: 4,
    notes: [
      {
        id: "n1",
        title: "온톨로지 엔진 설계 — 관계 타입 정의",
        status: "in_progress",
        priority: "high",
        source: "manual",
        folders: [F_DEV],
        label: L_IMPORTANT,
        links: 14,
        reads: 47,
        wordCount: 1240,
        updatedAt: new Date(PREVIEW_NOW -2 * 60 * 60 * 1000).toISOString(),
        createdAt: "2026-04-10T09:00:00Z",
        pinned: true,
        parentTitle: undefined,
        childTitles: ["관계 타입 목록", "엣지 스키마"],
        preview: "노트 간 관계를 표현하는 타입 시스템. `IS_A`, `PART_OF`, `CAUSED_BY` 등 기본 술어 + 사용자 정의 확장.",
      },
      {
        id: "n2",
        title: "제텔카스텐 원자성 원칙 재검토",
        status: "in_progress",
        priority: "medium",
        source: "manual",
        folders: [F_IDEAS, F_DEV],
        label: null,
        links: 9,
        reads: 33,
        wordCount: 780,
        updatedAt: new Date(PREVIEW_NOW -5 * 60 * 60 * 1000).toISOString(),
        createdAt: "2026-04-18T14:30:00Z",
        pinned: false,
        preview: "루만의 원자성(Atomicity) 원칙이 현대 디지털 도구에서 어떻게 구현되는지 분석.",
      },
      {
        id: "n3",
        title: "Linear IA 헌법 — §10 패널 토글 구조",
        status: "in_progress",
        priority: "urgent",
        source: "manual",
        folders: [F_DESIGN],
        label: L_REVIEW,
        links: 7,
        reads: 28,
        wordCount: 540,
        updatedAt: new Date(PREVIEW_NOW -8 * 60 * 60 * 1000).toISOString(),
        createdAt: "2026-05-01T11:00:00Z",
        pinned: false,
        preview: "디테일 패널 = 콘텐츠 우상단, 사이드바 = 인-패널 hover, 액티비티 바 = 상단바. 비대칭 의도적.",
      },
      {
        id: "n4",
        title: "2026 하반기 로드맵 초안",
        status: "in_progress",
        priority: "high",
        source: "manual",
        folders: [],
        label: null,
        links: 5,
        reads: 22,
        wordCount: 390,
        updatedAt: new Date(PREVIEW_NOW -1 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: "2026-05-20T09:00:00Z",
        pinned: false,
        preview: "Q3: 데스크톱 앱 출시 → Q4: 클라우드 싱크 베타. 사용자 성장 목표 및 KPI.",
      },
    ],
  },
  {
    key: "todo",
    label: "할 일",
    count: 5,
    notes: [
      {
        id: "n5",
        title: "Tauri vs Electron 비교 — 번들 크기·성능",
        status: "todo",
        priority: "high",
        source: "webclip",
        folders: [F_DEV],
        label: null,
        links: 3,
        reads: 12,
        wordCount: 620,
        updatedAt: new Date(PREVIEW_NOW -2 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: "2026-05-22T15:00:00Z",
        pinned: false,
        preview: "Tauri: Rust 기반 shell, 번들 ~4MB, Webview 사용. Electron: V8 내장, ~80MB.",
      },
      {
        id: "n6",
        title: "IDB 영속성 — 브라우저 eviction 정책 조사",
        status: "todo",
        priority: "medium",
        source: "manual",
        folders: [F_DEV],
        label: L_REVIEW,
        links: 2,
        reads: 8,
        wordCount: 310,
        updatedAt: new Date(PREVIEW_NOW -3 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: "2026-05-25T10:00:00Z",
        pinned: false,
        parentTitle: "Tauri vs Electron 비교 — 번들 크기·성능",
        preview: "Chrome: 사용량 기반 eviction. Firefox: 상한 초과 시 LRU 제거. Safari: 7일 미접근 삭제.",
      },
      {
        id: "n7",
        title: "SRS 알고리즘 선택 — SM-2 vs FSRS",
        status: "todo",
        priority: "low",
        source: "manual",
        folders: [F_IDEAS],
        label: null,
        links: 6,
        reads: 19,
        wordCount: 870,
        updatedAt: new Date(PREVIEW_NOW -4 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: "2026-04-05T08:00:00Z",
        pinned: false,
        preview: "FSRS(Free Spaced Repetition Scheduler)가 SM-2보다 파라미터 적고 정확도 높음. 오픈소스 구현 있음.",
      },
      {
        id: "n8",
        title: "회의록 2026-05-28 팀 싱크",
        status: "todo",
        priority: "none",
        source: "manual",
        folders: [],
        label: null,
        links: 0,
        reads: 4,
        wordCount: 180,
        updatedAt: new Date(PREVIEW_NOW -5 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: "2026-05-28T14:00:00Z",
        pinned: false,
        preview: "참석: 기현·수진·태윤. 주요 결정: 출시 일정 6월 15일 확정, 베타 사용자 50명 모집.",
      },
      {
        id: "n9",
        title: "Yjs CRDT 아키텍처 — 충돌 해소 전략",
        status: "todo",
        priority: "high",
        source: "import",
        folders: [F_DEV],
        label: L_IMPORTANT,
        links: 8,
        reads: 31,
        wordCount: 1050,
        updatedAt: new Date(PREVIEW_NOW -6 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: "2026-05-10T09:00:00Z",
        pinned: false,
        preview: "Y.Doc + Awareness. 오프라인 편집 merge: 삽입·삭제 둘 다 timestamp 기반 LWW 아님—구조 기반.",
      },
    ],
  },
  {
    key: "done",
    label: "완료",
    count: 3,
    notes: [
      {
        id: "n10",
        title: "데이터 라이프사이클 감사 — 삭제 cascade 완전성",
        status: "done",
        priority: "urgent",
        source: "manual",
        folders: [F_DEV],
        label: null,
        links: 4,
        reads: 15,
        wordCount: 730,
        updatedAt: new Date(PREVIEW_NOW -7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: "2026-05-31T10:00:00Z",
        pinned: false,
        preview: "PR #508 완료. note 영구삭제 시 IDB note-body-store + mention-index-store 동시 삭제 확인.",
      },
      {
        id: "n11",
        title: "NoteStatus 4단계 마이그레이션 (v150)",
        status: "done",
        priority: "high",
        source: "manual",
        folders: [F_DEV],
        label: null,
        links: 11,
        reads: 42,
        wordCount: 920,
        updatedAt: new Date(PREVIEW_NOW -14 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: "2026-05-15T09:00:00Z",
        pinned: true,
        childTitles: ["마이그레이션 검증 체크리스트"],
        preview: "stone→backlog, brick→todo, keystone→done. 기존 값 garbage cleanup allow-list 포함.",
      },
      {
        id: "n12",
        title: "Linear 디자인 원칙 요약 — 절제·발견성",
        status: "done",
        priority: "medium",
        source: "manual",
        folders: [F_DESIGN, F_IDEAS],
        label: null,
        links: 18,
        reads: 67,
        wordCount: 460,
        updatedAt: new Date(PREVIEW_NOW -21 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: "2026-04-02T11:00:00Z",
        pinned: false,
        preview: "과도한 절제 탈피. 노트앱=실용·발견성. Notion 장점 선택적 도입. 코어(지식 관계망) 불변.",
      },
    ],
  },
]

/* ── View-model assembly ─────────────────────────────────── */

export const notesListMock: NotesListViewModel = {
  title: "노트",
  totalCount: 12,
  columnDefs: COLUMN_DEFS,
  groups: GROUPS,
  isEmpty: false,
  showSortChip: false,
  sortChipLabel: "",
  viewState: {
    sortField: "updatedAt",
    sortDirection: "desc",
    visibleColumns: VISIBLE,
    gridTemplate: GRID,
    isGrouped: true,
    groupByLabel: "상태",
  },
}

/** Flat (ungrouped) variant — single group, no group header shown. */
export const notesListFlatMock: NotesListViewModel = {
  ...notesListMock,
  groups: [
    {
      key: "",
      label: "",
      count: 12,
      notes: GROUPS.flatMap((g) => g.notes),
    },
  ],
  viewState: {
    ...notesListMock.viewState,
    isGrouped: false,
    groupByLabel: "",
    sortField: "title",
    sortDirection: "asc",
    // No status column when flat (demo: narrower grid)
    visibleColumns: ["title", "folder", "links", "reads", "updatedAt"],
    gridTemplate: "32px 1fr 80px 72px 72px 80px",
  },
  showSortChip: true,
  sortChipLabel: "이름 ↑",
}
