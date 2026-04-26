---
session_date: "2026-04-26"
project: "linear-note-plot"
working_directory: "C:\\Users\\user\\Desktop\\linear-note-plot-\\.claude\\worktrees\\peaceful-saha-25d0cd"
duration_estimate: "긴 세션 — 약 9-10시간, 9 PR + 다수 핫픽스, 84개 파일 변경"
---

## Completed Work

### PR 1-3: 인포박스 / Navbox / 배너 (Store v83-v85)
- **PR 1 인포박스 type 11 프리셋**: custom/person/character/place/organization/work-film/work-book/work-music/work-game/event/concept. Group Header + 토글 + 색상 picker. 전체 wiki article에 적용.
- **PR 2 Navbox/Navigation 풀 디자인**: 다단 헤더 + 그룹 + 색상 + 1-6 col + 펼치기·접기 (Editorial-Imperial 스타일). Luminance 기반 contrast.
- **PR 3 배너 다채로움 4종**: 좌측 아이콘 8 + Compact·Default·Hero + stripe + gradient. Settings 통합 popover.

### PR 4: Connections 상세
- `extractBlockLinkContexts` walker (TipTap JSON 재귀, 4종 링크 + mention)
- `useBacklinksWithContext` 훅 (title-match 동기 + IDB 비동기)
- `BacklinkCard` (Obsidian 스타일)
- mention 노드 처리 추가 (4 케이스 [[]] / @ × 노트 / 위키)
- 위키 source contentJson scan 추가
- `outboundLinked`에 위키 article 매칭 추가 (이전 누락)

### PR 5: Discover mention + 위키 source + IDB 캐시 + hydration
- discover-engine에 mention 가중치
- `mention-index-store.ts` 신설 (IDB DB, O(1) 룩업)
- persistBody hook 자동 wiring
- `view-header.tsx` Popover hydration guard (`<ClientOnly>` 신규)

### PR 6: Ontology Insights 탭
- `lib/insights/types.ts` + `lib/insights/metrics.ts` 신규
- 새 메트릭 7종: Knowledge WAR / Concept Reach / Hubs / Link Density / Orphan Rate / Tag Coverage / Cluster Cohesion
- `OntologyTabBar` (Graph / Insights), 사이드바 Health 단일 source
- `OntologyNudgeSection` (Orphan / 위키 승격 후보 / Unlinked Mention 액션 카드)

### PR 7-8: Home 정체성 분리 + 디자인 iteration
**최종 구성** (사용자 다회 피드백 후):
- Quick Capture (max-w-2xl 가운데)
- StatsRow (5 카드 + 컬러: blue/violet/emerald/amber/rose, sub: Coverage/Stubs/Active/Unused/Size)
- RecentCards (4 카드, h-32, preview + meta)
- MixedQuicklinks (Note + Wiki + Folder + SavedView + Bookmark 통합 카드)
- "Improve your knowledge graph →" CTA → Ontology Insights
- max-w-5xl

**시도 후 롤백**: Linear 큰 리스트 / Plane 풀 미러 / Knowledge Nudge in Home

### Wiki article 핀 시스템 (NEW)
- `WikiArticle.pinned: boolean` (Store v87)
- `toggleWikiArticlePin` 액션
- 사이드패널 Pin 버튼 (PushPin 아이콘)
- Wiki dashboard PINNED 섹션 (Featured 다음)
- Home Quicklinks에 통합

### 핫픽스 v86-v91
- v86: wikiArticle.infobox undefined 백필
- v87: WikiArticle.pinned 백필
- v88: 모든 위키 article 강제 unpin (잘못 박힌 핀)
- v89-v91: noteType wiki notes + wikiArticles dedup (동일 title)
- `createWikiStub` dedupe 가드 (자동 등재 무한 누적 방지)
- Wiki view !trashed 필터 추가
- Slash description 영어 통일 / 루비 텍스트 완전 제거 / Inline Math NodeView 신규 / popover align="start" 통일

### Note Split (P2 must-todo)
- `lib/note-split-mode.ts` + `components/views/note-split-page.tsx`
- 진입점 3곳: 노트 에디터 ⋯ / 리스트 우클릭 / 플로팅 액션 바
- 글로벌 마운트 (`app/(app)/layout.tsx` NoteSplitOverlay)
- IDB hydration + 빈 컨텐츠 graceful 처리

### 나무위키 Tier 2-4
- Tier 2 배너 (PR 3)
- Tier 3a age + dday 매크로 (Popover NodeView, 영어 라벨 통일)
- Tier 3b Include — embed alias + 양방향 활성화 + cycle guard (`lib/embed-cycle.ts`)
- Tier 4a 각주 이미지 (Reference.imageUrl, Store v81)
- Tier 4b 루비 텍스트 — **완전 제거** (한국어 fit X 결정)
- Tier 4c 위키 parent-child article (`parentArticleId` + breadcrumb + Children + 사이클 가드)

### Y.Doc P0-1 (부분)
- y-indexeddb 영속화 + `whenReady` Promise + post-hydration `getIsFresh()`
- 4 race guard 유지
- 사이드 이슈: plot-note-bodies IDB v3 / StarterKit duplicate extensions

## In Progress

- 위키 dashboard top stat (Wiki Articles "3") vs 카드 그리드 갯수 불일치 가능성. 방금 wiki-view.tsx에서 `wikiArticles={wikiNotes}` 변경했지만 다음 reload에서 일관 표시 확인 필요. 만약 아직 다르면 wiki-dashboard.tsx의 articleCount 계산 추적 (현재 wikiNotes.length - stubCount) — articleCount와 wikiNotes.length 합치기 필요할 수도.

## Remaining Tasks

- [ ] **PR 9 시계열 메트릭 + Wiki Dashboard 통합** — Stub Conversion Rate / Knowledge Half-Life 같은 시간 기반 지표. 스냅샷 인프라 필요. Wiki Dashboard 통계 → Ontology에서 파생 표시.
- [ ] **TipTap InfoboxBlockNode group-header** — 노트 에디터의 인포박스 블록도 group-header 지원 (위키 article만 현재). 작은 폴리시.
- [ ] **P0-2 Wiki Y.Doc 적용** — `WikiEditorAdapter`에 `acquireYDoc("wiki", id)` 바인딩 + 4 race guard 동일 적용. 위험 작업.
- [ ] **위키 dashboard top stat 정합성 검증** — 다음 세션 시작 시 reload 후 wiki space에서 카운트 일관성 확인. 아직도 불일치면 articleCount 계산 fix.
- [ ] **위키 article pinned 보강 검토** — 노트도 사이드패널에서 동일 핀 토글 가능한지 (현재 note 핀은 다른 경로).

## Key Decisions

- **Home 정체성 분리**: 시간 기반 (Inbox/Today/Snooze) 제거, 데이터 대시보드 + 빠른 진입으로 단순화. 이유: 사용자 비전 "연결 집중", "Plot 정체성은 제텔카스텐". 시간 관리는 작업 관리 앱 영역.
- **Ontology = Single Source of Insights**: 정비 행동/메트릭/Nudge 모두 Ontology로 이전. Home은 매일 보는 본업, Ontology는 가끔 들어가는 분석 허브.
- **루비 텍스트 제거**: 한국어 사용자 fit X, 노트앱 표준 X (Notion/Bear/Capacities/Tana 모두 안 함). Plot 차별화에도 무관.
- **Plane 풀 미러 거부**: Greeting + Quicklinks + Stickies + Manage widgets 시도 후 "너무 많음" 롤백. Plot 정체성 핵심 (워크플로우 + 노트 + 위키)에 fit하는 부분만 채택 (StatsRow + Quicklinks 통합 카드).
- **WikiArticle.pinned 신설**: Note와 대칭. Pinned 통합 시스템 일관성. globalBookmarks block-level과 별개로 article 통째 핀 가능.
- **위키 카드 갯수 vs 사이드바 카운트**: 마이그레이션으로 dedup 후 wiki-view에 trashed 필터 추가. 이전 누락 버그였음.

## Technical Learnings

- **Zustand persist version migration**: `migrate` 함수는 stored version < currentVersion일 때만 호출. 재실행 보장하려면 idempotent하게 + version bump.
- **Zustand store에 contentJson 없음**: `persist partialize`가 strip. 모든 contentJson은 IDB(`plot-note-bodies` / `plot-wiki-block-bodies`)에서. 비동기 로드 필요.
- **Radix Popover hydration mismatch**: SSR/CSR 자동 ID 다름. `<ClientOnly>` mount guard 또는 `aria-controls` 자동 동기화 필요. dev console만 시끄러움 — 기능 영향 X.
- **TipTap NodeView (Popover)**: age/dday/math 모두 동일 패턴. Popover에 `align="start"` + `sideOffset` + `collisionPadding` 필수 (chip이 좁으면 default `align="center"`가 화면 좌측으로 밀림).
- **자동 등재 시스템 (`runAutoEnrollment`)**: createWikiStub에 dedupe 가드 없으면 매 실행마다 동일 title 누적. 12 시간 사이클 동안 중복 폭발.
- **WikiArticle vs noteType "wiki" Note 차이**: WikiArticle = wikiArticles slice (별도 entity), noteType wiki = notes slice. wiki space는 wikiArticles만 표시. createWikiStub은 notes에 추가. 두 시스템 분리 + dedupe 양쪽 필요.
- **`isWikiStub` heuristic**: 상태 필드 X, 블록 수 + 내용 비어있음 + 기본 템플릿 매칭으로 판정.
- **MixedQuicklinks 정렬 키**: `${type-priority}-${pinnedOrder/createdAt}` 복합 sortKey로 종류별 그룹핑 + 그룹 내 안정 정렬.

## Blockers / Issues

- **위키 dashboard 카운트 불일치**: top "Wiki Articles 3" vs 카드 그리드 7개. wikiArticles prop을 trashed 필터된 wikiNotes로 변경했음. 다음 reload 후 검증 필요.
- **노트 1000+개 perf**: Connections incoming scan + Discover scoring + computeKnowledgeMetrics 모두 O(N) 또는 O(N²). 작업 가능, 추후 worker offload 또는 incremental.

## Environment & Config

- Node.js v24, Next.js 16.1.6, React 19, TypeScript, Zustand 5, TipTap 3, Tailwind v4
- Branch: `claude/peaceful-saha-25d0cd` (worktree)
- Store version: **v91** (12 마이그레이션 추가 이번 세션)
- Build: `npm run build` 통과 (이번 세션 최종)
- Dev server: port 3002 (`npm run dev --webpack`)
- 신규 패키지: `y-indexeddb` (P0-1)
- **plot-mention-index** IDB DB 신설 (Connections perf)

## Notes for Next Session

- **before-work 시 v91 마이그레이션 자동 실행** — 다음 reload 시 wiki article 중복 dedup + unpin 클린업.
- 사용자가 핀 buttin 클릭하면 article pinned=true → wiki dashboard PINNED 섹션 + Home Quicklinks 양쪽에 등장. 핀 상태 변경 후 reload 안 해도 즉시 반영.
- **wiki-dashboard 카운트 정합성 검증 우선**: 다음 세션 시작 시 위키 space 들어가서 top stat과 카드 그리드 갯수 일치하는지 확인. 불일치면 wiki-dashboard.tsx의 wikiArticles prop 사용 부분 추적.
- **Pinned 시스템**: 노트도 사이드패널에 핀 토글 추가 가능 (현재 note는 어떻게 핀하는지 확인 필요).
- **Y.Doc P0-2**: WikiEditorAdapter에 동일 패턴 적용 — 4 race guard 그대로 옮기기. 위험. 별도 세션 권장.
- **Home Recent 4개 + Quicklinks 카드**: 데이터 적을 때 빈 느낌 — 사용자 데이터 쌓이면 자연스러움.

## Files Modified

### 신규 파일 (~25개)
- `components/editor/nodes/{age-macro,banner-block,dday-macro,math-nodes}.tsx`
- `components/home/{home-row,home-section,quick-capture,stats-row,recent-cards,mixed-quicklinks}.tsx`
- `components/ontology/{metric-row,ontology-tab-bar,ontology-insights-panel,ontology-nudge-section}.tsx`
- `components/side-panel/backlink-card.tsx`
- `components/ui/client-only.tsx`
- `components/views/note-split-page.tsx`
- `components/wiki-editor/{banner-block,wiki-breadcrumb}.tsx`
- `hooks/{use-backlinks-with-context,use-knowledge-metrics,use-knowledge-nudges}.ts`
- `lib/editor/entity-context.ts`
- `lib/embed-cycle.ts`
- `lib/insights/{types,metrics}.ts`
- `lib/mention-index-store.ts`
- `lib/note-split-mode.ts`
- `lib/wiki-{color-contrast,hierarchy,infobox-collapse,infobox-presets,navbox-collapse,navbox-helpers}.ts`

### 수정 파일 (~60개)
- 핵심: `lib/store/{index,migrate,types}.ts`, `lib/types.ts`, `app/(app)/layout.tsx`
- 위키: `wiki-{view,dashboard,article-view,article-encyclopedia,block-renderer,footnotes-section}.tsx`, `wiki-article-detail-panel.tsx`
- 노트: `note-editor.tsx`, `notes-table.tsx`, `floating-action-bar.tsx`, `view-header.tsx`
- 인포박스: `wiki-infobox.tsx`
- 사이드바: `linear-sidebar.tsx`
- Connections: `side-panel-connections.tsx`, `discover-engine.ts`, `body-helpers.ts`
- 코어: `note-body-store.ts`, `y-doc-manager.ts`, `NoteEditorAdapter.tsx`, `TipTapEditor.tsx`
- 슬라이스: `notes.ts`, `references.ts`, `wiki-articles.ts`, `helpers.ts`
- 컬러: `colors.ts`, `editor-icons.ts`, `event-config.ts`

### 삭제 파일
- `components/editor/nodes/ruby-text-node.tsx` (사용자 결정)
- `components/home/knowledge-nudge.tsx` (Ontology로 이전 + 통합)
