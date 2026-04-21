# 🎯 Next Action

> **이 파일은 before-work가 가장 먼저 읽고, after-work가 마지막에 갱신한다.**
> 다음 세션 시작 시 "지금 바로 뭐 해야 하지?"의 답.
> 항상 1~3개의 immediate next action만. 큰 그림은 docs/MEMORY.md.

---

**Last Updated**: 2026-04-21 (🔴 **Book Pivot 대결정** — Wiki 시스템 전면 개편. 4-layer 아키텍처 + 5 Shell + Flipbook. 진실의 원천: `BRAINSTORM-2026-04-21-book-pivot.md`)

---

## 🔴 이번 세션의 대결정 (2026-04-21)

**"Wiki" → "Book" 전면 개편**. 자세한 내용: `docs/BRAINSTORM-2026-04-21-book-pivot.md`

- 4-layer 아키텍처: Shell / Grid / Blocks / Decoration
- 5 Shells (wiki / magazine / newspaper / book / blank) + Flipbook (render mode)
- 12-col snap grid
- 기존 Phase 3.1 로드맵 폐기, 새 Phase 1~7 로드맵 수립
- Flipbook은 Phase 1에 데이터 필드만 예약, 구현은 Phase 4

---

## 🎯 다음 세션 시작하면 바로 할 것

### Step 1 — 현재 pending 변경 정리 (PR #209)

로컬에 uncommitted 있음 (Phase 3.1-A/B + Page Identity 작업분 ~2600 lines).

**결정 필요**: 그대로 PR #209로 머지 vs 버림 vs 일부만 cherry-pick
- **권장**: 그대로 머지 → Phase 1 시작 시 Book 구조 리팩토링 중 자연 삭제. git history 깔끔
- 이유: revert보다 rewrite가 명확. block-menu primitives처럼 살려야 할 부분도 있음

Step 1 완료 = PR #209 merge to main.

### Step 2 — `/pdca plan book-pivot` 실행

`BRAINSTORM-2026-04-21-book-pivot.md`의 "❓ 남은 결정 사항" 5개를 AskUserQuestion으로 확정:

1. 한국어 UI에서 "Book" 표기 (영어 유지 / "책" / "북")
2. 사용자 공지 방식 (배너 / 릴리즈 노트 / 조용히)
3. wiki-categories, wiki-templates 네이밍 (book prefix / 중립 단어)
4. Shell 타입 `"wiki"` 이름 유지 여부 (중립 "article" 등 대안)
5. Magazine 폰트 Playfair + Merriweather CDN load OK?

확정 후 PDCA plan 작성.

### Step 3 — Phase 1 착수 (3 PR 분할)

**Phase 1A**: 타입 rename + slice rename + Store migration v80
- `WikiArticle` → `Book`
- `wiki-articles` slice → `books` slice
- `noteType: "wiki"` → `"book"`
- Migration: 기존 WikiArticle → Book 변환 (shell: "wiki", renderMode: "scroll", cell 변환)

**Phase 1B**: Activity Bar + URL + 사이드바
- Activity Bar 라벨 "Wiki" → "Book"
- URL `/wiki/:id` → `/book/:id`
- 사이드바 컴포넌트

**Phase 1C**: 에디터/렌더러 파일명 + 컴포넌트
- `components/wiki-editor/*` → `components/book-editor/*`
- 에디터 티어 `wiki` → `book`
- `[[wikilinks]]`, `@mentions` resolver 업데이트 (UI 텍스트)

---

## 🔴 잊지 말 것 (이번 세션 핵심 결정)

### Non-negotiables (SKILL.md 재확인)

1. **Opacity hierarchy, not color**, for text/icon importance
2. **Spacing, not borders**, for separation
3. **No gradients, no emoji in chrome, no scale-on-hover**
4. Frozen type scale: **11·12·13·14·14.5·15·16·19·23·28**
5. Transitions **120/160/200ms `ease`** — bg/opacity only, elements never move

### Book Pivot 핵심 원칙

- **Shell = 데이터 선택** (`shell: "magazine"`), 컴포넌트가 아님. 렌더러가 값으로 분기
- **Editor UX 3 명확한 무브**: Pick shell / Edit blocks / Decorate
- **선택된 cell에만 chrome**: dashed border, hover-reveal 버튼, +/× 곳곳 금지 (카디널 죄)
- **Decoration = non-flowing, 순수 시각**: `pointer-events: none`, absolute overlay
- **renderMode는 day 1 데이터 필드로 예약** (Phase 4 구현): bolt-on 방지

### 살려야 할 현재 작업분 (PR #209 머지 후)

- `components/wiki-editor/block-menu.tsx` primitives → Book에서 재활용
- Article themeColor tint 아이디어 → `Book.theme.bgColor` + `accentColor`로 이관
- Card palette 16색 → Magazine Shell 내 cell 배경색으로 살림

### 폐기되는 것

- `WikiLayout` / `ColumnStructure` (12-col grid가 대체)
- `ColumnPresetToggle` (Shell picker가 대체)
- `WikiTemplate` scalar (Book.theme + chrome 블록으로 재구성)
- Phase 3 per-column blocks 모델 (v80 migration 안 함)
- Phase 3.1-C Hero (Shell이 담당)

---

## 🎨 현재 Phase 진행 상황

### Book Pivot (신규, 2026-04-21 ~)

- [ ] **Phase 0** (이번 세션) — 문서 정비 ✅ 거의 완료, pending 변경 정리 + PDCA plan 남음
- [ ] **Phase 1** — 데이터 모델 + "Wiki" → "Book" rename (3 PR 분할)
- [ ] **Phase 2** — Wiki Shell 정착 + 12-col grid 인프라
- [ ] **Phase 3** — Magazine Shell (MVP 증명)
- [ ] **Phase 4** — Newspaper + Book Shell + Flipbook render mode
- [ ] **Phase 5** — Decoration Layer + Blank Shell + "My Shell" savable
- [ ] **Phase 6** — Chrome 블록 성숙 + 기존 기능 이관 (footnote, categories, templates)
- [ ] **Phase 7** — 완성도 + 노트 Split + Y.Doc 본 구현

### 폐기된 Phase (2026-04-15 ~ 2026-04-17 진행분)

- ~~Phase 3 Multi-pane Document Model (per-column blocks)~~
- ~~Phase 3.1-A/B/C/D/E/F (Magazine Layout 카탈로그)~~
- ~~Phase 4 사용자 커스텀 템플릿 편집기~~
- ~~Phase 5 나무위키 잔여 (Hatnote/Navbox/Callout)~~ — Book Phase 6 chrome 블록으로 흡수

---

## 🟡 보류 중

- **Y.Doc 본 구현** (PoC→프로덕션) — Book Phase 7로 이동
- **인사이트 허브** (온톨로지 Single Source of Insights) — Book 이후
- **노트 Split 기능** — Book Phase 7
- **Library FilterPanel Notes 수준** — Book 이후

---

## 📚 필수 참고 파일

- `docs/BRAINSTORM-2026-04-21-book-pivot.md` — **진실의 원천**
- `docs/design-system/README.md` — 디자인 토큰 단일 진실
- `docs/design-system/ui_kits/plot-book/ARCHITECTURE.md` — 4-layer 청사진
- `docs/design-system/ui_kits/plot-book/RESEARCH.md` — 6 medium reader expectations
- `docs/design-system/ui_kits/plot-book/*.jsx` — React 프로토타입
