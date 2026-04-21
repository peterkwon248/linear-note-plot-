---
template: plan
version: 1.2
feature: book-pivot
date: 2026-04-21
author: peterkwon248
project: Plot (linear-note-plot-)
version_app: 0.1.0
---

# Book Pivot — Planning Document

> **Summary**: Wiki 시스템을 Plot Design System zip 기반 4-layer 아키텍처(Shell/Grid/Blocks/Decoration)로 전면 개편. 5 Shell (wiki/magazine/newspaper/book/blank) + Flipbook render mode. "Wiki" → "Book" 전면 rename.
>
> **Project**: Plot (linear-note-plot-)
> **Date**: 2026-04-21
> **Status**: Draft (Phase 0 완료, Phase 1A 착수 대기)
> **진실의 원천**: [`docs/BRAINSTORM-2026-04-21-book-pivot.md`](../../BRAINSTORM-2026-04-21-book-pivot.md)

---

## 1. Overview

### 1.1 Purpose

현재 Wiki 에디터의 구조적 문제(dashed border chrome everywhere, column tree 엉킴, shell 개념 부재, Flipbook bolt-on 불가)를 해결하기 위해 **4-layer 아키텍처**로 전면 개편.

- 사용자는 같은 문서를 Wiki/Magazine/Newspaper/Book/Blank로 **shell 전환**하며 다른 매체 느낌 확보
- 12-col snap grid로 자유로운 레이아웃 + 가독성 보장 ("Freedom B")
- Flipbook 같은 새 render mode가 day-1 데이터 구조에 포함됨
- Chrome은 **선택된 cell에만** 노출 (카디널 죄 회피)

### 1.2 Background

- 2026-04-21 사용자 제공 "Plot Design System.zip v2" 분석 → 이미 Next.js TypeScript 레퍼런스 구현 존재
- 기존 Phase 3 per-column blocks 모델(v80) + Phase 3.1 Magazine Layout 카탈로그는 **이 피벗으로 대체**됨
- 사용자 확정: Wiki → Book **전면 교체**, pending PR #209 중 일부만 살림, Flipbook은 Phase 4 구현

### 1.3 Related Documents

- **진실의 원천**: `docs/BRAINSTORM-2026-04-21-book-pivot.md`
- **디자인 레퍼런스**: `docs/design-system/` (zip v2 전체 — TSX 프로덕션 코드 포함)
- **설계 청사진**: `docs/design-system/ui_kits/plot-book/ARCHITECTURE.md`
- **매체별 리서치**: `docs/design-system/ui_kits/plot-book/RESEARCH.md`
- **폐기된 BRAINSTORM**: 04-14 column-template-system / 04-15 multi-pane / 04-16 magazine-layout / 04-17 page-identity (전부 DEPRECATED 마크)

---

## 2. Scope

### 2.1 In Scope (Phase 1~7)

- [ ] **Phase 1**: 데이터 모델 + "Wiki" → "Book" 전면 rename (3 PR 분할: 1A/1B/1C)
- [ ] **Phase 2**: Wiki Shell 정착 + 12-col grid 인프라
- [ ] **Phase 3**: Magazine Shell (MVP 증명)
- [ ] **Phase 4**: Newspaper + Book Shell + Flipbook 구현
- [ ] **Phase 5**: Decoration Layer + Blank Shell + "My Shell" savable preset
- [ ] **Phase 6**: Chrome 블록 성숙 + 기존 기능 이관 (footnote/categories/templates)
- [ ] **Phase 7**: 노트 Split + Y.Doc 본 구현 + 인사이트 허브

### 2.2 Out of Scope

- 기존 노트(Note) 엔티티 변경 (Note는 그대로 유지, Book만 변경)
- 사용자 UI 한국어 번역 (영어 "Book" 유지)
- CMYK 인쇄 출력 (Book shell은 디지털 print-feel 시뮬레이션만)
- 자유 Figma식 absolute 드래그 (12-col snap만)
- LLM/API 사용 (기존 원칙 유지)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | WikiArticle → Book 타입 rename (migration v81 데이터 손실 없이) | High | Pending |
| FR-02 | Activity Bar "Wiki" → "Book" (영어 유지) | High | Pending |
| FR-03 | URL `/wiki/:id` → `/book/:id` | High | Pending |
| FR-04 | wiki-articles slice → books slice | High | Pending |
| FR-05 | wiki-categories → book-categories, wiki-templates → book-templates | High | Pending |
| FR-06 | 5 Shell 렌더러 구현 (wiki/magazine/newspaper/book/blank) | High | Pending |
| FR-07 | 12-col snap grid 에디터 (drag + resize + slash menu) | High | Pending |
| FR-08 | Shell picker 모달 (좌상단 `Wiki ▾`, 전환 시 chrome 블록 교체) | High | Pending |
| FR-09 | Theme 레이어 (bgColor, texture, fontPair, accentColor, margins, chapterStyle 등) | Med | Pending |
| FR-10 | Decoration 레이어 (ribbon/endpaper/ornament/bookmark — 선택적) | Med | Pending |
| FR-11 | Flipbook render mode (page-split + rotateY 애니 + thumbnail/zoom) | Med | Pending |
| FR-12 | "My Shell" savable preset (shell+theme+decor 저장/적용) | Low | Pending |
| FR-13 | Book chrome 블록 (masthead, flag, cover, infobox, toc, footnote 등) | High | Pending |
| FR-14 | 기존 Wiki 기능 이관 (footnote, categories, templates, wikilinks) | High | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | Shell 전환 < 200ms | DevTools Performance |
| Performance | 12-col grid drag 60fps | Browser FPS |
| Performance | Flipbook 페이지 넘김 350-500ms (CSS easing) | 측정 |
| Performance | 첫 Magazine shell 진입 시 폰트 로드 < 500ms (CDN 캐시 후) | DevTools Network |
| Accessibility | 키보드 네비게이션 (Tab/Enter/슬래시) 전부 지원 | 수동 테스트 |
| Data Safety | Migration v81 **엔티티 수량 보존** (Wiki → Book 손실 0) | Migration sanity check |
| Compatibility | Next.js 16 + React 19 + Tailwind v4 | 빌드 성공 |
| Design | Non-negotiables 5개 전부 준수 | 코드 리뷰 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] Phase 1A: WikiArticle → Book rename + migration v81 머지, 기존 위키 문서 렌더 정상
- [ ] Phase 1B: Activity Bar + URL 변경, 기존 북마크 호환 (`/wiki/:id` → `/book/:id` redirect)
- [ ] Phase 1C: 파일명/import 전부 리네임, TypeScript 컴파일 clean
- [ ] Phase 2: Wiki Shell로 렌더된 Book과 기존 Wiki 렌더 **시각적으로 동일**
- [ ] Phase 3: Magazine Shell MVP — 같은 콘텐츠가 잡지처럼 변신
- [ ] Phase 4: Newspaper/Book + Flipbook 동작 확인
- [ ] Phase 5~7: 점진 완성

### 4.2 Quality Criteria

- [ ] TypeScript 컴파일 에러 0
- [ ] `npm run build` 성공
- [ ] 기존 위키 문서 5개 샘플 열기 → 렌더 에러 0
- [ ] 다크모드 전환 정상
- [ ] IDB 백업 → 복원 사이클 통과 (migration 역호환)

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **R1. 대규모 리네임 범위** (~100+ 파일) | High | High | 3 PR 분할 (1A/1B/1C). 자동 grep rename + 수동 검토 |
| **R2. Migration v81 데이터 손실** | Critical | Med | IDB 백업 before-work 필수 / sanity check 로그 / 엔티티 수량 보존 원칙 |
| **R3. Shell 전환 transform 규칙** (chrome 교체 시 사용자 블록 보존) | High | Med | "사용자 블록 삭제 금지" 원칙 / chrome type 감별 로직 / 확인 다이얼로그 |
| **R4. PR #209 pending 처리** | Med | High | 그대로 머지 후 Book 리팩토링 중 자연 삭제 (revert보다 rewrite 명확). block-menu primitives는 살림 |
| **R5. 사용자 혼란** ("내 위키 어디 갔지?") | Low | Low | **조용히 전환** (Plot 원칙: Settings are not a design failure). 필요 시 릴리즈 노트만 |
| **R6. Flipbook page-split 난이도** | High | Low | Phase 1에 데이터 필드만 예약 / 구현은 Phase 4 (zip 레퍼런스 flipbook-viewer.tsx 445줄 참고) |
| **R7. 6 medium 전부 퀄리티 맞추기** | Med | Med | Wiki + Magazine 먼저 완성(MVP), Newspaper + Book은 Phase 4에 OK 수준, 점진 개선 |
| **R8. 폰트 CDN 로드 FOUT** | Low | Med | `next/font/google` Playfair+Merriweather 서버 사이드 로드로 FOUT 방지 |

---

## 6. Architecture Considerations

### 6.1 Project Level

| Level | Selected |
|-------|:--------:|
| Starter | ☐ |
| **Dynamic** | ✅ |
| Enterprise | ☐ |

Plot은 Dynamic 레벨 (Feature-based slices + shared lib + BaaS 없는 local-first).

### 6.2 Key Architectural Decisions

| Decision | Selected | Rationale |
|----------|----------|-----------|
| Data Model | 4-layer (Shell/Grid/Blocks/Decoration) | ARCHITECTURE.md 청사진 — 현재 wiki editor의 구조적 문제 해결 |
| Shell 타입 값 | `"wiki"` 유지 | 사용자 친숙, RESEARCH.md 용어와 일치 |
| Grid | 12-col snap (newspaper=6, book=1) | "Freedom B" 계약 — 자유 드래그 느낌 + 가독성 보장 |
| Block Cell | `{col, span, row?, rowSpan?}` | 기존 ColumnStructure보다 단순 + 표현력 높음 |
| Flipbook | renderMode (orthogonal to shell) | Day-1 데이터 필드, Phase 4 구현 |
| Font Loading | Google Fonts CDN via `next/font/google` | FOUT 방지 + 번들 크기 작음 |
| Decoration | absolute sibling, pointer-events: none | Layer 4 격리 |
| Editor UX | 3-무브 (Pick shell / Edit blocks / Decorate) | 선택된 cell에만 chrome |

### 6.3 폴더 구조

```
lib/
  types.ts                         # Book, Shell, Block, Theme, Decoration 타입 추가
  shells.ts                        # SHELLS / FONT_PAIRS / BLOCK_LIBRARY / resolveShell
  store/slices/
    books.ts                       # 기존 wiki-articles.ts rename + 확장
    book-categories.ts             # 기존 wiki-categories.ts rename
    book-templates.ts              # 기존 wiki-templates.ts rename

components/
  book-editor/                     # 기존 wiki-editor/ rename + 구조 재편
    book-root.tsx                  # BookRoot → BookChrome → BookGrid → Cell → BlockRenderer
    book-grid.tsx                  # 12-col snap grid
    grid-editor.tsx                # drag + resize + slash menu
    slash-menu.tsx
  book/
    book-editor.tsx                # 메인 에디터 (기존 wiki-article-renderer 대체)
    tweak-panel.tsx                # 우측 레일 Theme+Decor 편집
    shell-picker.tsx               # 좌상단 모달
  shells/
    wiki-shell.tsx
    magazine-shell.tsx
    newspaper-shell.tsx
    book-shell.tsx
    blank-shell.tsx
    decorations.tsx
    chapter-divider.tsx
  flipbook/
    flipbook-viewer.tsx            # Phase 4
```

### 6.4 폐기/보존 결정

**폐기** (Phase 1~2에서 자연 삭제):
- `components/wiki-editor/wiki-article-renderer.tsx` (BookEditor가 대체)
- `components/wiki-editor/column-renderer.tsx` (12-col grid가 대체)
- `components/wiki-editor/column-preset-toggle.tsx` (Shell picker가 대체)
- `components/wiki-editor/wiki-column-menu.tsx` (Grid 내 cell 메뉴로 흡수)
- `lib/wiki-column-tree.ts` (ColumnStructure 자체 폐기)
- `WikiLayout` 타입 관련 전부
- Migration v77/v78/v79 중 `layout`, `infobox`, `tocStyle` 관련 로직 (v80에서 흡수)

**보존** (살려서 Book에 통합):
- `components/wiki-editor/block-menu.tsx` primitives (Book의 block 메뉴로 재활용)
- `lib/wiki-block-utils.ts` (drag handle, resize 로직)
- Card palette 16색 (`lib/column-palette.ts`) → Magazine Shell 내부에서 사용
- Article themeColor tint 아이디어 → `Book.theme.bgColor` + `accentColor`로 이관
- Infobox/TOC 블록 컴포넌트 (Book 블록 type infobox/toc로 그대로 재사용)

---

## 7. Convention Prerequisites

### 7.1 Existing Project Conventions

- [x] `CLAUDE.md` 코딩 규칙 존재 (한국어 소통, 커밋 워크플로우)
- [x] `tsconfig.json` path alias `@/*` 설정
- [x] Tailwind v4 (`app/globals.css`)
- [x] Zustand + IDB persist
- [x] Design 토큰 `lib/colors.ts`

### 7.2 새로 정의할 규칙

| Category | To Define | Priority |
|----------|-----------|:--------:|
| Book 타입 네이밍 | `Book`, `Shell`, `Block`, `Theme`, `Decoration` (Plural/Single 일관성) | High |
| Shell 파일 구조 | `components/shells/{shell-id}-shell.tsx` | High |
| Chrome 블록 vs 사용자 블록 구분 | type name prefix 또는 shell 소유권 표시 | High |
| Migration v81 sanity check | `beforeCount === afterCount` 로그 | High |
| Shell 전환 transform 규칙 | "사용자 블록 삭제 금지" + chrome 교체 로직 | High |

### 7.3 Font loading (Phase 3 Magazine shell 착수 시)

`app/layout.tsx`에 `next/font/google`로 Playfair Display + Merriweather 로드. Subset 최소화 (Latin + Korean if needed).

```ts
import { Playfair_Display, Merriweather } from "next/font/google"
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" })
const merriweather = Merriweather({ subsets: ["latin"], variable: "--font-merriweather" })
```

---

## 8. Next Steps

1. [x] Phase 0 — 문서 정비 + PDCA Plan 작성 (**현재**)
2. [ ] Phase 1A — 타입 rename + slice rename + migration v81 (다음 PR)
3. [ ] Phase 1B — Activity Bar + URL + 사이드바
4. [ ] Phase 1C — 에디터/렌더러 파일명 + 컴포넌트
5. [ ] Phase 2~ — 순차 진행

---

## 9. Phase 1A 착수 체크리스트 (다음 즉시)

**Scope**: 타입/슬라이스/마이그레이션만. UI 변경 없음 (Activity Bar 라벨은 1B).

- [ ] `lib/types.ts`에 `Book`, `Shell`, `ShellId`, `Block`, `BlockType`, `ThemeConfig`, `DecorationConfig`, `Page` 타입 추가 (zip `lib/types.ts` 기반, Plot 기존 타입과 병합)
- [ ] `lib/shells.ts` 신규 (zip의 SHELLS / FONT_PAIRS / BLOCK_LIBRARY / SAMPLE_CONTENT / resolveShell / getShellBlocks / TEXTURES)
- [ ] `lib/store/slices/books.ts` 신규 (기존 `wiki-articles.ts` 복사 + 타입 변경 + actions 교체)
- [ ] `lib/store/slices/book-categories.ts` 신규 (기존 `wiki-categories.ts` 복사)
- [ ] `lib/store/slices/book-templates.ts` 신규 (기존 `wiki-templates.ts` 복사)
- [ ] `lib/store/index.ts` migration v81 (WikiArticle → Book 변환)
  - `shell: "wiki"` / `renderMode: "scroll"` 기본값
  - `theme`: 빈 객체 (또는 themeColor → `accentColor` 이관)
  - `decoration`: 빈 객체
  - `pages`: `[]`
  - `blocks`: 기존 WikiBlock[] 그대로 (cell은 ColumnStructure → 추론, 단순 케이스 {col:1, span:12})
  - `wiki-articles` slice 데이터 → `books` slice 복사
  - `wiki-categories` → `book-categories`
  - `wiki-templates` → `book-templates`
  - Sanity check: `beforeCount === afterCount`
- [ ] `Note.noteType` enum 확장: `"note" | "wiki" | "book"` 공존 (Phase 1C에서 `"wiki"` 완전 제거)
- [ ] 기존 `wiki-articles.ts` / `wiki-categories.ts` / `wiki-templates.ts` slice는 **삭제 금지** (Phase 1C까지 공존) — 참조하는 컴포넌트는 아직 wiki slice 읽음, 쓰기도 wiki slice (migration은 양쪽에 write)
- [ ] TypeScript 컴파일 통과
- [ ] `npm run build` 성공
- [ ] 기존 위키 문서 5개 샘플 렌더 정상 (기존 wiki-editor로 렌더 — Phase 2에서 BookRoot 교체)

**Out of Scope (Phase 1A)**:
- UI 변경 (Activity Bar, URL, 컴포넌트 파일명)
- 12-col grid 렌더링
- Shell picker UI
- Book chrome 블록

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-21 | Initial draft (Book Pivot Phase 1~7 계획) | peterkwon248 + Claude |
