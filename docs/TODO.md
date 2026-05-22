# TODO

> 우선순위 기반 작업 목록. **P0 = 다음 세션 즉시 시작점** (NEXT-ACTION.md 폐지, 2026-05-12).
> 완료 항목은 즉시 삭제. 자세한 history는 SESSION-LOG.md + MEMORY.md.

**마지막 갱신**: 2026-05-22 (후속) — PR #401 레거시 Index 토글 제거 + File 독립 엔티티 브레인스토밍 완료. 다음 P0 = File 독립 엔티티 PRD.

---

## 🟣 P0 — 즉시 (cross-machine 진입점, 2026-05-22 후속)

> P0 3개. 시작점은 다음 세션 사용자 선택 — **추천: #1 File 독립 엔티티 PRD** (작고, 결정 locked, A의 Files 부분보다 선행).

### 1. **File 독립 엔티티** (브레인스토밍 완료 — PRD 작성이 다음)

`Attachment`(파일)를 note-scoped에서 진짜 독립 Library 엔티티로.

- **핵심 발견 (코드 확인)**: ① 노트 contentJson은 이미 `attachment://<id>` 스킴으로 파일을 *ID 참조* — N:M 참조의 아키텍처 전제가 이미 됨. ② `Attachment.noteId`는 이미 vestigial — Library 업로드=`"__library__"`, wiki 이미지=`""`, 노트 드롭만 real id. ③ 모든 `addAttachment`가 레코드 생성 → Files Library 뷰가 소스. 파일은 `{kind:"file"}` entity event도 이미 가짐.
- **남은 작업**: `noteId`→`originNote` 강등 / "기존 파일 삽입" 피커(재사용) / N:M usage 인덱스(콘텐츠 `attachment://` 스캔) / `Attachment`→`File` 리네임.
- **결정 (사용자 confirm)**: (1) `noteId` → `originNote?: string|null` 강등 — provenance, 제거 X. (2) dedup(content-hash) — Phase 2. (3) Books 파일 접점 — fast-follow (v1 = Note/Wiki).
- **첫 스텝**: `.omc/plans/file-entity-prd.md` 작성 (위 결정 반영). temporal-hooks-prd보다 작은 focused PRD.
- **까다로운 점**: 삭제+사용중 dangling ref / Books 파일 접점 현재 없을 듯 / usage 스캔 perf.

### 2. **A — 라이브러리 5종 Index 그룹핑**

content 5종(Notes/Wiki/Books/Templates/Categories)은 Index=Grouping 통일 완료 (PR #400). 남은 건 라이브러리 5종 — **Tags / Labels / Stickers / Files / References**.

- **걸림돌**: 라이브러리 뷰는 flat-only — `use-X-view` 훅이 `groups`를 반환해도 뷰가 `flatX`만 렌더 (`stickers-view.tsx` 확인). 뷰에 그룹 헤더 렌더링 신규 필요.
- **엔티티당 3단**: ① `view-configs.tsx` groupingOptions에 `firstLetter`("Index") — 5개가 정확히 `none`만 → `replace_all` 안전 ② `use-X-view.ts` `applyXGrouping`에 `firstLetter` case + `groupBy` 파라미터 신규 (`GroupBy` import, 훅 호출에 `viewState.groupBy` 전달) ③ 뷰에 그룹 헤더 렌더링.
- **이름 필드**: Tags/Labels/Stickers/Files=`.name`, References=`.title`. 로직 = `group.ts:groupByFirstLetter` 미러.
- **첫 스텝**: `components/views/{tags,labels,files,references}-view.tsx` 읽고 list/grid 렌더 구조 파악.
- **참고**: `wiki-list-pipeline.ts`/`use-books-view.ts`의 `firstLetter` case (PR #400 추가분).
- 주: File 독립 엔티티(P0 #1)와 Files 부분이 겹침 — File-entity 먼저 하면 Files 뷰 재구조 후 진행이 깔끔.

### 3. **🟢 Timeline 뷰모드 탭 아이콘**

`display-panel.tsx` MODE_DEFS — Timeline `Ruler` 아이콘이 List/Board/Gallery(박스형)와 시각 불일치 (아이콘↔글자 간격 어색). 박스형 아이콘 교체 (1줄). 모든 탭 CSS 동일 (`gap-1.5 flex-1`) — 아이콘만 문제.

---

## 🔵 P1

### temporal-hooks PRD 후속

`.omc/plans/unified-temporal-hooks-prd.md` (DRAFT v0.1) — §11 open questions 6개 + phasing 결정 필요. 정보 아키텍처 재정렬 = 큰 방향 → 사용자 조율 후 진행.

### EVENT_MARKER_CONFIG 신규 이벤트 매핑

`components/views/wiki-timeline/wiki-timeline-config.ts:143` `EVENT_MARKER_CONFIG`에 `merged`/`unmerged`/`split`/`section_collapsed` Phosphor 아이콘+색 매핑 추가.

---

## ✅ 최근 완료

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

## 영구 LOCKED 결정 (누적 #88, 후보 #89 / #90 / #91 / #92)

- 최근 (PR #387): #84-#88 — wiki-view-mode 직접 구독 / layout.tsx 정확 매핑 / Save view entity differentiate / Library = hub (view는 sub-entity) / Categories own view.
- 후보 (#89): **planning intent ≠ content activity** — `setWikiArticlePlannedDate`는 `updatedAt` 갱신 안 함.
- 후보 (#90): **event markers = icon chip 패턴** — filled colored ring + Phosphor 흰 아이콘 inline.
- 후보 (#91): **막대 끝점 = status는 도형 자체로** — Article 화살촉 / Stub rounded end.
- 후보 (#92): **Index = Grouping, not a column** — Display Properties 칩 = 진짜 컬럼 1:1. "Index"(알파벳 그룹핑)는 Grouping 드롭다운에 속함. content 5종 적용(PR #400) + 레거시 토글 완전 제거(PR #401). 라이브러리 5종(P0 #2) 완료 시 LOCKED.

전체 영구 룰 #1-#88: docs/MEMORY.md + docs/CONTEXT.md 참조.

---

## Deferred (당장 안 함)

- 다중 기기 sync (Supabase B + E2E + Yjs) — PRD 작성 완료, Phase 1 시작 준비. 사용자 시그널 대기.
- 편집 히스토리 v1 — multi-machine PRD 시점 권장.
- Ambox — Skip 권장 (사용자 시그널 시 재검토).
- SectionTemplate (그룹만 재사용) — MVP 후.
