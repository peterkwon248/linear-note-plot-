# TODO

> 우선순위 기반 작업 목록. **P0 = 다음 세션 즉시 시작점** (NEXT-ACTION.md 폐지, 2026-05-12).
> 완료 항목은 즉시 삭제. 자세한 history는 SESSION-LOG.md + MEMORY.md.

**마지막 갱신**: 2026-05-22 — 통합 시간 모델 PRD + Index→Grouping 통일(content 5종) 완료. 다음 P0 = 라이브러리 5종 Index 그룹핑(A).

---

## 🟣 P0 — 즉시 (cross-machine 진입점, 2026-05-22)

### 1. **A — 라이브러리 5종 Index 그룹핑** (최우선 — 사용자 "B 이후 A" 명시)

content 5종(Notes/Wiki/Books/Templates/Categories)은 이번 세션에 Index=Grouping 통일 완료. 남은 건 라이브러리 5종 — **Tags / Labels / Stickers / Files / References**.

- **걸림돌**: 라이브러리 뷰는 flat-only — `use-X-view` 훅이 `groups`를 반환해도 뷰 컴포넌트가 `flatX`만 렌더하고 `groups`를 무시 (`stickers-view.tsx` 확인 — `flatStickers.map()`). config+훅만으론 화면 변화 0 = "골라도 아무 일 없는" 버그.
- **엔티티당 3단**:
  1. `view-configs.tsx` groupingOptions에 `{ value: "firstLetter", label: "Index" }` 추가. 5개가 정확히 `none`만 가져서 `replace_all` (old: `{ value: "none", label: "No grouping" },` + `],`) 한 방 안전 — 다른 config는 옵션 더 있거나 `[]`.
  2. `use-X-view.ts` `applyXGrouping`에 `firstLetter` case 추가. tags/labels/stickers/files/references 훅은 grouping 함수가 `groupBy` 파라미터를 안 받음 → 파라미터 신규 + `GroupBy` import + 훅 호출에 `viewState.groupBy` 전달 + useMemo deps. (templates는 이미 받음.)
  3. 뷰 컴포넌트에 그룹 헤더 렌더링 신규: `flatX.map()` → `groups.map(g => header + g.items.map())`.
- **이름 필드**: Tags/Labels/Stickers/Files = `.name`, References = `.title`. 로직은 `group.ts:groupByFirstLetter` 미러 (첫 글자 대문자, 비문자 "#" 버킷, "#" 마지막).
- **첫 스텝**: `components/views/{tags,labels,files,references}-view.tsx` 4개 읽기 (stickers-view 확인됨) → list/grid 렌더 구조 파악 → grid 모드 그룹 여부 결정.
- **참고 패턴**: `wiki-list-pipeline.ts` / `use-books-view.ts`의 `firstLetter` case (이번 세션 추가분).

### 2. **🟡 레거시 정리 — 옛 Index 토글 버튼 제거**

Index를 Grouping으로 통일했으나 Wiki/Templates 컬럼 헤더에 옛 `showAlphaIndex` 토글 버튼 잔존 (`wiki-list.tsx:364`, `templates-table.tsx:228`) + `showAllArticles`/`showAlphaIndex` 경로 + `display-panel.tsx:400` dead branch. Grouping과 기능 중복 → 제거. `wiki-list.tsx:911` `showAllArticles ? 알파벳 : groups` 분기 collapse — JSX 수술이라 조심 (Read→분기 헬퍼→Edit 순서).

### 3. **🟢 Timeline 뷰모드 탭 아이콘**

`display-panel.tsx` MODE_DEFS — Timeline `Ruler` 아이콘이 List/Board/Gallery(박스형)과 시각 불일치 (아이콘↔글자 간격 어색). 박스형 아이콘으로 교체 (1줄). 모든 탭 CSS는 동일 (`gap-1.5 flex-1`) — 아이콘만 문제.

---

## 🔵 P1

### temporal-hooks PRD 후속

`.omc/plans/unified-temporal-hooks-prd.md` (DRAFT v0.1) — §11 open questions 6개 + phasing 결정 필요. 정보 아키텍처 재정렬 = 큰 방향 → 사용자 조율 후 진행. 선행 PRD(`inbox-layer.md`/`activity-unification-prd.md`) 위에 쌓는 구조.

### EVENT_MARKER_CONFIG 신규 이벤트 매핑

지난 세션 P0였으나 이번 세션이 Index/temporal-hooks 방향으로 진행 → 미완. `components/views/wiki-timeline/wiki-timeline-config.ts:143` `EVENT_MARKER_CONFIG`에 `merged`/`unmerged`/`split`/`section_collapsed` Phosphor 아이콘+색 매핑 추가 (wiki entity 발화 + 현재 미매핑 4타입).

---

## ✅ 최근 완료

- **2026-05-22**: 통합 시간 모델 PRD (`unified-temporal-hooks-prd.md` DRAFT v0.1) + Index→Grouping 통일 (content 5종 — Wiki/Templates/Books groupingOptions `firstLetter`, `showAlphaIndex` 가짜 칩 제거, 파이프라인 `firstLetter` case) + 빌드 에러 픽스 (worktree node_modules `npm install`).
- **2026-05-21 (저녁 후속 #6)**: wiki-timeline-view.tsx sub-component 분리 — 1380줄 → 386줄 orchestrator + 9 모듈 파일. 순수 리팩토링.
- **2026-05-21 (저녁 후속 #5)**: `router.push("/wiki/[id]")` dead code 정리 (PR #398).
- **2026-05-21 (저녁 후속 #4)**: Books own Views section.
- **2026-05-21 (저녁 후속 #3)**: Activity events granular wire-up (wiki/book/label).
- **2026-05-21 (저녁 후속 #2)**: Ontology graph node → SmartSidePanel 동기화.
- **2026-05-21**: bars-first timeline 3 라운드 (PR #392) + 옵션 C drag/event marker chips (PR #393) + 막대 끝점 재설계.

---

## Parked / Brainstorm

- **기존 체크박스-todo → Inbox kind 이전 검토** — `lib/todo-index.ts`(노트 본문 체크박스 인덱스)를 독립 "Todos" 기능으로 키우지 말고, Inbox(attention 큐)에 새 `InboxItemKind "task"`로 추가. Home open-loops 통합. → temporal-hooks PRD의 Layer B(작업 hook)와 직결 — PRD 후속 시 같이.

---

## 영구 LOCKED 결정 (누적 #88, 후보 #89 / #90 / #91)

- 최근 (PR #387): #84-#88 — wiki-view-mode 직접 구독 / layout.tsx 정확 매핑 / Save view entity differentiate / Library = hub (view는 sub-entity) / Categories own view.
- 후보 (#89): **planning intent ≠ content activity** — `setWikiArticlePlannedDate`는 `updatedAt` 갱신 안 함. 다음 세션 사용자 OK 시 LOCKED.
- 후보 (#90): **event markers = icon chip 패턴** — filled colored ring + Phosphor 흰 아이콘 inline (nested SVG). 추상 도형은 작은 사이즈에서 식별 불가 (작업 원칙 #8 reinforce). Gentle ≠ illegible. 사이즈 식별 가능 > 컬러 다양성 > 도형 다양성.
- 후보 (#91): **막대 끝점 = status는 도형 자체로** — Article = 막대 끝 화살촉, Stub = rounded end. 떠 있는 dot은 disconnect. horizon source는 막대 위치(future stripe)로 자명 → 별도 마커 폐기 (시각 신호 중복 제거).
- 후보 (#92): **Index = Grouping, not a column** — Display Properties 칩은 진짜 컬럼과 1:1. "Index"(알파벳 그룹핑)는 Grouping 드롭다운에 속함. 이번 세션 content 5종 적용. 라이브러리 5종 완료 시 LOCKED.

전체 영구 룰 #1-#88: docs/MEMORY.md + docs/CONTEXT.md 참조.

---

## Deferred (당장 안 함)

- 다중 기기 sync (Supabase B + E2E + Yjs) — PRD 작성 완료, Phase 1 시작 준비. 사용자 시그널 대기.
- 편집 히스토리 v1 — multi-machine PRD 시점 권장.
- Ambox — Skip 권장 (사용자 시그널 시 재검토).
- SectionTemplate (그룹만 재사용) — MVP 후.
