# Plot v3 Phase 3 — Activity Bar / Sidebar Reskin 분해 plan

> **Phase 3 of 7** in Plot v3 visual refresh. Phase 0 ✅ / Phase 1 ✅ / Phase 2 ⏸️ DEFER / **Phase 3 ⏳**.
> Source: `docs/PLOT-V3-VISUAL-REFRESH-PRD.md` Phase 3 section.
> Mockup: `docs/v3-mockup/plot-v3-a.css` line 1-329 + `plot-v3-a-browse.jsx` / `plot-v3-app.jsx`.

---

## 0. Plan 메타데이터

- **상태**: Draft (2026-05-07 밤)
- **현재 store version**: v115 (Files entity index — Group C PR-D 5/5 완성)
- **본 plan store version 진화**: v115 그대로 (data model 변경 0, CSS + className만)
- **본보기 PR**: PRD §6.2 Phase 3 spec
- **Plot 정체성**: "Gentle by default, powerful when needed"
- **작업 원칙**: 정확도 + 버그 위험 최소화 (영구) — 변경 전 코드 정확히 이해, 최소 diff, 빌드/타입 검증, UI + 데이터 모델 분리 PR

---

## 1. Goal

Activity Bar (`.a-actbar`) + Sidebar (`.a-sidebar` + `.a-sb-*`) + shell layout grid를 v3 mockup 룩으로 reskin.

**Scope**:
- ✅ Visual refresh (className 교체, CSS 클래스 이식)
- ✅ Shell grid 변경 (4-column: actbar / sidebar / workspace / detail)
- ❌ 기능 변경 X (네비게이션 / 검색 / 단축키 / collapse 모두 보존)
- ❌ 데이터 모델 변경 X
- ❌ Imperial icon kit 적용 X (Phase 2 DEFER — phosphor 그대로)

**기존 보존 (회귀 0)**:
- 6 space 네비게이션 (home/notes/wiki/calendar/ontology/library)
- Notes / Wiki / Library 사이드바 섹션
- Folders / Tags / Labels 인라인 색 dot
- Sidebar collapse/expand
- 검색 + ⌘K 단축키
- 키보드 네비게이션
- dark/light mode

---

## 2. PR 분해 (4개 PR)

### PR 3.1 — CSS 통합 (가장 안전, 시각 변경 0)

**목표**: `plot-v3-a.css`의 `.a-actbar` / `.a-sidebar` / `.a-sb-*` / `.a-icb` / `.a-kbd` / `.a-detail` 클래스를 `app/globals.css`에 통합. 클래스 추가만이라 시각 변경 0.

**변경 파일**:
- `app/globals.css` — v3 a-* 클래스 단순 ADD
- (필요 시) sidebar/space-related CSS variables 추가 (PR 3.1.5에 분리 가능)

**작업**:
1. `plot-v3-a.css` line 1-329 영역 정독:
   - `.a-shell` (grid template — Plot에선 PR 3.4에서 사용)
   - `.a-actbar`, `.a-actbar__head`, `.a-actbar__toggle`
   - `.a-brand__mark`, `.a-ab`, `.a-ab__label`, `.a-ab--space`
   - `.a-sidebar`, `.a-sb-head`, `.a-sb-title`, `.a-sb-dot`, `.a-sb-actions`
   - `.a-icb`, `.a-icb--restore`
   - `.a-sb-search`, `.a-kbd`, `.a-kbd--inv`
   - `.a-sb-scroll`, `.a-sb-section`, `.a-sb-section__head`, `.a-sb-section__hint`
   - `.a-sb-link`, `.a-sb-link__count`, `.a-sb-link__dot`
   - `.a-sb-foot`, `.a-sb-foot__primary`
   - `.a-detail` (Phase 6에서 사용 예정, 일단 같이 추가 OK)
2. 사용된 CSS variables 검증:
   - 이미 있는 것: `--bg`, `--fg`, `--soft-fg`, `--bg-elev`, `--accent`, `--accent-soft`, `--muted`, `--space-notes`, `--space-home`, `--space-wiki`, `--t-fast`, `--hover-bg`
   - 추가 필요 가능성: `--sidebar-bg`, `--sidebar-fg`, `--sidebar-muted`, `--sidebar-icon`, `--sidebar-count`, `--sidebar-hover`, `--sidebar-active`, `--sidebar-active-text`, `--sidebar-border`
   - 부족한 sidebar tokens은 Plot 기존 sidebar tokens과 매핑 (alias)
3. globals.css 끝부분 또는 별도 section에 `/* ── Plot v3 Phase 3: Activity Bar / Sidebar Chrome ── */` 주석 추가 후 통합
4. shell layout vars (`--a-actbar-w`, `--a-sidebar-w`, `--a-detail-w`)는 PR 3.4에서 적용

**Acceptance criteria**:
- [ ] `app/globals.css` syntax 0 errors
- [ ] `npx tsc --noEmit` 0 errors
- [ ] `npm run build` clean (33+ routes prerendered)
- [ ] `npm run test` 185 pass (0 regression)
- [ ] dev server 정상 작동 (시각 변경 0 — 클래스 추가만, 컴포넌트 사용 X)
- [ ] 새 클래스 dev tools에서 inspect 가능

**예상 LOC**: +200 / -0 (globals.css 추가만)

---

### PR 3.2 — activity-bar.tsx reskin

**목표**: `components/activity-bar.tsx`의 className을 v3 a-actbar / a-ab / a-brand__mark로 교체.

**변경 파일**:
- `components/activity-bar.tsx`

**작업**:
1. `<aside>` → `<aside className="a-actbar">`
2. 헤더 영역: `<div className="a-actbar__head">` + brand mark `<div className="a-brand__mark">P</div>`
3. 각 space button:
   - `<button className="a-ab a-ab--space" data-active={isActive}>`
   - icon (phosphor 그대로 — Phase 2 DEFER)
   - `<span className="a-ab__label">{spaceName}</span>`
4. collapse toggle (있다면): `<button className="a-actbar__toggle">`
5. 활성 space 표시: `data-active="true"` (boolean — 그대로 boolean 유지)

**Acceptance criteria**:
- [ ] 6 space 네비게이션 정상 작동
- [ ] 활성 space `data-active="true"` 표시 (color-mix box-shadow inset)
- [ ] hover 상태 정상
- [ ] dark/light mode 정상
- [ ] 키보드 nav 보존
- [ ] tsc / build / test clean

**예상 LOC**: +30 / -25 (className 교체)

**Risk**: brand mark "P" — 사용자 확인 (Plot logo 대체로 OK한지)

---

### PR 3.3 — linear-sidebar.tsx reskin

**목표**: `components/linear-sidebar.tsx`의 className을 v3 a-sidebar / a-sb-* 클래스로 교체. Plot 컴포넌트 구조 보존, className만.

**변경 파일**:
- `components/linear-sidebar.tsx`

**작업**:
1. 컨테이너: `<aside className="a-sidebar">`
2. 헤더 영역: `<div className="a-sb-head">` + title `<div className="a-sb-title">` + dot `<div className="a-sb-dot">` + actions `<div className="a-sb-actions">`
3. 검색: `<div className="a-sb-search">` + `<input>` + `<kbd className="a-kbd">⌘K</kbd>`
4. 섹션:
   - `<div className="a-sb-section">`
   - 섹션 헤더: `<div className="a-sb-section__head">` + count `<span className="a-sb-section__hint">{n}</span>`
5. 링크 (folder/tag/label item):
   - `<button className="a-sb-link" data-active={...}>`
   - icon + label
   - count: `<span className="a-sb-link__count">{n}</span>`
   - 색 dot (folder/tag/label color): `<span className="a-sb-link__dot" style={{background: color}}>`
6. Foot:
   - `<div className="a-sb-foot">` + primary action `<button className="a-sb-foot__primary">+ New note</button>`
7. icon button: `<button className="a-icb">` (settings, more 등)

**Acceptance criteria**:
- [ ] 사이드바 네비게이션 정상
- [ ] 검색 input + ⌘K 단축키 작동
- [ ] folder / tag / label 인라인 색 dot 표시
- [ ] active link `data-active="true"` 표시
- [ ] 사이드바 collapse/expand 작동
- [ ] dark/light mode 정상
- [ ] 키보드 nav 보존
- [ ] context menu 보존 (우클릭)
- [ ] tsc / build / test clean

**예상 LOC**: +60 / -50 (className 교체 + 일부 nested div 추가)

**Risk**:
- Notes 사이드바 Folders ↔ Views 순서 (직전 결정 보존, 2026-05-05 hotfix 8 참조)
- `a-sb-search` 가 input + kbd 구조 — 기존 검색 trigger 동작 보존

---

### PR 3.4 — Shell layout grid

**목표**: `app/(app)/layout.tsx` shell grid를 v3 4-column 패턴으로 변경.

**변경 파일**:
- `app/(app)/layout.tsx` — shell grid template 변경
- `app/globals.css` — `--a-actbar-w` / `--a-sidebar-w` / `--a-detail-w` CSS vars + `.a-shell` 클래스

**작업**:
1. shell wrapper: `<div className="a-shell" data-actbar={...} data-sidebar={...} data-detail={...}>`
2. grid template: `var(--a-actbar-w, 72px) var(--a-sidebar-w, 240px) 1fr var(--a-detail-w, 0px)`
3. collapse 상태 관리:
   - `data-actbar="collapsed"` → `--a-actbar-w: 0px`
   - `data-sidebar="collapsed"` → `--a-sidebar-w: 0px`
   - `data-detail="open"` → `--a-detail-w: 320px`
4. 기존 ResizablePanel pattern은 그대로 유지하거나 v3 grid로 통일 (사용자 결정)
5. transition: `grid-template-columns 0.18s ease` (smooth collapse)

**Acceptance criteria**:
- [ ] shell layout grid 정상
- [ ] activity bar collapse/expand 작동
- [ ] sidebar collapse/expand 작동
- [ ] detail panel open/close 작동
- [ ] split view 보존 (필요 시 separate workspace)
- [ ] 기존 키보드 단축키 보존
- [ ] dark/light mode
- [ ] tsc / build / test clean

**예상 LOC**: +50 / -100 (ResizablePanel 단순화 가능)

**Risk**:
- ResizablePanel과 grid 양립 — 한 쪽 채택 결정 필요
- split view (secondary workspace) layout 변경 시 영향 큼

---

## 3. PR 순서 (의존성 + 안전성)

```
PR 3.1 (CSS 통합) ← 가장 안전, 시각 변경 0
   ↓ (CSS class 사용 가능)
PR 3.2 (activity-bar) ← single component reskin
   ↓ (visual baseline 확인 후)
PR 3.3 (linear-sidebar) ← 더 큰 component (단축키, 검색, 색 dot)
   ↓ (PR 3.3 머지 후)
PR 3.4 (shell layout grid) ← 가장 시스템적, ResizablePanel 영향
```

**병렬 가능**: PR 3.2 / 3.3 은 독립이라 병렬 작업 가능 (단 머지는 직렬). PR 3.4 는 PR 3.1-3.3 모두 머지 후.

---

## 4. Must Have / Must NOT Have

### Must Have
- [x] Plot 작업 원칙 정합 (최소 diff, 빌드/타입 검증)
- [x] 회귀 0 (검색 / 단축키 / collapse / dark mode / 키보드 nav 모두 보존)
- [x] phosphor 그대로 (Phase 2 DEFER)
- [x] dark/light mode 양쪽 검증
- [x] PR 단위 acceptance criteria 충족

### Must NOT Have
- [ ] **Imperial icon kit 적용** — Phase 2 DEFER. 새 코드도 phosphor 또는 기존 Imperial 자유
- [ ] **데이터 모델 변경** — store version 그대로
- [ ] **새 기능 추가** — visual refresh 한정
- [ ] **PR 3.1-3.4 한 PR로 묶음** — 작업 원칙 #2 (최소 diff) 위배
- [ ] **brand "P" mark 변경 가능** — 사용자 확인 후

---

## 5. Risks & Mitigations

| 리스크 | 영향 | 완화 |
|--------|------|------|
| Sidebar tokens 미스매치 (Plot 기존 vs v3) | 색 차이 | PR 3.1에서 alias 통합 (`--sidebar-bg = var(--card)` 등). dark/light 양쪽 검증 |
| ResizablePanel vs grid layout 충돌 | split view 영향 | PR 3.4 별도. 사용자 동의 후 진행 |
| 키보드 단축키 회귀 | UX | 각 PR마다 단축키 inventory 확인 (⌘K, j/k, escape, etc.) |
| Detail panel layout (Phase 6 예정) | 임시 hidden | PR 3.4에서 `data-detail="closed"` default. Phase 6에서 본격 활용 |
| brand "P" mark 디자인 결정 | 시각 정체성 | 사용자 확인 후 (PR 3.2) |

---

## 6. Out of Scope (명시적 제외)

- ❌ Imperial icon kit (Phase 2 DEFER)
- ❌ 5 view modes (Phase 5)
- ❌ Filter popover (Phase 6)
- ❌ Detail panel reskin 본격 (Phase 6)
- ❌ Table / list reskin (Phase 4)
- ❌ Plot 데이터 모델 변경
- ❌ shell grid + ResizablePanel 통합 — PR 3.4 결정사항 (사용자 동의 필요)

---

## 7. Success Criteria

### PR 별 acceptance
- 각 PR: tsc 0 errors / build clean / test 185 pass / 회귀 0 / Architect verification (필요 시)

### 시리즈 acceptance
- 4 PR 모두 머지 후 v3 chrome (activity bar / sidebar / shell grid) 완성
- 사용자 visual confirmation (dev server 직접 확인)
- 다음 Phase 4 (Table reskin) 시작 가능

### 다음 Phase
- Phase 4: Table Mode Reskin (Notes / Tags / Labels list — `.a-table`, `.a-row`, `.a-th` 클래스)
- 또는 Phase 6: Filter Popover (Linear 2-column)
- 또는 Phase 5: View Switcher + 4 Modes (가장 큰 시각 변화)

---

## 부록 A — v3 mockup 참조 위치

- `docs/v3-mockup/plot-v3-a.css` line 1-329: a-* 클래스 정의
- `docs/v3-mockup/plot-v3-app.jsx`: shell + activity-bar 사용 예시
- `docs/v3-mockup/plot-v3-a-browse.jsx`: sidebar 사용 예시
- `docs/PLOT-V3-VISUAL-REFRESH-PRD.md` Phase 3 section (line 392-431)
