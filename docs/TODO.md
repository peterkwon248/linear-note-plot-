# TODO

> 우선순위 기반 작업 목록. **P0 = 다음 세션 즉시 시작점** (NEXT-ACTION.md 폐지, 2026-05-12).
> 완료 항목은 즉시 삭제. 자세한 history는 SESSION-LOG.md + MEMORY.md.

**마지막 갱신**: 2026-05-23 — 타임라인 비주얼 리디자인 (얇은 선 / 스타트칩 / status 색 / "All" 모드) 완료. 다음 P0 = Display Properties / Grouping / Ordering 신뢰성 (계획부터).

---

## 🟣 P0 — 즉시 (cross-machine 진입점, 2026-05-23)

> P0 #1 = Display Properties / Grouping / Ordering 신뢰성 (사용자 명시 "가장 먼저", **계획부터**). #2 = Notes/Books Timeline 모드. #3 = File 엔티티 v1.

### 1. **Display Properties / Grouping / Ordering 신뢰성 — 전 view mode 감사 + 수정** (계획부터)

상세 = SESSION-LOG 2026-05-23 hook.

- **증상**: 타임라인에서 Display Properties가 제대로 작동 안 함. 타임라인뿐 아니라 grid·board 모드에서도 가끔. 필터는 대체로 OK (사용자 테스트). **DP / grouping / ordering**이 문제.
- **첫 스텝 = 계획 수립** (코드 수정 X): `lib/view-engine/` (`ViewState` 타입) → 각 view 컴포넌트(list/board/gallery/timeline)의 viewState 소비 추적 → 끊기는 지점 식별 → 모드별 작동/미작동 표 → 수정 계획 문서.
- **유력 가설**: `WikiTimelineView`가 `viewState` prop을 받지만 grouping/ordering/DP를 거의 미구현 (createdAt 순 배치만). ⚠️ 코드 검증 필요. + "날짜 배치 뷰에서 grouping/ordering이 의미 있나"부터 정의.
- 사용자 의도: "완벽하고 확실한 해결책. 코드 전체 꼼꼼히 (토큰 소모 감수) 일일이 수정."

### 2. **노트·북에도 Timeline 디스플레이 모드 추가**

현재 Timeline = Wiki 전용. 타임라인 리디자인 완료(2026-05-23) → 노트/북 뷰에도 Timeline view mode 추가. 사용자 명시. DP/grouping/ordering(P0 #1) 정리 후 진행 권장 (타임라인을 더 많은 entity로 확장하기 전에 viewState 흐름이 견고해야).

### 3. **File 독립 엔티티 v1 구현** (PRD 완성 — `.omc/plans/file-entity-prd.md` v0.2)

`Attachment`를 note-scoped → 독립 Library 엔티티로. PRD §6-1 v1 = PR 2개:

- **PR #1 (마이그레이션+모델)**: `Attachment.noteId: string` → `originEntity: EntityRef | null` 강등 + v144→v145 마이그레이션 + `addAttachment` 7개 호출처 수정. 타입명 `Attachment` 유지(DOM 전역 `File` 충돌 회피).
- **PR #2 (피커 UI)**: "기존 파일 삽입" 피커 + usage 인덱스(콘텐츠 `attachment://` 스캔 derive) + hard delete dangling-ref 경고.
- **첫 스텝**: `lib/types.ts:997` `Attachment` + `lib/store/slices/attachments.ts:7` + `lib/store/migrate.ts:1919` 읽고 PR #1 착수.
- **Q1/Q2**: v0.2 사용자 승인 완료. **§7 잔여 Open Q**: usage 인덱스 derive 권고 / Books 파일 접점 확인.

---

## 🔵 P1

### temporal-hooks PRD 후속

`.omc/plans/unified-temporal-hooks-prd.md` (DRAFT v0.1) — §11 open questions 6개 + phasing 결정 필요. 정보 아키텍처 재정렬 = 큰 방향 → 사용자 조율 후 진행.

---

## ✅ 최근 완료

- **2026-05-23**: 타임라인 비주얼 리디자인 (단일 PR, 8파일 +224/−141) — 막대 이름 제거 / 이벤트 마커 막대 안(중앙선)+흰 테두리 / 막대 day-quantize+drag 정합 / 스타트칩 = 막대 고유 origin 노드 / 얇은 선(`BAR_HEIGHT` 28→5)+drop shadow 제거 / 선 색 = status 아이콘 색(stub 주황·article 에메랄드) / **"All" 모드 신설**(5번째 줌, fit-to-content overview, 기본값). tsc clean.
- **2026-05-22 (후속 #3)**: Display 패널 탭 = Linear segmented control (popover 360px + flex-1 + gap seam) + 타임라인 막대 status 화살촉 제거(ARROW_DEPTH 정리). 막대 이름 제거(A안)·마커 clip 수정은 결정 완료 → 다음 세션 P0 #1.
- **2026-05-22 (후속 #2)**: File 엔티티 PRD v0.2 작성 (`file-entity-prd.md`) + P0 #3 Timeline 탭 아이콘(`Ruler`→`ChartBarHorizontal`) + P1 EVENT_MARKER 4종 매핑(merged/unmerged/split/section_collapsed) + P0 #2 라이브러리 5종 Index 그룹핑(Tags/Labels/Stickers/Files/References — 컴포넌트-사이드 + `.a-tg` 헤더). ⚠️ P0 #2 시각 스모크 테스트 미완.
- **2026-05-22 (후속)**: PR #401 — 레거시 alphabetical-index 토글(`showAlphaIndex`/`showAllArticles`) 완전 제거 (6파일, +9/−173). Index = 순수 Grouping 옵션. + File 독립 엔티티 브레인스토밍 (결정 locked → P0 #1).
- **2026-05-22**: PR #400 — 통합 시간 모델 PRD (`unified-temporal-hooks-prd.md` DRAFT) + Index→Grouping 통일 (content 5종 — Wiki/Templates/Books groupingOptions `firstLetter`, `showAlphaIndex` 가짜 칩 제거) + 빌드 에러 픽스.
- **2026-05-21 (저녁 후속 #6)**: wiki-timeline-view.tsx sub-component 분리 (1380→386줄, PR #399).
- **2026-05-21 (저녁 후속 #5)**: `router.push("/wiki/[id]")` dead code 정리 (PR #398).
- **2026-05-21 (저녁 후속 #2~#4)**: Ontology node 동기화 / Activity events granular wire-up / Books own Views section.
- **2026-05-21**: bars-first timeline 3 라운드 (PR #392) + 옵션 C drag/event marker chips (PR #393).

---

## Parked / Brainstorm

- **기존 체크박스-todo → Inbox kind 이전 검토** — `lib/todo-index.ts`(노트 본문 체크박스 인덱스)를 독립 "Todos" 기능으로 키우지 말고 Inbox(attention 큐)에 `InboxItemKind "task"`로 추가. → temporal-hooks PRD의 Layer B(작업 hook)와 직결.

---

## 영구 LOCKED 결정 (누적 #88 + #92, 후보 #89 / #90)

- 최근 (PR #387): #84-#88 — wiki-view-mode 직접 구독 / layout.tsx 정확 매핑 / Save view entity differentiate / Library = hub (view는 sub-entity) / Categories own view.
- **#92 (LOCKED)**: **Index = Grouping, not a column** — Display Properties 칩 = 진짜 컬럼 1:1. "Index"(알파벳 그룹핑)는 Grouping 드롭다운. content 5종(PR #400) + 레거시 토글 제거(PR #401) + 라이브러리 5종(2026-05-22 후속 #2) 완료.
- 후보 (#89): **planning intent ≠ content activity** — `setWikiArticlePlannedDate`는 `updatedAt` 갱신 안 함.
- 후보 (#90): **event markers = icon chip 패턴** — filled colored ring + Phosphor 흰 아이콘 inline.
- ~~후보 #91 (막대 끝점 = status 도형 / Article 화살촉)~~ — **폐기** (2026-05-22 후속 #3): 화살촉 제거, 타임라인 status = 막대 색만.
- 후보 (#93~, 2026-05-23 타임라인 리디자인): ① 타임라인 막대 = 얇은 선, 이벤트 칩이 주인공 ② 스타트칩 = 막대 고유 origin 요소(이벤트 아님) ③ 선 색 = status 아이콘 색 일치 ④ "All" 모드 = fit-to-content overview (viewport-fit은 옵션이면 OK). 상세 = SESSION-LOG 2026-05-23.

전체 영구 룰 #1-#88: docs/MEMORY.md + docs/CONTEXT.md 참조.

---

## Deferred (당장 안 함)

- 다중 기기 sync (Supabase B + E2E + Yjs) — PRD 작성 완료, Phase 1 시작 준비. 사용자 시그널 대기.
- 편집 히스토리 v1 — multi-machine PRD 시점 권장.
- Ambox — Skip 권장 (사용자 시그널 시 재검토).
- SectionTemplate (그룹만 재사용) — MVP 후.
