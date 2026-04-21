# 🎯 Next Action

> **이 파일은 before-work가 가장 먼저 읽고, after-work가 마지막에 갱신한다.**
> 다음 세션 시작 시 "지금 바로 뭐 해야 하지?"의 답.
> 항상 1~3개의 immediate next action만. 큰 그림은 docs/MEMORY.md.

---

**Last Updated**: 2026-04-21 후반 — Phase 2B-3c + 2C Step 1-4 + 2B-3 확산 + Phase 3A-1(Wiki shell dnd) + 위키 PR 재사용(WikiTextEditor/WikiBlockRenderer/AddBlockButton) 전부 완료

---

## 🎯 다음 세션 시작하면 바로 할 것

### Step 1 (권장) — WikiBlockRenderer fallback을 나머지 4 shell에도 확산

현재 `wiki-shell.tsx`만 Infobox/TOC/Pull Quote/Image/URL/Table 타입을 실제 chrome으로 렌더 (WikiBlockRenderer fallback). Magazine/Newspaper/Book/Blank shell은 `text/section` 외 타입이 아직 "p" fallback으로 떨어져서 text box로 나옴.

**구체**:
- `components/book/shells/magazine-shell.tsx` / `newspaper-shell.tsx` / `book-shell.tsx` / `blank-shell.tsx`
- 렌더 분기 끝에 wiki-shell.tsx L342-369 동일한 fallback 추가:
  ```tsx
  if (book && b.block) {
    const wb = wikiBlocks?.find((w) => w.id === b.block!.id)
    if (wb) return <BookBlockSlot {...slotProps}><WikiBlockRenderer block={wb} articleId={book.id} editable={editing} onUpdate={...} onDelete={blockActions?.onDelete} /></BookBlockSlot>
  }
  ```
- 각 shell의 `realBody` 매핑도 `b.type === "heading" ? "h2" : b.type === "paragraph" ? "p" : b.type` 로 원본 보존

### Step 2 — Phase 3A-2: 나머지 4 shell 드래그 reorder

Wiki shell만 `BookDndProvider` 래핑됨. Magazine/Newspaper(CSS columns), Book(dropcap float)는 dnd transform과 충돌 가능해서 별도 검증 필요.

- 간단한 shell(Blank)부터 적용 시작
- Magazine/Newspaper는 `columnCount` 안에서 absolute transform 테스트 필요
- Book shell의 dropcap float + dnd drag overlay 충돌 체크

### Step 3 — AddBlockButton `nearestSectionLevel` 전달

현재 드롭다운에 Subsection(H3/H4) 옵션 빠짐. `wiki-article-renderer.tsx`의 `nearestSectionLevelByBlockId` 계산 로직을 Book shell에 포팅해서 전달.

---

## 🔴 잊지 말 것 (이번 세션 핵심 결정)

### 사용자 규칙 (반복 강조됨)

1. **과거 PR의 기존 컴포넌트 재사용 우선** — 새로 구현 X
   - 이번 세션에서 재사용: `WikiTextEditor`, `WikiBlockRenderer`, `AddBlockButton`, `handleAddBlock` 로직
   - 앞으로도 비슷한 기능 구현 시 먼저 "이미 있는지" 검색부터

2. **커밋 타이밍은 사용자 제어** — 자동 커밋 제안 안 함

### 아키텍처 원칙 (유지)

1. **Read 기본 / Edit 토글** — chrome 숨김, hover 시 fade-in 160ms
2. **샘플 vs 실데이터 격리** — book prop 있으면 hatnote/footnotes(sample) 숨김
3. **BookBlockSlot chrome**: `⠿` 좌측(드래그+메뉴) / AddBlockButton 하단(위키 스타일) / Turn Into/Duplicate/Delete
4. **BookWorkspace ViewHeader**: icon + title + count + Edit + Display + SidePanel + Split — Notes 패턴 동일

### 기술 디테일

- `wikiArticles`는 **배열** (`.find(a => a.id === id)`, NOT record)
- 실제 블록 데이터는 `plot-wiki-block-meta` IDB + `plot-wiki-block-bodies` IDB에서 lazy hydrate
- `EditableParagraph`는 `useWikiBlockContentJson`의 **`content` 필드** 활용 필수 (partialize가 block.text를 스트립하므로)
- BookDndProvider: `PointerSensor activationConstraint.distance=5` — 클릭(메뉴)과 드래그 공존
- Display 팝오버 상태는 `BookWorkspace`가 controlled prop으로 BookEditor에 전달

---

## 🎨 Book Phase 진행 상황

- [x] Phase 0: 문서 정비
- [x] Phase 1A~1B: lib/book types/adapter/selectors + Activity Bar rename
- [x] Phase 2A: 5 shell 렌더러
- [x] Phase 2B-1/2: BookWorkspace + BookInlineEditor→WikiTextEditor
- [x] Phase 2B-3a/b/c: AddBlockSlot + 블록 편집 + 섹션 헤딩 편집
- [x] **Phase 2B-3 확산**: 5 shell 전부 editing prop + BookBlockSlot
- [x] **Phase 2C Step 1-4**: 상단 bar 정리 + ViewHeader + Display 팝오버 + Split View + SidePanel
- [x] **Phase 3A-1**: Wiki shell 드래그 reorder (BookDndProvider)
- [ ] **Phase 3A-2**: 나머지 4 shell 드래그 reorder
- [ ] **WikiBlockRenderer fallback 확산**: 4 shell에 Infobox/TOC 등 실제 렌더
- [ ] **Phase 3A**: 12-col grid snap
- [ ] **Phase 4**: Flipbook 실데이터 + Newspaper/Book shell 성숙
- [ ] **Phase 5**: Decoration Layer + My Shell savable
- [ ] **Phase 6**: Chrome 블록 성숙 + seed contentJson 파싱
- [ ] **Phase 7**: 노트 Split + Y.Doc + 인사이트 허브

### 폐기/보류
- ~~Phase 1C (state rename)~~ → Phase 3+ 자연 cleanup
- ~~Grid Editor mode~~ → Phase 3A 인라인 드래그로 대체 (이번 세션에서 삭제됨)
- ~~BookInlineEditor~~ → WikiTextEditor로 대체 (삭제됨)
- ~~TweakPanel (사이드바)~~ → BookDisplayPanel(팝오버)로 흡수 (삭제됨)

---

## 🟡 알려진 이슈

- **상단 auto CONTENTS와 TOC block 중복**: wiki-shell에 hardcoded `realToc` + 실제 TOC block이 있으면 둘 다 나옴. auto CONTENTS 조건부 (TOC block 없을 때만) 또는 제거 검토
- **seed contentJson null**: `[[wiki:Plot]]`, `@mention`, `#tag` 같은 마크업이 Book + Notes 전역에서 plain text로 렌더됨. seed에 contentJson 저장 or runtime parse 필요
- **Magazine CSS columns + dnd transform**: 아직 검증 안 됨 (Phase 3A-2 시 체크)
- **4 issues toast** (우하단) — Yjs 중복 import 경고 + registry.ts RemixiconComponentType (pre-existing, 기능 영향 없음)

---

## 📚 필수 참고

- **진실의 원천**:
  - `docs/BRAINSTORM-2026-04-21-book-pivot.md` (Book Pivot 설계 루트)
  - `docs/BRAINSTORM-2026-04-21-book-ux-refinement.md` (UX 재정렬 결정)
- **디자인 레퍼런스**:
  - `docs/design-system/README.md` (tokens + Non-negotiables 5)
  - `docs/design-system/ui_kits/plot-book/ARCHITECTURE.md` (4-layer)
- **Plot 재사용 포인트**:
  - `components/wiki-editor/wiki-block-renderer.tsx` (L89 `WikiBlockRenderer`, L788 `WikiTextEditor`, L1854 `AddBlockButton`)
  - `hooks/use-wiki-block-actions.ts` (L24 `handleAddBlock` 타입 dispatch)
  - `lib/wiki-block-utils.ts` (`computeSectionNumbers`, `getInitialContentJson`)
  - `components/view-header.tsx` (ViewHeader + SplitViewButton)
  - `components/display-panel.tsx` (Notes의 Display 패턴 참고)
- **이번 세션 신규**:
  - `components/book/shared-editable.tsx` (5 shell 공유 EditableParagraph/SectionHeading/EmptyCTA + `useBlockEditHelpers`)
  - `components/book/book-dnd-provider.tsx` (DndContext + SortableContext 래퍼)
  - `components/book/book-display-panel.tsx` (300px Display 팝오버 10 섹션)
