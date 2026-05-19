# TODO

> 우선순위 기반 작업 목록. **P0 = 다음 세션 즉시 시작점** (NEXT-ACTION.md 폐지, 2026-05-12).
> 완료 항목은 즉시 삭제. 자세한 history는 SESSION-LOG.md + MEMORY.md.

**마지막 갱신**: 2026-05-19 (밤 후속 #2) — P0 #1 Plan A++ 완료 (PR #387 squash merged `fb4c2da`). Library = hub 본질 회복 + 영구 룰 #84-#88 LOCKED.

---

## 🟣 P0 — 즉시 (cross-machine 진입점, 2026-05-19 밤 후속 #2)

### 1. **🟣 dead block cleanup follow-up** (~3 파일, LOW risk, 옵션 A 잔존 정리)

PR #387 옵션 A로 wiki-view-mode setter 부작용 제거 + 6 호출처 route navigate paired. 단 enum 잔존:

- `components/side-panel/side-panel-context.tsx:131-156` — `isCategoryMode` dead block (옵션 A 후 영원히 false, 회귀 risk 0)
- `lib/wiki-view-mode.ts:9` — `WikiViewMode` union에 `"category"` 리터럴 잔존 (dead enum value)
- `lib/wiki-view-mode.ts` — `setActiveCategoryView` / `setCategoryOverview` 함수 시그니처 정리 (deprecate 또는 이름 변경 — `useActiveCategoryId` 갱신용으로만 사용됨)

cleanup:
1. side-panel-context.tsx 131-156 dead block 제거 + `useWikiViewMode` import 제거
2. WikiViewMode union에서 "category" 리터럴 제거
3. setter 함수 시그니처 또는 docs 정리

**위험**: 0 (현재 기능 영향 0, 미래 타입 오염 방지)

### 2. **🟡 Calendar 사이드바 변화** (사용자 의도 미확정)

이전 시그널: "Calendar의 우측 사이드바도 뭔가 변화가 필요해. 좋은 의미로."

후보:
- Day Summary panel / 월간 통계 / 현재 노트 detail 강화

### 3. **🟡 Ontology graph node 사이드바 동기화** (사용자 의도 미확정)

후보:
- Graph node → 4탭 사이드바 (추천)
- OntologyDetailPanel + 4탭 둘 다
- 사이드바에 graph mode

### 4. **🟡 Activity events 후속**

- Granular Wiki/Book events wire-up (block_added/item_added 등)
- Label entity events 발화 (tags.ts 패턴 정합)

### 5. **🟡 Books own Views section** (entity-uniformity 확장, 영구 룰 #87 정합)

영구 룰 #87: Library = hub. own view는 sub-entity가. **Books는 1차 entity (Note/Wiki 동급)이지만 own Views section 없음 (gap)**.

- `renderViewsSection`에 books space 매핑 추가
- `linear-sidebar.tsx` Books section에 own Views section
- SavedView.space `"books"`는 이미 union에 있음 (별도 migrate 불필요)

### 6. **🟢 사용자 manual smoke 누적 14 PR (#373-#387)**

PR #373-#387 fresh dev에서 cross-verify. 특히 PR #387 본질 변경:

- Wiki article 본문 안 category badge click → `/library/categories` + 해당 category selected
- Navbox category header click → `/library/categories`
- Side panel Connections / Category detail panel parent/sub click → `/library/categories`
- Library home Categories card click → `/library/categories`
- `/wiki` 정상 동작 (wikiViewMode "category" 트리거 안 됨)
- Tags/Labels/Files/References/Stickers click → Views section 노출 안 됨
- 기존 saved view (PR #385 "library" space) → v144 migrate 후 Categories sub-page 노출

---

## 영구 LOCKED 결정 (PR #387로 #84-#88 추가, 누적 #88)

이번 PR 5개 신규 LOCKED:

- **#84**: wiki-view-mode external store는 LibraryCategoriesView가 직접 구독 (own component own state subscribe)
- **#85**: layout.tsx mount 조건 정확 매핑 의무 (`activeRoute === "/library/categories"` vs `startsWith` too broad — PR #382 회귀 사례)
- **#86**: Save view 의미 = entity 본질 따라 differentiate
- **#87**: Library = hub. own Views section 없음. 1차 시민이지만 view는 sub-entity가
- **#88**: Categories own view component (cross-entity 본질 회복, wiki 종속 부조화 해소)

전체 영구 룰 #1-#88: docs/MEMORY.md + docs/CONTEXT.md 참조.

---

## Deferred (당장 안 함)

- 다중 기기 sync (Supabase B + E2E + Yjs) — PRD 작성 완료, Phase 1 시작 준비. 사용자 시그널 대기.
- 편집 히스토리 v1 — multi-machine PRD 시점 권장.
- Ambox — Skip 권장 (사용자 시그널 시 재검토).
- SectionTemplate (그룹만 재사용) — MVP 후.
