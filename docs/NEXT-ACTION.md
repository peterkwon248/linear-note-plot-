# 🎯 Next Action

> **이 파일은 before-work가 가장 먼저 읽고, after-work가 마지막에 갱신한다.**
> 다음 세션 시작 시 "지금 바로 뭐 해야 하지?"의 답.
> 항상 1~3개의 immediate next action만. 큰 그림은 docs/MEMORY.md.

---

**Last Updated**: 2026-04-10 저녁 (Split-First 완성 + Calendar 리뉴얼 + 9개 view 버그 픽스 직후)

## 🎯 다음 세션 시작하면 바로 할 것

### 1. **P0-카드: FootnotesFooter 접기/펼치기 재검증**

PR #174에서 작업한 기능 — 기본 접힌 상태 `▶ FOOTNOTES (N)`, 본문 `[N]` 클릭 시 자동 펼침. 동작 재확인 필요.

- 브라우저에서 Reference가 있는 노트 열기
- Footer가 기본 접힌 상태인지 확인
- 본문 각주 `[1]` 클릭 시 자동 펼쳐지는지 확인
- 파일: `components/editor/footnotes-footer.tsx`

### 2. **P0-카드: referenceLink 노드 Shift+클릭 검증**

`[[`/`@` 드롭다운에서 url 필드 있는 Reference 선택 시 referenceLink 노드(🔗) 삽입 확인. Shift+클릭은 반대 모드.

### 3. **P0-카드: 6곳 `setSidePanelContext` UX 재평가**

Phase 3에서 `openSidePeek`를 `setSidePanelContext`로 교체한 6곳:
- `side-panel-connections.tsx` (openConnectedNote/Wiki 헬퍼)
- `wikilink-context-menu.tsx` (handlePeek)
- `note-hover-preview.tsx` (handlePeek)
- `nodes/note-embed-node.tsx` (onClick)
- `wiki-block-renderer.tsx` ("Open in side panel" 메뉴)
- `lib/note-reference-actions.ts` line 100 (regular click)

각각 실사용 관점에서 재평가:
- 정말로 "사이드 패널 Detail에 미리보기"가 맞는지
- 아니면 "secondary pane에 열기" (`openInSecondary`)가 더 자연스러운지
- 또는 일반 `openNote` 네비게이션이 나은지

sticky ctx는 이제 자동 클리어되므로 이전보다 덜 거슬리지만, 6곳이 과연 같은 전략이 맞는지 UX 관점 재검토.

## 🧠 멘탈 상태 (잊지 말 것)

- **Split-First 복귀 완료**: Phase 2~5 전체, store v74, SecondaryOpenPicker (`Cmd+Shift+\`), Focus tracking (border-t-accent)
- **Calendar 리뉴얼 완료**: Wiki 통합 (createdAt), 미니 캘린더 + Activity Heatmap, Today Wiki 카운트, view-swap 버그 픽스
- **9개 view 모두 isEditing → WorkspaceEditorArea swap 패턴 적용됨**: wiki/ontology/labels/templates/insights/graph-insights/todo/home/search (Calendar/NotesTable 제외 — 이미 있었음)
- **Sticky sidePanelContext 자동 클리어**: `setActivePane`/`openInSecondary`/`openNote`에서 ctx 클리어
- **헤더 단차 픽스**: 4개 헤더 모두 52px (`h-(--header-height)`) 통일
- **A|B 아이콘 → SplitHorizontal**: view-header의 split 버튼 + IconSplitView 자체도 A/B 텍스트 제거

## ⚠️ 이번 세션에서 쌓인 기술 debt

- **InsightsView subcomponents**: 내부에 `openNote` 호출부 3곳 더 있음 (line 120, 187). 메인 isEditing 스왑은 됐지만 secondary pane에서 InsightsView 렌더되면 그 클릭들은 여전히 primary로 감. `usePaneOpenNote`로 교체 필요 (nice-to-have)
- **ActivityHeatmap 스타일**: 최소 기능만 — 색 intensity, 클릭 점프. Tooltip/라벨/월별 구분선 등은 미완
- **Mini calendar 활동 dot**: createdAt만 집계. updatedAt 별도 레이어 표시는 미완

## 🚧 보류 (P1, P2, P3 — docs/TODO.md 참조)

- P1: Reference.history, Library/Wiki Bento Grid, Library FilterPanel
- P2: 인사이트 허브, 각주 리치 텍스트, 인포박스 고도화
- P3: 사이드패널 리디자인, 동음이의어 해소, 커맨드 팔레트 확장
