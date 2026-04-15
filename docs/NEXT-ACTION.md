# 🎯 Next Action

> **이 파일은 before-work가 가장 먼저 읽고, after-work가 마지막에 갱신한다.**
> 다음 세션 시작 시 "지금 바로 뭐 해야 하지?"의 답.
> 항상 1~3개의 immediate next action만. 큰 그림은 docs/MEMORY.md.

---

**Last Updated**: 2026-04-15 저녁 (Phase 2-2-B-3-b + 2-2-C 구현 완료 + Phase 3 브레인스토밍 완료. PR 제출 후 Phase 3 fresh context에서 시작 예정)

## 🎯 다음 세션 시작하면 바로 할 것

### Phase 3 — Multi-pane Document Model

**배경 필수 읽기**: `docs/BRAINSTORM-2026-04-15-multi-pane-document-model.md`

**한 줄 요약**: `WikiArticle.blocks` flat pool + `columnAssignments` view projection 모델을 폐기하고, 각 컬럼이 자체 `blocks[]`를 보유하는 **per-column** 모델로 전환. 사용자 비전 = "잡지식 독립 공간".

**왜 지금**: Phase 2-2-C 테스트에서 3컬럼 UX 한계 확인:
- 섹션 넘버링이 전역이라 컬럼 간 뒤섞임 ("1. Definition" 다음 "5. Untitled Section")
- 빈 컬럼 UX가 AddBlock + Drop + Split 3개 요소 경쟁
- 컬럼이 독립 공간이 아니라 view projection일 뿐

**Phase 3 범위 (이번 PR 하나)**:

1. **데이터 모델 전환**
   - `ColumnBlocksLeaf.blocks: WikiBlock[]` (canonical)
   - `WikiArticle.blocks[]` 제거 or derived getter로만 남기기
   - `WikiArticle.columnAssignments` 제거
   - `ColumnDefinition.name?`, `themeColor?`, `minHeight?` 추가

2. **Migration v80**
   - 기존 `blocks[]` + `columnAssignments` → 각 leaf pane의 `blocks[]`로 분배
   - per-article try/catch 필수 (실패 시 legacy 유지)
   - Store version 79 → 80

3. **Store actions 재작성**
   - `addWikiBlock` → `addBlockToPane(articleId, path, block)` (path 필수)
   - `removeWikiBlock`, `updateWikiBlock` — 모든 pane traverse해서 blockId 찾기
   - `moveBlockToColumn` → `moveBlockBetweenPanes(articleId, blockId, sourcePath, targetPath)`
   - `setColumnName`, `setColumnThemeColor` 신규
   - `splitLeafIntoColumns` 존재함 — 재점검 (per-column 모델에 맞춰)
   - 폐기: `moveBlockToColumn` (현재 이름), `syncLayoutFromAssignments`, `remapAssignmentsAfterRemoval` 등 columnAssignments 관련 헬퍼

4. **Renderer 개편**
   - 섹션 넘버링 = pane별 독립 (`computeSectionNumbers(leaf.blocks)` per leaf)
   - 각 leaf 내부에 자체 sectionIndex 계산
   - 컬럼 배경색 + 세로선 렌더 (`themeColor` 활용)
   - 컬럼 name 헤더 (hover or always?)

5. **컬럼 메뉴 ⋯**
   - Split horizontally / Split vertically
   - Set name (inline edit)
   - Set color (8 preset + custom)
   - Delete column

6. **빈 컬럼 UX 정리**
   - AddBlock 버튼만 (Split 버튼 제거 — 컬럼 메뉴로 이동)
   - placeholder "Empty column" 텍스트 완전 제거

7. **Vertical split 실사용**
   - 현재 `direction: "vertical"` 타입은 있지만 UI 미사용
   - 컬럼 메뉴 "Split V" 클릭 → leaf가 vertical ColumnStructure로 변환
   - 세로 경계 드래그 (react-resizable-panels vertical mode)
   - 기본 auto-height, 드래그하면 ratio 고정

8. **1↔N 전환 경고창**
   - `applyColumnPreset` — 2→1 전환 시 column[1]+에 내용 있으면 shadcn AlertDialog로 경고
   - "Column 2 contents will merge into column 1. Continue?"

9. **기타 유지**
   - 최상위 타이틀/서브타이틀/별칭 = 최상단 공유 레이어 (현재 `WikiTitle` 컴포넌트 유지)
   - 1 pane 모드 = 기존 나무위키 스타일 유지 (섹션 넘버링 활성화, 스크린샷 확인 필수)

### Phase 3.1 (후속 PR)

- Match heights (같은 행 컬럼 높이 일치, CSS align-items: stretch)
- 이미지 블록 `fitMode: "content" | "fill"`
- Explicit pane height (px/vh 지정 UI)

### 참고 파일 (Phase 3 구현 시)

- `lib/types.ts` — ColumnStructure/ColumnDefinition/ColumnBlocksLeaf 수정
- `lib/store/slices/wiki-articles.ts` — 대수술 (CRUD + merge/split/unmerge + instantiateTemplate)
- `lib/store/migrate.ts` — migration v80
- `lib/store/seeds.ts` — seed 재작성 (per-column blocks)
- `lib/wiki-utils.ts` — `isWikiStub` 재점검
- `lib/wiki-section-index.ts` — pane별 index 지원
- `lib/wiki-block-utils.ts` — `computeSectionNumbers` pane 단위 호출 가능
- `components/wiki-editor/column-renderer.tsx` — per-column blocks 렌더
- `components/wiki-editor/wiki-article-renderer.tsx` — renderer dispatch 수정
- `components/wiki-editor/wiki-block-renderer.tsx` — 각 pane에서 개별 호출
- `components/wiki-editor/wiki-column-menu.tsx` (신규) — Split H/V + Set name/color/Delete
- `hooks/use-wiki-block-actions.ts` — per-column action API

### 구현 순서 (Phase 3 내부 커밋 단위)

1. 타입 확장 (`ColumnBlocksLeaf.blocks?`, `ColumnDefinition.name?/themeColor?/minHeight?`) + helper 함수
2. Migration v80 + store version bump
3. Store actions per-column API로 재작성
4. `WikiArticleRenderer` / `ColumnRenderer` per-column 렌더 전환
5. 섹션 넘버링 pane별 독립
6. 컬럼 메뉴 ⋯ 컴포넌트 + 배선
7. 컬럼 배경색/세로선 시각 구분
8. Vertical split 실사용
9. 1↔N 전환 경고창
10. seed 재작성
11. TypeScript + preview 검증

---

## 🧠 멘탈 상태 (잊지 말 것)

- **Store v79** — migration v78 (scalar → 블록) + v79 (seed dedup) 적용됨
- **Phase 2-2-B-3-b 완료**: 빈 컬럼 AddBlock + Split 2/3 + nested CSS Grid +/X
- **Phase 2-2-C 완료**: Infobox/TOC 블록화, ColumnMetaPositionMenu 삭제, WikiArticle scalar 메타 필드 전부 삭제
- **Phase 3 설계 완료** (이 문서) — `BRAINSTORM-2026-04-15-multi-pane-document-model.md`가 진실의 원천
- **Phase 5 준비됨**: Phase 2-2-C 블록 인프라 덕분에 Hatnote/Navbox/Callout 추가가 쉬워짐 (block type만 추가)
- **Phase 3 완료 후 Phase 3.1 → 4 → 5 순**

## ⚠️ Phase 3 구현 주의사항

- **Migration v80이 가장 위험** — 기존 data 손상 방지 필수. per-article try/catch. 롤백 전략
- **IDB 저장 구조** — `plot-wiki-block-meta`가 article ID 기준이었음. layout을 직접 저장할지, 여전히 flat blocks[]로 저장할지 결정
- **16개 컴포넌트가 `article.blocks` 직접 참조** — derived getter (WikiArticle에 computed `blocks` property)로 호환 유지 권장. 전면 교체는 blast radius 큼
- **섹션 넘버링 pane 독립** — 기존 `computeSectionNumbers(article.blocks)` 호출을 `computeSectionNumbers(leaf.blocks)`로 변경하는 지점들 체크
- **1 pane 모드는 기존 동작 반드시 유지** — 레거시 사용자 regressive 방지
- **`WikiMergeSnapshot`, merge/split/unmerge** — blocks 구조 변경 시 snapshot 호환성 주의

## 🚧 보류 (나중에)

- Library FilterPanel — P1
- 노트 전체 접기/펼치기 버튼 — P3
- 인사이트 중앙 허브 — P2
- Phase 3.1 (잡지식 높이 고도화) — Phase 3 후
- Phase 4 (커스텀 템플릿 편집기) — Phase 3 후
- Phase 5 (나무위키 잔여 — 전부 블록) — Phase 3 후, block type만 추가
- Phase 6 (편집 히스토리)
- Phase 7 (노트 split)
- 마지막: built-in 템플릿 풍성화
