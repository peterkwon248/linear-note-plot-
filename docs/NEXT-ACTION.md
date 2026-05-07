# NEXT-ACTION

> **다음 세션 즉시 시작할 액션.** 다른 컴퓨터에서 작업 이어받기 위한 source of truth.
> before-work는 이 파일을 가장 먼저 읽는다.

**마지막 갱신**: 2026-05-07 (밤 늦게)
**머신**: 집 (Windows, 메인 진행)
**현재 Phase**: Plot v3 Phase 0/1 ✅, Phase 2 ⏸️ DEFER, **Phase 3 ✅ 완료** (4 PR), Phase 4+ ⏳
**Store version**: v115 (Phase 3은 visual reskin only — store 변경 0)

---

## 🎯 다음 즉시 액션

### 🔴 0. Visual Confirm 먼저 (Phase 3 큰 시각 변화)

Phase 3 (4 PR 누적) commit 후 머지됨. **사용자가 직접 dev server 띄워서 visual 확인 필요**:

```bash
cd C:\Users\kwonkyunghun\Desktop\리니어 노트앱
npm install   # 새 머신이면
npm run dev
# → http://localhost:3002/notes
```

**확인 포인트**:
1. **Activity Bar** (좌측, 72px): 네트워크 그래프 brand 로고 / 6 spaces label 표시 / per-space active 색 (cyan/violet 등)
2. **Sidebar**: hover/active 룩 (`.a-sb-link[data-active]`), folder/tag/label 인라인 색 dot, count 정렬, section 헤더 (uppercase + 0.06em letter-spacing)
3. **Sections**: Folders / Views / Tags / Labels / Stickers / Templates 정상
4. **dark/light mode** 양쪽
5. **Sidebar svg 색**: v3 mockup이 단일 cyan으로 통합 — 회귀로 보이면 fix PR 필요

**문제 발견 시**: 새 worktree 만들어 fix PR 작성. 또는 main에서 직접 fix.

**OK면**: 다음 Phase 진행.

### 🟡 1. Phase 4 또는 Phase 5 시작

Visual confirm 후 다음 Phase 결정. PRD 후보:

| Phase | 내용 | 시각 임팩트 | 예상 |
|------|------|---------|------|
| **Phase 4** | Table Mode Reskin (Notes / Tags / Labels list — `.a-table` / `.a-row` / `.a-th`) | 중 | 2주, 2-3 PR |
| **Phase 5** | View Switcher + 4 Modes (Gallery/Studio/Editorial/Graph) | 큼 (가장 큰 변화) | 3-4주, 4-5 PR |
| **Phase 6** | Filter Popover + Workspace Chrome (+ `.a-shell` grid 도입) | 중 | 1-2주, 2-3 PR |

**Phase 순서 추천**: Phase 4 (자연 흐름) → Phase 5 → Phase 6

**첫 스텝 (Phase 4 시작 시)**:
1. 새 worktree (`git worktree add ../v3-phase-4-table -b claude/v3-phase-4-table origin/main`) + EnterWorktree
2. `docs/PLOT-V3-VISUAL-REFRESH-PRD.md` Phase 4 section (line 433-470) 정독
3. `docs/v3-mockup/plot-v3-a.css`의 `.a-tabs-row` / `.a-table` / `.a-row` / `.a-th` / `.a-tg` / `.a-tag` / `.a-stchip` / `.a-tool` 영역 정독
4. Phase 4 분해 plan 작성 (`.omc/plans/v3-phase-4-decompose.md`)
5. PR 4.1 (CSS 통합) 시작

---

## 🧠 잊지 말 것 (이번 세션 핵심 결정)

### Phase 3 완료 (4 PR 누적, 2026-05-07 밤 늦게)
- **PR 3.1** (98f9277): CSS 통합 — `.a-actbar` / `.a-sidebar` / `.a-sb-*` / `.a-icb` / `.a-kbd` / `.a-detail` 통합 (시각 변경 0). +729 LOC.
- **PR 3.2** (5ac22ef): activity-bar.tsx reskin — width 44→72px / label permanent / brand mark / per-space color inline
- **PR 3.3** (8155530): linear-sidebar.tsx reskin — NavLink + Section + 11 inline button 일괄. +43/-61 (코드 18줄 감소)
- **PR 3.4** (3761e42): brand mark을 Plot 로고 SVG (네트워크 그래프 6 nodes + edges + 강조 center node)

### PR 3.4 scope 변경 결정 (영구)
- 원래 plan = `.a-shell` shell layout grid
- ResizablePanel + custom resize drag + view-split + dynamic side panel과 충돌 → **Phase 6에서 grid 도입**
- PR 3.4 = brand mark SVG 교체로 전환 (Phase 3 마무리 + 즉시 visual gain)

### Plot 6-space 색 보존 (활동바 inline override)
- v3 mockup `.a-ab--space[data-active]`는 단일 `--space-notes`
- Plot은 SPACE_COLORS 6색 — activity-bar.tsx에서 inline style로 보존 (color-mix bg + color + boxShadow inset)

### Sidebar는 단일 cyan (회귀 가능)
- v3 `.a-sb-link[data-active] svg { color: var(--space-notes); }` 단일 cyan
- visual confirm 후 회귀로 판단되면 fix PR (사이드바 svg 색 6-space 별)

### v3 mockup CSS 위치 (자주 사용)
- `docs/v3-mockup/plot-v3-a.css` — Direction A (Linear × Obsidian Hybrid) 1018 lines
- `docs/v3-mockup/plot-v3-app.jsx` / `plot-v3-a-browse.jsx` / `plot-v3-a-notes.jsx` — usage 예시

### Preview tool cwd cache 이슈
- 새 worktree에서 EnterWorktree + preview_start 시 cwd가 이전 worktree로 cache됨
- workaround: ExitWorktree(keep) → EnterWorktree → preview_start
- 아니면 manual `cd <worktree> && npm run dev`

---

## 📊 현재 Phase 진행 상황

### Plot v3 visual refresh
- ✅ Phase 0: cleanup (v112) — ViewMode "table"→"list", --v3-priority-* namespace
- ✅ Phase 1: token foundation (v3 tokens, accent #5E6AD2, status desaturated, Source Serif 4, `_legacy/` scaffold)
- ⏸️ Phase 2: Imperial icons codemod **DEFERRED** (119 files, 시각 위화감 미미)
- ✅ **Phase 3: Activity Bar / Sidebar Chrome** (4 PR — CSS / activity-bar / sidebar / brand mark logo)
- ⏳ Phase 4: Table Mode Reskin (Notes / Tags / Labels list)
- ⏳ Phase 5: View Switcher + 4 Modes (Gallery / Studio / Editorial / Graph)
- ⏳ Phase 6: Filter Popover + Workspace Chrome (+ `.a-shell` shell grid 도입)
- ⏳ Phase 7: QA + Polish

### Group C PR-D (이전 세션 완료)
- ✅ 5/5 entity (Tags v110 / Labels v111 / Stickers v113 / References v114 / Files v115)

---

## ⏸️ 보류 / 영구 폐기

- **Phase 2 (Imperial icon kit)** — DEFERRED (119 files scope, 시각 위화감 미미)
- **PR 3.4 shell grid** — Phase 6으로 통합 (ResizablePanel 충돌 회피)
- **onlook visual editor** — Plot 부적합
- **Front-End-Design-Checklist** — 중복

---

## 🔧 작업 환경

- 이번 세션 worktree: `.claude/worktrees/v3-phase-3-plan` (작업 종료 후 삭제 또는 보존)
- main: 4 commits 누적 (Phase 3) — after-work 후 머지됨
- dev server: port 3002 (webpack mode, Next.js 16.1.6)
- node_modules: 정상 install
- 디자인 skills: project-level (`.agents/skills/`)
