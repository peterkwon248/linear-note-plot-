---
template: plan
feature: timeline-planning
project: Plot
date: 2026-05-20
status: Draft
---

# Timeline View + Planning Layer — Planning Document

> **Summary**: Plot에 "계획 레이어"(엔티티의 `plannedDate` 필드)와 "Timeline" 디스플레이 모드(view-engine)를 신설한다. 과거 활동 + 미래 계획 작업을 하나의 가로 시간축에 표시. **Wiki에서 데뷔.**
>
> **Project**: Plot (Next.js 16 / React 19 / Zustand 5 / Store v144)
> **Date**: 2026-05-20
> **Status**: Draft — 브레인스토밍 완료, 설계 대기

---

## 1. Overview

### 1.1 Purpose

Plot의 시간 표현은 현재 "과거 회고"에 머문다 (언제 만들었나 / 수정했나). 사용자가 **지식 작업을 *계획*하는 수단**이 없다 — 예: "이 Wiki 스텁을 토요일에 아티클로 키운다".

이 기능은 두 가지를 신설한다:

1. **계획 레이어** — 엔티티에 `plannedDate`(+의도) 필드. "이 지식을 언제 키울 계획인가."
2. **Timeline 뷰** — view-engine의 새 display mode. 과거 이벤트 + 미래 `plannedDate`를 가로 연속 시간축 하나에 표시.

### 1.2 Background

- 브레인스토밍(2026-05-20)에서 도출. 출발점은 "Calendar 사이드바 개편"(구 TODO #2)이었으나, 본질이 "시간 / 계획"으로 수렴.
- **Todo 갈래 결정**: 기존 "Todo"는 노트 본문 체크박스 인덱스(`lib/todo-index.ts`)일 뿐 — 엔티티 아님, 날짜 없음. 두 갈래 — (1a) 지식 엔티티 계획 도구 vs (1b) TickTick급 범용 투두앱 — 중 **1a 채택**. 1b는 Plot 코어(지식 관계망) 이탈 → 폐기.
- Plot 정체성: 제텔카스텐 = 노트가 익어가는 것. 그 익어감을 *계획*하는 것이 1a. todo는 "범용 할 일"이 아니라 **"엔티티에 붙은 지식 작업 의도"**.

### 1.3 관련 컨텍스트

- 영구 원칙: "Gentle by default, powerful when needed", **"시각적 다양성 방향 금지"**
- 영구 룰 #87 (Library = hub, entity-uniformity)
- 관련 코드: `lib/view-engine/`, `lib/wiki-view-mode.ts`, `lib/store/slices/wiki-articles.ts`, `lib/datalog/`(entityEvents)
- Parked (이 PRD 범위 밖, 별도 작업): Task #2 (체크박스-todo → Inbox kind), Task #3 (Home Overview 섹션)

---

## 2. Scope

### 2.1 In Scope (Phase 1 — Wiki 데뷔)

- [ ] WikiArticle에 optional `plannedDate` 필드 추가 (+ 필요 시 store version bump)
- [ ] view-engine에 `"timeline"` display mode 등록 (Wiki 한정)
- [ ] Timeline 컴포넌트 신규 — 가로 연속 시간축, 줌(주/월/분기/년)
- [ ] Timeline에 과거(생성/수정 이벤트) + 미래(`plannedDate` 마커) 동시 표시
- [ ] 렌더 토글: 점(point) ↔ 수명막대(created→updated bar) — A/B 렌즈
- [ ] 기존 view-engine ordering(created/updated) + filter(stub/article) 재활용
- [ ] `plannedDate` 설정 / 해제 UI (Wiki detail 패널 + 우클릭 메뉴)

### 2.2 Out of Scope (후속 Phase / 별도 작업)

- Timeline을 Notes / Books / Calendar로 roll-out (Phase 2+. Books는 가치 약함 — 수 적고 status 없음)
- **C 렌즈 (status 성숙 타임라인)** — Wiki stub→article 전이가 현재 이벤트로 기록 안 됨 → 이벤트 로깅 선행 필요 (구 TODO #4 영역)
- **D 렌즈 본격 Gantt** — Todo에 마감일 데이터 없음
- 별도 "Planning" 사이드바 섹션 — Timeline 뷰가 planning의 home, 섹션 불필요 (Gentle by default)
- 기존 체크박스-todo 변경 — Task #2로 별도 park
- Home Overview 섹션 — Task #3로 별도 park

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | WikiArticle에 optional `plannedDate` 필드 + backward-compat 보장 | High | Pending |
| FR-02 | view-engine에 `"timeline"` display mode 등록 (Wiki) | High | Pending |
| FR-03 | Timeline 컴포넌트 — wiki article을 가로 연속 시간축에 렌더 | High | Pending |
| FR-04 | 한 축에 과거(events) + 미래(`plannedDate`) 동시 표시 | High | Pending |
| FR-05 | 점 ↔ 수명막대 렌더 토글 (A/B 렌즈) | Medium | Pending |
| FR-06 | ordering(created/updated) + filter(stub/article) 기존 view-engine 컨트롤 재활용 | High | Pending |
| FR-07 | `plannedDate` 설정 / 해제 UI (detail 패널 + 우클릭) | High | Pending |
| FR-08 | 시간축 줌 (주 / 월 / 분기 / 년) | Medium | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement |
|----------|----------|-------------|
| 일관성 | Timeline은 기존 view-engine 패턴(VIEW_CONFIGS / ordering / filter) 준수 — 별도 컨트롤 시스템 금지 | 코드 리뷰 |
| 회귀 안전 | 기존 Wiki 모드(dashboard / list / merge / split) 영향 0 | 수동 스모크 + build |
| 정체성 | Timeline은 planning layer를 반드시 동반 — "시각적 다양성" 금지 | 설계 검증 게이트 |
| 빌드 | `npm run build` + `tsc --noEmit` clean | 빌드 |
| 성능 | Wiki article 수십~수백 개 기준 끊김 없는 렌더 / 줌 | 수동 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] FR-01~08 구현 완료
- [ ] Wiki 뷰 전환기에서 Timeline 모드 선택 가능
- [ ] `plannedDate` 설정 → 영속 → Timeline 미래 마커로 표시
- [ ] 기존 Wiki 4모드 정상 동작 (회귀 0)
- [ ] `npm run build` + `tsc --noEmit` clean
- [ ] 사용자 수동 스모크 통과

### 4.2 Quality Criteria

- [ ] lint 에러 0, build 성공
- [ ] 데이터 모델 변경 시 backward-compat + 데이터 보존
- [ ] Timeline이 planning layer 없이 "점 흩뿌리기"로 전락하지 않음 (설계 게이트)

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| "시각적 다양성" 함정 — Timeline이 또 하나의 예쁜 배열로 전락 | High | Medium | planning layer를 반드시 동반. planning 빠지면 Timeline 자체 폐기. 설계 단계 게이트. |
| view-engine이 entity별 완전 균일 X (Wiki는 dashboard/merge/split 특수 체계) | Medium | High | Wiki 단독 데뷔. adapter 인터페이스를 설계 단계에서 정밀 정의. |
| Timeline 컴포넌트 복잡도 (가로축 / 줌 / 다수 항목) | Medium | Medium | Phase 1은 Wiki(항목 적음). 가상화 없이 시작. |
| Wiki 뷰 최근 잦은 변경(PR #387 등) 위 회귀 | Medium | Medium | 기존 모드 미변경. Timeline은 신규 모드로만 추가. |
| 데이터 모델 마이그레이션 위험 | Low | Low | optional 필드, 순수 additive. Plot 2-layer 마이그레이션 패턴 준수. |

---

## 6. Architecture Considerations

### 6.1 Project Level

기존 성숙 프로젝트 — **Dynamic** (변경 없음). 신규 레벨 선택 N/A.

### 6.2 핵심 아키텍처 결정

| 결정 | 선택 | 근거 |
|------|------|------|
| Timeline 위치 | **view-engine의 display mode** (List/Board/Gallery 형제) | entity-uniformity. 컴포넌트 1회 작성 → N entity 등록. 일회성 뷰 X. Calendar도 한 소비자일 뿐. |
| 계획 데이터 모델 | 엔티티의 optional 필드 `plannedDate` (신규 slice/엔티티 X) | "우선 가볍게"(사용자 결정). 새 항목 계획 = 스텁을 지금 생성 + 날짜. Plot "다 엔티티" 정합. |
| `plannedDate` 의도(intent) 포함 여부 | **설계 단계 결정** (날짜만 vs 날짜+의도 라벨) | 미결 — Open Question Q1 |
| 데뷔 엔티티 | **Wiki** | 단일 엔티티 단순함 + stub→article이 사용자 핵심 예시 + dogfood 최적. Calendar는 cross-entity라 데뷔로 무거움. |
| 컨트롤 | 기존 ordering / filter 재활용 | 별도 컨트롤 시스템 금지 — Notes/Wiki 뷰 일관성 |

기존 스택(Next.js 16 / React 19 / Zustand 5 / TipTap 3 / Tailwind v4) 변경 없음.

### 6.3 영향 받는 코드 (설계 단계에서 정밀화)

- `lib/types.ts` — `WikiArticle`에 `plannedDate?`
- `lib/store/slices/wiki-articles.ts` — setter
- `lib/store/migrate.ts` + `lib/store/index.ts` — version bump (필요 시)
- `lib/view-engine/` (types / defaults / view-configs) — `"timeline"` mode 등록
- `components/views/` — 신규 Timeline 컴포넌트
- Wiki detail 패널 / 우클릭 메뉴 — `plannedDate` 설정 UI

---

## 7. Convention Prerequisites

기존 프로젝트 — 컨벤션 확립됨.

- [x] `CLAUDE.md` 코딩 컨벤션 존재
- [x] `tsconfig.json` / ESLint 존재
- 신규 환경변수: **없음** (로컬 IDB 기반, 서버 / 외부 API 무관)
- 신규 컨벤션: Timeline display mode adapter 인터페이스 — 설계 단계에서 정의

---

## 8. Next Steps

1. [ ] `/pdca design timeline-planning` — 설계 문서 작성 (아래 Open Questions 해소)
2. [ ] 사용자 리뷰 및 승인
3. [ ] 구현 시작 (`/pdca do timeline-planning`)

---

## Open Questions (design 단계 해소)

| # | 질문 | 비고 |
|---|------|------|
| Q1 | `plannedDate` = 날짜만 vs 날짜 + 의도(intent) 라벨 | "가볍게"면 날짜만. 의도는 후속 가능 |
| Q2 | Timeline 기본 렌즈 — 점(밀도) vs 수명막대 | 점(밀도)이 가장 무난 — 추천 |
| Q3 | `plannedDate`가 지난(overdue) 항목 처리 방식 | Inbox kind 연계 가능성 (Task #2/#4) — Phase 1 범위 주의 |
| Q4 | 줌 레벨 구체값 (주 / 월 / 분기 / 년 중 무엇/기본값) | |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-05-20 | 초안 — 브레인스토밍 종합 (Todo 1a 채택, Timeline = view-engine mode, Wiki 데뷔, 경량 `plannedDate` 필드) | Plot |
