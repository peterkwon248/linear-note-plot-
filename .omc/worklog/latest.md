---
session_date: "2026-04-06 07:00"
project: "Plot (linear-note-plot-)"
working_directory: "C:/Users/user/Desktop/linear-note-plot-/.claude/worktrees/happy-bhabha"
duration_estimate: "~2 hours (continuation)"
---

## Completed Work (PR #158)
- 이미지 리사이즈: S(25%)/M(50%)/L(100%) 프리셋 + 우하단 모서리 드래그. WikiBlock.imageWidth 필드
- 백링크 드롭다운: Link 아이콘 클릭 → Referenced by 노트 목록 (최대 10개)
- 블록/카테고리 드롭다운: Cube/FolderSimple 클릭 → 목록 표시
- 이미지 ⋯ 메뉴: figure 내부 배치 (이미지 크기 추적)
- 섹션 ⋯: title flex-1 제거 → 타이틀 바로 옆 배치
- 섹션 편집 UX: Untitled Section 텍스트 유지 + 커서 끝 배치
- Popover z-index: z-50 → z-[10001] (프리뷰 카드 위 정상 표시 — 블록 삭제 버그 해결)
- Change link: Note/Wiki 정확 구분 ([[wiki:]] prefix 처리)
- 카테고리 드롭다운: whitespace-nowrap + auto width

## Remaining Tasks
- [ ] **위키 Quote** — 노트에서 위키 프리뷰 내용을 Quote. WikiQuote 스키마에 sourceArticleId 추가 + QuoteNode 렌더링 wiki 분기. 작업량 1~2시간
- [ ] **인사이트 중앙 허브** — 온톨로지 사이드바 Insights 섹션

## Notes for Next Session
- 위키 Quote가 최우선. WikiQuote 스키마 변경 (sourceNoteId → sourceNoteId | sourceArticleId) + 위키 프리뷰 body에서 텍스트 선택 → Quote 삽입 경로 구현
- dev 서버: port 3002
