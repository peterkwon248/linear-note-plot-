# Plot — Project Context (Git-Synced)

> This file is synced via git so all machines share the same context.
> before-work reads this file. Update it whenever major decisions change.

## Identity

Plot = 노트 + 개인 위키 + 지식 관계망
- 겉은 Apple Notes, 속은 Zettelkasten
- 유저는 노트만 쓰고 앱이 알아서 제텔카스텐

## Current Architecture

### Store
- Zustand + persist (IDB storage via `lib/idb-storage.ts`)
- Slices (16): notes, workflow, folders, tags, labels, thread, maps, relations, ui, autopilot, templates, editor, workspace, attachments, ontology, reflections
- Store version: 40
- Types: `lib/store/types.ts`, `lib/types.ts`

### View System
- Always-mounted views via `lib/table-route.ts` + `app/(app)/layout.tsx`
- Mount-once keep-alive pattern (CSS display toggle)
- ViewModes: list | table | board | insights | calendar
- Tags, Labels, Templates, Ontology → 항상 풀와이드 렌더 (레이아웃 모드 무관)
- ListEditorLayout: Notes 전용 (three-column/split 모드)
- Responsive NotesTable: ONE grid for all sizes (ResizeObserver + minWidth thresholds)

### Editor
- TipTap 3 editor (`components/editor/TipTapEditor.tsx`)
- 24+ extensions (StarterKit, TaskList, Highlight, Link, Table, CodeBlockLowlight, Mathematics, SlashCommand, HashtagSuggestion, etc.)
- Workspace: binary tree layout system (v35) — WorkspaceNode = Leaf | Branch, 5 presets, 9 view types
- LayoutMode: list | focus | three-column | tabs | panels | split (6 modes)
- Wiki-links: `[[title]]` extracted to `Note.linksOut`

### Knowledge System
- Backlinks: `lib/backlinks.ts` (incremental index, keyword/tag scoring, alias support)
- Search: FlexSearch worker-based (`lib/search/`) with IDB persistence
- Ontology: co-occurrence engine, relation suggestions, wiki infobox, premium graph view (d3-force worker)

### Note Lifecycle
```
inbox → capture → permanent → WIKI (planned)
(흘러감)                       (쌓임)
```

### Labels vs Tags
- Labels → 노트 타입 (무엇인가): 메모, 리서치, 아이디어
- Tags → 노트 주제 (무엇에 관한 것인가): #투자 #사주 #독서

## Completed Features (최근 5개, 전체는 docs/MEMORY.md 참조)
25. 뷰 필터/디스플레이 + 레이아웃 스위처 UX 개선
26. Wiki 사이드바 섹션 추가 — WikiView (Articles + Red Links 탭)
27. LayoutMode "list" 추가 + Back 네비게이션 개선
28. ViewHeader 통일 — Wiki ViewHeader 전환, 드롭다운 자동완성, Templates 버튼 bg-accent 통일, ring-accent focus
29. Linear식 풀페이지 SearchView — Notes/Tags/Labels/Templates/Folders 탭 검색, Cmd+K/사이드바 → 풀페이지, SearchDialog 엔티티 검색

## Three Axes — Core Design Philosophy

```
Thread        → 깊이축  (지금 이 생각을 파고드는 실시간 전개)
Reflections   → 시간축  (시간이 지난 후 과거 노트를 회고)
Relations     → 공간축  (다른 노트들과의 의미적 관계)
```

## Implementation Order (최신, 2026-03-19 업데이트)

### 모든 Tier 완료 ✅
- Tier 1: Wiki Phase 4-C ✅ (PR #65-67)
- Tier 2: Reflections + Insights + Ontology 고도화 ✅ (PR #67)
- Tier 3: 디자인 토큰 + 뷰 필터/디스플레이 ✅ (PR #68, #71)
- Thread (thinking→thread rename + ThreadPanel) ✅ 기존 구현
- 읽기/편집 뷰모드 토글 (isReadMode + Ctrl+Shift+E) ✅ 기존 구현
- Research 모드 레이아웃 프리셋 ✅ (PR #70)

### 다음 작업 후보 (Deferred)
- 사이드바 재구성 (Views/Folders/Tools 섹션화) — docs/sidebar-wiki-redesign.md 참조
- 위키 전용 대시보드/인터페이스 (나무위키 블록 구조, 수집함 + 자동 배치)
- Filter/Display에 Layout 통합 + 사이드바 레이아웃 스위처 제거
- 커스텀 뷰 시스템 (Save as View, 시스템/커스텀 뷰 관리)
- Phase 4-D: Context Panel
- Phosphor Icons 적용
- WIKI 초성 검색 (ㄱㄴㄷ 인덱싱)
- Settings always-mounted

## Key Design Decisions (최신)

- SQL 테이블 아님 → Zustand 슬라이스로 구현
- Related Notes(자동)와 Relations(수동)은 한 섹션에 통합
- Thread의 relatedNoteIds 제거 → Relations에 위임
- 에디터 FixedToolbar은 항상 화면 최하단 (UpNote 스타일)
- 레이아웃 5모드 + Workspace binary tree (v35) ✅ 구현 완료
- **Activity 삭제 완료** → Insights 뷰에 통합. 현재 Activity는 로그 덤프에 불과
- **Insights ≠ Ontology** → 별개 뷰로 유지
  - Insights = 행동 분석 (How) — 편집 빈도, 방치 노트, inbox 체류일, 트렌드
  - Ontology = 구조 시각화 (What) — 노트 간 관계/연결 그래프
  - 접점: 온톨로지 노드 색상을 인사이트 데이터로 레이어링 가능
- **Wiki = 나무위키식 데이터베이스** (단순 isWiki 플래그 X)
  - 노트 시스템 안에 통합
  - `[[내부링크]]` 클릭 → 해당 문서로 이동, 없으면 자동 생성
  - 백링크 (이 문서를 참조하는 문서들)
  - 목차 자동생성 (헤딩 기반 TOC)
  - 에디터는 같은 TipTap, 위키 모드일 때 기능 확장
  - Obsidian/Logseq 방식
- **Tags/Labels** → 항상 풀와이드 렌더 (list+editor 모드 아님)
- **LayoutModeSwitcher** → 사이드바 헤더에 위치 (노트 열린 상태에서만 표시, Grid 상태에서 숨김)
- **기본 시작 뷰** → inbox (settings-store startView 기본값)
- **글로벌 검색 = 풀페이지** (Linear 스타일) — 사이드바 Search/Cmd+K → /search 뷰로 이동, 모달 아님
  - 빈 쿼리 → Recent Notes 8개만 (1만개 노트 기준 성능 고려)
  - 타이핑 → FlexSearch(노트) + 동기 필터(태그/라벨/템플릿/폴더)
  - 탭: All | Notes | Tags | Labels | Templates | Folders
- **로컬 검색 ≠ 글로벌 검색** — 각 뷰 헤더 검색은 해당 뷰 내 필터링, 글로벌은 사이드바/Cmd+K
- **ViewHeader 드롭다운** — 로컬 검색 input 아래에 매칭 노트 드롭다운 표시

## TODO: Future Work
- SearchDialog 모달 축소 (커맨드/링크 모드만 유지, search 모드 제거)
- 사이드바 재구성 (Views/Folders/Tools) — docs/sidebar-wiki-redesign.md
- 위키 수집함 + 자동 배치 블록 구조 (나무위키 스타일)
- 커스텀 뷰 시스템 (Linear 방식 View 관리 페이지)
- Filter/Display Layout 통합
- Settings always-mounted
- WIKI 초성 검색 (ㄱㄴㄷ 인덱싱)
- Phase 4-D: Context Panel
