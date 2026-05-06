# Session Notepad (Updated: 2026-05-07 07:57)

## Critical Context

### 영구 결정 (2026-05-07)
- **Plot 2.0 PRD 폐기 → v3 mockup 채택**: 사용자가 Claude 디자인과 작업한 v3 mockup이 새 단일 비전.
- mockup 위치: `C:\Users\user\AppData\Local\Temp\plot-v3-mockup\`
- PRD: `docs/PLOT-V3-VISUAL-REFRESH-PRD.md` (v1.1, critic 검토 반영)
- 8 phase 분해 (Phase 0 cleanup + 1-7 main), 7-12주 + 1일

### 진행 상태
- Phase 0 cleanup: ✅ DONE (4 commits, store v111 → v112)
- Phase 1 tokens + typography: ✅ DONE (6 commits, --accent indigo, NOTE_STATUS desaturated, Source Serif 4)
- Phase 2 Imperial icons: ⚠️ PARTIAL (모듈 작성됨, 일부 migration. 잔존 phosphor `weight=` 5 files / 85+ occurrences)
- Phase 3+: Pending

### Q1-Q14 LOCKED 결정
- Q1 SPACE_COLORS: Plot 현재 유지 (정체성)
- Q2 --accent: v3 #5E6AD2
- Q3 NOTE_STATUS: v3 desaturated
- Q4 Studio: dark forced
- Q5 Editorial: TipTap helper
- Q6 Feature flag: 미사용
- Q7 Phase 1→2 순차
- Q8 Priority namespace 격리
- Q9 Gallery hue: noteId hash
- Q10 Editorial subtitle: Plot summary field
- Q11 v3 modes: Notes list만
- Q12 Studio: SRS 진행도
- Q13 view-switcher: workspace header
- Q14 keyboard: qa-tester 수동

### 영구 보존 (v3와 무관)
- "Gentle by default, powerful when needed"
- Note/Wiki 2-entity 영구 분리
- LLM/API 미사용
- Note split = UniqueID
- Plot --priority-* 5-tier (v3와 별도 namespace)

## Active Tasks

### 🔴 다음 세션 1순위
- [ ] **Phase 2 마무리** (0.5일): 잔존 phosphor `weight=` props 제거 + lucide/iconoir/tabler/remixicon → Imperial. 5 files / 85+ occurrences.
  - executor 위임. `.omc/plans/v3-phosphor-inventory.md` 참조.
  - 파일: calendar-view.tsx, display-panel.tsx, filter-bar.tsx, board-workbench.tsx, color-picker-grid.tsx 외.

### 🟡 그 다음
- [ ] Phase 3 plan 작성 (`.omc/plans/v3-phase-3-activity-sidebar.md`) → 구현 (1-2주, 시각 변화 첫 큰 단계)
- [ ] Phase 4-7 (PRD §11 timeline 참조)

### 🟢 검증
- [ ] Visual smoke test: `npm run dev` 후 /home, /notes, /inbox 등에서 --accent indigo + NOTE_STATUS desaturated 확인

## Blockers

- 없음. tsc 0 errors, build clean, 185 tests pass.

## Quick References

- v3 mockup: `C:\Users\user\AppData\Local\Temp\plot-v3-mockup\`
- PRD: `docs/PLOT-V3-VISUAL-REFRESH-PRD.md`
- Plans: `.omc/plans/v3-phase-{0,1}-*.md`, `v3-phosphor-inventory.md`, `v3-tsc-errors-classified.md`
- Imperial 모듈: `components/icons/imperial.tsx`, `imperial-extras.tsx`
- _legacy 정책: `components/_legacy/README.md`
- Store: v112 (v111 → v112 Phase 0)
- Branch: `claude/unruffled-boyd-2b9c53` (push 대기)
- Default branch: `main` (NOT master)
