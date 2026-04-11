# Session Notepad (Updated: 2026-04-11 17:00)

## Critical Context
- PR #178 merged: Split-First Phase 2-5 완료 (Peek 제거 + 위키 사이드바 통합 + Context Swapping)
- 사이드바 focus-following: 기본 동작 OK, edge case 잔존 (_savedPrimaryContext 타이밍)
- Zustand activePane 구독이 SmartSidePanel에서 안 먹힘 → sidePanelContext 직접 swap으로 우회

## Active Tasks
- [ ] 사이드바 focus-following edge case 정리
- [ ] 위키 인포박스 중복 제거 (사이드바 vs 본문)
- [ ] Phase 6: Split view 통합 검증

## Blockers
- Zustand subscription 이슈 (activePane) — 원인 불명, context swapping으로 우회 중
