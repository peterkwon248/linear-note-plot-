# Wiki Status 도입: stub/article(자동 2단계) → backlog/todo/in_progress/done(수동 4단계)

> **노트 status(PR #489)와 완전 통일.** 위키에 노트와 동일한 수동 4단계 완성도 status를 **신규 persisted 필드로 도입**하고, 기존 자동 stub/article(`isWikiStub()`)을 대체.
> ⚠️ **노트 때와 결이 다름**: 노트는 기존 persisted enum의 *rename*이었으나, 위키는 **persisted status 필드 신규 + `isWikiStub()` 호출처 전부 교체**.
> **단일 atomic PR** (partial = 모델/뷰 불일치). 데이터모델 PR이지만 필드 도입 특성상 모든 consumer 함께 이동 (note-status-4stage 선례 동일).

## 0. 메타
- 상태: 방향 Locked (2026-05-29). 사용자 승인: "위키에서 스터브 아티클 없애고 백로그,투두,인프로그레스,던 도입" + 모델 = "노트와 동일 (수동)".
- **북(Books)은 status 미도입** (사용자 결정 2026-05-29) — 북은 컨테이너, kind만 유지.
- store version: **v150 → v151** (IDB migration 필수)
- 폐기: `WIKI_STATUS_HEX`/`WIKI_STATUS_COLORS`(stub/article 2색) · `IconWikiStub`/`IconWikiArticle`의 status 역할 · stub/article i18n 라벨.

## 1. 핵심 발견 (isWikiStub 의미)
`lib/wiki-utils.ts:10` — `isWikiStub` = 블록 ≤4 AND 모든 텍스트 블록 빈 내용. 즉 **stub = 아직 안 쓴 기본 템플릿 / article = 내용 있음**. 단순 콘텐츠-존재 2분법(완성도 척도 아님). 단 디자인 의도상으론 stub=주황(작업 중)·article=에메랄드(완성)로 전달돼 왔음(`colors.ts:161`).

## 2. 결정 (영구)

### 모델
- `types.ts`: `export type WikiStatus = NoteStatus` (= `"backlog"|"todo"|"in_progress"|"done"` 재사용, self-documenting alias). `WikiArticle`에 `status: WikiStatus` 필드 추가 (`types.ts:465` interface).
- 색/아이콘/i18n = **노트와 공유** (`NOTE_STATUS_HEX`, `StatusIcon` 4-circle, `status.backlog/todo/in_progress/done` i18n 키). "status는 어디서나 status" 원칙.

### ✅ 마이그레이션 매핑 (확정 2026-05-29)
| 현재(자동) | → 확정 |
|-----------|-------|
| stub (빈 템플릿) | `backlog` |
| article (내용 있음) | `done` |
| — | `todo`/`in_progress` 빈 시작 (수동) |

- **확정 = stub→backlog, article→done**. 근거: ① 전달돼 온 시맨틱(에메랄드 article=완성) + 시각 연속성(에메랄드→done emerald) ② 노트 keystone→done과 대칭 ③ triage 최소화 — 제텔카스텐형 위키는 글이 익어 정착하므로 내용 있는 article 대부분이 사실상 완성; 소수만 in_progress로 강등하면 됨 (article→in_progress는 완성 다수를 수동 승격해야 + done이 비어 완료 가시성 상실. 과대주장이 과소주장보다 정정 비용 낮음).

### 라우트 / 네비 (권장: 신규 라우트 없음)
- 위키 status는 **위키 board(2→4컬럼) + 위키 list status 컬럼 + 필터**로 노출. `/wiki/backlog` 류 신규 라우트는 만들지 않음 (노트의 top-level 라우트는 노트가 status-primary 엔티티라서; 위키 status는 위키 내부 관심사). 필요 시 후속.

### 아이콘 처리 (status vs 엔티티 식별 분리)
- **status가 의미 있는 곳** (위키 list status 컬럼 / 위키 board 컬럼 / 위키 grid / wiki-article-detail-panel) → 공유 `StatusIcon` 4-circle.
- **엔티티 식별만 필요한 mixed 컨텍스트** (book-item-row / WikilinkSuggestion / MentionSuggestion / ontology / search / 사이드바 pinned·recent wiki row) → 단일 위키 글리프(예: `BookOpen`/canonical wiki icon)로 통일. stub/article 분기 제거. (각 call site별 판단 — Architect 검증.)

## 3. v151 IDB Migration spec (lib/store/migrate.ts)
```ts
// v151: Wiki status 신규 도입 (stub/article 자동 → 수동 4단계 persisted)
// isWikiStub(article) 로 시드 (블록 ≤4 + 텍스트 빈 → stub). 매핑은 §2 결정값.
if (Array.isArray(state.wikiArticles)) {
  state.wikiArticles = state.wikiArticles.map((a) =>
    a.status ? a : { ...a, status: isWikiStub(a) ? "backlog" : "done" }  // idempotent
  )
}
// + viewStateByContext: wiki space group/collapsedGroups/filter 에 stub/article 리터럴 있으면 매핑
// + SavedView(space==="wiki") filters status 리터럴 매핑
// + customQuickFilters(wiki) rule value 매핑
```
- idempotent (이미 status 있으면 no-op). blocks 미로드(`length===0`) 시 isWikiStub=false → done 처리되는 edge: 마이그 시점 blocks 로드 보장 확인 (또는 backlog 보수 처리) — 구현 시 검증.

## 4. 표면적 (코드 ~30파일, docs/archive 제외)
- **데이터모델**: `lib/types.ts`(WikiStatus alias + WikiArticle.status) · `lib/store/migrate.ts`(v151) · `lib/store/index.ts`(version 151) · `lib/store/seeds.ts`(시드 article에 status) · `lib/wiki-utils.ts`(isWikiStub = 이제 마이그 시드 전용, 런타임 status 읽기로 대체)
- **색/문구**: `lib/colors.ts`(WIKI_STATUS_HEX/COLORS 제거, 위키→NOTE_STATUS_HEX 참조) · `app/globals.css`(--chart-3/--wiki-complete status 용도 정리) · `lib/i18n.ts`(위키 stub/article 라벨 → status.* 공유 키)
- **view-engine**: `view-configs.tsx`(WIKI_VIEW_CONFIG status 옵션 2→4, NOTES 정합) · `wiki-list-pipeline.ts`(stub/article 그룹/정렬 → status) · `types.ts`(wiki ViewContextKey/STATUS 류) · `lib/insights/types.ts`+`timeseries.ts`(stub/article 집계 → status)
- **위키 뷰**: `wiki-view.tsx` · `wiki-list.tsx` · `wiki-board.tsx`(컬럼 2→4) · `wiki-grid-view.tsx` · `wiki-timeline-view.tsx`+`wiki-timeline/`(config·timeline-bar·label-column 색/status) · `wiki-dashboard.tsx`(breakdown 2→4) · `trash-all-view.tsx` · `tags-view.tsx`
- **위키 에디터/디테일**: `wiki-editor/wiki-insights-chart.tsx` · `wiki-editor/wiki-article-view.tsx` · `side-panel/wiki-article-detail-panel.tsx` · `side-panel/side-panel-connections.tsx` · `side-panel/wiki-template-detail-panel.tsx`
- **아이콘/크롬**: `plot-icons.tsx`(IconWikiStub/Article 정리) · `linear-sidebar.tsx`(위키 pinned/recent status 아이콘) · `home/stats-row.tsx`
- **ontology**: `ontology-dashboard-panel.tsx` · `dashboard-charts.tsx` · `ontology-legend.tsx` · `ontology-graph-canvas.tsx` (위키 status breakdown/색)
- **에디터 suggestion**: `editor/WikilinkSuggestion.tsx` · `WikilinkDecoration.ts` · `MentionSuggestion.tsx` · `infobox-value-renderer.tsx`
- **북(위키 항목 표시)**: `books/book-item-row.tsx` · `book-context-nav.tsx` · `add-item-dialog.tsx`

## 5. Must / Must NOT
**Must**: 신규 `WikiArticle.status` + v151 migration(데이터 손실 0, idempotent) · 모든 isWikiStub 런타임 호출처 → status 읽기 교체 · tsc 0 · build clean · tests pass(literal/fixture 갱신) · 위키 board 4컬럼 · 위키 필터/디스플레이 4옵션 · 노트와 색/아이콘/i18n 공유
**Must NOT**: 북에 status 도입 · 신규 위키 라우트(`/wiki/backlog` 류) · 위키 엔티티 색(violet, `SPACE_COLORS.wiki`/`GRAPH_NODE_HEX.wiki`) 변경 — status 색과 별개 · 다른 기능 묶기 · isWikiStub 시맨틱(빈 vs 내용)을 마이그 외 로직에 잔존

## 6. Success
- [ ] ~30파일 일관, tsc/build clean, tests pass
- [ ] 위키 board 4컬럼(대기/준비/정리 중/완성) + 위키 list status 컬럼 + 필터 4옵션
- [ ] 기존 사용자: v151 후 stub→backlog, article→done(§2 확정값). todo/in_progress 빈. 데이터 손실 0
- [ ] mixed 컨텍스트 위키 엔티티 식별 유지 (단일 글리프)
- [ ] Architect verification

## 7. Open Question — ✅ RESOLVED (2026-05-29)
**§2 마이그레이션 매핑 확정**: stub→backlog, article→done. 구현 진입.
