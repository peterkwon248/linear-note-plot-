# Session Notepad (Updated: 2026-03-19 21:00)

## Critical Context
- Architecture Redesign v2 설계 확정 (docs/architecture-redesign-v2.md)
- 코드 변경 없음, 설계만 완료. 구현은 Phase 1부터 시작
- Store = 16 slices (v40). 다음 마이그레이션: v41 (wikiStatus), v42 (workspaceMode)
- PR #82 머지 완료

## Active Tasks
- [ ] Phase 1: v41 + v42 마이그레이션 + activeSpace (table-route.ts)
- [ ] Phase 2: WorkspaceMode (setWorkspaceMode, auto-collapse)
- [ ] Phase 3: Activity Bar + Top Utility Bar (가장 임팩트 큼)

## Blockers
- 없음
