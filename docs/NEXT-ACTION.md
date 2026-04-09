# 🎯 Next Action

> **이 파일은 before-work가 가장 먼저 읽고, after-work가 마지막에 갱신한다.**
> 다음 세션 시작 시 "지금 바로 뭐 해야 하지?"의 답.
> 항상 1~3개의 immediate next action만. 큰 그림은 docs/MEMORY.md.

---

**Last Updated**: 2026-04-10 (Peek-First 실험 → Split-First 복귀, Phase 1 완료 직후)

## 🎯 다음 세션 시작하면 바로 할 것

### Phase 2: Store cleanup (Peek/secondarySidePanel 레거시 제거)

**배경**: Phase 1에서 SmartSidePanel을 단일 인스턴스 + global state로 단순화 했음 (`useSidePanelEntity` + `PaneProvider`로 focus-following). tsc는 pass지만 store에 미사용 peek/secondarySidePanel 상태가 여전히 존재.

**구체 작업 (tsc 연쇄 에러가 예상되니 하나씩 수정):**

1. **`lib/store/types.ts`** — `SidePanelMode`에서 `'peek'` 제거
2. **`lib/store/types.ts`** — peek 상태 필드 전부 제거:
   - `sidePanelPeekContext`, `peekHistory`, `peekPins`, `peekSize`, `peekNavStack`, `peekNavIndex`
   - `PeekContext`, `PeekPreset` 타입 export
3. **`lib/store/types.ts`** — peek 액션 제거:
   - `openSidePeek`, `closeSidePeek`, `togglePeekPin`, `removeFromPeekHistory`, `clearPeekHistory`, `setPeekSize`, `peekGoBack`, `peekGoForward`
4. **`lib/store/types.ts`** — secondarySidePanel 상태/액션 제거:
   - `secondarySidePanelOpen`, `secondarySidePanelMode`, `secondarySidePanelContext`
   - `setSecondarySidePanelOpen`, `toggleSecondarySidePanel`
5. **`lib/store/slices/ui.ts`** — 위 액션들의 구현 제거 + 관련 helper(peekKey, MAX_PEEK_* 상수, PEEK_SIZE_MIN/MAX 등)
6. **`lib/store/index.ts`** — 초기값에서 peek/secondary sidepanel 필드 제거, `partialize` exclusion 리스트 정리
7. **`lib/store/migrate.ts`** — 레거시 필드 `delete` 처리 추가 (기존 persist 데이터 호환)

### Phase 3: Peek 파일/참조 제거

**주의**: `components/side-panel/side-panel-peek.tsx`는 아직 삭제하면 안 됨. `smart-side-panel.tsx`의 `showPeek` 렌더 블록(import)이 참조 중 → 먼저 3-2에서 렌더 블록 제거, 그 다음 3-1.

1. **`components/side-panel/smart-side-panel.tsx`**: `showPeek` 변수 + 렌더 블록 + import 제거 (SidePanelPeek, PeekEmptyState)
2. **`components/side-panel/side-panel-peek.tsx`** 삭제
3. **`components/side-panel/peek-empty-state.tsx`** 삭제 (또는 Phase 4에서 secondary-open-picker로 이관)
4. **`lib/peek/peek-presets.ts`** 삭제 (사용 없음)
5. **`hooks/use-global-shortcuts.ts`**: `Cmd+Shift+P` 핸들러 삭제 또는 secondary picker 오픈으로 교체
6. **`lib/note-reference-actions.ts`** line ~100: `store.openSidePeek({ type, id })` → split view 진입 또는 삭제
7. **`components/editor/wikilink-context-menu.tsx`** line ~146: `openSidePeek` → `openInSecondary`
8. **`components/editor/note-hover-preview.tsx`** line ~246: `openSidePeek` → `openInSecondary`
9. **`components/side-panel/side-panel-connections.tsx`**: 8개 `openSidePeek` 호출 → `openInSecondary` 또는 제거

### Phase 4: Split view picker 재설계 (자산 재활용)

1. **`lib/peek/peek-search.ts`** → **`lib/workspace/entity-search.ts`** (이름 변경, 내용 대부분 유지)
2. **`lib/peek/peek-suggestions.ts`** → **`lib/workspace/secondary-suggestions.ts`**
3. **`components/side-panel/peek-empty-state.tsx`** → **`components/workspace/secondary-open-picker.tsx`**
   - 진입: Cmd+Shift+\\ 또는 Cmd+Shift+P로 picker 열림
   - 피커 동작: 노트/위키 선택 → `openInSecondary({type, id})` 호출 → secondary pane 오픈
   - Recent / Pinned / Suggested 섹션 그대로 재활용 (데이터는 secondaryHistory + 새 secondaryPins)
4. `secondaryHistory`에 pin 개념 추가하거나 별도 slice(`secondaryPins`) 신설

### Phase 5: Focus tracking 강화 + 시각 피드백

1. **Editor 컴포넌트**: `components/note-editor.tsx`, `components/workspace/secondary-panel-content.tsx` 등에 `onClick capture` → `usePlotStore.getState().setActivePane('primary'|'secondary')`
2. **액티브 pane 시각 표시**: subtle top 2px accent border (예: `border-t-2 border-t-accent`). Focus 이동 애니메이션 150ms

### Phase 6: Split view 통합 검증

1. Cmd+\\ 동작 (현재 공간 복제 → secondary)
2. Cmd+Shift+\\ 동작 (빈 secondary + picker)
3. Wiki 편집 split view에서 확인 (오늘 Peek에서 enable한 것을 split으로 이관)
4. 포커스 전환 시 sidebar 자동 갱신 (Detail 탭 내용 바뀜 확인)
5. 사이드바 애니메이션 부드러운지

### Phase 7: 문서 정리

1. `docs/NEXT-ACTION.md`: 새 방향 반영 완료 후 재작성
2. `docs/CONTEXT.md`: Peek-First → Split-First 결정 업데이트
3. `docs/MEMORY.md`: 이미 이번 after-work에서 업데이트됨

---

## 🧠 멘탈 상태 (잊지 말 것)

- **Phase 1 완료**: `SmartSidePanel`이 단일 인스턴스. `pane` prop 없음. global state. `useSidePanelEntity`가 `usePane()` → `activePane`을 따라감
- **Peek 탭은 이미 UI에서 제거됨** — 4탭 (Detail/Connections/Activity/Bookmarks)
- **`side-panel-connections.tsx`만 `useSidePanelEntity` 적용됨** — Detail/Activity/Bookmarks는 이전부터 이미 적용
- **side-panel-peek.tsx는 아직 살아있음** — smart-side-panel.tsx의 `showPeek` 블록 참조. Phase 3-1에서 해당 블록 제거 후 파일 삭제
- **`openSidePeek` 호출부 6곳 남음**: note-reference-actions, wikilink-context-menu, note-hover-preview, side-panel-connections, wiki-block-renderer, note-embed-node
- **Peek-First 자산 재활용 목록** (MEMORY.md 참조): StatusShapeIcon, MentionSuggestion 개선, peek-search, peek-suggestions, Tooltip fix, FixedToolbar variant
- **tsc는 현재 clean** — 이번 after-work 체크포인트는 안전한 복귀 지점

## ⚠️ 구현 전 주의사항

- **Phase 2 순서 중요**: types.ts 먼저 → ui.ts 슬라이스 → index.ts 초기값 → migrate.ts. tsc 연쇄 에러 하나씩 잡으면서 진행
- **`useSidePanelEntity`는 이미 PR #173에서 구현됨** — 재발명 금지. `components/side-panel/use-side-panel-entity.ts` 참조
- **Split view는 이미 layout.tsx에 존재** — `hasSplit`, `secondaryNoteId`, `hasViewSplit` 로직. Peek 위에 얹혀 있었을 뿐
- **오늘 작업 dead code 위험**: store 정리하면서 일부 오늘 추가한 wikilink 편집 관련 코드가 의미 없어질 수 있음. 보수적으로 판단

## 🚧 보류 (나중에)

- **Reference.history** — 데이터 모델 + UI 중간에 멈춤. Split-First 완료 후
- Library Bento Grid 리디자인, Library FilterPanel
- `@` 멘션에 Reference 지원 (지금은 이미 있음 — 확인됨. 이 항목 폐기)
