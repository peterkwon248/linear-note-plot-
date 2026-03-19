# Plot — Project Context (Git-Synced)

> This file is synced via git so all machines share the same context.
> before-work reads this file. Update it whenever major decisions change.

## Identity

Plot = 노트 + 개인 위키 + 지식 관계망
- 겉은 Apple Notes, 속은 Zettelkasten
- 유저는 노트만 쓰고 앱이 알아서 제텔카스텐
- 사상: 팔란티어 × 제텔카스텐 — 개인 지식을 디지털 모델로 만들고 분석/사고/글쓰기를 돕는다

## Architecture Redesign v2 (확정, 구현 대기)

> 상세: `docs/architecture-redesign-v2.md` | 목업: `docs/plot-mockup-v3.jsx`

### 핵심 구조 변경

| 영역 | 현재 | 변경 후 |
|------|------|---------|
| 네비게이션 | 사이드바 의존 | Activity Bar (Inbox/Notes/Wiki/Graph) + 상단 유틸리티 바 |
| 라우팅 | 1-level (setActiveRoute) | 2-level (activeSpace + activeRoute) |
| 레이아웃 | LayoutMode 6개 | WorkspaceMode 3개 (default/zen/research) |
| 위키 상태 | isWiki boolean | isWiki + wikiStatus (stub/draft/complete) |
| 위키 등재 | 수동만 | 신호 기반 자동 + 수동 |
| 그래프 이름 | Ontology View | Graph (Ontology = 엔진, Graph = 시각화) |
| 에디터 헤더 | ← Back 버튼 | 브레드크럼 (space > folder > title) |

### 4-Layer Architecture

```
Layer 1 — Raw Data:    노트, 태그, 라벨, 폴더, 템플릿
Layer 2 — Ontology:    관계, 분류, co-occurrence (엔진)
Layer 3 — Wiki:        표현 계층 (정리된 참고자료)
Layer 4 — Insights:    패턴 발견 (건강검진)
```

### 구현 Phase (7단계, 추천순서: 1→2→3→4→5, 6은 독립적)

1. Foundation (v41 wikiStatus, v42 workspaceMode, activeSpace)
2. Layout Automation (WorkspaceMode, auto-collapse)
3. Activity Bar + Top Utility Bar (가장 임팩트 큼)
4. Sidebar Refactor (컨텍스트 반응형)
5. Breadcrumb
6. Wiki Evolution (자동 등재 엔진, stubSource, 초성 인덱스)
7. Wiki Collection (수집함, WikiQuote, Extract as Note)

## Current Architecture (현재 코드 기준)

### Store
- Zustand + persist (IDB storage via `lib/idb-storage.ts`)
- Slices (16): notes, workflow, folders, tags, labels, thread, maps, relations, ui, autopilot, templates, editor, workspace, attachments, ontology, reflections
- Store version: 40
- Types: `lib/store/types.ts`, `lib/types.ts`

### View System
- Always-mounted views via `lib/table-route.ts` + `app/(app)/layout.tsx`
- Mount-once keep-alive pattern (CSS display toggle)
- Responsive NotesTable: ONE grid for all sizes (ResizeObserver + minWidth thresholds)

### Editor
- TipTap 3 editor (`components/editor/TipTapEditor.tsx`)
- 24+ extensions (StarterKit, TaskList, Highlight, Link, Table, CodeBlockLowlight, Mathematics, SlashCommand, HashtagSuggestion, WikilinkSuggestion, WikilinkDecoration, etc.)
- Workspace: binary tree layout system (v35) — WorkspaceNode = Leaf | Branch
- LayoutMode: list | focus | three-column | tabs | panels | split (6 modes) → WorkspaceMode 3개로 수렴 예정
- Wiki-links: `[[title]]` extracted to `Note.linksOut`

### Knowledge System
- Backlinks: `lib/backlinks.ts` (incremental index, keyword/tag scoring, alias support)
- Search: FlexSearch worker-based (`lib/search/`) with IDB persistence
- Ontology Engine: co-occurrence engine, relation suggestions, wiki infobox, graph view (d3-force worker, Canvas rendering)
- Graph: `ontology-graph-canvas.tsx` — Canvas 기반, Web Worker 레이아웃, viewport culling, LOD zoom

### Note Lifecycle (병렬 트랙)

```
노트 워크플로우:  inbox → capture → permanent   (처리 상태)
                    ↕        ↕        ↕         (어느 시점에서든 진입 가능)
위키 품질 트랙:   stub  →  draft  → complete    (완성도)
```

### Labels vs Tags
- Labels → 노트 타입 (무엇인가): 메모, 리서치, 아이디어
- Tags → 노트 주제 (무엇에 관한 것인가): #투자 #사주 #독서

## Completed Features (최근 5개, 전체는 docs/MEMORY.md 참조)
29. Linear식 풀페이지 SearchView — 엔티티 검색
30. Wiki 홈 대시보드 + WikiView 내부 문서 읽기 3단 레이아웃 (TOC/본문/Infobox)
31. Side Peek 패널 — 위키링크 아이콘 클릭 → Peek/Open 드롭다운
32. Tags/Labels/Templates 소프트 삭제 — Trash 뷰 탭 필터
33. 위키링크 UX 통합 — `[[` 하나로 노트+위키 통합, 브래킷 숨김, Import Note

## Three Axes — Core Design Philosophy

```
Thread        → 깊이축  (지금 이 생각을 파고드는 실시간 전개)
Reflections   → 시간축  (시간이 지난 후 과거 노트를 회고)
Relations     → 공간축  (다른 노트들과의 의미적 관계)
```

## Key Design Decisions

- **LLM/API 사용 안 함** — 전부 규칙 기반 + 통계 기반 + 그래프 알고리즘. 오프라인, 프라이버시, 비용 0
- **Insights ≠ Ontology** → 별개 뷰로 유지
- **`[[` 통합** — 노트/위키 구분 없이 하나로 검색
- **Side Peek** — 위키링크 클릭 → 우측 패널 슬라이드
- **소프트 삭제** — 태그/라벨/템플릿 삭제 시 노트 연결 유지
- **글로벌 검색 = 풀페이지** (Linear 스타일) — Cmd+K → 모달(커맨드), 상단 🔍 → 풀페이지
- **로컬 검색 ≠ 글로벌 검색** — 뷰 헤더 = 로컬 필터, 사이드바/Cmd+K = 글로벌

## TODO: Future Work

- **Architecture Redesign v2 Phase 1~7 구현** (docs/architecture-redesign-v2.md)
- 위키 수집함 시스템 (docs/wiki-collection-design.md)
- 커스텀 뷰 시스템 (Phase 4 이후)
- Phase 4-D: Context Panel
- Phosphor Icons 적용
- Settings always-mounted

## 참조 문서

- `docs/architecture-redesign-v2.md` — v2 아키텍처 전체 설계
- `docs/plot-mockup-v3.jsx` — UI 목업 (Activity Bar, Graph, Wiki, Inbox)
- `docs/wiki-collection-design.md` — 위키 수집함 상세 설계
- `docs/sidebar-wiki-redesign.md` — 사이드바/위키 브레인스토밍
- `docs/MEMORY.md` — 전체 PR 히스토리 + 아키텍처 상세
