# Plot — Project Context (Git-Synced)

> This file is synced via git so all machines share the same context.
> before-work reads this file. Update it whenever major decisions change.

## Identity

Plot = 노트 + 개인 위키 + 지식 관계망
- 겉은 Apple Notes, 속은 Zettelkasten
- 유저는 노트만 쓰고 앱이 알아서 제텔카스텐
- 사상: 팔란티어 × 제텔카스텐 — 개인 지식을 디지털 모델로 만들고 분석/사고/글쓰기를 돕는다

## Architecture Redesign v2 — ALL PHASES COMPLETE ✅

### 4-Layer Architecture

```
Layer 1 — Raw Data:    노트, 태그, 라벨, 폴더, 템플릿
Layer 2 — Ontology:    관계, 분류, co-occurrence (엔진)
Layer 3 — Wiki:        표현 계층 (정리된 참고자료)
Layer 4 — Insights:    패턴 발견 (건강검진)
```

### 구현 Phase (전부 완료)

1. Foundation (v41 wikiStatus, v42 workspaceMode, activeSpace) ✅
2. Layout Automation (WorkspaceMode, auto-collapse) ✅
3. Activity Bar + Top Utility Bar ✅
4. Sidebar Refactor (컨텍스트 반응형) ✅
5. Breadcrumb ✅
6. Wiki Evolution (자동 등재, 초성 인덱스, 목업 매칭) ✅
7. Wiki Collection (Collection slice v43, WikiQuote, Extract as Note, Collection sidebar, Red Links) ✅

## Current Architecture (현재 코드 기준)

### Store
- Zustand + persist (IDB storage via `lib/idb-storage.ts`)
- Slices (20): notes, workflow, folders, tags, labels, thread, maps, relations, ui, autopilot, templates, editor, workspace, attachments, ontology, reflections, wiki-collections, saved-views, wiki-articles, wiki-categories
- Store version: 64
- Types: `lib/store/types.ts`, `lib/types.ts`

### View System
- Always-mounted views via `lib/table-route.ts` + `app/(app)/layout.tsx`
- Mount-once keep-alive pattern (CSS display toggle)
- Responsive NotesTable: ONE grid for all sizes (ResizeObserver + minWidth thresholds)

### Editor
- TipTap 3 editor — Shared config factory (`components/editor/core/shared-editor-config.ts`)
- 4-tier extension system: `base` | `note` | `wiki` | `template`
- Title 노드 통합: 제목과 본문이 하나의 TipTap 문서 (`components/editor/core/title-node.ts`)
- 25+ extensions (StarterKit, TaskList, Highlight, Link, Table, CodeBlockLowlight, Mathematics, SlashCommand, HashtagSuggestion, WikilinkSuggestion, WikilinkDecoration, WikiQuoteExtension, etc.)
- Toolbar: h-14 (56px) bar, w-10 (40px) buttons, Phosphor weight="light". 42 configurable items via Arrange Mode (dnd-kit). Persisted in settings store
- Workspace: Simplified dual-pane (v52) — `selectedNoteId` (primary) + `secondaryNoteId` (right editor), react-resizable-panels
- WorkspaceMode 삭제됨 — sidebarCollapsed + detailsOpen 독립 토글
- Wiki-links: `[[title]]` extracted to `Note.linksOut`

### Knowledge System
- Backlinks: `lib/backlinks.ts` (incremental index, keyword/tag scoring, alias support)
- Search: FlexSearch worker-based (`lib/search/`) with IDB persistence
- Ontology Engine: co-occurrence engine, relation suggestions, wiki infobox, graph view
- Graph: `ontology-graph-canvas.tsx` — SVG 기반, Web Worker 레이아웃, viewport culling, LOD zoom, 노드 형태 분화, 3-tier 엣지

### Wiki Collection System (Phase 7)
- `WikiCollectionItem` type: note | url | image | text
- `wikiCollections: Record<string, WikiCollectionItem[]>` keyed by wikiNoteId
- Edit mode sidebar: Related (auto) + Collected (manual) + Red Links
- WikiQuote: TipTap custom node (atom, blockquote style with source attribution)
- Extract as Note: bubble menu button, creates note + replaces with [[link]]
- Link insertion: click Related/Collected → insert [[title]] at cursor
- Quote insertion: Shift+click → insert WikiQuote block

### Note Lifecycle (병렬 트랙)

```
노트 워크플로우:  inbox → capture → permanent   (처리 상태)
                    ↕        ↕        ↕         (어느 시점에서든 진입 가능)
위키 품질 트랙:   red link → stub → article     (완성도, WikiArticle 별도 엔티티)
```

### Labels vs Tags
- Labels → 노트 타입 (무엇인가): 메모, 리서치, 아이디어
- Tags → 노트 주제 (무엇에 관한 것인가): #투자 #사주 #독서

## Completed Features (최근 5개, 전체는 docs/MEMORY.md 참조)
67. Board UX 개선 — Trash→Tools, 드래그 선택, 그룹핑 컬럼 숨김, Tags 폐기, 필터 Status shape 아이콘, Mixed status 표시
68. Phase 7 즉시 개선 — StatusDropdown 추가, Trash 버튼 독립 배치, Priority 필터 제거
69. 에디터 통합 프로젝트 플랜 수립 — 7-Phase 계획
70. 에디터 Phase 1A+1B — Shared TipTap config 추출 (4-tier factory) + Title 노드 통합 (제목/본문 하나의 에디터)
71. Phase 1C+ — Toolbar 리디자인 (h-14/w-10/22px/light, 42 items) + Side Panel 4탭 (Detail/Connections/Activity/Peek) + Arrange Mode (dnd-kit)
72. Phase 1C+ 후속 — Connections Connected/Discover 모델, Relations UI 삭제, Peek wiki fallback, 브레드크럼/뱃지 폴리시

## Two Axes — Core Design Philosophy

```
Thread        → 깊이축  (지금 이 생각을 파고드는 실시간 전개)
Reflections   → 시간축  (시간이 지난 후 과거 노트를 회고)
```

> Relations(공간축)은 UI에서 삭제 — 백링크+위키링크+Discover 추천으로 충분. store slice는 유지.

## Key Design Decisions

- **LLM/API 사용 안 함** — 전부 규칙 기반 + 통계 기반 + 그래프 알고리즘. 오프라인, 프라이버시, 비용 0
- **Activity Bar 5-space**: Inbox / Notes / Wiki / Calendar / Graph
- **Wiki 사이드바 4-항목**: Overview / Merge / Split / Categories (+ Views 섹션). Categories = 2-panel 트리 에디터
- **Wiki Layout 프리셋**: `"default" | "encyclopedia"` — article별 전환. Encyclopedia = 나무위키식 (인라인 인포박스, 목차, 분류 태그)
- **Wiki URL 블록**: 유튜브 iframe embed + 일반 링크 카드. AddBlockButton에서 추가
- **WikiStatus 2단계**: stub(미완성) → article(완성). Red Link = computed (참조만 존재). draft/complete 제거 (v60)
- **위키 강등 = article→stub 1단계**: stub은 바닥(강등 없음, 삭제만)
- **Display = List/Board만**: Insights/Calendar는 사이드바/Activity Bar 전용
- **Graph Health → /graph-insights 페이지**: 사이드바는 필터/컨트롤 패널
- **필터/디스플레이 먼저, 사이드바 정리 나중에**: 기능이 동작해야 사이드바 의미 있음
- **Phase 4-D Context Panel 보류**: 각 공간별로 이미 컨텍스트 패널 존재
- **글로벌 탭 도입 안 함**: 멀티패널과 역할 충돌. 사이드바가 탭 역할 수행. Linear는 멀티패널이 없어서 탭 필요하지만 Plot은 사이드바+멀티패널로 커버
- **View = 사이드바 섹션**: Linear의 View(상단 탭 프리셋)를 사이드바 Views 섹션으로 구현. 한눈에 전체 구조 파악 가능, 액티비티별 독립
- **+ 버튼 = ViewHeader 우측**: top-utility-bar에서 제거, ViewHeader의 필터 아이콘 옆 `+` 아이콘으로 통일
- **위키 카테고리 = 계층적 트리**: 태그/라벨은 flat(동등), 카테고리만 parentId 기반 트리. 위키백과식 지식 분류 체계
- **카테고리 페이지 = 사이드바 최상위**: Overview/Merge/Split과 동급. List + Board 2모드
- **카테고리 List/Board 2모드**: Tree 모드 제거 완료. Board = Tier별 3칼럼(1st/2nd/3rd+), dnd-kit 드래그로 계층 이동
- **카테고리 Tier 네이밍**: depth 0=1st, depth 1=2nd, depth 2+=3rd+ (무한 depth 허용, Board에서 3rd+ 합침)
- **카테고리 우측 사이드바 3상태**: 미선택=All Overview, 단일선택=Category Detail, 멀티선택=Batch Actions
- **Family 그룹핑**: 같은 루트 조상 아래 전체를 묶고 들여쓰기로 depth 표현 (리스트+트리 하이브리드)
- **캘린더 플로팅 액션바 삭제**: 불필요하다고 판단 (2026-03-25)
- **TopUtilityBar 제거**: Back/Forward/Search를 사이드바 헤더로 이동. 44px 공간 확보 (2026-03-26)
- **사이드바 닫기/열기 = Plane식**: 닫으면 완전 숨김. ActivityBar 상단 열기 버튼. space 클릭으로 열리지 않음 (2026-03-26)
- **우측 사이드바 = Details 패널**: ViewDistributionPanel 삭제. 사이드바 버튼으로만 열림. previewNoteId로 리스트 행 클릭 시 내용 업데이트 (2026-03-26)
- **Priority UI 완전 삭제**: 디테일 패널에서도 제거. Pin + Labels로 충분 (2026-03-26)
- **sidePanelOpen persist 안 함**: 앱 시작 시 항상 닫힌 상태 (2026-03-26)
- **Relations UI 삭제**: 백링크+위키링크+Discover 추천으로 공간축 충분. store slice 유지, UI만 제거 (2026-03-28)
- **Connections = Connected+Discover 2섹션**: Connected(← inbound notes/wiki, → outbound notes/wiki, unlinked mentions) + Discover(추천 notes/wiki/tags). 방향 화살표로 직관적 구분 (2026-03-28)
- **Peek wiki fallback**: wiki article ID → title match → note lookup. 위키 블록 직접 편집은 Phase 2A 스코프 (2026-03-28)
- **카테고리 사이드바 → SmartSidePanel 통합**: 내장 280px 사이드바 제거, 글로벌 Details 패널에서 표시. Notes와 동일 패턴 (2026-03-26)
- **카테고리 더블클릭 에디터**: 싱글클릭=선택(하이라이트만), 더블클릭=폼 에디터 split view. 이름/설명 인라인 편집, Parent 드롭다운, 서브카테고리 +New/Move here (2026-03-26)

## TODO: Future Work (우선순위 순)

### P0 — 에디터 통합 프로젝트 (`.claude/plans/editor-unification.md` 참조)
- **Phase 1**: 노트 에디터 리디자인 — ~~Shared TipTap config~~ ✅ ~~Title 노드 통합~~ ✅ ~~FixedToolbar 리디자인~~ ✅ ~~Arrange Mode~~ ✅, 커스텀 노드 (Columns/TOC/Infobox/NoteEmbed)
- **Phase 2**: 위키 TextBlock TipTap 전환 — lazy mount (클릭 시만), Block body JSON 지원, Contents/Infobox 리사이즈
- **Phase 3**: 템플릿 블록 레이아웃 에디터 — TemplateBlock 모델, Notion-style 드래그 앤 드롭, Template→Note/Wiki 변환
- **Phase 4**: Partial Quote — Peek에서 부분 드래그 선택 Insert, 메타데이터 8필드 (sourceHash, context, comment 등)
- **Phase 5**: Merge/Split 풀페이지 — 노트 섹션/문단 단위 드래그 재배치, Split 플로팅바+우클릭 추가, 위키 Merge 개선
- **Phase 6**: Merge/Split 히스토리 — 필터 History 추가, Insights 이력 탭, Undo/Re-merge, Detail 패널 History 섹션

### P1 — 다음
- **커맨드 팔레트 확장** — 컨텍스트 반응형 20+개 커맨드 (Note Actions, View Actions, Navigation, Creation)
- **풀페이지 검색 분리** — ⌘K = 풀페이지 노트 검색, ⌘/ = 커맨드 팔레트 (액션 전용)

### P2 — 핵심 기능
- **사이드바 View 편집 버튼** — 닫기 버튼 왼쪽에 + 배치, 클릭시 View 편집 모드
- **사이드바 닫기 아이콘 변경** — chevron 제거, panel collapse 아이콘으로
- **View 시스템 v2** — 사이드바 Views에 필터+디스플레이+정렬 프리셋 저장. "Save as View"로 현재 상태 저장

### P3 — 구조/확장
- **Wiki 대시보드 반응형 모드** — Articles/Stubs/Red Links 카드 클릭시 콘텐츠 전환 (Linear All/Active/Backlog 패턴)
- **멀티패널 뷰 타입 확장** — Wiki/Calendar/Graph + 에디터 조합 스플릿 ("참조하면서 쓰기")

### P4 — 나중에
- J/K 리스트 네비게이션 (Linear식)
- 노트 가져오기/내보내기 (import/export)
- 그래프 사이드바 → 클러스터 + 인사이트 리워크
- 리스트 가상화 (react-window, 1만개 대응)

## Calendar 리디자인 설계 (확정)

### 정체성

Calendar = **Cross-Space 시간 대시보드**. Notes/Wiki/Graph 어디에도 속하지 않는 독립 공간.
"시간 축에서 내 지식 활동이 어떻게 분포되는가"를 보여주는 곳.

### 핵심 원칙

1. **모든 엔티티를 시간 축에 표시** — 노트뿐 아니라 위키, 태그, 라벨, 폴더, 관계, 템플릿 전부
2. **레이어 시스템으로 밀도 제어** — 자주 발생하는 이벤트는 기본 ON, 드문 이벤트는 기본 OFF
3. **기존 필터 인프라 재사용** — FilterPanel, DisplayPanel 그대로 적용
4. **Calendar는 Notes의 뷰 모드가 아님** — 독립 공간으로서 cross-space 통합 뷰

### Date Source

| 필드 | 의미 | "Calendar by" 선택 가능 |
|------|------|------------------------|
| createdAt | 생성일 | ✅ (기본) |
| updatedAt | 수정일 | ✅ |
| reviewAt | 리뷰 예정일 | ✅ |

### 레이어 (Display 토글)

| 레이어 | 기본값 | 이벤트 |
|--------|--------|--------|
| Notes | ☑ ON | 노트 생성/수정 |
| Wiki | ☑ ON | 위키 문서 생성/수정/상태변경 |
| Reminders | ☑ ON | snoozed 노트 reviewAt |
| Relations | ☐ OFF | 관계 생성 |
| Tags/Labels/Folders | ☐ OFF | 태그·라벨·폴더 생성 |
| Templates | ☐ OFF | 템플릿 생성 |

### Display Modes (캘린더 내)

| 모드 | 용도 |
|------|------|
| Month | 전체 흐름 파악 (기본) |
| Week | 주간 디테일 |
| Agenda | 날짜별 그룹된 리스트 (텍스트 밀도 최고) |

**Timeline(Gantt) 뷰는 제외** — 노트는 "시점" 데이터이지 "기간" 데이터가 아님.

### Filter

기존 FilterPanel 재사용:
- Status (inbox/capture/permanent)
- Tags, Labels, Folders
- Space (Notes만 / Wiki만 / 전체)
- Date range

### 인터랙션

| 액션 | 동작 |
|------|------|
| 빈 날짜 + 클릭 | 해당 날짜로 노트 생성 |
| 아이템 클릭 | Side peek / 에디터 열기 |
| 날짜 숫자 클릭 | Week/Day 뷰로 드릴다운 |
| ← → 키 | 월/주 이동 |

### Calendar 사이드바

- 미니 캘린더 (월간, 날짜 점프)
- 오늘의 요약 (생성 N, 수정 N, 리뷰 N)
- Views 섹션 (Calendar 커스텀 뷰)
- Upcoming (다가오는 리마인더)

## 참조 문서

- `docs/MEMORY.md` — 전체 PR 히스토리 + 아키텍처 상세
- `docs/DESIGN-TOKENS.md` — 디자인 토큰 (색상/타이포/스페이싱/아이콘 규칙)
- `docs/DESIGN-AUDIT.md` — 전수 디자인 감사 결과 + 5-Phase Design Spine 실행 계획
