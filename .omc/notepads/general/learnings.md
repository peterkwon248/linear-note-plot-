# Technical Learnings

## 2026-03-16
- Store는 실제 16 슬라이스 (relations 슬라이스가 문서에서 누락되어 있었음)
- TemplatesView가 layout.tsx에 2번 마운트되는 복붙 버그 — mount-once 패턴에서 블록 복사 시 주의
- Implementation Order 2번(Thread)과 3번(읽기/편집 토글)이 이미 구현되어 있었음
  - Thread: thinking slice + ThreadPanel (components/editor/thread-panel.tsx)
  - 읽기/편집 토글: isReadMode state + Ctrl+Shift+E in note-editor.tsx
- search-dialog.tsx에 삭제된 기능으로 연결하는 dead 커맨드 팔레트 항목이 남아있었음
- dead code 검증 방법: Grep으로 import/참조 검색 → 자기 파일에서만 참조되면 dead

## 2026-03-19
- LayoutMode의 진짜 문제: workspace tree를 프리셋으로 덮어씀 (유저 커스텀 레이아웃 파괴). 해결: LayoutMode 삭제, tree가 유일한 진실
- Red link는 가상 상태(useMemo 계산 결과), stub는 실체(Note 객체). 자동 등재 시 red link가 소멸 (자기 조절)
- useMemo([notes]) 의존성: Zustand notes 배열 참조가 아무 노트 수정 시 바뀜 → useMemo 재계산. Web Worker 분리 또는 granular selector 필요
- Linear의 Search: 상단 유틸리티 바에 아이콘, 클릭하면 풀페이지 SearchView (모달 아님)
- wiki-view.tsx red link 계산: wikiTitleSet에 isWiki:true만 포함. 일반 노트가 존재해도 wiki 아니면 red link로 잡힘
- 자동 등재 시 기존 노트가 있으면 convertToWiki 사용해야 함 (createWikiStub로 새 Note 만들면 같은 제목 충돌)
- 초성 인덱스: `(charCode - 0xAC00) / 588 + 0x3131`로 한글 초성 추출. 성능 비용 거의 없음

## 2026-03-27 (Unified Pipeline)
- viewStateByContext에 새 ViewContextKey 추가 시, 기존 persist된 store에는 해당 키가 없음 → `?? buildViewStateForContext("key")` 방어 필수
- ToggleSwitch off 상태: `bg-border`는 다크모드에서 배경과 구분 안됨 → `bg-muted-foreground/40` 사용
- ToggleSwitch on knob: `bg-background`는 다크모드에서 검정 → `bg-white` 고정이 올바름
- Graph OntologyFilters → FilterRule[] 어댑터 패턴: 캔버스 내부는 OntologyFilters 유지하되 UI는 통합 FilterPanel 사용. 양방향 변환으로 브릿지
- Design Spine을 구조 통합에 녹이는 전략이 효과적: 파일 1번만 터치하면 시각적+구조적 일관성 동시 달성

## 2026-04-13 (Expand/Collapse All + TextBlock 개선)
- CSS 스펙: `overflow-y: auto` 설정 시 `overflow-x`가 `visible`이면 자동으로 `auto`로 변경됨 → 패딩 레이어와 스크롤 레이어를 분리해야 left:-28px 핸들이 잘리지 않음
- BlockDragOverlay는 `blocks.length > 1`일 때만 핸들 렌더링 — 블록 1개면 정상적으로 숨김
- Details extension `persist: true`면 `open` attr이 문서 JSON에 저장됨 → `tr.setNodeMarkup(pos, undefined, { open: value })`로 일괄 토글 가능
- InsertMenu/SlashCommand가 schema 체크 없이 메뉴 항목 표시 → TipTap extension이 특정 tier에 미등록이면 silent fail. TocBlockNode이 wiki tier에 없어서 Insert→TOC가 무반응이던 버그
- `useBlockResize` 훅은 TipTap NodeView 전용 (`updateAttributes` 필요) → 일반 React 컴포넌트(WikiTextEditor)에서는 인라인 mouseMove/mouseUp 패턴으로 직접 구현

## 2026-04-05 (호버 프리뷰 + Note/Wiki 링크)
- ProseMirror read-only 모드에서 React synthetic event(onClick/onMouseDown)가 에디터 DOM에서 parent로 bubble 안 됨 → native addEventListener 필요
- ProseMirror handleClick prop은 atom 노드(@mention)에 대해 잘 안 됨 → handleDOMEvents.mousedown이 더 확실
- 호버 프리뷰에서 generateHTML은 WikilinkDecoration 등 ProseMirror 플러그인 비포함 → TipTap read-only 에디터가 더 정확한 렌더링
- note.contentJson이 IDB에 null로 저장될 수 있음 (partialize + BodyProvider hydrate 순서). BodyProvider hydrate 후 Zustand에서 읽는 게 IDB 직접 읽기보다 안정적
- data-hover-preview 속성을 가드로 사용해서 프리뷰 안 ProseMirror 이벤트 (hover/click) 재귀 방지 패턴
- mouseup 리스너 등록(el)과 해제(document) 불일치 → 메모리 누수. cleanup에서 동일 대상 사용 필수
