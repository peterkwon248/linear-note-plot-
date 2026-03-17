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
- Slices (17): notes, workflow, folders, tags, labels, thinking, maps, ui, views, autopilot, templates, editor, workspace, attachments, ontology, relations, reflections
- Store version: 39
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
18. Relations 완성 — relation_type_changed 이벤트 로깅, 제안 수락 시 타입 선택 UX
19. Wiki 기초 UI — Convert/Revert, WikiTOC, WikiInfobox, isWiki 필터, aliases, 위키 배지
20. Templates/Tags/Labels 헤더 스타일 통일
21. Reflections — 시간축 회고 시스템 (append-only, 타임라인 UI, reflection_added 이벤트)
22. Insights 뷰 고도화 — Activity 대시보드(Today/Week/Month, 7일 차트, Most Opened, Lifecycle) + Health 이슈
23. Ontology View 고도화 — 미니맵, 위키 노드 배지, 라벨 기반 클러스터링(forceX/Y + convex hull)

## Three Axes — Core Design Philosophy

```
Thread        → 깊이축  (지금 이 생각을 파고드는 실시간 전개)
Reflections   → 시간축  (시간이 지난 후 과거 노트를 회고)
Relations     → 공간축  (다른 노트들과의 의미적 관계)
```

## Implementation Order (최신, 2026-03-16 업데이트)

### Tier 1: Wiki 고도화 (Phase 4-C 완성) ✅ DONE
1. ~~Red/Blue 링크 색상 분기~~ ✅ (WikilinkDecoration.ts + EditorStyles.css)
2. ~~빨간 링크 클릭 → 위키 자동 생성~~ ✅ (createWikiStub on dangling click)
3. ~~사이드바 TOC~~ ✅ (wiki-toc.tsx, 좌측 w-[200px] sticky sidebar)
4. ~~위키 읽기 타이포그래피~~ ✅ (wiki-read-content CSS: max-width 720px, line-height 1.85, heading border-bottom)
5. ~~하단 분류 표시~~ ✅ (WikiCategories 컴포넌트, "분류: A | B | C" 렌더링)

### Tier 2: 기존 기능 마무리 ✅ DONE
6. ~~Reflections~~ ✅
7. ~~Insights 뷰 고도화~~ ✅
8. ~~Ontology View 고도화~~ ✅

### Tier 3: 디자인 폴리시
9. **디자인 토큰 통일** (typography/spacing/transitions)
10. **고아 코드 정리** (KnowledgeMap, SavedView, alerts 등 미사용 타입/슬라이스 제거)

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

## TODO: Future Work
- Settings always-mounted (when settings features implemented)
- WIKI 초성 검색 (ㄱㄴㄷ 인덱싱)
- Phase 4-D: Context Panel
