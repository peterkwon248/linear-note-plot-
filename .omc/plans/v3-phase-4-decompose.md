# Plot v3 Phase 4 — Table Mode Reskin 분해 plan

> **Phase 4 of 7** in Plot v3 visual refresh. Phase 0/1 ✅ / Phase 2 ⏸️ DEFER / Phase 3 ✅ / **Phase 4 ⏳**.
> Source: `docs/PLOT-V3-VISUAL-REFRESH-PRD.md` Phase 4 section (line 433-470).
> Mockup: `docs/v3-mockup/plot-v3-a.css` line 374-613 (table / tabs / row / tg / stchip / tag / tool).

---

## 0. Plan 메타데이터

- **상태**: Draft (2026-05-07 밤 더 늦게)
- **현재 store version**: v115 (Phase 4도 visual reskin only — store 변경 0)
- **본보기 PR**: Phase 3 (4 PR 패턴 — CSS 통합 → component reskin)
- **Plot 정체성**: "Gentle by default, powerful when needed"
- **작업 원칙**: 정확도 + 버그 위험 최소화

---

## 1. Goal

Notes / Tags / Labels list view들의 table chrome (탭 row + 헤더 + row + group divider + status chip + tag chip + tool button)을 v3 mockup 룩으로.

**Scope**:
- ✅ Visual refresh (className 교체)
- ❌ 기능 변경 X (sort / filter / view / multi-select / group / drag-and-drop 모두 보존)
- ❌ view-engine pipeline 변경 X (Group C PR-D 5/5 완성된 hooks 그대로)
- ❌ data model 변경 X

**기존 보존 (회귀 0)**:
- 모든 sort / filter / display popover
- 그룹핑 (Today/Yesterday/This week/Older 등)
- 탭 status filter
- multi-select / drag-select / context menu
- keyboard nav (j/k 등)
- dark/light mode

---

## 2. PR 분해 (3-4 PR)

### PR 4.1 — CSS 통합 (가장 안전, 시각 변경 0)

**목표**: `plot-v3-a.css` line 374-613 의 table chrome 클래스를 `app/globals.css`에 통합.

**변경 파일**:
- `app/globals.css` — v3 a-table / a-row / a-th / a-tg / a-tabs / a-tool / a-tag / a-stchip 클래스 추가

**작업**:
- 30+ 클래스 통합:
  - `.a-tabs-row`, `.a-tabs`, `.a-tab`, `.a-tab__dot`, `.a-tab__count`, `.a-tab--add`, `.a-tabs__right`
  - `.a-tool`, `.a-tool[data-active]`
  - `.a-table`, `.a-th`, `.a-th__cell`
  - `.a-tg` (group divider), `.a-tg__label`, `.a-tg__range`, `.a-tg__count`, `.a-tg__line`
  - `.a-row`, `.a-row[data-active]`, `.a-row::before` (active 좌측 bar)
  - `.a-row__lead`, `.a-row__pri`, `.a-row__emoji`, `.a-row__icon[data-tone]`
  - `.a-row__title`, `.a-row__cell`, `.a-row__tags`, `.a-row__links`, `.a-row__words`, `.a-row__updated`
  - `.a-tag`, `.a-tag--more`
  - `.a-stchip`, `.a-stchip__dot`, `.a-stchip[data-st]`

**사용 CSS variables**: 모두 globals.css 이미 있음 (Phase 1 통합) — `--bg`, `--fg`, `--border`, `--muted`, `--muted-fg`, `--whisper-fg`, `--soft-fg`, `--accent`, `--accent-soft`, `--hover-bg`, `--active-bg`, `--space-notes`, `--space-wiki`, `--status-inbox`, `--status-capture`, `--status-permanent`, `--t-fast` ✅

**Acceptance criteria**:
- [ ] tsc 0 errors / build clean / 185 tests pass
- [ ] dev server 정상 (시각 변경 0 — 클래스 추가만)

**예상 LOC**: +250 / -0

### PR 4.2 — notes-table-view.tsx + notes-table.tsx reskin

**목표**: `/notes`, `/inbox`, `/capture`, `/permanent`, `/pinned`, `/tag/[id]`, `/label/[id]`, `/folder/[id]` 페이지의 핵심 list 컴포넌트 reskin.

**변경 파일**:
- `components/notes-table-view.tsx` (탭 row + 헤더 + group divider 부모 컨테이너)
- `components/notes-table.tsx` (각 row의 cell 구성)

**작업**:
- 탭 row: `.a-tabs-row` + `.a-tabs` + `.a-tab[data-active]`
- 헤더: `.a-th` grid (Title / Tags / Status / Links / Words / Updated 6 columns)
- 행: `.a-row` 6-column grid + `data-active`
- status chip: `.a-stchip[data-st="inbox|capture|permanent"]`
- tag chip: `.a-tag` (Hash icon + text)
- priority bar: `.a-row__pri` (3px width 색 bar)
- icon: `.a-row__icon[data-tone="..."]` (status별 색)
- group divider: `.a-tg`
- tools (sort/filter/display): `.a-tool[data-active]`

**Acceptance criteria**:
- [ ] tabs status filter 작동 / hover 상태 / active border-bottom
- [ ] 그룹핑 (Today/Yesterday/This week/Older) 표시 정상
- [ ] sort indicator 정상
- [ ] active row 좌측 2px bar
- [ ] keyboard nav 보존
- [ ] tsc / build / test clean

**예상 LOC**: +200 / -180

### PR 4.3 — Other list views (tags-view / labels-view / library 등)

**목표**: Notes 외 list views도 동일 패턴.

**변경 파일** (검토 후 결정):
- `components/views/tags-view.tsx`
- `components/views/labels-view.tsx`
- `components/views/library-view.tsx` (References + Files 동거)
- `components/views/wiki-list.tsx`
- `components/views/templates-view.tsx`
- `components/views/stickers-view.tsx`

**작업**:
- 각 view의 헤더 / row / group divider에 `.a-th` / `.a-row` / `.a-tg` 적용
- 도메인별 cell (count chip / color dot 등)는 기존 그대로

**예상 LOC**: +200 / -150 (각 view마다 ~30-50 LOC 변경)

**Risk**: view마다 다른 cell 구성. 일관 적용 어려울 수 있음. PR 분할 가능.

### PR 4.4 (옵션) — Group divider / 미세 cleanup

PR 4.2/4.3 끝나고 시각 일관 안 맞는 부분 fix.

---

## 3. PR 순서

```
PR 4.1 (CSS 통합) ← 가장 안전, 시각 변경 0
   ↓
PR 4.2 (notes-table) ← 핵심, 사용자 가장 자주 보는 곳
   ↓
PR 4.3 (other list views) ← 일관성 확보
   ↓
PR 4.4 (옵션 cleanup)
```

---

## 4. Risks & Mitigations

| 리스크 | 영향 | 완화 |
|--------|------|------|
| `.a-row` 6-column grid가 Plot의 column 구성과 다름 | layout 깨짐 | view-engine `visibleColumns`와 `.a-row` grid 매핑 검증. 필요 시 grid template 동적 |
| Status chip color (status-* tokens) Plot 기존과 차이 | 색 회귀 | Phase 1 status-* 값 = v3 desaturated (Q3 LOCKED). 정합 확인 |
| Tag chip (rounded-9px) vs 기존 chip (rounded-sm) | 시각 변화 | OK — v3 mockup 채택 |
| group divider 스타일 (sticky top: 30px) | 헤더와 겹침 | sticky positioning 검증 (`a-th` height 30px과 align) |
| keyboard nav (j/k) 보존 | UX | onKeyDown 로직은 className과 독립. 보존 자동 |
| PR 4.3 scope 큼 (5+ views) | 작업 비대 | view마다 별도 PR 가능 (4.3a/4.3b 등) |

---

## 5. Out of Scope

- ❌ Phase 5 (5 view modes — Gallery/Studio/Editorial/Graph)
- ❌ Phase 6 (Filter Popover + Workspace Chrome + Shell grid)
- ❌ Board / Grid mode reskin (table only)
- ❌ Note detail panel reskin (Phase 6)
- ❌ Imperial icon kit (Phase 2 DEFER)

---

## 6. Success Criteria

### PR 별 acceptance
- 각 PR: tsc 0 / build clean / 185 tests pass / 회귀 0 / 사용자 visual confirm

### 시리즈 acceptance
- 모든 list view가 v3 table chrome
- /notes, /inbox, /capture, /permanent, /pinned, /tag, /label, /folder 모두 v3 룩
- 그룹핑 / 탭 / sort / filter / multi-select 모두 작동

### 다음 Phase
- Phase 5 (View Switcher + 4 Modes) 또는 Phase 6 (Filter Popover + Shell grid)

---

## 부록 — v3 mockup 참조 위치

- `docs/v3-mockup/plot-v3-a.css` line 374-613: table chrome 클래스
- `docs/v3-mockup/plot-v3-a-notes.jsx`: notes table 사용 예시
- `docs/PLOT-V3-VISUAL-REFRESH-PRD.md` Phase 4 section (line 433-470)
