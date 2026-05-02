# Plot — NoteStatus 리네이밍 + Inbox 알림함 시스템 도입

> **작성일**: 2026-05-02 (사용자 직접 작성 PRD)
> **상태**: SKETCH — 다음 세션에서 사전 조사 + 사용자 합의 후 작업 시작
> **이번 PR 범위 X** — 별도 PR로 진행

---

## ⚠️ 작업 시작 전 필독 — 사전 논의 단계 강제

**이 지시문은 사용자가 Plot 코드베이스의 모든 세부를 완벽히 알지 못하는 상태에서 작성되었다.** 따라서 다음 절차를 **반드시** 따른다:

1. **이 문서를 끝까지 읽는다**
2. **곧바로 코드를 수정하지 않는다**
3. 먼저 코드베이스를 조사해 **이 지시문의 가정과 실제 코드가 어긋나는 지점을 찾아낸다**
4. 어긋난 부분·모호한 부분·결정 필요한 부분을 정리해 **사용자에게 질문하고 합의한 뒤** 작업에 착수한다

### 사전 검증 체크리스트 (작업 전 반드시 사용자와 합의)

- [ ] `NoteStatus` 타입의 정확한 정의 위치와 현재 값들 확인 (`'inbox' | 'capture' | 'permanent'`이 맞는가? 다른 status가 더 있는가?)
- [ ] IndexedDB 스키마에서 `status` 필드의 실제 저장 형식과 마이그레이션 시스템 확인
- [ ] Home Sidebar에 "Inbox" 섹션이 실제로 어떻게 구현되어 있는가? 컴포넌트명·라우팅·필터 로직
- [ ] Wiki / Library 등 다른 공간(space)의 사이드바 구조와 컴포넌트 패턴 확인
- [ ] Snooze 기능이 이미 일부라도 구현되어 있는가? (메모리에 SRS·snooze 언급은 있으나 정확한 구현 상태 미상)
- [ ] Activity Bar의 5 spaces 구조 확인 (Inbox/Notes/Wiki/Calendar/Ontology가 맞는가?)
- [ ] 라우팅 path에 status 값이 노출되는가? (예: `/notes/inbox`)
- [ ] 빈 상태(empty state) 메시지·아이콘 시스템 현황
- [ ] 테스트 커버리지: status 관련 테스트가 있는가?

위 항목들 중 **이 지시문의 서술과 다른 점이 하나라도 발견되면 작업을 멈추고 사용자에게 보고할 것.** 추측으로 메우지 말 것.

---

## 1. 배경과 의사결정 요약

### 1.1 왜 이 작업을 하는가

기존 `NoteStatus`의 명칭 `inbox / capture / permanent`는 두 가지 문제가 있다:

1. **어휘 레이어 불일치** — Inbox(공간 비유) / Capture(행위) / Permanent(상태)가 서로 다른 어휘 체계
2. **의미 위계 약함** — *점진적 가공·정련*의 위계가 단어 자체에 박혀있지 않음
3. **Inbox라는 단어의 다중 의미** — Plot에서 "Inbox"는 *Note status* 와 *Home 사이드바 섹션* 두 곳에서 쓰이는데 의미를 분리해야 함

### 1.2 채택된 새 명칭 — `Stone / Brick / Keystone`

돌의 *가공 위계* 메타포:

| 기존 | 신규 | 의미 |
|---|---|---|
| `inbox` | `stone` | 자연석 · 미가공 · 잠재성만 있음 |
| `capture` | `brick` | 규격 가공품 · 한 번 다듬어짐 |
| `permanent` | `keystone` | 극한 가공 · 다른 노트의 핵심 정의 (아치의 쐐기돌) |

채택 이유:
- 세 단어 모두 *돌(物)*이라 시각적 일관성 (사이드바가 "돌의 행렬"로 읽힘)
- 가공도가 단조 증가하는 점진성이 단어 자체에 박혀있음
- Plot의 오브젝트 이름(Note, Wiki)과 어휘 충돌 없음

### 1.3 채택된 Inbox 시스템 아키텍처

**핵심 원칙: 데이터는 한 곳, 뷰는 공간마다 자동 필터링**

- `InboxSignal`이라는 단일 데이터 모델
- 모든 Snoozable 오브젝트(Note·Wiki·LibraryItem 등)가 신호를 발생시킴
- `sourceType` 필드로 어느 오브젝트에서 온 신호인지 표시
- Home Inbox: 전체 신호
- 각 공간(Notes, Wiki, Library 등) 사이드바의 Inbox 탭: `sourceType` 자동 필터링된 같은 데이터의 슬라이스

**금지 사항: 공간마다 별도 알림 데이터 저장소를 두지 말 것.** 데이터는 하나여야 하며, 어떤 뷰에서 dismiss하든 모든 뷰에서 사라져야 함.

---

## 2. "Inbox"라는 단어의 분리 — 가장 헷갈리는 지점

코드베이스에서 "inbox"는 두 곳에서 쓰이고 있고, 이번 작업에서 **정반대로 처리**한다:

| 위치 | 처리 |
|---|---|
| `NoteStatus = 'inbox'` (타입 값, status 필드) | **`'stone'`으로 전면 교체** |
| Home Sidebar의 "Inbox" 섹션 (UI 라벨·컴포넌트 이름) | **이름 그대로 유지**, 단 *의미가 완전히 바뀜* |

**의미 변화:**
- 변경 전: Home Sidebar의 Inbox 섹션 = `status === 'inbox'`인 노트의 필터링 뷰
- 변경 후: Home Sidebar의 Inbox 섹션 = **시스템 → 사용자 알림함** (Snooze 만료, SRS 리뷰, Autopilot 제안 등)

이 분리를 명확히 인지하지 못한 채 일괄 치환(`s/inbox/stone/g`)을 하면 작업이 망가진다. **반드시 컨텍스트별 수동 확인.**

---

## 3. Phase 1 — NoteStatus 전면 리네이밍

### 3.1 영향 범위 (사전 조사로 실제 위치 확인 필요)

다음은 *예상되는* 영향 범위. 실제 코드와 대조해 누락·과잉이 있는지 먼저 확인할 것.

1. **타입 정의** — `NoteStatus` enum/union type
   - `'inbox' | 'capture' | 'permanent'` → `'stone' | 'brick' | 'keystone'`
2. **IndexedDB 스키마 + 마이그레이션 스크립트**
   - 기존 사용자 데이터의 `status` 필드 값 변환
   - 매핑: `inbox → stone`, `capture → brick`, `permanent → keystone`
   - 마이그레이션 버전 올리고, 변환된 레코드 수 로그 출력
   - **롤백 가능하게 별도 커밋 분리**
3. **Zustand store** — status 관련 셀렉터·액션
4. **FlexSearch 인덱스** — status 필드 색인
5. **라우팅** — `/notes/inbox` 같은 path가 있다면 `/notes/stone` 등으로 변경. 기존 path는 새 path로 redirect
6. **UI 컴포넌트**
   - 사이드바 라벨 + 카운트
   - 필터 칩, 드롭다운, 컨텍스트 메뉴 ("Move to Stone/Brick/Keystone")
   - 빈 상태 메시지
   - 아이콘 (Phosphor 아이콘 통일 원칙 유지, strokeWidth 1.5)
7. **슬래시 커맨드** — status 변경 명령
8. **단축키 도움말** — 상태 이동 단축키 라벨
9. **테스트** — 모든 status 값을 참조하는 테스트 케이스
10. **문서** — README, CLAUDE.md, docs/ 안의 관련 문서

### 3.2 절대 함께 바꾸면 안 되는 것 — `inbox`라는 단어 보존

- Home Sidebar의 `Inbox` 섹션 라벨 유지
- 해당 섹션의 컴포넌트 이름 유지 (예: `InboxSection.tsx`가 있다면 그대로)
- 단, **그 섹션의 내부 로직은 status 필터링에서 알림함 로직으로 교체** (Phase 2)

### 3.3 사이드바 최종 구조 (예시 — 실제 컴포넌트 구조와 합의 필요)

```
Home (또는 Notes 공간):
  📥 Inbox (0)        ← 알림함 (placeholder)
  ──────
  All Notes (9)
    Stone (4)         ← 기존 inbox 필터의 새 자리
    Brick (2)         ← 기존 capture
    Keystone (3)      ← 기존 permanent
  Pinned (1)
```

### 3.4 Phase 1 검증

- TypeScript 빌드 0 에러
- 기존 IndexedDB 데이터를 가진 앱이 정상 마이그레이션됨
- `git grep -i 'inbox\|capture\|permanent'`로 잔존 참조 검수
  - **남아있어야 하는 것**: Home Sidebar Inbox 섹션 관련 라벨·컴포넌트명
  - **남아있으면 안 되는 것**: NoteStatus 값으로서의 `inbox/capture/permanent`
- 사이드바 카운트 정확성
- 기존 테스트 통과

**Phase 1이 완료되면 반드시 멈추고 사용자에게 보고할 것.** Phase 2는 그 후 별도로 시작.

---

## 4. Phase 2 — Home Inbox 섹션 의미 재정의 (최소 구현)

### 4.1 이번 작업에서 할 것

1. Inbox 섹션이 더 이상 NoteStatus를 필터링하지 않도록 핸들러·쿼리 분리
2. Inbox 섹션을 빈 placeholder 상태로 둔다
   - 빈 상태 메시지: "알림이 없습니다" / "All caught up"
3. **InboxSignal 인터페이스 정의** (실제 신호 생성 로직은 향후 작업)
   ```typescript
   interface InboxSignal {
     id: string
     type: 'snooze_due' | 'srs_due' | 'autopilot_proposal' | 'ghost_expiring'
     sourceType: 'note' | 'wiki' | 'library' | 'folder'  // 확장 가능
     sourceId: string
     surfacedAt: Date
     dismissedAt: Date | null
     payload: unknown
   }
   ```
4. 쿼리 레이어 인터페이스 stub 정의
   ```typescript
   // 전역 (Home Inbox용)
   getInboxSignals({ dismissedAt: null })
   // 공간별 (각 space의 Inbox 탭용)
   getInboxSignals({ dismissedAt: null, sourceType: 'note' })
   ```
   실제 구현은 빈 배열 반환으로 두고, 인터페이스만 미리 박아둠

### 4.2 이번 작업에서 *하지 않을* 것

- 실제 Snooze 만료 트리거 로직
- SRS 리뷰 시점 신호 생성
- Autopilot 제안 신호
- Ghost Node grace period 알림
- Wiki·Library 공간의 Inbox 탭 추가
- Calendar 통합

이 모든 것은 Phase 3 TODO에 등록만 한다.

---

## 5. Phase 3 — TODO 등록

`TODO.md`(없으면 생성)에 다음 항목들을 추가한다. **이번 PR 범위에 포함하지 않는다.**

```markdown
## Inbox (알림함) 시스템 — 향후 작업

### 데이터 레이어
- [ ] InboxSignal 인터페이스 본 구현 (현재는 stub)
- [ ] Snoozable 능력을 Note·Wiki·LibraryItem 등에 mixin/trait 형태로 부여
- [ ] sourceType 기반 자동 필터링 쿼리 레이어

### 알림 트리거
- [ ] Snooze 만료 → InboxSignal 생성
- [ ] SRS 리뷰 시점 → InboxSignal 생성
- [ ] Autopilot Engine 제안 → InboxSignal 생성
- [ ] Ghost Node grace period 임박 → InboxSignal 생성

### 뷰 레이어 — 공간별 Inbox 탭
- [ ] Notes 공간 사이드바 최상단에 Inbox 탭 (sourceType='note' 자동 필터)
- [ ] Wiki 공간 사이드바 최상단에 Inbox 탭 (sourceType='wiki')
- [ ] Library 공간 사이드바 최상단에 Inbox 탭 (sourceType='library')
- [ ] 모든 뷰에서 dismiss 동기화 검증
- [ ] 카운트 일관성 검증 (공간별 카운트 합 == Home 카운트)
- [ ] 빈 상태 메시지 차별화 (Home: 성취감 / 공간별: 다른 공간 안내)

### Snooze 액션 분산
- [ ] Note에 Snooze 버튼/단축키
- [ ] Wiki에 Snooze 버튼/단축키
- [ ] LibraryItem에 Snooze 버튼/단축키
- [ ] Snooze 상태 인디케이터 (각 오브젝트에 "X일 후 다시 떠오름" 표시)
- [ ] "Snoozed" 필터 (각 공간의 일반 목록에서 미뤄둔 항목 보기)

### Activity Bar 통합
- [ ] 각 공간 아이콘에 미처리 알림 카운트 배지
- [ ] 배지 우선순위 색상 정의 (예: 만료 SRS = 빨강, 일반 = 회색)

### Calendar 통합 (UX·기능)
Inbox 섹션은 Calendar(Temporal View)와 강하게 연관되어야 함:
- [ ] Calendar의 SRS·Snooze 인프라를 InboxSignal 데이터 소스로 재사용
- [ ] Calendar에서 노트를 snooze하면 만료 시점에 Inbox에 등장
- [ ] Inbox 항목 클릭 시 Calendar의 해당 날짜로 점프
- [ ] UI 톤 통일 (Calendar의 시간 표현 ↔ Inbox의 "3일 전 미뤄둠" 같은 상대 시간)
- [ ] Activity Bar에서 Inbox와 Calendar의 시각적 그룹핑 검토
```

---

## 6. 작업 원칙

- **한 번에 하나의 Phase만**. Phase 1 완료 → 사용자 보고 → Phase 2 시작
- 리네이밍은 IDE의 rename refactor 우선, 문자열 리터럴(IndexedDB 값, UI 라벨, 라우트)은 수동 검토
- `git grep`으로 잔존 참조 반드시 검증
- 마이그레이션 스크립트는 별도 커밋으로 롤백 가능하게
- design-quality-gate 스킬 규칙 준수: 새 아이콘 strokeWidth 1.5, hardcoded hex 금지, Phosphor 통일
- linear-design-mirror 스킬의 GOTCHAS.md에 다음 항목 추가 검토:
  > **Inbox는 두 가지 의미를 가진다** — `NoteStatus`의 값(2026-05 deprecated, 'stone'으로 변경됨)과 Home Sidebar 섹션 이름(알림함). 코드 작업 시 둘을 혼동하지 말 것.

---

## 7. 최종 검증 체크리스트 (Phase 1+2 완료 시)

- [ ] `git grep` 결과 NoteStatus 값으로서의 `'inbox'|'capture'|'permanent'` 잔존 0건
- [ ] Home Sidebar의 Inbox 섹션 *라벨*과 *컴포넌트명*은 살아있음
- [ ] 기존 IndexedDB 데이터를 가진 앱이 정상 마이그레이션
- [ ] 사이드바에 `Inbox / All Notes / Stone / Brick / Keystone / Pinned` (또는 합의된 구조) 표시
- [ ] Inbox 섹션은 빈 placeholder, Stone/Brick/Keystone은 카운트 정상
- [ ] InboxSignal 인터페이스 stub 정의됨, 쿼리 레이어 stub 존재
- [ ] TypeScript 빌드 0 에러
- [ ] 기존 테스트 통과
- [ ] TODO.md에 Phase 3 항목 등록됨

---

## 8. 다시 강조 — 사전 논의의 중요성

이 지시문은 **외부 관점에서 작성**되었다. 다음 위험이 있다:

- 실제 컴포넌트 이름·구조가 가정과 다를 수 있음
- 이미 일부 구현된 기능이 있을 수 있음 (Snooze 등)
- 영향 범위가 빠진 곳이 있을 수 있음 (예: 외부 plugin, harness 스크립트)
- 마이그레이션 시스템의 실제 패턴이 다를 수 있음
- 사이드바 구조 가정(Activity Bar 5 spaces)이 현 시점 코드와 어긋날 수 있음

**작업 착수 전, 반드시 다음 순서를 따른다:**

1. 코드베이스 전수 조사 (관련 파일 목록 작성)
2. 이 지시문의 가정과 실제 코드의 차이점 정리
3. 모호하거나 결정이 필요한 지점을 사용자에게 질문
4. 사용자와 합의된 작업 계획 수립 후 착수

**추측으로 진행하지 말 것. 한 번 잘못 들어간 상태 변경은 IndexedDB 마이그레이션 때문에 롤백이 까다롭다.**

---

## ── 우리 측 작업 노트 (다음 세션에서 채울 것) ─────────────

### 사전 조사 결과 (작업 시작 전 채움)
- [ ] NoteStatus 정의 위치: ??
- [ ] Activity Bar spaces 실제 구조: ??
- [ ] /notes/inbox 등 라우팅 사용 여부: ??
- [ ] Snooze 현 구현 상태: ??
- [ ] Calendar 와 SRS 인프라 현황: ??
- [ ] (지시문의 가정과 다른 점 ↑ 여기에 정리)

### 사용자 합의 후 결정 사항
- [ ] (의논 후 채움)
