/**
 * Realistic sample data for the Editor preview. Mirrors the live toolbar
 * vocabulary (components/editor/FixedToolbar.tsx) and chrome (note-editor.tsx)
 * so the preview reads like a real note being edited, with a populated body.
 *
 * The toolbar icons come from the same pure barrel the live toolbar uses
 * (@/lib/editor/editor-icons, remix). The body is a static approximation of
 * TipTap output (the engine is intentionally excluded).
 */
import {
  TextB,
  TextItalic,
  TextUnderline as UnderlineIcon,
  TextStrikethrough,
  TextT,
  HighlighterCircle,
  ListBullets,
  ListNumbers,
  CheckSquare,
  TextIndent,
  TextOutdent,
  Eraser,
  Quotes,
  CodeBlock,
  Minus as PhMinus,
  BookmarkSimple,
  Link as PhLink,
  TextAlignLeft,
  CaretRight,
  Image as PhImage,
  MathOperations,
  CalendarDots,
  KeyReturn,
  ArrowCounterClockwise,
  ArrowClockwise,
  Code as PhCode,
  Lightbulb,
} from "@/lib/editor/editor-icons"
import type { EditorViewModel } from "./editor.types"

export const editorMock: EditorViewModel = {
  pane: "primary",
  isReadMode: false,
  pinned: true,
  detailsOpen: false,
  hasCollapsibles: true,
  allCollapsed: true,

  breadcrumb: [
    { id: "notes", label: "Notes" },
    { id: "folder", label: "디자인 리서치" },
  ],
  referencedIn: [
    { id: "w1", title: "제텔카스텐 방법론" },
    { id: "w2", title: "지식 관계망 개론" },
    { id: "w3", title: "팔란티어 온톨로지" },
    { id: "w4", title: "노트 작성 워크플로" },
  ],

  title: "지식 그래프 설계 노트",
  titlePlaceholder: "제목 없음",
  meta: {
    status: "in_progress",
    statusLabel: "정리 중",
    priority: "high",
    priorityLabel: "높음",
    tags: [
      { id: "t1", name: "온톨로지", color: "#8b5cf6" },
      { id: "t2", name: "리서치", color: "#06b6d4" },
      { id: "t3", name: "설계", color: "#f59e0b" },
    ],
    updatedLabel: "3시간 전",
  },

  toolbarGroups: [
    {
      key: "inline",
      buttons: [
        { id: "bold", title: "Bold — Make text bold (Ctrl+B)", icon: <TextB size={20} />, active: true },
        { id: "italic", title: "Italic — Make text italic (Ctrl+I)", icon: <TextItalic size={20} /> },
        { id: "underline", title: "Underline — Underline text (Ctrl+U)", icon: <UnderlineIcon size={20} /> },
        { id: "strike", title: "Strikethrough — Draw a line through text", icon: <TextStrikethrough size={20} /> },
      ],
    },
    {
      key: "color",
      buttons: [
        { id: "textColor", title: "Text Color", icon: <TextT size={20} /> },
        { id: "highlight", title: "Highlight Color", icon: <HighlighterCircle size={20} /> },
      ],
    },
    {
      key: "lists",
      buttons: [
        { id: "bulletList", title: "Bullet List — Create an unordered list", icon: <ListBullets size={20} /> },
        { id: "orderedList", title: "Numbered List — Create an ordered list", icon: <ListNumbers size={20} /> },
        { id: "taskList", title: "Checklist — Create a task checklist", icon: <CheckSquare size={20} /> },
      ],
    },
    {
      key: "indent",
      buttons: [
        { id: "indent", title: "Indent — Increase indentation (Tab)", icon: <TextIndent size={20} /> },
        { id: "outdent", title: "Outdent — Decrease indentation (Shift+Tab)", icon: <TextOutdent size={20} /> },
        { id: "removeFormat", title: "Remove Formatting — Clear all text styles", icon: <Eraser size={20} /> },
      ],
    },
    {
      key: "blocks",
      buttons: [
        { id: "blockquote", title: "Blockquote — Add a quoted block", icon: <Quotes size={20} /> },
        { id: "codeBlock", title: "Code Block — Insert a code snippet block", icon: <CodeBlock size={20} /> },
        { id: "divider", title: "Divider — Insert a horizontal line", icon: <PhMinus size={20} /> },
        { id: "bookmark", title: "Bookmark — Insert navigation anchor", icon: <BookmarkSimple size={20} /> },
        { id: "link", title: "Insert Link — Add a hyperlink (Ctrl+K)", icon: <PhLink size={20} /> },
      ],
    },
    {
      key: "align",
      buttons: [
        { id: "textAlign", title: "Text alignment", icon: <TextAlignLeft size={20} /> },
      ],
    },
    {
      key: "insert",
      buttons: [
        { id: "toggle", title: "Toggle — Insert a collapsible section", icon: <CaretRight size={20} /> },
        { id: "image", title: "Image — Upload and insert an image", icon: <PhImage size={20} /> },
      ],
    },
    {
      key: "math",
      buttons: [
        { id: "inlineMath", title: "Inline Math — Insert an inline LaTeX formula", icon: <MathOperations size={20} /> },
        { id: "date", title: "Insert Date — Insert today's date", icon: <CalendarDots size={20} /> },
        { id: "hardBreak", title: "Line Break — Insert a line break (Shift+Enter)", icon: <KeyReturn size={20} /> },
      ],
    },
    {
      key: "history",
      buttons: [
        { id: "undo", title: "Undo — Undo last action (Ctrl+Z)", icon: <ArrowCounterClockwise size={20} /> },
        { id: "redo", title: "Redo — Redo last action (Ctrl+Shift+Z)", icon: <ArrowClockwise size={20} />, disabled: true },
        { id: "inlineCode", title: "Inline Code — Format as inline code (Ctrl+E)", icon: <PhCode size={20} /> },
      ],
    },
  ],

  body: [
    {
      kind: "paragraph",
      text: "지식 그래프는 노트와 노트 사이의 관계를 명시적으로 모델링한다. 제텔카스텐이 개별 메모의 자율성을 강조한다면, 팔란티어식 온톨로지는 엔티티와 관계를 1급 시민으로 다룬다. 이 노트는 두 접근을 어떻게 하나의 관계망으로 통합할지 정리한다.",
    },
    { kind: "heading", level: 2, text: "핵심 설계 원칙" },
    {
      kind: "paragraph",
      text: "그래프의 노드는 노트이고, 엣지는 사용자가 의도적으로 만든 링크 또는 온톨로지 관계다. 자동 추론보다 사용자의 명시적 연결을 우선하되, 통계·규칙 기반 제안으로 발견을 돕는다.",
    },
    {
      kind: "bullets",
      items: [
        "노드 = 노트 / 위키 / 책 (cross-entity)",
        "엣지 = 위키링크, 임베드, 온톨로지 관계(related-to · extends · contradicts)",
        "색은 완성도 4단계(backlog → done)로 인코딩",
        "고아 노드는 인사이트의 ring에서 별도 노출",
      ],
    },
    {
      kind: "callout",
      icon: <Lightbulb size={18} />,
      text: "발견(discovery)은 분석(analysis)과 다르다. 분석은 Dashboard가, 발견은 Inbox의 detected nudge가 담당한다 — 같은 데이터라도 진입점이 다르다.",
    },
    { kind: "heading", level: 3, text: "열린 질문" },
    {
      kind: "quote",
      text: "관계의 방향성(directed vs undirected)을 사용자에게 노출할 것인가, 아니면 내부 표현으로만 둘 것인가? Linear의 절제 원칙과 Notion식 발견성 사이의 균형점을 찾아야 한다.",
    },
    {
      kind: "paragraph",
      text: "다음 단계는 그래프를 별도 공간이 아니라 display mode(렌즈)로 다루는 것이다. 노트 리스트·보드·캘린더와 동등한 표현 모드로 두면, 같은 facet 필터를 모든 표면에서 재사용할 수 있다.",
    },
  ],
}
