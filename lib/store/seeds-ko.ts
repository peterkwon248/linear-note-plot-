/* ════════════════════════════════════════════════════════════════
 * Korean onboarding seed (로케일별 시드 — ko)
 *
 * 브라우저 언어가 한국어일 때 첫 실행에서 깔리는 온보딩 볼트.
 * EN 시드(seeds.ts)와 ID가 겹치지 않게 k-prefix 사용(둘은 동시에
 * 로드되지 않지만 명확성을 위해 분리). welcome-note만 EN과 동일
 * ID를 재사용 — use-autopilot-nudges.ts의 백로그 넛지 제외 규칙
 * (id !== "welcome-note")이 KO에서도 동작하도록.
 *
 * 콘텐츠 목표: Plot 사용법 + 제텔카스텐 활용 + 정리 개념
 * (폴더/태그/라벨/스티커/카테고리/우선순위/상태) 소개.
 * ════════════════════════════════════════════════════════════════ */

import type { Note, Folder, Tag, Label, WikiArticle, WikiCategory, Book, SmartBookPreset, Sticker, NoteStatus, NotePriority } from "../types"
import { workflowDefaults } from "./helpers"
import { buildSectionIndex } from "../wiki-section-index"

const bid = () => crypto.randomUUID()
const hoursAgoIso = (h: number) => new Date(Date.now() - h * 3600_000).toISOString()
const daysAgoIso = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString()

/* ── Folders ─────────────────────────────────────────── */
export const KO_SEED_FOLDERS: Folder[] = [
  { id: "kfolder-1", name: "프로젝트", color: "#5e6ad2", parentId: null, lastAccessedAt: null, pinned: false, pinnedOrder: 0, createdAt: daysAgoIso(3), kind: "note" },
  { id: "kfolder-2", name: "데일리 로그", color: "#45d483", parentId: null, lastAccessedAt: null, pinned: false, pinnedOrder: 0, createdAt: daysAgoIso(3), kind: "note" },
]

/* ── Tags ────────────────────────────────────────────── */
export const KO_SEED_TAGS: Tag[] = [
  { id: "ktag-1", name: "지식관리", color: "#5e6ad2" },
  { id: "ktag-2", name: "제텔카스텐", color: "#8b5cf6" },
  { id: "ktag-3", name: "생산성", color: "#45d483" },
  { id: "ktag-4", name: "독서", color: "#06b6d4" },
  { id: "ktag-5", name: "글쓰기", color: "#f5a623" },
]

/* ── Labels ──────────────────────────────────────────── */
export const KO_SEED_LABELS: Label[] = [
  { id: "klabel-1", name: "아이디어", color: "#8b5cf6" },
  { id: "klabel-2", name: "리서치", color: "#5e6ad2" },
  { id: "klabel-3", name: "메모", color: "#f5a623" },
  { id: "klabel-4", name: "일기", color: "#ec4899" },
  { id: "klabel-5", name: "회의", color: "#34d399" },
]

/* ── Wiki categories (다중 부모 DAG demo) ─────────────── */
export const KO_SEED_WIKI_CATEGORIES: WikiCategory[] = [
  { id: "kcat-1", name: "지식관리", parentIds: [], description: "지식을 정리하는 방법과 시스템", color: "#a78bfa", createdAt: daysAgoIso(3), updatedAt: daysAgoIso(3) },
  { id: "kcat-2", name: "제텔카스텐", parentIds: ["kcat-1"], description: "루만의 쪽지 상자 방법론", color: "#60a5fa", createdAt: daysAgoIso(3), updatedAt: daysAgoIso(3) },
  { id: "kcat-3", name: "노트 종류", parentIds: ["kcat-1", "kcat-2"], description: "지식 시스템의 다양한 노트 종류", color: "#34d399", createdAt: daysAgoIso(2), updatedAt: daysAgoIso(2) },
  { id: "kcat-4", name: "생산성", parentIds: [], description: "개인 효율을 위한 방법과 도구", color: "#84cc16", createdAt: daysAgoIso(2), updatedAt: daysAgoIso(2) },
  { id: "kcat-5", name: "노트 작성법", parentIds: ["kcat-4", "kcat-1"], description: "효과적으로 노트를 쓰는 전략", color: "#c084fc", createdAt: daysAgoIso(2), updatedAt: daysAgoIso(2) },
]

/* ── Notes ───────────────────────────────────────────── */

function mkNote(n: {
  id: string
  title: string
  content: string
  status: NoteStatus
  priority?: NotePriority
  tags?: string[]
  labelId?: string | null
  folderIds?: string[]
  pinned?: boolean
  reads?: number
  summary?: string | null
  linksOut?: string[]
  ageH?: number
}): Note {
  const created = hoursAgoIso(n.ageH ?? 24)
  const preview = n.content.replace(/[#>*`\-\[\]]/g, "").replace(/\s+/g, " ").trim().slice(0, 120)
  return {
    id: n.id,
    title: n.title,
    content: n.content,
    contentJson: null,
    folderIds: n.folderIds ?? [],
    tags: n.tags ?? [],
    labelId: n.labelId ?? null,
    status: n.status,
    priority: n.priority ?? "none",
    reads: n.reads ?? 0,
    pinned: n.pinned ?? false,
    trashed: false,
    createdAt: created,
    updatedAt: created,
    ...workflowDefaults(n.status),
    noteType: "note",
    summary: n.summary ?? null,
    preview,
    linksOut: n.linksOut ?? [],
    aliases: [],
    wikiInfobox: [],
    referenceIds: [],
  }
}

const KW_WELCOME = `# Plot에 오신 걸 환영해요 👋

Plot은 노트·위키·지식 그래프를 한곳에 모은 로컬 퍼스트 앱이에요. 모든 데이터는 이 기기에만 저장됩니다.

## 30초 둘러보기
- **새 노트** — \`+\` 버튼 또는 ⌘N
- **위키** — [[이중괄호]]로 노트끼리·위키로 연결되는 정리된 문서
- **그래프** — 온톨로지 뷰에서 지식이 어떻게 이어지는지 한눈에
- **명령 팔레트** — ⌘K로 어디든 이동

먼저 [[Plot 사용법]] 노트부터 읽어 보세요. 준비되면 이 노트는 지워도 됩니다.`

export const KO_WELCOME_NOTE: Note = mkNote({
  id: "welcome-note",
  title: "Plot에 오신 걸 환영해요 👋",
  content: KW_WELCOME,
  status: "backlog",
  priority: "none",
  pinned: true,
  ageH: 0.5,
  summary: "Plot 첫 시작 — 노트·위키·그래프를 한곳에.",
  linksOut: ["plot 사용법"],
})

const KN1 = `# Plot 사용법

Plot의 핵심은 셋이에요 — **쓰고, 잇고, 본다.**

## 1. 쓴다 — 노트
떠오르는 생각을 빠르게 적어요. 모든 노트엔 **상태**가 있어요:

\`대기\` → \`준비\` → \`정리 중\` → \`완성\`

무엇이 날것이고 무엇이 영근 생각인지 한눈에 보이죠. 급한 건 **우선순위**(긴급·높음·보통·낮음)로 따로 표시해요.

## 2. 잇는다 — 위키 & 링크
자주 꺼내 쓰는 개념은 [[wiki:제텔카스텐]]처럼 위키 문서로 키워요. 노트 안에서 \`[[제목]]\`이나 \`[[wiki:제목]]\`으로 연결하면 백링크가 자동으로 생깁니다.

## 3. 본다 — 뷰 & 그래프
같은 노트를 **리스트·보드·그리드·타임라인**으로 보고, **필터**로 좁힌 화면은 **저장된 뷰**로 남겨요. 온톨로지 그래프에선 연결 전체가 보입니다.

→ 정리 도구가 헷갈리면 [[정리 도구 한눈에]]를 보세요.`

const KN2 = `# 정리 도구 한눈에

Plot엔 정리 도구가 여럿이에요. "언제 뭘 쓰는지"만 알면 됩니다.

## 폴더
한 노트는 한 곳 — 물리적인 서랍이에요. "프로젝트", "데일리 로그"처럼.

## 태그
가볍게 여러 개. 주제로 가로지를 때 써요. 한 노트에 \`지식관리\` \`독서\`를 함께 붙일 수 있어요.

## 라벨
노트의 **종류**를 색으로, 한 개만. 아이디어·리서치·메모처럼.

## 스티커
종류 안 가리고 **아무 거나 묶기**. 노트든 위키든 북이든요. "지금 작업 중" 같은 임시 묶음에 딱이고, 그래프에선 색깔 껍질로 보여요.

## 카테고리 (위키)
위키 문서를 **다중 부모 트리(DAG)**로 묶어요. "지식관리 ▸ 제텔카스텐 ▸ 노트 종류"처럼.

## 우선순위 · 상태
- **상태** = 얼마나 영글었나 (대기·준비·정리 중·완성)
- **우선순위** = 얼마나 급한가 (긴급·높음·보통·낮음)

둘은 서로 다른 축이에요 — "급하지만 아직 날것"도, "안 급한데 완성"도 있으니까요.

> 요약: 폴더=서랍 · 태그=주제 · 라벨=종류 · 스티커=자유 묶음 · 카테고리=위키 계층`

const KN3 = `# 제텔카스텐이란?

독일 사회학자 **니클라스 루만**이 쓰던 메모 상자(Zettelkasten = "쪽지 상자")에서 온 방법이에요. 작은 노트를 서로 잇기만 했는데, 9만여 장이 모여 70권 넘는 책이 나왔죠.

핵심은 셋:
1. **작게 쪼갠다** — 한 노트엔 하나의 생각
2. **연결한다** — 폴더가 아니라 노트끼리
3. **자라난다** — 연결이 쌓이면 미처 몰랐던 생각이 떠올라요

자세한 내용은 [[wiki:제텔카스텐]] 문서에서. 노트 종류는 [[wiki:영구 노트]]와 [[wiki:임시 노트]]를 보세요.`

const KN4 = `# 영구 노트

영구 노트는 제텔카스텐의 완성품이에요. 승격 기준은 셋:

1. **혼자 선다** — 맥락 없이도 이해되나?
2. **원자적** — 하나의 생각만 담았나?
3. **연결됨** — 다른 노트 최소 하나와 이어지나?

가장 어려운 건 1번이에요. 제 [[wiki:임시 노트]]는 대부분 맥락에 기대고 있어서 다듬어야 하죠.

→ 정의는 [[wiki:영구 노트]] 참고.`

const KN5 = `지금 막 떠올라 적은 날것의 메모예요. 영구적이지 않아요 — 나중에 [[wiki:영구 노트]]로 다듬을 원재료죠.

규칙 하나: **쌓아두지 말 것.** 하루이틀 안에 처리(승격 또는 삭제)하세요. Plot에선 '대기' 상태가 임시 노트 역할을 합니다.

→ [[wiki:임시 노트]]`

const KN6 = `# 제텔카스텐, 이렇게 씁니다

1. **빠르게 적는다** — 떠오르면 일단 '대기'로.
2. **내 말로 고친다** — 베끼지 말고 다시 써요. (= [[wiki:임시 노트]])
3. **잇는다** — \`[[제목]]\`으로 관련 노트·위키에 연결.
4. **키운다** — 잘 연결된 노트가 쌓이면 위키 문서로 승격.

→ 왜 연결이 중요한지는 [[지식의 복리]]를 보세요.`

const KN7 = `# 지식의 복리

복리처럼 불어나요. 노트가 10개일 땐 이을 게 별로 없지만, 100개가 되면 새 노트 하나가 기존 여러 개와 맞물립니다.

→ 작을 때 효과가 작아도, 꾸준히 쌓는 게 핵심이에요.
→ [[wiki:제텔카스텐]]의 가장 강력한 통찰이죠.`

const KN8 = `빠른 메모: 나중에 정리 — 태그 잘 쓰는 법, 폴더 vs 태그 차이, 주간 리뷰 루틴 만들기`

export const KO_SEED_NOTES: Note[] = [
  mkNote({ id: "kn-1", title: "Plot 사용법", content: KN1, status: "done", priority: "high", pinned: true, tags: ["ktag-1"], reads: 6, ageH: 2, summary: "쓰고·잇고·본다 — Plot 3단계", linksOut: ["제텔카스텐", "정리 도구 한눈에"] }),
  mkNote({ id: "kn-2", title: "정리 도구 한눈에", content: KN2, status: "done", priority: "high", tags: ["ktag-1"], reads: 4, ageH: 3, summary: "폴더·태그·라벨·스티커·카테고리·우선순위·상태 언제 쓸까", linksOut: [] }),
  mkNote({ id: "kn-3", title: "제텔카스텐이란?", content: KN3, status: "done", priority: "medium", tags: ["ktag-2", "ktag-1"], labelId: "klabel-1", reads: 5, ageH: 5, summary: "루만의 쪽지 상자 — 핵심 원칙 3", linksOut: ["제텔카스텐", "영구 노트", "임시 노트"] }),
  mkNote({ id: "kn-4", title: "영구 노트 만들기", content: KN4, status: "in_progress", priority: "medium", tags: ["ktag-2"], reads: 2, ageH: 8, summary: "노트를 영구 상태로 승격하는 기준", linksOut: ["임시 노트", "영구 노트"] }),
  mkNote({ id: "kn-5", title: "임시 노트", content: KN5, status: "backlog", priority: "low", tags: ["ktag-2"], folderIds: ["kfolder-2"], reads: 1, ageH: 10, summary: "날것의 메모 — 쌓아두지 말 것", linksOut: ["영구 노트", "임시 노트"] }),
  mkNote({ id: "kn-6", title: "제텔카스텐, 이렇게 씁니다", content: KN6, status: "in_progress", priority: "high", tags: ["ktag-2", "ktag-1"], folderIds: ["kfolder-1"], reads: 3, ageH: 6, summary: "쓰기→내 말로→연결→위키로 키우기", linksOut: ["임시 노트", "지식의 복리"] }),
  mkNote({ id: "kn-7", title: "지식의 복리", content: KN7, status: "done", priority: "low", tags: ["ktag-1"], reads: 4, ageH: 12, summary: "연결이 쌓일수록 복리로 불어나는 지식", linksOut: ["제텔카스텐"] }),
  mkNote({ id: "kn-8", title: "빠른 메모", content: KN8, status: "backlog", priority: "none", labelId: "klabel-3", folderIds: ["kfolder-2"], reads: 0, ageH: 1, summary: "정리 대기 중인 임시 메모", linksOut: [] }),
]

/* ── Wiki articles (Assembly model) ──────────────────── */

const _KO_WIKI_RAW: Omit<WikiArticle, "sectionIndex" | "status">[] = [
  {
    id: "kw-1",
    title: "제텔카스텐",
    aliases: ["쪽지 상자", "제텔카스텐 방법론", "Zettelkasten"],
    infobox: [
      { key: "창시자", value: "니클라스 루만" },
      { key: "어원", value: "Zettelkasten (독일어)" },
      { key: "뜻", value: "쪽지 상자(slip box)" },
      { key: "핵심 원리", value: "연결과 인덱싱" },
    ],
    blocks: [
      { id: bid(), type: "section", title: "개요", level: 2 },
      { id: bid(), type: "text", content: "제텔카스텐은 독일 사회학자 니클라스 루만이 고안한 지식관리 방법론이다. \"Zettelkasten\"은 독일어로 \"쪽지 상자\"를 뜻한다. 루만은 이 시스템으로 40년간 책 70권과 학술 논문 400편 이상을 써냈다." },
      { id: bid(), type: "section", title: "핵심 원리", level: 2 },
      { id: bid(), type: "section", title: "작게 쪼갠다", level: 3 },
      { id: bid(), type: "text", content: "한 노트엔 하나의 생각만 담는다. 이것을 영구 노트라고 부른다. 작을수록 다시 꺼내 쓰고 다른 노트와 잇기 쉽다." },
      { id: bid(), type: "section", title: "연결한다", level: 3 },
      { id: bid(), type: "text", content: "새 노트를 쓸 때마다 기존 노트와의 연결을 찾아 만든다. 이 링크가 쌓이면 미처 몰랐던 통찰이 떠오른다." },
      { id: bid(), type: "section", title: "인덱싱한다", level: 3 },
      { id: bid(), type: "text", content: "진입점이 되는 구조 노트를 만든다. Plot에선 위키 문서가 바로 이 역할 — 지금 보고 있는 이 문서처럼." },
      { id: bid(), type: "section", title: "Plot에서는", level: 2 },
      { id: bid(), type: "text", content: "제텔카스텐 개념이 Plot 기능에 이렇게 대응한다:\n\n• 쪽지 상자 → 노트 목록\n• 영구 노트 → '완성' 상태 노트\n• 색인 카드 → 위키 문서\n• 링크 → [[위키링크]]\n• 구조 노트 → 태그 + 폴더" },
      { id: bid(), type: "section", title: "더 보기", level: 2 },
      { id: bid(), type: "note-ref", noteId: "kn-3" },
    ],
    tags: ["ktag-2", "ktag-1"],
    categoryIds: ["kcat-1", "kcat-2"],
    folderIds: [],
    pinned: true,
    createdAt: daysAgoIso(2),
    updatedAt: daysAgoIso(1),
  },
  {
    id: "kw-2",
    title: "영구 노트",
    aliases: ["에버그린 노트", "Permanent Note"],
    infobox: [
      { key: "출처", value: "제텔카스텐 방법론" },
      { key: "다른 이름", value: "에버그린 노트" },
    ],
    blocks: [
      { id: bid(), type: "section", title: "정의", level: 2 },
      { id: bid(), type: "text", content: "영구 노트는 제텔카스텐의 최종 결과물이다. 임시 노트(빠른 메모)나 문헌 노트(독서 하이라이트)와 달리, 영구 노트는:\n\n1. 내 말로 쓰였고\n2. 원자적이며 — 하나의 생각만\n3. 맥락 없이도 이해되고\n4. 다른 노트와 연결되어 있다." },
      { id: bid(), type: "section", title: "특징", level: 2 },
      { id: bid(), type: "text", content: "영구 노트는 오래 남도록 만든다. 시간이 지나며 다시 보고, 다듬고, 연결한다. 목표는 양이 아니라 질 — 각 영구 노트가 뚜렷하고 단단한 하나의 통찰을 담아야 한다." },
      { id: bid(), type: "section", title: "실전", level: 2 },
      { id: bid(), type: "text", content: "Plot에서 노트 상태를 '완성'으로 바꾸면 그 노트가 영근 생각으로 다듬어졌다는 신호다. 이런 노트들이 위키 문서의 재료가 된다." },
      { id: bid(), type: "note-ref", noteId: "kn-4" },
    ],
    tags: ["ktag-2"],
    categoryIds: ["kcat-3"],
    folderIds: [],
    createdAt: daysAgoIso(1),
    updatedAt: daysAgoIso(1),
  },
  {
    id: "kw-3",
    title: "임시 노트",
    aliases: ["플리팅 노트", "Fleeting Note"],
    infobox: [],
    blocks: [
      { id: bid(), type: "section", title: "정의", level: 2 },
      { id: bid(), type: "text", content: "임시 노트는 순간을 포착한 빠르고 일시적인 메모다. 영구적이지 않다 — 나중에 영구 노트로 다듬을 원재료다." },
      { id: bid(), type: "section", title: "실전", level: 2 },
      { id: bid(), type: "text", content: "Plot의 '대기' 상태 노트가 임시 노트 역할을 한다. 정기적으로 검토해 '준비/완성'으로 승격하거나 버려야 한다. 핵심 습관은 쌓아두지 않는 것 — 하루이틀 안에 처리하자." },
      { id: bid(), type: "note-ref", noteId: "kn-5" },
    ],
    tags: ["ktag-2"],
    categoryIds: ["kcat-3"],
    folderIds: [],
    createdAt: hoursAgoIso(6),
    updatedAt: hoursAgoIso(6),
  },
  {
    id: "kw-4",
    title: "Plot 가이드",
    aliases: ["사용 가이드"],
    infobox: [
      { key: "종류", value: "사용 가이드" },
    ],
    blocks: [
      { id: bid(), type: "section", title: "노트와 상태", level: 2 },
      { id: bid(), type: "text", content: "모든 노트는 대기 → 준비 → 정리 중 → 완성의 4단계 상태를 지난다. 상태는 '얼마나 영글었나', 우선순위는 '얼마나 급한가'를 나타낸다 — 서로 다른 축이다." },
      { id: bid(), type: "section", title: "위키와 링크", level: 2 },
      { id: bid(), type: "text", content: "자주 쓰는 개념은 위키 문서로 키운다. 노트 안에서 [[제목]] 또는 [[wiki:제목]]으로 연결하면 백링크가 자동 생성된다." },
      { id: bid(), type: "section", title: "뷰와 필터", level: 2 },
      { id: bid(), type: "text", content: "리스트·보드·그리드·타임라인으로 같은 데이터를 다르게 본다. 필터로 좁힌 화면은 '저장된 뷰'로 남겨 다음에 그대로 복원한다." },
      { id: bid(), type: "section", title: "정리 도구", level: 2 },
      { id: bid(), type: "note-ref", noteId: "kn-2" },
    ],
    tags: ["ktag-1"],
    categoryIds: ["kcat-5"],
    folderIds: [],
    createdAt: daysAgoIso(1),
    updatedAt: hoursAgoIso(4),
  },
]

export const KO_SEED_WIKI_ARTICLES: WikiArticle[] = _KO_WIKI_RAW.map((a) => ({
  ...a,
  status: "done" as const,
  sectionIndex: buildSectionIndex(a.blocks),
}))

/* ── Books ───────────────────────────────────────────── */
export const KO_SEED_BOOKS: Book[] = [
  {
    id: "kb-1",
    title: "시작 가이드",
    description: "Plot을 처음 쓰는 사람을 위한 큐레이션.",
    color: null,
    items: [
      { kind: "note", id: "kbi-1-1", refId: "kn-1", order: "a0" },
      { kind: "note", id: "kbi-1-2", refId: "kn-2", order: "a1" },
      { kind: "chapter-heading", id: "kbi-1-h", title: "제텔카스텐", order: "a2" },
      { kind: "note", id: "kbi-1-3", refId: "kn-3", order: "a3" },
      { kind: "note", id: "kbi-1-4", refId: "kn-6", order: "a4" },
    ],
    pinned: true,
    smartSources: [],
    excludeIds: [],
    folderIds: [],
    createdAt: daysAgoIso(3),
    updatedAt: hoursAgoIso(2),
  },
  {
    id: "kb-2",
    title: "제텔카스텐 허브",
    description: "제텔카스텐 태그가 붙은 노트·위키를 자동으로 모아요.",
    color: null,
    items: [],
    smartSources: [{ kind: "tag", refId: "ktag-2" }],
    excludeIds: [],
    folderIds: [],
    createdAt: daysAgoIso(2),
    updatedAt: hoursAgoIso(8),
  },
]

/* ── Smart book presets ──────────────────────────────── */
const koSbpNow = new Date().toISOString()
export const KO_SEED_SMART_BOOK_PRESETS: SmartBookPreset[] = [
  {
    id: "ksbp-zettelkasten",
    name: "제텔카스텐 리더",
    description: "제텔카스텐 태그가 붙은 노트와 위키를 모아 읽어요.",
    sources: [{ kind: "tag", refId: "ktag-2" }],
    pinned: false,
    trashed: false,
    trashedAt: null,
    createdAt: koSbpNow,
    updatedAt: koSbpNow,
  },
  {
    id: "ksbp-projects",
    name: "프로젝트 워크스페이스",
    description: "프로젝트 폴더의 모든 노트를 자동 수집해요.",
    sources: [{ kind: "folder", refId: "kfolder-1" }],
    pinned: false,
    trashed: false,
    trashedAt: null,
    createdAt: koSbpNow,
    updatedAt: koSbpNow,
  },
]

/* ── Stickers (크로스 엔티티 자유 묶음 demo) ──────────── */
export const KO_SEED_STICKERS: Sticker[] = [
  {
    id: "ksticker-1",
    name: "지금 작업 중",
    color: "#f59e0b",
    members: [
      { kind: "note", id: "kn-6" },
      { kind: "note", id: "kn-4" },
      { kind: "wiki", id: "kw-3" },
    ],
    createdAt: hoursAgoIso(5),
  },
]
