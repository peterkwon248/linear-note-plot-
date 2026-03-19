# Plot Architecture Redesign v2

> **Date**: 2026-03-19
> **Participants**: 경훈 × Claude Chatbot (초안) × Claude Code (코드 검증 + 보완)
> **Status**: 확정 (구현 대기)

---

## 1. Navigation: Activity Bar + Contextual Sidebar

### 결정

하이브리드 방식: Activity Bar (항상 보임) + 컨텍스트 반응형 사이드바 + 상단 유틸리티 바.

### Activity Bar (40px, 세로, 왼쪽, 항상 보임)

**Tier 1 (상단) — 공간 네비게이션:**
| 아이콘 | 공간 | 라우트 |
|:------:|------|--------|
| 📥 | Inbox | `/inbox` (전용 triage 뷰) |
| 📝 | Notes | `/notes` (NotesTable) |
| 📖 | Wiki | `/wiki` (WikiView) |
| 🔗 | Ontology | `/ontology` (OntologyView) |

**Tier 2 (하단):**
| 아이콘 | 기능 |
|:------:|------|
| ⚙ | Settings |

Tier 1 선정 근거: 각각 완전히 다른 UI를 가진 독립 뷰. "노트 리스트의 필터된 뷰"가 아님.
아이콘 4개 제한: 6개 넘어가면 한눈에 스캔 불가. Linear/VS Code도 기본 4~5개.

### 상단 유틸리티 바 (가로, 최상단)

```
[<] [>]  [🔍 Search]  [+ New Note]
```

- Linear의 상단 바 구조 참조 (검색 아이콘 + 네비게이션 + 생성 버튼)
- Search 아이콘 클릭 → `/search` 풀페이지 SearchView
- Cmd+K → SearchDialog 모달 (커맨드 팔레트 + 빠른 검색)
- 둘 다 유지. 역할이 다름 (풀 검색 vs 빠른 커맨드)

### 사이드바 (컨텍스트 반응형, 접기 가능)

Activity Bar 선택에 따라 사이드바 내용이 변경:

**Notes 컨텍스트:**
```
All Notes
Capture        → /capture (기존 특화 페이지)
Permanent      → /permanent (기존 특화 페이지)
Pinned         → FilterBar preset
📁 Folders...
─────────
Tags           → /tags (Tier 3)
Labels         → /labels
Templates      → /templates
Insights       → /insights
```

**Wiki 컨텍스트:**
```
카테고리 목록
최근 위키 문서
```

**Ontology 컨텍스트:**
```
필터 옵션
```

**Inbox 컨텍스트:**
```
Triage 통계 / 진행률
```

### Inbox = 워크플로우 (필터가 아님)

Inbox는 "처리(processing)" 모드. 브라우징이 아님.
- Activity Bar Inbox → 전용 triage UI (NotesTable 기반 + 강화된 triage 헤더)
- NotesTable의 Inbox/Capture/Permanent 상태 탭 → 제거
- 상태 필터링은 FilterBar의 `status` 필터로 대체

### Capture/Permanent 페이지

기존 `capture/page.tsx`, `permanent/page.tsx` 그대로 유지 (always-mounted 아님).
접근: 사이드바 Notes 컨텍스트 + G-shortcut (gc, gm) + 브레드크럼 + Cmd+K.

---

## 2. Routing: 2-Level (activeSpace + activeRoute)

### 결정

`table-route.ts`에 `activeSpace` 추가. 기존 `setActiveRoute()` 하위호환 유지.

### 구조

```typescript
type ActivitySpace = "inbox" | "notes" | "wiki" | "ontology"

let _activeSpace: ActivitySpace = "notes"
let _activeRoute: string = "/notes"

function setActiveSpace(space: ActivitySpace) {
  _activeSpace = space
  _activeRoute = DEFAULT_ROUTES[space]
  notify()
}

function setActiveRoute(route: string) {
  _activeSpace = inferSpace(route)  // 자동 추론
  _activeRoute = route
  notify()
}

function inferSpace(route: string): ActivitySpace {
  if (route === "/inbox") return "inbox"
  if (route === "/wiki") return "wiki"
  if (route === "/ontology") return "ontology"
  return "notes"  // /notes, /tags, /labels, /templates, /insights, /capture, /permanent, /trash, /folder/*, /tag/*, /label/*
}
```

### 라우트 재분류

```typescript
TABLE_VIEW_ROUTES = ["/notes", "/trash"]           // 브라우징 뷰 (always-mounted)
WORKFLOW_ROUTES   = ["/inbox", "/capture", "/permanent"]  // 워크플로우 뷰
VIEW_ROUTES       = ["/tags", "/labels", "/templates", "/ontology", "/insights", "/wiki", "/search"]
```

### 하위호환

`setActiveRoute()`를 호출하는 모든 곳 (search-dialog, use-global-shortcuts, notes-table, view-header 등)은 변경 불필요. 내부에서 `inferSpace()`가 자동으로 space를 추론.

---

## 3. Layout: WorkspaceMode 3개로 수렴

### 결정

LayoutMode 6개 삭제. WorkspaceMode 3개로 교체. Workspace Tree가 유일한 레이아웃 진실.

### 삭제되는 것

```
type LayoutMode = "list" | "focus" | "three-column" | "tabs" | "panels" | "split"  // 삭제
type WorkspacePreset = "focus" | "list-editor" | "editor-only" | "dual-editor" | "research"  // 3개로 축소
function layoutModeToPreset()  // 삭제
```

### 새 모델

```typescript
type WorkspaceMode = "default" | "zen" | "research"
```

| 모드 | 동작 | 진입 | 탈출 |
|------|------|------|------|
| **default** | 트리가 곧 레이아웃. 자동 collapse/expand. | 앱 시작, Cmd+0, Esc | - |
| **zen** | 단일 에디터 강제. 사이드바 접힘. | Cmd+1 | Esc |
| **research** | 멀티패널 프리셋 적용. | Cmd+2 | Esc |

### default 모드 자동 동작

| 트리거 | 동작 |
|--------|------|
| 마지막 탭 닫힘 (note-list + editor 2패널 구성일 때) | editor leaf 제거 → note-list 풀와이드 |
| 노트 열기인데 editor leaf 없음 | note-list leaf 분할 → list(30%) + editor(70%) |
| 유저가 수동 split한 구성 | 건드리지 않음 (자동 collapse 안 함) |

### EmptyLeafLauncher (9가지 피커)

유지. research 모드 + 수동 split에서 사용.
default 모드에서는 자동 collapse로 empty 상태 자체가 드묾.

### ResearchPreset

6개 전부 유지. 줄일 근거 불충분.

---

## 4. Wiki: 자동 등재 + 병렬 라이프사이클

### 핵심 사상

```
Layer 1 — Raw Data:    노트, 태그, 라벨, 폴더, 템플릿
Layer 2 — Ontology:    관계, 분류 체계, co-occurrence (구조 엔진)
Layer 3 — Wiki:        표현 계층 (Layer 2를 읽기 좋게 렌더링)
Layer 4 — Insights:    패턴 발견 (Layer 2를 분석해서 보여줌)
```

위키는 소비자(consumer). 모든 종류의 자료(노트/URL/이미지/텍스트)를 수집하고 정리.

### 데이터 모델

```typescript
interface Note {
  // 기존 유지
  isWiki: boolean
  aliases: string[]
  wikiInfobox: WikiInfoboxEntry[]

  // 신규 추가
  wikiStatus: "stub" | "draft" | "complete" | null
  // isWiki === false → null
  // isWiki === true → stub | draft | complete
}
```

### 병렬 라이프사이클

`status`(워크플로우)와 `wikiStatus`(위키 품질)는 독립적인 두 축:

```
노트 워크플로우:  inbox → capture → permanent   (처리 상태)
                    ↕        ↕        ↕
위키 품질 트랙:   stub  →  draft  → complete    (완성도)
```

어느 시점에서든 위키 트랙에 진입 가능. inbox 노트도 수동으로 위키 전환 가능.

### 자동 등재 신호 체계

| 우선순위 | 신호 | 처리 | status 제한 |
|:---:|------|------|:-----------:|
| 1 | Red link refCount >= 2 | 기존 노트 있으면 convert, 없으면 create stub | 없음 |
| 2 | 태그 3+ 노트에서 사용 | 같은 이름 노트 있으면 convert, 없으면 create stub | 없음 |
| 3 | Backlinks >= 3 | convertToWiki (기존 노트 승격) | capture 이상 |
| 4 | 공기어 상위 키워드 | 제안만 (자동 등재 안 함) | - |

**1~3 = 자동, 4 = 제안.**

자동 등재 시 기존 노트가 있으면 `convertToWiki()`, 없으면 `createWikiStub()`.
Red link는 stub로 자동 전환되면 소멸 (자기 조절 메커니즘).

### 자동 등재 트리거

배치 방식: 앱 시작 시 한 번 + 이후 10분마다 재실행.
매 저장마다 체크하지 않음 (성능).

### 예상 수량 (10K 노트 기준)

| 신호 | 예상 수량 |
|------|:--------:|
| Red links (refCount >= 2) | 20~50 |
| 태그 3+ | 30~100 |
| Backlinks >= 3 | 10~30 |
| **자동 등재 총합** | **60~180** |

### 위키 대시보드 필터링

```typescript
// 메인: draft + complete (깨끗한 위키)
const mainArticles = notes.filter(n => n.isWiki && n.wikiStatus !== "stub" && !n.trashed)

// 미완성: stub (자동 등재된 것 + 수동 생성된 빈 문서)
const stubs = notes.filter(n => n.isWiki && n.wikiStatus === "stub" && !n.trashed)

// 전체 목록: 초성 인덱스 + 가상 스크롤로 대량 표시 가능
```

### 성능 (10K+ 노트)

| 걱정 | 현실 | 해결 |
|------|------|------|
| 계산 느림? | 1~3ms, 문제없음 | - |
| 렌더링 느림? | 1,000+ 항목이면 가능 | `@tanstack/react-virtual` |
| 재계산 빈도? | 타이핑마다 useMemo 재계산 | Web Worker 분리 or 셀렉터 최적화 |
| 탐색 UX? | 수백 개 스크롤 힘듦 | 초성 인덱스 (ㄱ~ㅎ, A~Z) |

---

## 5. Search: 풀페이지 + 모달 공존

### 결정

Linear 스타일: 상단 유틸리티 바에 Search 아이콘 → 풀페이지 SearchView.
Cmd+K → SearchDialog 모달 (커맨드 팔레트).

| 진입점 | 동작 | 용도 |
|--------|------|------|
| 상단 🔍 아이콘 | `/search` 풀페이지 이동 | 심층 검색 (탭별, 필터, red link 생성) |
| Cmd+K | SearchDialog 모달 | 빠른 검색 + 커맨드 실행 |

### SearchDialog 최종 형태

```
- commands 모드: 네비게이션, 생성, 시스템 커맨드
- links 모드: [[ 프리픽스로 노트 검색 (위키링크 삽입용)
- search 모드: 삭제 → "See all results" 링크로 /search에 위임
```

Activity Bar에 Search 아이콘 없음. Search는 "공간"이 아니라 "도구."

---

## 6. Breadcrumb: NoteEditor Back 버튼 교체

### 결정

ViewHeader는 유지. NoteEditor의 "← Back" 버튼만 브레드크럼으로 교체.

### 형태

```
현재: [← Back]  PER 분석법              [📌] [⋯] [읽기/편집] [Details]
변경: [Notes > Projects > PER 분석법]   [📌] [⋯] [읽기/편집] [Details]
```

### 맥락별 브레드크럼

| 진입 경로 | 브레드크럼 |
|----------|----------|
| Notes → 노트 클릭 | `Notes > PER 분석법` |
| Folder → 노트 클릭 | `Notes > Projects > PER 분석법` |
| Wiki → 노트로 이동 | `Wiki > PER 분석법` |
| Ontology → 노트 열기 | `Ontology > PER 분석법` |
| 검색 → 결과 클릭 | `Search > PER 분석법` |

첫 번째 크럼 = `activeSpace`. 두 번째 = 폴더 (있으면). 마지막 = 노트 제목.

---

## 7. 기타 확정 사항

### LLM/API 사용 안 함

온톨로지 시스템 전체가 앱 내에서만 작동. 규칙 기반 + 통계 기반 + 그래프 알고리즘.

### New Note = 액션 (상태 아님)

Editor는 항상 noteId를 가짐. New Note 버튼 → `createNote()` → noteId 생성 → `{ type: "editor", noteId }`.
noteId 없는 빈 상태는 `{ type: "empty" }`.

### Insights = 건강검진 (주간/월간)

매일 여는 뷰가 아님. 문제 감지 → 구체적 액션 제안. 핵심 넛지는 에디터 Context Panel로 흘려보냄.

### Ontology = 엔진 (뷰가 아님)

독립 뷰(그래프)는 유지하되, 본질은 데이터 레이어. Wiki, Insights, Context Panel이 Ontology 엔진의 데이터를 소비.

---

## 8. Store Migrations

### v41: wikiStatus

```typescript
if (version < 41) {
  for (const note of state.notes) {
    if (note.isWiki) {
      note.wikiStatus = note.content?.trim() ? "draft" : "stub"
    } else {
      note.wikiStatus = null
    }
  }
}
```

### v42: workspaceMode

```typescript
if (version < 42) {
  const old = state.layoutMode
  state.workspaceMode = old === "focus" ? "zen" : old === "split" ? "research" : "default"
  state._savedTree = null
  delete state.layoutMode
  delete state._preFocusLayoutMode
}
```

---

## 9. Implementation Phases

### 의존성 그래프

```
Phase 1 (Foundation: store + routing)
  ├── Phase 2 (Layout Automation)
  ├── Phase 3 (Activity Bar + Top Utility Bar)
  │     ├── Phase 4 (Sidebar Refactor)
  │     └── Phase 5 (Breadcrumb)
  └── Phase 6 (Wiki Evolution)
        └── Phase 7 (Wiki Collection)
```

### Phase 1: Foundation

**변경**: v41 마이그레이션 (wikiStatus), v42 마이그레이션 (workspaceMode), table-route.ts (activeSpace + inferSpace)
**위험도**: 낮음 — 데이터만 준비, UI 변경 없음
**파일**: `store/types.ts`, `store/migrate.ts`, `table-route.ts`, `slices/ui.ts`

### Phase 2: Layout Automation

**변경**: setWorkspaceMode() 구현, default 모드 auto-collapse, Cmd+0/1/2 리매핑, layoutModeToPreset() 삭제, LayoutModeSwitcher 단순화
**위험도**: 중간 — 10+ 파일 수정
**파일**: `slices/ui.ts`, `use-global-shortcuts.ts`, `layout-mode-switcher.tsx`, `workspace/presets.ts`, `notes-table.tsx`, `note-editor.tsx`

### Phase 3: Activity Bar + Top Utility Bar

**변경**: activity-bar.tsx 신규, top-utility-bar.tsx 신규, layout.tsx 마운트
**위험도**: 낮음 — 추가만, 기존 코드 안 깨짐 (사이드바와 공존)
**파일**: `activity-bar.tsx` (신규), `top-utility-bar.tsx` (신규), `layout.tsx`

### Phase 4: Sidebar Refactor

**변경**: linear-sidebar.tsx 분리 (744줄 → ~400줄), 컨텍스트 반응형, Tier 3 섹션, NotesTable 상태 탭 제거
**위험도**: 중간 — 사이드바 리팩터 + 탭 제거
**파일**: `linear-sidebar.tsx`, `notes-table.tsx`

### Phase 5: Breadcrumb

**변경**: editor-breadcrumb.tsx 신규, note-editor.tsx의 Back 버튼 교체
**위험도**: 낮음 — ~50줄 컴포넌트
**파일**: `editor-breadcrumb.tsx` (신규), `note-editor.tsx`

### Phase 6: Wiki Evolution

**변경**: 자동 등재 엔진 (red link/태그/backlink 기반), wikiStatus 라이프사이클 UI, Suggested Articles 카드, 수동 전환 (any status), 초성 인덱스
**위험도**: 중간 — 새 엔진, 기존 코드 기반 확장
**파일**: `wiki-view.tsx`, `slices/notes.ts`, 자동 등재 유틸 (신규)

### Phase 7: Wiki Collection System

**변경**: wiki-collection-design.md Phase A~F 전체 구현
**위험도**: 높음 — TipTap 커스텀 노드, 새 슬라이스, 복잡한 UI
**파일**: `wiki-view.tsx`, 새 슬라이스, TipTap 확장 (WikiQuote), 에디터 Collect 사이드바

### 추천 실행 순서

**1 → 2 → 3 → 4 → 5** (인프라 먼저), **6은 아무 때나** 끼워넣기 가능.
Phase 3 (Activity Bar)이 가장 임팩트 큼 — 앱 인상이 확 바뀜.

---

## 10. 보류 항목

| 항목 | 상태 | 비고 |
|------|------|------|
| Note 타입 sub-object 분리 | 보류 | 방향 동의, 시기 미정 |
| Ontology 그래프 뷰 구체 강화 | 열림 | 엔진 역할 확정 후 |
| Insights 넛지의 에디터 연결 | 열림 | Context Panel 설계와 같이 |
| Phase 4-D: Context Panel | 열림 | 별도 설계 필요 |
| Phosphor Icons | 보류 | |
| WIKI 초성 검색 | Phase 6에 포함 | |
| Settings always-mounted | 보류 | |
| 커스텀 뷰 시스템 | 보류 | Phase 4 이후 검토 |

---

## 참조 문서

- `docs/wiki-collection-design.md` — 위키 수집함 상세 설계
- `docs/sidebar-wiki-redesign.md` — 사이드바/위키 브레인스토밍
- `docs/WIKI-REDESIGN-INSTRUCTIONS.md` — 위키 리디자인 실행 지시문 (Phase 1-3 완료)
- `docs/CONTEXT.md` — 현재 프로젝트 상태
- `docs/MEMORY.md` — 전체 PR 히스토리 + 아키텍처 상세
