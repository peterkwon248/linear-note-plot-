# NoteStatus 리네이밍: inbox/capture/permanent → stone/brick/keystone

> **Phase A of 2 — 단순 atomic rename.** 53 files / 274 occurrences. IDB v116 migration 필수.
> Plot 정체성 (Zettelkasten × Palantir) 정합 — 건축 메타포 (raw stone → processed brick → keystone).
> **Phase B (별도 plan)**: Inbox layer 신규 — `.omc/plans/inbox-layer.md` 참조.

## 🔴 핵심 결정 (2026-05-08 새벽)

**inbox 개념 분리 결정**:
- 기존: `inbox` = NoteStatus enum (workflow stage)
- 새로: `stone/brick/keystone` 3-status (workflow stage)
- **inbox = 별도 layer (알림함 / 처리 대기)** — Phase B에서 도입
- v3 PRD의 `/inbox` 라우트 의미 변경: status filter → 통합 inbox (Phase B)
- Phase A 단계에서는 **rename만**. inbox layer 미구현. `/inbox` 라우트는 임시로 stone status filter (rename 후 삭제 또는 redirect Phase B에서)

---

## 0. Plan 메타데이터

- **상태**: Draft (2026-05-08 새벽)
- **현재 store version**: v115 → **v116** (NoteStatus IDB migration)
- **결정 시점**: docs/MEMORY.md line 720, 760 (Plot 2.0 시기 PRD 사전 조사 완료)
- **Plot 정체성**: "Gentle by default, powerful when needed" + Zettelkasten 단단한 노트 메타포
- **작업 원칙**: 정확도 + 버그 위험 최소화. atomic rename (단일 PR 권장 — 분리 시 중간 상태 컴파일 에러).

---

## 1. 결정 (영구)

### 새 명칭 (건축 메타포)
| 기존 | 새 명칭 | 의미 |
|------|--------|------|
| **inbox** | **stone** | 원석 — 가공 안 된 raw input |
| **capture** | **brick** | 벽돌 — 의미 있게 가공된 노트 |
| **permanent** | **keystone** | 핵심 — Plot의 마무리/참조 가치 |

### 정합성
- Plot = "노트 + 개인 위키 + 지식 관계망 (팔란티어 × 제텔카스텐)" 정체성
- 건축 메타포 = "단단한 노트로 지식 구조 짓기" 직관
- inbox/capture/permanent = 일반적 (Notion, Obsidian 등) → 차별화
- stone/brick/keystone = Plot 고유 정체성

---

## 2. Scope 측정

### 실측 (2026-05-08)
- **53 files** (`"inbox"|"capture"|"permanent"` literal 포함)
- **274 occurrences** (literal 사용처)

### 영역별 분류
| 영역 | 영향 |
|------|------|
| **Type 정의** | `lib/types.ts:1` `NoteStatus = "inbox" \| "capture" \| "permanent"` |
| **색 매핑** | `lib/colors.ts` NOTE_STATUS_HEX / NOTE_STATUS_COLORS / TEXT_HIERARCHY |
| **CSS variables** | `app/globals.css` `--status-inbox` / `--status-capture` / `--status-permanent` (Phase 1 v3 token + Phase 4 `.a-stchip[data-st="..."]` + `.a-row__icon[data-tone="..."]`) |
| **View-engine** | `lib/view-engine/types.ts` ViewContextKey `"inbox" \| "capture" \| "permanent"` + CONTEXT_DEFAULTS |
| **Route** | `app/(app)/inbox/` `app/(app)/capture/` `app/(app)/permanent/` directory 이름 + URL 변경 |
| **사이드바** | linear-sidebar.tsx 의 NavLink `href="/inbox"` 등 |
| **Status icon / chip** | status-icon.tsx + property-chips.tsx (StatusChip 등) |
| **Store** | status field default + IDB persist |
| **Settings** | settings-store startView |
| **Graph adapter** | graph-filter-adapter.ts 인라인 리터럴 |
| **Tests** | 4개 테스트 |
| **AGENTS.md** | 문서 |

---

## 3. PR 분해 결정

### 옵션 평가

**옵션 A: 단일 atomic PR** (53 files / 274 occurrences) ⭐ 권장
- ✅ rename은 atomic (분리 시 중간 PR이 컴파일 에러)
- ✅ 단일 의미 (rename)이라 commit message 명확
- ✅ Architect verification 한 번에
- ❌ 큰 PR (review 부담)

**옵션 B: 단계별 분리**
- ❌ 중간 상태 컴파일 에러 (NoteStatus type vs ViewContextKey 불일치)
- ❌ 사용자 데이터 inconsistency 가능 (route migration vs status migration)
- ✅ review 단계별 가능

→ **옵션 A 권장** (rename atomic 특성).

### 단일 PR 안 작업 단위 (commits 분리 가능)

```
commit 1: types + colors (lib/types.ts NoteStatus + lib/colors.ts NOTE_STATUS_HEX/COLORS)
commit 2: view-engine (lib/view-engine/types.ts ViewContextKey + defaults.ts)
commit 3: route directory rename + redirects (app/(app)/inbox → stone 등)
commit 4: 모든 인라인 리터럴 (linear-sidebar.tsx, status-icon.tsx, property-chips.tsx, etc.)
commit 5: store IDB v116 migration (lib/store/migrate.ts + index.ts version)
commit 6: tests + AGENTS.md + globals.css CSS variables (--status-inbox → --status-stone)
```

= 6 commits in single PR.

---

## 4. Must Have / Must NOT Have

### Must Have
- [x] atomic rename (모든 파일에서 일관 적용)
- [x] IDB v116 migration (기존 사용자 노트 status field rewrite)
- [x] route redirect (/inbox → /stone, /capture → /brick, /permanent → /keystone) — 사용자 북마크 보존
- [x] CSS variables rename (`--status-inbox` → `--status-stone`)
- [x] tests pass + AGENTS.md update
- [x] dark/light mode 색 보존 (NOTE_STATUS_HEX values 그대로 — 명칭만 변경)

### Must NOT Have
- [ ] **status 색 변경** — Q3 LOCKED (v3 desaturated). 명칭만, 색은 그대로
- [ ] **status 의미 변경** — 동일 (raw → processed → permanent의 progression)
- [ ] **개수 변경** — 3개 그대로 (stone/brick/keystone)
- [ ] **다른 작업과 묶음** — Phase 4 visual reskin과 분리 (작업 원칙 #6)

---

## 5. IDB Migration v116 spec

```ts
// lib/store/migrate.ts (added in v116 block)
{
  // v116: NoteStatus rename (inbox → stone, capture → brick, permanent → keystone)
  if (state.notes && Array.isArray(state.notes)) {
    state.notes = (state.notes as Record<string, unknown>[]).map((n) => {
      const oldStatus = n.status as string
      let newStatus = oldStatus
      if (oldStatus === "inbox") newStatus = "stone"
      else if (oldStatus === "capture") newStatus = "brick"
      else if (oldStatus === "permanent") newStatus = "keystone"
      return { ...n, status: newStatus }
    })
    console.log("[migrate] v115→v116: renamed NoteStatus inbox/capture/permanent → stone/brick/keystone")
  }
  // viewStateByContext keys도 rename
  if (state.viewStateByContext) {
    const vsc = state.viewStateByContext as Record<string, unknown>
    const renames = { inbox: "stone", capture: "brick", permanent: "keystone" }
    for (const [oldKey, newKey] of Object.entries(renames)) {
      if (vsc[oldKey] !== undefined && vsc[newKey] === undefined) {
        vsc[newKey] = vsc[oldKey]
        delete vsc[oldKey]
      }
    }
  }
}
```

---

## 6. Route Redirect spec

`/inbox` `/capture` `/permanent` → `/stone` `/brick` `/keystone`

**옵션**:
- A: hard delete + force-redirect (북마크 깨짐 — 임시)
- B: app/(app)/inbox/page.tsx 등에 `redirect("/stone")` server-side redirect
- C: Next.js `next.config.js` `redirects()` 설정

**권장**: B (server-side redirect). 사용자 옛 URL 입력 시 자동 새 URL.

---

## 7. CSS Variables Rename

```css
/* app/globals.css */
/* Before */
--status-inbox: #6B7280;
--status-capture: #D97706;
--status-permanent: #0E9384;

/* After */
--status-stone: #6B7280;
--status-brick: #D97706;
--status-keystone: #0E9384;
```

또 .a-row__icon[data-tone] / .a-stchip[data-st] selectors:
```css
.a-row__icon[data-tone="stone"] { color: var(--status-stone); ... }
.a-row__icon[data-tone="brick"] { color: var(--status-brick); ... }
.a-row__icon[data-tone="keystone"] { color: var(--status-keystone); ... }

.a-stchip[data-st="stone"] { ... }
.a-stchip[data-st="brick"] { ... }
.a-stchip[data-st="keystone"] { ... }
```

---

## 8. Risks & Mitigations

| 리스크 | 영향 | 완화 |
|--------|------|------|
| 사용자 IDB 데이터 손실 | 큼 | v116 migration이 모든 status field rewrite. idempotent 보장 |
| 사용자 북마크 (`/inbox` 등) 깨짐 | 중 | redirect 설정 (server-side or next.config) |
| 53 files 변경 review 부담 | 중 | 단일 의미 (rename)이라 review 빠름. executor agent 위임 |
| Mid-merge 컴파일 에러 (atomic) | 작음 | 단일 PR로 atomic 보장. partial PR X |
| 외부 link / share (직전 PR URL) | 작음 | route redirect로 처리 |
| Test 4개 hardcoded literal | 작음 | rename 시 같이 update |
| AGENTS.md docs | 작음 | 명시 update |

---

## 9. Out of Scope

- ❌ Phase 4 visual reskin (별도 PR — 명칭 변경 후 새 명칭으로)
- ❌ status 색 변경 (Q3 LOCKED)
- ❌ status 의미 변경 (동일 progression 유지)
- ❌ 새 status 추가 (3개 그대로)
- ❌ Plot v3 mockup의 inbox/capture/permanent literal — mockup은 archived/historical, 작업 안 함

---

## 10. Success Criteria

### PR 단일 acceptance
- [ ] 53 files 모두 일관 rename
- [ ] tsc 0 errors
- [ ] build clean
- [ ] tests 185+ pass (이전 inbox/capture/permanent test 4개 → stone/brick/keystone로 update)
- [ ] dev server: /stone /brick /keystone 정상 작동 + 옛 URL redirect 작동
- [ ] dark/light mode 색 보존
- [ ] 새 사용자: stone/brick/keystone으로 시작
- [ ] 기존 사용자: IDB v116 migration 후 모든 노트 status rewrite. 데이터 손실 0
- [ ] Architect verification

### 다음 작업
- Phase 4 visual reskin (PR 4.2 — notes-table.tsx에 새 명칭 적용)

---

## 부록 A — 핵심 위치

- `lib/types.ts:1` — NoteStatus type
- `lib/colors.ts` — NOTE_STATUS_HEX, NOTE_STATUS_COLORS, TEXT_HIERARCHY
- `lib/view-engine/types.ts` — ViewContextKey, VALID_VIEW_CONTEXT_KEYS, CONTEXT_DEFAULTS
- `lib/store/migrate.ts` — v116 block 추가
- `lib/store/index.ts` — version 116
- `app/(app)/inbox/` `capture/` `permanent/` — directory rename + redirect
- `components/linear-sidebar.tsx` — NavLink href + label
- `components/status-icon.tsx` — status icon switch
- `components/property-chips.tsx` — StatusChip / PriorityChip
- `app/globals.css` — `--status-*` CSS vars (Phase 1 v3 + Phase 4 selectors)

## 부록 B — Plot 정체성 검증

- 4사분면 모델 (Folder type-strict / Sticker type-free / Book ordered) 영향 X
- 색 정책 4사분면 (Label/Sticker 필수, Folder/Tag opt-in) 영향 X
- "Gentle by default" 정합 — 명칭 더 직관적 (raw 상태 명시)
