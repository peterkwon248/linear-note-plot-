# Session Log

> 세션 history. Append-only (오래된 entry 그대로 유지).
> 가장 최신 세션이 위.

---

## 2026-05-08 (새벽) — 집

### 완료
- **새 worktree** `note-status-rename` 생성 (origin/main 28b7474 기반, Phase 4.1 머지 후)
- **PR 4.1 (Phase 4 CSS 통합) 머지** — `.a-table` / `.a-row` / `.a-th` / `.a-tg` / `.a-stchip` / `.a-tag` / `.a-tool` 등 v3 table chrome 클래스 globals.css 통합. 시각 변경 0. PR #267.
- **2 plan 파일 작성** (작업은 다음 세션):
  - `.omc/plans/note-status-rename.md` (Phase A — atomic rename, 53 files / 274 occ)
  - `.omc/plans/inbox-layer.md` (Phase B — 단일 통합 Inbox layer)
- **NoteStatus rename + Inbox layer 큰 방향 결정** (영구)

### 브레인스토밍 & 큰 결정 (영구)

#### 1. NoteStatus 명칭 변경 (Phase A, 별도 plan)
- **결정**: inbox/capture/permanent → **stone/brick/keystone** (건축 메타포)
- **근거**: Plot 정체성 (Zettelkasten × Palantir) 정합. raw stone → processed brick → keystone (anchor) progression. 일반적 (Notion/Obsidian inbox/capture/permanent)에서 차별화.
- **scope**: 53 files / 274 occurrences + IDB v116 migration + route redirect
- **PR 구조**: 단일 atomic PR (rename은 분리 시 컴파일 에러). 6 commits in 1 PR.

#### 2. Inbox 개념 분리 (Phase B, 별도 plan)
- **결정**: inbox는 NoteStatus enum이 아니라 **별도 layer** (Linear / Things3 패턴)
- 새 의미: "처리 대기" 알림함 — 자동 필터 + 사용자 dismiss
- 기존 status 3개 (stone/brick/keystone)는 workflow stage. inbox는 별개 layer.

#### 3. 단일 통합 Inbox (per-entity 분산 X)
- **결정**: 하나의 inbox = 모든 entity (Notes / Wiki / Book / Reference / Files) 통합
- **근거**:
  - Plot 정체성 ("Gentle by default") — 사용자 한 곳만 봄
  - Linear / Things3 / Notion 패턴 정합
  - IKEA 전략 (앱이 자동 분류) — 사용자 부담 ↓
  - 확장성 — 새 entity 추가 시 자동 통합
- per-entity inbox 분산 = 사용자가 6+ inbox 관리. 부담.

#### 4. Inbox 위치: Home 안 카드 + `/inbox` full-page
- **결정**: home 안 카드 (Quick Capture / Stats 옆) + `/inbox` 별도 full-page
- **근거**: v3 11결정 #1 (7-space) 보존. Plot home dashboard 정체성 정합.
- top-level (Activity Bar 8번째 space) X — 7-space 위배

#### 5. Inbox 정의: 하이브리드 (자동 + dismiss)
- **결정**: 자동 entity별 필터 default + 사용자 dismiss/snooze 가능
- **자동 필터**:
  - Notes: stone + 미분류
  - Wiki: stub status
  - Reference: 미링크
  - Files: 미분류
  - (옵션) SRS: scheduled review 도래
- **사용자 dismiss** = Linear archive 패턴

### 다음 (NEXT-ACTION.md 참조)
- 🔴 Phase A: NoteStatus rename (atomic 단일 PR — executor agent 위임 권장)
- 🟡 Phase B: Inbox layer (4-5 PR — Phase A 완료 후)
- 🟢 Phase 4 재개: PR 4.2 notes-table.tsx reskin (새 명칭 사용)

### Watch Out
- **Atomic rename 위험**: 53 files / 274 occ를 분리 시 중간 PR 컴파일 에러. 단일 PR 유지 필수.
- **IDB v116 migration**: 기존 사용자 노트 status field rewrite. idempotent 보장 + no data loss.
- **Route redirect**: `/inbox` `/capture` `/permanent` 사용자 북마크. server-side redirect 필요.
- **v3 PRD Phase 5 적용 범위 변경**: `/inbox` 제거 (별도 layer). PRD 명시 update 필요.
- **inbox layer가 v3 mockup과 conceptual mismatch**: visual 호환은 되지만 의미 다름. mockup은 status, Plot inbox는 알림함.

### 머신
집 (Windows)

### 누적 commits (이번 세션, 1 PR + plan)
- ✅ **PR #267** 머지 (claude/v3-phase-4-plan): feat(v3-phase-4-1) table mode CSS 통합 (시각 변경 0). 1 commit (`19d2038`).
- 📝 plan 2개 (commit 예정 in this after-work)

---

## 2026-05-07 (밤 늦게) — 집

### 완료
- **새 worktree** `v3-phase-3-plan` 생성 (origin/main 41aab17 기반)
- **Plot v3 Phase 3 4 PR 모두 완료** (Activity Bar / Sidebar Chrome reskin)
  - **98f9277** PR 3.1: CSS 통합 (`.a-actbar` / `.a-sidebar` / `.a-sb-*` / `.a-icb` / `.a-kbd` / `.a-detail` 모두 globals.css에 통합. 시각 변경 0). +729 LOC.
  - **5ac22ef** PR 3.2: activity-bar.tsx reskin — width 44→72px / label permanent / brand mark / per-space color inline override (Plot 6색 보존)
  - **8155530** PR 3.3: linear-sidebar.tsx reskin — NavLink + Section + 11 inline button 일괄 (`.a-sb-link[data-active]` + `.a-sb-section + head + hint`). +43/-61 (코드 18줄 감소!)
  - **3761e42** PR 3.4: brand mark을 Plot 로고 SVG 교체 (네트워크 그래프 6 nodes + 10 edges + 강조 center node = "central knowledge node" 메타포)
- **Phase 3 분해 plan** `.omc/plans/v3-phase-3-decompose.md` 작성
- **외부 도구 평가** Front-End-Design-Checklist (적용 X — design-quality-gate / 4 design skills과 중복)

### 브레인스토밍 & 큰 결정 (영구)

#### PR 3.4 scope 변경 결정 (영구)
- 원래 plan = `.a-shell` shell layout grid 적용
- 그러나 ResizablePanel + custom resize drag + view-split + dynamic side panel과 충돌
- 큰 마이그레이션 = 작업 원칙 #2 (최소 diff) 위배 + 회귀 위험 (split view 등)
- **결정**: PR 3.4 = brand mark SVG 교체로 전환 (Phase 3 마무리 + 즉시 visual gain)
- Shell grid는 **Phase 6**에서 filter popover + workspace chrome + detail panel과 함께 도입

#### Plot 6-space 색 보존 (activity bar)
- v3 mockup `.a-ab--space[data-active]`는 단일 `--space-notes` (cyan)
- Plot SPACE_COLORS 6색 (home indigo / notes cyan / wiki violet / calendar pink / ontology emerald / library amber)
- **결정**: activity-bar.tsx inline style로 6색 보존 (color-mix bg + color + boxShadow inset)

#### Sidebar는 단일 cyan (활성 svg 색) 임시
- v3 `.a-sb-link[data-active] svg { color: var(--space-notes); }` 단일 cyan
- Plot 기존: `text-sidebar-active-text` (varied)
- visual confirm 후 회귀로 판단되면 fix PR 작성 (사이드바 svg 색 6-space 별 inline override)

### 다음 (NEXT-ACTION.md 참조)
- 🔴 **Visual confirm** (사용자 manual `npm run dev`) — Phase 3 큰 시각 변화 검증
- 🟡 OK면: **Phase 4** (Table Mode Reskin — Notes / Tags / Labels list) 또는 Phase 5 / Phase 6
- ⚠️ 회귀 발견 시: fix PR (사이드바 svg 색 6-space 별 등)

### Watch Out
- **Preview tool cwd cache**: 새 worktree에서 EnterWorktree + preview_start 시 cwd가 이전 worktree로 cache. workaround: ExitWorktree(keep) → EnterWorktree → preview_start. 또는 manual.
- **Sidebar svg 색**: v3 mockup CSS가 단일 cyan. Plot 기존 sidebar-active-text (varied)에서 cyan로 변경됨 — visual 회귀 가능
- **Brand mark SVG**: 28x28 brand container 안에 20x20 SVG. 사용자 첨부 디자인을 단순화 (6 nodes / 10 edges). 디테일 부족하면 사용자 동의 후 수정

### 머신
집 (Windows)

### 누적 commits (이번 세션, 4개 PR)
1. `98f9277` — feat(v3-phase-3-1): activity bar / sidebar chrome CSS 통합 (시각 변경 0)
2. `5ac22ef` — feat(v3-phase-3-2): activity-bar.tsx v3 mockup 패턴 적용
3. `8155530` — feat(v3-phase-3-3): linear-sidebar.tsx v3 mockup 패턴 적용
4. `3761e42` — feat(v3-phase-3-4): brand mark을 Plot 로고 SVG로 교체 (네트워크 그래프)

---

## 2026-05-07 (밤) — 집

### 완료
- **Plot v3 Phase 2 DEFERRED 결정** (commit 3b84d7e)
  - PRD 상단 DECISION banner 추가, Status v1.1 → v1.2
  - `.omc/plans/v3-phosphor-inventory.md` ARCHIVED 표시
  - CONTEXT/MEMORY 결정 기록
- **PR group-c-d-3** Stickers view-engine 통합 v113 (commit a055581, 9 files +427/-92)
  - useStickersView thin fork (cross-entity members count, note/wiki active check)
  - StickerMemberCountChip (Stack icon)
  - list+grid mode + DisplayPanel
- **PR group-c-d-4** References view-engine 통합 v114 (commit c3700ad, 9 files +408/-43)
  - useReferencesView thin fork (caller가 pre-filtered 전달, enrich + sort)
  - 3 신규 chips (RefTypeChip / RefFieldCountChip / RefImageChip)
  - sort + viewMode → viewState. quickFilter / fieldKey filter / search 로컬 유지
- **4 design skills install** (commit 0f7e2ec, 5 files)
  - design-taste-frontend / high-end-visual-design / redesign-existing-projects / minimalist-ui
  - project-level (`.agents/skills/`)
  - cross-machine: `npx skills experimental_install`
- **PR group-c-d-5** Files view-engine 통합 v115 (commit f210fcf, 9 files +423/-39)
  - useFilesView thin fork (Attachment 전용)
  - 2 신규 chips (FileTypeChip / FileSizeChip)
  - column header sort: "type" → "fileType" 명시 변환
  - Grid mode JSX (4:3 thumbnail block + chip row)
- **Group C PR-D 시리즈 완성** (5/5 entity view-engine 통합)
- 외부 레포 평가 (적용 X 결정): onlook, Front-End-Design-Checklist
- shadcn-ui 적용 확인 (이미 깊이 적용됨)

### 브레인스토밍 & 큰 결정 (영구)

#### Plot v3 Phase 2 DEFER (큰 방향 결정)
- **결정**: Imperial icon kit 전면 도입 보류. phosphor-icons 그대로 유지
- **근거**:
  - 직전 plan (`v3-phosphor-inventory.md`) stale ("2 files / 4 icons" → 실측 119 files / 60+ icons / 87 files weight 사용)
  - 119 files codemod = 단일 PR 안전성 위배 (작업 원칙 #2 최소 diff)
  - phosphor regular ↔ Imperial 시각 위화감 미미 (둘 다 1.5px stroke Linear-style) → 도입의 시각 가치 약함
  - 빌드 정상 (tsc 0 / build clean / 185 tests pass)
  - lucide / 외부 라이브러리 추가 도입 의미 없음 (phosphor 광범위)
- **partial work 보존** (revert 안 함): activity-bar / plot-icons IconWiki / view 일부 / backlink-card
- **재개 조건**: 정확한 인벤토리 + imperial-extras shim 매핑 coverage 검증 + 단일 책임 PR 분할

#### 외부 도구 평가 (영구 결정)
- **shadcn-ui**: ✅ 이미 적용 (components.json + components/ui/* 30+). v3 PRD "shadcn cascade 보존" 정책 명시
- **taste-skill** (Leonxlnx, 15.8k): ⭐ install. Plot 정합 4개만. universal symlink (Codex/Cursor/Copilot 등 12 agents 호환)
  - design-taste-frontend / high-end-visual-design / redesign-existing-projects / minimalist-ui
  - 안 install: industrial-brutalist-ui, brandkit, gpt-taste(GSAP), imagegen-*, image-to-code, stitch-design-taste, full-output-enforcement
- **huashu-design** (alchaincyf, 12.3k): △ mockup/prototype 도구. Plot production code에 직접 적용 X. v3 mockup 단계에서만 유용
- **onlook** (onlook-dev, 25.7k): ❌ visual code editor. Plot production app에 자동 코드 변경 회귀 위험. greenfield/marketing 사이트에 적합
- **Front-End-Design-Checklist** (thedaviddias, 5.2k): ❌ passive markdown handoff 가이드. design-quality-gate / linear-design-mirror / 4 design skills과 중복. 1인 dev에 audience 불일치

### 다음 세션 (NEXT-ACTION.md 참조)
- 🔴 **Plot v3 Phase 3+** 분해 plan 작성 → 첫 PR 작업
- 또는 Wiki template 3-layer / Smart Book v2

### Watch Out
- **PR 3-5 build에서 SORT_FIELD_LABELS exhaustive 이슈 반복** — view-engine SortField 추가 시 `notes-table.tsx` Record<SortField, string>에 동일 추가 필요 (PR마다). 이번 세션에 memberCount, fieldCount, size, fileType 모두 추가.
- **tsc --noEmit 통과 ≠ next build 통과** — incremental cache 차이로 build에서 type error 발견 가능. 항상 build까지 검증.
- **Plot v3 Phase 2 partial work** — activity-bar 등 Imperial 사용 중인 컴포넌트는 그대로. 새 코드도 phosphor 또는 Imperial 자유 (둘 다 1.5px stroke 정합).

### 머신
집 (Windows)

### 누적 commits (이번 세션)
1. `3b84d7e` — docs(v3): defer Phase 2 (Imperial icon kit) — phosphor 유지
2. `a055581` — feat(group-c-d-3): Stickers view-engine 통합 (v113)
3. `c3700ad` — feat(group-c-d-4): References view-engine 통합 (v114)
4. `0f7e2ec` — chore(skills): install 4 taste-skill design skills
5. `f210fcf` — feat(group-c-d-5): Files view-engine 통합 (v115) — Group C PR-D 완성

---
