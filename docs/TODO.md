# TODO

> 우선순위 기반 작업 목록. **P0 = 다음 세션 즉시 시작점** (NEXT-ACTION.md 폐지, 2026-05-12).
> 완료 항목은 즉시 삭제. 자세한 history는 SESSION-LOG.md + MEMORY.md.

**마지막 갱신**: 2026-05-20 — dead-block cleanup + Home Overview NavLink + breadcrumb 통일 완료. **timeline-planning bars-first 재설계**가 다음 P0.

---

## 🟣 P0 — 즉시 (cross-machine 진입점, 2026-05-20)

### 1. **🔴 timeline-planning — bars-first 재설계** (진행 중, 최우선)

PDCA Plan/Design 완료, 구현 진행 중. dots 기반 1차 구현이 main에 머지됨 → Reticle 레퍼런스 비교 후 **bars-first 재설계 확정**.

다음 스텝:
1. `docs/02-design/features/timeline-planning.design.md` §5(UI)·§3(데이터모델)·§11(구현순서)를 bars-first로 재작성
2. `components/views/wiki-timeline-view.tsx` 재구현 (현 dots 버전 덮어쓰기)

막대 모델 (bars-first 방향 확정 / 세부 모델은 사용자 최종 OK 대기):
- 모든 article = 막대 `createdAt → horizon`. horizon = `plannedDate`(미래로 뻗음) / `updatedAt`(과거 lifespan).
- 색 = 상태(stub/article), now 이후 미래 구간 점선, 끝점 = 상태점, "now"선 굵게.
- `plannedDate` 설정 UI(detail 패널/우클릭) 포함. Stage 1/2 구분 폐기·통합.
- Reticle 구조 차용, 도메인(수익률 %) 안 베낌.

이미 머지된 것: `WikiArticle.plannedDate?` 필드 / `ViewMode "timeline"` 등록 / `wiki-view.tsx` 분기 / `wiki-timeline-view.tsx`(dots, 미완).

### 2. **🟡 Ontology graph node 사이드바 동기화** (사용자 의도 미확정)

- Graph node → 4탭 사이드바 (추천) / OntologyDetailPanel / 사이드바 graph mode

### 3. **🟡 Activity events 후속**

- Granular Wiki/Book events wire-up (block_added/item_added 등)
- Label entity events 발화 (tags.ts 패턴 정합)

### 4. **🟡 Books own Views section** (entity-uniformity, 영구 룰 #87 정합)

- `linear-sidebar.tsx` Books section에 own Views section. `SavedView.space "books"`는 이미 union에 있음.

### 5. **🟢 manual smoke 누적**

- 이번 세션: dead block cleanup / Home Overview NavLink / breadcrumb 통일 (fresh dev 재확인)
- 이전: PR #373-#387

---

## Parked / Brainstorm

- **기존 체크박스-todo → Inbox kind 이전 검토** — `lib/todo-index.ts`(노트 본문 체크박스 인덱스)를 독립 "Todos" 기능으로 키우지 말고, Inbox(attention 큐)에 새 `InboxItemKind "task"`로 추가. Home open-loops 통합. timeline-planning 완료 후.

---

## 영구 LOCKED 결정 (누적 #88)

최근 (PR #387): #84-#88 — wiki-view-mode 직접 구독 / layout.tsx 정확 매핑 / Save view entity differentiate / Library = hub (view는 sub-entity) / Categories own view.

전체 영구 룰 #1-#88: docs/MEMORY.md + docs/CONTEXT.md 참조.

---

## Deferred (당장 안 함)

- 다중 기기 sync (Supabase B + E2E + Yjs) — PRD 작성 완료, Phase 1 시작 준비. 사용자 시그널 대기.
- 편집 히스토리 v1 — multi-machine PRD 시점 권장.
- Ambox — Skip 권장 (사용자 시그널 시 재검토).
- SectionTemplate (그룹만 재사용) — MVP 후.
