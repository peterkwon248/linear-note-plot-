---
session_date: "2026-04-04 22:00"
project: "Plot (linear-note-plot-)"
working_directory: "C:/Users/user/Desktop/linear-note-plot-/.claude/worktrees/intelligent-hypatia"
duration_estimate: "~4 hours"
---

## Completed Work
- before-work/after-work 개선 (worklog 필수 업데이트 + CONTEXT.md 크로스체크)
- Home 카드 → 필터 연동 (pendingFilters 인프라)
- 사이드바 "View all" → hover-only ArrowRight 아이콘
- 고아 노트 제안 시스템 (orphan-actions.ts)
- CONTEXT.md TODO 정리 (Phase 2 완료, Phase 3→P4, stubs 제거)
- Phase 4 Partial Quote (WikiQuote 8필드, quote-hash.ts, Peek/호버 Quote)
- 호버 프리뷰 리디자인 (리치 HTML + 메타 + 액션바)
- 위키링크 우클릭 컨텍스트 메뉴 (wikilink-context-menu.tsx)
- 버블 메뉴 사이즈 업 + WikiQuote 삭제 버튼

## Remaining Tasks
- [ ] "Link to..." 버그 — WikilinkSuggestion이 완성된 [[...]] 안에서 트리거됨. items()/allow() 체크 안 먹힘. suggestion 플러그인 소스 디버깅 필요
- [ ] Quote UX 단순화 — 텍스트 선택 → Quote 클릭 = 즉시 삽입 (quoteMode 제거). 현재는 Quote→드래그→Insert Quote 3단계
- [ ] 호버 프리뷰 Edit 모드 — Preview↔Edit 2모드 전환. NoteEditorAdapter editable prop 활용. Edit 시 hidePreview 비활성화, X로만 닫기
- [ ] Plain text copy — 호버 프리뷰 ⋯ 메뉴에 "Copy as text" 추가
- [ ] 위키링크 뒤 Enter 안 되는 버그 조사

## Key Decisions
- 호버 프리뷰 = 2모드 컴포넌트 (Preview + Edit). Edit = 인라인 Peek
- Quote UX는 "선택 → Quote" 2단계가 직관적 (quoteMode 3단계 폐기 예정)
- WikiQuote는 atom:true 유지 (편집 불가, 원본 보존 목적)
- "Link to..." 버그는 suggestion 플러그인 내부 이슈. allow/items 수준 체크로는 불충분

## Notes for Next Session
- "Link to..." 디버깅: @tiptap/suggestion 소스에서 char 매칭 로직 확인 필요
- 호버 프리뷰 Edit 모드: SidePanelPeek의 editing 토글 패턴 참고
- docs/CONTEXT.md의 TODO가 현재 상태와 일치하는지 다시 확인
