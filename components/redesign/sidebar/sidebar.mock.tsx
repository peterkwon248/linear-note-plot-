/**
 * Realistic sample data for the Sidebar preview. Mirrors the live icon + label
 * vocabulary exactly (linear-sidebar.tsx) so the preview reads like the real
 * app with a populated workspace.
 *
 * The live container builds each row's leading glyph from store data; here the
 * mock supplies those glyphs as ready-made ReactNodes using the SAME pure visual
 * components the live file uses:
 *   - status nav:        IconBacklog / IconTodo / IconInProgress / IconDone (size 20)
 *   - pinned/recent note rows: StatusShapeIcon (size 14)  — pure (colors only)
 *   - pinned wiki row:   IconWiki @ SPACE_COLORS.wiki (size 14)
 *   - pinned book row:   BookKindIcon (size 14)           — pure (kind literal)
 *   - More section:      GitMerge / Scissors / IconTemplate / IconInsight
 * None of these touch the store/router/i18n, so importing them keeps the mock
 * faithful without violating the pure-presentational boundary.
 */
import {
  IconHome,
  IconInbox,
  IconNotes,
  IconBacklog,
  IconTodo,
  IconInProgress,
  IconDone,
  IconPin,
  IconWiki,
  IconTemplate,
  IconInsight,
} from "@/components/plot-icons"
import { GitMerge, Scissors } from "lucide-react"
import { StatusShapeIcon } from "@/components/status-icon"
import { BookKindIcon } from "@/components/property-chips"
import { SPACE_COLORS } from "@/lib/colors"
import type { SidebarViewModel, SidebarContextModel } from "./sidebar.types"

/* ── Shell (chrome shared across all contexts) ───────────────────────────── */

export const sidebarShellMock: SidebarViewModel = {
  spaceLabel: "노트",
  inbox: {
    id: "/inbox",
    label: "수신함",
    icon: <IconInbox size={20} />,
    count: 7,
    active: false,
  },
  helpLabel: "도움말",
  helpHint: "?",
  trashLabel: "휴지통",
}

/* ── Notes context (full) — linear-sidebar.tsx L817–1086 ──────────────────── */

export const notesContextMock: SidebarContextModel = {
  space: "notes",
  topNav: [
    { id: "/notes", label: "모든 노트", icon: <IconNotes size={20} />, count: 142, active: true },
    { id: "/backlog", label: "백로그", icon: <IconBacklog size={20} />, count: 23 },
    { id: "/todo", label: "할 일", icon: <IconTodo size={20} />, count: 14 },
    { id: "/in-progress", label: "진행 중", icon: <IconInProgress size={20} />, count: 9 },
    { id: "/done", label: "완료", icon: <IconDone size={20} />, count: 96 },
    { id: "/pinned", label: "고정됨", icon: <IconPin size={20} />, count: 4 },
  ],
  pinned: {
    label: "고정됨",
    rows: [
      { id: "p1", title: "온톨로지 엔진 설계", icon: <StatusShapeIcon status="in_progress" size={14} />, draggable: true },
      { id: "p2", title: "제텔카스텐 방법론 정리", icon: <StatusShapeIcon status="done" size={14} />, draggable: true },
      { id: "p3", title: "이번 분기 목표", icon: <StatusShapeIcon status="todo" size={14} />, draggable: true },
      { id: "p4", title: "아이디어 스크래치패드", icon: <StatusShapeIcon status="backlog" size={14} />, draggable: true },
    ],
  },
  folders: {
    label: "폴더",
    newFolderPlaceholder: "Folder name",
    folders: [
      { id: "f1", name: "디자인 리서치", count: 18, active: false },
      { id: "f2", name: "독서 노트", count: 32 },
      { id: "f3", name: "회의록", count: 11 },
      { id: "f4", name: "주간 회고", count: 7 },
    ],
    hiddenCount: 3,
  },
  more: {
    label: "더 보기",
    rows: [
      { id: "/merge", title: "병합", icon: <GitMerge size={16} /> },
      { id: "/split", title: "분할", icon: <Scissors size={16} /> },
      { id: "/templates", title: "템플릿", icon: <IconTemplate size={20} />, count: 6 },
      { id: "/insights", title: "인사이트", icon: <IconInsight size={20} /> },
    ],
  },
  recent: {
    label: "최근",
    rows: [
      { id: "r1", title: "팔란티어 온톨로지 모델", icon: <StatusShapeIcon status="in_progress" size={14} />, draggable: true },
      { id: "r2", title: "지식 그래프 설계 노트", icon: <StatusShapeIcon status="todo" size={14} />, draggable: true },
      { id: "r3", title: "Linear 디자인 원칙", icon: <StatusShapeIcon status="done" size={14} />, draggable: true },
      { id: "r4", title: "회의록 2026-05", icon: <StatusShapeIcon status="backlog" size={14} />, draggable: true },
    ],
  },
}

/** Notes-context shell label override (`t("nav.space.notes")` → "노트"). */
export const notesShellMock: SidebarViewModel = {
  ...sidebarShellMock,
  spaceLabel: "노트",
}

/* ── Home context (Inbox + Pinned + Recent) — linear-sidebar.tsx L2009–2084 ── */

export const homeContextMock: SidebarContextModel = {
  space: "home",
  topNav: [
    { id: "/home", label: "개요", icon: <IconHome size={20} />, active: true },
  ],
  // Cross-entity pinned: note (StatusShapeIcon) + wiki (violet IconWiki) + book
  // (BookKindIcon) — exactly the three live branches in the Home Pinned block.
  pinned: {
    label: "고정됨",
    rows: [
      { id: "hp1", title: "온톨로지 엔진 설계", icon: <StatusShapeIcon status="in_progress" size={14} />, draggable: true },
      { id: "hp2", title: "제텔카스텐", icon: <IconWiki size={14} style={{ color: SPACE_COLORS.wiki }} /> },
      { id: "hp3", title: "디자인 리서치", icon: <StatusShapeIcon status="todo" size={14} />, draggable: true },
      { id: "hp4", title: "2026 로드맵", icon: <BookKindIcon kind="hybrid" size={14} />, count: 12 },
    ],
  },
  recent: {
    label: "최근",
    rows: [
      { id: "hr1", title: "이번 분기 목표", icon: <StatusShapeIcon status="todo" size={14} />, draggable: true },
      { id: "hr2", title: "주간 회고", icon: <StatusShapeIcon status="done" size={14} />, draggable: true },
      { id: "hr3", title: "아이디어 스크래치패드", icon: <StatusShapeIcon status="backlog" size={14} />, draggable: true },
    ],
  },
}

/** Home-context shell label override (`t("nav.space.home")` → "홈"). */
export const homeShellMock: SidebarViewModel = {
  ...sidebarShellMock,
  spaceLabel: "홈",
}

/*
 * 후속 추가 (동일 패턴) — Wiki / Calendar / Ontology / Library / Books.
 * 각 컨텍스트는 같은 SidebarContextModel 스켈레톤이다. 예) Wiki:
 *   {
 *     space: "wiki",
 *     topNav: [Overview(ENTITY_ICONS.wiki) + backlog/todo/in_progress/done],
 *     pinned: { rows: [IconWiki violet …] },
 *     folders: { … kind="wiki" },
 *     more: [Merge, Split, Templates, Insights],
 *     recent: { rows: [IconWiki …] },
 *   }
 * preview page에 토글을 추가하고 이 mock을 넘기면 view 코드 변경 없이 렌더된다.
 */
