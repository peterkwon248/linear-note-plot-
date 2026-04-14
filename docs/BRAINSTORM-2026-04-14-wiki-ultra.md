# Plot Wiki Ultra Brainstorming — 2026-04-14 (아침)

> ## ⚠️ 부분적 DEPRECATED — 2026-04-14 저녁 재설계
>
> **이 문서의 프레임(3-layer 모델 + 레이아웃 프리셋 독립 선택지)은 폐기됨.**
>
> **새 진실의 원천**: [BRAINSTORM-2026-04-14-column-template-system.md](./BRAINSTORM-2026-04-14-column-template-system.md)
>
> **폐기 요약**:
> - "3-layer 모델 (Layout / Content Template / Typed Infobox 분리)" → 통합 모델로 교체 (컬럼+섹션배치=템플릿)
> - "D-3 wiki-color를 독립 레이아웃 프리셋으로 추가?" 질문 → 컬럼 시스템에 흡수되어 폐기
> - Phase 계획 재구성 → 이 문서 하단 Phase 계획은 무효 (새 문서 참조)
>
> **여전히 유효한 내용** (참조용 보존):
> - 축 A (배너/Hatnote/Ambox/Navbox) 설계 — 새 Phase 계획에 흡수
> - 축 B (대표 이미지, themeColor cascade, 섹션 구분 행) 설계 — 이미 완료됐거나 새 Phase에 포함
> - 실측 CSS 수치 덤프 (위키피디아/나무위키 DNA) — 스타일 레퍼런스로 유효
> - 선행 조건 0.1 (WikiInfobox 저장 버그) — 아직 유효, 새 Phase 1에 포함
>
> 아래 원본 내용은 **히스토리 보존** 목적으로 남겨둠.

---

## Context

### 이전 결정 체인 (시간순)
- **2026-04-06** — `BRAINSTORM-2026-04-06.md` 원본 (108줄). Section 8 "인포박스 고도화 → 나무위키 프로필 수준" 4항목 + Section 9 "나무위키 틀 시스템" 7유형 표
- **2026-04-12** — 위키 레이아웃 프리셋 통합은 "공유 유틸 추출" 방식으로 결정 (Default + Encyclopedia 병존 유지)
- **2026-04-14 오전** — `.omc/notepad.md` Tier 1~4 체계화, `1a16b9b` 커밋으로 `docs/MEMORY.md` + `docs/CONTEXT.md`에 기록. 아키텍처 결정 2건: (a) 모든 새 기능 = base 티어, (b) Insert 레지스트리 단일화
- **2026-04-14 오후** — 본 문서. 3축(배너/디자인/편집) 심화 + 실측 CSS 수치 확보 + Top 7 + 구현 Phase

### 현재 Plot 인포박스 구조 (코드 조사, 2026-04-14)

**이중 구현체** — 하나로 통일되지 않은 상태:

| 구현체 | 파일 | 용도 | 저장 경로 |
|--------|------|------|----------|
| TipTap 블록 `InfoboxBlockNode` | `components/editor/nodes/infobox-node.tsx` | 에디터 내부 블록 (노트/위키 공용) | TipTap 문서 JSON |
| React 컴포넌트 `WikiInfobox` | `components/editor/wiki-infobox.tsx` | WikiArticle 사이드바/Encyclopedia 레이아웃 float | `WikiArticle.infobox` / `Note.wikiInfobox` |

**두 구현의 데이터 구조 (모두 `{ key/label: string, value: string }` plain text)**:
```typescript
// lib/types.ts
interface WikiInfoboxEntry { key: string; value: string }        // line 18-21
WikiArticle.infobox: WikiInfoboxEntry[]                          // line 143
Note.wikiInfobox: WikiInfoboxEntry[]                             // line 214
Reference.fields: Array<{ key: string; value: string }>          // line 255

// infobox-node.tsx line 11-14
interface InfoboxRow { label: string; value: string }            // 이름만 다름, 구조 동일
```

**선행 수정 필수 버그 (Explore agent 발견)**:
- `wiki-infobox.tsx:17` `setWikiInfobox`(Note slice) 호출 → Encyclopedia 레이아웃에서 WikiArticle ID를 노트 ID로 잘못 전달해 저장 실패 가능성
- `InfoboxRow` / `WikiInfoboxEntry` 타입 통일 필요 (같은 구조, 다른 이름)
- `wiki-to-tiptap.ts:10` WikiArticle → Note 변환 시 infobox를 일반 table로 변환 → `InfoboxBlockNode`로 변환하도록 개선

**등록 티어**: `shared-editor-config.ts`에서 `InfoboxBlockNode`는 **wiki 티어(라인 464) + note 티어(라인 654) 양쪽 등록**. 즉 base 티어 전환은 **선택적**이지 필수 아님. 단, 일관성을 위해 base로 승격 권장.

---

## 3축 Gap 분석 (배너 / 위키 디자인 / 위키 편집)

### 축 A — 배너 (Banner/Box/Hatnote 계열)

5가지 카테고리:

**A-1. Hatnote (문서 상단 소형 안내, Wikipedia 표준)**
Wikipedia 철학: "Hatnotes serve UI role, not content." `{{About}}`, `{{Distinguish}}`, `{{For}}`, `{{See also}}`, `{{Main}}`, `{{Further}}` 6종. 나무위키 `틀:상위 문서`, `틀:하위 문서`, `틀:다른 뜻` 3종 추가.
- 현재 Plot: 없음
- 도입: `WikiArticle.hatnotes: Array<{type, text, targetId}>` + italic 회색 indent 1.6em 렌더
- 난이도 Easy × Impact High

**A-2. 안내 박스 (경고/주의/스포일러)**
나무위키: `틀:스포일러`, `틀:경고`, `틀:주의`. Obsidian: Callout 12타입(note/info/tip/success/question/warning/failure/danger/bug/example/quote/abstract/todo).
- 현재 Plot: Callout 있음 (타입 수 미확인)
- 도입: 기존 Callout에 12타입 variant 확장 + 타입별 아이콘/색상 (CSS variable)
- 난이도 Easy × Impact Medium

**A-3. 문서 상태 배너 (Article Message Box)**
Wikipedia Ambox: Stub/Cleanup/Unreferenced/Orphan/Merge/Featured. 좌측 10px 세로 색상 스트립으로 severity 표현.
- 현재 Plot: `isWikiStub()` 휴리스틱만, 배너 없음
- 도입: `WikiArticle.completeness` 필드 + **자동 계산 배너** (orphan = 백링크 0, unsourced = 각주 0, stub = 블록 ≤4)
- 난이도 Easy × Impact Medium

**A-4. 네비게이션형 배너 (Navbox, 하단 collapsible)**
Wikipedia 3단계 계층 (title #ccccff / group #ddddff / subgroup #e6e6ff). 나무위키는 카테고리 기반 자동 수집.
- 현재 Plot: 없음. WikiCategory 계층 트리 있으나 문서 하단 렌더 안 됨
- 도입: `NavBoxBlock` TipTap 노드 + `{items?: string[], sourceCategoryId?: string}` 수동/자동 겸용
- 난이도 Medium × Impact High
- **시리즈 박스 (4-06 BRAINSTORM Section 9) 흡수**: `sourceCategoryId` 옵션으로 통합

**A-5. 미학적 배너 (독립 블록)**
Notion page cover + Linear feature highlight 감성. 배경색/그라데이션 + 큰 타이틀 + 부제 + 선택적 아이콘.
- 현재 Plot: 없음
- 도입: `BannerBlock` 독립 TipTap 노드 (base 티어) + `/banner` 슬래시
- 난이도 Medium × Impact Medium

### 축 B — 위키 디자인 (Rendering/Layout)

**B-1. 대표 이미지 + 캡션 (Universal Pattern)**
나무위키/위키피디아/Scrapbox 공통. 인포박스 상단 `<figure>` + italic 캡션.
- Plot: 없음. `InfoboxNode.heroImage?: {url, caption, alt}` 추가 필요
- 추가 제안: 노트/위키 문서 `coverImage` 자동 추출 (첫 ImageBlock src → 갤러리/호버 프리뷰 활용, Scrapbox 4-A 패턴)
- 난이도 Medium × Impact High

**B-2. 색상 주권 (themeColor 시스템)**
나무위키 고유 감성. 문서 주제 컬러가 인포박스 헤더/섹션 구분/Navbox에 cascade.
- Plot: 없음 (현재 인포박스 단일 회색)
- 도입: `WikiArticle.themeColor?: {light: HEX, dark: HEX}` + CSS variable `--plot-doc-theme-color` cascade
- 난이도 Medium × Impact High
- **주의**: Plot Linear 미니멀 톤 유지 — 원색 직접 X, 채도 -20% + `color-mix()` 적용

**B-3. 섹션 구분 행 (Infobox 내부)**
나무위키 패턴 ("신체 정보", "활동 정보" 같은 중간 제목 행). colspan 전체, 배경색 테마 컬러.
- Plot: `fields`에 `type: "section"` variant 추가 (discriminator)
- 난이도 Easy × Impact High

**B-4. TOC Dot Minimap variant**
나무위키 고유 (위키피디아엔 없음). 우측 고정 점 리스트 = 헤딩 미니맵.
- Plot: FloatingTOC 있음. **Dot variant 토글** 추가하면 충분 (독립 컴포넌트 X)
- 난이도 Easy-Medium × Impact Medium

**B-5. 다크모드 이중 색상 (나무위키 `dark-style` 문법)**
light/dark 색상 쌍 CSS variable로 cascade. Tailwind v4 다크모드와 통합.
- Plot: B-2 themeColor에 포함 (`{light, dark}` 쌍)
- 난이도 Easy × Impact Medium (B-2에 흡수)

**B-6. 인포박스 레이아웃**
- Wikipedia 기본: 우측 float `width: 22em` (16px base 기준 352px)
- 나무위키 기본: 우측 float 없음, 상단 전폭 — 문서별 bgcolor 인라인 주입
- Plot Encyclopedia: `float-right 320px` (이미 구현됨, 확인)
- Plot Default: 인포박스 없음 (에디터 블록 `InfoboxBlockNode`만)
- **결정**: 현재 Plot 2-mode (Default 인라인 블록 / Encyclopedia float) 유지. 나무위키 스타일 추가 시 프리셋으로

**B-7. 레이아웃 프리셋 (wiki-color 신규?)**
기존 결정: Default + Encyclopedia 병존 (2026-04-12 확정).
- **열린 질문 D-3**: 나무위키 스타일을 3번째 프리셋 `wiki-color`로 추가할지?
  - 내 제안: **YES 추가**. 사용자가 문서별 선택 가능. Default/Encyclopedia/WikiColor 3종.
  - 또는 `WikiArticle.renderStyle` 필드로 문서별 지정.

### 축 C — 위키 편집 UX

**C-1. 편집 히스토리 + diff 뷰**
나무위키/위키피디아 필수. 리버전 목록 + diff (추가 초록 / 삭제 빨강) + 롤백.
- Plot: 없음 (Note.history 슬라이스 있지만 위키에 연결 안 됨)
- **단계적 접근**:
  - v1: 스냅샷 목록만 (History 탭 + 시간+편집 요약 표시)
  - v2: `diff-match-patch`로 텍스트 diff 계산
  - v3: 롤백 버튼
- 난이도: v1 Medium, v2 Hard, v3 Easy

**C-2. 편집 요약 필드 (Wikipedia Edit Summary)**
저장 시 작은 텍스트 필드: "오탈자 수정", "소속사 변경". History의 맥락 제공.
- 도입: 저장 다이얼로그에 1개 필드 추가, History 스냅샷에 `summary` 포함
- 난이도 Easy × Impact High (C-1과 쌍)

**C-3. 타입 인포박스 스키마 (Typed Infobox Templates)**
Wikipedia 분야별 타입 (Infobox person/country/film/software/album/book/company). 타입 선택 → 기본 필드 pre-populate.
- Plot: 없음. 자유 키-값만
- 도입:
  - `lib/wiki-types/schemas/` 디렉터리에 JSON 타입 정의
  - WikiArticle 생성 시 "타입 선택" 단계 추가 (Person/Place/Concept/Work/Organization/Event 6종 초기)
  - 타입별 기본 필드 자동 삽입, 사용자 임의 추가도 가능
- 난이도 Medium × Impact High

**C-4. 필드 값 리치텍스트**
나무위키/위키피디아는 필드 value에 `[[링크]]`, `'''굵게'''`, 이미지 삽입 가능.
- Plot: 현재 `<input type="text">` plain text
- **단계적 접근**:
  - v1: markdown 서브셋 파싱 (`[[link]]`, `**bold**`, `![](img)` 렌더)
  - v2: 완전 미니 TipTap 에디터 (link+image+wikilink+bold+italic만)
- 난이도: v1 Medium, v2 Hard

**C-5. Properties 패널 (Obsidian 2-C)**
문서 상단 접이식 메타데이터. 타입별 입력 UI (DatePicker/Toggle/Number/Select).
- Plot: tags/labels만. 자유 속성 없음
- 도입: Note/WikiArticle 에디터 최상단 Properties 패널 (`properties: Record<string, TypedValue>`)
- 난이도 Medium × Impact High

**C-6. 별명/Alias 관리**
`[[IU]]` → "아이유" 자동 해석. `@멘션` 드롭다운 검색에 aliases 포함.
- 현재 Plot: `WikiArticle.aliases` 이미 있음 (확인 필요) but UI 편집 없음
- 도입: 설정 패널에 "별명 추가" UI + 링크 해석기/검색기 연동
- 난이도 Easy × Impact Medium

**C-7. Unlinked Mentions 탐지 (Obsidian 2-F)**
현재 문서 제목 + aliases가 링크 없이 언급된 곳 자동 탐지 → "링크 변환" 버튼.
- SmartSidePanel Connections 탭 확장
- 난이도 Medium × Impact High

**C-8. 2-hop Indirect Connections (Scrapbox 4-B)**
A→B→C 경로의 C를 A 문서 Connections에 표시. 의도하지 않은 연결 발견.
- 난이도 Medium × Impact High (C-7과 쌍)

**C-9. Navbox 자동 생성 (Wikipedia 1-B)**
WikiCategory 기반 형제 문서 목록 자동 렌더 (A-4 배너와 겹침 — Navbox는 배너+편집 양쪽 영역)
- 난이도 Medium × Impact High

**C-10. 하위 문서 편집 UX (나무위키 상위/하위)**
`WikiArticle.parentId` 추가. 편집 화면에 "부모 문서 선택". 자동 breadcrumb + "하위 문서" 섹션 자동.
- 난이도 Medium × Impact High

**C-11. 템플릿 삽입 UX (나무위키 include + Notion Templates)**
Plot Templates 슬라이스 이미 있음. 인포박스 → "템플릿으로 저장" → 다른 문서에서 재사용.
- 난이도 Easy × Impact Medium (기존 인프라 활용)

---

## 실측 CSS 수치 덤프

> 아래는 2026-04-14 리서치 agent가 Module:Navbox/styles.css, Module:Infobox/styles.css, Settlement infobox CSS, Ambox, Obsidian Callouts, openNAMU main.css 직접 fetch로 확보한 **실측값**. "추정" 표기된 것만 교차 검증 필요.

### 위키피디아 디자인 DNA

```css
/* 공통 그레이 팔레트 */
--plot-wiki-bg: #f8f9fa;             /* 인포박스, 본문 밝은 배경 */
--plot-wiki-border: #a2a9b1;          /* 인포박스/테이블/Ambox 공통 border */
--plot-wiki-text: #202122;            /* 기본 텍스트 */
--plot-wiki-font-size: 88%;           /* 인포박스/Navbox base font */

/* Navbox 3단계 계층 */
--plot-navbox-l1: #ccccff;            /* 타이틀 */
--plot-navbox-l2: #ddddff;            /* abovebelow, group, subgroup title */
--plot-navbox-l3: #e6e6ff;            /* subgroup 내부 */
--plot-navbox-even: #f7f7f7;          /* 지브라 짝 */
--plot-navbox-body: #fdfdfd;          /* 목록 배경 */

/* Ambox (Article Message Box) severity 시스템 */
--plot-ambox-notice: #3366cc;         /* 파랑 좌측 스트립 (10px) */
--plot-ambox-delete: #b32424;         /* 빨강 — 즉시삭제 */
--plot-ambox-content: #f28500;        /* 주황 — 내용 문제 */
--plot-ambox-style: #ffcc33;          /* 노랑 — 문체/형식 */
--plot-ambox-move: #9932cc;           /* 보라 — 이동 */
--plot-ambox-protection: #a2a9b1;     /* 회색 — 보호 */
--plot-ambox-bg: #fbfbfb;
--plot-ambox-border-left: 10px solid var(--plot-ambox-{type});

/* Hatnote */
--plot-hatnote-indent: 1.6em;
--plot-hatnote-margin-bottom: 0.5em;
--plot-hatnote-color: inherit;        /* 본문 텍스트 색 상속 */
--plot-hatnote-style: italic;

/* Succession Box */
--plot-succession-bg: #eaeaea;

/* Taxobox 왕국별 배경 (참고용, Plot은 일반 분류에 활용 가능) */
--plot-category-color-animalia: #ebebd2;
--plot-category-color-plantae: #b4fab4;
--plot-category-color-fungi: #91fafa;
--plot-category-color-viruses: #ffffbe;

/* 다크모드 */
--plot-wiki-bg-dark: #1f1f23;
--plot-wiki-text-dark: #f8f9fa;
```

### 나무위키 디자인 DNA (openNAMU 교차 검증)

```css
/* 브랜드 컬러 (컬러 주권 예시) */
--namu-brand-primary: #00A495;        /* 청록 */
--namu-brand-secondary: #13AD65;      /* 그린 */
--namu-border: #DCDCDC;               /* gainsboro */
--namu-box-bg: #EFEFEF;
--namu-subtext: #555555;

/* 다크 팔레트 */
--namu-dark-bg: #1F2023;              /* 메인 배경 */
--namu-dark-code: #313236;            /* 코드/blockquote */
--namu-dark-accent: #2E5F4E;          /* 다크 강조 */
--namu-dark-link: #A7C8FF;
--namu-dark-link-hover: #7E97C1;

/* 인포박스 구조 (bgcolor 직접 주입 패턴) */
.namu-infobox {
  width: 300px;                       /* 300 ~ 500 ~ 700 ~ 1000px */
  border: 0.5px solid #DCDCDC;        /* Safari fallback: 1px */
  border-collapse: collapse;
  font-size: 14px;                    /* body base */
}
.namu-infobox td {
  padding: 8px 10px;                  /* openNAMU main.css 실측 */
}

/* 섹션 헤딩 (openNAMU 추정값) */
.namu-h2 {
  font-size: 1.375em;                 /* ≈ 19.25px */
  border-bottom: 1px solid #DCDCDC;
  padding-bottom: 4px;
}
.namu-h3 { font-size: 1.2em; }        /* ≈ 16.8px */
```

### Obsidian Callout 12타입 매핑

> `--callout-color` = `R, G, B` (0-255 쉼표 구분, 함수 표기 없음). Plot이 동일 패턴 채택 권장.

| Type | Color variable | 참고 HEX | Lucide Icon |
|------|---------------|----------|-------------|
| `note` | `--color-blue-rgb` | `#448aff` | `pencil` |
| `abstract` / `summary` / `tldr` | `--color-cyan-rgb` | `#00bcd4` | `clipboard-list` |
| `info` | `--color-blue-rgb` | `#448aff` | `info` |
| `todo` | `--color-blue-rgb` | `#448aff` | `check-circle-2` |
| `tip` / `hint` / `important` | `--color-cyan-rgb` | `#00bcd4` | `flame` |
| `success` / `check` / `done` | `--color-green-rgb` | `#00c853` | `check` |
| `question` / `help` / `faq` | `--color-orange-rgb` | `#ff9100` | `help-circle` |
| `warning` / `caution` / `attention` | `--color-orange-rgb` | `#ff9100` | `alert-triangle` |
| `failure` / `fail` / `missing` | `--color-red-rgb` | `#ff1744` | `x` |
| `danger` / `error` | `--color-red-rgb` | `#ff1744` | `zap` |
| `bug` | `--color-red-rgb` | `#ff1744` | `bug` |
| `example` | `--color-purple-rgb` | `#7c4dff` | `list` |
| `quote` / `cite` | **고정** `158, 158, 158` | `#9e9e9e` | `quote` |

```css
/* Obsidian 기본 매커니즘 — Plot에 이식 */
.callout {
  background-color: rgba(var(--callout-color), 0.1);     /* light */
  border-left: 4px solid rgb(var(--callout-color));
}
.theme-dark .callout {
  background-color: rgba(var(--callout-color), 0.2);     /* dark */
}
```

### Plot 도입 시 최종 조정값 (Linear 미니멀 톤)

```
채도 조정:
  나무위키 원본 → Plot = 채도 -20% (원색 직접 X)
  예: #00A495 → #00968A (HSL 176, 명도 -3%)

border-radius:
  나무위키 0px → Plot 6px (인포박스 외곽), 4px (배너), 0px (내부 셀)

padding 통일:
  인포박스 셀: 6px 10px (나무위키 8px 10px에서 -2px)
  배너/Hatnote: 8px 12px
  Callout: 12px 16px (Obsidian 관행)

font-size 체계 (base 14px):
  body 14px
  Infobox 12.3px (88%, Wikipedia)
  H2 1.25rem, H3 1.1rem, Caption 12px

다크모드 규칙:
  모든 색상 HEX → {light, dark} 쌍 필수
  light border #DCDCDC → dark #313236
  light text #202122 → dark #F8F9FA
  accent 색은 light/dark 공통 유지 (명도 충분할 때)
```

---

## Top 7 우선순위 (3축 균형)

사용자 요청 3축(배너/디자인/편집)에 균등 분배. Impact × 구현 용이성 × Plot 철학 적합성 기준.

### 배너 축 (2개)

**#1. Hatnote 시스템** — 상위/하위/다른뜻/Main/See-also 배너
- Why: 문서 관계 표현의 기본 인프라. 편집자 의도 명시 가능
- 구현: `WikiArticle.hatnotes: Array<{type, text, targetId}>` + italic indent 1.6em
- Wikipedia 공식 CSS 채택 (`.hatnote` 스타일)
- 난이도 **Easy** × Impact **High**

**#2. Ambox 자동 배너** — Stub/Orphan/Unsourced 자동 계산
- Why: 문서 품질 시각화. 편집 동기부여
- 구현: `WikiArticle.completeness` 필드 + 자동 계산 배너 (orphan=백링크 0, unsourced=각주 0, stub=블록 ≤4)
- 5색 severity 시스템 (빨/주/노/보/회)
- 난이도 **Easy** × Impact **Medium**

### 위키 디자인 축 (3개)

**#3. 대표 이미지 + 캡션**
- Why: 시각적 완성도 가장 극적. 노트 → 위키 전환 감성
- 구현: `InfoboxNode.heroImage: {url, caption, alt}` + `<figure>` + italic caption
- 추가: 첫 ImageBlock src → `coverImage` 자동 추출 (갤러리/호버 프리뷰 활용)
- 난이도 **Medium** × Impact **High**

**#4. themeColor 시스템 (색상 주권 + 다크 이중)**
- Why: 나무위키 고유 감성의 핵심. Plot 개성 확립
- 구현: `WikiArticle.themeColor: {light, dark}` + CSS variable cascade
- 주의: Linear 톤 유지 — 채도 -20% 자동 적용, border-radius 6px
- 난이도 **Medium** × Impact **High**

**#5. 섹션 구분 행 (Infobox 내부)**
- Why: 10+ 필드 인포박스 가독성 필수
- 구현: `fields[].type: "field" | "section"` discriminator + colspan 구분 행 (themeColor variant 배경)
- 난이도 **Easy** × Impact **High**

### 위키 편집 축 (2개)

**#6. 편집 히스토리 v1 + 편집 요약**
- Why: 장기 유지보수. "왜 이렇게 수정했나" 기록
- 구현 v1: `WikiArticle.history[]` 스냅샷 + `Note.history` 재활용 + 저장 시 summary 필드
- v2/v3 (diff/롤백)는 Phase 후속
- 난이도 **Medium** × Impact **High**

**#7. 타입 인포박스 스키마**
- Why: 구조적 지식 베이스의 기반. 나중에 PlotQL 쿼리와 연동 가능
- 구현:
  - `lib/wiki-types/schemas/` JSON 정의 (Person/Place/Concept/Work/Organization/Event 6종)
  - WikiArticle 생성 시 "타입 선택" 단계
  - 타입별 기본 필드 pre-populate
- 난이도 **Medium** × Impact **High**

### 보충 (Top 7 아니지만 가까운 8-10)
- Callout 12타입 확장 — Easy × Medium (A-2)
- Navbox 자동 생성 (카테고리 기반) — Medium × High (A-4 + C-9)
- 별명(Alias) 관리 UI — Easy × Medium (C-6)

---

## 드랍/흡수 결정

### 드랍: 계보/계승 테이블 (Succession Box)
- **사유**: 이미 Plot 테이블 블록 + 셀 배경색 + `[[위키링크]]`로 정적 계승 표현 가능
- **자동 계보**는 별도 주제 — Tier 4 "상위/하위 문서 관계"(C-10)를 "시맨틱 엣지"로 확장 재정의하면 자연 포함
- 4-06 원본 BRAINSTORM Section 9의 "계보/계승 테이블"은 **별도 구현 대상에서 제외**

### 흡수: 시리즈 박스 → Navbox의 `sourceCategoryId` 옵션
- **사유**: `NavBoxBlock { items?: string[], sourceCategoryId?: string }` 단일 블록이 수동(둘러보기 틀) + 자동(시리즈 박스) 모두 처리
- 별도 SeriesBox 블록 만들지 않음

### 보류: Canvas (Obsidian 2-A), PlotQL (Dataview-like), Flashcard SRS
- **사유**: 본 P2 범위(인포박스 고도화) 밖. 별도 Phase에서 재검토
- PlotQL는 타입 인포박스(#7) + Properties 패널(C-5)가 먼저 완성된 후 자연스럽게 도입 가능

---

## 파운딩 원칙 (구현 시 준수)

### 1. 모든 새 기능 = base 티어 (노트+위키 공용)
`shared-editor-config.ts`의 `base` 확장에 넣는다. 노트에서도 Hatnote, Ambox, Callout 12타입 전부 사용 가능.
- 현재 Infobox는 이미 note/wiki 양쪽 등록 (확인됨). base로 승격 시에도 무해.
- BannerBlock/NavBoxBlock 신규 = base 티어

### 2. Insert 레지스트리 단일화
`insert-menu.tsx` + `SlashCommand.tsx` + `FixedToolbar.tsx` 3곳 중복 → 단일 레지스트리(`lib/editor/insert-registry.ts`).
- 신규 블록 추가 시 1곳만 수정
- Phase 1 착수 전 **선행 리팩토링** 필요

### 3. Plot Linear-ish 톤 유지
- 나무위키/Obsidian 원색 직접 채택 X
- 채도 -20% 자동 조정 (`color-mix(in srgb, X 80%, #888 20%)` 등)
- border-radius 통일 (6px 외곽 / 4px 배너 / 0px 내부)
- padding 축소 (나무위키 8px → Plot 6px)

### 4. 다크모드 이중 색상 필수
모든 themeColor/bgColor는 `{light, dark}` 쌍으로 저장. CSS variable로 렌더. 단색 저장 금지.

### 5. 단계적 Store migration
- v75 (현재) → v76 → v77 이런 식. 한 Phase = 1 migration
- 각 migration은 backfill 로직 포함 (새 필드 기본값)

### 6. TipTap 커스텀 노드 규칙
- `atom: true` (편집 진입 불가, 찢어짐 방지) — WikilinkNode 패턴 참조
- `draggable: true`
- NodeView는 React 컴포넌트 (`ReactNodeViewRenderer`)
- attrs는 최소화, 내용은 content slot 활용

---

## 선행 조건 (Phase 0)

본 P2 작업 **착수 전 반드시 수정**:

### 선행 0.1 — WikiInfobox 저장 버그 (critical)
`components/editor/wiki-infobox.tsx:17`에서 `setWikiInfobox`(Note slice)만 호출. Encyclopedia 레이아웃에서 WikiArticle ID를 Note ID로 잘못 전달해 실제로 저장 안 될 가능성.
- 수정: `entityType: "note" | "wiki"` prop 추가 또는 컴포넌트 분리
- 테스트: Encyclopedia에서 인포박스 편집 후 리로드 → 값 유지되는지

### 선행 0.2 — InfoboxRow ↔ WikiInfoboxEntry 타입 통일
같은 구조, 다른 이름으로 혼선. `lib/types.ts`에서 `WikiInfoboxEntry`만 남기고 `InfoboxRow` 삭제 + `infobox-node.tsx` 리팩토링.

### 선행 0.3 — wiki-to-tiptap.ts 인포박스 변환 개선
`wiki-to-tiptap.ts:10`가 WikiArticle 인포박스 → 일반 table로 변환. `InfoboxBlockNode`로 변환하게 수정. (Optional: Phase 중에 병행 가능)

### 선행 0.4 — Insert 레지스트리 단일화 (파운딩 원칙 #2)
3곳 중복 제거. 신규 블록 Phase 진입 전 완료 권장.

---

## 열린 질문 (결정 보류)

### D-1. 편집 충돌 감지 (크로스 머신)
- Context: 사용자는 회사+집 2머신 워크플로우. Zustand+IDB라 IDB 데이터는 머신마다 분리
- 질문: 같은 문서를 두 머신에서 수정한 충돌이 실제 발생한 적이 있는가?
- 없으면 Skip. 있으면 C-1 편집 히스토리 v1에 "충돌 감지" 추가 고려

### D-2. 문서 메타 정보 UI 위치
- 옵션 A: WikiArticle 최상단 노출 (최종 수정, 편집자, 분류)
- 옵션 B: SmartSidePanel Detail 탭에만 (현재 Plot 방식)
- **내 제안**: 나무위키는 A, 위키피디아는 B. Plot은 B 유지 (정보 밀도 낮춤)

### D-3. 렌더 프리셋 3번째 추가? (`wiki-color`)
- 기존: Default + Encyclopedia 2종
- 제안: WikiColor 3번째 (나무위키 톤, 컬러 주권 강조)
- `WikiArticle.renderStyle: "default" | "encyclopedia" | "wiki-color"` 문서별 선택
- **내 제안**: Phase 2 (디자인 축) 완료 후 3번째 프리셋으로 자연 도입

### D-4. 나무마크 추가 문법 트리거?
- 현재: `[[`, `@`, `#`, `/` 4개
- 후보: `!image`, `!banner`, `!infobox` 같은 마크다운 확장?
- **내 제안**: 추가 트리거 X. 슬래시 커맨드로 통일. 과도한 문법은 학습 비용

### D-5. 매크로 시스템 범위
- 나무위키 `[age()]`, `[dday()]` — DynamicValueNode로 구현
- `[include()]` — WikiEmbed로 이미 커버, 파라미터 치환은 범위 밖
- `[ruby()]` — 루비 텍스트 (한자/일본어)
- **내 제안**: Tier 3 고급. P2 범위 밖. 별도 Phase에서

---

## 구현 Phase 개요 (상세 플랜은 `PHASE-PLAN-wiki-enrichment.md`로 분리)

```
Phase 0 (선행): 버그 수정 + Insert 레지스트리 단일화 + 타입 통일
                                 ↓
Phase 1 (배너): Hatnote + Ambox 자동 배너 (Easy × High/Medium)
                                 ↓
Phase 2 (디자인): 대표 이미지 + themeColor + 섹션 구분 행 (Medium × High)
                                 ↓
Phase 3 (편집): 편집 히스토리 v1 + 편집 요약 + 타입 인포박스 스키마 (Medium × High)
                                 ↓
Phase 4 (보충): Callout 12타입 확장 + Navbox 자동 + Alias UI (Easy-Medium × Medium)
                                 ↓
(P2 완료, 이후 P3 사이드패널/동음이의어/커맨드팔레트로 전환)
```

---

## Sources

### 이전 브레인스토밍
- [BRAINSTORM-2026-04-06.md](./BRAINSTORM-2026-04-06.md) — 원본 108줄
- [MEMORY.md](./MEMORY.md) — 나무위키 리서치 결과 Tier 1~4
- [.omc/notepad.md](../.omc/notepad.md) — 2026-04-14 Active Tasks
- [.omc/notepads/general/decisions.md](../.omc/notepads/general/decisions.md) — 2026-04-14 섹션

### 2026-04-14 리서치 agent 소스
- Wikipedia:
  - [Module:Navbox/styles.css](https://en.wikipedia.org/wiki/Module:Navbox/styles.css) — Navbox 완전 CSS (직접 확인)
  - [Module:Infobox/styles.css](https://en.wikisource.org/wiki/Module:Infobox/styles.css) — 인포박스 기본 CSS
  - [Template:Ambox](https://en.wikipedia.org/wiki/Template:Ambox) — Ambox 색상 시스템
  - [Template:Taxobox](https://en.wikipedia.org/wiki/Template:Taxobox) — 왕국별 배경 HEX
  - [Wikipedia:Hatnote](https://en.wikipedia.org/wiki/Wikipedia:Hatnote) — Hatnote 표준
  - [Template:Navbox](https://en.wikipedia.org/wiki/Template:Navbox) — 3단계 계층 설명
- 나무위키 (namu.wiki 403 차단으로 교차 검증):
  - [openNAMU GitHub](https://github.com/openNAMU/openNAMU) — main.css, dark.css 실측
  - [openNAMU-Skin-Liberty](https://github.com/openNAMU/openNAMU-Skin-Liberty)
  - [나무위키:문법 도움말/심화](https://namu.wiki/w/%EB%82%98%EB%AC%B4%EC%9C%84%ED%82%A4:%EB%AC%B8%EB%B2%95%20%EB%8F%84%EC%9B%80%EB%A7%90/%EC%8B%AC%ED%99%94)
  - [나무위키:테마](https://namu.wiki/w/%EB%82%98%EB%AC%B4%EC%9C%84%ED%82%A4:%ED%85%8C%EB%A7%88) — light/dark 이중 선언
- Obsidian:
  - [Callouts Official](https://github.com/obsidianmd/obsidian-help/blob/master/en/Editing%20and%20formatting/Callouts.md) — 12타입 목록
  - [Callout CSS variables](https://docs.obsidian.md/Reference/CSS+variables/Editor/Callout) — `--callout-color` 구조
- 기타:
  - Scrapbox 2-hop links, Logseq block references — C-7/C-8 reference

---

**다음 단계**: `docs/PHASE-PLAN-wiki-enrichment.md` — Phase 0~4 구체 작업 체크리스트 + Store migration + 파일별 변경 목록
