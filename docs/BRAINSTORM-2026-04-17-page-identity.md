# Page Identity — 타이틀+본문 일체감 + 위키/잡지 레이어 시스템

**날짜**: 2026-04-17
**이전 문서**: `BRAINSTORM-2026-04-16-magazine-layout.md` (Phase 3.1 Magazine Layout)
**상태**: Step 1 + Step 2 착수 확정

---

## 1. 배경 — 사용자 관찰 (2026-04-17)

> "타이틀은 기존의 검은 배경에 글자 하얀색 고정인데 밑에 카드만 배경색이 바뀌는 느낌이잖아? 어떻게 하면 위키나 잡지 느낌으로 갈 수 있지?"

### 현재 구조

```
┌─ Article shell ─────────────┐
│ Title  (검은 배경 고정)       │ ← 색 영향 없음
│ Aliases                     │
│ Categories                  │
│ Split toolbar               │
├─ Body (layout cards) ───────┤
│ ┌ Infobox ┐                 │ ← 개별 색 가능
│ ┌ TOC ────┐                 │ ← 개별 색 가능
│ ┌ Card 1 ┐┌ Card 2 ┐        │ ← 카드별 색 가능
└─────────────────────────────┘
```

**문제**: Top chunk(Title+meta)는 테마 영향 밖. 하체(카드)만 색이 바뀌어 "상체-몸통 따로 노는" 느낌.

---

## 2. 위키 vs 잡지 DNA

| 구분 | 위키피디아/나무위키 | 잡지 (NYT Magazine / Kinfolk / Monocle) |
|---|---|---|
| Title | 상단 bold, 배경 없음 | 대형, 배경/이미지 위에 overlay |
| Body | 균일 본문 + Infobox 사이드 | Column grid + drop cap + pull quote |
| Identity | **약함** — 사이트 공통 | **강함** — 페이지 자체가 브랜드 |
| Opening | 없음 (바로 본문) | Hero / Opening spread |

Plot의 **"기본값 유지 + 꾸밈 옵션 레이어"** 원칙에 따라 **둘 다 가능**해야 함.

---

## 3. Identity Tier 시스템 (확정)

```
Tier 0 — default              깔끔한 위키, 색 없음
Tier 1 — Article themeColor   전체 은은한 tint (4-6%)
Tier 2 — Card palette         특정 카드 강한 색 (on top of Tier 1)
Tier 3 — Hero / Opening       잡지 opening spread (나중에)
Tier 4 — Full-bleed image     배경 이미지 (Hero 안 or cover)
Tier 5 — Custom template      Phase 4 사용자 커스텀
```

Article theme 위에 Card palette 얹힘 = cascade. 이게 "위키/잡지" 양쪽 커버.

---

## 4. 단계별 실행

### Step 1 (이번 PR) — WikiThemeProvider 배경 tint 적용

- `.wiki-theme-scope` 루트에 `color-mix(in srgb, var(--wiki-theme-active) ~5%, transparent)` 배경
- themeColor 없으면 자동 no-op (transparent)
- Title 영역도 같은 `<article>` 안 → 자연히 덮임 → 상체-몸통 일체감 즉시 해결

### Step 2 (이번 PR) — Article → Card cascade 검증

- Card palette(`wiki-column-cell--themed::before`)는 이미 ::before 오버레이로 얹힘
- Article tint 위에 Card tint가 얹히는 구조가 자연스럽게 형성됨
- 필요 시 mix-blend-mode 또는 opacity 조정

### Step 3 (다음 PR — Phase 3.1-C 경) — Hero / Opening 영역

Title + Aliases + Categories를 **Hero 블록**으로 승격:

```ts
article.hero?: {
  backgroundColor?: string
  image?: { src, fit: "cover" | "contain", opacity }
  height?: "sm" | "md" | "lg" | number
  titleSize?: "default" | "display" | "mega"
  overlay?: boolean  // title을 이미지 위에 얹을지
}
```

잡지 opening spread 완성.

### Step 4 (Phase 4) — Title 블록화 옵션

사용자가 원하면 title을 블록으로 다룰 수 있는 자유 레이아웃 (2026-04-15 대결정 재검토 여지).

---

## 5. 제외 (명시)

- ❌ Title을 지금 블록화 (대결정 뒤집기 부담)
- ❌ Article background 단독 필드 (Hero가 상위 호환)
- ❌ 캔버스 자유 배치 (Plot 정체성 밖)

---

## 6. 진실의 원천

- `BRAINSTORM-2026-04-16-magazine-layout.md` — Phase 3.1 Magazine Layout 카탈로그
- `BRAINSTORM-2026-04-14-column-template-system.md` — Card + Block 철학
- 이 문서 — Title/Body 일체감 해결 + Tier 시스템 확정
