---
session_date: "2026-05-03 01:30"
project: "Plot (linear-note-plot-)"
working_directory: "C:/Users/user/Desktop/linear-note-plot-/.claude/worktrees/relaxed-burnell-c0400e"
duration_estimate: "very long session — 코드 9 커밋 + 33 디자인 결정"
pr: "#237 (open, 11 commits)"
---

## Completed Work

### Code 변경 (PR #237에 누적, 9 → 11 커밋)
- 18ad465: docs archive + Saved Views 4-space + 카테고리 색 + Sticker 사이드바
- f87b024: Saved Views 스냅샷 UX (Linear 옵션 C)
- 93b432d: Index 위치 통일 + viewState.toggles 보존
- cbd30db: Index 선명도/Display Properties 정정
- 85c6a29: Status 정렬 + Backlinks + Wiki Article/Stub 아이콘
- 2f0b3a2: Stickers 4 space NavLink (이후 Library만으로 변경 결정)
- **90e18f1**: Hull 클릭 안 되는 버그 fix (pointerEvents)
- **9cec76a**: Hull stuck 버그 fix (renderTick deps)
- **b65caa3**: Hull 우클릭 sticker 메타 액션 추가

### Docs 갱신
- docs/CONTEXT.md: Plot 정체성 + 33개 디자인 결정 추가
- docs/MEMORY.md: 다음 작업 큐 재정렬 + Technical Learnings
- .omc/notepads/general/decisions.md: 큰 데이터 모델 변경 결정
- .omc/notepads/general/learnings.md: SVG pointer-events / useMemo ref 함정

## In Progress
- 없음 (현 세션 작업 모두 완료, 다음 PR 준비 단계)

## Remaining Tasks (다음 세션 우선순위 순)

### 🟢 작은 polish PR (즉시 시작 가능)
1. **마크다운 단축키 Phase 1**: `---` Enter 패턴 + Highlight (`==`) + Image embed (`![[..]]`)
   - 파일: components/editor/core/shared-editor-config.ts
   - HorizontalRule extension 커스터마이징 (default input rule 비활성 + Enter keyboard shortcut)
2. **Linear-style entity navigation (의미 A)**: view 안 노트 간 ↑/↓ 키, 1/N 표시
3. **Wiki "Blocks" Display Property**: lib/view-engine/view-configs.tsx WIKI_VIEW_CONFIG.displayConfig.properties에 추가
4. **Stickers Library만 진입점**: Notes/Wiki/Ontology/Home에서 NavLink 제거 (이전 PR에서 추가한 것 일부 revert)
5. **Notes 사이드바 위계**: Notes ▼ 토글 그룹 (Inbox/Capture/Permanent/Pinned 자식)

### 🟡 중간 PR
6. **NoteStatus 리네이밍** (PRD 사전 조사 완료): inbox→stone, capture→brick, permanent→keystone + IDB v101 마이그레이션
7. **마크다운 Phase 2**: Math (KaTeX) + Heading anchor (`[[Title#Heading]]`)
8. **Filter chip 3-part 드롭다운** (Step B): Field/Operator/Value 모두 popover
9. **Linear 검색창 패턴**: All/Notes/Wiki/Tag/... 탭형 검색

### 🔴 큰 데이터 모델 PR
10. **Folder type-strict + N:M**: 노트/위키 폴더 분리, 다중 멤버십
11. **Sticker v2 cross-everything**: 모든 entity 수용, Sticker.members[] 정참조 모델, Universal Entity Picker
12. **Sandbox + Save view 통합**: 그래프에서 relation sandbox + 본문 embed 자동 추가 (사용자 첫 prompt + "기억")
13. **Entity-ref WikiBlock 일반화**: note-ref → 모든 entity 가능
14. **온톨로지 그래프 노드 확장**: 모든 entity (Tag/Label/Category/File/Reference) 노드화

### 🟣 v3급 PR
15. **Book entity** (cross-entity, ordered sequence, Activity Bar 7번째)
   - chapter Manual drag-drop default + Auto-sort 액션
   - Hull + Sequence edge + Reading view
   - Wikilink: `[[Book]]`, `[[Book#Chapter]]`

### 🎨 디자인 polish (별도)
- 컬럼 헤더 아이콘 통일 (Name/Title 포함)
- Status 아이콘 시리즈 (Linear 빈/반/꽉 패턴)
- Updated/Created 아이콘 분기

## Key Decisions

### Plot 정체성 (영구)
> **"Gentle by default, powerful when needed"** — 모든 디자인 결정 척도

### 4사분면 컨테이너 모델
- View / Folder / Sticker / Book + Search (일회성)
- 의미 분리 명확 (collection vs sequence, type-strict vs cross-entity)

### Page entity 폐기 (제텔카스텐 atomic 위배), Book entity 채택 (atomic 보존 + sequence)

### Sandbox = 그래프만 (노트/위키 즉시 영구 — 노트앱 표준)
- Save view = 보기 + 데이터 staging 함께 영구 (옵션 B 통합)
- Wikilink = 본문에서만, Relation = 그래프에서

### Relation 저장 = 본문 contentJson에 직접 embed (footer 추가 X)
- 사용자 첫 번째만 prompt + "기억" 옵션
- 위키: 자동 "See also" 섹션 + entity-ref WikiBlock 일반화

### Sticker 진입점 = Library만 (이전 4 space 결정 정정)

### 사이드 패널 변경 = 모든 큰 PR의 collateral (별도 PR 없음)

## Technical Learnings (이번 세션)

### Hull 버그 fix 2개 (PR #237 후반에 추가)
1. **Hull 클릭 안 됨**: SVG `pointer-events="visiblePainted"` default가 fillOpacity 0.04~0.10 (HULL.fillOpacity)을 "not painted"로 판단 → 클릭 통과. `style.pointerEvents = "all"` 명시로 해결.
2. **Hull stuck 버그**: `clusterHulls` useMemo deps에 viewport `transform`만 있어서 노드 드래그 시 재계산 안 됨 (`positionsRef`는 ref라 React 추적 X). `forceRender`의 카운터 (renderTick) 노출 + deps에 추가로 해결.

### 자료구조 본질 차이로 entity 정당화
- Sticker = collection (set, 무순서) / Book = sequence (list, 순서 있음)
- 단순 ordered version이 아니라 본질 차원 다름

### 종이책 메타포 함정 회피
- 디지털 책 = cross-type 자유 (Notion 페이지 패턴)
- Plot Sticker도 cross-everything → Book도 같은 패턴 정합

### 사용자 통찰 = 디자인 시그널
- "Sticker = 글로벌 폴더" → 의미 분리 약하다는 신호
- "Detail 패널 = 본문 변화 추적" → 본문 source of truth

## Blockers / Issues
- 없음 (이번 세션 작업 모두 완료)

## Environment & Config
- **Worktree**: relaxed-burnell-c0400e
- **Branch**: claude/relaxed-burnell-c0400e
- **PR #237**: open, 11 커밋, main에 머지 대기
- **Build**: ✅ next build 통과 (exit 0)
- **TypeScript**: ✅ tsc --noEmit 0 에러
- **Store version**: v100 (Sticker entity)

## Notes for Next Session

1. **PR #237 머지 우선** — 11 커밋 + 33 디자인 결정 정리됨, main 안정화 필요
2. **Fresh worktree 권장** — 다음 PR은 새 worktree에서
3. **작은 polish PR부터 시작 추천** — 마크다운 Phase 1 + Linear nav + Wiki Blocks + Stickers Library + Notes 사이드바 위계
4. **데이터 모델 PR은 의존성 큰 단위로 묶기** — Folder N:M + Sticker v2 함께, 그 다음 Sandbox, 마지막 Book
5. **Plot 정체성 척도 활용** — "Gentle by default, powerful when needed"로 모든 디자인 결정 평가
6. **사용자 직관 = 디자인 시그널** — 사용자가 헷갈리거나 통찰하는 부분은 의미 분리 약하다는 신호로 해석

## Files Modified This Session

### 코드 (이전 PR 커밋들)
- components/notes-table.tsx — Index 위치 + 색 dot ContextMenu
- components/views/wiki-list.tsx — Article/Stub 아이콘 + Index 위치
- components/views/wiki-view.tsx — viewState.toggles
- components/views/wiki-category-page.tsx — 카테고리 색 dot UI
- components/calendar-view.tsx — Saved view 복원
- components/views/ontology-view.tsx — Saved view 복원
- components/linear-sidebar.tsx — Stickers 4 space NavLink
- components/ontology/ontology-graph-canvas.tsx — Hull 버그 fix 2개 + sticker 메타
- components/ontology/node-context-menu.tsx — sticker 메타 액션
- components/view-header.tsx — Save view 버튼
- components/display-panel.tsx — showAlphaIndex 특수 처리
- lib/view-engine/saved-view-context.ts (신규)
- lib/view-engine/use-save-view-props.ts (신규)
- lib/view-engine/view-configs.tsx — Index 칩 / Backlinks 라벨
- lib/types.ts — SavedView.viewMode 확장
- lib/store/types.ts — updateWikiCategory color
- lib/table-route.ts — /stickers 라우트
- lib/store/slices/ — saved-views, stickers
- app/(app)/layout.tsx — StickersView mount
- app/(app)/stickers/page.tsx (신규)
- components/views/stickers-view.tsx (신규, 754줄)

### Docs (이번 after-work)
- docs/CONTEXT.md — Plot 정체성 + 33개 디자인 결정
- docs/MEMORY.md — 다음 작업 큐 재정렬 + Technical Learnings
- docs/.archive/ (이전 PR에서 이동) — TODO/NEXT-ACTION/SESSION-LOG/PHASE-PLAN/plot-discussion
- .omc/notepads/general/decisions.md
- .omc/notepads/general/learnings.md
