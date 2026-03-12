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
- Slices: `lib/store/slices/` (notes, editor, folders, labels, tags, templates, thinking, ui, views, workflow, autopilot, maps)
- Store version: 30
- Types: `lib/store/types.ts`, `lib/types.ts`

### View System
- Always-mounted views via `lib/table-route.ts` + `app/(app)/layout.tsx`
- Mount-once keep-alive pattern (CSS display toggle)
- ViewModes: list | table | board | insights | calendar

### Editor
- TipTap editor (`components/editor/TipTapEditor.tsx`)
- Multi-tab support: `EditorState` in store (panels[], tabs, splitMode)
- Components: editor-tab-bar, editor-panel-container, editor-split-view
- Wiki-links: `[[title]]` extracted to `Note.linksOut`

### Knowledge System
- Backlinks: `lib/backlinks.ts` (incremental index, keyword/tag scoring)
- Search: FlexSearch worker-based (`lib/search/`)
- KnowledgeMaps: force-directed graph visualization

### Note Lifecycle
```
inbox → capture → permanent → WIKI (planned)
(흘러감)                       (쌓임)
```

### Labels vs Tags
- Labels → 노트 타입 (무엇인가): 메모, 리서치, 아이디어
- Tags → 노트 주제 (무엇에 관한 것인가): #투자 #사주 #독서

## Completed Features (v2)
1. Labels — note labeling system
2. Autopilot Rules — rule-based automation
3. Templates — note templates with seed data
4. Calendar View — monthly grid
5. Multi-Tab + Split View — VS Code style tabs
6. Datalog — Activity history & analytics (NoteEvent)
7. Tags & Labels sidebar views (#42)
8. Inbox unified with Notes design (#43)
9. Inline #hashtag → tag auto-sync (#44, #45, #46)

## Three Axes — Next Major Features (confirmed 2026-03-12)

### Concept
```
Thread        → 깊이축  (지금 이 생각을 파고드는 실시간 전개)
Reflections   → 시간축  (시간이 지난 후 과거 노트를 회고)
Relations     → 공간축  (다른 노트들과의 의미적 관계)
```

### 1. Thread (깊이축)
- ThinkingChainSession → Thread (rename)
- Store: `lib/store/slices/thinking.ts` already has start/addStep/end
- UI: 에디터 하단 접이식 패널
- relatedNoteIds 제거 → Relations에 역할 위임
- 난이도: 낮

### 2. Relations (공간축)
- 3 types fixed: refutes(반박) / extends(파생) / related(관련)
- PlotState에 `relations: NoteRelation[]` 추가
- 기존 "Related Notes" 자동추천과 수동 Relations를 한 섹션에 통합
- Backlinks 패턴 참고
- 난이도: 중

### 3. Reflections (시간축)
- PlotState에 `reflections: Reflection[]` 추가 (수정/삭제 불가, 쌓임만)
- reviewAt 재활용 (이미 setReminder/clearReminder 있음)
- 앱 시작 리뷰 배너: reviewAt <= now 필터링
- 디테일 패널에 REFLECTIONS 섹션
- TipTap ❌, 단순 textarea
- 난이도: 중

### 4. WIKI (개인 위키)
- Note에 `isWiki: boolean` 플래그 추가 (별도 타입 아님)
- isWiki=true → 기본 읽기모드, status 워크플로우 무시, "이 항목의 노트" 섹션
- "이 항목의 노트" = useBacklinksFor() + 같은 태그 노트
- 사이드바 WIKI 목록 + 검색 + 태그별 분류
- 일반 노트 → WIKI 승격 가능 (우클릭 or 디테일 패널)
- 난이도: 중

### 5. 읽기/편집 뷰모드 토글
- EditorState에 viewMode: 'edit' | 'read' 추가
- TipTap `editable` prop 활용
- WIKI는 기본 read, 일반 노트는 기본 edit
- 단축키: Cmd+E 토글
- 난이도: 낮

### 6. 레이아웃 3모드
- Mode A: 에디터 집중 (현재)
- Mode B: 탭 (EditorTab[] 이미 있음, UI만)
- Mode C: 멀티패널 Roam 스타일 (react-resizable-panels)
- [[링크]] 클릭 → 오른쪽 패널에 열림
- LayoutMode: 'editor' | 'tabs' | 'panels'
- 난이도: 중

### 7. 위키링크 hover preview
- linksOut 재활용
- 난이도: 낮

## Implementation Order (confirmed)
1. Thread (rename + UI)
2. 읽기/편집 뷰모드 토글
3. Relations
4. WIKI (isWiki + 전용 뷰)
5. Reflections + 리뷰 배너
6. 탭 + 멀티패널 레이아웃
7. 위키링크 hover preview

## Design Decisions
- SQL 테이블 아님 → Zustand 슬라이스로 구현
- Related Notes(자동)와 Relations(수동)은 한 섹션에 통합
- WIKI 초성 검색은 후순위
- Thread의 relatedNoteIds 제거 → Relations에 위임

## TODO: Future Work
- Settings always-mounted (when settings features implemented)
- WIKI 초성 검색 (ㄱㄴㄷ 인덱싱)
