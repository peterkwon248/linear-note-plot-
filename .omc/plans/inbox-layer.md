# Inbox Layer — 단일 통합 알림함

> ⚠️ **DRAFT — 미확정 (2026-05-07)**: 이 plan의 도입 여부 자체가 사용자 결정 미완료 상태.
> "Inbox 단어를 알림함 의미로 부여 + 기능 구현"은 직전 세션 새벽에 *합의 안 됨*.
> Phase A (rename)만 우선 진행하고, Phase B는 사용자 추가 결정 후 진행할 것.
> 새 세션이 자동으로 진행하지 말 것.
>
> **Phase B of 2** (Phase A = NoteStatus rename, 별도 plan). 새 layer 신규 디자인 + 구현.
> Linear / Things3 패턴 정합. Plot "Gentle by default, powerful when needed" + IKEA 전략 정합.
> **선행 조건**: Phase A (NoteStatus rename) 완료 + **사용자가 알림함 도입을 명시적으로 결정**한 후.

---

## 0. Plan 메타데이터

- **상태**: Draft (2026-05-08 새벽)
- **선행**: Phase A (NoteStatus rename) — 완료 후 진행
- **현재 store version**: Phase A 완료 시 v116. Phase B는 v117 (inbox state — dismissed/snoozed 등)
- **Plot 정체성**: "Gentle by default, powerful when needed" + IKEA 전략 (앱이 자동 정리)
- **작업 원칙**: 정확도 + 버그 위험 최소화

---

## 1. 결정 (영구)

### 단일 통합 Inbox (entity별 분리 X)
- ⭐ **하나의 inbox** = 모든 entity 처리 대기 통합 (Note + Wiki stub + Book unfinished + Reference 미링크 등)
- per-entity inbox 분산 X — 사용자가 한 곳만 보면 됨
- Linear / Things3 / Notion 패턴 정합

### 위치: Home 안 카드 + `/inbox` full-page
- **Home 안 카드** (Quick Capture / Stats / Recent / Quicklinks 옆) — quick view
- `/inbox` 별도 full-page — 자세히 보기 + filter tabs (entity별)
- v3 11결정 #1 7-space (home/notes/wiki/calendar/ontology/library/books) 보존 — inbox는 home 안 section

### 정의: 하이브리드 (자동 + dismiss)
- **자동 필터** default — 각 entity가 자기 "처리 대기" 정의
- **사용자 dismiss** 가능 — Linear archive 패턴 (이미 봤음 표시)
- snoozed (나중에 다시) 가능 — Things3 패턴

### 자동 필터 (entity별)

| Entity | 자동 inbox 항목 |
|--------|------|
| **Notes** | `stone` status + 미분류 (no folder/tag/label) — recent 24h 추가 가능 |
| **Wiki** | `stub` status (미완성 article) — 이미 있는 wiki status 활용 |
| **Book** (v3 7번째) | unfinished — chapter 정리 대기 (future) |
| **Reference** | 미링크 reference (no backlinks) — 정리 대기 |
| **Files** | 최근 upload 미분류 (no noteId attached) |
| **(Optional) SRS** | scheduled review 도래 (snooze 끝남) — 큰 작업, 별도 PR |

---

## 2. UI Spec

### Home 안 inbox 카드
```
┌─────────────────────────────────────┐
│ 📥 Inbox                       12 ▸ │  ← count + click to /inbox
├─────────────────────────────────────┤
│ 📝 5 Notes (stone) · 미분류        │
│ 📚 3 Wiki stubs                    │
│ 🔖 2 References (미링크)           │
│ 📁 2 Files (미분류)                │
└─────────────────────────────────────┘
```

또는 단순 (recommended):
```
┌─────────────────────────────────────┐
│ 📥 Inbox                       12 ▸ │
├─────────────────────────────────────┤
│ ○ stone "Untitled note 1"          │
│ ○ stub  "wiki entry preview"       │
│ ○ ref   "Untitled reference"       │
│ + 9 more                            │
└─────────────────────────────────────┘
```

### `/inbox` full-page
- 헤더: ViewHeader "Inbox" + count
- Filter tabs: All (default) / Notes / Wiki / Book / Reference / Files
- Row: entity icon + title + meta (folder / tag / age) + dismiss action
- Sort: oldest first (정리 안 된 것부터) 또는 newest first
- Empty state: "🎉 Inbox zero! All caught up."

### v3 visual 정합
- Phase 4 `.a-row` / `.a-stchip` / `.a-tag` 클래스 활용
- inbox row = `.a-row` + dismiss button
- entity별 icon = `.a-row__icon[data-tone="..."]` (status-stone / wiki-stub / ref / file 등)

---

## 3. Data Model

### 신규 store state (v117)
```ts
// lib/store/slices/inbox.ts (신규)
interface InboxSlice {
  // dismissed entity refs (사용자가 "처리 완료" 표시)
  dismissedInboxItems: { kind: EntityKind; id: string; dismissedAt: string }[]
  
  // snoozed (나중에 다시) — Things3 패턴
  snoozedInboxItems: { kind: EntityKind; id: string; snoozedUntil: string }[]
  
  // actions
  dismissInbox: (kind: EntityKind, id: string) => void
  undoDismissInbox: (kind: EntityKind, id: string) => void
  snoozeInbox: (kind: EntityKind, id: string, until: Date) => void
}
```

### Hooks
```ts
// lib/hooks/use-inbox.ts (신규)
export function useInbox(): InboxItem[] {
  const notes = useStore((s) => s.notes)
  const wikis = useStore((s) => s.wikiArticles)
  const refs = useStore((s) => s.references)
  const files = useStore((s) => s.attachments)
  const dismissed = useStore((s) => s.dismissedInboxItems)
  const snoozed = useStore((s) => s.snoozedInboxItems)
  
  return useMemo(() => {
    const items: InboxItem[] = []
    
    // Notes: stone + 미분류
    notes.filter((n) => 
      !n.trashed &&
      n.status === "stone" &&
      n.folderIds.length === 0 &&
      n.tags.length === 0 &&
      !n.labelId
    ).forEach((n) => items.push({ kind: "note", id: n.id, title: n.title || "Untitled", ... }))
    
    // Wiki: stub
    wikis.filter((w) => w.status === "stub")
      .forEach((w) => items.push({ kind: "wiki", id: w.id, title: w.title, ... }))
    
    // ... References, Files, etc.
    
    // Filter dismissed + snoozed
    return items.filter(item => 
      !dismissed.some(d => d.kind === item.kind && d.id === item.id) &&
      !snoozed.some(s => s.kind === item.kind && s.id === item.id && s.snoozedUntil > now())
    )
  }, [notes, wikis, refs, files, dismissed, snoozed])
}
```

---

## 4. PR 분해 (4-5 PR)

### PR inbox-1 — Inbox slice + hook (data layer)
- `lib/store/slices/inbox.ts` 신규 (dismiss / snooze actions)
- `lib/hooks/use-inbox.ts` 신규 (entity 통합 useInbox)
- IDB v117 migration (initial state)
- types 추가
- 단순 — UI 영향 0

### PR inbox-2 — Home inbox card
- `components/views/home-view.tsx` 또는 home section 추가
- v3 mockup home dashboard 디자인 정합
- 단순 — 카드 1개 추가

### PR inbox-3 — `/inbox` full-page
- `app/(app)/inbox/page.tsx` 의미 변경 (status filter → 통합 inbox)
- 또는 새 page 추가 (`/inbox` 그대로 두고 의미 변경)
- Filter tabs (entity별)
- Row + dismiss action
- 큰 PR (UI / 인터랙션)

### PR inbox-4 — Sidebar entry
- linear-sidebar.tsx에 Inbox link 추가 (Notes 위)
- 또는 home에서만 진입 (PR inbox-2 후)

### PR inbox-5 (옵션) — SRS / Snooze 통합
- scheduled review 도래 항목 inbox 표시
- 큰 작업, 별도 plan 가능

---

## 5. v3 PRD 영향

### Phase 5 (5 view modes 적용 범위) 변경
- 기존: `/notes, /inbox, /capture, /permanent, ...`
- 새: `/notes, /stone, /brick, /keystone, /tag/[id], ...` — `/inbox` 제거 (별도 layer)

### Phase 6 (Filter Popover + Workspace Chrome) 영향
- inbox는 별도 page라 filter / workspace chrome 동일 적용
- 큰 변경 없음

### Phase 7 (QA + Polish)
- inbox layer QA 추가

---

## 6. Risks & Mitigations

| 리스크 | 영향 | 완화 |
|--------|------|------|
| 자동 필터 잘못 — 너무 많은 항목 | 사용자 부담 | "미분류" 정의 명확. 또는 사용자가 filter 조정 옵션 |
| dismiss 후 다시 보고 싶을 때 | UX 회귀 | undo dismiss action + history (Linear archive 패턴) |
| 중복 entity (note가 wiki에도 link) | 혼란 | entity kind별 분리 — 같은 ID라도 별도 inbox 항목 |
| `/inbox` URL 사용자 북마크 | 깨짐 | redirect 또는 의미 변경 (Phase A에서 임시 처리) |
| inbox 너무 자주 봄 → 부담 | UX 후퇴 | "Inbox zero" 패턴 + dismiss + snooze로 처리 가능 |

---

## 7. Out of Scope (Phase B 1차)

- ❌ SRS / scheduled review 통합 (별도 PR/Phase)
- ❌ AI suggestion (Plot LLM 미사용 정책)
- ❌ Linear 패턴 100% 복제 (Plot 1인 도구 — mention/할당 없음)
- ❌ 모바일 view (future)
- ❌ inbox 검색 (간단 sort만)

---

## 8. Success Criteria

### Phase B 단일 acceptance
- [ ] Home 안 inbox 카드 정상 (count + recent items 노출)
- [ ] `/inbox` full-page 정상 (filter tabs + row + dismiss)
- [ ] 자동 필터 정확 (entity별)
- [ ] dismiss / snooze / undo 작동
- [ ] dark/light mode
- [ ] keyboard nav (j/k 등)
- [ ] tsc 0 / build clean / tests pass
- [ ] IDB v117 migration (no data loss)

### 다음 작업
- Phase 4 visual reskin 재개 (notes-table.tsx 등) — 새 명칭 (stone/brick/keystone) 사용

---

## 9. 부록 — 디자인 결정 메모

### 왜 단일 통합 Inbox?
1. **Plot 정체성 ("Gentle by default")**: 사용자 한 곳만 봄
2. **Linear / Things3 패턴**: 단일 inbox = 표준
3. **확장성**: 새 entity 추가 시 자동 통합
4. **IKEA 전략**: 앱이 자동 분류 — 사용자 부담 ↓

### 왜 home 안 카드 + 별도 full-page?
- v3 11결정 #1 (7-space) 보존
- Plot home dashboard 정체성 (이미 카드들 있음)
- Linear 패턴 (top-nav inbox) 미사용 — Plot 7-space 우선

### 왜 자동 필터 + dismiss (하이브리드)?
- IKEA 전략 (자동) + 사용자 의도 (dismiss)
- Linear archive 패턴 정합

---

## 부록 — 핵심 위치 (Phase B 작업 시)

- `lib/store/slices/inbox.ts` (신규)
- `lib/hooks/use-inbox.ts` (신규)
- `components/views/home-view.tsx` (inbox 카드 추가)
- `app/(app)/inbox/page.tsx` (의미 변경)
- `lib/store/index.ts` (version 117)
- `lib/store/migrate.ts` (v117 block)
- `components/linear-sidebar.tsx` (옵션 — Inbox link 추가)
