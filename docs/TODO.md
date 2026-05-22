# TODO

> 우선순위 기반 작업 목록. **P0 = 다음 세션 즉시 시작점** (NEXT-ACTION.md 폐지, 2026-05-12).
> 완료 항목은 즉시 삭제. 자세한 history는 SESSION-LOG.md + MEMORY.md.

**마지막 갱신**: 2026-05-22 (후속 #3) — Display 탭 Linear segmented control + 타임라인 화살촉 제거 완료. 다음 P0 = 타임라인 폴리시(막대 이름 제거 + 마커 clip).

---

## 🟣 P0 — 즉시 (cross-machine 진입점, 2026-05-22 후속 #3)

> P0 #1 = 타임라인 폴리시 (사용자 확정, 다음 컴퓨터에서). 그 다음 #2 = File 엔티티 v1.

### 1. **타임라인 폴리시 — 막대 이름 제거(A안) + 마커 clip 수정** (둘 다 확정, 한 PR 가능)

상세 = SESSION-LOG 2026-05-22 (후속 #3) hook.

- **(A) 막대 이름 제거**: 타임라인 막대 = 순수 수명. 이름은 좌측 라벨 컬럼(`timeline-label-column.tsx`)이 전담. `timeline-bar.tsx` inside/outside title 블록 제거 + `titleInside`/`titleLabel`/`outsideTitleX` 정리 + `wiki-timeline-config.ts` `titleThreshold` unused 제거.
- **(B) 마커 clip 수정**: lane 0 이벤트 마커가 SVG 상단에서 잘림. `LANE_TOP_PAD`(≈14) 신설 → lane Y 계산 6곳 일괄 가산 (timeline-bar `cy`+hover bg / timeline-event-markers `cy` / timeline-grid lane separator / timeline-tooltip ×2 / wiki-timeline-view `svgHeight` / timeline-label-column 상단 spacer). 정렬 검증 필수.

### 2. **File 독립 엔티티 v1 구현** (PRD 완성 — `.omc/plans/file-entity-prd.md` v0.2)

`Attachment`를 note-scoped → 독립 Library 엔티티로. PRD §6-1 v1 = 영구 룰 #6(UI ↔ 데이터 모델 분리)대로 PR 2개:

- **PR #1 (마이그레이션+모델)**: `Attachment.noteId: string` → `originEntity: EntityRef | null` 강등 + v144→v145 마이그레이션(`state.notes`/`wikiArticles` 조회로 kind 판정, stale id → null) + `addAttachment` 7개 호출처 수정. 타입명 `Attachment` 유지(DOM 전역 `File` 충돌 회피), UI 라벨만 "File".
- **PR #2 (피커 UI)**: "기존 파일 삽입" 피커(재사용) + usage 인덱스(콘텐츠 `attachment://` 스캔 derive) + hard delete dangling-ref 경고.
- **첫 스텝**: `lib/types.ts:997` `Attachment` + `lib/store/slices/attachments.ts:7`(addAttachment + 호출처) + `lib/store/migrate.ts:1919`(v143→v144 패턴) 읽고 PR #1 착수.
- **Q1/Q2**: v0.2에서 사용자 승인 완료 — 타입명 `Attachment` 유지, `originEntity: EntityRef|null`.
- **§7 잔여 Open Q**: usage 인덱스 derive vs 저장(derive 권고) / Books 파일 접점 코드 확인(fast-follow 전제).
- **까다로운 점**: 삭제+사용중 dangling ref / usage 스캔 perf.

---

## 🔵 P1

### temporal-hooks PRD 후속

`.omc/plans/unified-temporal-hooks-prd.md` (DRAFT v0.1) — §11 open questions 6개 + phasing 결정 필요. 정보 아키텍처 재정렬 = 큰 방향 → 사용자 조율 후 진행.

---

## ✅ 최근 완료

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

전체 영구 룰 #1-#88: docs/MEMORY.md + docs/CONTEXT.md 참조.

---

## Deferred (당장 안 함)

- 다중 기기 sync (Supabase B + E2E + Yjs) — PRD 작성 완료, Phase 1 시작 준비. 사용자 시그널 대기.
- 편집 히스토리 v1 — multi-machine PRD 시점 권장.
- Ambox — Skip 권장 (사용자 시그널 시 재검토).
- SectionTemplate (그룹만 재사용) — MVP 후.
