# Plot v3 Phase 4 — PR 4.3 (Other List Views) 분해 plan

> Phase 4 Table Mode Reskin의 마지막 PR. PR 4.1 (CSS) ✅ #267, PR 4.2 (notes-table) ✅ #276, **PR 4.3** = Notes 외 list views도 `.a-*` 통일.

---

## 0. 메타데이터

- **상태**: Draft (2026-05-08)
- **본보기**: PR 4.2 (#276) — 1 file, +78/-80, className만 교체
- **store version**: 그대로 (visual reskin only)
- **작업 원칙**: 정확도 + 버그 위험 최소화 / 최소 diff / className 교체만
- **Plot 정체성**: "Gentle by default, powerful when needed"

---

## 1. Goal

**시각 일관성** — notes-table 외 list views의 외부 chrome (헤더 / row / group divider / sort tool)을 v3 mockup `.a-*` 클래스로 통일.

**비유**: "같은 액자에 다른 그림" — chrome (액자)은 통일, 도메인 cell (그림)은 entity별로 보존.

### Scope
- ✅ Visual refresh (className 교체)
- ❌ 기능 변경 X (sort/filter/multi-select/group/drag-drop 보존)
- ❌ view-engine pipeline 변경 X (Group C PR-D 5/5 hooks 그대로)
- ❌ data model / hooks / types 변경 X
- ✅ 도메인별 cell (count chip / color dot 등) 그대로 유지

### 왜 분리?
PR 4.2 머지 후 notes-table만 v3 룩, 다른 list views는 옛 룩 — 시각 mismatch 상태. PR 4.3로 시각 통일.

---

## 2. PR 분해 (4 sub-PR, 점진적)

### PR 4.3a — Tags + Labels reskin (가장 단순, 검증 쉬움)

**파일**:
- `components/views/tags-view.tsx`
- `components/views/labels-view.tsx`

**작업**:
- 헤더 → `.a-th` + `.a-th__cell` (30px height)
- row → `.a-row` + `data-active="true"`
- group divider → `.a-tg` (있는 경우)
- count chip → 도메인별 그대로 유지 (`TagNoteCountChip` / `LabelNoteCountChip`)
- color dot (Labels) → 그대로

**예상 LOC**: +60 / -50 (각 view ~30 LOC)

### PR 4.3b — Wiki list reskin

**파일**:
- `components/views/wiki-list.tsx` (또는 components/wikis 안 list)

**작업**:
- `.a-th` / `.a-row` / `.a-tg` 적용
- Wiki entity icon (BookOpen / WikiBook) 그대로
- Wiki status (stub/article) chip 도메인 유지

**예상 LOC**: +50 / -40

### PR 4.3c — Library reskin (References + Files)

**파일**:
- `components/views/library-view.tsx`
- (관련) references-view, files-view 분리되어 있을 가능성

**작업**:
- list mode + grid mode 둘 다 `.a-*`
- thumbnail (Files), field count (References) 그대로

**예상 LOC**: +80 / -70

### PR 4.3d — Templates + Stickers reskin (옵션)

**파일**:
- `components/views/templates-view.tsx`
- `components/views/stickers-view.tsx`

**작업**:
- `.a-th` / `.a-row` 적용
- member count chip (Stickers) 그대로

**예상 LOC**: +60 / -50

---

## 3. PR 순서

```
PR 4.3a (Tags + Labels)   ← 가장 단순, 검증 쉬움
   ↓
PR 4.3b (Wiki list)       ← 다른 entity 검증
   ↓
PR 4.3c (Library)         ← 복잡 case (References + Files 동거)
   ↓
PR 4.3d (Templates + Stickers) ← 옵션
```

각 PR: tsc 0 / build clean / 185 tests pass / 회귀 0 / 사용자 visual confirm

---

## 4. Risks & Mitigations

| 리스크 | 영향 | 완화 |
|--------|------|------|
| view마다 cell 구성 다름 | 일관 적용 어려움 | PR 분할 (4.3a/b/c/d) |
| group divider 없는 view (Tags 기본 list) | 시각 불일치 | `.a-tg` 미적용, header/row만 |
| view-engine `visibleColumns` 매핑 | layout 깨짐 | grid template 동적 |
| Tags master view (sidebar list of all tags) vs detail view (특정 태그의 notes) | 작업 layer 혼선 | master view만 reskin (detail은 notes-table 재사용) |

---

## 5. Out of Scope

- ❌ Phase 5 (5 view modes — Gallery/Studio/Editorial/Graph) — 이미 main 머지 (#277-#280)
- ❌ Phase 6 (Filter Popover + Workspace Chrome + Shell grid)
- ❌ Board / Grid mode reskin (table only)
- ❌ Sidebar 변경
- ❌ Detail panel reskin

---

## 6. Success Criteria

### PR 별
- 각 PR: tsc 0 / build clean / 185 tests pass / 회귀 0 / 사용자 visual confirm

### 시리즈
- 모든 list views (Notes / Tags / Labels / Wiki / Library / Templates / Stickers)가 v3 table chrome 통일
- 시각 일관성 100% 확보

### 다음 Phase
- Phase 6 (Filter Popover + Shell grid) 또는 Phase 7

---

## 7. 작업 환경

- **worktree**: `.claude/worktrees/v3-phase-4-3`
- **branch**: `claude/v3-phase-4-3` (origin/main 9aff1d6 기반 — PR #270/#272-#281 모두 포함)
- **dev server**: 사용자 manual `npm run dev` (preview tool cwd 제약)
- **참조 PR**: PR #276 (#4.2 notes-table reskin) 본보기 패턴

---

## 8. 부록 — v3 mockup 참조 위치

- `docs/v3-mockup/plot-v3-a.css` line 374-613: table chrome 클래스
- `docs/v3-mockup/plot-v3-a-notes.jsx`: notes table 사용 예시
- `docs/PLOT-V3-VISUAL-REFRESH-PRD.md` Phase 4 section
- `.omc/plans/v3-phase-4-decompose.md`: Phase 4 분해 plan (PR 4.1/4.2/4.3 원본)
