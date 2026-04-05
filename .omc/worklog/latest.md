---
session_date: "2026-04-05 12:00"
project: "Plot (linear-note-plot-)"
working_directory: "C:/Users/user/Desktop/linear-note-plot-/.claude/worktrees/happy-bhabha"
duration_estimate: "~3 hours"
---

## Completed Work
- Unresolved Links 전환 — "Red Links"→"Unresolved Links" 리브랜딩 (11파일), Wiki Red Links UI 제거
- Dangling wikilink: red→gray 색상, 좌클릭 Create Note+Wiki 드롭다운
- 호버 프리뷰 TipTap 통합 — generateHTML 폐기, 항상 NoteEditorAdapter(editable 토글)
- 호버 프리뷰 Pin UX — 모듈 레벨 상태, 위키링크/멘션 클릭 토글, accent 테두리+PushPin
- data-hover-preview 가드 (프리뷰 안 재귀 방지)
- 4-way wikilink 시각 구분: Note=보라밑줄, Wiki=teal칩, Stub=amber점선, Dangling=gray점선
- [[wiki:Title]] prefix 방식 — Wiki 선택 시 자동 삽입, wiki: 숨겨짐
- Plain text copy (⋯ 메뉴 "Copy text")
- 호버 프리뷰 버그 수정 4건 (mouseup 누수, quote deps, pin bubbling, note assertion)
- 프리뷰 카드 너비 520→640px

## Remaining Tasks
- [ ] 멘션 타입 시각 구분 — @Note:, @Wiki:, @Tag: prefix. Mention extension에 mentionType 속성 + renderLabel 커스텀
- [ ] 멘션 핀 고정 재검증 — mousedown으로 변경했지만 atom 노드 특성상 추가 디버깅 필요
- [ ] 위키 호버 프리뷰 — wiki-article-view 임베드 (블록 5개 이하=전체, 6개+=목차형). noteType=wiki일 때 WikiPreviewBody 컴포넌트
- [ ] 위키 프리뷰 에디터 — wiki-article-view를 640px 카드에 임베드해서 인라인 편집
- [ ] Change link 기능 — wikilink 대상 변경 (컨텍스트 메뉴 + 노트 검색 팝업)
- [ ] 인사이트 중앙 허브 — 온톨로지 사이드바 Insights 섹션

## Key Decisions
- Red Link → "Unresolved Links" (회색 점선)
- 호버 프리뷰는 항상 TipTap (editable 토글) — generateHTML 폐기
- Note/Wiki 링크 구분: [[Title]] = note, [[wiki:Title]] = wiki. wiki: prefix는 bracket처럼 숨겨짐
- 위키 호버 프리뷰: wiki-article-view를 640px 카드에 임베드 (L1 read-only → 풀 편집)
- 블록 5개 이하=바로 전체 보여주기, 6개 이상=목차형 먼저

## Notes for Next Session
- 멘션 타입 구분이 최우선 — @tiptap/extension-mention에 mentionType 속성 추가 필요
- 위키 프리뷰는 wiki-article-view.tsx를 PreviewCard 안에 임베드 (noteType === "wiki" 분기)
- 멘션 핀은 handleDOMEvents.mousedown으로 변경했는데 동작 여부 재확인
