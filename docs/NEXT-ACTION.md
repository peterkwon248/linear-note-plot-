# NEXT-ACTION

> **다음 세션 즉시 시작할 액션.** 다른 컴퓨터에서 작업 이어받기 위한 source of truth.
> before-work는 이 파일을 가장 먼저 읽는다.

**마지막 갱신**: 2026-05-08 (5 PR 머지 + Phase 4.3 north star plan)
**머신**: 집 (Windows)
**현재 Phase**: Plot v3 Phase 0/1/3/4.1/4.2 ✅, Phase 2 ⏸️ DEFER, **Phase 4.3 chrome 통일 (#282 시도 → #283 revert → #284 정리 → #285 plan 보강)**

---

## 🎯 다음 즉시 액션

### 🔴 0. 사용자 결정: 다음 작업 path 선택 (3 후보)

이번 세션 plan에 정리된 두 series 중 진입점 선택:

#### Path A — Filter coverage Section 11 (작은 PR 시리즈, 빠른 visual 효과)
```
Step 1: Files type filter (image/url/file) ← 추천 (가장 작고 명확)
Step 2: References type filter
Step 3: Wiki Category filter 보강 (사용자 직접 우려)
Step 4: Tags / Labels color filter (선택)
Step 5: Stickers / Inbox (선택)
```

#### Path B — Chrome refactor Section 10 (큰 작업, 시각 일관성 prerequisite)
```
Step A: globals.css `.a-th, .a-row` grid 분리 (chrome-only로) ← 모든 view chrome 통일의 prerequisite
Step B: Tags/Labels chrome 재적용 (#282 retry — 폰트/height 자동 통일)
Step C: column model 확장 (displayProperties)
Step D: 다른 view (wiki / library / templates / stickers)
```

#### Path C — Studio/Editorial cleanup (영구 규칙 위반, 명백 cleanup)
- 메모리 영구 규칙 #1 ("멋진 레이아웃 / 시각적 다양성 방향 제안 금지") + TODO.md "매거진 pivot 폐기 (2026-04-22)" 위반
- Studio + Editorial shell 삭제 + viewSwitcher tab 정리 + IDB migration (옛 viewMode fallback)
- Gallery는 polishing 후 재도입 (별도 PR)

**추천**: Path A Step 1 (Files type filter) → 가장 빠른 작은 PR, 즉시 효과. 그 후 Path B Step A 또는 Path C.

### 🟡 1. (참고) 이번 세션 마감 상태

- ✅ PR #271 (Status icons + Block label + Cuboid + Save view 16px)
- ✅ PR #282 (PR 4.3a Tags+Labels chrome 통일 시도)
- ✅ PR #283 (PR #282 partial revert — `.a-row` grid 충돌)
- ✅ PR #284 (Tags row border-b 제거 + plan update)
- ✅ PR #285 (plan Section 11 Filter coverage 분석 추가)
- ✅ docs sync (NEXT-ACTION / SESSION-LOG / MEMORY / TODO / CONTEXT — 이 PR)

---

## 🧠 잊지 말 것 (이번 세션 핵심 결정)

### Filter model 통찰 (사용자 직관, 영구)
```
LIST/TABLE: column = passive attribute view, Filter button = active narrow
BOARD:      column = grouping attribute, Filter button = other axis
GRID:       card chip = attribute viz, Filter button = chip narrow
```
→ Filter 없는 view는 도메인 attribute 부족. column 추가 시 자연스레 filter 가능.

### `.a-th, .a-row` grid hardcoded
- globals.css에서 6-column grid template 강제 (notes-table 전용)
- NotesTable은 inline grid로 덮어씀 → OK
- 다른 view (3-element flex)는 inline 없어 6-col 강제 → layout 깨짐
- **refactor 필요**: chrome-only 분리 (height/border/sticky/bg/font-size) + grid는 consumer 책임

### NoteStatus enum value `keystone` 유지 결정
- UI 라벨만 "Block"로 (Cuboid 1×2 isometric block 아이콘)
- internal `keystone` 그대로 (URL `/keystone`, IDB key, type literal)
- 이유: AddBlock / BlockTree / ContentBlock 등 기존 `block` identifier와 충돌 회피
- 영구 결정 — mismatch는 디버그 콘솔 + URL bar에 한정 (사용자 영향 X)

### View modes (Studio / Editorial / Gallery) 사용자 평가
- **Studio + Editorial**: 영구 규칙 위반 (멋진 레이아웃 + 매거진 pivot 부활) — **제거 예정**
- **Gallery**: 카드 형태 자체는 좋음. 단 (1) 편집 불가 (read-only) (2) 하드코딩 styling (cream 강제, Plot tokens 무시). **polishing 후 재도입** — 일단 보류.
- 통합 방향: Display popover의 `[List | Board | Gallery]` 3-segment로 (ViewSwitcher tab 제거)

---

## 📊 현재 Phase 진행 상황

### Plot v3 visual refresh
- ✅ Phase 0: cleanup (v112)
- ✅ Phase 1: token foundation
- ⏸️ Phase 2: Imperial icon kit DEFER
- ✅ Phase 3: Activity Bar / Sidebar Chrome (4 PR)
- ⏳ Phase 4: Table Mode Reskin
  - ✅ PR 4.1 (CSS 통합 #267)
  - ✅ PR 4.2 (notes-table.tsx #276)
  - ⏳ PR 4.3 (other list views) — **현재 plan 보강 단계, refactor prerequisite 필요**
  - ⏳ PR 4.4 (옵션)
- ⏳ Phase 5: View Modes — **재검토 (Studio/Editorial 제거 + Gallery polish)**
- ⏳ Phase 6-7: 후속

### 별도 트랙
- ✅ Phase A NoteStatus rename (PR #269 머지) + UI 라벨 Block + Cuboid icon (PR #271)
- ✅ Inbox layer (#272-#275 머지된 상태)

---

## ⏸️ 보류 / 영구 폐기

- **Studio + Editorial view modes** — 영구 규칙 위반, 다음 세션 cleanup 후보
- **Gallery view** — 편집 + Plot tokens polishing 후 재도입 (별도 sprint)
- **Phase 2 (Imperial icon kit)** — DEFERRED
- **PR 3.4 shell grid** — Phase 6으로 통합

---

## 🔧 작업 환경

- **현재 main brnach** = `d4f7ca1` (PR #285 머지 후)
- **현 worktree**: `/리니어 노트앱` (main checkout)
- 별도 worktree (`v3-phase-4-3` 등) 보존됨 — 다음 세션에 정리 가능
- **dev server**: localhost:3002 (Next.js, 현 worktree 코드)
- **store version**: v117 (inbox layer 1 IDB migration 적용 후)

---

## 📚 참고 plan

- `.omc/plans/v3-phase-4-3-decompose.md` — **Section 9-11이 핵심**:
  - Section 9: Lessons learned (이번 세션)
  - Section 10: Roadmap chrome (Step A/B/C/D)
  - Section 11: Filter coverage 분석 (Step 1-5)
- `.omc/plans/v3-phase-4-decompose.md` — Phase 4 원본
- `.omc/plans/inbox-layer.md` — Phase B (이미 main 머지 진행)
- `.omc/plans/note-status-rename.md` — Phase A (이미 main 머지)
