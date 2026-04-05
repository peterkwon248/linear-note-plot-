---
session_date: "2026-04-05 20:00"
project: "Plot (linear-note-plot-)"
working_directory: "C:/Users/user/Desktop/linear-note-plot-/.claude/worktrees/happy-bhabha"
duration_estimate: "~10 hours"
---

## Completed Work
- PR #152: Unresolved Links 전환 + 호버 프리뷰 TipTap 통합 + Pin UX + Note/Wiki 링크 시각 구분
- PR #153: 멘션 타입 구분 (Note:/Wiki:/#/Date:) + 핀 고정 수정 + 배경 불투명 + wiki prefix 들여쓰기
- PR #154: Quote UX 개선 (2-click) + Change link 기능 + 프리뷰 고정높이 400px + pin 강화
- PR #155: 위키 호버 프리뷰 + 시드 데이터 재구성 + Note/Wiki 정확 구분

## Remaining Tasks
- [ ] 위키 프리뷰 에디터 — WikiArticleView editable={editing} 토글, Edit 버튼 위키에도 노출
- [ ] 위키 프리뷰 헤더 메타데이터 — 블록 수 (Cube 아이콘, 정사면체 느낌), 카테고리 수. 백링크는 Link 아이콘
- [ ] 메타데이터 아이콘 클릭 → 참조 노트 목록 (backlinks 드릴다운)
- [ ] 인사이트 중앙 허브

## Key Decisions
- [[wiki:Title]] prefix로 Note/Wiki 구분. 드롭다운에서 Wiki 선택 시 자동 삽입
- 같은 제목 Note+Wiki 허용 — prefix로 정확 구분
- CSS 클래스(wikilink-wiki/stub) 기반으로 WikiArticle 직접 resolve (resolveNoteByTitle 우회)
- 프리뷰 body 고정 400px, 카드 max-h-[calc(100vh-32px)]
- Quote: 1-click 전체선택 → 2-click 인용, floating 버튼 제거
- 블록 수 아이콘: Cube (정사면체 느낌), 백링크: Link 아이콘

## Notes for Next Session
- 위키 프리뷰 에디터: WikiArticleView에 editable prop은 이미 있음. note-hover-preview에서 editing 상태를 wiki에도 전달하면 됨
- 메타데이터 클릭 → 참조 목록은 프리뷰 안에 드롭다운/패널로 구현 가능 (헤비하지 않음)
- dev 서버: port 3002, preview server ID: 721c5d86-cb8f-4306-b1df-ad169521a31b
