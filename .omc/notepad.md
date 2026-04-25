# Session Notepad (Updated: 2026-04-25)

## Critical Context
- **18 커밋 코멘트 시스템 대규모 구축** — 이번 세션의 핵심 결과물
- Comment 본질: **가벼운 메모** (사용자 피드백). 풀 에디터 X. 라이트 TipTap tier
- 노트/위키 인라인 코멘트 대칭 (모든 블록 8종)
- Activity/Bookmarks/Connections 사이드패널 통합
- Store v80 (Comment + Bookmark targetKind + Reflection 마이그레이션)
- 미니맵 (Document-level 드롭다운): Phosphor 아이콘 + 컬러 stripe + 섹션 번호 badge

## Active Tasks
- [ ] (별도 세션) 미니맵 G 진화: 좌측/우측 항상 보이는 미니맵
- [ ] (별도 세션) Connections 상세 추적 (어느 블록/코멘트에서 링크) — 7시간
- [ ] (필요시) TipTap 미니 에디터 추가 기능

## Blockers
- 없음. 모든 사이클 클린 마무리.

## Key Learnings (반복 활용)
- `min-w-0` on flex items: contents-driven 확장 방지
- Radix `PopoverContent`: 기본 `overflow: visible` → 명시 필요
- 글로벌 scrollbar-color: transparent → 별도 클래스로 색깔 명시
- FixedToolbar `embedded` prop: 자체 overflow/sticky 비활성화
