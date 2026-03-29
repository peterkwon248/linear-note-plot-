---
session_date: "2026-03-29 10:00"
project: "Plot (linear-note-plot)"
working_directory: "C:\\Users\\user\\Desktop\\linear-note-plot-\\.claude\\worktrees\\vigorous-matsumoto"
duration_estimate: "~3h"
---

## Completed Work
- **Title 노드 폐기 → UpNote 스타일** (PR #128, merged to main)
  - `title-node.ts` 삭제, `TitleDocument` 제거
  - 첫 번째 블록(H2)이 자동으로 타이틀 역할
  - NoteEditorAdapter 타이틀 추출: 첫 블록 텍스트 = Note.title
  - IDB body 마이그레이션: title 노드 → heading level 2, Store v64→v65
  - CSS: 첫 H2에 타이틀 스타일 + "Untitled" placeholder
- **블록 드래그 인프라**
  - `tiptap-extension-global-drag-handle` + `tiptap-extension-auto-joiner` 설치
  - 커스텀 노드 7종 `not-draggable` 클래스 적용
  - Dropcursor 슬롯 인디케이터 스타일
  - 드래그 핸들 UI 임시 숨김 (`display: none`)
- **dnd-kit 블록 리오더 플랜 완성** (`.omc/plans/dnd-kit-block-reorder.md`)

## Remaining Tasks
- [ ] **dnd-kit 블록 리오더 구현** — 플랜: `.omc/plans/dnd-kit-block-reorder.md`. Phase 1부터
- [ ] Stub 삭제 (WikiStatus → article only)
- [ ] 미구현 노드 테스트 (Summary, Columns, NoteEmbed, Infobox)
- [ ] 커맨드 팔레트 확장, 풀페이지 검색

## Key Decisions
- Title 노드 폐기 → UpNote 스타일 (첫 블록 H2 = 타이틀)
- 드래그 핸들 임시 숨김 → dnd-kit Phase에서 커스텀 핸들로 교체
- dnd-kit Overlay Layer 방식 채택 (ProseMirror DOM 위 투명 레이어)

## Technical Learnings
- GlobalDragHandle: HTML 태그 기반 선택자, customNodes에 data-type 등록 필요
- `.not-draggable` 클래스로 하위 요소 핸들 비활성화
- Title 커스텀 노드의 Enter/Backspace 경계 처리는 매우 복잡 → UpNote 방식이 훨씬 단순

## Files Modified
- `title-node.ts` — 삭제
- `shared-editor-config.ts` — TitleDocument 제거, GlobalDragHandle 등록
- `NoteEditorAdapter.tsx` — 타이틀 추출 변경
- `EditorStyles.css` — title CSS→첫 H2 스타일, drag-handle 숨김, drop-cursor 슬롯
- `{7개 노드 파일}` — not-draggable 추가
- `lib/store/index.ts` — v65 + IDB 마이그레이션
- `docs/MEMORY.md` — 최신화
