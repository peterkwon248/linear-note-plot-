---
session_date: "2026-04-10 08:08"
project: "Plot (linear-note-plot-)"
working_directory: "C:/Users/user/Desktop/linear-note-plot-/.claude/worktrees/cool-shirley"
duration_estimate: "~12 hours"
---

## Completed Work

**Peek-First 실험 (Phase 2~3.5):**
- Phase 2: Peek Wiki 지원 (`PeekContext`, 8 호출부)
- Phase 2.5: Peek 자립 (상시 탭 + Empty State + Cmd+Shift+P)
- Phase 3: 사이즈 시스템 (peekSize 32-50%, drag, main-content 동적)
- Phase 3.5: Back/Forward + Pin + 대비 개선
- 노트/위키 시각 구분 (StatusShapeIcon 공유)
- MentionSuggestion 일관성
- Empty State Suggested 섹션
- 검색 결과 Notes/Wiki 그룹핑
- Tooltip overflow fix (Radix bottom)
- FixedToolbar variant="peek" (violet tint)
- Wiki 편집 in Peek + infobox/TOC

**피벗 — Split-First 복귀:**
- Peek UI는 사이드패널 안에 있는 한 "같은 단층" 불가능
- 대안: Split view + 단일 SmartSidePanel focus-following
- **Phase 1 완료**: SmartSidePanel 단일 인스턴스 + global state, useSidePanelEntity, Peek 탭 제거 (4탭)
- tsc clean

## In Progress (안전한 체크포인트)

- `side-panel-peek.tsx`, `peek-empty-state.tsx`, `lib/peek/` 파일은 여전히 존재 (미사용)
- store에 peek/secondarySidePanel 상태 아직 남음 (tsc pass but unused)
- `smart-side-panel.tsx`의 `showPeek` 블록이 여전히 side-panel-peek.tsx import
- `openSidePeek` 호출부 6곳 남음

## Remaining Tasks (24 sub-tasks in todo list)

- [ ] **Phase 2**: Store cleanup (types.ts → ui.ts → index.ts → migrate.ts 순서)
- [ ] **Phase 3**: Peek 파일 제거 (3-2 smart-side-panel 블록 먼저, 3-1 파일 삭제 나중에)
- [ ] **Phase 4**: peek-empty-state → secondary-open-picker, peek-search → entity-search 이름 변경
- [ ] **Phase 5**: Focus tracking + 액티브 pane 시각 표시
- [ ] **Phase 6**: Split view 통합 검증 (wiki 편집 포함)
- [ ] **Phase 7**: CONTEXT.md 업데이트 (NEXT-ACTION.md/MEMORY.md는 이번 세션에서 갱신됨)

## Key Decisions

- **Peek-First → Split-First 피벗**: Peek UI가 chrome 레이어로 인해 동등한 에디터 느낌 불가능
- **단일 코드 경로 원칙**: single/multi mode가 동일한 sidebar 렌더 로직. 차이는 activePane 값만
- **useSidePanelEntity 재활용**: PR #173에서 이미 구현된 pane-aware hook. 재발명 금지
- **자산 손실 없음**: StatusShapeIcon, MentionSuggestion, peek-search/suggestions, Tooltip fix, FixedToolbar variant 전부 재활용

## Technical Learnings

- `react-resizable-panels` onDoubleClick은 내부 pointer 가로채기로 동작 안 함 → addEventListener 또는 pointerdown counting
- `flex-col` 부모가 있어야 자식 `flex-1`이 전체 높이 채움 (counter 위치 버그 원인)
- `ResizablePanel` defaultSize는 마운트 1회만. useEffect + panelRef.resize() 필요
- main-content defaultSize 하드코딩 → sidepanel maxSize 초과 시 스케일 다운 → 동적 계산 필요
- Radix Tooltip이 Portal + avoidCollisions로 자동 overflow 회피
- useSidePanelEntity + usePane + PaneProvider 체인이 이미 존재 — focus-following 인프라 구축 완료 상태였음

## Blockers / Issues
- 없음 (tsc clean)

## Environment & Config
- Branch: `claude/cool-shirley` (worktree)
- Dev server: port 3002
- tsc: `npx tsc --noEmit 2>&1 | grep -v "\\.next"`

## Notes for Next Session

- **Phase 1 완료 = 안전한 체크포인트**
- `SmartSidePanel`: pane prop 제거, global state (`components/side-panel/smart-side-panel.tsx`)
- `side-panel-connections.tsx`: `useSidePanelEntity` 사용 (line ~230)
- `layout.tsx`: SmartSidePanel 호출부 단순화 (line ~341)
- **Phase 2부터 시작**: store cleanup. types.ts부터 시작해 tsc 연쇄 에러 하나씩 수정
- **순서 중요**: side-panel-peek.tsx는 Phase 3-2(smart-side-panel 렌더블록 제거) 후 삭제
- Split view는 이미 layout.tsx에 있음 (복원 불필요)

## Files Modified (22 + 신규)

Store: `lib/store/types.ts`, `index.ts`, `slices/ui.ts`, `migrate.ts`
Side panel: `smart-side-panel.tsx`, `side-panel-peek.tsx`, `side-panel-connections.tsx`, `peek-empty-state.tsx` (신규)
Editor: `FixedToolbar.tsx`, `MentionSuggestion.tsx`, `note-hover-preview.tsx`, `wikilink-context-menu.tsx`
Shared: `status-icon.tsx`, `notes-table.tsx`, `ui/resizable.tsx`, `note-reference-actions.ts`
Layout/shortcuts: `app/(app)/layout.tsx`, `hooks/use-global-shortcuts.ts`
신규: `lib/peek/peek-search.ts`, `lib/peek/peek-suggestions.ts`
Docs: `CONTEXT.md`, `NEXT-ACTION.md`, `MEMORY.md`
