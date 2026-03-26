---
session_date: "2026-03-27 07:50"
project: "Plot (linear-note-plot)"
working_directory: "C:\Users\user\Desktop\linear-note-plot-"
duration_estimate: "~2 hours"
---

## Completed Work

### PR #120 — Unified Pipeline Phase 1~4
- Filter/Display/SidePanel 통합, Design Spine 토큰 수정
- Discover 추천 엔진 (keyword+tag+backlink+folder 4신호)
- SidePanel 3탭 (Detail+Discover+Peek)

### PR #121 — Board UX + 테이블 개선
- Board Trash → Tools 섹션 이동
- Floating bar: All 탭에서 Permanent Trash 추가
- Board 드래그 선택 (빈 공간에서 마우스 드래그)
- Board 드래그 후 선택 유지 (wasDragSelectingRef)
- 그룹핑 컬럼 자동 숨김 (groupBy와 동일 컬럼 제외)
- Tags 컬럼 완전 폐기
- 필터 Status shape 아이콘 적용

## Remaining Tasks
- [ ] Board 드래그 선택 사용자 테스트 필요
- [ ] Phase 5: AI-Ready Smart Export (Context Pack, Prompt Clipboard 등)
- [ ] 사이드바 뷰 / 템플릿 리디자인 / 라이브러리
- [ ] 커맨드 팔레트 확장 + 풀페이지 검색 분리
- [ ] Space별 Detail 컴포넌트 (Wiki/Graph/Calendar 전용)

## Key Decisions
- Trash = Tools (Workflow = 순수 상태 전환만)
- Tags 컬럼 폐기 (쓸모없다는 사용자 판단)
- 그룹핑 필드와 동일 컬럼 자동 숨김
- 통합 파이프라인: 데이터 모델 안 건드림, UI 패턴만 통일
- Design Spine 별도 Phase 안 함: 구조 통합에 녹임

## Technical Learnings
- data-board-card에서 closest('[data-drag-id]')가 ContextMenu wrapper 때문에 실패 → data-note-id 직접 추가로 해결
- 드래그 후 mouseup→click 전파로 선택 해제됨 → wasDragSelectingRef + requestAnimationFrame으로 1프레임 억제
