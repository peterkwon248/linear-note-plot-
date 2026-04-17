# Magazine Layout — 잡지식 꾸밈 시스템 (Phase 3.1 확장)

**날짜**: 2026-04-16
**상태**: 브레인스토밍 확정 (Q1~Q8 모두 결정) → Phase 3.1-A 착수 대기
**이전 문서**: `BRAINSTORM-2026-04-15-multi-pane-document-model.md` (Phase 3 완료 근거)

---

## 1. 배경

### 1.1 지금까지 완료 (PR #197~#208)

- **Phase 1**: `WikiTemplate` 데이터 모델 + 8 built-in 템플릿 + picker UI
- **Phase 2-1A/B**: `ColumnRenderer` + `WikiTitle` + `WikiThemeProvider` 인프라, 기존 1626줄 legacy 렌더러 삭제
- **Phase 2-2-A/B/C**: 컬럼 프리셋 토글 + 비율 드래그 + 블록 컬럼 간 드래그 + 컬럼 추가/삭제 + 메타→블록 통합 (Infobox/TOC가 `WikiBlockType`)
- **Phase 3**: per-column blocks 데이터 모델 전환. 각 컬럼이 자체 `blocks[]` + 독립 섹션 넘버링 + `name`/`themeColor`/`minHeight` 속성 보유. Migration v80

### 1.2 사용자 관찰 (2026-04-16)

> "지금 코드 보면 컬럼이 메트릭 카드 느낌으로 구현이 되어 있을 텐데, 잡지처럼 꾸밀 수 있는 방향으로."

**보충 1**: "메트릭 카드 느낌이 나쁘다고 꼬집은 건 아니야. 오히려 깔끔하고 좋은 부분이 있어."

**보충 2**: "다만 자유도가 좀 있어야 된다 이거지."

→ 현재 기본값은 유지. 그 위에 **꾸미고 싶을 때 꾸밀 수 있는 도구**를 추가.

### 1.3 2026-04-15 Phase 3.1 초안 (짧음)

기존 브레인스토밍 문서의 Phase 3.1 뼈대:

- Match heights (같은 행 컬럼 높이 일치)
- 이미지 블록 `fitMode: "content" | "fill"`
- Pane `explicit height` (px/vh)
- Pane 배경 이미지

→ **"높이 맞춤"에만** 머물러 있음. 잡지식 시각/타이포/블록 시스템으로 확장 필요.

---

## 2. 사용자 비전 확정 (2026-04-16 인터뷰)

### 2.1 "자유도 있어야" = 어디까지?

|  | A 프리셋만 | **B 블록/컬럼 속성 확장** ✅ | C 캔버스 자유 |
|---|---|---|---|
| 사용자 조작 | 선택만 | 선택 + 속성 편집 | 드래그 픽셀 좌표 |
| 표현력 | 낮음 | **중상** | 극단 |
| 구현 복잡도 | 낮음 | 중간 | 높음 |
| 노션 비교 | 노션 이하 | **노션과 동급** | 노션 초과 (Framer 계열) |
| 지식망 호환 | O | **O** | X (블록 위치 추적 난감) |

**B 확정**. 노션이 도달한 자유도 수준. Plot은 거기에 **축 2 (자동 지식망 + Zettelkasten)** 결합.

### 2.2 "기본값 유지 + 자유 옵션 레이어" 원칙

- 기본 렌더 = 현재 Phase 3 상태 그대로 (컬럼 gap 24px, 평평한 배경, 균일 비율)
- **아무것도 안 해도 깔끔** → 메모 앱 수준 UX 유지
- **켜고 싶은 사람은 켠다** → 잡지스럽게 꾸밈

### 2.3 "점점 노션화되는 거 아닌가" 걱정에 대한 답

- Plot = 축1 (블록 자유도) + 축2 (자동 지식망 + Zettelkasten + Reference + Discovery)
- 축1 확장 ≠ 노션화. 노션도 B 수준까지만 감 (절대 캔버스 X)
- **축2를 건드리지 않는 한 Plot 정체성 유지**. 본 Phase 3.1도 축2 영향 0

### 2.4 품질 원칙 — "위화감 없이 잘 되어야 해"

사용자 2026-04-16 인터뷰 최종 원칙: "디자인적으로, 기능적으로, 레이아웃이나 이런 게 위화감없이 잘 되어야 해."

본 Phase 3.1의 **전 구현 단계에 적용되는 5가지 품질 규칙**:

1. **조화(Harmony)** — 꾸밈 옵션이 단독이 아니라 **조합되어도 어긋나지 않아야**. 예: Drop cap + Serif 폰트 + Pull Quote가 같은 아티클에 있어도 통일감 유지. 각 PR에서 다른 PR 요소와의 조합 테스트
2. **여백 리듬(Vertical Rhythm)** — 블록 사이 수직 리듬 baseline grid 기반. 컬럼 간 gap 일관성 (sm/md/lg 토큰만). 임의 px 사용 금지
3. **의도성(Intentionality)** — 비대칭/themeColor는 **의도된 디자인 결정**으로 보여야. 랜덤 비율 금지, 프리셋만 (5:3, 황금비, 2:1, 5:2:2 등). themeColor는 palette에서만
4. **과하지 않음(Restraint)** — 장식을 위한 장식 금지. 기본이 깔끔해야 꾸밈도 돋보임. default 렌더는 현재 그대로 유지
5. **반응형 우아(Graceful Responsive)** — 화면 폭 줄어들면 컬럼 자동 접힘/재배치. 모바일에서 span 블록은 full-width. 어색한 wrap 방지

### 2.5 비대칭은 나쁜 게 아니다 — 디자인 언어로 승화

비대칭은 잡지 DNA의 핵심:
- 위키피디아 = 2:1 (본문+Infobox)
- 나무위키 = 1:3 (TOC+본문)
- 뉴욕타임즈 Op-Ed = 1:2:1 또는 2:3
- 균일(1:1:1) 3컬럼은 오히려 **대시보드 인상**

**위화감 vs 디자인** 차이:

| 위화감 ❌ | 디자인 ✅ |
|-----------|-----------|
| 무의미한 비어있는 컬럼 | 각 컬럼에 역할 (본문/메타/장식) |
| 같은 계층 블록들이 분산 | 컬럼별 정체성 (name/themeColor) |
| 랜덤한 비율 (3:7:2 같은) | 의도된 비율 (황금비 / 2:1 / 5:3) |
| 읽는 순서 혼란 | 시각 흐름 명확 (F패턴 / Z패턴) |

→ Phase 3.1-A에서 **Q1 C (name 설정된 컬럼만 헤더) + Q2 themeColor** 조합으로 "의도된 비대칭" 표현. 헤더/색상이 있는 컬럼 = 정체성 있는 컬럼, 없는 컬럼 = 본문.

---

## 3. 현재 상태 진단 (실물 preview 관찰)

Fleeting Note 3컬럼 편집 모드에서 보인 "메트릭 카드" 신호 — **이게 기본값 디폴트이고 그대로 OK**:

| 관찰 | 현재 구현 | 잡지 옵션 추가 시 효과 |
|------|-----------|------------------------|
| 컬럼 사이 24px gap | `gap: 1.5rem` | **옵션**: column rule 켜면 세로선, gap 좁힘 |
| 빈 컬럼 = 검은 박스 | empty placeholder + drop zone | **옵션**: `hideEmptyInRead` 토글, themeColor 칠 |
| 2:1:1 균일 비율 (main+side+side) | `buildColumnPreset` 고정 | **옵션**: asymmetric preset 추가 (5:3, 황금비) |
| 평평한 배경 | 공통 surface bg | **옵션**: per-column `themeColor` / `bg image` |
| 컬럼 헤더 없음 | name 속성 존재하지만 UI 미사용 | **옵션**: column header label 노출 |
| sans-serif 균일 | Inter 계열 | **옵션**: Serif block/pullQuote 토글 |
| 섹션 넘버링 teal accent | Phase 3에서 pane별 독립 | 그대로 유지 |

→ 기본 그대로, 옵션 ON 시 변화.

---

## 4. 잡지 DNA — 레퍼런스별 핵심 요소

| 레퍼런스 | 핵심 DNA |
|----------|----------|
| **뉴욕타임즈 Opinion** | Serif 본문 + Sans 제목 mix, drop cap, pull quote (대형 이탤릭), hairline column rule |
| **Kinfolk** | 과감한 white space, 대형 헤로 이미지, 캡션 이탤릭 small, asymmetric 비율 |
| **The New Yorker** | Drop cap + 본문 serif + 작은 caption + 세로선 + column rhythm |
| **Monocle** | Multi-column dense grid + 작은 헤더 + sidebar notes + 섹션 divider |
| **나무위키/위키피디아** | Infobox sidebar + TOC + 섹션 넘버링 + hatnote + navbox (Plot 현재 반영) |
| **Medium** | Clean sans serif 본문 + 큰 hero + full-bleed image + 드문 pull quote |

→ 공통 요소: **Serif/Sans mix, Drop cap, Pull Quote, Column rule, Asymmetric 비율, Full-bleed image, Caption italic**. 전부 **블록/컬럼 속성**으로 표현 가능 (절대 좌표 불필요).

---

## 5. Phase 3.1 범위 — 확장 요소 카탈로그

### 5.1 컬럼 꾸미기 (CSS + 속성만)

| 요소 | 설명 | 추가되는 속성 | 기본값 |
|------|------|----------------|--------|
| **Column rule** | 컬럼 사이 hairline 세로선 | `ColumnStructure.rule?: boolean \| { color, width }` | 없음 |
| **Per-column themeColor** | 컬럼별 배경 + accent | 이미 `ColumnDefinition.themeColor` 존재, UI 연결만 | 없음 |
| **Per-column name** | 컬럼 헤더 라벨 | 이미 `ColumnDefinition.name` 존재, 헤더 UI 추가 | hidden |
| **비대칭 비율 프리셋** | 5:3, 황금비(φ:1), 2:1, 5:2:2, 2:3:2 | `applyColumnPreset` 호출 시 preset 이름 확장 | equal |
| **Gap 튜닝** | `"compact" \| "comfortable" \| "spacious"` | `ColumnStructure.gap?: "sm" \| "md" \| "lg"` | md |
| **Background image** | Pane 배경 이미지 | `ColumnDefinition.bgImage?: { url, fit, opacity }` | 없음 |

### 5.2 블록 속성 확장

| 요소 | 설명 | 추가되는 속성 | 기본값 |
|------|------|----------------|--------|
| **spanColumns** | 블록이 여러 컬럼 가로지름 | `WikiBlock.spanColumns?: number \| "all"` | 1 |
| **fullBleed** | 컬럼 padding 무시 full-width | `WikiBlock.fullBleed?: boolean` | false |
| **image fitMode** | 이미지 블록 `content \| fill \| cover` | `WikiBlock.fitMode?` (image/hero 타입) | content |
| **dropCap** | 섹션 첫 문단 첫 글자 float-large | `WikiBlock.dropCap?: boolean` (text 타입) | false |
| **textStyle** | 본문 스타일 변주 | `WikiBlock.textStyle?: "body" \| "editorial" \| "caption"` | body |

### 5.3 신규 블록 타입

| 블록 타입 | 용도 | 시그니처 |
|-----------|------|----------|
| **`"pullQuote"`** | 큰 세리프 이탤릭 인용, 좌우 margin, span-across 옵션 | `{ text, attribution?, variant: "default" \| "editorial" \| "minimal" }` |
| **`"hero"`** | 헤더 배너 이미지 (crop 옵션 + 오버레이 title 옵션) | `{ src, caption?, height?, overlayTitle?: boolean }` |
| **`"divider"`** | 섹션 구분 ornamental divider | `{ variant: "line" \| "asterisks" \| "dots" \| "custom" }` |
| **`"caption"`** (optional) | 이미지/블록 밑 이탤릭 세리프 캡션 | `{ text, align }` |

### 5.4 타이포 시스템

| 요소 | 설명 | 추가되는 설정 | 기본값 |
|------|------|---------------|--------|
| **Serif/Sans toggle** | 본문/pull quote 세리프 전환 | `WikiArticle.typography?: "sans" \| "editorial" \| "serif-body"` | sans |
| **Display H2** | 섹션 제목을 display-size로 강조 | `WikiArticle.titleStyle.h2Scale?` | 현재 크기 |
| **Baseline rhythm** | 블록 사이 수직 리듬 통일 | CSS `--wiki-baseline` 변수 | auto |
| **Drop cap 스타일** | 대형 첫 글자 serif + scale | CSS `::first-letter` + body selector | - |

### 5.5 레이아웃 고도화 (기존 Phase 3.1 4항목)

| 요소 | 설명 | 속성 | 기본값 |
|------|------|------|--------|
| **Match heights** | 같은 행 컬럼 높이 일치 | `ColumnStructure.matchHeights?: boolean` | false |
| **Explicit pane height** | px/vh 지정 UI | `ColumnDefinition.explicitHeight?: number \| "vh-50"` | auto |
| **Image fitMode** | `"content" \| "fill"` (위 5.2와 중복) | 위와 동일 | content |
| **Pane bg image** | 위 5.1과 동일 | 동일 | 없음 |

---

## 6. 노트 `columnsBlock` (블록 레벨)도 같은 꾸밈 공유

### 6.1 팩트

`components/editor/nodes/columns-node.tsx` 존재. TipTap atom block. Insert → Columns. 이미 2-3 컬럼 지원.

### 6.2 공유 가능한 것 vs 아닌 것

| 요소 | 노트 columnsBlock (블록 레벨) | 위키 per-column blocks (문서 레벨) | 공유 가능? |
|------|------|------|-----------|
| column rule | CSS 적용 가능 | CSS 적용 가능 | ✅ |
| themeColor | TipTap attrs 추가 | 이미 `ColumnDefinition.themeColor` | ✅ (CSS 공유) |
| asymmetric 비율 | colWidth attrs 있음 | `ColumnDefinition.ratio` | ✅ (CSS 공유) |
| column name 헤더 | TipTap attrs 추가 가능 | 이미 있음 | ✅ |
| spanColumns | blockAttrs | `WikiBlock.spanColumns` | 각자 |
| pullQuote/hero/divider 블록 | TipTap nodes | wiki block types | 각자 (디자인 공유) |
| dropCap | CSS | CSS | ✅ |
| Serif/Sans | CSS 변수 | CSS 변수 | ✅ |

→ **CSS 디자인 토큰 공유, 데이터 모델은 각자**. `lib/magazine-tokens.ts` 같은 공용 토큰 파일 + 노트 extension + 위키 renderer 양쪽에서 참조.

---

## 7. 파괴적 변경 0 약속

- 기본 default 렌더는 지금과 동일
- 기존 article/note 데이터 migration 0 (새 속성은 전부 optional + default = off)
- column rule/themeColor/spanColumns 등 전부 **opt-in**
- 잡지 스타일이 부담스러운 사용자는 영향 없음
- Store version bump도 최소 (신규 블록 타입 3개 추가할 때만 v81)

---

## 8. PR 분할 제안

작업량 큼. 4개 PR로 쪼개는 게 안전:

### 8.1 Phase 3.1-A — 컬럼 꾸미기 기본 (CSS + UI 토글만)

**변경 범위**: `column-renderer.tsx`, `wiki-theme-provider.tsx`, 신규 `magazine-tokens.css` / `wiki-column-menu.tsx`

- **Column rule 토글** (세로선, opt-in, 컬럼 메뉴)
- **Per-column themeColor UI** — 컬럼 전용 별도 palette (6-8색 파스텔), "Set color" 메뉴, "Auto" 랜덤 옵션
- **Per-column name 헤더** — Q1 C 채택: `name` 설정 시에만 헤더 표시. uppercase 10-11px muted-foreground
- **비대칭 프리셋 추가** — 기존 equal split 외에 **5:3 / φ:1 (황금비) / 2:1 / 5:2:2 / 2:3:2** 추가
- **Gap 토글** (sm 16px / md 24px 현재 / lg 40px)
- 반응형 우아: 모바일(<640px)에서 3컬럼 자동 stack

**데이터**: 신규 속성 optional 추가만. Migration 0.
- `ColumnStructure.rule?: boolean`
- `ColumnStructure.gap?: "sm" \| "md" \| "lg"` (default md)
- `article.columnPalette?: string` (색 palette ID)
- `ColumnDefinition.themeColor` (기존 존재, UI만 연결)
- `ColumnDefinition.name` (기존 존재, 헤더 UI만 연결)

**품질 체크**: 2.4 원칙 적용
- 조화: name + themeColor + rule 조합 시 위화감 없어야
- 여백 리듬: gap 토큰만 사용
- 의도성: 비대칭 프리셋만 (자유 비율 드래그도 스냅 포인트 제공)
- 반응형: 모바일 자동 stack 우아

**크기**: M (약 1주)

### 8.2 Phase 3.1-B — 블록 속성 + Pull Quote 블록

**변경 범위**: `lib/types.ts` (`WikiBlock.spanColumns/fullBleed/dropCap`), `wiki-block-renderer.tsx`, 신규 `"pullQuote"` block type + migration v81

- `spanColumns` 구현 (CSS `grid-column: span N`)
- `fullBleed` 구현 (컬럼 padding 무시)
- `pullQuote` 블록 타입 추가
- AddBlockButton 메뉴에 Pull Quote 항목

**데이터**: `WikiBlockType` 확장 (`"pullQuote"` 추가). Migration v81 (무해, default off).
**크기**: M (약 1주)

### 8.3 Phase 3.1-C — Hero Image + Divider + Caption

**변경 범위**: 신규 block types + `wiki-block-renderer.tsx`

- `"hero"` block type (헤더 배너)
- `"divider"` block type (asterisks/dots/line)
- `"caption"` block type or image block attr

**데이터**: Migration v82 (신규 block types).
**크기**: M

### 8.4 Phase 3.1-D — Typography 시스템 + 높이 고도화

**변경 범위**: CSS 변수 + `WikiArticle.typography` attr + `column-renderer.tsx` (matchHeights)

- Serif/Sans/Editorial mix 토글
- Drop cap (CSS + block attr)
- Match heights + fitMode (기존 계획 흡수)
- Explicit height UI

**데이터**: `WikiArticle.typography?`, `ColumnStructure.matchHeights?` optional. Migration 0.
**크기**: M

### 8.5 Phase 3.1-E — 노트 columnsBlock 확장 (별도 PR, 위키 완료 후)

- 위키 3.1-A~D 만족스러운 결과 확인 후 착수
- 노트 TipTap `columnsBlock` attrs 확장 (themeColor, name, rule, asymmetric ratio)
- CSS 디자인 토큰은 위키와 **공유** (`lib/magazine-tokens.css`)
- Pull Quote / Hero / Drop cap은 노트에도 TipTap node로 추가

### 8.6 Phase 3.1-F — Built-in 템플릿 재구성 (마지막)

- 위키 Phase 3.1-A~E 전부 완료 후
- 현재 built-in 8종 삭제 → 새 built-in + Editorial/Magazine/Spread 잡지 프리셋 한 번에
- 모든 꾸밈 옵션을 활용한 "진짜" 템플릿 제공

---

## 9. 결정된 답변 (2026-04-16 인터뷰)

Q1~Q8 전부 결정. 요약 + 시사점:

### Q1 — 컬럼 헤더 라벨: **C (name 설정된 컬럼만 표시)**

- 기본은 헤더 숨김 (현재 깔끔 유지)
- 컬럼 메뉴 ⋯ "Set name" 설정하면 헤더 나타남
- 라벨 스타일: uppercase, 10-11px, muted-foreground, 위 `mb-2` 여백
- **비대칭 해결**: `name`/`themeColor` 조합으로 의도성 표현 (2.5 참조)

### Q2 — themeColor palette: **컬럼 전용 별도 팔레트 + 사용자 설정**

- Infobox 8색과 **분리된 컬럼 전용 palette** 제공
- 파스텔 계열 6-8색 (잡지 분위기 맞춰 연한 톤)
- 사용자 설정 모드 2가지:
  - **랜덤**: "Auto" 버튼 → 컬럼마다 palette에서 자동 선택
  - **수동**: 컬럼 메뉴 ⋯ "Set color" → 색 선택
- `article.columnPalette?` (default: 시스템 팔레트, 사용자 커스텀 가능)

### Q3 — Pull Quote 디자인: **A+B (variant 드롭다운 + Custom 완전 수동)**

- 기본값: **Minimal** (세리프 이탤릭 가운데 정렬, 장식 X)
- 드롭다운 variant: Minimal / NYT Editorial / Medium / **Custom...**
- "Custom..." → 사용자 직접 설정 (font-size, family, weight, alignment, color, border, padding)
- **Phase 3.2 or Phase 4 custom template editor와 통합** — "자신만의 위키 디자인 시스템" 완성
- Phase 3.1-B에서는 variant 3개 프리셋만 먼저 구현

### Q4 — Drop cap 범위: **C 기반 + A override (자유도 최대)**

- 전역 기반: `article.typography = "editorial"` 모드 켜면 **모든 섹션 첫 문단 자동 drop cap**
- 블록 예외 처리: 특정 block에서 drop cap 끄기 가능 (`block.dropCap: false` override)
- 즉: 한 번 설정으로 전체 변환, 예외만 수동

### Q5 — `spanColumns: "all"` 섹션 넘버링: **A (Floating, 넘버링 제외)**

- span 블록은 **어느 pane에도 안 속함**
- Section 타입 block이 span하는 경우는 **금지 또는 경고**
- Pull Quote / Hero / Divider / Image 등 장식성 블록만 span 허용

### Q6 — 노트 columnsBlock 확장: **B (별도 Phase 3.1-E PR)**

- 위키 Phase 3.1-A~D 완료 후 진행
- 위키에서 만족스러운 결과 나오면 노트에도 CSS/디자인 토큰 포팅
- 데이터 모델은 각자 (TipTap columnsBlock attrs vs WikiArticle.layout)

### Q7 — Serif 폰트: **B (next/font/google 자체호스팅)**

- 라틴: **Merriweather** (잡지/편집 느낌, readable)
- 한글: **Noto Serif KR** (고품질 한글 serif, Noto 계열)
- `next/font/google`로 빌드 시 자체호스팅 → 런타임 오프라인 OK
- `font-display: swap` + 서브셋팅으로 번들 최소화
- 기본 sans는 현재 Inter 유지

### Q8 — Built-in 템플릿: **삭제 → 나중에 풍성히 재구성** 🔴

- 현재 8종 (Blank/Encyclopedia/Person/Place/Concept/Work/Organization/Event) **허접함** 사용자 평가
- Phase 3.1 끝나고 **기능 + 디자인 확정 후** 빌트인 + 잡지 프리셋 **한 번에** 재구성
- 별도 phase로 분리: **"Phase 3.1-F — Built-in 재구성"** (Phase 3.1-E 뒤)
- Phase 3.1-F에서 포함될 것:
  - 기존 8종 삭제
  - 새 built-in 설계 (themeColor + layout + Pull Quote 샘플 포함된 진짜 템플릿)
  - Editorial / Magazine / Spread 잡지 프리셋 추가
  - Person / Place 같은 typed 템플릿도 새 레이아웃으로 재구성
- 영향:
  - `lib/wiki-templates/built-in.ts` 삭제 or Blank만 남김
  - `WikiTemplatePickerDialog` 간소화 or 임시 hide
  - `wikiTemplates` slice는 Phase 4 사용자 커스텀용으로 유지
  - `templateId` 필드 optional이라 지워도 데이터 손상 없음
  - Migration 불필요

---

## 10. 구현 안 하는 것 (명시)

- ❌ Absolute positioning (캔버스식 자유 배치)
- ❌ 블록 회전 / z-index
- ❌ 블록 픽셀 좌표 배치
- ❌ 글로벌 "Theme" 시스템 재설계 (현재 color tokens 유지)
- ❌ 기존 블록 스타일 대체 (전부 opt-in 옵션)

---

## 11. 사용자 확인 (2026-04-16 완료)

- [x] 프레임 "기본값 유지 + 꾸밈 옵션 레이어" 동의
- [x] B 레벨 자유도 (블록/컬럼 속성 확장) 확정
- [x] 5장 요소 카탈로그 (모두 Phase 3.1 범위에 포함)
- [x] 8장 PR 분할 순서 (A → B → C → D → E → F)
- [x] 9장 8개 질문 전부 결정
- [x] 2.4 품질 원칙 5가지 수용
- [x] 2.5 비대칭 = 디자인 언어 관점 수용

**→ Phase 3.1-A 착수 가능 상태**

---

## 참조

- `BRAINSTORM-2026-04-14-column-template-system.md` — Phase 1~2-2-C 설계 (메타→블록 통합 대결정 포함)
- `BRAINSTORM-2026-04-15-multi-pane-document-model.md` — Phase 3 설계 (per-column blocks, Phase 3.1 짧은 뼈대)
- `BRAINSTORM-2026-04-14-entity-philosophy.md` — Note/Wiki 2-entity 확정 (이 문서에서도 유지)
- 2026-04-16 Claude Opus 4.6 세션 — 본 브레인스토밍 인터뷰
- 뉴욕타임즈/Kinfolk/The New Yorker/Monocle editorial layout (레퍼런스 DNA)
