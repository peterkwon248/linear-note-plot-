import type { Note, Folder, Tag, Label, NoteTemplate, WikiArticle, WikiCategory } from "../types"
import { workflowDefaults } from "./helpers"
import { buildSectionIndex } from "../wiki-section-index"

export const SEED_FOLDERS: Folder[] = [
  { id: "folder-1", name: "Projects", color: "#5e6ad2", parentId: null, lastAccessedAt: null, pinned: false, pinnedOrder: 0, createdAt: new Date().toISOString() },
  { id: "folder-2", name: "Daily Log", color: "#45d483", parentId: null, lastAccessedAt: null, pinned: false, pinnedOrder: 0, createdAt: new Date().toISOString() },
]

export const SEED_TAGS: Tag[] = [
  { id: "tag-1", name: "Knowledge Management", color: "#5e6ad2" },
  { id: "tag-2", name: "Zettelkasten", color: "#7c66dc" },
  { id: "tag-3", name: "Productivity", color: "#45d483" },
  { id: "tag-4", name: "Reading", color: "#f5a623" },
  { id: "tag-5", name: "Tech", color: "#e5484d" },
]

export const SEED_LABELS: Label[] = [
  { id: "label-1", name: "Idea", color: "#7c66dc" },
  { id: "label-2", name: "Research", color: "#5e6ad2" },
  { id: "label-3", name: "Meeting", color: "#45d483" },
  { id: "label-4", name: "Diary", color: "#e5484d" },
  { id: "label-5", name: "Memo", color: "#f5a623" },
]

export const SEED_TEMPLATES: NoteTemplate[] = [
  {
    id: "tmpl-meeting",
    name: "Meeting Notes",
    description: "Meeting notes template",
    icon: "📋",
    color: "#45d483",
    title: "Meeting - {date}",
    content: "## Attendees\n\n- \n\n## Agenda\n\n1. \n\n## Decisions\n\n- \n\n## Action Items\n\n- [ ] ",
    contentJson: null,
    status: "capture",
    priority: "medium",
    labelId: "label-3",
    tags: [],
    folderId: null,
    pinned: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tmpl-daily",
    name: "Daily Log",
    description: "Daily journal entry",
    icon: "📝",
    color: "#5e6ad2",
    title: "Daily - {date}",
    content: "## Today\n\n### Done\n\n- \n\n### In Progress\n\n- \n\n### Notes\n\n",
    contentJson: null,
    status: "inbox",
    priority: "none",
    labelId: "label-4",
    tags: [],
    folderId: null,
    pinned: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tmpl-idea",
    name: "Idea",
    description: "Quick idea note",
    icon: "💡",
    color: "#7c66dc",
    title: "",
    content: "## Idea\n\n\n\n## Why?\n\n\n\n## Next Steps\n\n- ",
    contentJson: null,
    status: "inbox",
    priority: "none",
    labelId: "label-1",
    tags: [],
    folderId: null,
    pinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tmpl-research",
    name: "Research",
    description: "Research note",
    icon: "🔬",
    color: "#5e6ad2",
    title: "",
    content: "## Topic\n\n\n\n## Key Findings\n\n\n\n## Sources\n\n- \n\n## Insights\n\n",
    contentJson: null,
    status: "capture",
    priority: "none",
    labelId: "label-2",
    tags: [],
    folderId: null,
    pinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

/* ── Seed notes — one per workflow stage ─────────────── */

const INBOX_NOTE_CONTENT = `떠오른 생각 — 다듬기 전에 일단 적어둔다.

오늘 읽은 글에서 흥미로운 문장: "Writing is thinking."
왜 와닿았는지 모르겠지만, 나중에 제대로 생각해볼 것.`

const CAPTURE_NOTE_CONTENT = `# 지식 관리 시스템 정리

## 하고 싶은 것
- 매일 새로 배운 개념을 1개씩 기록
- 기존 노트와 연결 고리를 찾아보기
- 주 1회 리뷰로 Permanent 승격 여부 판단

## 아직 정리가 안 된 부분
- 태그 vs 폴더 기준
- Fleeting 노트의 보관 기간

초고 상태. 이번 주 안에 Permanent로 승격시킬 것.`

const PERMANENT_NOTE_CONTENT = `# Welcome to Plot

Plot combines notes, wiki, and a knowledge graph into one.

## 3단계 워크플로우

1. **Inbox** — 떠오른 생각을 바로 적는 곳
2. **Capture** — 다듬는 중인 초고
3. **Permanent** — 완성된 독립된 아이디어

개념이 반복적으로 참조되면 [[wiki:Plot]] 위키로 승격시킨다.`

export const SEED_NOTES: Note[] = [
  {
    id: "note-inbox",
    title: "",
    content: INBOX_NOTE_CONTENT,
    contentJson: null,
    folderId: null,
    tags: [],
    labelId: null,
    status: "inbox",
    priority: "none",
    reads: 0,
    pinned: false,
    trashed: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    ...workflowDefaults("inbox"),
    noteType: "note" as const,
    summary: "",
    preview: INBOX_NOTE_CONTENT.slice(0, 80),
    linksOut: [],
    aliases: [],
    wikiInfobox: [],
    referenceIds: [],
  },
  {
    id: "note-capture",
    title: "지식 관리 시스템 정리",
    content: CAPTURE_NOTE_CONTENT,
    contentJson: null,
    folderId: null,
    tags: [],
    labelId: null,
    status: "capture",
    priority: "medium",
    reads: 1,
    pinned: false,
    trashed: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    ...workflowDefaults("capture"),
    noteType: "note" as const,
    summary: "내 지식 관리 방식 다듬는 중",
    preview: "하고 싶은 것 — 매일 새로 배운 개념을 1개씩 기록",
    linksOut: [],
    aliases: [],
    wikiInfobox: [],
    referenceIds: [],
  },
  {
    id: "note-welcome",
    title: "Welcome to Plot",
    content: PERMANENT_NOTE_CONTENT,
    contentJson: null,
    folderId: null,
    tags: [],
    labelId: null,
    status: "permanent",
    priority: "high",
    reads: 3,
    pinned: true,
    trashed: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    ...workflowDefaults("permanent"),
    noteType: "note" as const,
    summary: "Plot 3단계 워크플로우 소개",
    preview: "Plot combines notes, wiki, and a knowledge graph into one.",
    linksOut: ["plot"],
    aliases: [],
    wikiInfobox: [],
    referenceIds: [],
  },
]

/* ── Seed wiki categories — empty, user creates their own ── */

export const SEED_WIKI_CATEGORIES: WikiCategory[] = []

/* ── Seed Wiki Articles — 2 minimal samples ─────────── */

const bid = () => crypto.randomUUID()

const _SEED_WIKI_ARTICLES_RAW: Omit<WikiArticle, "sectionIndex">[] = [
  {
    id: "wiki-plot",
    title: "Plot",
    aliases: ["Plot App"],
    blocks: [
      {
        id: bid(),
        type: "infobox",
        fields: [
          { key: "Type", value: "Notes + Wiki + Graph" },
          { key: "Status", value: "In development" },
        ],
        headerColor: null,
      },
      { id: bid(), type: "section", title: "Overview", level: 2 },
      { id: bid(), type: "text", content: "Plot is a knowledge app that unifies three layers: notes for quick capture, a wiki for durable concepts, and a graph that surfaces connections between them." },
      { id: bid(), type: "section", title: "Core ideas", level: 2 },
      { id: bid(), type: "text", content: "Notes flow through Inbox → Capture → Permanent. Once a concept is referenced repeatedly, promote it to a wiki article using [[wiki:Zettelkasten]]-style linking." },
    ],
    tags: [],
    categoryIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wiki-zettelkasten",
    title: "Zettelkasten",
    aliases: ["Slip box"],
    blocks: [
      {
        id: bid(),
        type: "infobox",
        fields: [
          { key: "Creator", value: "Niklas Luhmann" },
          { key: "Meaning", value: "Slip box (German)" },
        ],
        headerColor: null,
      },
      { id: bid(), type: "section", title: "Definition", level: 2 },
      { id: bid(), type: "text", content: "Zettelkasten is a note-taking method built around atomic notes, dense linking, and steady accumulation. Luhmann used it to produce 70 books and 400+ papers." },
      { id: bid(), type: "section", title: "In Plot", level: 2 },
      { id: bid(), type: "text", content: "Each wiki article is a Zettel. [[wiki:Plot]] wikilinks form the slip-box connections." },
    ],
    tags: [],
    categoryIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

// Compute sectionIndex + 1-column Blank `layout` + `columnAssignments` for each seed article.
export const SEED_WIKI_ARTICLES: WikiArticle[] = _SEED_WIKI_ARTICLES_RAW.map((a) => {
  const blockIds = a.blocks.map((b) => b.id)
  const layout = {
    type: "columns" as const,
    columns: [{ ratio: 1, content: { type: "blocks" as const, blockIds } }],
  }
  const columnAssignments = Object.fromEntries(blockIds.map((id) => [id, [0]]))
  return {
    ...a,
    sectionIndex: buildSectionIndex(a.blocks),
    layout,
    columnAssignments,
  }
})
