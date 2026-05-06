# Plot v3 Visual Refresh — PRD

> **Status**: Draft v1.1 (2026-05-07, critic-revised)
> **Author**: Prometheus (planner) + 사용자
> **Replaces**: Plot 2.0 PRD (Phase A — 11가지 결정 LOCKED) → 폐기. v3 mockup이 새 단일 비전.
> **Mockup source**: `C:\Users\user\AppData\Local\Temp\plot-v3-mockup\` (Claude 디자인과 공동 작업)

---

## 0. TL;DR

Plot은 사용자가 Claude 디자인과 공동 작업한 **v3 mockup**의 시각 언어(tokens, typography, icons, view modes, chrome)를 채택한다. **데이터 모델 / 라우팅 / 상태 관리는 그대로**. 이번 작업은 순수 시각/UX 리프레시이며, **8 phase** (Phase 0 cleanup + Phase 1-7 main)에 걸쳐 점진적으로 진행된다 (예상 7-12주 + 1일, 13-19개 PR — Phase 2가 인벤토리 결과 0.5일로 단축).

핵심 변화:
- **Design tokens 전면 교체**: `app/globals.css` v3 토큰 system으로 (`--v3-priority-*` namespace로 Plot 5-tier와 분리)
- **Imperial icon kit**: phosphor-icons (실측 **2 files / 4 icons** — 인벤토리 결과 `.omc/plans/v3-phosphor-inventory.md` 참조) + 자체 SVG (`components/plot-icons.tsx` 22+ icons) + lucide/iconoir/tabler/remixicon 혼재 → Imperial (1.5px stroke, 24 viewBox, currentColor)
- **5 view modes 신규 도입**: Table / Gallery / Studio / Editorial / Graph (workspace 헤더에 segmented switcher) — Notes list 한정 (wiki/templates/library는 list-only 유지)
- **Activity bar / sidebar / 워크스페이스 헤더 reskin**: a-actbar / a-sidebar / u-head 패턴
- **Linear-style filter popover**: 2-column popover (filter type → value)

핵심 보존:
- 22-slice Zustand store, IDB persist, **v111 → v112 (Phase 0 saved view ViewMode 정렬)**
- TipTap 25+ extensions
- Next.js 16 routing, app/(app)/* 구조
- 22 hooks (view-engine 포함)
- Note/Wiki 2-entity 영구 분리
- "Gentle by default, powerful when needed"
- Plot `--priority-{high,medium,low,urgent,none}` 5-tier (v3 priority는 `--v3-priority-*` namespace로 격리)

---

## 1. Vision

> **"Plot의 데이터와 워크플로는 그대로, 시각 언어만 한 단계 위로."**

Plot은 이미 21-slice store + view-engine + TipTap editor + Note/Wiki 분리라는 **단단한 데이터 기반**을 갖춰 있다. v3 mockup은 그 위에 얹는 **새로운 시각 언어**다:

1. **Single token system** (light/dark) — 토큰 매칭이 정확해야 모든 컴포넌트가 자동으로 새 룩을 입는다
2. **Imperial icon kit** — 1.5px stroke / 24 viewBox / currentColor의 일관된 아이콘 시스템 (현재는 phosphor "regular" + 자체 SVG + lucide + tabler가 혼재)
3. **5 view modes** — 같은 데이터를 다섯 가지 시각/맥락으로 (Table=정밀, Gallery=관조, Studio=프로페셔널, Editorial=서술, Graph=연결)
4. **Linear-grade chrome** — segmented switcher, 2-column filter popover, 정확한 spacing/radii/shadows

---

## 2. Goals

| # | Goal | Metric |
|---|------|--------|
| G1 | v3 mockup의 시각 언어를 Plot에 정확히 이식 | tokens diff < ε vs `plot-v3-tokens.css` |
| G2 | 기존 데이터/상태/라우팅 100% 보존 | store v111 → v112 마이그레이션 idempotent (Phase 0 ViewMode 정렬), app/(app)/* unchanged |
| G3 | Imperial icon kit 전체 교체 (별도 PR) | 0 phosphor-icons import (after Phase 2) |
| G4 | 5 view modes 작동 (Table/Gallery/Studio/Editorial/Graph) | 각 mode hooks/view-engine 위에 동작, view switcher 작동 (Notes list 한정 — Q11) |
| G5 | Light/dark theme 정확히 작동 | `Plot v3.html` 시각 비교 통과 (단, Studio mode 항상 dark — Q4) |
| G6 | 빌드 에러 0건 baseline 유지 | `npm run build` + `tsc --noEmit` clean (현재 0건 — `.omc/plans/v3-tsc-errors-classified.md` 참조) |
| G7 | 모든 키보드 단축키 / ARIA / 이벤트 핸들러 보존 | regression 0건 (qa-tester 인벤토리 + axe-core 검증 — Q14) |
| G8 | 점진 마이그레이션 (한 번에 다 갈아엎기 X) | 각 phase 독립 PR, revert 가능 (8 phases, Phase 0 cleanup + Phase 1-7 main) |

---

## 3. Non-Goals (이번 작업 안 함)

- API contracts / store shape / IDB schema 변경 (단, Phase 0의 `SavedView.viewMode` legacy `"table"` → `"list"` 정렬은 기존 union 정정이므로 데이터 모델 변경이 아니라 union 동기화)
- Routing 재구조화 (`app/(app)/*` 라우트 그대로)
- React 버전 swap, TipTap major upgrade, Zustand 변경
- 새 runtime dependencies 추가 (Imperial은 plain React + SVG, 외부 lib 0)
- 폴더 재구조화 (단, `_legacy/` 폴더 추가는 허용)
- 기능 삭제 — mockup에 시각 등가물 없는 기능은 **기존 UI 유지 + minimal style** 적용
- v3 mockup의 ca/cb/cc 다이렉션별 룩 (atelier/studio/editorial 단일 다이렉션) — **unified shell**만 채택
- Multi-device sync, E2E encryption, Yjs 등 sync PRD 별도 진행

### 3.1 Plot 2.0 docs 처리 정책 (Phase 7)

Plot 2.0 PRD가 폐기되었으므로 다음 docs는 Phase 7에서 `docs/.archive/`로 이동:
- `docs/PLOT-CURRENT-STATE-FOR-2.0.md`
- `docs/PLOT-2.0-NOTES.html`
- `docs/PLOT-2.0-NOTES-FINAL.html`
- `docs/PLOT-2.0-MOCKUP.html`
- `docs/UI-CONSISTENCY-AUDIT.md`

이동만 수행 (삭제 X). 향후 참조용. Phase 7 cleanup PR에서 함께 처리.

---

## 4. Constraints

### 4.1 사용자 명시 (CRITICAL)

**DO NOT**:
- API contracts, store shapes, routing 변경
- state library swap, React 버전 swap, 폴더 재구조화
- 새 runtime dependencies (icon kit는 plain React + SVG만)
- Feature 삭제. mockup에 시각 등가물 없으면 기존 UI 유지 + minimal style.

**DO**:
- 모든 event handler, 키보드 단축키, ARIA 보존
- Dark/light 테마 작동
- spacing/radii/shadows tokens 정확히 매칭
- Imperial icon kit (1.5px stroke, currentColor)

### 4.2 영구 보존 결정 (v3와 무관, 모든 phase 적용)

- "Gentle by default, powerful when needed"
- Note/Wiki 2-entity 영구 분리
- LLM/API 미사용
- Note split = UniqueID

### 4.3 보존 정책 (사용자 합의)

기존 Plot 코드를 직접 삭제 X. 점진 교체:
- **`lib/store/` 22 slice** — 그대로 (v111 migration 보존)
- **hooks (`hooks/`, `lib/view-engine/use-*-view.ts`)** — view-engine 인프라는 v3 modes의 데이터 어댑터 (Table=`use-notes-view`, Gallery=`use-notes-view` + grid mapper, Graph=`graph-filter-adapter` 그대로)
- **TipTap 25+ extensions** (`components/editor/`) — 그대로
- **routing (`app/`)** — 그대로
- **컴포넌트** — `components/_legacy/` 폴더로 이동 후 점진 교체 (한 번에 다 삭제 X)
- **CSS files** — git history에 보존, 기존 파일 교체
- **`lib/colors.ts`** — 기존 export 유지하면서 v3 token에 매핑 (PRESET_COLORS 18개, NOTE_STATUS_HEX, SPACE_COLORS 등 그대로)

### 4.4 기존 인프라 매핑 (재사용 명시)

| v3 mockup 개념 | 기존 Plot 인프라 (재사용) |
|----------------|---------------------------|
| `viewMode: 'table'` | `ViewMode = "list"` (이미 존재) |
| `viewMode: 'gallery'` | `ViewMode = "grid"` (이미 존재) |
| `viewMode: 'graph'` | `ViewMode = "graph"` (이미 존재) |
| `viewMode: 'studio'` | **NEW** — `VALID_VIEW_MODES`에 추가 |
| `viewMode: 'editorial'` | **NEW** — `VALID_VIEW_MODES`에 추가 |
| `D.NOTES` (mockup data) | 기존 `usePlotStore(s => s.notes)` 그대로 |
| `D.filterNotes(...)` | 기존 `lib/view-engine/filter.ts` (use-notes-view) |
| `D.groupByTime(...)` | 기존 `lib/view-engine/group.ts` (`groupBy: "date"`) |
| `D.SPACES` | 기존 `app/(app)/layout.tsx` + `lib/table-route.ts` `ActivitySpace` |
| `D.TAGS` | 기존 `useTagsView` + tag slice |
| `--accent`, `--bg`, `--fg` | `app/globals.css` 토큰 (재명명 필요) |
| Imperial icons | **NEW** — `components/icons/imperial/*.tsx` |

---

## 5. Affected Areas Matrix

### 5.1 Mockup → 현재 Plot 컴포넌트

| v3 mockup file | 영향 받는 Plot 컴포넌트 | 변경 종류 |
|----------------|--------------------------|-----------|
| `plot-v3-tokens.css` + `plot-base.css` | `app/globals.css` | **REPLACE tokens** (semantic 매핑) |
| `imperial-ui.jsx` (icons section) | 2 files importing `@phosphor-icons/react` (실측, `.omc/plans/v3-phosphor-inventory.md`) + `components/plot-icons.tsx` 22+ custom SVG + `lucide-react` / `iconoir-react` / `@tabler/icons-react` / `@remixicon/react` 추가 사용처 | **MIGRATE** (별도 PR, Phase 2) |
| `plot-v3-a.css` (a-actbar, a-sidebar, a-workspace) | `components/activity-bar.tsx`, `components/linear-sidebar.tsx`, sidebar/workspace shell | **RESKIN** |
| `plot-v3-unified.jsx` (PlotUnified) | `app/(app)/layout.tsx` + `app/(app)/notes/page.tsx` 등 list views | **새 view-switcher 추가** (workspace header), 기존 page는 default mode로 |
| `plot-v3-unified-modes.jsx` UTableMode | `components/notes-table-view.tsx`, `components/notes-table.tsx` | **RESKIN** |
| `plot-v3-unified-modes.jsx` UGalleryMode | `components/notes-board.tsx` (board view) | **RESKIN + 새 grid 룩** |
| `plot-v3-unified-modes.jsx` UStudioMode | **NEW** — `components/views/studio-view.tsx` 신규 | **CREATE** |
| `plot-v3-unified-modes.jsx` UEditorialMode | **NEW** — `components/views/editorial-view.tsx` 신규 | **CREATE** |
| `plot-v3-unified-modes.jsx` UGraphMode | `components/ontology/ontology-graph-canvas.tsx` (단순화 룩, 기존 d3-force 보존) | **RESKIN** |
| `plot-v3-unified-modes.jsx` UDetailPanel | `components/note-detail-panel.tsx` (SmartSidePanel) | **RESKIN** (5-tab 구조 보존) |
| `plot-v3-filter.css` + `.jsx` | `components/filter-panel.tsx`, `components/filter-bar.tsx` | **REPLACE popover** (Linear 2-column) |

#### 5.1.1 추가 영향 페이지 (mockup 등가물 없음 — minimal style 유지)

v3 mockup에 직접 등가물이 없는 페이지는 **기존 UI 유지 + minimal style 적용** (Plot 토큰 시스템 통합 효과로 자동 일관성):

| 페이지 | 정책 |
|--------|------|
| `/home` | 기존 dashboard 유지, Phase 1 token 통합으로 자동 reskin |
| `/labels`, `/tags` | view-engine 통합 (이미 v110/v111 완료) — Phase 4 Table mode에 포함 |
| `/library/files`, `/library/references`, `/library/tags` | 기존 list views 유지, Phase 4 Table mode 적용 |
| `/wiki` (단독) | 기존 wiki list 유지 (Notes 5-mode와 별도 — Q11 결정 반영) |
| `/search` | 기존 검색 유지 |
| `/trash` | 기존 list 유지, Phase 4 minimal style |
| `/todos`, `/stickers` | 기존 UI 유지 |
| `/templates` | view-engine 통합 (template-c PR), Phase 4 list mode 적용 |
| `/graph-insights`, `/insights` | 기존 dashboards 유지, 토큰 자동 적용 |
| `/settings/*` 6개 (`appearance`, `backup`, `editor`, `preferences`, `shortcuts`, `sync`, `about`) | 기존 settings UI 유지 + minimal style (list view 패턴 일관). v3 mockup에 settings 등가물 없음 — 토큰 통합으로 시각만 정렬 |

**정책 요약**: v3 5-mode (Table/Gallery/Studio/Editorial/Graph)는 **Notes list 한정** (Q11). 다른 entity list는 list mode 일관 유지. Settings은 minimal style로 자동 reskin (Phase 1 token 통합 효과).

### 5.2 Token Mapping (v3 → Plot)

v3 mockup tokens (`plot-v3-tokens.css` + `plot-base.css`) → Plot tokens (`app/globals.css`):

| v3 token | Plot token (현재) | 결정 |
|----------|--------------------|------|
| `--bg` | `--background` | **rename** to `--bg` (alias 유지) |
| `--fg` | `--foreground` | **rename** to `--fg` (alias 유지) |
| `--bg-elev` | `--card`, `--popover` | merge to `--bg-elev` |
| `--soft-fg` (#52525B) | `--muted-foreground` | rename `--soft-fg`, alias 유지 |
| `--muted-fg` (#71717A) | (새 tier) | **새 토큰** |
| `--whisper-fg` (#A1A1AA) | (없음, 새 tier) | **새 토큰** (3-tier text hierarchy 도입) |
| `--accent` (#5E6AD2 light, #7C8AE7 dark) | `--accent` (#4f46e5 light, #818cf8 dark) | **CHANGE** to v3 indigo (Linear 룩) |
| `--space-notes` (#5E6AD2) | `SPACE_COLORS.notes` (#06b6d4 cyan) | **DECISION REQUIRED** — v3는 indigo, Plot은 cyan. 사용자 확정 필요 (4.2 영구 결정과 무관) |
| `--space-wiki` (#4F46E5) | `SPACE_COLORS.wiki` (#8b5cf6) | **DECISION REQUIRED** |
| `--status-inbox` (#6B7280) | `NOTE_STATUS_HEX.inbox` (#22d3ee) | v3 = neutral gray (덜 시끄러움), Plot = cyan. 사용자 확정 필요 |
| `--status-capture` (#D97706) | `.capture` (#f97316) | both orange family, v3 약간 더 brown |
| `--status-permanent` (#0E9384) | `.permanent` (#22c55e) | v3 = teal-green, Plot = pure green |
| `--priority-*` (v3) | (격리 namespace) | v3 priority는 **`--v3-priority-{high,medium,low}`** 별도 namespace로 받음. Plot `--priority-{high,medium,low,urgent,none}` 5-tier는 **그대로 보존**. 두 토큰 시스템 공존. (Q8 결정, critic C1 해결) |

#### 5.2.1 Priority namespace 격리 spec (critic C1 해결, Q8 결정)

**문제**: v3 mockup `--priority-{high,medium,low}` 3-tier가 Plot 5-tier와 같은 변수명을 사용 → 직접 덮어쓰기 시 Plot의 `urgent`/`none` 미지원, `medium`/`high`/`low` 색 강제 변경.

**결정 (Q8 = A)**: namespace 격리.
- v3 priority 토큰 → `--v3-priority-high`, `--v3-priority-medium`, `--v3-priority-low`
- Plot priority 토큰 → `--priority-high`, `--priority-medium`, `--priority-low`, `--priority-urgent`, `--priority-none` (그대로 보존)
- v3 mockup 컴포넌트 (StudioView, EditorialView, GalleryView 등 신규)는 `--v3-priority-*` 사용
- 기존 Plot 컴포넌트 (notes-table, list views 등)는 `--priority-*` 5-tier 그대로 사용

**Phase 0 cleanup**에서 `--v3-priority-{high,medium,low}` declaration 자리 마련 (값은 비어있음).
**Phase 1 token swap**에서 v3 mockup 값으로 채워넣음.

**Phase 1에서 결정 필요한 사항** (이미 §10에 명시):
1. `--accent` indigo로 변경할 것인가? (Plot 현재 #4f46e5 → v3 #5E6AD2) — **Q2 = A 채택 확정**
2. `SPACE_COLORS` 전체를 v3 팔레트로 교체할 것인가? — **Q1 = B (Plot 현재 유지) 확정**
3. `--status-*` 색을 v3 desaturated로 바꿀 것인가? — **Q3 = A (v3 채택) 확정**

(상세 결정 사항은 §10 참조)

### 5.3 Icon Migration (Phase 2 별도 PR)

**인벤토리 결과** (`.omc/plans/v3-phosphor-inventory.md`):
- `@phosphor-icons/react` 사용 — **2 files / 4 icons** (실측, 121 추정 → 정정)
  - `components/plot-icons.tsx` line 71 (BookOpen as IconWiki re-export, deprecated)
  - `components/activity-bar.tsx` lines 24-27 (Graph, Books, BookOpen, SidebarSimple)
- `components/plot-icons.tsx` 자체 SVG: **22+ custom icons** (IconHome/IconNotes/IconCalendar/IconDoc/IconFolder/IconTag/IconLabel/IconTemplate 등)
- 추가 라이브러리: `lucide-react` / `iconoir-react` / `@tabler/icons-react` / `@remixicon/react` (사용량 작음)

| 현재 Plot | Imperial 매핑 |
|-----------|---------------|
| `@phosphor-icons/react/dist/ssr/BookOpen` | `Imperial.icons.book-open` |
| `@phosphor-icons/react/dist/ssr/Graph` | `Imperial.icons.network` |
| `@phosphor-icons/react/dist/ssr/Books` | `Imperial.icons.bookshelf` |
| `@phosphor-icons/react/dist/ssr/SidebarSimple` | `Imperial.icons.sidebar` |
| `components/plot-icons.tsx` 22+ custom SVG | **MERGE** — Imperial이 동일 viewBox(24)/stroke(1.5px)/currentColor → 단일 시스템으로 통합 |
| `lucide-react` 사용처 | Imperial로 교체 |
| `iconoir-react`, `@tabler/icons-react`, `@remixicon/react` 사용처 | Imperial로 교체 (사용량 적음, 수동 매핑) |

**전략**: Imperial은 plain React + SVG (deps 0). `components/icons/imperial.tsx` 단일 파일에 모든 80+ 아이콘 export. 호출부는 `import { Search, Plus, ... } from "@/components/icons/imperial"`. Codemod로 phosphor → Imperial 일괄 변환 (별도 codemod 스크립트 작성).

#### 5.3.1 Imperial 미매핑 아이콘 처리 정책

Phase 2 codemod 후 Imperial에 매핑 불가능한 아이콘은 다음 정책 적용:
1. **자체 추가**: `components/icons/imperial-extras.tsx`에 Imperial 스타일(1.5px stroke / 24 viewBox / currentColor)로 자체 SVG 작성. Plot 도메인 아이콘 (Bookshelf, WikiBook, OntologyWide, IconNotes 등) 모두 이 파일로 통합.
2. **prop matrix 호환**: Imperial은 `weight` prop 없음 → phosphor `weight` 사용처는 `strokeWidth` prop 또는 단일 weight로 통일 (인벤토리 확인 결과 phosphor `weight="regular"` 2곳만 — 영향 미미).
3. **codemod 미매핑 리포트**: codemod 실행 결과 매핑 안 된 아이콘은 `scripts/migrate-icons-report.json`으로 출력 → 수동 매핑 후 재실행.
4. **빌드 검증**: Phase 2 acceptance criteria에 `0 phosphor / 0 lucide / 0 iconoir / 0 tabler / 0 remixicon import` 명시.

---

## 6. Phase Breakdown

### Phase 0 — Pre-flight Cleanup (NEW, critic-revised)

**목표**: Critic 발견사항 C1 (priority namespace 충돌) + C2 (ViewMode 타입 mismatch)를 Phase 1 시작 전 사전 정리.

**상세 plan**: `.omc/plans/v3-phase-0-cleanup.md`

**영향 파일**:
- `lib/types.ts` — `SavedView.viewState.viewMode` union 정정 (legacy `"table"` 제거, `"grid"` 추가)
- `lib/store/migrate.ts` — v111 → v112 마이그레이션 (saved view `"table"` → `"list"`)
- `lib/store/index.ts` — version: 111 → 112
- `lib/view-engine/defaults.ts` — `normalizeViewState`에 legacy `"table"` mapping helper
- `app/globals.css` — `--v3-priority-{high,medium,low}` declaration 자리 마련 (값 비어있음, Phase 1에서 채움)

**작업**:
1. T0.1 SavedView union 정정
2. T0.2 normalizeViewState에 legacy "table" → "list" mapping
3. T0.3 store migration v111 → v112 (idempotent)
4. T0.4 `--v3-priority-*` namespace declaration 자리 마련
5. T0.5 test verification (vitest + tsc + build)

**Acceptance criteria**:
- [ ] `SavedView.viewState.viewMode` = view-engine `ViewMode` (single source of truth)
- [ ] Migration v112 idempotent
- [ ] `--v3-priority-*` namespace 변수 자리 마련 (값 비어있음)
- [ ] `--priority-*` Plot 5-tier 그대로 보존
- [ ] 기존 tests 0 regression
- [ ] `npm run build` + `tsc --noEmit` clean

**예상 PR 수**: 1 (squash 단일)
**예상 기간**: 0.5일

---

### Phase 1 — Tokens + Base Typography (Foundation)

**목표**: 토큰 시스템을 v3에 맞춰 통합. 모든 후속 phase의 시각 변화는 자동으로 따라온다.

**영향 파일**:
- `app/globals.css` (REPLACE :root + .dark token blocks)
- `lib/colors.ts` (token alias 추가, 기존 export 보존)
- `app/layout.tsx` (font import: Geist + Geist Mono + Source Serif 4 추가)
- `tsconfig.tsbuildinfo` (regen)

**작업**:
1. **Token cascade chain 분석** (사전): 기존 `--background`, `--foreground`, `--card`, `--popover`, `--muted-foreground` 등 토큰의 사용처 매핑 → alias 정책으로 영향도 측정 (이 분석 결과는 Phase 1 시작 시 architect agent에 위임)
2. `app/globals.css`에 v3 토큰 추가 (light + dark)
3. 기존 `--background` → `--bg` 매핑 (alias로 둘 다 작동)
4. 새 토큰 추가: `--soft-fg`, `--muted-fg`, `--whisper-fg`, `--bg-elev`, `--space-*`, `--status-*`, **`--v3-priority-*`** (Phase 0에서 자리 마련된 namespace에 v3 mockup 값 채움)
5. **사용자 결정 반영** (Q1=B, Q2=A, Q3=A 확정 — §10): SPACE_COLORS Plot 유지, `--accent` v3 indigo 채택, `--status-*` v3 desaturated 채택
6. Geist + Geist Mono + Source Serif 4 font import (이미 있을 수 있음 — 검증)
7. **빌드 에러 분류 단계** (인벤토리 결과 `.omc/plans/v3-tsc-errors-classified.md` 참조 — 현재 tsc 0 errors 확인됨):
   - A: Phosphor resolution → Phase 2에서 자동 해결 (Phase 1 scope 제외)
   - B: 그 외 타입 에러 → Phase 1 scope (현재 0건)
   - C: deprecated/warning → 정리 (현재 0건)
8. 시각 비교: `npm run dev` → 기존 페이지가 새 토큰으로 자동 변경되는지 확인 (큰 변화 없어야 함, 토큰만 정리)

**Acceptance criteria**:
- [ ] `npm run build` clean
- [ ] `tsc --noEmit` 0 errors (현재 baseline 유지)
- [ ] 모든 페이지가 dark/light 모드 정상 작동
- [ ] 기존 visual regression 없음 (Q1-Q3 확정 결정에 부합)
- [ ] `--v3-priority-*` namespace에 v3 값 채워짐 (`--priority-*` Plot 5-tier 보존)
- [ ] `--accent` = `#5E6AD2` (light) / `#7C8AE7` (dark)
- [ ] shadcn/ui 컴포넌트 정상 렌더링 (alias 정책 동작 검증)

**예상 PR 수**: 1-2 (token swap + 빌드 에러 fix 분리 가능, 단 현재 build error 0건이므로 단일 PR 가능성 높음)
**예상 기간**: 3-5일

---

### Phase 2 — Imperial Icon Kit Replace (별도 PR, 0.5일 — 인벤토리 결과 trivial)

**목표**: phosphor-icons + 자체 SVG + lucide + iconoir + tabler + remixicon 6종 혼재 → Imperial 단일 시스템

**영향 파일** (인벤토리 기반):
- `components/icons/imperial.tsx` (NEW — 80+ Imperial icon exports)
- `components/icons/imperial-extras.tsx` (NEW — Plot 도메인 icons: Bookshelf, WikiBook, OntologyWide, IconNotes 등은 Imperial 시스템으로 재작성)
- **2 files** importing `@phosphor-icons/react/*` → import from `@/components/icons/imperial` (실측: `components/plot-icons.tsx` line 71, `components/activity-bar.tsx` lines 24-27)
- `components/plot-icons.tsx` → DEPRECATE → `_legacy/`로 이동, Imperial로 흡수 (단, IconWiki alias는 codemod 시 BookOpen 직접 사용으로 변환)
- lucide-react / iconoir-react / @tabler/icons-react / @remixicon/react 사용처 → Imperial로 교체
- `package.json`: phosphor-icons / lucide / iconoir / tabler / remixicon 제거 (단, 즉시 제거 X — Phase 7 QA 후)

#### 6.2.1 Phosphor prop matrix 호환 (인벤토리 기반)

| phosphor prop | 사용처 (현재) | Imperial 대응 | 정책 |
|---------------|--------------|--------------|------|
| `weight` | `activity-bar.tsx` 2곳 (`weight="regular"`) | 없음 | 단일 weight (regular) → Imperial 기본 stroke 1.5px와 일치, prop 자체 제거 |
| `size` | 사용처 다수 (`size={20}` 등) | `size` prop 그대로 | Imperial은 `width`/`height` props 사용 — codemod 시 `size={n}` → `width={n} height={n}` 변환 |
| `mirrored` | 0곳 | 없음 | 무시 |
| `color` | 0곳 (모두 currentColor implicit) | 없음 | Imperial은 currentColor only — 변경 없음 |
| `className` | 다수 | 그대로 | className은 SVG element에 그대로 전달 |
| `strokeWidth` | 미사용 | `strokeWidth` 지원 | Imperial 기본 1.5px, 필요시 override |

**작업**:
1. `components/icons/imperial.tsx` 신규 작성 (mockup `imperial-ui.jsx`의 80+ icon export, plain React)
2. Plot 도메인 아이콘 추가: `WikiBook`, `OntologyWide`, `Bookshelf` (mockup에서 직접 가져옴)
3. Codemod 스크립트 작성: `scripts/migrate-icons.ts`
   - 매핑 테이블: phosphor name → imperial name
   - AST 변환 (jscodeshift 또는 ts-morph)
   - 미매핑 아이콘 리포트
4. Codemod 실행 (121 files)
5. 수동 검토: `lucide-react`, `iconoir-react`, `@tabler/icons-react` 사용처 (적음)
6. 시각 비교: stroke width / viewBox / color 일관성 확인
7. `npm run build` + `tsc` clean

**Acceptance criteria**:
- [ ] 0 imports from `@phosphor-icons/react`
- [ ] 0 imports from `lucide-react`, `iconoir-react`, `@tabler/icons-react`, `@remixicon/react`
- [ ] 모든 아이콘이 1.5px stroke / 24 viewBox / currentColor
- [ ] 시각 regression: 기능적으로 동일 (icon size, position, color)
- [ ] dark/light 모드 정상 작동
- [ ] `npm run build` + `tsc --noEmit` clean

**Risk**: 인벤토리 결과 (`.omc/plans/v3-phosphor-inventory.md`) 위험 거의 없음 — 4 icons 모두 Imperial 매핑 가능, 수동 fix 0건. lucide/iconoir/tabler/remixicon은 별도 검증.

**예상 PR 수**: 1 (single PR, 작은 codemod)
**예상 기간**: 0.5일 (인벤토리 결과 trivial — 2 files, 4 icons, 100% Imperial 매핑)

---

### Phase 3 — Activity Bar / Sidebar Reskin

**목표**: `a-actbar` + `a-sidebar` + `a-sb-*` 패턴 적용

**영향 파일**:
- `components/activity-bar.tsx` (RESKIN)
- `components/linear-sidebar.tsx` (RESKIN — class names, 구조 보존)
- `app/(app)/layout.tsx` (shell layout grid: `var(--a-actbar-w, 72px) var(--a-sidebar-w, 240px) 1fr var(--a-detail-w, 0px)`)
- `app/globals.css` (a-* 클래스 추가)

**작업**:
1. v3 `plot-v3-a.css`의 `.a-actbar`, `.a-sidebar`, `.a-sb-head`, `.a-sb-section`, `.a-sb-link`, `.a-sb-search`, `.a-sb-foot`, `.a-icb`, `.a-kbd` 클래스를 `app/globals.css`에 통합
2. `components/activity-bar.tsx` className 교체:
   - `<aside>` → `<aside className="a-actbar">`
   - 브랜드 마크: `<div className="a-brand__mark">P</div>`
   - 각 space button: `<button className="a-ab a-ab--space" data-active={...}>`
3. `components/linear-sidebar.tsx` className 교체:
   - 헤더 → `.a-sb-head` + `.a-sb-title` + `.a-sb-dot`
   - 섹션 → `.a-sb-section` + `.a-sb-section__head`
   - 링크 → `.a-sb-link` (활성 시 `data-active="true"`)
   - 검색 → `.a-sb-search` + `<kbd className="a-kbd">⌘K</kbd>`
   - Foot → `.a-sb-foot` + `.a-sb-foot__primary`
4. shell grid 변경: `app/(app)/layout.tsx`
5. icon 교체 (Phase 2 결과 활용 — Imperial 사용)
6. 키보드 단축키 / ARIA 보존 검증 (qa-tester)

**Acceptance criteria**:
- [ ] 6 space (home/notes/wiki/calendar/ontology/library) 모두 v3 룩
- [ ] 사이드바 collapse/expand 작동
- [ ] 검색 input + ⌘K 단축키 작동
- [ ] dark/light 모드 정상
- [ ] tags/folders/labels sidebar 섹션 정상 (인라인 색 dot 포함)
- [ ] 활성 space 표시 (`data-active="true"` + box-shadow inset)
- [ ] 키보드 네비게이션 보존
- [ ] `npm run build` + `tsc --noEmit` clean

**예상 PR 수**: 2-3 (activity-bar 단독, sidebar 단독, layout grid 통합)
**예상 기간**: 1-2주

---

### Phase 4 — Table Mode Reskin (Notes / Tags / Labels list)

**목표**: 기존 list view들을 v3 `UTableMode` 룩으로

**영향 파일**:
- `components/notes-table-view.tsx`
- `components/notes-table.tsx`
- `components/notes-board.tsx` (board layout 보존, table reskin만)
- 다른 entity list views: tags-list, labels-list, folder views, wiki-list 등 (이미 view-engine 통합됨)
- `app/globals.css` (a-table, a-row, a-th, a-tg, a-tab, a-tag, a-stchip, a-tool)

**작업**:
1. v3 `plot-v3-a.css`의 `.a-tabs-row`, `.a-tabs`, `.a-tab`, `.a-table`, `.a-th`, `.a-row`, `.a-tg`, `.a-tag`, `.a-stchip`, `.a-tool`, `.a-row__icon`, `.a-row__lead`, `.a-row__pri`, `.a-links` 등 클래스를 `app/globals.css`로 이식
2. `notes-table-view.tsx` reskin:
   - 탭 row: `.a-tabs-row` (status 탭 + filter/sort/display tools)
   - Header: `.a-th` grid (Title / Tags / Status / Links / Words / Updated)
   - 행: `.a-row` 6-column grid + `data-active`
   - status chip: `.a-stchip[data-st="..."]`
   - tag chip: `.a-tag` (Hash icon + text)
   - priority bar: `.a-row__pri` (3px width 색 bar)
   - icon: `.a-row__icon[data-tone="..."]` (status별 색)
3. **Group rendering 보존** — 기존 `groupBy="date"` 결과를 `.a-tg` (group divider) 형태로 표시
4. Density 보존 (compact/default/comfortable) — `.a-row` height만 변경
5. Sort indicator (예: `.a-tool[data-active="true"]`)

**Acceptance criteria**:
- [ ] /notes, /inbox, /capture, /permanent, /pinned, /tag/[id], /label/[id], /folder/[id] 모두 v3 룩
- [ ] 그룹핑 (Today/Yesterday/This week/Older) 표시 정상
- [ ] 탭 클릭 → status filter 작동
- [ ] sort/filter/display tools 정상
- [ ] keyboard nav (j/k 등) 보존
- [ ] active row 표시 (`.a-row[data-active="true"]::before` 좌측 2px bar)
- [ ] hover bg 정상
- [ ] dark/light 모드

**예상 PR 수**: 2-3 (notes/tags/labels/wiki 페이지별 분리 가능)
**예상 기간**: 2주

---

### Phase 5 — View Switcher + 4 Modes (Gallery/Studio/Editorial/Graph)

**목표**: workspace 헤더에 view switcher 추가 + 4 mode 신규 구현

**영향 파일**:
- `lib/view-engine/types.ts` (`ViewMode` union에 `"studio"`, `"editorial"` 추가)
- `lib/view-engine/defaults.ts` (per-context default viewMode)
- `lib/view-engine/view-configs.tsx` (mode metadata: label, icon, hint)
- `components/views/view-switcher.tsx` (NEW — segmented control)
- `components/views/gallery-view.tsx` (NEW — UGalleryMode 이식)
- `components/views/studio-view.tsx` (NEW — UStudioMode 이식)
- `components/views/editorial-view.tsx` (NEW — UEditorialMode 이식)
- `components/views/graph-view-v3.tsx` (NEW — UGraphMode 이식, 기존 ontology-graph-canvas.tsx 보존하고 분리)
- `app/globals.css` (u-vs, u-mode, u-head, u-gallery, u-edit, u-studio, u-graph 등)
- `app/(app)/notes/page.tsx`, `app/(app)/inbox/page.tsx`, `app/(app)/capture/page.tsx`, `app/(app)/permanent/page.tsx`, `app/(app)/tag/[id]/page.tsx`, `app/(app)/label/[id]/page.tsx`, `app/(app)/folder/[id]/page.tsx` — view-switcher 통합

**작업**:
1. `ViewMode` enum 확장: `"list" | "board" | "grid" | "insights" | "calendar" | "graph" | "dashboard" | "studio" | "editorial"`
2. `view-configs.tsx`에 5 mode metadata: id, label, icon (Imperial), hint, defaultGroupBy 등
3. `<ViewSwitcher>` 컴포넌트: `.u-vs` segmented (Table/Gallery/Studio/Editorial/Graph) — **위치 = workspace header (`.u-head__right`)** (Q13 = A 결정 반영)
4. **NoteContent helper 함수 spec** (critic C4 해결, mockup 데이터 ↔ Plot Note 매핑):
   - `getHueFromNoteId(id: string): number` — `noteId` hash → 0-360 deterministic. Gallery cover gradient용 (Q9 = A 결정 반영). 동일 노트는 항상 동일 hue.
     ```ts
     export function getHueFromNoteId(id: string): number {
       let h = 0
       for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
       return ((h % 360) + 360) % 360
     }
     ```
   - `getSubtitle(note: Note): string` — `note.summary ?? note.preview ?? ""` (Q10 = B 결정 반영). Editorial subtitle은 `lib/types.ts:359` `summary` field 활용, fallback to `preview` (line 378).
   - `extractParagraphs(noteContentJson: TipTapDoc): string[]` — TipTap doc.toJSON()에서 paragraph 노드 텍스트 추출. Editorial body용. 빈 paragraph 제외, 최대 N개 반환.
   - `getStudioSegments(note: Note, srsState?: SRSState): number[]` — Studio mode "tracks" 시각화. **SRS 진행도 기반** (Q12 = B 결정 반영). `srsStateByNoteId[note.id]`의 `interval`/`ease`/`reps`/`due` 4-segment progress mapping. SRS 데이터 없을 시 fallback: `noteId` hash로 4-segment decorative pattern.
5. `<GalleryView>`: 기존 `useNotesView` 결과를 `.u-gallery__grid` + `.u-card`로 렌더 (cover gradient는 `getHueFromNoteId(note.id)` 기반 oklch).
6. `<StudioView>`: track list + inspector + transport bar
   - **Studio dark forced** (Q4 = A 결정 반영): Plot light/dark theme과 무관, Studio는 항상 dark (intentional design choice — pro media tool 메타포). 구현: `<div className="u-studio" data-theme="dark">` 강제 dark scope.
   - tracks 시각화: `getStudioSegments(note, srsState)` 결과 사용 (Q12 SRS 진행도)
7. `<EditorialView>`: masthead + spread (feature column + rail).
   - body 추출: `extractParagraphs(note.contentJson)` helper 사용 (Q5 = A 결정 반영, runtime 추출, schema 변경 X)
   - subtitle: `getSubtitle(note)` (Q10 = B 결정 — `note.summary` 활용)
8. `<GraphViewV3>`: SVG-based, deterministic positioning (mockup처럼). 기존 `ontology-graph-canvas.tsx` (d3-force)와 별개로 운영. Notes graph mode = 단순 SVG, Ontology page = 기존 d3-force.
9. **5-mode 적용 범위 = Notes list 한정** (Q11 = A 결정 반영):
   - Notes list pages (`/notes`, `/inbox`, `/capture`, `/permanent`, `/tag/[id]`, `/label/[id]`, `/folder/[id]`) → 5 mode 전체 지원
   - Wiki list (`/wiki`) → 기존 list 유지 (5-mode 미적용)
   - Templates / Library Tags / Library Files / Library References → list mode 일관 유지 (5-mode 미적용)
10. 각 Notes list page에 `<ViewSwitcher value={viewMode} onChange={...} />` 통합 (workspace header)
11. `useNotesView` 등은 viewMode-agnostic이므로 그대로 사용

**Acceptance criteria**:
- [ ] /notes에서 5 mode 전환 작동
- [ ] /inbox, /capture, /permanent, /tag/[id], /label/[id], /folder/[id]에서도 5 mode 작동
- [ ] /wiki, /templates, /library/* 는 list mode만 지원 (Q11 결정 반영)
- [ ] viewMode가 saved view에 저장되어 새로고침 후 복원
- [ ] active note (URL hash 등) 5 mode에 동기화
- [ ] keyboard nav (mode 전환 단축키, 노트 선택)
- [ ] Studio mode는 항상 dark (Q4 결정 반영)
- [ ] Gallery: `getHueFromNoteId(note.id)` 기반 deterministic cover gradient (Q9 결정 반영)
- [ ] Editorial: `extractParagraphs` 추출 정확, `getSubtitle` 활용 (Q5/Q10 결정 반영)
- [ ] Studio segments: `srsStateByNoteId` 기반 4-segment SRS 진행도 (Q12 결정 반영, SRS 없으면 hash fallback)
- [ ] Graph: 노드 클릭 → active 변경
- [ ] Detail panel은 mode-agnostic (UDetailPanel 룩으로 reskin)
- [ ] view-switcher 위치 = workspace header (Q13 결정 반영)
- [ ] **view-engine tests 0 regression** (existing pipeline tests must pass — critic W6 해결)

**Risk**:
- Studio mode SRS 데이터 부재: `srsStateByNoteId[note.id]`가 없는 노트도 다수 → fallback 디자인 (decorative hash pattern) 명시 (Q12 SRS spec)
- Editorial body 추출: TipTap doc.toJSON()에서 paragraph 노드 추출 helper의 정확성 → 단위 테스트 필수
- Graph view 두 개 공존: ontology-graph-canvas.tsx (d3-force, /ontology page) vs graph-view-v3.tsx (SVG, list page mode). 명확히 분리
- helper 함수 신규 추가는 view-engine 외부에 위치 (`lib/v3-helpers.ts` 또는 `components/views/_helpers.ts`) — view-engine 순수성 유지

**예상 PR 수**: 4-5 (Gallery 단독, Studio 단독, Editorial 단독, Graph 단독, view-switcher integration)
**예상 기간**: 3-4주

---

### Phase 6 — Filter Popover + Workspace Chrome

**목표**: Linear-style 2-column filter popover + workspace 헤더 (`u-head`) reskin + Detail panel reskin

**영향 파일**:
- `components/filter-panel.tsx` (REPLACE → Linear 2-column popover)
- `components/filter-bar.tsx` (RESKIN inline filter chips)
- `components/note-detail-panel.tsx` (RESKIN to `.a-detail` + `.u-card`-flavor stats)
- workspace 헤더 — 각 page에서 `<u-head>`로 통합 (`.u-head__left` title + sub, `.u-head__right` filter+switcher+notif+detail toggle)
- `app/globals.css` (.pf-*, .u-head, .a-detail)

**작업**:
1. `<FilterPopover>` 신규 (Linear-style 2-column):
   - Column 1: filter type (Status, Priority, Tags, Folders, Date, Links 등)
   - Column 2: hover된 type의 옵션들 (각 옵션 토글 가능)
   - 기존 `lib/view-engine/filter.ts` API 그대로 사용 (FilterRule 추가/제거)
2. workspace 헤더 통합: `.u-head` + `.u-head__title` (page title) + `.u-head__sub` (count, sync status) + `.u-head__right` (filter / view-switcher / bell / detail toggle)
3. detail panel reskin (`.a-detail` + `.a-detail__group` + `.a-detail__stats` 3-stat grid)
4. SmartSidePanel 5-tab 보존 (Detail / Connections / Activity / Bookmarks / Stats)

**Acceptance criteria**:
- [ ] filter popover 2-column 정상
- [ ] 모든 filter type (status/priority/tags/folders/date/links/orphan/etc.) 작동
- [ ] active filter chips 표시 (`.a-tool[data-active="true"]`)
- [ ] detail panel 5-tab 정상
- [ ] keyboard nav 보존

**예상 PR 수**: 2-3
**예상 기간**: 1-2주

---

### Phase 7 — QA + Polish

**목표**: 회귀 검증, 시각 일치, 빌드/타입/테스트 clean, 성능 검증

**작업**:
1. **시각 회귀 검증**:
   - 사용자 (사람 검토): 주요 페이지 dark/light 시각 일치
   - 가능하면 자동 시각 회귀 (Playwright + screenshot diff) — 선택적
2. **기능 회귀 검증**:
   - qa-tester agent: 키보드 단축키 / split view / drag-and-drop / TipTap editor / 새 note 생성 / 검색 / filter / saved views
   - **키보드 단축키 인벤토리** (Q14 = A 수동 검증 결정 반영): 기존 단축키 전체 리스트업 (`⌘K` 검색, `j/k` nav, status filter shortcuts 등) → qa-tester가 5 mode 전환 후 각각 검증
   - **axe-core 자동 검증**: a11y 검증 (focus-visible, aria-* attrs, keyboard navigation). `axe-core` 도입하여 주요 페이지 자동 a11y 리포트
3. **테스트 회귀 검증** (critic W6 해결):
   - `npm run test` (Vitest) 전체 통과
   - view-engine tests 통과 (Phase 5 helper 추가 후 0 regression)
   - saved-view tests 통과 (Phase 0 마이그레이션 + Phase 5 viewMode 확장 후)
4. **성능 검증**:
   - 대량 데이터 (1000+ notes): Table mode rendering, Gallery scroll, Graph layout
   - bundle size 비교 (phosphor → Imperial 절감 기대)
5. **deprecated dep 제거**:
   - `package.json`에서 `@phosphor-icons/react`, `lucide-react`, `iconoir-react`, `@tabler/icons-react`, `@remixicon/react` 제거 (Phase 2 후 안전)
6. **`_legacy/` 정리**:
   - Phase 5 후 사용처 0인 legacy 컴포넌트 삭제 (또는 다음 quarter로 연기)
7. **Plot 2.0 docs archive** (§3.1 정책 반영):
   - `docs/PLOT-CURRENT-STATE-FOR-2.0.md`, `docs/PLOT-2.0-NOTES.html`, `docs/PLOT-2.0-NOTES-FINAL.html`, `docs/PLOT-2.0-MOCKUP.html`, `docs/UI-CONSISTENCY-AUDIT.md` → `docs/.archive/`로 이동
8. **문서 업데이트**:
   - `docs/CONTEXT.md` v3 visual refresh 완료 명시 (store v112 명시)
   - `docs/MEMORY.md` PR 히스토리 append
   - `CLAUDE.md`: token system / icon system 안내 추가

**Acceptance criteria**:
- [ ] `npm run build` clean
- [ ] `tsc --noEmit` 0 errors
- [ ] `npm run test` (Vitest) all pass — view-engine + saved-view 0 regression
- [ ] axe-core a11y 자동 검증 통과 (주요 페이지)
- [ ] qa-tester 핵심 워크플로 + 키보드 단축키 인벤토리 검증 통과
- [ ] 시각 일치 확인 (사용자 검토)
- [ ] bundle size 감소 또는 유사 (deps 제거 후)
- [ ] Plot 2.0 docs `docs/.archive/`로 이동 완료
- [ ] CONTEXT.md / MEMORY.md / CLAUDE.md 업데이트

**예상 PR 수**: 1-2 (cleanup PR + docs PR)
**예상 기간**: 1주

---

## 7. Migration Strategy (점진적)

### 7.1 Branch / PR 전략

- 각 phase는 main에서 분기 → 머지 → 다음 phase
- 각 phase 내부 PR: squash merge
- worktree-based development (현재 워크트리 그대로)

### 7.2 Feature flag (Q6 = A 미사용 LOCKED)

**결정**: feature flag 미사용. phase별 독립 PR로 충분. 사용자 단독 개발이므로 v2/v3 토글 불필요.

각 phase는 main에 직접 머지. 각 PR은 squash merge로 revert 단위 명확.

### 7.3 Rollback 전략

각 phase는 git revert 가능 (squash merge → revert merge commit)
- 단, Phase 1 (token rename) revert 시 후속 phase 영향 큼 → Phase 1은 alias 정책으로 backward compat 유지 (`--background` AND `--bg` 둘 다 작동)

### 7.4 사용자 검토 시점

각 phase 완료 후 사용자 검토:
- Phase 0: store migration v112 동작 확인 (saved view `"table"` → `"list"` 변환)
- Phase 1: token diff 시각 변화 미세, 기능 검증
- Phase 2: 아이콘 시각 변화 (큰 변화 X, stroke width 일관성만)
- Phase 3: activity bar / sidebar 변경 — **시각적으로 큰 변화** → 사용자 확인 필수
- Phase 4: Table mode 변경 — **시각적으로 큰 변화** → 사용자 확인 필수
- Phase 5: 5 view modes — **가장 큰 변화** → mode별 사용자 검토
- Phase 6: filter popover — UX 변화 → 사용자 검토
- Phase 7: QA — 최종 사용자 컨펌

### 7.5 데이터 마이그레이션 (critic W7 해결)

본 visual refresh는 **데이터 모델 변경 없음**이 원칙. 단, 다음 두 가지 마이그레이션은 ViewMode 타입 정렬 + viewMode 확장 때문에 필요:

#### v111 → v112 (Phase 0)

- **Trigger**: `lib/store/index.ts` version: 112
- **변경**: `SavedView.viewState.viewMode === "table"` → `"list"`로 변환
- **이유**: critic C2 — `SavedView` 타입을 view-engine `ViewMode` union과 일치 (legacy `"table"` 제거, `"grid"` 지원)
- **Idempotent**: 두 번 실행해도 안전 (`"list"`인 항목은 변환 X)
- **사용자 영향**: 기존 `"table"` saved view가 `"list"` 모드로 표시. 사용자가 grid layout 원하면 `"grid"`로 직접 변경 (release note 안내)

#### v112 → v113 (Phase 5, 선택적)

- **Trigger**: Phase 5에서 `ViewMode` union에 `"studio"` / `"editorial"` 추가
- **변경**: 없음 (union 확장만 — 기존 `"list"`/`"board"`/`"grid"` 그대로 작동)
- **Idempotent**: 자동 (union 확장은 backward compatible)
- **이유**: viewMode가 unknown인 경우 `normalizeViewState`가 default로 fallback → `"studio"`/`"editorial"` 모드는 사용자가 명시적으로 선택해야 사용

#### Saved view color 호환성

- 사용자가 saved view에 저장한 color (`saved view.color`)는 그대로 보존
- 시스템 default color (예: 신규 saved view 생성 시 default)만 v3 토큰 (`--accent` `#5E6AD2`)으로 변경
- 기존 사용자 색은 영향 없음

#### View Mode 확장 시 saved view fallback

- 사용자 saved view에 저장된 viewMode가 `VALID_VIEW_MODES`에 없는 경우 (예: 다른 브랜치에서 저장된 `"editorial"`을 main에서 로드 시) → `normalizeViewState`가 base.viewMode (default = `"list"`)로 fallback
- 사용자 데이터 보존됨 (next save 시까지 저장된 viewMode는 그대로)

---

## 8. Risk Assessment

### 8.1 High-risk

| Risk | 영향 | 완화책 |
|------|------|--------|
| Phase 2 codemod 미스 (실측 2 files / 4 icons + 추가 라이브러리 lucide/iconoir/tabler/remixicon) | 빌드 깨짐, 시각 회귀 | codemod 후 미매핑 리포트 + 수동 fix + visual diff. `_legacy/` glob 제외 |
| Phase 5 Editorial body 추출 (TipTap doc → paragraphs) | Editorial mode 빈 화면 / 잘못된 텍스트 | `extractParagraphs` helper 단위 테스트 + 100노트 sampling. Q5 = A (runtime extract) 결정 적용 |
| Phase 5 Studio SRS 진행도 시각화 (Q12) | SRS 데이터 없는 노트 다수 | `getStudioSegments` fallback: SRS 없으면 noteId hash 기반 decorative 4-segment |
| Token rename collision (`--bg` vs `--background`) | 기존 컴포넌트 깨짐 | Phase 1에서 alias 정책 (둘 다 작동). Token Cascade Map으로 사전 분석 |
| Priority 토큰 충돌 (v3 3-tier vs Plot 5-tier) | Plot urgent/none 색 손실 | Phase 0에서 `--v3-priority-*` namespace 격리 (Q8 결정 적용) |
| SavedView ViewMode mismatch | saved view 사용 시 fallback 발생 가능 | Phase 0에서 v111 → v112 마이그레이션 + normalizeViewState legacy mapping (critic C2 해결) |

### 8.2 Medium-risk

| Risk | 영향 | 완화책 |
|------|------|--------|
| Phase 3 사이드바 grid 변경 시 mobile / 좁은 viewport 깨짐 | 좁은 화면에서 사이드바 표시 X | `data-sidebar="collapsed"` 패턴 활용, breakpoint 테스트 |
| 키보드 단축키 손실 | UX 회귀 | qa-tester가 매 phase 검증 + Q14 인벤토리 + axe-core |
| Imperial에 없는 도메인 아이콘 (Plot 자체 SVG 22+) | 일부 기능 아이콘 누락 | `imperial-extras.tsx` 자체 추가, Imperial 스타일 (1.5px stroke, 24 viewBox) |
| view-engine context (saved view) viewMode 호환성 | 사용자 saved view 깨짐 | Phase 0 v112 마이그레이션 + normalizeViewState fallback |
| shadcn/ui cascade 깨짐 (token alias 누락) | shadcn 컴포넌트 시각 회귀 | Phase 1 Task 1.1 Token Cascade Map 사전 분석 + 검증 |

### 8.3 Low-risk

| Risk | 영향 | 완화책 |
|------|------|--------|
| Geist font 미로드 | fallback에 의해 약간의 시각 차이 | Geist는 이미 `app/layout.tsx`에 있을 가능성 — 검증 |
| Source Serif 4 미로드 (editor + editorial) | serif 영역 fallback | system serif fallback 명시 |
| Animation timing 차이 (`--t-fast` 120ms vs `--transition-fast` 120ms) | 시각 차이 미세 | 토큰 통합 시 매칭 |

---

## 9. Success Criteria (전체)

- [ ] **G1** v3 mockup 시각 언어 정확히 이식 (token diff 0)
- [ ] **G2** 데이터/상태/라우팅 100% 보존 (store v111 → v112 idempotent migration)
- [ ] **G3** 0 phosphor-icons import (Phase 2 후, 실측 2 files / 4 icons 출발)
- [ ] **G4** 5 view modes 작동 (Phase 5 후, Notes list 한정 — Q11)
- [ ] **G5** Light/dark theme 정상 (Studio mode 항상 dark — Q4)
- [ ] **G6** `npm run build` + `tsc --noEmit` clean (현재 baseline 0건 유지)
- [ ] **G7** 키보드 단축키 / ARIA / 이벤트 핸들러 0 regression (qa-tester 인벤토리 + axe-core — Q14)
- [ ] **G8** 점진 마이그레이션 (8 phase 독립 PR, revert 가능)
- [ ] Plot `--priority-{high,medium,low,urgent,none}` 5-tier 보존 (`--v3-priority-*` namespace 격리 — Q8)
- [ ] `npm run test` (Vitest) 0 regression (view-engine + saved-view tests pass)
- [ ] 사용자 (디자인 주도자) 시각 검토 통과
- [ ] qa-tester 기능 검토 통과

---

## 10. Open Questions (사용자 결정 — 모두 LOCKED)

### Q1. SPACE_COLORS 정책 — **결정: B (Plot 현재 유지) LOCKED**

v3 mockup의 space 팔레트는 Plot 현재와 다르다:

| Space | Plot 현재 | v3 mockup |
|-------|-----------|-----------|
| home | indigo (#5e6ad2) | indigo (#5E6AD2) |
| notes | **cyan (#06b6d4)** | indigo (#5E6AD2) |
| wiki | **violet (#8b5cf6)** | indigo-purple (#4F46E5) |
| ontology | teal (#0f766e) | teal (#0E9384) |
| calendar | **pink (#ec4899)** | orange (#DC6803) |
| library | amber (#b45309) | brown-amber (#B54708) |

옵션:
- A: v3 팔레트 전체 채택
- **B (LOCKED)**: Plot 현재 팔레트 유지 (notes=cyan, calendar=pink) — Plot 색 정체성 보존
- C: 일부만 채택

### Q2. `--accent` 색 — **결정: A (v3 #5E6AD2) LOCKED**

옵션:
- **A (LOCKED)**: v3 `#5E6AD2` 채택 (Linear-style indigo)
- B: Plot `#4f46e5` 유지

### Q3. NOTE_STATUS 색 정책 — **결정: A (v3 desaturated) LOCKED**

Plot 현재 saturated (cyan/orange/green), v3 desaturated (gray-blue/brown/teal-green).

옵션:
- **A (LOCKED)**: v3 채택 ("Gentle by default" 영구 결정과 일치)
- B: Plot 현재 유지

### Q4. Studio mode dark forced 정책 — **결정: A (dark forced) LOCKED**

Studio mockup은 dark forced.

옵션:
- **A (LOCKED)**: dark forced (의도적 design choice — pro media tool 메타포)
- B: theme 따라가기

### Q5. Editorial body 데이터 — **결정: A (runtime extract) LOCKED**

옵션:
- **A (LOCKED)**: TipTap doc → paragraphs extract helper (`extractParagraphs(noteContentJson)`)
- B: 노트 모델에 `excerpt`, `body` field 추가

### Q6. Feature flag 사용 — **결정: A (미사용) LOCKED**

옵션:
- **A (LOCKED)**: feature flag 미사용. phase별 독립 PR로 충분.
- B: phase별 flag

### Q7. Phase 2 (icon migration) 별도 진행 vs Phase 1과 병렬 — **결정: A (순차) LOCKED**

옵션:
- **A (LOCKED)**: Phase 1 완료 후 Phase 2 (순차)
- B: 병렬

**권장 이유**: Phase 1의 빌드 에러 분류가 Phase 2 codemod 검증의 baseline. Phase 1 token 안정 후 Phase 2 codemod 진행해야 phosphor 매핑 누락이 token-related 시각 변화와 섞이지 않음. (현재 baseline: tsc 0 errors, build clean — `.omc/plans/v3-tsc-errors-classified.md` 참조)

---

### Q8. Priority 토큰 충돌 — **결정: A (`--v3-priority-*` namespace 격리) LOCKED**

v3 mockup `--priority-{high,medium,low}` 3-tier vs Plot `--priority-{high,medium,low,urgent,none}` 5-tier 충돌.

옵션:
- **A (LOCKED)**: v3 priority는 `--v3-priority-*` namespace로 격리. Plot 5-tier 그대로 보존.
- B: Plot 5-tier를 v3 3-tier로 단순화 (urgent/none 삭제 — 데이터 마이그레이션 필요)

**구현 위치**: Phase 0 (declaration 자리 마련) + Phase 1 (값 채움). PRD §5.2.1 spec.

### Q9. Gallery `hue` (cover gradient) — **결정: A (`noteId` hash) LOCKED**

v3 mockup의 Gallery card는 `hue` 값으로 oklch gradient 생성. Plot 노트에 hue field 없음.

옵션:
- **A (LOCKED)**: `getHueFromNoteId(noteId): number` — id hash → 0-360 deterministic. 동일 노트는 항상 동일 색.
- B: 노트 모델에 `hue` field 추가 (마이그레이션 필요)
- C: tag/folder 색 활용 (정적 mapping)

**구현 위치**: Phase 5 helper. PRD §6.5 spec.

### Q10. Editorial `subtitle` field — **결정: B (`note.summary`) LOCKED**

v3 mockup Editorial은 noteContent에 `subtitle` 사용. Plot Note에 직접 등가물 없음.

옵션:
- A: TipTap doc 첫 paragraph 추출
- **B (LOCKED)**: `note.summary ?? note.preview ?? ""` — `lib/types.ts:359` `summary` field 활용 (이미 존재, fallback to `preview` line 378)

**구현 위치**: Phase 5 `getSubtitle(note: Note)` helper.

### Q11. v3 modes 적용 범위 — **결정: A (Notes list만) LOCKED**

5-mode (Table/Gallery/Studio/Editorial/Graph)를 어디까지 적용?

옵션:
- **A (LOCKED)**: Notes list만 (`/notes`, `/inbox`, `/capture`, `/permanent`, `/tag/[id]`, `/label/[id]`, `/folder/[id]`) → 5 mode 전체. Wiki/Templates/Library는 list mode만 유지.
- B: 모든 list views에 5 mode 적용

**이유**: Note/Wiki 2-entity 영구 분리 정책. 위키는 별도 시각 언어 유지.

### Q12. Studio segments 데이터 — **결정: B (`srsStateByNoteId` SRS 진행도) LOCKED**

Studio "tracks" 시각화 데이터 source.

옵션:
- A: `noteId` hash로 decorative 4-segment (의미 없음)
- **B (LOCKED)**: `srsStateByNoteId[note.id]`의 SRS 진행도 (`interval`/`ease`/`reps`/`due`) 4-segment progress 시각화. SRS 데이터 없는 노트는 hash fallback (decorative).

**이유**: Plot Anki-lite review 워크플로 의미 부여. Studio mode = SRS 학습 진행 시각화.

**구현 위치**: Phase 5 `getStudioSegments(note, srsState)` helper.

### Q13. View-switcher 위치 — **결정: A (workspace header) LOCKED**

옵션:
- **A (LOCKED)**: workspace header (`.u-head__right`) — segmented control. v3 mockup과 일치.
- B: 사이드바 별도 panel
- C: 페이지 상단 별도 toolbar

### Q14. 키보드 단축키 검증 방식 — **결정: A (qa-tester 수동) LOCKED**

옵션:
- **A (LOCKED)**: qa-tester agent가 5 mode 전환 후 단축키 인벤토리 수동 검증
- B: 자동 e2e 테스트 추가 (Playwright + keyboard simulation)

**이유**: Plot은 사용자 단독 개발, 자동화 e2e 인프라 부재. qa-tester가 충분.

**Phase 7 Acceptance에 명시**: 단축키 인벤토리 + axe-core a11y 자동 검증 (혼합 전략).

---

## 11. Estimated Timeline

| Phase | 기간 | PR 수 | 의존성 |
|-------|------|-------|--------|
| **0. Pre-flight cleanup (NEW)** | **0.5일** | **1** | **—** |
| 1. Tokens + Typography + 빌드 fix | 3-5일 | 1-2 | Phase 0 |
| 2. Imperial icon kit | **0.5일** ↓ (인벤토리 결과) | 1 | Phase 1 |
| 3. Activity bar / sidebar reskin | 1-2주 | 2-3 | Phase 1, 2 |
| 4. Table mode reskin | 2주 | 2-3 | Phase 1, 2, 3 |
| 5. 4 view modes (Gallery/Studio/Editorial/Graph) | 3-4주 | 4-5 | Phase 1, 2, 3, 4 |
| 6. Filter popover + workspace chrome | 1-2주 | 2-3 | Phase 1, 2, 3, 4 |
| 7. QA + polish + cleanup | 1주 | 1-2 | All |

**Total**: 7-12주 + 1일 (약 2-3개월), 13-19 PR (8 phase) — 인벤토리 결과 Phase 2 1-2주에서 0.5일로 단축, 전체 1-2주 절약

---

## 12. Critic Review (완료, v1.1 revision 반영)

Critic agent 검토 완료 (2026-05-07). 발견사항 모두 PRD revision으로 해결:

### Critical findings (해결됨)

| Finding | 해결 |
|---------|------|
| **C1**: `--priority-medium` 토큰 충돌 | §5.2.1 Priority namespace 격리 spec 추가 (Q8 LOCKED). Phase 0에서 declaration 자리 마련, Phase 1에서 v3 값 채움. |
| **C2**: `ViewMode` vs `SavedView.viewMode` mismatch (`"table"`) | Phase 0 (`.omc/plans/v3-phase-0-cleanup.md`) 신규 작성. v111 → v112 마이그레이션 + normalizeViewState legacy mapping. |
| **C3**: Phosphor 121 추정 → 실측 2 files / 4 icons | §0 TL;DR + §5.3 정정. `.omc/plans/v3-phosphor-inventory.md` 인벤토리 참조. |
| **C4**: NoteContent 필드 helper spec 누락 | Phase 5 §6.5 helper spec 추가 (`getHueFromNoteId`, `getSubtitle`, `extractParagraphs`, `getStudioSegments`). Q9, Q10, Q12 결정 반영. |
| **C5**: Studio segments 의미 부재 | Q12 = B 결정 — `srsStateByNoteId` SRS 진행도 4-segment. Phase 5 Risk 섹션 업데이트. |
| **C6**: Token alias 의존성 그래프 | Phase 1 plan Task 1.1에 Token Cascade Map 분석 단계 추가. |

### Concerns (해결됨)

| Finding | 해결 |
|---------|------|
| **W1**: 누락 페이지 (settings, library/*, search 등) | §5.1.1 추가 영향 페이지 섹션 신규 |
| **W2**: phosphor prop matrix | §6.2.1 prop matrix 표 추가 |
| **W3**: 빌드 에러 분류 단계 | Phase 1 Task 1.5에 A/B/C 카테고리 분류 추가, baseline 0건 명시 |
| **W4**: `_legacy/` import 정책 | Phase 1 Task 1.7에 4 정책 명시 (codemod 제외, 신규 import 금지, deprecation 주석, 삭제 정책) |
| **W5**: Plot 2.0 docs 처리 | §3.1 Phase 7 archive 정책 명시 |
| **W6**: test coverage 영향 | Phase 5 + Phase 7 acceptance에 view-engine + saved-view tests 0 regression 명시 |
| **W7**: 데이터 마이그레이션 전략 | §7.5 데이터 마이그레이션 sub-section 신규 (v111 → v112, viewMode fallback, color 호환성) |
| **W8**: Q7 권장 이유 명확화 | §10 Q7에 baseline 분석 근거 명시 |
| **W9**: Q11 wiki entity 처리 | Phase 5 Acceptance에 Notes list 한정 명시 |
| **W10**: Phase 7 QA 자동화 | axe-core + 키보드 단축키 인벤토리 + Vitest pass 명시 |

### Strengths (유지)

- 영구 결정 분리 (§4.2)
- 보존 정책 (§4.3)
- 점진 마이그레이션 (§7)
- 인프라 매핑 (§4.4)

---

## 13. Handoff

**Phase 0 상세 plan (NEW)**: `.omc/plans/v3-phase-0-cleanup.md` — Phase 1 시작 전 prerequisite (critic C1/C2 해결)

**Phase 1 상세 plan**: `.omc/plans/v3-phase-1-tokens-typography.md`

**인벤토리 데이터** (Phase 1/2 입력):
- `.omc/plans/v3-phosphor-inventory.md` — 실측 phosphor 사용 (2 files / 4 icons)
- `.omc/plans/v3-tsc-errors-classified.md` — 실측 tsc 에러 (현재 0건)

이후 phase 진행 시 별도 plan 파일 생성:
- `.omc/plans/v3-phase-2-imperial-icons.md`
- `.omc/plans/v3-phase-3-activity-sidebar.md`
- `.omc/plans/v3-phase-4-table-mode.md`
- `.omc/plans/v3-phase-5-view-modes.md`
- `.omc/plans/v3-phase-6-filter-chrome.md`
- `.omc/plans/v3-phase-7-qa-polish.md`

각 phase plan은 executor agent 위임 가능한 형태 (영향 파일 / 작업 단위 / acceptance criteria 명확).
