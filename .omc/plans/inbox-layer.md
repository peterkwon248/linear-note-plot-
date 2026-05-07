# Inbox Layer — Action Notification Queue (Linear 정합)

> ✅ **재작성 v2 (2026-05-07)**: entity-based "정리 대기 dashboard" → **action-based notification queue**로 방향 전환.
>
> v1의 "stone + 미분류" 정의는 Plot 정체성과 충돌:
> - Memo backfill 정책으로 모든 노트가 자동 label → useInbox 항상 0
> - "정리 안 된 entities"는 사실 Ontology / Library cleanup 영역 (inbox 아님)
> - Linear inbox는 **"내가 반응해야 할 일들"** = action queue
>
> 사용자 통찰 (2026-05-07 세션):
> > "스톤은 인박스가 아니야. 기존 인박스가 스톤으로 이름이 바뀐 건데. 아예 없던 인박스 개념을 새로 만들어내는 거야. 리니어의 인박스처럼. (아직 처리되지 못한 일들의 모음집 같은 곳? 듀 데이터 알람 설정이 된 것들 모음집?)"

---

## 0. Plan 메타데이터

- **상태**: APPROVED (action-based 방향 사용자 합의 2026-05-07)
- **선행**: Phase A (NoteStatus rename) — 완료 (v116)
- **현재 store version**: v117 (PR #272 — dismiss/snooze infra 머지 진행 중)
- **Plot 정체성**: "Gentle by default, powerful when needed"
- **참조**: Linear / Things3 inbox 패턴 (단, 1인 도구 맥락 — collaboration notification 없음)

---

## 1. 핵심 결정 (영구)

### Inbox = Action Notification Queue
- **사용자가 *반응*해야 할 일들**의 모음 (Linear 정합)
- "정리 안 된 entities"가 아님 (그건 Ontology / Home stats 영역)
- 각 항목은 **action source**별로 분류 (entity가 아니라 *왜 이게 inbox에 있는가*)

### Inbox 항목 후보 (action sources)

| Source | 데이터 출처 | 의미 | 우선순위 |
|--------|------------|------|----------|
| 🔔 **reminder** | `Note.reviewAt` (이미 있음) | 사용자가 명시 "나중에" 설정한 노트 due 도래 | P0 (가장 강함, 첫 PR) |
| 🧠 **srs** | `srsStateByNoteId` (이미 있음) | SRS 리뷰 도래 (Anki-like) | P1 (Plot 특화) |
| ⏰ **snooze-expired** | `snoozedInboxItems` (PR #272) | 사용자가 snooze한 inbox 항목 만료 | P1 (self-meta) |
| 🔗 **wiki-redlink** | linksOut + wikiArticles diff | `[[새 개념]]` 작성했는데 wiki 미생성 | P2 (옵션) |
| 💡 **auto-enroll** | `clusterSuggestions` (이미 있음) | 자주 언급되는 개념 wiki 등재 제안 | P2 (옵션) |

### 단일 통합 inbox
- 모든 source가 한 inbox에 모임 (Linear 패턴)
- entity 분리 X — source 분리만

### 위치
- **Home 안 카드** (Quick Capture / Stats / Featured 옆) — quick view
- `/inbox` full-page — 전체 + filter
- v3 11결정 #1 7-space 보존 (top-nav 8번째 X)

### 사용자 액션
- **Resolve** (action 처리) — 예: reminder 노트 열어서 처리, SRS 리뷰 완료 등
- **Dismiss** — Linear archive 패턴 (이미 본 것)
- **Snooze** — Things3 패턴 (나중에 다시)
- **Undo dismiss** — 실수 방지

---

## 2. Data Model (PR #272 + 확장)

### 신규 store state (PR #272에서 이미 추가)
```ts
// lib/store/slices/inbox.ts (이미 존재)
dismissedInboxItems: InboxDismissed[]
snoozedInboxItems: InboxSnoozed[]

interface InboxDismissed {
  kind: EntityKind  // ← v3에서 InboxItemKind로 변경 필요
  id: string
  dismissedAt: string
}
interface InboxSnoozed {
  kind: EntityKind  // ← v3에서 InboxItemKind로 변경 필요
  id: string
  snoozedUntil: string
  snoozedAt: string
}
```

### v3 변경 사항 (PR #272 update)
`EntityKind`를 `InboxItemKind`로 교체:
```ts
// lib/store/slices/inbox.ts (update)
export type InboxItemKind =
  | "reminder"
  | "srs"
  | "snooze-expired"  // self-referential — snooze 만료된 inbox 항목 자체가 inbox 항목
  | "wiki-redlink"
  | "auto-enroll"

// dismiss/snooze는 (kind, sourceId)로 식별
```

### useInbox hook (PR #272 update)
```ts
export interface InboxItem {
  /** Action source — 왜 이게 inbox에 있는가 */
  kind: InboxItemKind
  /** Stable identity (kind + sourceId 조합으로 dedupe) */
  sourceId: string
  /** Display label (note title, "5 cards due", etc.) */
  title: string
  /** 정렬 timestamp (due date, scheduled date, etc.) */
  ts: string
  /** Optional action hint ("Due today", "Overdue 2d", "Create wiki?") */
  action?: string
  /** Optional secondary meta (folder, tag 등 UI에서 사용) */
  meta?: string
}

export function useInbox(): InboxItem[] { ... }
```

### Action별 source 정의

#### `reminder` (PR inbox-2 첫 source)
- 조건: `note.reviewAt !== null && reviewAt <= now()` (today + overdue)
- 정렬: due date 오름차순 (overdue 먼저)
- action: "Due today" / "Overdue Nd"
- 클릭: 노트 열기

#### `srs` (PR inbox-3+)
- 조건: `srsStateByNoteId[noteId].nextReviewAt <= now()`
- 정렬: scheduled date 오름차순
- action: "Review now"
- 클릭: SRS 리뷰 모드 진입

#### `snooze-expired` (PR inbox-3+)
- 조건: `snoozedInboxItems` 중 `snoozedUntil <= now()`
- 정렬: snooze 만료 시점 desc
- action: "Snooze ended"
- 클릭: 원본 entity 열기
- 자동 cleanup: `clearExpiredSnoozed` action으로 만료 후 일정 시간 지나면 제거

#### `wiki-redlink` (PR inbox-4+ 옵션)
- 조건: `[[wikilink]]`이 작성됐는데 해당 wiki article 미생성
- 정렬: 등장 빈도 desc
- action: "Create wiki?"
- 클릭: wiki 생성 dialog
- 노이즈 주의: 너무 많으면 사용자 부담 → top N만, 또는 빈도 threshold

#### `auto-enroll` (PR inbox-4+ 옵션)
- 조건: `clusterSuggestions` (이미 있음)
- 정렬: confidence desc
- action: "Enroll wiki?"
- 클릭: 자동 등재 confirm
- Plot 자동 분석 결과 노출

---

## 3. UI Spec

### Home 안 inbox 카드
```
┌─────────────────────────────────────┐
│ 📥 Inbox                       3 ▸ │
├─────────────────────────────────────┤
│ 🔔 "Quick note about X" · Due today│
│ 🔔 "Project plan" · Overdue 2d     │
│ 🧠 SRS due (5 cards)               │
└─────────────────────────────────────┘
```

- count 표시
- "View all →" → `/inbox`
- 항목별 source icon + title + action hint
- 0 항목이면 카드 숨김 (Plot "Gentle" 정체성)

### `/inbox` full-page
- ViewHeader "Inbox" + count
- Filter tabs: All (default) / Reminders / SRS / Wiki / etc.
- Row layout:
  - source icon (action 의미별)
  - title (entity 이름 또는 group label)
  - action hint
  - meta (오른쪽: due date / age 등)
  - hover에 dismiss / snooze button
- Empty state: "🎉 Inbox zero! All caught up."

### Source icon 매핑 (proposed)
- reminder: `Bell` (phosphor)
- srs: `Brain` 또는 `CardsThree`
- snooze-expired: `MoonStars` 또는 `Alarm`
- wiki-redlink: `LinkBreak` 또는 `BookOpen`
- auto-enroll: `Sparkle` 또는 `Lightbulb`

---

## 4. PR 분해 (재정의)

### ✅ PR #272 (in progress) — Inbox infra (data layer)
- `lib/store/slices/inbox.ts` — dismiss/snooze actions
- `lib/store/migrate.ts` — v117 idempotent migration
- `lib/hooks/use-inbox.ts` — **action-based로 재작성 필요** (v3에서 reminder source 시작)
- `EntityKind` → `InboxItemKind` 교체

### PR inbox-2 — Home inbox card (reminder source)
- `components/views/home-view.tsx` — 새 통합 inbox 카드
- 첫 source: **reminder** 만 (`Note.reviewAt` 도래)
- top 3-5 노출 + count + "View all →" /inbox
- 0 항목 카드 숨김

### PR inbox-3 — `/inbox` full-page + 추가 sources
- `app/(app)/inbox/page.tsx` — full-page
- Filter tabs (All / Reminders / SRS / etc.)
- dismiss/snooze action button (hover)
- 추가 sources: **srs**, **snooze-expired**

### PR inbox-4 — Sidebar entry + Plot 특화 sources (옵션)
- `linear-sidebar.tsx` — Inbox link 추가 (Notes 위)
- 추가 sources: **wiki-redlink**, **auto-enroll**

---

## 5. v3 PRD 영향

### Phase 5 (5 view modes) 적용 범위
- 기존: `/notes, /inbox, /capture, /permanent, ...`
- 새: `/notes, /stone, /brick, /keystone, /tag/[id], ...`
- `/inbox`는 **별도 layer** (5 view modes 적용 X — 자체 디자인)

### Phase 6 (Filter Popover + Workspace Chrome)
- inbox는 별도 page라 filter / workspace chrome 동일 적용

---

## 6. Risks & Mitigations

| 리스크 | 영향 | 완화 |
|--------|------|------|
| 너무 많은 항목 (특히 reminder backfill) | 사용자 부담 | top N (3-5) Home 카드. Full-page filter. |
| reminder 도래 = "지나면 영원히 inbox" | 부담 누적 | dismiss / snooze 액션 + "Resolved" 자동 (노트 처리 후) |
| SRS 도래 항목 중복 (같은 노트) | 시각 중복 | source별 dedupe (note + srs 동시 reminder는 reminder 우선) |
| 자동 인사이트 noise | UX 후퇴 | wiki-redlink/auto-enroll은 P2 옵션 — 사용자 선호로 toggle |
| `/inbox` URL 사용자 북마크 (기존 status filter 의미) | breaking change | redirect / 의미 변경 명시 (Phase A 머지 시점에 이미 다른 의미) |

---

## 7. Out of Scope (v3 1차)

- ❌ Mention / assignment notification (Plot 1인 도구)
- ❌ AI suggestion (LLM 미사용 정책)
- ❌ 모바일 view (future)
- ❌ inbox 검색 (간단 sort/filter만)
- ❌ inbox grouping by date (Today / This week / Overdue) — P2 옵션
- ❌ 실시간 push notification (browser API) — future

---

## 8. Success Criteria

### Phase B 단일 acceptance
- [ ] reminder due 도래 자동 inbox 노출 (가장 강함)
- [ ] dismiss / snooze / undo 작동
- [ ] Home 카드 0 항목 시 숨김
- [ ] `/inbox` full-page filter tabs 정상
- [ ] dark/light mode
- [ ] tsc 0 / build clean / tests pass

### 점진 확장 acceptance
- [ ] SRS due 통합
- [ ] snooze-expired 자동 재노출
- [ ] (옵션) wiki-redlink / auto-enroll source 추가

---

## 9. 부록 — 디자인 결정 메모

### 왜 action-based?
1. **Linear inbox 정합** — "내가 반응해야 할 일들"이 명확
2. **plot 정체성 ("Gentle by default")** — 사용자가 명시한 일 (reminder 설정 등)만 노출
3. **확장성** — 새 action source 추가 가능 (SRS, wiki, auto-enroll 등)
4. **noise 방지** — entity-based "정리 안 된 것"은 noisy (모든 stone 노트가 inbox에 = 부담)

### 왜 reminder 첫 source?
1. **사용자 명시 신호** — 가장 명확한 "나중에" 의도
2. **이미 인프라 존재** — `Note.reviewAt`, `setReminder` action 이미 store에 있음
3. **즉시 가치** — reminder UI 가시성 부족했음 → inbox에 통합하면 즉시 효용
4. **노이즈 0** — 사용자가 직접 설정한 것만

### 왜 entity-based 폐기?
- Memo backfill로 useInbox 항상 0 (실측)
- "정리 안 된 entities" = Ontology / Home stats 영역과 중복
- "stone 노트가 모두 inbox" = 너무 noisy (Plot 정체성 위배)
- 사용자 통찰: "스톤은 인박스가 아니야"

### dismiss/snooze infra (PR #272) 그대로 유효
- action-based에서도 dismiss/snooze 필요 (Linear 정합)
- (kind, sourceId) 식별 — kind 의미만 변경 (EntityKind → InboxItemKind)

---

## 10. 핵심 위치 (작업 시)

- `lib/store/slices/inbox.ts` (PR #272 — kind 타입 교체 필요)
- `lib/hooks/use-inbox.ts` (PR #272 — action-based 재작성 필요)
- `components/views/home-view.tsx` (PR inbox-2 — Home 카드)
- `app/(app)/inbox/page.tsx` (PR inbox-3 — full-page, 신규)
- `lib/store/index.ts` (state 그대로)
- `lib/store/migrate.ts` (v117 그대로)
- `components/linear-sidebar.tsx` (PR inbox-4 — sidebar entry)
