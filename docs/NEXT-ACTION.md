# 🎯 Next Action

> **이 파일은 before-work가 가장 먼저 읽고, after-work가 마지막에 갱신한다.**
> 다음 세션 시작 시 "지금 바로 뭐 해야 하지?"의 답.
> 항상 1~3개의 immediate next action만. 큰 그림은 docs/MEMORY.md.

---

**Last Updated**: 2026-04-15 오전 (Phase 1 완료 — WikiTemplate 데이터 모델 + 8 built-in 템플릿 + 템플릿 picker UI + setWikiInfobox 버그 수정)

## 🎯 다음 세션 시작하면 바로 할 것

### Phase 2-1 시작 — 컬럼 렌더러 + 메타 필드 (TOC/인포박스/Title)

**배경**: Phase 1 완료. 데이터 모델(ColumnStructure / WikiTemplate / templateId/columnLayout)과 picker UI 동작 확인됨. 2026-04-15 사용자 인터뷰로 디자인 방향 확정 — **A 모델 (블록 분기) + 메타 필드 별도 + 단계 분리**.

**진실의 원천**: `docs/BRAINSTORM-2026-04-14-column-template-system.md` (특히 "2026-04-15 결정 추가" 섹션)

**Phase 2 단계 분리 (한 PR에 다 박지 않음)**:
- **Phase 2-1 (다음 PR)** ← 여기부터 시작
- Phase 2-2: 컬럼 비율 드래그 + 추가/삭제
- Phase 3: 노션식 블록 분기 (마지막)

**Phase 2-1 작업 내용** (~1주, 1 PR):

1. **컬럼 렌더러 신규** (`components/wiki-editor/column-renderer.tsx`)
   - `ColumnStructure` 재귀 렌더 (CSS Grid 또는 Flex)
   - 각 leaf의 `blockIds` 순서대로 블록 렌더
   - 1컬럼/2컬럼 정확 동작 (드래그/추가/삭제는 Phase 2-2)
   - ratio/minWidth 기본 적용 (반응형 collapse는 Phase 2-2+)

2. **메타 필드 추가 — TOC/인포박스 위치 자유화**
   - `WikiArticle.tocStyle?: { show, position: ColumnPath, collapsed? }` 필드 추가
   - `WikiArticle.infoboxColumnPath?: ColumnPath` 필드 추가 (기본 `[1]` 사이드)
   - Migration v77: 기존 article 기본값 (encyclopedia → tocStyle/infoboxColumnPath 사이드, 그 외 → tocStyle off)
   - 렌더러가 ColumnRenderer 통해 해당 컬럼 위치에 자동 배치

3. **Title 영역 신규** (article 메타 + titleStyle)
   - `article.title + titleStyle` (alignment / size / showAliases / themeColorBg)
   - 컬럼 영역 **위에 고정** (나무위키 관습)
   - `WikiTitle` 컴포넌트로 분리

4. **themeColor CSS variable cascade**
   - `article.themeColor.light/dark` → CSS custom property `--wiki-theme-light`/`--wiki-theme-dark`
   - 섹션 themeColor가 article themeColor를 override (CSS scope)

5. **기존 렌더러 → ColumnRenderer 호출로 통합**
   - `wiki-article-view.tsx` (Default) + `wiki-article-encyclopedia.tsx` (Encyclopedia) → 단일 `wiki-article-renderer.tsx`로 통합
   - ColumnRenderer + WikiTitle + 메타 필드 위치 처리
   - 기존 약 ~300줄 중복 제거

6. **`layout: WikiLayout` 제거 (cleanup)**
   - 렌더러가 더 이상 안 읽으므로 `WikiArticle.layout` 필드 삭제
   - `columnLayout` → `layout`으로 rename (BRAINSTORM 원안)
   - WikiLayoutToggle 컴포넌트 — Phase 2-2에서 새 토글 (1컬럼/2컬럼 프리셋 빠른 전환)으로 교체 예정. Phase 2-1엔 잠시 숨김 또는 disable
   - migration v77 (필드 rename + 정리)

**Phase 2-1 완료 시 동작**:
- 위키백과 패턴 정확 표현 (1컬럼 본문 + 사이드 인포박스 + TOC 위치 자유)
- 사용자가 article 별로 TOC/인포박스 위치 변경 가능 (메타 필드 직접 수정 — Phase 4 편집 UI는 별도)
- 두 렌더러 통합으로 코드 일관성 ↑

**참고 파일**:
- `BRAINSTORM-2026-04-14-column-template-system.md` ("2026-04-15 결정 추가" 섹션 필수)
- `components/wiki-editor/wiki-article-view.tsx` (현재 Default 렌더러)
- `components/wiki-editor/wiki-article-encyclopedia.tsx` (현재 Encyclopedia 렌더러)
- `lib/store/slices/wiki-articles.ts` (`instantiateTemplate` + `populateColumnLayoutBlockIds` 헬퍼 — 렌더러도 동일 path 매핑 활용)
- `lib/wiki-templates/built-in.ts` (8 템플릿 layout 참고)
- `components/wiki-editor/wiki-block-utils.ts` (sectionNumbers, visibleBlocks 등 공유 유틸)

---

## 🧠 멘탈 상태 (잊지 말 것)

- **Store v76** — wikiTemplates slice 추가, WikiArticle.columnLayout/columnAssignments/titleStyle/themeColor/templateId optional 필드 추가됨
- **엔티티 통합 영구 폐기** — Note/Wiki 2-entity 유지
- **렌더러는 위키 전용** — 노트엔 layout 개념 없음
- **Title 블록화 X** — `article.title + titleStyle`로 최상단 고정
- **Column Heading 블록 X** — Section(H2)로 충분
- **`layout` string 필드 유지 중** — Phase 2에서 렌더러 교체 시 제거
- **노트 split must-todo** — Phase 7
- **Phase 1까지 완료**: 데이터 모델 + 8 템플릿 + picker UI + migration v76 + setWikiInfobox 버그 수정
- **2026-04-15 사용자 결정**: A 모델 + 메타 필드 별도 + Phase 단계 분리 (BRAINSTORM 문서 "2026-04-15 결정 추가" 절)

## ⚠️ Phase 2-1 구현 전 주의사항

- `columnLayout`은 이미 모든 article에 채워져 있음 (migration v76 + seed factory) — 렌더러는 그냥 읽어서 쓰면 됨
- `instantiateTemplate` (`wiki-articles.ts`) 헬퍼 — 컬럼 path별 blockIds 채우는 로직 이미 있음. ColumnRenderer도 동일 path 매핑 활용
- 메타 필드 (TOC/인포박스/Title) 추가는 **모두 optional** — migration v77은 기본값만 채움
- WikiLayoutToggle (Default/Encyclopedia 토글)은 Phase 2-1에서 잠시 숨김 → Phase 2-2에서 1컬럼/2컬럼 프리셋 토글로 교체
- ColumnRenderer는 Phase 2-1에선 **드래그/추가/삭제 없음** — 렌더만. Phase 2-2에서 편집 UX 추가

## 🚧 보류 (나중에)

- Library FilterPanel — P1
- 노트 전체 접기/펼치기 버튼 — P3
- 인사이트 중앙 허브 — P2
- Phase 3+ (편집 UX / 커스텀 템플릿 편집기 / 나무위키 잔여 / 편집 히스토리 / 노트 split)
