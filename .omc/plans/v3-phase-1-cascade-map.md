# Phase 1 Token Cascade Map

> Phase 1 Task 1.1 산출물 — `app/globals.css` 토큰 → 사용처 매핑.
> alias 정책 안전성 검증.

## 1. 검증 결과 요약

| Token group | Plot 사용 여부 | v3 alias 추가 안전도 |
|-------------|---------------|---------------------|
| `--bg`, `--fg`, `--soft-fg`, `--muted-fg`, `--whisper-fg`, `--bg-elev`, `--accent-soft` (v3 신규) | **0건** (docs만) | 100% 안전 — 충돌 없음 |
| `--space-*`, `--status-*`, `--wiki-stub`, `--wiki-article` (v3 신규) | **0건** (docs만) | 100% 안전 — lib/colors.ts hex 직접 사용 중 |
| `--shadow-sm/md/lg`, `--font-2xs..3xl`, `--r-2..12`, `--t-fast/mid/slow` (v3 신규) | **0건** (docs만) | 100% 안전 |
| `--background`, `--foreground`, `--card`, `--popover`, `--muted`, `--muted-foreground`, `--accent`, `--border`, `--ring` (Plot 기존) | shadcn/ui 40+ files via Tailwind cascade (`@theme inline`) | **반드시 보존** |
| `--sidebar-*` (Plot 기존) | components/ui/sidebar.tsx, side-panel-bookmarks.tsx 등 | **반드시 보존** |
| `--editor-*` (Plot 기존) | components/note-editor.tsx, EditorStyles.css | **반드시 보존** |
| `--header-height`, `--activity-bar-width`, `--sidebar-default-width`, `--toolbar-active`, `--surface-overlay`, `--border-subtle` (Plot 기존) | components/workspace, view-header, block-drag-overlay | **반드시 보존** |
| `--priority-{high,medium,low,urgent,none}` (Plot 5-tier) | 직접 사용은 lib/colors.ts NOTE_STATUS_COLORS만 | **5-tier 완전 보존** |
| `--v3-priority-{high,medium,low}` (Phase 0에서 unset 자리 마련됨) | 0건 | Phase 1.2에서 v3 mockup 값 채움 |

## 2. shadcn/ui Cascade Chain (검증 필수)

shadcn/ui 컴포넌트들은 Tailwind class를 통해 Plot 기존 토큰을 cascading한다:

```
[shadcn/ui Tailwind class]   →   [@theme inline]    →   [:root / .dark token]
bg-background                →   --color-background  →   var(--background)
text-foreground              →   --color-foreground  →   var(--foreground)
bg-card                      →   --color-card        →   var(--card)
bg-popover                   →   --color-popover     →   var(--popover)
text-muted-foreground        →   --color-muted-foreground  →   var(--muted-foreground)
border-border                →   --color-border      →   var(--border)
ring-ring                    →   --color-ring        →   var(--ring)
bg-accent                    →   --color-accent      →   var(--accent)
bg-sidebar-*                 →   --color-sidebar-*   →   var(--sidebar-*)
```

**40+ shadcn/ui 컴포넌트 영향**: button, card, dialog, popover, select, tabs, tooltip, dropdown-menu, command, badge, alert, avatar, calendar, checkbox, context-menu, drawer, form, hover-card, input, kbd, menubar, navigation-menu, radio-group, resizable, scroll-area, sheet, sidebar, skeleton, slider, switch, table, tabs, textarea, toast, toggle, toggle-switch, item, empty, field, input-group, input-otp, chip-dropdown, button-group.

**보존 정책**: Plot 기존 토큰은 절대 삭제 X. 단, Q2 LOCKED — `--accent`만 값 변경 (`#4f46e5 → #5E6AD2` light, `#818cf8 → #7C8AE7` dark). 이는 Q2 의도된 변화.

## 3. 충돌 가능성 검증 (grep 결과)

```bash
# v3 신규 토큰 사용처 검색 (alias 충돌 검증)
grep "var(--bg)|var(--fg)|var(--soft-fg)|var(--bg-elev)|var(--accent-soft)|var(--space-|var(--status-|var(--v3-priority-|var(--shadow-|var(--r-|var(--t-fast|var(--font-2xs|var(--font-md)" --include="*.{ts,tsx,css}"

→ 0 hits in components/, app/, lib/
→ 충돌 가능성 = 0
```

## 4. Alias 정책 (Phase 1 적용)

3-Layer Token System:

```
Layer 1: v3 mockup names    (--bg, --fg, --soft-fg, --bg-elev, --accent-soft, --space-*, --status-*, --v3-priority-*)
                            ↓ ALIAS (same value)
Layer 2: Plot existing names (--background, --foreground, --muted-foreground, --card, --popover, --accent, --priority-*)
                            ↓ EXPOSE
Layer 3: Tailwind theme     (--color-background, --color-foreground, etc. via @theme inline)
```

**alias 작동 예시**:
- light: `--bg: #fafafa;` AND `--background: #fafafa;` (동일 값)
- light: `--fg: #18181b;` AND `--foreground: #18181b;` (동일 값)
- light: `--bg-elev: #ffffff;` AND `--card: #ffffff;` AND `--popover: #ffffff;` (동일 값)
- light: `--soft-fg: #52525b;` AND `--muted-foreground: #52525b;` (동일 값)
- light: `--accent: #5E6AD2;` (Q2 — 단일 토큰, 값만 변경)

**Q1 적용 (SPACE_COLORS = Plot 유지)**:
- `--space-notes: #06b6d4` (cyan, Plot)
- `--space-wiki: #8b5cf6` (violet, Plot)
- `--space-calendar: #ec4899` (pink, Plot)
- `--space-home: #5e6ad2` (Plot, v3와 일치)
- `--space-ontology: #0f766e` (Plot)
- `--space-library: #b45309` (Plot)

**Q3 적용 (NOTE_STATUS = v3 desaturated)**:
- `--status-inbox: #6B7280`
- `--status-capture: #D97706`
- `--status-permanent: #0E9384`

**Q8 적용 (Priority namespace 격리)**:
- `--v3-priority-high: #DC6803`
- `--v3-priority-medium: #5E6AD2`
- `--v3-priority-low: #98A2B3`
- `--priority-{high,medium,low,urgent,none}` Plot 5-tier 완전 보존

## 5. 회귀 위험 평가

| Risk | 평가 | 완화 |
|------|------|------|
| shadcn/ui cascade 깨짐 | **Low** — Plot 기존 토큰 모두 보존 | Task 1.5 build verify |
| `--accent` 값 변경 (Q2) | **Intended** — 시각 회귀 = 의도된 변화 | qa-tester smoke test |
| Note status 색 변경 (Q3) | **Intended** — desaturated, 시각적 차분 | qa-tester smoke test |
| `--v3-priority-*` 채움 시 `--priority-*` 영향 | **None** — namespace 분리됨 | grep 0 영향 검증 |
| v3 신규 토큰 충돌 | **None** — grep 0 hits | 검증 완료 |

## 6. 결론

**Phase 1.2 진행 안전.** alias 정책으로 Plot 기존 토큰 100% 보존, v3 신규 토큰 추가 시 충돌 없음. shadcn/ui cascade 정상 작동 보장.
