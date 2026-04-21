# Plot — TODO (2026-04-21, Book Pivot 이후)

> 🔴 **2026-04-21 Book Pivot 결정**: Wiki 시스템 전면 개편. 기존 Phase 3/3.1 폐기, Book Phase 1~7 수립.
> 진실의 원천: [`docs/BRAINSTORM-2026-04-21-book-pivot.md`](./BRAINSTORM-2026-04-21-book-pivot.md)

## 🎯 Book Pivot 로드맵 (신규)

### Phase 0 — 문서 정비 + 설계 확정 (현재 세션)

- [x] `docs/BRAINSTORM-2026-04-21-book-pivot.md` 작성 (진실의 원천)
- [x] `docs/design-system/` 설치 (사용자 제공 zip)
- [x] 기존 docs deprecation 마크 (multi-pane / magazine-layout / page-identity / column-template-system)
- [x] NEXT-ACTION.md / TODO.md / CONTEXT.md / MEMORY.md 갱신
- [ ] PR #209 (pending 변경) 머지 결정
- [ ] `/pdca plan book-pivot` 실행 (남은 결정 5개 AskUserQuestion)

### Phase 1 — 데이터 모델 + "Wiki" → "Book" (2026-04-21 완료, 1C 보류)

- [x] **Phase 1A**: lib/book types/shells/adapter/selectors (storage 변경 없음, on-the-fly 변환)
- [x] **Phase 1B**: Activity Bar "Book" + visible strings + /book redirect
- [ ] **Phase 1C (보류)**: state rename (wikiArticles → books, migration v81) — Phase 3+ 자연 cleanup로 이동

### Phase 2A — Shell 렌더러 + preview route (2026-04-21 완료)

- [x] `docs/design-system/` zip v2 설치 (TSX 프로덕션 레퍼런스)
- [x] `components/book/` shells/editor/flipbook/book-editor/tweak-panel 복사
- [x] `/book-preview` 라우트

### Phase 2B — Inline Editor 성숙 (2026-04-21 대부분 완료)

- [x] **2B-1**: BookWorkspace (좌 리스트 / 우 BookEditor) + 5 shell 실데이터
- [x] **2B-2**: BookInlineEditor (TipTap wiki tier) + EditableParagraph + 타이핑 저장
- [x] **2B-3a**: BookBlockSlot + hover `+` + 타입 피커 8개 + 섹션 자동 넘버링 + TOC 자동
- [x] **2B-3b**: ⠿ 메뉴 + Turn Into/Duplicate/Delete
- [x] **Edit/Done 토글** + 빈 Book CTA + SAMPLE hatnote/infobox/footnote 숨김
- [ ] **2B-3c**: Section heading 인라인 편집 (다음 Step 1)
- [ ] **2B-3 확산**: Magazine/Newspaper/Book/Blank shell에 BookBlockSlot 적용

### Phase 2C — Display 팝오버 이관 (BRAINSTORM-2026-04-21-book-ux-refinement.md)

- [ ] View Header 우측 Display 버튼 (Notes 패턴)
- [ ] 상단 5 Shell 버튼 제거 → Display 팝오버 안에
- [ ] Tweak Panel 내용 이관 (Shell / Render / Theme / Decoration)
- [ ] My Shell savable preset

### Phase 3A — 인라인 드래그 (Grid Editor 폐기)

> BRAINSTORM-2026-04-21-book-ux-refinement.md 결정 3 — 안 A

- [ ] **3A-1**: 세로 reorder (Plot BlockDragOverlay 재사용)
- [ ] **3A-2**: WikiBlock col/span/row optional 필드 추가 (migration v81)
- [ ] **3A-3**: Blank shell 12-col snap + grid overlay
- [ ] **3A-4**: Newspaper shell 6-col drag
- [ ] **3A-5**: Magazine shell spanColumns/dropcap
- [ ] **3A-6**: Grid Editor mode 삭제 (코드 정리)

### Phase 4 — Newspaper + Book Shell + Flipbook render mode

- [ ] **Newspaper shell**: flag, date strip, 6-col rigid grid, column rules, italic city prefix byline, headline tiers (96/48/28/19), jump line
- [ ] **Book shell**: cover, half-title, title page, running header, page number, chapter opener with drop-cap + small-caps, body justified + hyphenation + first-line indent, ornamental break, colophon
- [ ] **Flipbook render mode**:
  - `<FlipbookViewer>` 래퍼 (어떤 shell이든 감쌈)
  - Page-split 로직 (content overflow + breakBefore)
  - `transform: rotateY()` + perspective 페이지 넘김 (350-500ms)
  - Thumbnail strip + zoom + page counter + 플로팅 툴바
  - 모바일 single page, 데스크탑 two-page spread

### Phase 5 — Decoration Layer + Blank Shell + "My Shell"

- [ ] Decoration Layer 전면: Ribbon / Endpaper / Background texture / Corner ornament / Fold crease / Bookmark tab
- [ ] Blank shell (12-col grid + body fonts only)
- [ ] "My Shell" savable preset (shell + theme + decor 조합 저장/적용)
- [ ] Typography pair 5종 UI (default/classic/modern/editorial/bauhaus)
- [ ] 블록 style 오버라이드 (shell-scoped)

### Phase 6 — Chrome 블록 성숙 + 기존 기능 이관

- [ ] Chrome 블록 편집 UX 성숙
- [ ] 기존 기능 이관:
  - [ ] Wiki footnote → Book footnote
  - [ ] Wiki categories → Book categories
  - [ ] Wiki templates → Book templates (shell+theme+chrome 조합)
  - [ ] `[[wikilinks]]` UI 텍스트 ("Book link" or 유지)
- [ ] Hatnote / Navbox / Callout 12타입 (chrome 블록으로 구현)
- [ ] 편집 히스토리 v1

### Phase 7 — 완성도 + 기능 보강

- [ ] 노트 Split 기능 (위키 split 패턴 복사)
- [ ] Smart link / LinkCard 개선
- [ ] **Y.Doc 본 구현** (PoC → 프로덕션): y-indexeddb 영속화, Book 동일 패턴 적용
- [ ] 인사이트 허브 (온톨로지 Single Source of Insights)

---

## ✅ 이전 완료 (Book Pivot 이전, 2026-04-17)

**PR #209 pending (2026-04-17)**: Phase 3.1-A/B + Page Identity Tier 시스템 (~2600 lines)
- Article themeColor tint + WikiTitle paint-bucket picker
- 공통 `block-menu.tsx` primitives + 5개 블록 ⋯ 메뉴 마이그레이션
- `WikiBlock.width` / `density` / `fontSize` (Infobox/TOC 적용)
- Card 용어 통일 (UI only)
- Asymmetric 프리셋 mini bar + cardCount 그룹핑
- SectionNumbers Context (column-group 중첩)
- addWikiBlock afterBlockId 위치 fix
- Column-group unwrap 버그 2곳 fix
- Seed 3-stage 리셋

→ Book Pivot에서 일부만 살림 (block-menu primitives / themeColor 아이디어 / Card palette 16색). 나머지 ColumnStructure 기반 UI는 Phase 1 리팩토링 중 자연 삭제.

---

## ✅ 이전 완료 (2026-04-15, 하루에 10 PR)

- PR #208: Phase 2-2-B-3-b + 2-2-C (빈 컬럼 AddBlock + 메타→블록 통합, migration v78+v79)
- PR #205: Phase 2-2-B-3-a (컬럼 추가/삭제 버튼)
- PR #204: Phase 2-2-B-2 (블록 컬럼 간 드래그)
- PR #203: Phase 2-2-B-1 (컬럼 비율 드래그 + 메타 위치 UI)
- PR #202: Phase 2-2-A (ColumnPresetToggle)
- PR #201: Phase 2-1B-3 (Cleanup 1662줄 삭제)
- PR #200: Phase 2-1B-2 (편집 모드 흡수)
- PR #199: Phase 2-1B-1 (WikiArticleRenderer read-only)
- PR #198: Phase 2-1A (컬럼 시스템 인프라)
- PR #197: Phase 1 (WikiTemplate + 8 built-in + picker UI)

→ **이 PR들의 성과는 Book Pivot에서 메타→블록 통합, 컬럼 비율 자유 등 개념으로 흡수. 구조는 재구성.**

---

## 🟡 보류 (Book Pivot 이후)

- [ ] **Library FilterPanel Notes 수준** (view-engine 재사용)
- [ ] **사이드패널 리디자인** (Connections 인라인 프리뷰, Obsidian식)
- [ ] **커맨드 팔레트 확장** (풀페이지 검색, 북마크 커맨드)
- [ ] **노트 전체 접기/펼치기 버튼**

---

## 📚 핵심 문서

- `docs/BRAINSTORM-2026-04-21-book-pivot.md` — **진실의 원천** (Book Pivot)
- `docs/design-system/` — 디자인 레퍼런스 (사용자 제공 zip)
- `docs/CONTEXT.md` — 현재 아키텍처 + Design Decisions
- `docs/MEMORY.md` — 전체 PR 히스토리
- `docs/NEXT-ACTION.md` — 다음 세션 즉시 액션
