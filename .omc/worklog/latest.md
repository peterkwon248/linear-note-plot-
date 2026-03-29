---
session_date: "2026-03-29 10:00"
project: "Plot (linear-note-plot)"
working_directory: "C:\\Users\\user\\Desktop\\linear-note-plot-\\.claude\\worktrees\\vigorous-matsumoto"
duration_estimate: "~5h"
---

## Completed Work
- **Title 노드 폐기 → UpNote 스타일** (PR #128)
  - title-node.ts 삭제, TitleDocument 제거, Store v65
  - 첫 블록(H2) = 타이틀, NoteEditorAdapter 변경, IDB 마이그레이션
- **dnd-kit 블록 리오더 Phase 1~4** (PR #129)
  - `components/editor/dnd/use-block-positions.ts` — 블록 위치 추출 훅
  - `components/editor/dnd/use-block-reorder.ts` — ProseMirror tr 기반 리오더
  - `components/editor/dnd/block-drag-overlay.tsx` — DndContext + 핸들 + DOM 클론 프리뷰
  - TipTapEditor에 BlockDragOverlay 래핑, GlobalDragHandle 제거
  - Phase 4 엣지 케이스: blur, cancel, DndContext ID, maxHeight
- **Backspace at heading start → paragraph 변환** (shared-editor-config.ts)
- **H 드롭다운 위치 수정** — 업노트 스타일 (버튼 오른쪽)
- **EditorStyles.css hsl(var()) 전면 수정** — hex 변수에 hsl() 래핑 버그 → var()/color-mix()
- **H2 타이틀 크기 28px** + Untitled placeholder

## Remaining Tasks
- [ ] 테이블 UX 개선: X 삭제 버튼, Backspace 삭제, 드래그 핸들
- [ ] Stub 삭제 (WikiStatus → article only)
- [ ] 미구현 노드 실사용 테스트 (Summary, Columns, NoteEmbed, Infobox)
- [ ] 커맨드 팔레트 확장, 풀페이지 검색

## Key Decisions
- Title 노드 폐기 → UpNote 스타일 (첫 블록 H2 = 타이틀)
- dnd-kit Overlay Layer 방식 — ProseMirror DOM 위 투명 레이어
- GlobalDragHandle 완전 제거 → 커스텀 dnd-kit 핸들로 교체
- CSS 변수: hsl(var()) → var() / color-mix() (globals.css가 hex 사용)

## Technical Learnings
- globals.css가 hex 값(`#2a2a2e`) 사용 → `hsl(var(--border))`는 무효. `var(--border)` 직접 사용
- opacity 필요 시 `color-mix(in srgb, var(--xxx) N%, transparent)` 사용
- dnd-kit의 useSortable은 React DOM 기반이라 ProseMirror DOM에 직접 바인딩 불가 → 오버레이 레이어 필요
- ProseMirror 첫 블록에서 Backspace → paragraph 변환은 기본 동작이 아님, 커스텀 핸들러 필요

## Files Modified
- `components/editor/core/title-node.ts` — 삭제
- `components/editor/core/shared-editor-config.ts` — TitleDocument 제거, GlobalDragHandle 제거, Backspace 핸들러
- `components/editor/NoteEditorAdapter.tsx` — 타이틀 추출 변경
- `components/editor/TipTapEditor.tsx` — BlockDragOverlay 래핑
- `components/editor/FixedToolbar.tsx` — H 드롭다운 위치 수정
- `components/editor/EditorStyles.css` — hsl(var()) 전면 수정, 타이틀 H2 스타일
- `components/editor/dnd/*` — 신규 3파일 (use-block-positions, use-block-reorder, block-drag-overlay)
- `components/editor/nodes/*` — 7파일 not-draggable 추가
- `lib/store/index.ts` — v65 + IDB 마이그레이션
- `docs/MEMORY.md` — 최신화
