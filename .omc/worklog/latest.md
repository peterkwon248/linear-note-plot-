---
session_date: "2026-04-05 21:30"
project: "Plot (linear-note-plot-)"
working_directory: "C:/Users/user/Desktop/linear-note-plot-/.claude/worktrees/happy-bhabha"
duration_estimate: "~12 hours"
---

## Completed Work (PR #152~157)
- PR #152: Unresolved Links 전환 + 호버 프리뷰 TipTap 통합 + Pin UX + Note/Wiki 링크 시각 구분
- PR #153: 멘션 타입 구분 (Note:/Wiki:/#/Date:) + 핀/배경/들여쓰기
- PR #154: Quote UX 2-click + Change link + 프리뷰 고정높이 400px + pin 강화
- PR #155: 위키 호버 프리뷰 + 시드 데이터 재구성 + Note/Wiki 정확 구분
- PR #156: 위키 프리뷰 에디터 + 메타데이터 + 이미지 ⋯ 가시성
- PR #157: 이미지 리사이즈 S/M/L + 백링크/블록/카테고리 드롭다운

## Remaining Tasks
- [ ] **P0: 인라인 에디터 블록 삭제 버그** — 호버 프리뷰 인라인 위키 에디터에서 이미지/섹션 블록 삭제 불가. 원인: 카드 overflow-hidden + Popover z-index. wiki-block-renderer.tsx Popover가 카드 밖으로 못 나감
- [ ] 인사이트 중앙 허브

## Key Decisions
- 인라인 위키 에디터에서 인포박스/참조노트는 프리뷰에 안 넣음 (C안 채택 — Open으로 wiki 공간에서 보기)
- 블록/카테고리 드롭다운은 정보 확인용 (클릭 이동 없음). 백링크만 클릭→이동

## Notes for Next Session
- 인라인 에디터 블록 삭제: overflow-hidden 문제. createPortal로 Popover를 document.body에 렌더하면 해결 가능
- dev 서버: port 3002
