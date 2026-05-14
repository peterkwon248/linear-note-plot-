# Activity Entity-Agnostic Unification — PRD v0.1

> **Scope**: Plot의 activity logging (`noteEvents`)을 모든 entity로 확장. 현재 Note 전용 → Wiki / Template / Book / Tag / Sticker / File / Reference로 확장.
>
> **Trigger**: 사용자 시그널 (2026-05-14) — Library entity의 Activity 탭이 N/A 메시지 ("Tag history is not yet available"). 이를 실제 event timeline으로 활성화하는 게 PRD §5 (Activity entity-agnostic 통합).
>
> **Status**: DRAFT — 사용자 review 대기.

---

## §1. Current State

### 1-1. `NoteEvent` (lib/types.ts:729)

```ts
type NoteEventType =
  | "created" | "updated" | "opened" | "promoted" | "trashed" | "untrashed"
  | "triage_keep" | "triage_snooze" | "triage_trash"
  | "link_added" | "link_removed"
  | "thread_started" | ... // 20+ types

interface NoteEvent {
  id: string
  noteId: string       // ← Note에 고정
  type: NoteEventType
  at: string
  meta?: Record<string, unknown>
}
```

저장: `state.noteEvents: NoteEvent[]` (PlotState).

### 1-2. UI

- `ActivityTimeline({ noteId })` — `getEventsForNote(events, noteId)` 필터 + 시각화
- `EVENT_CONFIG` (lib/datalog/event-config.ts) — type별 icon/label

### 1-3. Wire-up

`lib/store/slices/notes.ts`에 `createNote`, `updateNote` 등 action에서 `noteEvents.push(...)`.

### 1-4. Comments (이미 cross-entity!)

```ts
type CommentAnchor =
  | { kind: "wiki-block"; articleId; blockId }
  | { kind: "note-block"; noteId; nodeId }
  | { kind: "wiki"; articleId }
  | { kind: "note"; noteId }
```

→ Comment는 이미 entity-aware (anchor discriminator). **NoteEvent도 같은 패턴 적용 가능**.

---

## §2. Goal

1. **`NoteEvent` → `EntityEvent`** — entity-agnostic event 모델
2. **Wire-up 확장** — Note action만 → 모든 entity action에서 event 기록
3. **`ActivityTimeline` 일반화** — `<ActivityTimeline entity={{ kind, id }} />`
4. **Library entity Activity 탭** — 현재 N/A placeholder → 실제 timeline
5. **Backward compat** — 기존 `state.noteEvents` 데이터 자동 마이그레이션

---

## §3. Data Model

### 3-1. EntityEvent (신규)

```ts
import type { EntityRef } from "@/lib/types"  // 기존 { kind, id }

type EntityEventType =
  // Cross-entity (모든 entity 공통)
  | "created" | "updated" | "trashed" | "untrashed" | "opened"
  // Note 전용 (기존)
  | "promoted" | "triage_keep" | "triage_snooze" | "triage_trash"
  | "link_added" | "link_removed"
  | "thread_started" | "thread_step_added" | "thread_ended" | "thread_deleted"
  | "label_changed" | "srs_reviewed" | "autopilot_applied"
  | "relation_added" | "relation_removed" | "relation_type_changed"
  | "alias_changed" | "wiki_converted"
  | "attachment_added" | "attachment_removed" | "reflection_added"
  | "split"
  // Wiki 전용 (신규)
  | "block_added" | "block_removed" | "block_reordered"
  | "section_collapsed" | "merged" | "unmerged"
  // Book 전용 (신규)
  | "item_added" | "item_removed" | "item_reordered"
  | "smart_source_added" | "smart_source_removed"
  | "converted_to_manual" | "chapter_added"
  // Tag / Sticker 전용 (신규)
  | "member_added" | "member_removed"
  | "color_changed" | "renamed"

interface EntityEvent {
  id: string
  entity: EntityRef       // { kind: EntityKind; id: string }
  type: EntityEventType
  at: string              // ⭐ 필수 — ISO timestamp. Time grouping (Today/Yesterday/...)
                          //   + sort by recency + audit history 핵심 축. 사용자 요청
                          //   (2026-05-14) — Tag 같은 entity는 자체 createdAt 없으니
                          //   event.at이 timeline의 유일한 timestamp source.
  meta?: Record<string, unknown>
}
```

### 3-2. EntityKind 확장

기존 `EntityKind` (Sticker에 사용)에 `template` / `book` 추가:

```ts
// lib/types.ts (기존)
type EntityKind = "note" | "wiki" | "tag" | "label" | "category" | "file" | "reference"

// 확장
type EntityKind = "note" | "wiki" | "tag" | "label" | "category" | "file" | "reference"
  | "template" | "book" | "sticker"  // ← 추가
```

영향: 기존 Sticker.members[]는 backward compat (template/book도 가능). 단 sticker에 template/book 추가하는 사용자 흐름은 별도 (이 PRD scope X).

### 3-3. State

```ts
interface PlotState {
  // ── (DEPRECATED, kept for migration) ──
  noteEvents: NoteEvent[]  // 사용 X — v133 마이그레이션에서 entityEvents로 이전

  // ── New ──
  entityEvents: EntityEvent[]
}
```

또는 (더 깔끔):
```ts
interface PlotState {
  entityEvents: EntityEvent[]  // 신규
  // noteEvents 제거 (마이그레이션 후)
}
```

**결정 필요**: 1-step (noteEvents 삭제) vs 2-step (deprecated 후 다음 메이저 버전 삭제). 1-step 권장 — 단순.

---

## §4. Migration (Store v132 → v133)

```ts
// lib/store/migrate.ts
if (state.version < 133) {
  const old: NoteEvent[] = state.noteEvents ?? []
  const newEvents: EntityEvent[] = old.map((e) => ({
    id: e.id,
    entity: { kind: "note", id: e.noteId },
    type: e.type,
    at: e.at,
    meta: e.meta,
  }))
  state.entityEvents = newEvents
  delete state.noteEvents
  state.version = 133
}
```

**Idempotent**: 재실행 안전 (state.noteEvents가 이미 없으면 skip).

**Rollback**: 기존 데이터 손실 X (entity.kind="note"로 1:1 매핑).

---

## §5. API

### 5-1. addEntityEvent (helper)

```ts
function addEntityEvent(
  entity: EntityRef,
  type: EntityEventType,
  meta?: Record<string, unknown>,
): EntityEvent {
  return {
    id: nanoid(),
    entity,
    type,
    at: new Date().toISOString(),
    meta,
  }
}
```

slice action에서:
```ts
state.entityEvents.push(addEntityEvent({ kind: "note", id }, "created"))
```

### 5-2. getEventsForEntity (helper, 기존 getEventsForNote replace)

```ts
function getEventsForEntity(
  events: EntityEvent[],
  entity: EntityRef,
): EntityEvent[] {
  return events
    .filter((e) => e.entity.kind === entity.kind && e.entity.id === entity.id)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
}
```

기존 `getEventsForNote(events, noteId)`는 wrapper로 backward compat:
```ts
function getEventsForNote(events: EntityEvent[], noteId: string) {
  return getEventsForEntity(events, { kind: "note", id: noteId })
}
```

---

## §6. Wire-up (Phase별)

각 entity의 action 시점에서 entityEvents.push 호출. 다음 actions 시점 정의:

### Note (기존)
- ✅ 이미 wire-up (createNote / updateNote / ... 등 20+)
- 마이그레이션 후 entityEvents.push로 변경

### Wiki (신규)
- createWikiArticle → "created"
- updateWikiArticle → "updated"
- trashWikiArticle / untrash → "trashed" / "untrashed"
- addWikiBlock / removeWikiBlock / reorderWikiBlocks → "block_added" 등
- mergeWiki / unmergeWiki → "merged" / "unmerged"

### Template (신규)
- createTemplate → "created"
- updateTemplate → "updated"
- deleteTemplate → "trashed"

### Book (신규)
- createBook → "created"
- updateBook → "updated"
- deleteBook / restore → "trashed" / "untrashed"
- addBookItem / removeBookItem / reorderBookItems → "item_added" 등
- addSmartSource / removeSmartSource → "smart_source_added" 등
- convertToManual → "converted_to_manual"

### Tag / Sticker / File / Reference (신규)
- create / update / delete → "created" / "updated" / "trashed"
- (Tag) addTagToNote / removeTagFromNote → "member_added" / "member_removed" (entity = tag)
- (Sticker) addMember / removeMember → "member_added" / "member_removed"
- (Color picker) updateTag/Sticker color → "color_changed"

---

## §7. UI Changes

### 7-1. ActivityTimeline 일반화

```ts
// 현재
<ActivityTimeline noteId={noteId} />

// 변경
<ActivityTimeline entity={{ kind: "note", id: noteId }} />
// 또는
<ActivityTimeline entityKind="note" entityId={noteId} />
```

Backward compat wrapper:
```ts
function ActivityTimeline({ noteId, entity }: ...) {
  const target = entity ?? (noteId ? { kind: "note", id: noteId } : null)
  if (!target) return <Empty />
  const events = getEventsForEntity(allEvents, target)
  ...
}
```

### 7-2. side-panel-activity.tsx 분기

현재 (PR #339):
```ts
if (entity.type === "tag") return <EntityHistoryPlaceholder label="Tag" />
```

변경:
```ts
if (entity.type === "tag" && entity.tag) {
  return (
    <div className="flex-1 overflow-y-auto">
      {/* Tag는 collaboration 단위 X — Comments 생략 */}
      <div className="px-4 py-3">
        <SectionHeader label="History" />
        <ActivityTimeline entity={{ kind: "tag", id: entity.tag.id }} />
      </div>
    </div>
  )
}
```

같은 패턴 sticker / file / reference / template / book.

### 7-3. EVENT_CONFIG 확장

새 event types (block_added, item_added, member_added, color_changed, renamed 등)에 icon + label 추가.

---

## §8. Comments wire-up (선택 사항)

Comments는 이미 entity-aware (anchor discriminator). 단 현재 wire-up:
- ✅ note (CommentsByEntity entity={{ kind: "note", noteId }})
- ✅ wiki (CommentsByEntity entity={{ kind: "wiki", articleId }})
- ❌ template / book / library entities

CommentAnchor 확장:
```ts
type CommentAnchor =
  | { kind: "wiki-block"; articleId; blockId }
  | { kind: "note-block"; noteId; nodeId }
  | { kind: "wiki"; articleId }
  | { kind: "note"; noteId }
  // 신규
  | { kind: "template"; templateId }
  | { kind: "book"; bookId }
  | { kind: "tag"; tagId }
  | { kind: "sticker"; stickerId }
```

side-panel-activity.tsx에서 CommentsByEntity 호출 — entity 종류별. 단 template/book은 collaboration 단위 X (PR #322 결정 — Template Comments 제외)라 일관성 위해 **template/book Comments도 옵션 — Detail에서 결정**.

**결정 필요**: Comments wire-up scope. 권장 — Wiki/Note만 (기존). Library entity는 협업 단위 X.

---

## §9. PR Plan

큰 작업이라 점진 PR로 분할:

### PR 1 — Foundation (큰)
- `EntityEvent` type 정의
- `entityEvents` slice 추가 + `noteEvents` 마이그레이션 v133
- `addEntityEvent` / `getEventsForEntity` helper
- Note actions wire-up (기존 noteEvents.push → entityEvents.push)
- `ActivityTimeline` `entity` prop 지원 (backward compat noteId)
- 영향: store v133 + slice notes.ts + ActivityTimeline

### PR 2 — Wiki / Template / Book wire-up
- createWikiArticle / updateWikiArticle / ... 등 wiki slice events
- create/update/delete Template events
- Book slice events (createBook / addBookItem / ...)
- Wiki / Template / Book Activity 탭에 ActivityTimeline 활성화

### PR 3 — Library entity wire-up
- Tag / Sticker / File / Reference slice events
- side-panel-activity.tsx tag/sticker/file/reference 분기를 ActivityTimeline으로 변경 (placeholder 제거)

### PR 4 — EVENT_CONFIG 확장 + polish
- 새 event types에 icon/label 추가
- 마이그레이션 toast (선택)

### PR 5 (선택) — Comments wire-up
- CommentAnchor 확장 (template/book/library)
- 사용자 결정 필요 (협업 단위 정의)

---

## §10. Risk

| Risk | Mitigation |
|---|---|
| 마이그레이션 후 stale events (noteId만 있는 객체) | Idempotent migration + `state.noteEvents` 삭제 확인 |
| EVENT_CONFIG 누락 시 type별 UI 깨짐 | EVENT_CONFIG fallback (config undefined → null skip) — 이미 ActivityTimeline에 있음 |
| ActivityTimeline backward compat 깨짐 | `noteId` prop 유지 + 내부에서 entity 변환 |
| 성능 (events 배열 커짐) | Filter는 O(N), N ≤ 수천 단위. 미래 인덱싱 후보 (현재 X) |
| Sticker.members[] vs entityEvents 혼동 | 두 데이터 모델 명확히 분리 — Sticker.members = 멤버십, entityEvents = 시간 순 history |

---

## §11. Open Questions

1. **noteEvents 제거 시점**: 1-step (v133에서 즉시 삭제) vs 2-step (deprecated). 권장 — 1-step.
2. **Comments wire-up scope**: Note/Wiki만 vs 모든 entity. 권장 — Note/Wiki만 (Template/Book은 collaboration X 룰 정합).
3. **Event types 어디까지**: 모든 action 다 추적 vs 핵심만. 권장 — 핵심 actions만 (created/updated/trashed/+ entity별 핵심 3-5개).
4. **PR 분할 vs 한 PR**: 권장 — 4-5 PR 점진 (review 쉬움 + cascade 무리 X).

---

## §12. 다음 액션 (User OK 후)

1. PR 1 Foundation 시작 — `entityEvents` slice + 마이그레이션 + Note wire-up
2. 각 PR 단위로 manual verify + 머지
3. PR 5 (Comments) 사용자 결정 — 필요 시 진행
