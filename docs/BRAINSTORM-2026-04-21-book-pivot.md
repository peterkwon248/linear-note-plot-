# 🅿️ Book Pivot — 진실의 원천 (2026-04-21)

> **이 문서는 Plot Wiki 시스템의 전면 개편(Book Pivot) 진실의 원천.**
> 기존 BRAINSTORM 문서 (04-15 multi-pane, 04-16 magazine-layout, 04-17 page-identity) Phase 3 관련 내용은 **전부 이 문서로 대체됨**.
> 디자인 레퍼런스: `docs/design-system/` (Plot Design System zip, 사용자 제공)

---

## 🎯 결정 내용 (2026-04-21)

1. **"Wiki" → "Book" 전면 교체**: Activity Bar 이름, 코드 타입, 데이터 모델, 사용자 UI 전부 교체. 점진 마이그레이션 없음
2. **4-layer 아키텍처** 채택: Shell / Grid / Blocks / Decoration 직교 레이어
3. **5 Shells + Flipbook render mode**: wiki / magazine / newspaper / book / blank + flipbook (orthogonal)
4. **12-col snap grid** (newspaper=6, book=1) — 기존 ColumnStructure 폐기
5. **Flipbook timing**: 데이터 모델(`renderMode`)은 Phase 1에 예약, 구현은 Phase 4
6. **기존 Phase 3.1 pending 변경 중 일부만 살림**:
   - ✅ 살림: `block-menu.tsx` primitives (Book에서도 재활용)
   - ✅ 살림: Article themeColor tint 아이디어 → `Book.theme.bgColor`로 이관
   - ❌ 폐기: ColumnStructure 확장 (12-col grid가 대체)
   - ❌ 폐기: ColumnPresetToggle (Shell picker가 대체)
   - ❌ 폐기: ColumnMetaPositionMenu (이미 Phase 2-2-C에서 삭제됨)
   - ❌ 폐기: per-column blocks 모델 (v80 migration 안 함)

## 📜 설계 출처

사용자가 2026-04-21 제공한 **"Plot Design System.zip"**. 내용:
- `README.md` — tokens, voice, visual foundations, iconography, substitutions (전체 디자인 언어)
- `SKILL.md` — 디자인 스킬 진입점 + Non-negotiables 5
- `colors_and_type.css` — CSS 변수 단일 진실
- `ui_kits/plot-book/ARCHITECTURE.md` — **4-layer 모델 청사진**
- `ui_kits/plot-book/RESEARCH.md` — 6 medium별 reader expectations
- `ui_kits/plot-book/*.jsx` — 인터랙티브 React 프로토타입 (App, Editor, Flipbook, Shells, ShellData, MainAppDemo)

**이 파일들은 `docs/design-system/`에 복사됨. 구현 시 반드시 참고.**

---

## 🏗 4-Layer 아키텍처

```
┌─────────────────────────────────────────────┐
│  LAYER 4 — DECORATION (ribbon, ornaments)   │  absolute-positioned, non-interactive
├─────────────────────────────────────────────┤
│  LAYER 3 — BLOCKS (text, image, quote…)     │  flows inside grid cells
├─────────────────────────────────────────────┤
│  LAYER 2 — GRID (12-col responsive snap)    │  determines cell geometry
├─────────────────────────────────────────────┤
│  LAYER 1 — SHELL (wiki, magazine, news…)    │  sets chrome, fonts, bg, rules
└─────────────────────────────────────────────┘
```

### Layer 1 — Shell

| Shell | Body font | Display font | Bg | Grid | Chrome defaults |
|---|---|---|---|---|---|
| `wiki` | Geist 15/1.75 | Geist 600 | `--background` | 12-col, max 960 | Title · Infobox · ToC · Footnotes |
| `magazine` | Merriweather 15/1.75 | Playfair 900 | `#faf7f0` | 12-col asymmetric | Masthead · Nameplate · Headline · Deck · Byline · Drop-cap |
| `newspaper` | Merriweather 14/1.6 | Playfair 900 condensed | `#f4efe6` | 6-col rigid w/ rules | Flag · Date strip · Column rules · Jump line |
| `book` | Merriweather 14/1.6 justified | Playfair 700 | `#f5efe2` | 1-col centered 480 | Cover · Half-title · Title · Running header · Page no · Chapter opener |
| `blank` | Geist 15/1.75 | Geist 600 | `--background` | 12-col | (none) |

`flipbook`은 shell이 아니라 **renderMode** (orthogonal). 어떤 shell이든 flipbook 모드로 렌더 가능.

### Layer 2 — Grid

- 기본 12-col snap grid (newspaper=6, book=1)
- Cell: `{col: 1-12, span: 1-12, row?: number, rowSpan?: number}`
- 드래그 = 컬럼 경계 snap (픽셀 정밀 X)
- 리사이즈 = span increment snap (1, 2, 3, ..., 12)
- **"Freedom B" 계약**: 사용자는 drag-and-drop 자유 느낌 + 시스템은 가독성 보장

### Layer 3 — Blocks

`{id, type, props, content, cell}` 구조.

- **Text**: paragraph · heading · blockquote · pullquote · drop-cap · caption · footnote · running-header · page-number
- **Media**: image · gallery · video · embed
- **Chrome** (shell이 자동 삽입, 편집 가능): masthead · nameplate · flag · date-strip · cover · back-cover · colophon · infobox · toc
- **Structure**: column-rule · ornamental-break · spacer · card
- **Interactive**: bookmark · link-suggestion · footnote-ref

### Layer 4 — Decoration

Non-flowing 순수 시각. `<div class="book-decor">` sibling, `position: absolute; inset: 0`, `pointer-events: none`.

- Ribbon · Endpaper · Background texture · Corner ornament · Fold crease · Bookmark tab

---

## 📦 데이터 모델

```ts
type Book = {
  id: string
  shell: "wiki" | "magazine" | "newspaper" | "book" | "blank"
  renderMode: "scroll" | "flipbook"    // orthogonal to shell

  theme: {
    bgColor?: string
    bgTexture?: "none" | "paper" | "newsprint" | "dots" | "linen"
    accentColor?: string
    cardBorder?: "none" | "hairline" | "subtle" | "strong"
    cardRadius?: "sharp" | "soft" | "round"
    fontOverride?: { body?: string; display?: string }
    fontPair?: "default" | "classic" | "modern" | "editorial" | "bauhaus"
    textColor?: string
    quoteColor?: string
    cols?: 0 | 1 | 2 | 3 | 6  // 0 = shell default
    margins?: "narrow" | "standard" | "wide"
    chapterStyle?: "default" | "roman" | "numeric" | "ornament" | "rule"
  }

  decoration: {
    ribbon?: { show: boolean; color: string; position: "top" | "left" }
    endpaper?: { show: boolean; pattern: string }
    cornerOrnament?: { show: boolean; glyph: string }
    bookmarks?: Array<{ label: string; blockId: string; color: string }>
  }

  pages: Array<Page>                    // flipbook splits by pages; scroll ignores
  blocks: Block[]                       // flat array, referenced by cell
}

type Page = { id: string; blockIds: string[]; breakBefore?: boolean }

type Block = {
  id: string
  type: BlockType
  cell: { col: number; span: number; row?: number; rowSpan?: number }
  props: Record<string, unknown>
  content: string | Block[]
  style?: Partial<BlockStyle>
}
```

**핵심**: `renderMode` 필드는 Phase 1부터 존재. 값을 `"flipbook"`으로 바꿔도 Phase 4 전까지는 scroll로 렌더 (소프트 기본값).

---

## 🎨 Editor UX 3 무브

1. **Pick shell** → 전체 문서 transform. **모달 갤러리** with big previews. 명시적 "Change shell" 액션. 드래그 아님
2. **Edit blocks** → 인라인. 클릭=선택, 드래그=이동(grid 내), 엣지 핸들=span 리사이즈, `/`=새 블록 삽입
3. **Decorate** → 우측 레일 패널. 토글 + 피커. 데코레이션 free-drag 없음 (shell-approved 슬롯에 snap)

**UI 구분**:
- Shell picker: 문서 좌상단 "Magazine ▾"
- Block editing: 선택됐을 때만 인라인
- Decoration: 우측 사이드바, 명확한 섹션 헤더

**카디널 죄 회피**: 현재 wiki editor의 문제 (dashed border, hover-reveal 버튼, 중첩 +/× 곳곳) → 선택된 cell에만, one level at a time.

---

## 🗺 Phase 로드맵

### Phase 0 — 문서 정비 + 설계 확정 (현재 세션)

- [x] BRAINSTORM-2026-04-21-book-pivot.md 작성 (이 문서)
- [x] `docs/design-system/` 설치 (사용자 제공 zip)
- [ ] 기존 docs deprecation 마크 (multi-pane, magazine-layout, page-identity)
- [ ] CONTEXT / MEMORY / NEXT-ACTION / TODO 갱신
- [ ] `/pdca plan book-pivot` 실행

### Phase 1 — 데이터 모델 + "Wiki" → "Book" rename (big migration, 2-3 PR 분할)

**범위**:
- `WikiArticle` → `Book` 타입 rename
- `wiki-articles` slice → `books` slice
- `noteType: "note" | "wiki"` → `"note" | "book"` (enum 값 변경)
- Store migration v80 → v81: WikiArticle → Book 변환
  - `shell`: 기본값 `"wiki"` (기존 유지)
  - `renderMode`: `"scroll"` 고정
  - `theme`: `themeColor` → `theme.accentColor`로 이관, 나머지 defaults
  - `decoration`: 빈 객체
  - `pages`: 빈 배열
  - `blocks`: 기존 `WikiBlock[]` → 새 `Block[]` 변환 (cell은 임시로 `{col:1, span:12}` 전부)
  - ColumnStructure(`layout`) 폐기 → blocks[].cell로 이관
- Activity Bar "Wiki" 라벨 → "Book"
- 사이드바, URL 경로 (`/wiki/:id` → `/book/:id`), 컴포넌트 파일명
- `[[wikilinks]]`, `@mentions` resolver → Book 참조
- 기존 코드 `WikiArticle` 참조 전부 교체 (~80~120 파일 예상)
- `renderMode` 필드는 존재만 (Phase 4에서 활용)

**Scope 조심**:
- WikiCategory, WikiTemplate, wiki-collections 관련도 → Book prefix로 rename
- "Wiki" 문자열이 사용자 UI에 노출되는 모든 곳 (검색, 필터, 드롭다운, 빈 상태)
- 영어 UI면 "Book", 한국어면 "책" or "북"? → 사용자 결정 필요

**PR 분할 제안**:
- 1A: 타입 rename + slice rename + migration v81 (데이터)
- 1B: Activity Bar + URL + 사이드바 (UI chrome)
- 1C: 에디터/렌더러 파일명 + 컴포넌트 참조 (콘텐츠 영역)

### Phase 2 — Wiki Shell 정착 (기존 기능 유지 + Shell 레이어 도입)

- `Book.shell = "wiki"` 기본. 기존 렌더링과 동일한 결과
- `BookRoot → BookChrome → BookGrid → Cell → BlockRenderer` 컴포넌트 트리
- 12-col grid 인프라 (Layer 2):
  - CSS Grid 기반 + drag snap + span resize
  - Cell geometry 렌더링
- 기존 Infobox/TOC 블록 → `cell`로 위치 지정 (기본값: Infobox `{col: 9, span: 4}`, TOC `{col: 1, span: 3}`)
- Shell Picker 모달 (`Magazine ▾` 좌상단) — 이 시점엔 wiki/blank 2개만 선택 가능
- 편집 UX 3-무브 원칙 적용 (chrome은 선택된 cell에만)
- Theme 레이어 minimal: `bgColor`, `accentColor` 만 (나머지 Phase 3)

### Phase 3 — Magazine Shell (MVP 증명)

- Magazine chrome 블록 구현: masthead, nameplate, headline-deck-byline 트리오, drop-cap, pull-quote, full-bleed photo
- 12-col **asymmetric 프리셋**: 3-9 / 4-8 / 5-7 / 2-5-5 / 3-6-3 / 4-4-4
- Playfair + Merriweather 폰트 로드
- Magazine 기본 theme: cream bg `#faf7f0`, no card border
- Shell picker에 Magazine 추가
- Shell 전환 시 transform 로직 (기존 blocks는 `cell` 유지, chrome 블록은 새로 삽입)

**MVP 증명 기준**: wiki → magazine 전환했을 때 같은 콘텐츠가 잡지처럼 보이는지. 4-layer가 실제로 동작하는지.

### Phase 4 — Newspaper + Book Shell + **Flipbook render mode**

- **Newspaper shell**: flag, date strip, 6-col rigid grid, column rules (vertical), italic city prefix byline, headline tiers (Lead 96/Story 48/Sub 28/Brief 19), jump line
- **Book shell**: cover, half-title, title page, running header (verso/recto), page number, chapter opener with drop-cap + small-caps, body text justified + hyphenation + first-line indent, ornamental break, colophon
- **Flipbook render mode 구현**:
  - `<FlipbookViewer>` 래퍼 (어떤 shell이든 감쌈)
  - Page-split 로직 (content overflow 감지 + breakBefore 힌트)
  - `transform: rotateY()` + `perspective` 페이지 넘김 애니 (350-500ms)
  - Thumbnail strip (하단)
  - Zoom 컨트롤 (+/-)
  - Page counter ("7 / 128")
  - 플로팅 툴바 (fullscreen, download, share는 아이콘만)
  - 모바일 single page, 데스크탑 two-page spread

### Phase 5 — Decoration Layer + Blank Shell + "My Shell" 저장

- **Decoration Layer 전면**:
  - Ribbon (SVG, top/left, z-index above grid)
  - Endpaper (first/last spread pattern)
  - Background texture (paper, newsprint, dots, linen — SVG overlay)
  - Corner ornament (magazine flourish)
  - Fold crease (newspaper centerfold)
  - Bookmark tab (right-edge chapter name)
- **Blank shell**: 12-col grid + body fonts, nothing else (커스텀 작업 공간)
- **"My Shell" savable preset**:
  - 현재 `shell + theme + decor` 저장 (localStorage or 영구)
  - 이름 붙이기
  - 다른 문서에 적용
- Typography pair 5종 UI: default/classic/modern/editorial/bauhaus
- 블록 style 오버라이드 (shell-scoped)

### Phase 6 — Chrome 블록 성숙 + 기능 보강

- **Chrome 블록 편집 UX 성숙**:
  - 마스터헤드, 플래그, 커버 등 chrome 블록도 "편집 가능하지만 shell이 삽입" 패턴
  - 기본값 채워진 상태로 생성, 사용자가 inline edit
- **기존 기능 이관** (Phase 1 때 임시로 옮긴 것들 정리):
  - Wiki footnote → Book footnote
  - Wiki categories → Book categories (계층 트리 유지)
  - Wiki templates (`WikiTemplate`) → Book templates (shell + theme + chrome 조합)
  - `[[wikilinks]]` UI 텍스트 → "Book link" 또는 유지 (기술 용어 그대로)
- Hatnote / Navbox / Callout 12타입 (Phase 5 예정이었던 것 — chrome 블록으로 구현)
- 편집 히스토리 v1 (기존 PHASE-PLAN에 있던 것)

### Phase 7 — 완성도 + 노트 Split

- 노트 split (PHASE-PLAN에서 보류된 Must-TODO) — 위키 split 패턴 복사
- Smart link / LinkCard 개선
- Y.Doc 본 구현 (PoC → 프로덕션)
- 인사이트 허브 (P2, 원래 있던 것)

---

## ⚠️ 큰 Risk + 대응

### R1. 대규모 리네임 범위
- "Wiki" 문자열이 UI + 코드 + 데이터 곳곳에 박혀 있음 (~100파일+)
- 대응: Phase 1을 **3 PR로 쪼개기** (타입 → chrome → 콘텐츠). 각 PR은 머지 가능한 단위
- 자동화 가능한 grep rename 먼저, 수동 검토 나중

### R2. Store migration v81
- WikiArticle → Book 변환 시 **데이터 손실 0** 원칙
- 기존 `WikiBlock[]` + `ColumnStructure layout` → 새 `Block[]` with cell
- ColumnStructure의 컬럼 위치를 cell.col로 **정확하게** 변환해야 함 (1 cardless → col:1, span:12 / 2 cards → col:1, span:6 + col:7, span:6 etc)
- Migration 실패 시 **비상 rollback**: IDB 백업 (before-work 직전 필수)

### R3. Shell 전환 transform 규칙
- wiki → magazine 전환 시 사용자 콘텐츠(blocks) 보존 + chrome 블록만 교체
- 규칙: **사용자가 만든 블록은 절대 삭제 금지**. shell chrome은 shell 소속이므로 교체 가능
- chrome 블록 감별: `type`이 `masthead/flag/cover/...` 이면 shell 소속

### R4. Phase 3.1 pending 변경 처리
- 로컬 uncommitted 상당량 (2600+ lines, 06-16~17 작업분)
- 일부만 cherry-pick할지 PR #209로 그대로 머지하고 이후 일부 revert할지
- **제안**: PR #209로 그대로 머지 → Phase 1 시작 시 필요한 것만 살리고 나머지 Book 구조 리팩토링 때 자연 삭제
- 이유: git history 깔끔, revert보다 rewrite가 명확

### R5. 사용자 혼란 방지
- "내 위키가 어디 갔지?" — Phase 1 릴리즈 시 Activity Bar에 변경 공지 (일회성 배너)
- 데이터는 보존 (Book으로 투명 변환)
- 영어 "Wiki" → "Book" 용어 변화를 사용자 가이드 문서 한 페이지 준비

### R6. Flipbook 난이도
- Page-split 로직이 진짜 어려움 (CSS break-inside: avoid / overflow 감지 / 재시도)
- Phase 4까지 시간 벌기 — 데이터 모델만 Day 1에

### R7. 6 medium 전부 퀄리티 맞추기
- README의 RESEARCH.md 수준을 구현하려면 각 shell이 상당한 깊이 필요
- 현실적 접근: Phase 2/3에 wiki + magazine 퀄리티 집중 → Phase 4에 newspaper + book은 "OK" 수준 → Phase 5 이후 점진 개선
- 완벽한 newspaper grid (6-col with rules)는 구현 복잡 — MVP는 CSS grid-template-columns + border-right

---

## 🎯 디자인 Non-negotiables (SKILL.md 재확인)

1. **Opacity hierarchy, not color**, for text/icon importance
2. **Spacing, not borders**, for separation
3. **No gradients, no emoji in chrome, no scale-on-hover**
4. Frozen type scale: **11·12·13·14·14.5·15·16·19·23·28**
5. Transitions **120/160/200ms `ease`** — bg/opacity only, elements never move

이건 Book pivot에서도 동일하게 적용.

---

## ❓ 남은 결정 사항

1. **한국어 UI에서 "Book"을 어떻게 표기?** "Book" 유지 vs "책" vs "북"
2. **영어 "Wiki" → "Book" 용어 변경을 사용자에게 어떻게 공지?** 배너 / 설정 노트 / 릴리즈 노트 / 그냥 조용히
3. **기존 wiki-categories, wiki-templates 네이밍** — 전부 book으로? 일부 중립 단어로 ("categories", "templates")?
4. **Shell 타입 값**: `"wiki"` 유지? 또는 "article" / "encyclopedia"로 더 중립적?
5. **Magazine 폰트 Playfair + Merriweather** CDN load — 현재 Geist만 로드 → 추가 시 첫 로드 100~200KB 증가 OK?

→ 이 결정은 Phase 1 시작 전 `/pdca plan book-pivot`에서 AskUserQuestion으로 확정.

---

## 📚 참고 문서

- `docs/design-system/README.md` — 디자인 토큰 단일 진실
- `docs/design-system/ui_kits/plot-book/ARCHITECTURE.md` — 4-layer 구조 청사진
- `docs/design-system/ui_kits/plot-book/RESEARCH.md` — 6 medium reader expectations
- `docs/design-system/ui_kits/plot-book/*.jsx` — React 프로토타입 (Shells, Editor, Flipbook)
- `docs/design-system/colors_and_type.css` — CSS 변수 + 타입 유틸

**폐기된 문서** (이 문서가 대체):
- `docs/BRAINSTORM-2026-04-15-multi-pane-document-model.md` (Phase 3 per-column blocks)
- `docs/BRAINSTORM-2026-04-16-magazine-layout.md` (Phase 3.1 매거진 레이아웃 카탈로그)
- `docs/BRAINSTORM-2026-04-17-page-identity.md` (Tier 시스템 — Book의 Shell이 대체)
- `docs/BRAINSTORM-2026-04-14-column-template-system.md` (ColumnStructure 템플릿 — 12-col grid가 대체)

**참고용으로 남김 (일부 내용 흡수)**:
- `docs/BRAINSTORM-2026-04-14-entity-philosophy.md` — Note/Wiki 2-entity는 유지 (Note vs Book). 철학은 그대로
- `docs/BRAINSTORM-2026-04-14-wiki-ultra.md` — Hatnote/Ambox/Callout 설계는 Phase 6 chrome 블록에 흡수
- `docs/BRAINSTORM-2026-04-06.md` — 원본 브레인스토밍 (각주/인포박스/Library) — 일부 유효
