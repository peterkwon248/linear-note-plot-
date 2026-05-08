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

---

## 9. Lessons learned (PR #282 → #283 → #284 cycle, 2026-05-08)

### 9.1 `.a-th, .a-row`는 notes-table 전용 grid template
PR #282로 tags/labels-view에 `.a-th + .a-row` 적용했더니 layout 깨짐 (#283으로 revert). 원인: globals.css에서

```css
.a-th, .a-row {
  display: grid;
  grid-template-columns: minmax(0, 2.4fr) minmax(0, 1.3fr) 110px 90px 70px 80px;
  ...
}
```

이 6-column 정의가 notes-table의 column set에 hardcoded. NotesTable은 inline `gridTemplateColumns` style로 덮어써서 OK. 단 다른 view (3-element flex row)는 inline 없음 → 6-col 강제 → name이 좁은 110px 컬럼에 wrap.

**Refactor 필요**: globals.css `.a-th, .a-row`를 chrome-only (height/border/sticky/bg/font-size)로 분리. grid template는 consumer (notes-table) 책임.

### 9.2 Filter model 통찰 (사용자 직관)

```
LIST/TABLE: column = passive attribute 노출 (visual scan, sort)
            Filter button = column 외 또는 active narrow

BOARD:      column 자체 = grouping attribute (status)
            Filter button = 다른 axis로 좁히기

GRID:       card 안 chip = attribute visualization
            Filter button = chip 클릭 또는 popover로 좁히기
```

**함의**:
- Notes table에 Filter button 있는 이유: column(Status/Folder/Backlinks 등) 외 다른 axis (Tag, Label, Source)로 좁히기
- Tags master에 Filter button 없는 이유: column 자체가 단순 (Name + Notes만) — column으로 노출할 attribute가 적음 → filter도 부족
- **Tags 잠재 확장**: `color`, `source` (manual/auto-extract) 등 column 추가 시 filter도 자연스레 가능

이 model이 PR 4.3 chrome 통일의 north star — 단순 visual 통일이 아니라 **filter/column model 통일**.

### 9.3 Visual 일관성 미세 항목

| 항목 | Notes table | Tags/Labels (현) | 통일 방향 |
|------|------------|-----------------|----------|
| row 폰트 | 13px (`.a-row`) | `text-ui` (살짝 큼) | `.a-row` font-size 통일 (refactor 후) |
| row 사이 구분선 | 없음 (hover bg + spacing) | `border-b border/50` (Tags만) | 제거 (Notes 패턴) — **#284에서 처리** |
| row height | 38px | py-2.5 (varying) | `.a-row` 38px 통일 (refactor 후) |
| row hover | bg-hover-bg | bg-hover-bg | OK |
| active row | 좌측 2px bar (`::before`) | bg-accent (multi-check만) | column 추가 시 active row 통일 가능 |

---

## 10. Roadmap (revised after #283 revert)

### Phase 4.3 재정의 (3-step)

```
Step A: globals.css refactor
   ↓
   `.a-th, .a-row` 정의에서 grid template 분리 → chrome-only
   NotesTable은 inline grid 사용 (이미 그러는 듯)
   다른 view에 plug-and-play 가능

Step B: Tags + Labels chrome 통일 (#282 재시도)
   ↓
   `.a-th + .a-row` 적용 — 이번엔 grid 강제 안 받음
   폰트 / row height 자동 통일

Step C: column model 도입 (선택)
   ↓
   Tags 등에 displayProperties 확장 (color / source 등)
   Filter button 자동 활성화 가능 (column 기반 옵션 생성)

Step D: 다른 view 확장
   ↓
   wiki-list / library / templates / stickers
```

### 즉시 fix 항목 (#284)

- ✅ Tags row의 `border-b border/50` 제거 (Notes 패턴 일관)
- ⏳ 폰트 통일 — refactor 후 자동 (Step A 완료 후)
- ⏳ 다른 view chrome — Step B 이후

다음 세션 우선순위:
- **Step A** (`.a-th/.a-row` grid 분리) — 1차 PR, 작은 refactor
- **Step B** (Tags/Labels 재적용) — 2차 PR, Step A에 의존
- Step C, D — 그 후

### Out of scope (현 plan 외)

- Studio + Editorial 제거 (별도 PR — 영구 규칙 위반 cleanup)
- Gallery polishing (별도 PR — 편집 + Plot tokens)
- view modes ViewSwitcher 단순화 (Display popover 통합) — Gallery polish 후

---

## 11. Filter coverage 분석 (entity별, 2026-05-08)

사용자 직관: "태그든 템플릿이든 라벨이든, 레퍼런시스든, 파일이든 다 필터랑 디스플레이 있어야 되는 거 아니냐?"

### 11.1 현 상태 점검 (lib/view-engine/view-configs.tsx)

| View | showFilter | filterCategories | 도메인 평가 |
|------|-----------|------------------|------------|
| **Notes** | ✅ true | 풍부 (status/folder/tag/label/source/dates...) | workflow entity, OK |
| **Wiki** | ✅ true | 풍부 | workflow entity, OK |
| **Wiki Category** | ✅ true | 일부 (사용자: "부실") | 보강 필요 |
| **Calendar** | ✅ true | 풍부 | OK |
| **Templates** | ✅ true | 풍부 | OK |
| **Graph** | ✅ true | 풍부 | OK |
| **Tags** | ❌ false | `[]` | color/source 가능 |
| **Labels** | ❌ false | `[]` | color 가능 |
| **References** | ❌ false | `[]` | **type 가능 (book/article/url/quote)** |
| **Files** | ❌ false | `[]` | **type 가능 (image/url/file), size range** |
| **Stickers** | ❌ false | `[]` | hasMembers / member entity type |
| **Inbox** | ❌ false | `[]` | source (note-stone/wiki-stub/srs-due/snooze-expired) |
| **Insights** | ❌ false | `[]` | analytics — filter 의미 X (의도) |

**관찰**:
- Display는 모두 `true` (universal) — 이미 일관 ✅
- Filter는 entity별 차이 — 일부는 도메인상 가치 있는데도 비어있음

### 11.2 도메인별 채울 수 있는 Filter (우선순위)

#### 🟢 명확하게 가치 있음 (workflow / strong attribute)

| Entity | 추가 filter | 가치 근거 |
|--------|------------|----------|
| **References** | type (book/article/url/quote), hasFields(boolean), fieldKey | type별 분류는 Reference 사용 패턴의 핵심 |
| **Files** | type (image/url/file), size range, hasPreview | visual scan ↑, 100+ files 시 type filter 필수 |
| **Wiki Category** | hasWikis(boolean), color, parent | 현재 부실 — 사용자 직접 우려 |
| **Inbox** | source (note-stone/wiki-stub/srs-due/snooze-expired), unread | 처리 대기 분류 |

#### 🟡 일관성 위해 추가 (도메인 빈약하지만 가치 있음)

| Entity | 추가 filter | 가치 근거 |
|--------|------------|----------|
| **Tags** | color (set/unset, 또는 specific), source (manual/auto-extract — 기능 있을 시) | v109 opt-in color 활용 |
| **Labels** | color (similar) | Tags 동일 패턴 |
| **Stickers** | hasMembers, member entity type | 도메인 평가 후 |

#### ❌ Filter 없는 게 자연스러움
- **Insights** — analytics dashboard, 도메인상 filter 무의미

### 11.3 Step series (Section 10 확장)

```
Step 1: Files type filter 추가 (image/url/file)
   → 가장 명확한 도메인 가치 + 즉시 visual scan ↑
Step 2: References type filter 추가
   → 도메인 명확
Step 3: Wiki Category filter 보강 (부실 → 풍부)
   → 사용자 직접 우려한 항목
Step 4: Tags / Labels color filter (선택)
   → v109 opt-in color 활용
Step 5: Stickers / Inbox filter (선택)
   → 도메인 평가 후 진행
```

각 Step은 view-engine config 변경만 — chrome refactor (Step A/B)와 독립. **빠른 PR 시리즈 가능**.

### 11.4 Phase 4 north star 정합

이 분석은 9.2 Filter model 통찰의 직접 적용:
- LIST/TABLE에서 **column = passive view, Filter button = active narrow**
- 도메인 attribute가 있으면 column으로 노출 + filter로 좁히기 가능
- "filter button 없는 view"는 도메인상 attribute가 부족한 경우만 (Insights)

→ Filter coverage 보강 = column model 확장의 자연스러운 partner.

### 11.5 머지된 PR cycle (2026-05-08)

| PR | 작업 |
|----|------|
| #271 | Status icons + Block label + Cuboid + Save view 16px |
| #282 | PR 4.3a Tags+Labels chrome 통일 (시도) |
| #283 | PR #282 partial revert (`.a-row` grid 충돌) |
| #284 | Tags row border-b 제거 + plan update (column model + 3-step roadmap) |
| (이 PR) | plan update — Filter coverage 분석 (Step 1-5 추가) |

