# Unified Temporal Hooks — PRD v0.1

> **Scope**: Plot에 흩어진 "미래 시점 알림" 메커니즘(snooze / SRS / plannedDate / staleness / inbox sources)을
> 단일 `Hook` 모델로 통합. 모든 엔티티(Note / Wiki / Book)가 동일한 시간 관계를 가질 수 있게 한다.
>
> **Trigger**: "타임라인을 Books/Notes에도 적용할 수 있나?"라는 질문(2026-05-22 세션)에서 출발 →
> snooze/SRS/plannedDate가 *같은 필요의 파편*임을 발견 → 통합 브레인스토밍.
>
> **Status**: DRAFT v0.1 — 브레인스토밍 합의 결과를 문서화한 것. **구현 승인 전.** §11 Open Questions 미해결.
> ("Plan files ≠ user decisions" — 이 문서는 합의된 *모델*이고, 구현 착수는 별도 승인 필요.)
>
> **선행 PRD (이 문서가 그 위에 쌓는다)**:
> - `inbox-layer.md` (APPROVED, 구현됨) — Inbox = action notification queue. 5 source kind.
> - `activity-unification-prd.md` (구현됨) — `EntityEvent` 스트림. `CommentAnchor` block 단위. `thread_*` 이벤트.

---

## §0. 배경 — 왜 이 PRD인가

### 0-1. 파편화 진단

Plot은 "이 엔티티를 미래 어느 시점에 다시 내 앞에 띄워라"라는 **하나의 필요**를, 엔티티·상태별로
따로 4~5번 구현했다 — 서로 모르는 채로:

| 파편 | 어디 | 대상 | 정체 |
|---|---|---|---|
| `Note.reviewAt` + `triageStatus` | `workflow.ts` (`setReminder`/`triageSnooze`) | stone 노트 | 수동 스누즈/리마인더 |
| `srsStateByNoteId` | `lib/srs` + `workflow.ts` | keystone 노트 | 적응형 복습(SRS) |
| `WikiArticle.plannedDate` | `wiki-articles.ts` | wiki article | 완성 목표일 |
| staleness 룰 | `lib/analysis` | brick 노트 | 방치 자동 감지 |
| inbox sources (5종) | `inbox-layer.md` | — | 위 결과들의 표시 표면 |

**스모킹건**: 위키의 `plannedDate`는 스누즈/리마인더를 다른 이름으로 재발명한 것이다. 같은 개념이
세 군데에 서로 다른 데이터 모델로 박혀 있다.

### 0-2. 이 PRD의 입장

위 파편들은 **하나의 가족**이다 — 전부 "언제 다시 띄울까 + 왜"의 답이다. 이를 단일 `Hook` 모델로
통합한다. 이건 기능 추가가 아니라 **de-fragmentation**이다.

원래 트리거였던 "Books 타임라인" 작업과의 관계는 §12 참조.

---

## §1. 핵심 명제

> **모든 temporal 기능은 한 질문에 답한다: "이거 언제 다시 내 앞에 띄울까, 그리고 왜?"**

- "왜"가 정책(policy)을 결정한다 — 미루기 / 마감 / 되새김 / 방치 / 반복 / 감시.
- "언제"는 트리거(trigger)다 — 시계가 쏘거나(예정형), 그래프 변화가 쏘거나(반응형).
- 정책이 6개든 트리거가 2종이든, **데이터 모델은 단 하나의 `Hook`**.

---

## §2. 모델 — `Hook`

### 2-1. 단일 추상

```ts
interface Hook {
  id: string
  target: EntityRef | WorkItemRef   // 노드 전체 vs 노드 안의 작업 조각 (§4)
  policy: HookPolicy                // 왜 (snooze/plan/srs/staleness/recurring/watch)
  trigger: HookTrigger              // 언제
  action: HookAction                // 어떻게 표면화 (loudness 포함, §8)
  state?: Record<string, unknown>   // 정책별 상태 (예: SRS step/dueAt)
  createdAt: string
}
```

### 2-2. 트리거 — 축은 하나(이벤트), 갈래는 둘

`activity-unification-prd.md`가 만든 `EntityEvent` 스트림이 **척추**다. 모든 변화가 이 스트림에
append된다. 트리거는 이 스트림(+시계)에 대한 **구독**이다.

| 갈래 | 정의 | 소스 | 타임라인에 |
|---|---|---|---|
| **예정형 (scheduled)** | 발생 시점을 미리 앎 | 시계 | 미래에 *그릴 수 있음* |
| **반응형 (reactive)** | 발생 시점 모름 | 그래프 이벤트 매칭 | 터져야 나타남 |

> 통찰: 시간 트리거도 "시계가 쏜 이벤트"다. 그래서 축은 하나(**이벤트**)이고, 예정형/반응형은
> 그 안의 두 갈래일 뿐. 엔진은 하나(`Hook`), UX 구분만 유지한다.

```ts
type HookTrigger =
  | { kind: "scheduled"; at: string }                 // 단발 (snooze/plan)
  | { kind: "recurring"; rule: RecurrenceRule }        // 고정 반복
  | { kind: "srs"; srsState: SRSState }                // 적응 반복 (§5)
  | { kind: "event-match"; pattern: EventPattern }     // 반응형 (watch/staleness)
```

`EventPattern` 문법은 Open Question (§11).

### 2-3. 스트림이 척추 — 세 소비자

```
                 ┌─ Timeline  : 스트림을 *시각화* (과거 마커 + 미래 hook)
EntityEvent ─────┼─ Hook engine: 스트림을 *구독* → 매칭 시 action 발화
   스트림         └─ Inbox     : 발화된 hook을 *due 슬라이스*로 표시
```

`reactive` hook의 원시 버전은 이미 존재한다 — `wiki-redlink`(link_added → redlink 감지 → Inbox).
없는 것은 *일반화된, 사용자가 거는* 구독 엔진뿐.

---

## §3. 6 정책

| 정책 | 트리거 | 누가 | 횟수 | 기본 loudness | 현재 상태 |
|---|---|---|---|---|---|
| **snooze** 미루기 | scheduled | 사용자 | 1회 | passive | `reviewAt` (stone 한정) |
| **plan** 마감 | scheduled | 사용자 | 목표 1회 | passive | `plannedDate` (wiki 한정) |
| **SRS** 되새김 | srs (적응 반복) | 알고리즘 | 무한 | active(Review) | `srsStateByNoteId` (keystone 한정) |
| **staleness** 방치 | event-match (N일 무변경) | 시스템 | 임계 | passive | `lib/analysis` 룰 |
| **recurring** 반복 | recurring (고정) | 사용자 | 무한 | passive | ❌ 없음 (신규) |
| **watch** 감시 | event-match (그래프 변화) | 사용자 | 이벤트마다 | silent | ❌ 없음 (신규, `wiki-redlink`이 원시형) |

- **snooze ↔ SRS 차이**: snooze = *미처리 작업*을 미룸(행동 지향, 끝남). SRS = *완성 지식*을 되새김
  (기억 지향, 안 끝남, 간격만 확장).
- **plan vs snooze**: plan은 목표 시점(약속), snooze는 deferral. 둘 다 scheduled — 데이터 모델 동일,
  의도 라벨만 다름.

---

## §4. 엔티티 모델 — atom vs aggregate

### 4-1. 두 종류의 엔티티

| 종류 | 엔티티 | 성숙 축 | 주된 hook 갈래 |
|---|---|---|---|
| **atom** (콘텐츠 원자) | Note, Wiki | 있음 (Note 3단 / Wiki 2단) | 예정형 (시간·성숙 기반) |
| **aggregate** (집합) | Book | 없음 (kind는 구조 discriminator) | 반응형 (멤버 이벤트 기반) |

> `NoteType = "note" | "wiki"` — wiki는 사실상 note의 한 종류. 둘 다 콘텐츠 원자.
> Book은 `items[]` 컨테이너 — 자기 콘텐츠가 없는 *집합*.

### 4-2. 2-Layer hook 분류

- **Layer A — 노드 hook**: 엔티티 *전체*의 lifecycle 대상. `target = EntityRef`.
- **Layer B — 작업 hook**: 노드 안의 *작업 조각* 대상. `target = WorkItemRef`. 성숙도 무관.
  - 작업 조각 = 코멘트/스레드(`CommentAnchor` — 이미 block 단위까지 anchor 가능), 본문 체크박스 todo,
    raw stone 노트의 암묵 triage 작업.
  - **snooze는 Layer B에 산다.** stone이 snooze를 가진 건 stone이라서가 아니라, raw 노트가
    *그 자체로 작업 아이템*이라서. 일반형은 코멘트/스레드.

### 4-3. atom의 maturity → hook 매핑 (대각선)

| 단계 | 노드 hook (Layer A) | 비고 |
|---|---|---|
| stone (raw) | — | 노드가 곧 작업 아이템 → Layer B snooze |
| brick (작업 중) | **plan** + staleness(자동) | plan = "완성 목표". 현재 brick은 의도적 hook 없음 (구멍) |
| keystone (완성) | **SRS** | 굳은 지식만 되새김 의미 있음 |

- SRS가 stone/brick에 안 맞는 이유: 미형성 지식은 복습 대상이 아님.
- Wiki는 stub→Article 2단 (raw 단계 없음 — 의도적 생성). stub ↔ brick, Article ↔ keystone 대응.
  → 그래서 wiki stub이 `plannedDate`(=plan hook)를 가진 것. **brick 노트는 같은 단계인데 못 가짐 = 구멍.**

### 4-4. aggregate(Book)의 Layer A = 이벤트 hook

Book은 성숙 축이 없다. 대신 **멤버 이벤트 스트림**이 있다 (`item_added` / `item_removed` /
멤버 `promoted` / `smart_source_added` — `activity-unification-prd.md`에서 이미 발화 wire-up됨).

→ **Book의 Layer A = 반응형 hook**:
- "모든 멤버가 keystone 되면" → 컬렉션 완성 신호
- "Smart Book에 새 항목 자동 편입" → 통지
- "멤버가 trashed 되면" → 컬렉션 깨짐 경고
- "N개월 새 항목 0" → collection staleness

Book은 *예외*가 아니라 **반응형 축의 대표 시민**이다. atom은 예정형 축, aggregate는 반응형 축에 산다.

### 4-5. 전이 규칙 (이미 부분 구현됨)

단계가 바뀌면 hook도 따라간다. **Plot은 이미 한 케이스를 구현해놨다** —
`workflow.ts`의 `promote` 액션이 `enrollSRS`를 자동 호출 (`undoPromote` → `unenrollSRS`).
"완성 단계 도달 → SRS hook 자동 장착". 통합 모델은 이 패턴을 일반화한다.

---

## §5. SRS — 기존 구현 (흡수 대상)

SRS는 통합 모델에서 **"적응 반복" trigger를 가진 hook의 한 종류**다. 기존 `lib/srs` 엔진은
그대로 유지하고, `Hook.state`에 `SRSState`를 담는다.

기존 구현 (`lib/srs/`):
- **7단 사다리**: `INTERVALS = [1, 3, 7, 14, 30, 60, 120]`일
- `SRSState`: `step` / `dueAt` / `lastReviewedAt` / `introducedAt` / `lapses`
- 등급 `SRSRating` 0~3 (Again/Hard/Good/Easy): Again→step 0+lapse / Hard→hold or −1 / Good→+1 / Easy→+2
- `dueAt = now + INTERVALS[step]`. 대상 = keystone. `enrollAllPermanentSRS()` 일괄 등록.

통합 후: SRS hook = `{ policy: "srs", trigger: { kind: "srs", srsState }, action: { loudness: "active" } }`.
복습 완료 시 `computeNextStep` → `srsState` 갱신 → `dueAt` 재계산. 변경 없음, 래핑만.

---

## §6. 표면 — Inbox + Timeline

같은 hook 데이터의 두 projection. **Inbox = "지금" 세로 단면 / Timeline = 시간축 전체.**

### 6-1. Inbox — `inbox-layer.md` 위에 intent 섹션화

`inbox-layer.md`가 확정한 것 (유효, 유지): Inbox = action notification queue.
"사용자가 반응해야 할 일들"의 모음, source별 분류, 단일 통합 inbox, dismiss/snooze 가능.

**이 PRD의 추가**: 기존 source 5종을 *intent 섹션*으로 묶는다. 이유 — source가 6 정책으로
늘면 flat source-tab이 안 늘어나고, SRS(되새김)는 task(할 일)와 *종류가 다르며* 영원히 안 비워진다.

| 섹션 | 정체 | 들어오는 hook | 비워지나? |
|---|---|---|---|
| **Do** | 할 일 | snooze 만료, plan due, triage | ✅ (처리 = 비움) |
| **Review** | 되새김 | SRS due | ❌ (무한 반복이 정상) |
| **Detected** | 시스템이 찾은 것 | staleness, wiki-redlink, watch, auto-enroll | 부분적 |

→ 사용자의 "Inbox = 처리할 일 모음"이라는 GTD식 기대는 **Do 섹션**으로 보존되고,
SRS는 옆 칸(Review)에서 본질이 안 깨진다. 기존 `InboxItemKind` 5종은 섹션에 매핑된다.

### 6-2. Timeline — 이벤트 스트림 + hook 시각화

한 엔티티 row =
- **과거**: `EntityEvent` 마커 (이미 구현 — `EVENT_MARKER_CONFIG`)
- **현재**: lifespan 막대 + now선
- **미래**: 예정형 hook 마커 (snooze/SRS/plan 핀)
- **상시**: 활성 watch 표시

타임라인은 "뷰 모드"가 아니라 **이벤트 스트림 + hook의 시각화 캔버스**다. hook이 entity-agnostic
이므로 타임라인도 그래야 한다 (→ §12 컴포넌트 일반화).

---

## §7. UI — hook을 어떻게 거나

입구는 여럿, 산출물은 하나의 `Hook`. **앱이 단계 맞는 hook을 제안(gentle), 룰 빌더로 정밀(powerful).**

| Surface | 담당 순간 | 잘 맞는 hook | 레퍼런스 |
|---|---|---|---|
| **우클릭 메뉴** | "이 엔티티에 뭔가" | 전부 (baseline) — 단계별 프리셋 | — |
| **타임라인 드래그** | "시간 위 여기쯤" | 예정형 (공간적 날짜) | plannedDate 드래그(기존) |
| **자연어 inline** | "빠르게 받아적으며" | 날짜 있는 것 | Todoist |
| **룰 빌더** | "조건을 정밀하게" | 반응형 watch | Gmail 필터 / GitHub Watch |
| (Inbox 항목 인라인) | 재-triage | 재-snooze / watch 전환 | Gmail |
| (코멘트 작성기) | "무엇 + 언제" 한 동작 | Layer B snooze | Linear |

- **자연어는 날짜 파싱만** — chrono류 규칙 기반 (LLM 불필요, "LLM 없이" 정체성 정합).
  watch 조건의 자연어는 LLM 없이 취약하므로 룰 빌더로.
- **본문 체크박스의 날짜** ("[ ] 치과 예약 내일") = inline hook. hook이 메타데이터가 아니라
  *콘텐츠 안에* 사는 Plot-native 패턴.
- 단계별 프리셋 = IKEA 원칙: brick 우클릭 top = "완성 계획…", keystone = "백링크 감시",
  stone = "스누즈…". 제안이지 강요 아님 (메뉴엔 전부 있음).

---

## §8. 스팸 방지 (반응형 hook)

> 스팸 = "너무 많은 *푸시*". 답의 절반은 — 안 밀면 된다.

### 8-1. Push vs Pull

- **Timeline = pull** — 보러 가는 곳. 이벤트 100개여도 스팸 아님.
- **Inbox = push** — 오는 곳. 많으면 스팸.
- → **반응형 이벤트 대부분은 타임라인 마커로만 둔다(pull). Inbox push는 예외·의도적일 때만.**

### 8-2. Loudness 다이얼

`HookAction.loudness`:

| 레벨 | 어디 | 예 |
|---|---|---|
| `silent` | 타임라인 마커만 | 일상 백링크 |
| `passive` | Inbox **Detected** 섹션 | redlink, staleness |
| `active` | Inbox **Do/Review** + 알림 | 사용자 명시 중요 watch, SRS |

반응형 hook 기본값 = `silent`/`passive`. 사용자가 *올린다*. 반대 아님 (GitHub "participating only" 철학).

### 8-3. 8층 방어 (Inbox로 미는 것에 대해)

1. **Detected 격리** — 반응형은 Detected로, 절대 Do로 안 감 (Hey.com Imbox/Feed 사상)
2. **주체별 coalesce** — (엔티티, hook)당 항목 1개 + 카운트. "노트 X — 새 백링크 4개" (Linear 패턴)
3. **윈도우 쓰로틀** — 첫 이벤트에 안 뜨고 수집 창 모아서 한 번
4. **마일스톤 트리거** — "+1마다" 아니라 "5·10·25 넘으면"
5. **범위 정밀화** — `EventPattern` 필터: "아무 백링크" 아니라 "keystone이 거는 백링크"
6. **다이제스트** — 롤업 배달. (다이제스트 자체가 recurring hook — 시스템이 자기 부품 재사용)
7. **그래프-통계 중요도 랭킹** — 허브 노트가 건 백링크 > 리프 노트 거. 통계로 계산 (판단 아님)
8. **수명** — N회 발화 후 "아직 쓸모 있어?" 자가 점검 / 자동 만료

---

## §9. 데이터 모델 (제안)

### 9-1. Hook 저장 위치 — `EntityRef`-keyed store 권장

`entityEvents` / `GlobalBookmark`처럼 entity-agnostic 별도 store 권장 (per-entity 필드 X):

```ts
// lib/store/slices/hooks.ts (신규)
interface PlotState {
  hooks: Hook[]              // 모든 entity·work-item의 hook
}
```

이유: 엔티티 타입마다 필드 추가 = 파편화 재발. 별도 store = 통합 원칙 정합 + Timeline/Inbox가
한 곳을 구독.

### 9-2. 마이그레이션 — 기존 3 파편 흡수

| 기존 | → Hook |
|---|---|
| `Note.reviewAt` + `triageStatus="snoozed"` | `{ policy: "snooze", trigger: scheduled }` |
| `srsStateByNoteId[id]` | `{ policy: "srs", trigger: srs, state: SRSState }` |
| `WikiArticle.plannedDate` | `{ policy: "plan", trigger: scheduled }` |
| `dismissedInboxItems` / `snoozedInboxItems` | hook lifecycle 상태로 흡수 |

idempotent + rollback-safe 설계 의무. store version bump. 데이터 손실 0.

---

## §10. Phasing

| Phase | 범위 | 사용자 가시 변화 |
|---|---|---|
| **1 — 통합** | `Hook` 모델 + store + 기존 3 파편 마이그레이션. Inbox를 hook 구독으로 재배선 + Do/Review/Detected 섹션화. | 거의 없음 (내부 통합 + Inbox 정리) |
| **2 — 신규 정책** | `watch` + `recurring`. 우클릭 프리셋 + 타임라인 드래그 hook. 반응형 기본 silent/passive. | hook 직접 걸 수 있음 |
| **3 — 고급** | 룰 빌더, 다이제스트, 그래프-통계 랭킹, 자연어 날짜 파싱, Layer B(코멘트+snooze) 풀 통합. | 파워 기능 |

Timeline 컴포넌트 일반화(§12)는 Phase 1과 병행 가능 (PRD 독립).

---

## §11. Open Questions

1. **`EventPattern` 문법** — 반응형 trigger 조건을 어떻게 표현? (이벤트 타입 + 범위 + 필터의 shape)
2. **`WorkItemRef` 정의** — Layer B target. `CommentAnchor` 재사용? 본문 체크박스는 어떻게 참조?
3. **마이그레이션 전략** — 1-step vs 2-step (deprecated 필드 유예). `inbox-layer.md`/`activity-unification` 선례는 1-step.
4. **전이 규칙 범위** — 단계 승격 시 hook 자동 전이를 어디까지? (promote→SRS는 기존. stone→brick→plan 자동?)
5. **`recurring` 범위** — 고정 반복을 atom에도? 아니면 Book/시스템(다이제스트)만?
6. **Inbox 비우기 의미** — Do는 비우고 Review는 안 비워질 때, "Inbox zero" 카피/UX 어떻게?

---

## §12. 부록 — 선행 작업과의 관계

### 12-1. 원래 트리거였던 "Books 타임라인" 작업

이 PRD는 "타임라인을 Books에 적용?"에서 출발했다. 그때 잡았던 2-PR 계획:

- **PR1 — 타임라인 컴포넌트 일반화** (`WikiTimelineView` → `WikiArticle` 의존 제거, 공통 `TimelineItem`
  어댑터). **여전히 유효** — 이 PRD와 독립. Timeline이 통합 hook 캔버스가 되려면 어차피 필요.
- **PR2 — `Book.plannedDate` 필드 추가**. **이 PRD가 supersede.** per-entity date 필드 추가는
  5번째 silo를 만드는 것 → §9의 통합 `Hook` store로 대체.

### 12-2. 선행 PRD

- `inbox-layer.md` — Inbox action-queue 모델. 이 PRD §6-1이 intent 섹션화로 *확장*.
- `activity-unification-prd.md` — `EntityEvent` 스트림 + `CommentAnchor` + `thread_*`. 이 PRD의 §2-3
  척추이자 §4-2 Layer B 인프라.

### 12-3. 핵심 코드 위치 (구현 시)

- `lib/srs/` — SRS 엔진 (유지, 래핑만)
- `lib/store/slices/workflow.ts` — `setReminder`/`triageSnooze`/`enrollSRS`/`promote` (마이그레이션 원천)
- `lib/store/slices/inbox.ts` + `lib/hooks/use-inbox.ts` — Inbox source → hook 구독으로 재배선
- `components/views/wiki-timeline-view.tsx` + `wiki-timeline/` — Timeline 일반화 (§12-1 PR1)
- `lib/datalog/` — `EntityEvent` helper (`getEventsForEntity`)
