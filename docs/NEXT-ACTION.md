# 🎯 Next Action

> **이 파일은 before-work가 가장 먼저 읽고, after-work가 마지막에 갱신한다.**
> 다음 세션 시작 시 "지금 바로 뭐 해야 하지?"의 답.
> 항상 1~3개의 immediate next action만. 큰 그림은 docs/MEMORY.md.

---

**Last Updated**: 2026-04-15 오후 (Phase 2-1B-1 완료 — wiki-article-renderer read-only 신규 + 2 호출 지점 마이그레이션. 편집 모드는 Phase 2-1B-2에서 흡수)

## 🎯 다음 세션 시작하면 바로 할 것

### Phase 2-1B-2 시작 — 편집 모드 흡수 + wiki-view + secondary-panel-content 마이그레이션

**배경**: Phase 2-1B-1 완료. read-only WikiArticleRenderer 동작 확인 (note-hover-preview + wiki-embed-node에서 사용 중). 이제 **편집 모드의 모든 기능을 wiki-article-renderer에 흡수**해야 wiki-view + secondary-panel-content를 마이그레이션 가능.

**진실의 원천**: `docs/BRAINSTORM-2026-04-14-column-template-system.md` (특히 "2026-04-15 결정 추가" 섹션)

**Phase 2-1B-2 작업 내용** (~1주, 1 PR):

1. **WikiArticleRenderer 편집 모드 흡수**
   - editable 모드 props 추가 (onEditCallback, splitMode 등)
   - SortableContext + DnD 핸들러 (블록 reorder)
   - AddBlockButton (top + bottom)
   - 편집 가능한 Title / Aliases / Categories
   - 편집 가능한 Infobox (entityType="wiki" + onHeaderColorChange)
   - SectionBlock collapse persist (block.collapsed)
   - 편집 모드용 nearestSectionLevel 계산
   - splitMode UI (체크박스 + 하단 바 + handleConfirmDragSplit)
   - FloatingDragDropBar + DragOverlay (cross-article drag)
   - Virtuoso 가상화 (read모드, blocks > 50)

2. **wiki-view.tsx + secondary-panel-content.tsx 마이그레이션**
   - 두 곳 모두 WikiArticleEncyclopedia/WikiArticleView 호출 → WikiArticleRenderer로 교체
   - editable / preview / fontSize / collapseAllCmd 등 기존 props 모두 호환

3. **note-hover-preview의 editing 분기 제거**
   - Phase 2-1B-1에서 임시로 분기 처리한 부분 → editing도 WikiArticleRenderer 사용

**Phase 2-1B-2 완료 시 동작**:
- 4 호출 지점 모두 WikiArticleRenderer 사용
- 기존 두 렌더러는 사용처 0 (dead code) → Phase 2-1B-3에서 삭제

### Phase 2-1B-3 (Phase 2-1B-2 후) — Cleanup

- 기존 wiki-article-view.tsx + wiki-article-encyclopedia.tsx 삭제
- `WikiLayoutToggle` + 그 5 사용처 정리
- `WikiArticle.layout: WikiLayout` 필드 삭제
- `columnLayout` → `layout` rename (BRAINSTORM 원안)
- `WikiLayout` 타입 삭제
- `tocStyle` / `infoboxColumnPath` 기본값 backfill
- Migration v77

**참고 파일**:
- `BRAINSTORM-2026-04-14-column-template-system.md`
- `components/wiki-editor/wiki-article-renderer.tsx` (Phase 2-1B-1 신규 — read-only 모드)
- `components/wiki-editor/column-renderer.tsx` (Phase 2-1A — pathKey 헬퍼)
- `components/wiki-editor/wiki-title.tsx` (Phase 2-1A — editable prop 이미 있음)
- `components/wiki-editor/wiki-theme-provider.tsx` (Phase 2-1A)
- `components/wiki-editor/wiki-article-view.tsx` (편집 모드 reference, 1220줄)
- `components/wiki-editor/wiki-article-encyclopedia.tsx` (편집 모드 reference, 406줄)

---

## (legacy plan, kept for reference)

### Phase 2-1B 시작 — 기존 렌더러 통합 + layout string 제거

**배경**: Phase 2-1A 완료. 인프라 컴포넌트(`ColumnRenderer` / `WikiTitle` / `WikiThemeProvider`)와 메타 필드(`tocStyle` / `infoboxColumnPath`) 모두 준비됨. 이제 **기존 1626줄 두 렌더러를 단일 ColumnRenderer 호출로 갈아치우고** legacy `layout` string을 제거한다.

**진실의 원천**: `docs/BRAINSTORM-2026-04-14-column-template-system.md` (특히 "2026-04-15 결정 추가" 섹션)

**Phase 2-1B 작업 내용** (~1주, 1 PR):

1. **wiki-article-renderer 통합 컴포넌트 신규** (`components/wiki-editor/wiki-article-renderer.tsx`)
   - `WikiThemeProvider` 래핑 (themeColor cascade scope)
   - `WikiTitle` 사용 (기존 hand-rolled title 영역 교체)
   - `ColumnRenderer` 호출 (재귀 layout 렌더)
   - `renderBlock(blockId)` 콜백 — 기존 블록 렌더 로직 그대로 위임
   - `metaSlots` — TOC + 인포박스를 columnPath 위치에 주입
   - 편집 모드 / 읽기 모드 분기 (기존 두 렌더러 동작 유지)

2. **4 호출 지점 마이그레이션**
   - `components/views/wiki-view.tsx` (메인 wiki 뷰)
   - `components/workspace/secondary-panel-content.tsx` (split view)
   - `components/editor/nodes/wiki-embed-node.tsx` (위키 임베드)
   - `components/editor/note-hover-preview.tsx` (호버 프리뷰)

3. **기존 렌더러 삭제**
   - `components/wiki-editor/wiki-article-view.tsx` (1220줄 삭제)
   - `components/wiki-editor/wiki-article-encyclopedia.tsx` (406줄 삭제)
   - 공유 유틸 (`wiki-block-utils.ts`)은 그대로 — wiki-article-renderer가 활용

4. **Migration v77 + layout string 제거**
   - `WikiArticle.layout: WikiLayout` 필드 deprecated → 삭제
   - `columnLayout` → `layout`으로 rename (BRAINSTORM 원안)
   - `tocStyle` 기본값 backfill (encyclopedia → `{ show: true, position: [1] }`, 그 외 → `{ show: true, position: [0], collapsed: true }`)
   - `infoboxColumnPath` 기본값 backfill (encyclopedia → `[1]`, 그 외 → `[0]`)
   - `SEED_WIKI_ARTICLES` factory도 동일 derive
   - Store version 76 → 77

5. **WikiLayoutToggle 처리**
   - Phase 2-1B에선 임시 숨김 (`return null`) 또는 컴포넌트 deletion
   - Phase 2-2에서 1컬럼/2컬럼 프리셋 토글로 교체 예정

**Phase 2-1B 완료 시 동작**:
- 위키 article가 ColumnRenderer 기반으로 렌더 (1컬럼/2컬럼 정확 동작)
- TOC/인포박스가 메타 필드 위치에 자동 배치
- themeColor가 article 전체에 cascade (다크모드 자동 전환)
- 기존 코드 1626줄 → ~400줄 (압축 + 통합)

**참고 파일** (이미 있는 인프라):
- `BRAINSTORM-2026-04-14-column-template-system.md` ("2026-04-15 결정 추가" 섹션 필수)
- `components/wiki-editor/column-renderer.tsx` (Phase 2-1A — ColumnRenderer + pathKey/parsePathKey 헬퍼)
- `components/wiki-editor/wiki-title.tsx` (Phase 2-1A — title + titleStyle)
- `components/wiki-editor/wiki-theme-provider.tsx` (Phase 2-1A — themeColor cascade)
- `components/wiki-editor/wiki-article-view.tsx` (현재 Default — 삭제 대상)
- `components/wiki-editor/wiki-article-encyclopedia.tsx` (현재 Encyclopedia — 삭제 대상)
- `components/wiki-editor/wiki-block-renderer.tsx` (블록 렌더 위임 대상)
- `components/wiki-editor/wiki-block-utils.ts` (sectionNumbers, visibleBlocks)

---

## 🧠 멘탈 상태 (잊지 말 것)

- **Store v76** — Phase 2-1B-3에서 v77로 bump 예정 (layout rename + tocStyle/infoboxColumnPath 기본값 backfill)
- **엔티티 통합 영구 폐기** — Note/Wiki 2-entity 유지
- **렌더러는 위키 전용** — 노트엔 layout 개념 없음
- **Title 블록화 X** — `article.title + titleStyle`로 최상단 고정 (WikiTitle 컴포넌트 있음)
- **Column Heading 블록 X** — Section(H2)로 충분
- **`layout` string 필드 유지 중** — Phase 2-1B-3에서 렌더러 교체 완료 후 제거
- **노트 split must-todo** — Phase 7
- **Phase 2-1B-1까지 완료**: WikiArticleRenderer (read-only) + note-hover-preview/wiki-embed-node 마이그레이션
- **2026-04-15 사용자 결정**: A 모델 + 메타 필드 별도 + Phase 단계 분리 (BRAINSTORM 문서 "2026-04-15 결정 추가" 절)
- **현재 사용 중**: WikiArticleRenderer는 read-only로 호버 프리뷰 + wiki embed에서 사용. 편집 모드는 여전히 WikiArticleView/Encyclopedia 사용 중

## ⚠️ Phase 2-1B 구현 전 주의사항

- **인프라는 다 만들어져 있음** — `ColumnRenderer`, `WikiTitle`, `WikiThemeProvider`, `pathKey`/`parsePathKey` 헬퍼 활용
- 기존 wiki-article-view.tsx + wiki-article-encyclopedia.tsx의 **분기 로직 (편집/읽기 모드, contentAlign, 인포박스 float-right 등)을 통합 컴포넌트가 모두 흡수**해야 함 — 경계 케이스 주의
- `metaSlots` 주입 위치 = `tocStyle.position` + `infoboxColumnPath`. 기본값은 migration v77에서 backfill
- WikiLayoutToggle 호출 2 군데 (`wiki-view.tsx`, `secondary-panel-content.tsx`) — Phase 2-1B에선 hide
- 4 호출 지점 (`wiki-view`, `secondary-panel-content`, `wiki-embed-node`, `note-hover-preview`)에서 lazy import 사용 중인 곳 있음 → import path 갈아치우기

## 🚧 보류 (나중에)

- Library FilterPanel — P1
- 노트 전체 접기/펼치기 버튼 — P3
- 인사이트 중앙 허브 — P2
- Phase 2-2 (컬럼 비율 드래그 + 추가/삭제) — Phase 2-1B 후
- Phase 3 (노션식 블록 분기) — 마지막
- Phase 4+ (커스텀 템플릿 편집기 / 나무위키 잔여 / 편집 히스토리 / 노트 split)
