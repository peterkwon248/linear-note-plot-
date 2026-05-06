---
session_date: "2026-05-07 07:57"
project: "Plot"
working_directory: "C:\\Users\\user\\Desktop\\linear-note-plot-\\.claude\\worktrees\\unruffled-boyd-2b9c53"
duration_estimate: "~4 hours"
---

## Completed Work

### 영구 결정 (Plot 2.0 → v3 mockup 채택)
- 사용자가 Claude 디자인과 작업한 v3 mockup이 Plot의 새 단일 비전. Plot 2.0 PRD (Phase A 완료, 11가지 결정 LOCKED) 폐기.
- mockup 위치: `docs/v3-mockup/` (zip 원본: `C:\Users\user\Downloads\아이콘 키트.zip`)
- 메모리 기록: `C:\Users\user\.claude\projects\C--Users-user-Desktop-linear-note-plot-\memory\project_v3_mockup_adopted.md`

### PRD 작성 + Revision
- **PRD 작성** (planner agent): `docs/PLOT-V3-VISUAL-REFRESH-PRD.md` v1.0 (13 섹션, 8 phase 분해, Q1-Q7 결정)
- **Critic 검토** → NEEDS REVISION (Critical 6 + Concerns 10 + 신규 Open Questions 7개)
- **PRD revision** (executor-high): v1.1
  - Q8-Q14 추가 + 모두 LOCKED 결정
  - 누락 페이지 추가 (settings/library/search/templates/stickers 등)
  - phosphor prop matrix, helper spec (`getHueFromNoteId`, `getSubtitle`, `extractParagraphs`, `getStudioSegments`)
  - 데이터 마이그레이션 sub-section, axe-core 검증
- **Phase 0/1 plan 작성**: `.omc/plans/v3-phase-0-cleanup.md`, `v3-phase-1-tokens-typography.md`
- **인벤토리**: `.omc/plans/v3-phosphor-inventory.md` (실측 2 files / 4 icons), `v3-tsc-errors-classified.md` (0 errors baseline)
- **PRD timeline fix**: 9-14주 → 7-12주 (Phase 2 인벤토리 결과 1-2주 → 0.5일)

### Phase 0 cleanup (4 commits, merged)
- `89e50fb` chore(view-engine): align SavedView ViewMode with view-engine union (Phase 0.1) — `"table"` 제거, `"grid"` 추가
- `04cbe86` feat(store): migrate v111 → v112 (SavedView viewMode "table" → "list") (Phase 0.2) — idempotent migration
- `52b7e7e` chore(tokens): reserve --v3-priority-* namespace declarations (Phase 0.3) — `:root` + `.dark`
- `81a86d2` docs(plot-v3): Phase 0 cleanup complete

### Phase 1 token + typography (6 commits)
- `b8bb1f9` chore(tokens): Token Cascade Map analysis (Phase 1.1)
- `5e4ade6` feat(tokens): integrate v3 design tokens with alias policy (Phase 1.2) — `--bg`/`--fg`/`--soft-fg`/`--muted-fg`/`--whisper-fg`/`--bg-elev`/`--accent-soft`/`--shadow-{sm,md,lg}` 추가, alias 정책 적용
- `2dc191d` feat(colors): add v3 color aliases, apply Q3 desaturated status (Phase 1.3) — `NOTE_STATUS_HEX` desaturated (#22d3ee→#6B7280, #f97316→#D97706, #22c55e→#0E9384), TEXT_HIERARCHY/MOTION/RADIUS export
- `db3495e` feat(fonts): add Source Serif 4, verify Geist (Phase 1.4) — next/font 활용
- `ca3b9c9` chore(_legacy): scaffold _legacy folder + import policy (Phase 1.7) — 4 정책 README
- `6ae9d42` docs(plot-v3): Phase 1 token migration complete

**Phase 1 적용 핵심 변화**:
- `--accent` light: `#4f46e5` → `#5E6AD2` (v3 indigo)
- `--accent` dark: `#818cf8` → `#7C8AE7`
- `NOTE_STATUS` desaturated 적용
- `--v3-priority-*` namespace에 v3 mockup 값 채움
- Plot `--priority-{high,medium,low,urgent,none}` 5-tier 100% 보존
- Source Serif 4 추가

## In Progress

### Phase 2 부분 작업 (uncommitted)
sub-agent가 위임 거절되기 전에 일부 작업 진행. 다음 파일 변경 상태:
- **신규**: `components/icons/imperial.tsx` (Imperial 80+ icons, 1.5px stroke, currentColor, weight: never로 phosphor 잔존 surface)
- **신규**: `components/icons/imperial-extras.tsx` (Plot 도메인: WikiBook, OntologyWide, Bookshelf 등)
- **수정**: `components/activity-bar.tsx` — phosphor SSR (Graph/Books/BookOpen/SidebarSimple) → Imperial
- **수정**: `components/plot-icons.tsx` — `IconWiki = BookOpen` (phosphor) → `IconWiki = WikiBook` (Imperial)
- **수정**: `components/views/note-split-page.tsx`, `wiki-merge-page.tsx`, `wiki-split-page.tsx` — lucide → Imperial 일부
- **수정**: `components/side-panel/backlink-card.tsx` — `weight="regular"` 제거 (Imperial weight: never 충돌 fix)

**잔여 작업 (Phase 2 마무리)**:
- 5 files에 `weight="regular"` 등 phosphor prop 85+ occurrences 잔존 (calendar-view.tsx, display-panel.tsx, filter-bar.tsx, board-workbench.tsx, color-picker-grid.tsx 외 더 있을 가능성)
- lucide-react / iconoir-react / @tabler/icons-react / @remixicon/react 사용처 마이그레이션 미완
- imperial-extras.tsx의 Plot 도메인 icon (WikiBook 등) 정확한 SVG 검증 필요
- 다음 세션에서 Phase 2 sub-agent 재위임 권장 (executor 또는 codemod 스크립트)

## Remaining Tasks

- [ ] **Phase 2 마무리** (예상 0.5일): 잔존 phosphor `weight=` props 제거, lucide/iconoir/tabler/remixicon → Imperial 마이그레이션. 시작 명령: `Task(subagent_type="oh-my-claudecode:executor", prompt="Plot v3 Phase 2 마무리. 현재 components/icons/imperial.tsx + imperial-extras.tsx 모듈 있음. 잔존 phosphor `weight=` props 제거 + lucide/iconoir/tabler/remixicon → Imperial. .omc/plans/v3-phosphor-inventory.md 참조.")`
- [ ] **Phase 3 Activity Bar / Sidebar reskin** (1-2주, 시각 변화 첫 큰 단계): `.a-actbar`, `.a-sidebar`, `.a-sb-*` 패턴 적용. 시작 전 `.omc/plans/v3-phase-3-activity-sidebar.md` 작성 권장.
- [ ] **Phase 4-7**: Table mode reskin (2주) → 4 view modes 신규 (Gallery/Studio/Editorial/Graph, 3-4주) → Filter popover (1-2주) → QA polish (1주). PRD §11 timeline 참조.
- [ ] **Visual smoke test (Task 1.6)**: 사용자가 `npm run dev` 후 주요 페이지에서 Phase 1 변화 확인 (--accent indigo, NOTE_STATUS desaturated). 큰 시각 변화는 Phase 3+에서.

## Key Decisions

- **Plot 2.0 → v3 mockup 채택 (영구)**: 사용자가 Claude 디자인과 작업한 v3 mockup이 새 단일 비전. Plot 2.0 PRD 11가지 결정 폐기. Note/Wiki 2-entity, "Gentle by default", LLM 미사용은 영구 보존.
- **Q1 SPACE_COLORS = B (Plot 현재 유지)**: notes=cyan, calendar=pink, wiki=violet — Plot 정체성 보존. v3는 indigo/orange/violet이지만 Plot 정체성 우선.
- **Q2 --accent = A (v3 #5E6AD2)**: light/dark 모두 v3 indigo 채택. Linear 룩 정렬.
- **Q3 NOTE_STATUS = A (v3 desaturated)**: inbox neutral gray (#6B7280), capture brown-orange (#D97706), permanent teal-green (#0E9384). "Gentle by default"와 일치.
- **Q4 Studio dark forced**: Studio mode는 항상 dark theme (mockup intent).
- **Q5 Editorial body = TipTap helper**: `extractParagraphs(noteContentJson)` helper로 paragraph 추출.
- **Q6 Feature flag 미사용**: 사용자 단독 개발이라 toggle 인프라 불필요.
- **Q7 Phase 1 → 2 순차**: Phase 1 token 안정 후 Phase 2 codemod (baseline clean 보장).
- **Q8 Priority namespace = A**: v3 priority는 `--v3-priority-*` namespace 격리. Plot 5-tier 그대로.
- **Q9 Gallery hue**: `noteId` hash → 0-360 deterministic.
- **Q10 Editorial subtitle**: Plot Note의 `summary` field 활용 (이미 존재).
- **Q11 v3 modes 적용 범위**: Notes list만. Wiki/templates/library는 list-only 유지 (entity 분리 일관).
- **Q12 Studio segments = SRS 진행도**: `srsStateByNoteId` 활용해 의미 있는 4-segment progress 표시. decorative 거부.
- **Q13 view-switcher 위치**: workspace header (페이지별 X).
- **Q14 키보드 검증**: qa-tester 수동.
- **보존 정책**: 22-slice store / hooks / TipTap extensions / routing 그대로. UI 컴포넌트는 `_legacy/` 폴더 통한 점진 교체.

## Technical Learnings

- **인벤토리 vs critic estimate 차이 = 16배**: critic은 PRD에서 121-128 files 추정, 실제 인벤토리는 2 files / 4 icons. estimate 신뢰성에 주의 — 실측 우선.
- **Imperial `weight: never` 패턴**: phosphor 잔존을 컴파일 타임에 surface시키는 의도적 typing. backlink-card.tsx 같은 phosphor+Imperial 혼용 자리에서 즉시 발견.
- **Source Serif 4 self-reference 회피**: `next/font` 변수명을 `--font-source-serif`로 분리한 후 `@theme inline { --font-serif: var(--font-source-serif), ... }` alias로 자기 참조 무한 루프 방지.
- **Token alias 3-Layer**: v3 names (`--bg`, `--fg`) → Plot names (`--background`, `--foreground`) → Tailwind (`@theme inline { --color-* }`). 동일 hex 보장 + shadcn cascade 보존.
- **Q2 --accent cascading**: `--accent` 변경 시 `--ring`, `--sidebar-primary`, `--sidebar-ring`도 cascade. `--toolbar-active`는 alpha rgba로.
- **store v111 → v112 idempotent migration**: `viewMode === "table"` → `"list"` 변환. 두 번 실행해도 안전 (`Array.isArray` 가드).
- **Next.js 16 vs strict tsc 차이**: `npm run build` 통과해도 `tsc --noEmit` 1 error 가능. 둘 다 검증해야 안전.

## Blockers / Issues

- 없음. backlink-card.tsx의 `weight="regular"` 제거로 tsc 0 errors 회복.

## Environment & Config

- Working dir: `C:\Users\user\Desktop\linear-note-plot-\.claude\worktrees\unruffled-boyd-2b9c53`
- OS: Windows 11, bash shell
- Branch: `claude/unruffled-boyd-2b9c53` (10 commits ahead origin/main)
- Remote: `peterkwon248/linear-note-plot-` (default branch: **main**, NOT master)
- Stack: Next.js 16, React 19, TypeScript, Zustand 5, TipTap 3, Tailwind v4
- Store: v111 → **v112** (Phase 0)
- Build: ✅ exit 0
- Test: ✅ 185 pass (0 regression)
- TSC: ✅ 0 errors (after backlink-card fix)
- v3 mockup: `docs/v3-mockup/` (압축 풀린 위치)

## Notes for Next Session

- **첫 명령**: `/before-work` (자동으로 v3 PRD + Phase 진행 상황 컨텍스트 로드)
- **다음 우선순위 1순위**: Phase 2 마무리 (잔존 phosphor `weight=` 제거 + lucide 등 마이그레이션). 0.5일.
- **Phase 2 마무리 후**: Phase 3 plan 작성 (`.omc/plans/v3-phase-3-activity-sidebar.md`) → 구현. 1-2주.
- **시각 변화 첫 큰 단계**: Phase 3 (Activity Bar / Sidebar reskin) — 사용자가 가시적 변화 처음 체감.
- **Plot 2.0 docs 처리**: `docs/PLOT-CURRENT-STATE-FOR-2.0.md`, `docs/PLOT-2.0-NOTES.html`, `docs/PLOT-2.0-NOTES-FINAL.html`, `docs/PLOT-2.0-MOCKUP.html`, `docs/UI-CONSISTENCY-AUDIT.md` → Phase 7에서 `docs/.archive/`로 이동 (PRD §3.1).
- **잔여 phosphor 사용처 빠른 grep**: `weight="regular"` 등 — 5 files / 85+ occurrences 잔존 (Phase 2 마무리 작업 분량 의미).
- **Visual smoke test 권장**: 사용자가 `npm run dev` (port 3002) 실행 후 /home, /notes, /inbox 등 방문해 --accent indigo 톤 + NOTE_STATUS desaturated 확인. 만족 안 하면 Q2/Q3 재논의.

## Files Modified

### Commits (10 new)
- Phase 0: 89e50fb, 04cbe86, 52b7e7e, 81a86d2 (4 commits)
- Phase 1: b8bb1f9, 5e4ade6, 2dc191d, db3495e, ca3b9c9, 6ae9d42 (6 commits)

### Uncommitted (Phase 2 부분 + plans + PRD)
- **신규 파일**:
  - `components/icons/imperial.tsx` — Imperial icon kit 본체
  - `components/icons/imperial-extras.tsx` — Plot 도메인 icons
  - `docs/PLOT-V3-VISUAL-REFRESH-PRD.md` — v1.1 PRD
  - `.omc/plans/v3-phase-0-cleanup.md`, `v3-phase-1-tokens-typography.md`, `v3-phosphor-inventory.md`, `v3-tsc-errors-classified.md`, `v3-phase-1-cascade-map.md`
- **수정**:
  - `components/activity-bar.tsx` — phosphor → Imperial (Phase 2 partial)
  - `components/plot-icons.tsx` — IconWiki BookOpen → WikiBook (Phase 2 partial)
  - `components/views/note-split-page.tsx`, `wiki-merge-page.tsx`, `wiki-split-page.tsx` — lucide → Imperial 일부 (Phase 2 partial)
  - `components/side-panel/backlink-card.tsx` — weight="regular" 제거 (Phase 2 fix)
  - `next-env.d.ts`, `tsconfig.tsbuildinfo`, `.omc/continuation-count.json`, `.claude/settings.local.json` — 자동 생성/세션 메타
