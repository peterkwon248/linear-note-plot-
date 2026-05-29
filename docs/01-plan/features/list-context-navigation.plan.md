# List Context Navigation (리스트 컨텍스트 네비게이션)

> **Linear의 "이슈 리스트 peek 네비" 패턴을 노트/위키에.** 어떤 화면(리스트/보드/그리드, 폴더/뷰/status)에서 노트·위키를 열면, **그 화면에 보이던 집합을 캡처**해서 에디터에서 ←/→로 순회 + "← {화면}"으로 복귀.
> **북의 `BookContextNav`(`bookContext`)를 일반화**하는 작업. 북은 영속 ordered entity라 쉬웠고, 리스트는 "그 순간 보이던 ID 목록"을 캡처하는 한 단계가 추가됨.
> 사용자 승인 (2026-05-29): freeze 스냅샷 + 메인 리스트/폴더/뷰 + board/grid 포함, timeline 보류. **다음 세션 구현** (이번 세션 컨텍스트 한계로 설계만 확정).

## 0. 메타
- 선례: `components/books/book-context-nav.tsx` (`BookContextNav`) + `lib/store/types.ts:62` `BookContextState{bookId,itemIndex}` + `bookContext:{primary,secondary}` (pane별, 세션 한정) + `setBookContext(pane, ctx)`.
- 글로벌 Back/Forward(`navigationHistory`/`navigationIndex`)는 이미 있음 — 단 **리스트-인지(prev/next through the list)는 아님**. 이 기능이 추가하는 핵심 = ① 떠나온 리스트 안에서 prev/next ② 에디터에 "← {라벨} N/M" 전용 컨텍스트 바.

## 1. 핵심 원리 (전 케이스 통일)
> **노트/위키를 *엔티티 리스트 화면*에서 열 때, 그 화면의 보이는 항목을 표시 순서대로 flatten한 ID 목록 + 클릭 index + 라벨을 캡처(freeze).**

- **활성 필터 + 그룹핑이 곧 기준** ("그 화면 기준"): 캡처 = 그 순간 필터로 *걸러져 보이는* 항목만, 그룹핑돼 있으면 그룹 순서대로 flatten. 필터/그룹을 바꾼 뒤 열면 그 *바뀐* 화면이 스냅샷 기준. (freeze라 이후 필터를 풀어도 스냅샷은 "그때 그 화면" 유지.)
- 디스플레이 모드별 flatten 순서:
  - **List**: 렌더 순서(위→아래)
  - **Grid**: 렌더 순서(row-major)
  - **Board**: 컬럼 좌→우, 각 컬럼 카드 위→아래
  - **Timeline**: ⏸️ 보류 (2D 시간축, "다음" 모호. 후속 시 horizon 날짜순)
- 화면(컨텍스트) 종류 — 전부 "필터된 같은 뷰"라 동일 규칙으로 자동 포함:
  - All Notes / status 라우트(/backlog·/todo·/in-progress·/done) / 폴더(`/notes`+folderId) / Saved View
  - Wiki: Overview/list, status 필터, 폴더, Saved View. (폴더/뷰면 그 안의 위키들)
- 라벨 = 화면 이름 ("All Notes" / "Backlog" / 폴더명 / 뷰 이름 / "Done" 등).
- **Freeze**: 열 때 ID 목록 고정 (리니어 방식). 사이에 노트 status 바뀌어도 "그때 그 리스트" 안정 유지. 라이브 재조회 X.

## 2. 데이터 모델 (lib/store/types.ts — bookContext 패턴 미러)
```ts
export interface ListNavContext {
  space: "notes" | "wiki"
  ids: string[]      // freeze된 보이는 순서 ID 목록
  index: number      // 현재 위치
  label: string      // "All Notes" / 폴더명 / 뷰 이름 등
  backRoute: string  // 복귀할 route ("/notes" / "/backlog" / "/wiki" 등)
  // 선택: backFolderId / backViewId (복귀 시 정확한 필터 복원용 — viewStateByContext가
  //       대부분 보존하지만, 폴더/뷰는 active id도 같이 복원 필요)
}
listNavContext: { primary: ListNavContext | null; secondary: ListNavContext | null }
setListNavContext: (pane: "primary" | "secondary", ctx: ListNavContext | null) => void
```
- 세션 한정 (reload 시 reset — bookContext처럼 partialize strip 또는 onRehydrate null).

## 3. 캡처 (리스트 화면의 행/카드 클릭 핸들러)
- 각 뷰(notes-table/notes-board/notes-grid, wiki-list/wiki-board/wiki-grid)는 이미 **보이는 정렬된 항목**을 렌더 → 그 ordered ID 배열을 클릭 시점에 확보.
- 클릭 핸들러: `setListNavContext(pane, { space, ids: visibleOrderedIds, index: clickedIndex, label, backRoute })` + 기존 `openNote`/`navigateToWikiArticle`.
- 폴더/뷰: 동일 뷰가 필터만 다르게 렌더 → `ids`가 자연히 폴더/뷰 내 항목. `label`+`backRoute`(+folderId/viewId)만 맥락에 맞게.
- board/grid flatten: 위 §1 순서. 뷰가 그룹/컬럼 구조를 알고 있으니 flatten 헬퍼로 단일 배열화.

## 4. 에디터 컨텍스트 바 (BookContextNav 형제 / 일반화)
- `components/.../list-context-nav.tsx` (또는 BookContextNav 일반화): `← {label}  N / M  →`.
  - prev = `openInPane(ids[index-1])`, next = `ids[index+1]`. index 0에서 prev / 끝에서 next 비활성.
  - `← {label}` 클릭 = `backRoute`로 복귀 (+folderId/viewId 복원). view-state(필터/그룹/모드)는 `viewStateByContext`에 보존돼 그대로 복원. 선택: 떠났던 노트로 scroll/highlight.
- pane-aware: note-editor / wiki article 헤더가 현재 pane의 listNavContext 읽어 핸들러 주입 (BookContextNav 패턴 동일).

## 5. 우선순위 / 클리어 규칙
- **북에서 열기** → `bookContext` set + `listNavContext` clear (해당 pane).
- **리스트 화면에서 열기** → `listNavContext` set + `bookContext` clear.
- 헤더 표시 우선순위: bookContext > listNavContext > none.
- **링크(위키링크/백링크)로 이동**: listNavContext 유지(복귀 affordance 살림). 현재 노트가 snapshot에 있으면 N/M+←→ 표시, 없으면(링크로 벗어남) "← {label}"만 표시(카운터 숨김). — 구현 세부, 일단 이 규칙.

## 6. Edge cases
- snapshot의 노트가 삭제/trash됨 → navigate 시 missing skip (또는 존재하는 ID로 필터링 후 순회).
- 클릭 노트 status 변경(필터에서 벗어남) → snapshot은 freeze라 유지 (의도된 안정성).
- 빈 리스트/단일 항목 → 컨텍스트 바 N/M=1/1, prev/next 비활성 (또는 바 숨김).
- secondary pane(dual mode) → pane별 독립 listNavContext.

## 7. 범위 (이번 작업)
**포함**: List/Grid/Board 디스플레이 + All Notes/status/폴더/Saved View (노트·위키 양쪽).
**보류**: Timeline (애매 → 후속, horizon 날짜순) · 검색 결과 · 사이드바 Recent/Pinned (별도 맥락, 후속 가능).
**불변**: 북 컨텍스트(BookContextNav)는 그대로 — 이건 형제로 추가.

## 8. Must / Must NOT
**Must**: bookContext 패턴 일반화(중복 구현 X — 가능하면 BookContextNav 공유/추출) · freeze 스냅샷 · 전 디스플레이 모드 flatten 캡처 · pane-aware · 세션 한정 · build/tsc/test green
**Must NOT**: 글로벌 navigationHistory와 혼동/대체 X (별개) · 북 컨텍스트 깨기 X · timeline 무리하게 끼우기 X

## 9. Success
- [ ] All Notes(노그룹핑)에서 노트 열기 → 에디터에 "← All Notes N/M" → ←/→ 그 리스트 순회 + 복귀 시 노그룹핑 상태 복원
- [ ] Board/Grid 모드에서도 동일 (flatten 순서)
- [ ] 폴더/Saved View에서 열기 → 그 폴더/뷰 내 항목으로 컨텍스트
- [ ] 위키도 동일
- [ ] 북 컨텍스트와 공존(우선순위) · build/tsc/test green · Architect · preview

## 10. 검증 게이트
`npm run build`(authoritative) + `tsc --noEmit` + `npm run test` + Architect + preview 런타임.

---

## ⏳ 이번 세션 미완 — 다음 세션 인수인계 (컨텍스트 한계로 보류)
1. **kind nav** (Books): All Books 아래 Smart/Manual/Hybrid 필터 nav. `bookKindFilter` 외부 store(wiki `wikiStatusFilter` 패턴 재사용) + 사이드바 + books-view 필터. getBookKind로 계산. counts: Smart 3/Manual 2/Hybrid 2. (설계 확정, 구현만 남음. Overview는 보류 결정.)
2. **이 문서의 List Context Navigation** 구현.
3. **Smart Book 커밋·PR #491**: 현재 `claude/smart-book-preset` 브랜치에 미커밋(build/tsc/test/Architect/preview 전부 green). PR #490(위키)와 분리된 별도 PR로.
4. **after-work**: docs(MEMORY/SESSION-LOG/TODO/CONTEXT) 최신화 — 이번 세션 = 위키 status v151 + 위키 사이드바/Recent + 노트 merge/split + 위키 데이터 복구 + Smart Book Preset + (설계) kind nav·list-nav. PR #490 머지 상태도.
