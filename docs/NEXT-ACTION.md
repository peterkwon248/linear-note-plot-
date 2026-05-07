# NEXT-ACTION

> **다음 세션 즉시 시작할 액션.** 다른 컴퓨터에서 작업 이어받기 위한 source of truth.
> before-work는 이 파일을 가장 먼저 읽는다.

**마지막 갱신**: 2026-05-07 (Phase A 작업 후)
**머신**: 집 (Windows)
**현재 Phase**: Plot v3 Phase 0/1 ✅, Phase 2 ⏸️ DEFER, Phase 3 ✅, **Phase 4 진행 중 (PR 4.1 ✅ 머지)**. **Phase A NoteStatus rename → PR #269 OPEN (머지 대기)**.

---

## 🎯 다음 즉시 액션

### 🔴 0. Phase A 머지 + 후속 정리

**PR #269** (`claude/note-status-rename-phase-a`) OPEN / MERGEABLE / 머지 대기.

**완료된 작업** (executor-high 위임으로 6 commits):
1. ✅ types + colors (lib/types.ts NoteStatus + lib/colors.ts)
2. ✅ view-engine (ViewContextKey + defaults + context-filter)
3. ✅ route directory rename (`/inbox`→`/stone`, `/capture`→`/brick`, `/permanent`→`/keystone`) + 옛 URL redirect
4. ✅ inline literals (47 files +390/-390)
5. ✅ IDB v116 migration (idempotent — notes status field + viewStateByContext keys)
6. ✅ tests + AGENTS.md + globals.css CSS variables

**검증**: tsc 0 / build clean (36 routes) / 7771 tests pass (185 source + ~7600 worktree mirrors)

**머지 후 액션**:
- main으로 squash merge
- before-work 다음 세션부터: store version v116, app routes /stone /brick /keystone

### 🟡 1. Brand mark fix + Status icons (Phase A 머지 후 follow-up PR)

**Brand mark** (작은 PR, 즉시):
- PR 3.4의 네트워크 SVG는 사용자 평가 "별로" — mockup 패턴 (`<div className="a-brand__mark">P</div>`) 복귀
- 일단 하드코드 `"P"` (workspace name 설정 필드는 추후 별도)
- `components/activity-bar.tsx` line 88-112 교체

**Status icons** (디자인 + 코드, 시안 보고 조정):
- stone/brick/keystone 메타포 SVG로 교체:
  - stone = 돌멩이 윤곽 (5-6각형 불규칙)
  - brick = 둥근 모서리 직사각형 + mortar line
  - keystone = 사다리꼴 (wider top, 아치 위 wedge)
- 1.5px stroke / currentColor / 14px default — 디자인 토큰 정합
- 색은 Q3 LOCKED 그대로
- `components/status-icon.tsx` `StatusShapeIcon` 함수 + `components/icons/imperial-extras.tsx` 새 icon

### 🟡 1. Phase B: Inbox layer 구현 ⚠️ **미확정 (DRAFT)**

`.omc/plans/inbox-layer.md` = **Draft 상태**. "Inbox 단어를 알림함으로 부여 + 기능 구현"은 사용자 합의 미완료 (2026-05-07 확인). Phase A 완료 후 사용자 추가 결정 필요.

- **결론 안 난 부분**: Inbox = 알림함 명칭 + 기능 부여 자체
- **결론 난 부분 (Phase A에 흡수)**: stone/brick/keystone status 명칭 + 섹션 아이콘
- 새 세션이 plan만 보고 자동 진행하지 말 것

### 🟢 2. Phase 4 재개 (Phase A/B 완료 후)

`.omc/plans/v3-phase-4-decompose.md` PR 4.2 (notes-table.tsx reskin) — 새 명칭 (stone/brick/keystone) 사용. 그 후 PR 4.3, 4.4.

---

## 🧠 잊지 말 것 (이번 세션 핵심 결정)

### Phase A vs Phase B 분리 (영구)
- Phase A = NoteStatus 단순 atomic rename (53 files, 6 commits in 1 PR)
- Phase B = Inbox layer 신규 (4-5 PR, 새 기능)
- 분리 이유: 작업 원칙 #6 (UI + 데이터 모델 분리). atomic rename은 단일 PR.

### 단일 통합 Inbox 결정 (영구)
- **하나의 inbox = 모든 entity 처리 대기 통합** (Notes stone + Wiki stub + Book unfinished + Reference 미링크 + Files 미분류)
- per-entity inbox 분산 X — 사용자 한 곳만 봄
- Plot 정체성 ("Gentle by default") + IKEA 전략 + Linear/Things3 패턴 정합
- 위치: home 안 카드 (v3 11결정 #1 7-space 보존) + `/inbox` full-page (filter tabs)
- 정의: 하이브리드 (자동 + dismiss + snooze)

### v3 PRD 영향 (Phase 5 적용 범위)
- 기존 5 view modes 적용: `/notes, /inbox, /capture, /permanent, ...`
- 새: `/notes, /stone, /brick, /keystone, ...` — `/inbox` 제거 (별도 layer)

### 옛 URL 처리
- `/inbox`, `/capture`, `/permanent` → server-side redirect to `/stone`, `/brick`, `/keystone`
- Phase A에서 처리 — 사용자 북마크 보존

### v3 mockup과 어우러짐
- v3 mockup의 inbox/capture/permanent (status로) → stone/brick/keystone로 적용
- inbox layer는 v3 mockup 외 신규 디자인 (home 안 카드 + /inbox 페이지)
- conceptual mismatch 있지만 visual 호환

---

## 📊 현재 Phase 진행 상황

### Plot v3 visual refresh
- ✅ Phase 0: cleanup (v112)
- ✅ Phase 1: token foundation
- ⏸️ Phase 2: Imperial icon kit DEFER
- ✅ Phase 3: Activity Bar / Sidebar Chrome (4 PR)
- ⏳ Phase 4: Table Mode Reskin
  - ✅ PR 4.1 (CSS 통합)
  - ⏳ PR 4.2 (notes-table.tsx reskin) — **NoteStatus rename 후 진행**
  - ⏳ PR 4.3 (other list views)
- ⏳ Phase 5-7: 후속

### 별도 트랙
- ⏳ NoteStatus rename Phase A — 다음 세션 (atomic, 53 files / 274 occ)
- ⏳ Inbox layer Phase B — 그 다음 (4-5 PR, 새 기능)

---

## ⏸️ 보류 / 영구 폐기

- **Phase 2 (Imperial icon kit)** — DEFERRED
- **PR 3.4 shell grid** — Phase 6으로 통합
- **per-entity inbox 분산** — 단일 통합 inbox로 결정

---

## 🔧 작업 환경

- 이번 세션 worktree: `.claude/worktrees/note-status-rename` (plan만 작성, 작업 X)
- branch: `claude/note-status-rename` (origin/main 28b7474 + Phase 4.1 머지된 main 기반)
- main: `28b7474` (Phase 4.1 CSS 통합 후 머지된 상태)
- dev server: 미사용 (이번 세션 plan만)
- 디자인 skills: project-level (`.agents/skills/`)
