# 🎯 Next Action

> **이 파일은 before-work가 가장 먼저 읽고, after-work가 마지막에 갱신한다.**
> 다음 세션 시작 시 "지금 바로 뭐 해야 하지?"의 답.
> 항상 1~3개의 immediate next action만. 큰 그림은 docs/MEMORY.md.

---

**Last Updated**: 2026-04-17 저녁 (Phase 3.1-A 대폭 진행 — Card rename / Asymmetric UI / block-menu primitives / width+density / page identity tint + picker. PR 제출 후 Step 3 Hero 또는 Phase 3.1-A 잔여에서 시작)

---

## 🎯 다음 세션 시작하면 바로 할 것

### 선택 1 (권장) — Phase 3.1-C 진입: Hero / Opening 영역

**배경 필수 읽기**: `docs/BRAINSTORM-2026-04-17-page-identity.md` (Tier 시스템)

**한 줄 요약**: Article themeColor tint로 "상체-몸통 일체감"은 해결됐지만 **잡지 opening spread 느낌**은 아직. Title + Aliases + Categories를 **Hero 블록**으로 승격해서 배경 color/image/height 조절 가능하게.

**스펙 초안** (다음 세션에서 구체화):
```ts
WikiArticle.hero?: {
  backgroundColor?: string            // solid color (또는 themeColor와 연동)
  image?: { src: string; fit: "cover" | "contain"; opacity?: number }
  height?: "sm" | "md" | "lg" | number // px or preset
  titleSize?: "default" | "display" | "mega"
  overlay?: boolean                    // title을 이미지 위에 얹기
  align?: "left" | "center"
}
```

**구현 순서**:
1. 타입 추가 + 기본 렌더 (배경색/height만)
2. Image 지원 (attachment ID 재사용)
3. 우상단 ⋯ 메뉴에 Hero 설정 popover
4. Overlay 모드 (title 이미지 위)

---

### 선택 2 — Phase 3.1-A 잔여 마무리 (작은 단위)

**남은 항목**:
- **Column rule 토글** — 카드 사이 hairline 세로선 (이미 `node.rule` 타입 + `.wiki-column-grid--ruled` CSS 있음 — UI 토글만 추가)
- **Gap 토글** — sm/md/lg 간격 (`node.gap` 타입 + `.wiki-column-grid--gap-*` CSS 있음 — UI만)
- **Per-column name 헤더** — `ColumnDefinition.name` 설정 시 컬럼 상단 uppercase 10-11px 라벨. `.wiki-column-name` CSS 이미 존재
- **WikiColumnMenu에 위 항목 노출** — 이미 파일 존재, 확장만

이건 작은 단위라 1-2 PR로 처리 가능. Hero(선택 1) 전이나 후나 OK.

---

## 🔴 잊지 말 것 (이번 세션 핵심 결정)

### Identity Tier 시스템 (BRAINSTORM-2026-04-17)

```
Tier 0 (default)         - 깔끔한 위키, 색 없음
Tier 1 (Article theme)   - ✅ 전체 은은 tint (5%), 타이틀 🎨 picker (구현 완료)
Tier 2 (Card palette)    - ✅ 카드 ⋯ 메뉴 palette (cascade on Tier 1)
Tier 3 (Hero)            - ⏳ 다음 — Opening spread
Tier 4 (Full-bleed img)  - 미래 — Hero 확장
Tier 5 (Custom template) - Phase 4
```

### 공통 ⋯ block-menu primitives (신규)

`components/wiki-editor/block-menu.tsx` — `MenuSurface / MenuSection / PresetGrid / MenuAction / MenuDivider` + 공용 상수 `WIDTH_OPTIONS / FONT_SIZE_OPTIONS / DENSITY_OPTIONS`. 새 블록 추가 시 이걸 사용해 시각 일관성 유지.

### "Card" 용어 (UI only)

UI에서 위키 layout-level column은 **"card"** (노트 columnsBlock과 구분). 내부 타입 `ColumnStructure` 등은 그대로. 새 UI text 쓸 때 "card"로 통일.

### SectionNumbers Context

`components/wiki-editor/section-numbers-context.ts` — column-group 내부 섹션이 article 전체 번호 체계 따르도록 Context 소비. 새 nested 블록 타입 추가 시 고려.

### addWikiBlock 위치 보존

`afterBlockId` 있으면 leaf 내 `loc.index + 1`에 insert. "맨 아래" append 동작은 `afterBlockId` 없을 때만. 새 insert 경로 추가 시 afterBlockId 전달 주의.

---

## 🎨 현재 Phase 진행 상황

### Phase 3.1 Magazine Layout (진행 중)

- [x] **Phase 3.1-A** (컬럼 꾸미기 기본) — **대부분 완료**
  - [x] Card rename (UI)
  - [x] Asymmetric 프리셋 UI 폴리싱 (mini bar + grouping)
  - [x] Per-column themeColor UI (WikiColumnMenu)
  - [x] Per-column name 필드 (타입만)
  - [x] Article-level themeColor picker + background tint
  - [ ] Column rule 토글 (UI)
  - [ ] Gap 토글 (UI)
  - [ ] Per-column name 헤더 UI
- [x] **Phase 3.1-B 부분** (블록 속성 확장) — 일부
  - [x] `WikiBlock.width` + Infobox/TOC 프리셋/드래그
  - [x] `WikiBlock.density` + Infobox/TOC spacing 3단계
  - [x] `WikiBlock.fontSize` TOC 적용
  - [x] 공통 ⋯ block-menu primitives
  - [ ] Pull Quote 블록
  - [ ] spanColumns / fullBleed / dropCap
- [ ] **Phase 3.1-C** (Hero + Divider + Caption) — **다음 유력**
- [ ] **Phase 3.1-D** (Typography + matchHeights)
- [ ] **Phase 3.1-E** (노트 columnsBlock 확장)
- [ ] **Phase 3.1-F** (Built-in 템플릿 재구성)

---

## 🟡 보류 중

- **Y.Doc 본 구현** (P0, PoC→프로덕션) — Phase 3.1 풍성해진 후 진입
- **인사이트 허브** (P2) — 온톨로지 Single Source of Insights
- **노트 Split 기능** (Phase 7) — WikiSplitPage 패턴 복사
- **Title 블록화** (Phase 4) — 대결정 재검토 여지, 지금은 최상단 고정 유지

---

## 참고 파일 (Hero 구현 시)

- `lib/types.ts` — `WikiArticle` 타입에 `hero?` 추가
- `components/wiki-editor/wiki-title.tsx` — Hero 모드 rendering 분기
- `components/wiki-editor/wiki-article-renderer.tsx` — Hero가 있으면 padding/layout 조정
- `app/globals.css` — `.wiki-hero` 클래스 (배경/overlay/height)
- `lib/store/slices/wiki-articles.ts` — `setHero(articleId, patch)` action
- `lib/attachment-store.ts` — 이미 이미지 첨부 지원, 재사용
