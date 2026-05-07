# NEXT-ACTION

> **다음 세션 즉시 시작할 액션.** 다른 컴퓨터에서 작업 이어받기 위한 source of truth.
> before-work는 이 파일을 가장 먼저 읽는다.

**마지막 갱신**: 2026-05-08 (새벽)
**머신**: 집 (Windows, 메인 진행)
**현재 Phase**: Plot v3 Phase 0/1 ✅, Phase 2 ⏸️ DEFER, Phase 3 ✅, **Phase 4 진행 중 (PR 4.1 ✅ 머지)**, **NoteStatus rename + Inbox layer plan ✅ 작성**.

---

## 🎯 다음 즉시 액션

### 🔴 0. Phase A: NoteStatus rename 시작 (atomic, 단일 PR)

`.omc/plans/note-status-rename.md` 정독 후 실행:

**Scope**: 53 files / 274 occurrences. inbox/capture/permanent → stone/brick/keystone.

**핵심 작업** (단일 PR, 6 commits 안):
1. types + colors (`lib/types.ts` NoteStatus + `lib/colors.ts` NOTE_STATUS_HEX/COLORS)
2. view-engine (`lib/view-engine/types.ts` ViewContextKey + defaults.ts)
3. route directory rename (`app/(app)/inbox` → `stone` 등) + redirects
4. 인라인 literal (sidebar / status-icon / property-chips 등)
5. IDB v116 migration (`lib/store/migrate.ts` + `index.ts` version)
6. tests + AGENTS.md + CSS variables (`--status-inbox` → `--status-stone`)

**검증**:
- tsc 0 / build clean / 185 tests pass (이전 4개 status test → stone/brick/keystone로 update)
- IDB migration v116 — 기존 사용자 노트 status field rewrite (no data loss)
- /inbox URL 사용자 북마크 → server-side redirect to /stone

**진행 방식**: executor agent 위임 권장 (단순 rename = 자동 가능). 또는 단계별 직접.

### 🟡 1. Phase B: Inbox layer 구현 (4-5 PR, Phase A 완료 후)

`.omc/plans/inbox-layer.md` 참조. 단일 통합 Inbox 신규 layer:

- 위치: home 안 카드 + `/inbox` full-page (의미 변경 — status filter → 통합 inbox)
- 정의: 하이브리드 (자동 entity별 필터 + dismiss/snooze)
- entity별 필터:
  - Notes: stone status + 미분류
  - Wiki: stub status
  - Reference: 미링크
  - Files: 최근 upload 미분류
- 4-5 PR (slice + hook / home card / full-page / sidebar entry / SRS 통합)

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
