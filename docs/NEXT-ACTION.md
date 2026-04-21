# 🎯 Next Action

> **이 파일은 before-work가 가장 먼저 읽고, after-work가 마지막에 갱신한다.**
> 다음 세션 시작 시 "지금 바로 뭐 해야 하지?"의 답.
> 항상 1~3개의 immediate next action만. 큰 그림은 docs/MEMORY.md.

---

**Last Updated**: 2026-04-21 후반 (Book Pivot Phase 1A~2B-3b + Edit/Done 토글 완성. `/wiki`에서 실제 Book 편집 가능 — 블록 추가/삭제/복제/타입 변경 + TipTap 인라인 타이핑 + 섹션 자동 넘버링 + TOC 자동 갱신)

---

## 🎯 다음 세션 시작하면 바로 할 것

### Step 1 (권장) — Phase 2B-3c: Section heading 인라인 편집

현재 섹션 제목 (h2 "Definition", "In Plot" 등)은 **정적 렌더**. 클릭해서 수정 불가.

**구체**:
- `components/book/shells/wiki-shell.tsx`의 h2 렌더 부분
- `editing===true`일 때 `<h2>` → `<input contentEditable>` 또는 simple `<input>` 으로 swap
- onBlur → `usePlotStore.getState().updateWikiBlock(book.id, b.block.id, { title: newValue })`
- Plot 기존 `wiki-block-renderer.tsx` L320-435의 Section 편집 패턴 참고 가능

### Step 2 — 2B-3 확산 (다른 shell도)

BookBlockSlot/Edit 토글은 지금 **WikiShell에만** 연결됨. Magazine/Newspaper/Book/Blank도 같은 패턴 적용 필요.

가장 큰 구조적 변경은 5 shell 모두 `book.blocks.map` 렌더를 BookBlockSlot으로 래핑하는 것. Wiki 패턴 복사.

### Step 3 — Phase 2C (Display 팝오버 이관)

BRAINSTORM-2026-04-21-book-ux-refinement.md 결정 2.
- 상단 5개 shell 버튼 제거
- View Header 우측에 "Display ▾" 버튼 신설
- 팝오버 안에: Shell / Render mode / Theme / Decoration / My Shell 저장
- Plot Notes Display 팝오버 패턴 재사용

---

## 🔴 잊지 말 것 (이번 세션 핵심 결정)

### 디자인 원칙

1. **Read 기본 / Edit 토글**: "Edit" 누르기 전까진 깨끗한 읽기 화면. chrome 전부 숨김. Plot 원칙 "Don't compete for attention you haven't earned" 준수
2. **샘플 vs 실데이터 격리**: book prop 있으면 Hatnote/Infobox/Footnotes 숨김 (이것들은 Phase 6까지 샘플). Title/본문/TOC만 실데이터
3. **BookBlockSlot chrome 5가지**: `⠿` 메뉴 (좌측) / `+ Add block` (하단) / Turn Into 서브메뉴 / Duplicate / Delete (빨강). 호버 때만 fade-in (160ms)
4. **카디널 죄 회피**: dashed border, 영구 `+/×` 금지. 선택된 블록 또는 호버된 블록에만 chrome

### 아키텍처

- `lib/book/` = types / shells / adapter / selectors (기존 wikiArticles state 유지, on-the-fly 변환)
- `components/book/` = shells/editor/flipbook/book-editor/book-workspace/book-inline-editor/book-block-slot
- `app/(app)/wiki/page.tsx` → layout.tsx에서 `<BookWorkspace />` 렌더
- `app/(app)/book/page.tsx` → `redirect("/wiki")` alias
- Phase 1C (state rename wikiArticles → books) **보류** — 새 Book 컴포넌트가 primary consumer 된 후 자연 cleanup

### 살아있는 코드 vs 죽은 코드

**살림**:
- Plot 기존 `useWikiBlockContentJson()` (IDB 로드)
- `saveBlockBody()` (IDB persist)
- `updateWikiBlock/addWikiBlock/removeWikiBlock` actions (Plot 기존)
- `computeSectionNumbers()` (섹션 넘버링)
- `createEditorExtensions("wiki")` (TipTap wiki tier — 슬래시 커맨드, 위키링크, 멘션, 각주 전부)

**폐기 예정** (Phase 3+ 자연 삭제):
- Grid Editor mode (별도 모드 폐기, 인라인 드래그로 대체)
- `components/wiki-editor/wiki-article-renderer.tsx` 등 기존 위키 렌더러 (BookWorkspace가 대체)

### 기술 디테일

- `wikiArticles`는 **배열** (`WikiArticle[]`), not Record. `.find(a => a.id === id)`로 조회
- 4 shells 중 Magazine/Newspaper/Book 현재 title+body만 실데이터, chrome (masthead/flag/cover)은 샘플
- BookInlineEditor는 **toolbar 없음** (FixedToolbar 제외, 깔끔한 Book UX)
- Edit/Done 상태는 **session-only** (persist 안 함, BookWorkspace의 useState)

---

## 🎨 현재 Phase 진행 상황

### Book Pivot Phase 1~2B (2026-04-21 세션에서 거의 완료)

- [x] **Phase 0**: 문서 정비 + PDCA plan + design-system zip
- [x] **Phase 1A**: lib/book types/shells/adapter/selectors (173/173 tests)
- [x] **Phase 1B**: Activity Bar "Wiki"→"Book" + 사용자 visible strings + /book redirect
- [x] **Phase 2A**: 5 shell 렌더러 + flipbook viewer 복사 + /book-preview 라우트
- [x] **Phase 2B-1**: BookWorkspace (좌 리스트 / 우 BookEditor) + 5 shell 실데이터 연결
- [x] **Phase 2B-2**: BookInlineEditor (TipTap wiki tier) + EditableParagraph + 타이핑 검증
- [x] **Phase 2B-3a**: BookBlockSlot + hover `+` + 타입 피커 8개 + 섹션 자동 넘버링 + TOC 자동 갱신
- [x] **Phase 2B-3b**: ⠿ 메뉴 + Turn Into/Duplicate/Delete + 동작 검증
- [x] **Edit/Done 토글** (BookWorkspace 우상단)
- [x] **빈 Book CTA** + SAMPLE hatnote/infobox/footnote 숨김
- [ ] **Phase 2B-3c**: Section heading 인라인 편집 (클릭→타이핑)
- [ ] **Phase 2B-3 확산**: Magazine/Newspaper/Book/Blank shell에 BookBlockSlot 적용
- [ ] **Phase 2C**: Display 팝오버 이관 (상단 shell 버튼 제거)

### 다음 대형 단계

- **Phase 3A**: 인라인 드래그 reorder + 12-col grid snap (BRAINSTORM-2026-04-21-book-ux-refinement.md Phase 3A 참조)
- **Phase 4**: Flipbook 실데이터 + Newspaper/Book shell 성숙
- **Phase 5**: Decoration Layer + "My Shell" savable
- **Phase 6**: Chrome 블록 성숙 + Infobox/TOC/hatnote 실데이터 이관
- **Phase 7**: 노트 Split + Y.Doc 본 구현 + 인사이트 허브

### 폐기/보류

- ~~Phase 1C (state rename)~~ → Phase 3+ 자연 cleanup
- ~~Grid Editor mode~~ → Phase 3A 인라인 드래그로 대체
- Y.Doc 본 구현 → Phase 7
- 인사이트 허브 → Book 이후

---

## 🟡 이번 세션 알려진 이슈

- `addWikiBlock`의 `afterBlockId` 매칭이 컬럼 레이아웃 기반 구조에서 때때로 순서 이상함 (section 삽입 시 top에 나타남) — 기존 Plot 버그, Phase 3A-1 드래그 reorder 이후 검토
- Fast Refresh가 자주 full reload함 (store slice 변경 시 정상, 무시)
- Yjs 중복 import 경고 (기존 Plot 이슈, 무관)

---

## 📚 필수 참고

- **진실의 원천**:
  - `docs/BRAINSTORM-2026-04-21-book-pivot.md` (Book Pivot 설계 루트)
  - `docs/BRAINSTORM-2026-04-21-book-ux-refinement.md` (UX 재정렬 결정)
- **디자인 레퍼런스**:
  - `docs/design-system/README.md` (tokens + Non-negotiables 5)
  - `docs/design-system/ui_kits/plot-book/ARCHITECTURE.md` (4-layer)
  - `docs/design-system/components/` (TSX 프로덕션 레퍼런스 원본)
- **Plot 재사용**:
  - `components/wiki-editor/wiki-block-renderer.tsx` (Section edit 패턴 Phase 2B-3c용)
  - `lib/wiki-block-utils.ts` (computeSectionNumbers)
  - `hooks/use-wiki-block-content.ts` (useWikiBlockContentJson)
