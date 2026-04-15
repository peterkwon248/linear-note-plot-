# 🎯 Next Action

> **이 파일은 before-work가 가장 먼저 읽고, after-work가 마지막에 갱신한다.**
> 다음 세션 시작 시 "지금 바로 뭐 해야 하지?"의 답.
> 항상 1~3개의 immediate next action만. 큰 그림은 docs/MEMORY.md.

---

**Last Updated**: 2026-04-15 밤 (Phase 2-2-B-3-a 완료 + 사용자와 메타 필드 아키텍처 재논의 → **🅑 메타 → 블록 통합 확정**. Phase 2-2-C 신규 추가)

## 🎯 다음 세션 시작하면 바로 할 것

### 선택 1 (권장): Phase 2-2-B-3-b — 빈 컬럼 AddBlock + 중첩 컬럼

**배경**: Phase 2-2-B-3-a까지 최상위 컬럼 추가/삭제 가능. 중첩 컬럼 생성 UI + 빈 컬럼 직접 블록 추가 UX 추가. **Infobox Hide/Show UI는 Phase 2-2-C에서 블록 통합으로 해결되므로 여기선 안 함**.

**작업 내용**:

1. **빈 컬럼 AddBlockButton** (2026-04-15 사용자 피드백)
   - `LeafDroppableCell`의 "Empty column — drop a block here" placeholder를 **AddBlockButton으로 교체** (편집 모드)
   - 또는 placeholder 옆에 `+` 버튼 추가
   - 클릭 시: 해당 컬럼에 새 블록 생성 + `columnAssignments = targetPath` 자동 설정
   - 새 액션 또는 기존 `addWikiBlock` + `moveBlockToColumn` 연속 호출

2. **중첩 컬럼 생성 UI (Split column)**
   - 편집 모드 + 컬럼 헤더 ⋯ 메뉴 or 빈 컬럼에 "Split into 2/3 cols" 버튼
   - `splitLeafIntoColumns(articleId, path, count)` 액션 — leaf를 N-col ColumnStructure로 변환
   - 3 depth 제한 (basePath.length >= 3 시 disable + 툴팁 "Max nesting reached")

3. **중첩 컬럼 UI 확장**
   - 현재 최상위 PanelGroup path만 + 버튼 / X 버튼
   - 중첩 ColumnNode (CSS Grid path)에도 같은 UI 노출
   - props (`onAddColumnAfter`, `onRemoveColumn`)는 이미 재귀 전달 중

**참고 파일**:
- `components/wiki-editor/column-renderer.tsx` — LeafDroppableCell, ColumnNode 재귀 구조 이미 있음
- `lib/store/slices/wiki-articles.ts` — `insertColumnAtPath`, `removeColumnAtPath`는 이미 재귀 지원
- Phase 2-2-B-2의 `moveBlockToColumn` + `syncLayoutFromAssignments` 패턴 활용

---

### 선택 2 (큰 작업): Phase 2-2-C 신규 — 메타 → 블록 통합

**배경**: 2026-04-15 사용자 결정 — "컬럼 + 메타 필드 + 블록 = 커스텀 위키 템플릿" 자유도를 최대로. 메타 필드를 블록 시스템에 통합해 Infobox/TOC/Hatnote/Navbox/Callout 등이 **블록처럼 드래그/추가/삭제** 가능하게.

**핵심 결정**:
- `🅐 Primary 1개 / Secondary 복수` 폐기
- **🅑 모든 메타 = 블록** 으로 확정 (데이터 모델 단순화 + UX 일관성)
- `WikiBlockType`에 `"infobox"`, `"toc"` 추가 (Phase 5에서 `"hatnote"`, `"navbox"`, `"callout"` 추가 예정)

**작업 내용** (~1-2주, 큰 PR):

1. **WikiBlockType 확장**
   - `"infobox"` block type: attrs `{ fields: WikiInfoboxEntry[], headerColor?, hidden? }`
   - `"toc"` block type: attrs `{ collapsed?, hiddenLevels? }` (내용은 article 섹션에서 자동 derive)

2. **Migration v78**
   - 기존 `article.infobox[]` → 새 infobox 블록으로 변환 (기존 `infoboxColumnPath` 기반 배치)
   - `article.tocStyle.show === true` → 새 toc 블록 생성 (`tocStyle.position` 기반 배치)
   - `article.infoboxHeaderColor`, `article.infoboxColumnPath`, `article.tocStyle` 필드 **삭제**
   - Store version 77 → 78

3. **WikiBlockRenderer 확장**
   - `case "infobox"`: 기존 WikiInfobox 컴포넌트 재사용 (블록 wrapper 안에)
   - `case "toc"`: 기존 CollapsibleTOC 컴포넌트 재사용
   - Drag/resize/delete 기존 블록 시스템 자동 적용

4. **AddBlockButton 메뉴 확장**
   - Section / Text / Image / URL / Table + **Infobox** + **TOC**
   - 메뉴에 icon + 설명 추가 ("Key-value metadata" / "Auto-generated contents")

5. **ColumnMetaPositionMenu 폐기**
   - TOC show/hide → 블록 삭제/추가로
   - TOC position → 블록 드래그로
   - Infobox column → 블록 드래그로
   - `ColumnMetaPositionMenu` 컴포넌트 삭제, 헤더에서 제거
   - `setTocStyle`, `setInfoboxColumnPath` 액션 deprecated → 삭제

6. **types.ts 정리**
   - `WikiArticle.infobox`, `infoboxHeaderColor`, `infoboxColumnPath`, `tocStyle` 삭제
   - `WikiTocStyle` 타입 삭제
   - `WikiTemplate.infobox` 재설계 (templateSections에 infobox/toc 블록 entry로)

**Phase 2-2-C 완료 시**:
- 모든 메타가 블록 → 드래그/컬럼 이동/추가/삭제 UX 완전 일관
- 여러 infobox 배치 가능 (Personal + Career 같은 분리)
- 복수 TOC 가능 (상위/하위)
- 데이터 모델 단순화
- Phase 5 준비 완료 (Hatnote/Navbox/Callout 블록 추가만 하면 됨)

---

## 🧠 멘탈 상태 (잊지 말 것)

- **Store v77** — `WikiArticle.layout`은 ColumnStructure
- **Phase 2-2-A 완료**: ColumnPresetToggle (1·2·3 컬럼 빠른 전환)
- **Phase 2-2-B-1 완료**: 컬럼 비율 드래그 (react-resizable-panels, 최상위 horizontal만) + ColumnMetaPositionMenu (**Phase 2-2-C에서 삭제 예정**)
- **Phase 2-2-B-2 완료**: 블록 컬럼 간 드래그 (moveBlockToColumn + syncLayoutFromAssignments + LeafDroppableCell)
- **Phase 2-2-B-3-a 완료**: 컬럼 추가/삭제 버튼 (최상위만, 중첩은 2-2-B-3-b)
- **2026-04-15 밤 대결정**: 메타 필드 → 블록 통합 (🅑). Phase 2-2-C 신규
- **자유도 최대 방향** — Plot은 "위키 + 노션 하이브리드" 지향. 블록 시스템으로 모든 것 통합
- **Phase 순서 조정**:
  - 2-2-B-3-b (다음) = 빈 컬럼 AddBlock + 중첩 (Infobox Hide/Show는 여기서 안 함 — 2-2-C에서 자연 해결)
  - 2-2-C = 메타 → 블록 통합 (큰 리팩토링)
  - 3 = 노션식 블록 분기
  - 4 = 커스텀 템플릿 편집기
  - 5 = 나무위키 잔여 (Hatnote/Navbox/Callout 전부 블록으로)
  - 마지막 = built-in 템플릿 풍성화

## ⚠️ Phase 2-2-C 구현 주의사항

- Migration v78은 큰 작업 (기존 메타 필드 → 블록 변환). 철저한 테스트 필요
- 기존 `WikiInfobox` / `CollapsibleTOC` 컴포넌트는 **재사용** (블록 wrapper 안에서 렌더)
- `ColumnMetaPositionMenu` 삭제 = 헤더 List 아이콘 제거. 사용자가 블록 시스템으로 자연스레 이동
- `setTocStyle` / `setInfoboxColumnPath` 액션 deprecated — 호출처 없음 확인 (현재 ColumnMetaPositionMenu만 사용)
- 기존 article 데이터 손실 위험 — migration 테스트 + seed factory도 블록 기반으로 전환

## 🚧 보류 (나중에)

- Library FilterPanel — P1
- 노트 전체 접기/펼치기 버튼 — P3
- 인사이트 중앙 허브 — P2
- Phase 2-2-B-3-b (빈 컬럼 AddBlock + 중첩 컬럼) — 사용자 선택
- Phase 2-2-C (메타 → 블록 통합) — 큰 리팩토링, 신선한 컨텍스트에서
- Phase 3 (노션식 블록 분기) — 2-2-C 후
- Phase 4 (커스텀 템플릿 편집기)
- Phase 5 (나무위키 잔여 — 모든 블록으로)
- 마지막: built-in 템플릿 풍성화

---

## (legacy plan, kept for reference)

### Phase 2-2-B-3-b 시작 — 중첩 컬럼 생성 UI

**배경**: Phase 2-2-B-3-a 완료. 컬럼 추가/삭제/드래그/블록 이동 모두 가능. 이제 **컬럼 안에 컬럼 넣기** (중첩 3 depth).

**Phase 2-2-B-3-b 작업 내용**:

1. **Split column UI**
   - 편집 모드 + 컬럼 헤더 ⋯ 메뉴 → "Split into columns" 옵션
   - 또는 빈 컬럼 placeholder 안 "Split this into 2/3 cols" 버튼
   - 해당 leaf를 ColumnStructure로 전환 (기존 blockIds는 nested 첫 leaf로)

2. **중첩 depth 제한 (3 depth)**
   - 현재 depth 계산 (basePath.length로 derive)
   - depth 3 이상에서 Split 버튼 disable + 툴팁 "Max nesting reached"

3. **중첩 컬럼 UI 노출 결정**
   - 현재 최상위 PanelGroup만 드래그 핸들 + 추가/삭제 버튼
   - 중첩도 확장 검토 (복잡도 vs 가치)
   - 또는 단순 CSS Grid + 버튼만으로

4. **액션 필요**:
   - `splitLeafIntoColumns(articleId, path, count)` — leaf를 N-col ColumnStructure로 변환
   - 또는 `addColumnAfter`를 nested에도 적용 (이미 재귀 지원, UI만 추가)

**참고 파일**:
- `BRAINSTORM-2026-04-14-column-template-system.md`
- `components/wiki-editor/column-renderer.tsx` — 재귀 구조 이미 있음
- `lib/store/slices/wiki-articles.ts` — insertColumnAtPath/removeColumnAtPath 이미 재귀 지원

---

## (legacy plan, kept for reference)

### Phase 2-2-B-3 시작 — 컬럼 추가/삭제 + 중첩 컬럼

**배경**: Phase 2-2-B-2 완료. 블록을 컬럼 간 자유 드래그 가능. 이제 **컬럼 구조 자체를 편집** (추가/삭제/중첩).

**Phase 2-2-B-3 작업 내용**:

1. **컬럼 추가** (`addColumn` 액션)
   - 편집 모드: 컬럼 사이/끝에 얇은 `+` 버튼 (ColumnRenderer 레벨)
   - 새 컬럼은 empty blockIds로 시작 (사용자 드래그로 채움)
   - 최대 6개 (buildColumnPreset의 safeCount clamp 따름)

2. **컬럼 삭제** (`removeColumn` 액션)
   - 컬럼 헤더 ⋯ 메뉴 or hover 시 X 버튼
   - 삭제된 컬럼의 blocks는 main([0])으로 자동 이동
   - 최소 1개 컬럼 유지 (마지막 컬럼 삭제 disable)

3. **중첩 컬럼 생성/관리**
   - 컬럼 cell 안에 "Split column" 메뉴 → leaf가 ColumnStructure로 전환
   - 3 depth 제한 (depth 3 이상 추가 버튼 disable + 툴팁)
   - 기존 ColumnRenderer는 이미 재귀 지원 (PanelGroup은 최상위만, 중첩은 CSS Grid)

4. **중첩 컬럼 드래그 (optional)**
   - 현재 최상위만 PanelGroup. 중첩도 드래그 가능하게 확장 검토
   - 또는 Phase 2-2-B-4로 분리

**참고 파일**:
- `BRAINSTORM-2026-04-14-column-template-system.md`
- `components/wiki-editor/column-renderer.tsx` (추가/삭제 UI는 여기에)
- `lib/store/slices/wiki-articles.ts` (buildColumnPreset, syncLayoutFromAssignments 기존)
- Phase 2-2-B-2에서 이미 검증된 `moveBlockToColumn` 패턴 참고

---

## (legacy plan, kept for reference)

### Phase 2-2-B-2 시작 — 블록 컬럼 간 드래그 + 컬럼 추가/삭제

**배경**: Phase 2-2-B-1 완료. 컬럼 비율 드래그 + TOC/Infobox 위치 자유 조정 동작. 이제 **블록을 컬럼 간 드래그로 이동 가능**하게 만들면 2col/3col의 실질 차이(빈 컬럼 활용)가 의미 생김.

**Phase 2-2-B-2 작업 내용** (~1주, 1 PR):

1. **블록을 컬럼 간 드래그 이동**
   - 기존 DnD를 컬럼 cell에 droppable로 확장
   - SortableBlockItem을 다른 컬럼 cell로 드래그 가능
   - 드래그 종료 시 `columnAssignments` 업데이트 + ColumnBlocksLeaf.blockIds 동기화
   - 크로스-article drag와 column-move 구분 (droppable id prefix 활용)

2. **컬럼 추가/삭제 버튼**
   - 편집 모드 + 컬럼 사이/끝에 `+` 버튼
   - 컬럼 헤더 ⋯ 메뉴 (Delete column / Merge with neighbor)
   - 삭제 시 그 컬럼의 blocks는 main([0])으로 이동
   - 최소 1개 컬럼 유지 (삭제 시 disable)

### Phase 2-2-B-3 (마지막)
- 중첩 컬럼 (3 depth 제한 + enforcement, 재귀 UX)
- 중첩 컬럼의 비율 드래그 (현재 상위 컬럼만 PanelGroup, 중첩은 CSS Grid)

**참고 파일**:
- `BRAINSTORM-2026-04-14-column-template-system.md`
- `components/wiki-editor/column-renderer.tsx` (PanelGroup 통합 완료)
- `components/wiki-editor/wiki-article-renderer.tsx` (DnD 컨텍스트 이미 있음)
- `components/wiki-editor/sortable-block-item.tsx` (SortableBlockItem)
- `lib/store/slices/wiki-articles.ts` (`moveBlockToColumn` 액션 신규 필요)

---

## (legacy plan, kept for reference)

### Phase 2-2-B 시작 — 컬럼 비율 드래그 + 추가/삭제 + 중첩

**배경**: Phase 2-2-A 완료. 사용자가 1·2·3 컬럼 빠른 전환 가능. 이제 더 자유로운 편집 UX (커스텀 비율, 임의 컬럼 추가/삭제, 중첩) 추가.

**Phase 2-2-B 작업 내용** (~1주, 1 PR):

1. **컬럼 비율 드래그 조절**
   - ColumnRenderer에 컬럼 경계 핸들 추가 (편집 모드만)
   - 드래그로 ratio 변경 → article.layout 업데이트
   - react-resizable-panels 활용 또는 직접 구현 (단순 가능)

2. **컬럼 추가/삭제 버튼**
   - 컬럼 사이/끝에 + 버튼 (편집 모드)
   - 컬럼 헤더 ⋯ 메뉴 (Delete column / Split column / Merge with neighbor)
   - 빈 컬럼 삭제 시 confirm

3. **중첩 컬럼 (3 depth 제한)**
   - 컬럼 안에 다시 컬럼 만들기 (행 → 열)
   - 4 depth 시 추가 버튼 disable + 툴팁 안내
   - ColumnRenderer는 이미 재귀 지원

4. **블록을 컬럼 간 드래그 이동**
   - 기존 DnD를 컬럼 cell 자체에 droppable로 확장
   - 드래그 종료 시 columnAssignments 업데이트 + ColumnBlocksLeaf.blockIds 동기화

5. **TocStyle / InfoboxColumnPath UI**
   - SidePanel 또는 article 헤더에 메타 위치 변경 메뉴
   - "TOC: [컬럼 1 ▼]" 식 드롭다운

**Phase 2-2-B 완료 시 동작**:
- 사용자가 컬럼 구조 완전 자유 편집 (비율/추가/삭제/중첩)
- 메타 콘텐츠 (TOC/인포박스) 위치도 자유 지정
- 노션식 자유 분기는 Phase 3로

### Phase 2-2-A 완료 시 사용자가 할 수 있는 것 (지금)
- 헤더의 1col / 2col / 3col 칩 클릭 → 즉시 컬럼 구조 변경
- 1col → 2col 전환 시 모든 블록은 main 컬럼, sidebar는 비어있음 (Phase 2-2-B에서 블록 드래그로 이동 가능)
- 같은 프리셋 클릭 = no-op (드래그 조정한 비율 보존, Phase 2-2-B 대비)

**참고 파일**:
- `BRAINSTORM-2026-04-14-column-template-system.md`
- `components/wiki-editor/column-renderer.tsx` (재귀 ColumnStructure 렌더러)
- `components/wiki-editor/column-preset-toggle.tsx` (Phase 2-2-A — 토글)
- `lib/store/slices/wiki-articles.ts` (`buildColumnPreset`, `applyColumnPreset` 헬퍼)
- `lib/types.ts` (`ColumnStructure`, `ColumnDefinition`, `ColumnPath`)

---

## (legacy plan, kept for reference)

### Phase 2-2 시작 — 컬럼 편집 UX (드래그/추가/삭제) + 1·2·N 컬럼 프리셋 토글

**배경**: Phase 2-1B (전체) 완료. 위키 렌더러 시스템 통합 끝났고 layout 타입 시스템 정리 끝. 이제 **사용자가 컬럼 구조를 직접 편집할 수 있는 UX**를 추가할 차례.

**진실의 원천**: `docs/BRAINSTORM-2026-04-14-column-template-system.md` (Phase 2-2 절)

**Phase 2-2 작업 내용** (~1주, 1 PR):

1. **컬럼 비율 드래그 조절** — `react-resizable-panels` 활용. 컬럼 경계를 드래그해서 ratio 변경
2. **컬럼 추가/삭제 버튼** — 컬럼 사이/끝에 + 버튼, 컬럼 헤더에 ⋯ 메뉴 (Delete/Split)
3. **중첩 컬럼 (3 depth 제한)** + enforcement (4 depth 시 disable + 경고)
4. **블록을 컬럼 간 드래그 이동** — DnD에 컬럼 cell 자체를 droppable로
5. **1·2·N 컬럼 프리셋 빠른 전환 토글** — 헤더에 칩 메뉴 (1col / 2col / 3col 등). WikiLayoutToggle 자리 차지
6. **TocStyle/InfoboxColumnPath UI** — 사용자가 위치 변경 가능 (메뉴 또는 사이드바 setting)

**Phase 2-2 완료 시 동작**:
- 사용자가 컬럼 구조 자유 편집 (Phase 2-1B는 렌더만, 편집 못 함)
- 노션식 자유 분기는 Phase 3으로

### 또는 ⚠️ 사용자 검토 필요 — built-in 템플릿 풍성화

사용자 피드백 (2026-04-15 저녁): "위키 템플릿 < 기대보다 허접". 정상 — 지금 8 built-in 템플릿은 매우 단순 (sections + infobox key-value 슬롯만, themeColor는 단순 RGBA, heroImage/Hatnote/Banner 없음). **Phase 2-2 진입 전 사용자가 "템플릿 풍부하게 먼저"를 원한다면**:

- Person 템플릿: 헤더 배너 (인물 사진 + 부제목), 인포박스 항목 늘리기 (생일/사망/직업/국적/소속/배우자/자녀)
- Encyclopedia 템플릿: heroImage + 캡션 자동 영역, Hatnote 자동 추가
- 모든 템플릿: 섹션별 icon (📖 📜 🎨), themeColor 강화 (gradient 옵션, alpha 등)
- 더 다양한 themeColor 프리셋

**`lib/wiki-templates/built-in.ts` 한 파일만 손보면 됨.** 사용자 피드백 받고 결정.

**참고 파일** (Phase 2-2):
- `BRAINSTORM-2026-04-14-column-template-system.md`
- `components/wiki-editor/column-renderer.tsx` (재귀 렌더러 — 드래그 핸들 추가)
- `components/wiki-editor/wiki-article-renderer.tsx` (통합 렌더러)
- `lib/types.ts` (`ColumnStructure` / `ColumnDefinition`)
- `lib/store/slices/wiki-articles.ts` (updateWikiArticle 활용)

---

## (legacy plan, kept for reference)

### Phase 2-1B-3 시작 — Cleanup (기존 렌더러 삭제 + layout string 제거 + migration v77)

**배경**: Phase 2-1B-2 완료. 4 호출 지점 모두 WikiArticleRenderer 사용 중 (wiki-view, secondary-panel-content, wiki-embed-node, note-hover-preview). 기존 wiki-article-view.tsx + wiki-article-encyclopedia.tsx는 dead code. 이제 제거 + layout 타입 시스템 최종 정리.

**진실의 원천**: `docs/BRAINSTORM-2026-04-14-column-template-system.md`

**Phase 2-1B-3 작업 내용** (~3-4일, 1 PR):

1. **기존 렌더러 삭제**
   - `components/wiki-editor/wiki-article-view.tsx` 삭제 (1220줄)
   - `components/wiki-editor/wiki-article-encyclopedia.tsx` 삭제 (406줄)
   - `InlineCategoryTags` 별도 파일로 분리 (`components/wiki-editor/inline-category-tags.tsx`)
   - WikiArticleRenderer import 업데이트 (`./inline-category-tags` 로)

2. **WikiLayoutToggle 삭제**
   - `components/wiki-editor/wiki-layout-toggle.tsx` 삭제 (36줄)
   - 이미 2 사용처에서 hide/remove 됨

3. **layout string 제거 + columnLayout → layout rename**
   - `WikiArticle.layout: WikiLayout` 필드 삭제 (lib/types.ts)
   - `WikiLayout` 타입 삭제
   - `WikiArticle.columnLayout` → `WikiArticle.layout`으로 rename
   - `columnAssignments` 그대로 유지

4. **Migration v77**
   - 기존 `columnLayout` → `layout` rename
   - 기존 `layout: "encyclopedia"` → 삭제 (columnLayout이 이미 2컬럼 구조)
   - `tocStyle` 기본값 backfill (2컬럼 → `{ show: true, position: [1] }`, 1컬럼 → `{ show: true, position: [0], collapsed: true }`)
   - `infoboxColumnPath` 기본값 backfill (2컬럼 → `[1]`, 1컬럼 → `[0]`)
   - Store version 76 → 77
   - SEED_WIKI_ARTICLES factory도 동일 derive

5. **기타 `.layout` 사용처 정리**
   - `components/views/ontology-view.tsx` (그래프 노드에 layout 표시한다면 layout.columns.length 사용)
   - `components/side-panel/wiki-article-detail-panel.tsx` (Detail 패널의 layout 표시)
   - 기타 기존 layout string 참조 찾아서 갱신

**Phase 2-1B-3 완료 시**:
- 위키 렌더러 통합 완전 (기존 1626줄 → WikiArticleRenderer ~700줄로 3-4x 압축)
- 컬럼 기반 단일 layout 시스템 (WikiLayout string 폐기)
- 데이터 모델 최종 정리 (Phase 2-2 준비 완료)

### Phase 2-2 (Phase 2-1B-3 후) — 컬럼 편집 UX

- 컬럼 경계 드래그로 비율 조절 (react-resizable-panels)
- 컬럼 추가/삭제 버튼
- 중첩 컬럼 (3 depth 제한 + enforcement)
- 블록을 컬럼 간 드래그 이동
- 1컬럼/2컬럼/N컬럼 프리셋 빠른 전환 토글 (WikiLayoutToggle 대체)

**참고 파일**:
- `BRAINSTORM-2026-04-14-column-template-system.md`
- `components/wiki-editor/wiki-article-renderer.tsx` (통합 렌더러, Phase 2-1B-2 완료)
- `components/wiki-editor/column-renderer.tsx` (재귀 컬럼 렌더러, Phase 2-1A)
- `lib/store/migrate.ts` (v77 migration 추가 위치)
- `lib/store/seeds.ts` (SEED_WIKI_ARTICLES factory)

---

## (legacy plan, kept for reference)

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

- **Store v77** — `WikiArticle.layout`은 ColumnStructure
- **Phase 2-2-A 완료**: ColumnPresetToggle (1·2·3 컬럼 빠른 전환)
- **Phase 2-2-B-1 완료**: 컬럼 비율 드래그 (react-resizable-panels, 최상위 horizontal만) + ColumnMetaPositionMenu (List 아이콘 헤더 버튼 → TOC/Infobox 위치 팝오버). 3 액션: `updateColumnRatios`, `setTocStyle`, `setInfoboxColumnPath`
- **Phase 2-2-B-2 완료**: 블록 컬럼 간 드래그. `moveBlockToColumn` 액션 + `syncLayoutFromAssignments` 헬퍼 (columnAssignments → ColumnBlocksLeaf.blockIds 동기화, blocks[] 순서 유지). ColumnCell 편집 모드 = `LeafDroppableCell` (drop id `column-<pathKey>`, 빈 컬럼 placeholder "Empty column — drop a block here", isOver 시각)
- **중첩 컬럼은 여전히 CSS Grid** — Phase 2-2-B-3에서 UI로 생성 가능
- **PanelGroup onLayout은 percentage(0-100 sum) 반환** — 그대로 newRatios로 사용
- **엔티티 통합 영구 폐기** — Note/Wiki 2-entity 유지
- **렌더러는 위키 전용** — 노트엔 layout 개념 없음 (단일 TipTap JSON)
- **Title 블록화 X** — `article.title + titleStyle`로 최상단 고정
- **Column Heading 블록 X** — Section(H2)로 충분
- **노트 split must-todo** — Phase 7
- **Phase 2-1B 전체 완료**: 위키 렌더러 통합 끝. 4 호출 지점 (wiki-view / secondary-panel-content / wiki-embed-node / note-hover-preview) 모두 WikiArticleRenderer 사용. 기존 wiki-article-view (1220줄) + wiki-article-encyclopedia (406줄) + wiki-layout-toggle 삭제됨
- **InlineCategoryTags** — 이제 `components/wiki-editor/inline-category-tags.tsx` 별도 파일
- **Virtuoso 가상화 제거** — >50 blocks read mode 성능 저하 가능. 필요 시 Phase 2-2+에서 재도입
- **사용자 피드백 (2026-04-15 저녁)**: built-in 템플릿이 허접하다는 평가. Phase 2-2 진입 전 풍성화 옵션 (`lib/wiki-templates/built-in.ts` 손보기) 검토
- **2026-04-15 사용자 결정**: A 모델 + 메타 필드 별도 + Phase 단계 분리 (BRAINSTORM 문서 "2026-04-15 결정 추가" 절)

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
