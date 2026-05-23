# TODO

> 우선순위 기반 작업 목록. **P0 = 다음 세션 즉시 시작점** (NEXT-ACTION.md 폐지, 2026-05-12).
> 완료 항목은 즉시 삭제. 자세한 history는 SESSION-LOG.md + MEMORY.md.

**마지막 갱신**: 2026-05-23 (후속) — Audit v2 + PR-A 데이터 무결성 5건 + Lucide 마이그레이션 90 파일 (PR-X1~X4) 완료. 다음 P0 = PR-X5 (editor lucide) + audit §8 사용자 결정 후 PR-B (mode-aware UI).

---

## 🟣 P0 — 즉시 (cross-machine 진입점, 2026-05-23 후속)

> P0 #1 = PR-X5 (editor + wiki block + comments lucide 마이그레이션 ~30 파일). #2 = audit §8 사용자 결정 후 PR-B 진입. #3 = PR-X6 잔여 lucide ~30 파일.

### 1. **PR-X5: Editor + wiki block + comments lucide 마이그레이션 (~30 파일)**

상세 = SESSION-LOG 2026-05-23 (후속) hook + audit 문서 `.omc/plans/view-state-reliability-audit.md`.

- **대상 폴더**: `components/editor/*` (~10 파일 — TipTap node 컴포넌트, picker dialog 등) + `components/wiki-editor/*` (~15 파일 — article-view, block-renderer, hatnotes, infobox 등) + `components/comments/*` (~3 파일)
- **첫 스텝**: `Grep import .* from "@phosphor-icons/react" --path components/editor` → 인벤토리 → 작은 파일부터 batch (PR-X1~X4 패턴 그대로)
- **변환 룰**: import block 통째 교체 (alias 유지) + weight prop replace_all (regular→strokeWidth=2 / bold→2.5 / light→1.5 / fill→fill="currentColor" / duotone→strokeWidth=1.5 / dynamic→conditional fill)
- **자체 컴포넌트 인지 (Plot icons)**: lucide 변환 대상에서 제외 (strokeWidth 박지 말 것)
- **검증**: tsc + runtime HMR 매 batch

### 2. **PR-B: Mode-aware UI 룰 구현** (audit §8 사용자 결정 후)

`.omc/plans/view-state-reliability-audit.md` PR-B 단위. **사용자 결정 3개 받은 후 진입**:

- **#1**: Wiki timeline default groupBy → 추천 `wikiStatus` (Stub/Article 시간축)
- **#2**: PR-B2 (timeline lane 그룹 헤더 구현) → (a) PR-B와 같이 vs (b) 후속. Linear L1 엄격이면 (a) 추천
- **#3**: Library 5종 hook 통합 (PR-D) → 추천 미루기 (컴포넌트-사이드 firstLetter 패턴 유지)

작업: view-configs.tsx 타입 확장 (`modes` 필드 추가) + 11 ViewConfig declarative modes 선언 + DisplayPanel/FilterPanel filter + normalizeViewState mode-aware auto-cleanup + PR-B2 갭 해소 (B4 timeline, B5 gallery, B6 label-column, B11 references, B12 templates grid).

### 3. **PR-X6: 나머지 lucide 마이그레이션 (~30 파일)**

`components/notes-table.tsx`, `notes-board.tsx`, `note-editor.tsx`, `note-fields.tsx`, `note-context-menu-items.tsx`, `note-picker-dialog.tsx`, `note-list.tsx`, `merge-dialog.tsx`, `link-suggestion.tsx`, `insights-view.tsx`, `insert-menu.tsx`, `home/*`, `inbox/*`, `inspector/*`, `ontology/*`, `books/*`, `comments/*` 등.

### 4. **File 독립 엔티티 v1 구현** (PRD 완성 — `.omc/plans/file-entity-prd.md` v0.2)

PR-X 시리즈 끝나고 진행. `Attachment`를 note-scoped → 독립 Library 엔티티로. PRD §6-1 v1 = PR 2개 (마이그레이션+모델 / 피커 UI). 첫 스텝: `lib/types.ts:997` `Attachment` + `lib/store/slices/attachments.ts:7` + `lib/store/migrate.ts:1919`.

### 5. **노트·북에도 Timeline 디스플레이 모드 추가**

PR-B 완료 후. 현재 Timeline = Wiki 전용. viewState 흐름이 견고해진 후 노트/북에도 Timeline view mode 추가.

---

## 🔵 P1

### temporal-hooks PRD 후속

`.omc/plans/unified-temporal-hooks-prd.md` (DRAFT v0.1) — §11 open questions 6개 + phasing 결정 필요. 정보 아키텍처 재정렬 = 큰 방향 → 사용자 조율 후 진행.

---

## ✅ 최근 완료

- **2026-05-23 (후속)**: 거대 세션 단일 PR — (a) `.omc/plans/view-state-reliability-audit.md` v2 Linear 마인드셋 통합 + (b) PR-A 데이터 무결성 5건 (VALID_GROUP_BY/VALID_SORT_FIELDS/wordCount/fail-closed 3개/Files searchQuery) + (c) Lucide 마이그레이션 90 파일 (PR-X1 UI primitive 21 / PR-X2 chrome 17 / PR-X3 side-panel 17 / PR-X4 view components 30). 부수 효과: carousel.tsx KeyboardEvent.key 버그 자동 fix. Brand 5종(Stone/Brick/Block + Stub/Article) phosphor 유지. tsc clean.
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
