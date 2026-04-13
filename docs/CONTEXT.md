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
7. Wiki Collection (Collection slice v43, WikiQuote→WikiEmbed 대체, Extract as Note, Collection sidebar, Red Links) ✅
8. Split View + Library + Reference/Footnote system (v71) ✅

## Current Architecture (현재 코드 기준)

### Store
- Zustand + persist (IDB storage via `lib/idb-storage.ts`)
- Slices (22): notes, workflow, folders, tags, labels, thread, maps, relations, ui, autopilot, templates, editor, workspace, attachments, ontology, reflections, wiki-collections, saved-views, wiki-articles, wiki-categories, references, global-bookmarks
- Store version: 75
- Types: `lib/store/types.ts`, `lib/types.ts`

### View System
- Always-mounted views via `lib/table-route.ts` + `app/(app)/layout.tsx`
- Mount-once keep-alive pattern (CSS display toggle)
- Responsive NotesTable: ONE grid for all sizes (ResizeObserver + minWidth thresholds)
- 6 Activity Spaces: Inbox / Notes / Wiki / Calendar / Graph / Library
  - Library: 서브라우트 4개 (`/library`, `/library/references`, `/library/tags`, `/library/files`), 사이드바 NavLink (Overview/References/Tags/Files)

### Editor
- TipTap 3 editor — Shared config factory (`components/editor/core/shared-editor-config.ts`)
- 4-tier extension system: `base` | `note` | `wiki` | `template`
- Title 노드 통합: 제목과 본문이 하나의 TipTap 문서 (`components/editor/core/title-node.ts`)
- 25+ extensions (StarterKit, TaskList, Highlight, Link, Table, CodeBlockLowlight, Mathematics, SlashCommand, HashtagSuggestion, WikilinkSuggestion, WikilinkDecoration, FootnoteRefExtension, @mention (노트/위키/태그/날짜 통합), Floating TOC, Anchor/Bookmark, etc.)
- Toolbar: h-14 (56px) bar, w-10 (40px) buttons, Remix Icon (에디터 전용, `lib/editor/editor-icons.ts` barrel). 34 configurable items via Arrange Mode (dnd-kit). Persisted in settings store. More Actions: Pin+Favorites+서브패널
  - Indent Extension: `indent-extension.ts` — paragraph/heading indent 0-8단계 (24px/level, Notion 방식)
- Workspace: Simplified dual-pane (v52) — `selectedNoteId` (primary) + `secondaryNoteId` (right editor), react-resizable-panels
- WorkspaceMode 삭제됨 — sidebarCollapsed + detailsOpen 독립 토글
- Split View 시스템 (PR #172-173): PaneContext + route intercept 패턴. Primary/Secondary 독립 패널. SmartSidePanel primary/secondary 분리. 4-column flat layout (layout.tsx + WorkspaceEditorArea). secondarySpace URL state, secondary history navigation
- Wiki-links: `[[title]]` extracted to `Note.linksOut`
- Wiki tier = note tier와 동일한 인라인 제안: `[[` 위키링크, `@` 멘션(노트/위키/태그/날짜/레퍼런스), `#` 해시태그 (PR #182)
- Wiki 문서 레벨 각주: `WikiFootnotesSection` — 위키백과 스타일 하단 통합 목록. FootnoteRefExtension `addStorage({ footnoteStartOffset })` + 블록별 offset 전달로 문서 전체 연번 (PR #182)
- NoteHoverPreview: `layout.tsx` 글로벌 마운트 (노트+위키 모두 호버 프리뷰 동작) (PR #183)
- 공유 유틸: `lib/wiki-block-utils.ts` + `hooks/use-wiki-block-actions.ts` + `wiki-layout-toggle.tsx` (PR #182)

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

1. **PR #190 (WIP)**: Reference Usage + Note History + Wiki Activity 정리 + chevron 비활성 — 사이드패널 Usage 섹션, ActivityTimeline 연결, Wiki Stats 중복 제거, 접을 게 없을 때 비활성
1. **PR #189**: Expand/Collapse All + 위키 TOC 버그 + TextBlock 드래그 핸들 + 리사이즈 — 나무위키식 전체 접기/펼치기, TocBlockNode wiki 티어 등록, BlockDragOverlay 위키 통합, 4코너 리사이즈 + Store v75
2. **PR #188**: 노트 References 시스템 + fontSize cascade + 위키 텍스트 컴팩트
3. **PR #187**: 각주/Reference UX 개선 — read-only 가드, 위키 footnote 삽입 버그, 컴팩트 디자인
4. **PR #185**: 각주 모달 + WikiReferencesSection + footnote 티어
5. **PR #182-183**: 위키 각주 시스템 (위키백과 스타일) + 공유 유틸 + 호버 프리뷰 글로벌

## Two Axes — Core Design Philosophy

```
Thread        → 깊이축  (지금 이 생각을 파고드는 실시간 전개)
Reflections   → 시간축  (시간이 지난 후 과거 노트를 회고)
```

> Relations(공간축)은 UI에서 삭제 — 백링크+위키링크+Discover 추천으로 충분. store slice는 유지.

## Key Design Decisions

- **LLM/API 사용 안 함** — 전부 규칙 기반 + 통계 기반 + 그래프 알고리즘. 오프라인, 프라이버시, 비용 0
- **독립 공간 구조 유지, 노션식 통합 템플릿 폐기** — 5개 공간이 각각 최적화된 UX 제공. "유저는 노트만 쓰고 앱이 알아서" = IKEA 전략. 노션식 "빈 캔버스 + 블록 조합" 방향 포기 (2026-04-01)
- **Activity Bar 6-space**: Inbox / Notes / Wiki / Calendar / Graph / Library — Library 6번째 공간 추가 (PR #165, 2026-04-08)
- **Wiki 사이드바 4-항목**: Overview / Merge / Split / Categories (+ Views 섹션). Categories = 2-panel 트리 에디터
- **Wiki Layout 프리셋**: `"default" | "encyclopedia"` — article별 전환. Encyclopedia = 나무위키식 (인라인 인포박스, 목차, 분류 태그)
- **Wiki URL 블록**: 유튜브 iframe embed + 일반 링크 카드. AddBlockButton에서 추가
- **WikiStatus 삭제**: stub/article 구분 폐지 (v67). 위키 문서는 존재하거나 Red Link(computed)만 (2026-03-31)
- **isWiki→noteType**: `Note.isWiki: boolean` 삭제 → `noteType: "note" | "wiki"` 디스크리미네이터 (v66, 2026-03-31)
- **Home = Knowledge Intelligence Panel**: Inbox 독립 공간 폐지 → Home 대시보드. 사이드바에 Unlinked Mentions/Suggestions/Orphans/Knowledge Health 실시간 지식 인텔리전스. 사이드바 클릭 → 메인 영역 드릴다운 (Linear 패턴) (2026-03-31)
- **Ontology 네이밍**: Activity Bar "Graph" → "Ontology". 사이드바 Graph 아이콘 → ChartBar (2026-03-31)
- **Wiki Coverage→Uncategorized**: 대시보드 3번째 지표. Coverage(모호) 제거 → Uncategorized(카테고리 없는 문서 수) (2026-03-31)
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
- **Side Panel = Unified SmartSidePanel**: 4-tab: Detail + Connections(Connected/Discover) + Activity(Thread/Reflection) + Bookmarks. Peek as fallback. Relations UI 삭제. primary/secondary 독립 패널 (PR #173)
- **Split View = PaneContext + route intercept**: 4-column flat layout (layout.tsx + WorkspaceEditorArea). secondarySpace URL state. secondary history navigation. SmartSidePanel primary/secondary 분리 (PR #172-173)
- **카테고리 사이드바 → SmartSidePanel 통합**: 내장 280px 사이드바 제거, 글로벌 Details 패널에서 표시. Notes와 동일 패턴 (2026-03-26)
- **카테고리 더블클릭 에디터**: 싱글클릭=선택(하이라이트만), 더블클릭=폼 에디터 split view. 이름/설명 인라인 편집, Parent 드롭다운, 서브카테고리 +New/Move here (2026-03-26)
- **노트 ≠ 위키**: Note와 WikiArticle은 완전 별도 엔티티. isWiki→noteType 리팩토링 완료 (2026-03-31)
- **Stub 부활 (heuristic 방식)**: 상태 필드 없이 블록 수 + 내용 비어있음으로 판정. 기본 템플릿(Overview/Details/See Also) 에서 변경 없으면 stub. 블록/내용 추가 → article 자동 승격 (2026-04-05)
- **[[드롭다운 Create Note + Create Wiki**: 노트는 inbox에 생성, 위키는 빈 WikiArticle(stub) 생성. 위키 아이콘 = IconWiki (액티비티바 통일) (2026-04-05)
- **Auto Create 방향 결정 (미구현)**: Red Link → "Unresolved Links"로 개념 전환. 빨간색→회색 점선, 클릭 시 노트/위키 선택 팝업. Wiki에서 Red Links 제거 → Home "Unresolved Links"로 통합 (2026-04-05)
- **인사이트 중앙 허브 방향 결정 (미구현)**: 온톨로지 = 모든 인사이트의 원천 (Single Source of Insights). Notes/Wiki 각 공간 인사이트는 온톨로지에서 파생. 세이브매트릭스급 지표 (Knowledge WAR, Link Density, Stub Conversion Rate 등) (2026-04-05)
- **@멘션 = 노트/위키/태그/날짜 통합**: `@` 트리거, WikiArticle 별도 검색, 카테고리별 그룹핑 (2026-03-30)
- **플로팅 TOC = Notion 스타일**: 에디터 우측 자동 사이드바, 대시 인디케이터, hover 확장, scrollspy. 첫 heading(타이틀) 제외 (2026-03-30)
- **앵커/북마크 2종**: 인라인 마커(anchorMark) + 블록 구분선(anchorDivider). TOC + 사이드패널 Bookmarks 탭 통합 (2026-03-30)
- **Columns = CSS Grid + 테이블 스타일 border**: renderHTML 기반 columnCell, resize handle, 외곽선+셀간 border-right (2026-03-30)
- **Make Block 폐기**: Turn Into가 대체. 래퍼로 감싸는 UX가 직관적이지 않음 (2026-03-30)
- **디자인 폴리싱 방향 = Notion**: Linear 레이아웃 + Notion 에디터 블록 디자인 참고 (2026-03-30)
- **TOC = 수동 + 블록피커**: 자동 헤딩 수집 제거. + 버튼 = 문서 내 모든 블록 검색 피커, 1클릭으로 항목+링크 생성. 더블클릭 편집, 드래그 순서변경, Tab 들여쓰기 (2026-04-01)
- **Merge Blocks**: 멀티 선택 → hardBreak로 하나의 paragraph 병합 (Make Block 대체). Wrap in(Callout/Summary/Block) 별도 유지 (2026-04-01)
- **Toggle = 노션식 (배경 없음)**: border/background 제거. ▶+텍스트 flex 한 줄. 접힌 내용은 left-border 들여쓰기 (2026-04-01)
- **Side-drop 컬럼 자동생성 제거**: 드래그로 columns 안 만들어짐. Insert 메뉴로만 생성 (2026-04-01)
- **인포박스 읽기모드**: readOnly + 삭제/추가 버튼 숨김. Add row = hover-only (2026-04-01)
- **Memo 라벨 자동 부여**: 노트 생성 시 labelId 없으면 "Memo" 라벨 자동 할당. 없으면 자동 생성. 기존 노트도 rehydrate 시 backfill (2026-04-01)
- **Delete Block 우클릭 메뉴**: 모든 블록에 적용. details/columns 같은 compound 블록은 skipTypes로 올바른 depth 탐색 (2026-04-01)
- **드래그 핸들 블록 메뉴**: ⠿ 짧게 클릭=메뉴(Turn Into/Insert Below/Duplicate/Move/Delete), 누르고 5px 이동=드래그. pointerUp + pointerEvents 전환 (2026-04-01)
- **Embed Note = 노트 피커**: Insert→Embed Note 클릭 시 NotePickerDialog 열림. 선택한 noteId로 미리보기 카드 삽입. Synced Block(본문 편집)은 Phase 2+ (2026-04-01)
- **WikiQuote 폐기**: WikiEmbed가 상위 대체. 호버 프리뷰 Quote 버튼 + insert-wiki-quote 이벤트 + WikiQuoteExtension/Node 전부 삭제 (2026-04-06)
- **Footnote = "에디터 접점", Reference = "저장소"**: `/footnote` 슬래시 커맨드, `[[`/`@` 드롭다운 모두에서 각주 생성/참조 가능. 유저는 Footnote만 알면 됨, Reference는 뒤에서 자동 생성 (2026-04-06)
- **에디터 아이콘 = Remix Icon**: Phosphor light → Remix. 에디터 전용, 나머지 앱 UI는 Phosphor 유지. `lib/editor/editor-icons.ts` 중앙 barrel 101매핑 (2026-04-07)
- **Indent = margin-left 레벨**: blockquote 감쌈 폐기 → 24px 단위 8단계 (Notion 방식). `indent-extension.ts` (2026-04-07)
- **More Actions = 풀 기능 허브**: Pin 고정, 우클릭 Favorites (persist), 서브패널 (컬러피커/테이블/이미지). 에디터 모든 기능 접근 가능 (2026-04-07)
- **Embed Note 기본 Synced**: 삽입 시 전체 내용 인라인 표시. Preview 카드는 토글로 전환 (2026-04-07)
- **WikiEmbed 높이 무제한**: max-h 제거, 위키 문서 전체 펼침. 리사이즈 시 스크롤 (2026-04-07)
- **Math 툴바 기본 hidden**: SlashCommand로 접근. Arrange Mode에서 복원 가능 (2026-04-07)
- **Reference = 인포박스식 자유 키-값**: `fields: Array<{key,value}>`. Type 없음 — 앱이 content에서 URL/연도 자동 감지. Quick Note(fields 비면)→Full Reference(fields 있음) heuristic (2026-04-06)
- **Library = References + Tags(글로벌) + Files**: 6번째 Activity Bar 공간. Labels는 노트 전용 유지, Tags만 글로벌 승격 (2026-04-06)
- **Library 사이드바 NavLink**: 상단 탭 제거 → 사이드바 NavLink (Overview/References/Tags/Files). Wiki 패턴 동일 (2026-04-07)
- **Reference 디테일 = SmartSidePanel**: 별도 풀페이지 에디터 없음. Title/Content/Fields 사이드패널 편집 (2026-04-07)
- **Reference에 Tags 없음**: fields(key-value)가 메타데이터 역할. Tags는 노트/위키 전용 (2026-04-07)
- **각주→Reference 자동 연결**: footnote save 시 referenceId 없으면 자동 createReference. content 양방향 동기화 (2026-04-07)
- **각주 타임라인**: createdAt 자동 기록 + Reference.history로 수정 이력 (2026-04-06)
- **Tags Library 통합**: Notes "More"에서 Tags 제거, `/library/tags`로 통합. Capacities 패턴 (2026-04-08)
- **References/Files soft delete**: trashed/trashedAt 필드, 복원 가능. Store v71 (2026-04-08)
- **Reference = 통합 참고자료 (옵션3 하이브리드)**: url 필드 있으면 Link형, 없으면 Citation형으로 자동 분기. 새 엔티티 없이 Reference 하나로 통합. 위키백과 철학 차용 — `[[]]`=내부링크, 각주=하단URL, referenceLink=외부링크(🔗 시각 구분). `[[`/`@` 드롭다운에서 url 있으면 referenceLink 노드, 없으면 footnoteRef 노드 자동 삽입. Shift+클릭=반대 모드. Quick Filter에 Links 추가 (2026-04-08)
- **위키 레이아웃 프리셋 = 공유 유틸 추출**: 1파일 통합 대신 순수 함수/훅/컴포넌트 추출 방식. 두 렌더러(Default/Encyclopedia)의 구조적 차이가 커서 통합 시 분기 20개+ 발생 (2026-04-12)
- **위키 문서 레벨 각주 = offset 방식**: 블록별 `footnoteStartOffset`으로 문서 전체 연번. `onFootnoteCount` 콜백으로 블록별 각주 개수 수집 → 누적 offset 계산 (2026-04-12)
- **EncyclopediaFooter 삭제**: 사이드바에서 이미 Sources/Properties 표시. 본문 중복 제거 (2026-04-12)
- **드롭다운 아이콘 색상 체계**: Wiki stub=#f59e0b(주황), article=#8b5cf6(보라). CircleDashed/CircleHalf/CheckCircle는 Phosphor 직접 import (Remix 매핑 부정확) (2026-04-12)
- **NoteHoverPreview 글로벌**: TipTapEditor에서 layout.tsx로 이동. 위키 텍스트 블록에서도 호버 프리뷰 동작 (2026-04-12)
- **위키 텍스트 블록 click-outside 가드**: `.tippy-content` + Radix Portal + `role=menu/dialog` 클릭은 "내부"로 인식 (2026-04-12)
- **FootnoteEditModal = Reference 모달 통합**: Title+Content+URL 3필드. 각주/레퍼런스 동일 UX. 인라인 미니 에디터 폐기 (atom node 포커스 충돌) (2026-04-12)
- **위키 하단 References 섹션**: Footnotes(번호) + References(불릿) 위키백과 2단 구조. WikiArticle.referenceIds로 문서↔Reference 직접 연결 (2026-04-12)
- **Reference 사이드패널 = Library 전용**: 위키에서는 모달로 편집 (사이드패널 context 고착 방지) (2026-04-12)
- **footnote 에디터 티어**: StarterKit 최소 + Link + Underline. 테이블/이미지/슬래시/멘션 제외 (2026-04-12)
- **각주 read-only 가드**: footnote-node.tsx + footnotes-footer.tsx — `editor.isEditable` 체크. 리드 모드에서 모달 안 열림 (2026-04-13)
- **위키 footnote 삽입 버그 수정**: footnote-edit-modal.tsx에 `role="dialog"` 추가. 위키 TextBlock click-outside 가드가 모달을 "외부"로 인식해 에디터 언마운트 → debounce 저장 실패하던 문제 해결 (2026-04-13)
- **위키 Footnotes/References 컴팩트 디자인**: TipTap EditorContent 제거 → 단순 텍스트. `▶ FOOTNOTES N` / `▶ REFERENCES N` 토글. text-base 헤더 + text-[14px] 내용 (2026-04-13)
- **노트 References 하단 섹션**: `footnotes-footer.tsx` NoteReferencesFooter 컴포넌트. 각주 referenceId 수집 → `▶ REFERENCES N` 불릿 목록. 기본 collapsed (2026-04-13)
- **Footnotes+References 분리 유지 (확정, 2026-04-13)**: 합치기 논의 후 번복. FOOTNOTES(번호 각주)와 REFERENCES(불릿 참고자료) 2개 섹션 분리. 라이브러리 References와 이름 같아도 OK (같은 엔티티, 다른 스코프)
- **노트 References 시스템 (2026-04-13)**: `Note.referenceIds: string[]` + Store v74. NoteReferencesFooter 모달(검색/생성/편집 3모드). Insert/`/reference`/하단 `+` 진입점. `[[`/`@`는 항상 FootnoteRef [N]만 (불릿은 인라인 삽입 도구에서 넣지 않음)
- **Reference 아이콘 = Book (RiBookLine)**: Bookmark(BookmarkSimple)/BookOpen/Article과 구분 (2026-04-13)
- **em 기반 fontSize cascade (2026-04-13)**: 위키 타이틀/섹션/각주의 rem/px Tailwind 클래스를 em으로 전환. 글로벌 Aa 스케일 + 섹션별 개별 fontScale 동시 동작. fontScale은 섹션 wrapper에 적용 (개별 heading X)
- **위키 텍스트 display 컴팩트 (2026-04-13)**: `.wiki-text-display` 클래스. ProseMirror min-height:unset + p margin:0. 편집→읽기 전환 시 간격 차이 해소
- **Expand/Collapse All = 나무위키 패턴 (2026-04-13)**: 노트 chevron 버튼(PushPin 왼쪽) + 위키 기존 버튼 확장. `plot:set-all-collapsed` CustomEvent 브로드캐스트. Details/Toggle + Summary + Footnotes + References 전부 대상. 노트: hasCollapsibles 조건부 표시, Details `open` attr 일괄 토글. 위키: 기존 섹션 접기 + 내부 collapsible + footer까지
- **위키 TOC 버그 수정 (2026-04-13)**: TocBlockNode + TableOfContents가 note 티어에만 등록되어있던 버그. wiki 티어에 추가 (`shared-editor-config.ts`)
- **위키 TextBlock 드래그 핸들 (2026-04-13)**: `WikiTextEditor`에 `BlockDragOverlay` 래핑. `pl-8` 좌측 패딩으로 핸들 거터 확보. 기존 note 에디터 패턴과 동일
- **위키 TextBlock 4코너 리사이즈 (2026-04-13)**: `WikiBlock.editorWidth/editorHeight` persist (Store v75). 편집 모드에서만 적용, 읽기 모드는 full width 유지. `block-resize-corner` CSS 재활용. 4코너(tl/tr/bl/br) 핸들. `⋯` 메뉴에 "Reset editor size" 버튼 (ArrowsIn)
- **Reference Usage 섹션 구현 (2026-04-14)**: `reference-detail-panel.tsx` Usage "Coming soon" → 실제 노트/위키 사용처 목록. `notes.filter(referenceIds.includes)` + `wikiArticles.filter`. 클릭 → openNote / navigateToWikiArticle
- **Note History 연결 (2026-04-14)**: `side-panel-activity.tsx` History placeholder → `ActivityTimeline` 컴포넌트 연결. noteEvents 기반 이벤트 타임라인 (25 이벤트 타입, 색상 도트 + verb + 상대시간)
- **Wiki Activity 정리 (2026-04-14)**: Article Stats 제거 (Detail Properties와 중복). "Thread & Reflections not available" 제거. "Wiki article history is not yet available" 간결 안내로 교체
- **Expand/Collapse All 항상 표시 (2026-04-14)**: `hasCollapsibles` 조건 제거 → 버튼 항상 렌더. 접을 게 없으면 disabled + 흐릿 (`text-muted-foreground/20`). Details 토글 = DOM 클릭 방식 (setNodeMarkup 대신). hasCollapsibles 체크: details/summary/footnoteRef/referenceIds

## TODO: Future Work (우선순위 순, 2026-04-14 sync)

### ✅ P0 — Split-First 마이그레이션 — ALL COMPLETE
### ✅ P0 — 노트 References + fontSize cascade — ALL COMPLETE
### ✅ P2 — Reference Usage — COMPLETE

### P2 — 인포박스 고도화 + 나무위키 리서치 기능 (나무위키 수준, base 티어 = 노트+위키 공용)
**Tier 1 — 인포박스:**
- **대표 이미지 + 캡션** — 인포박스 최상단
- **헤더 색상 테마** — 문서별 테마 컬러 배너
- **인포박스 접기/펼치기** — 긴 인포박스 축소
- **섹션 구분 행** — 정보 그루핑
- **필드 값 리치텍스트** — 링크, 이미지(국기 등) 지원
**Tier 2 — 새 블록 타입 (base 티어):**
- **배너 블록** — 배경색 + 제목 + 부제 (노트 Insert + 위키 TextBlock 공용)
- **둘러보기 틀 (Navigation Box)** — 관련 문서 그룹 박스 (접기 가능)
**Tier 3 — 유틸리티 매크로 (인라인):**
- **나이 계산** `[age(YYYY-MM-DD)]` — 만 나이 자동
- **D-Day** `[dday(날짜)]` — 남은 날 자동
- **Include** — 다른 문서 내용 현재 위치에 삽입
**Tier 4 — 고급:**
- **상위/하위 문서 관계** — 부모-자식 문서 계층
- **각주 이미지** — FootnoteEditModal 이미지 첨부
- **루비 텍스트** — 한자/일본어 읽기 표시
**아키텍처:**
- 모든 새 기능 = base 티어 (노트+위키 공용, shared-editor-config.ts)
- Insert 레지스트리 단일화 — insert-menu.tsx + SlashCommand.tsx + FixedToolbar.tsx 3곳 중복 → 단일 레지스트리

### P2 — 인사이트 허브
- **인사이트 허브** — 온톨로지 Single Source of Insights

### P3 — 사이드패널 + 뷰 확장
- **사이드패널 리디자인** — Connections 인라인 프리뷰 (Obsidian식)
- **동음이의어 해소 페이지** — 멀티 링크 매칭 시 선택 화면
- **커맨드 팔레트 확장** — 풀페이지 검색, 북마크 커맨드

### P4 — 지능 + 검색
- 요약 엔진, 풀페이지 검색 분리
- 웹 클리퍼, 가져오기/내보내기, View v2, 리스트 가상화

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
