# Plot 위키 통합 설계 — 컬럼 레이아웃 + 템플릿 시스템 (2026-04-14 저녁)

> 이 문서가 **현재 진실의 원천 (single source of truth)** for 위키 레이아웃/템플릿 시스템.
>
> 이전 브레인스토밍들은 **부분적 폐기**됨:
> - [BRAINSTORM-2026-04-14-wiki-ultra.md](./BRAINSTORM-2026-04-14-wiki-ultra.md) — 3-layer 모델 프레임 폐기. 세부 설계 (CSS 수치, A-1 Hatnote, A-3 Ambox, B-2 themeColor 등)는 유효하니 참조용으로 보존
> - [BRAINSTORM-2026-04-14-entity-philosophy.md](./BRAINSTORM-2026-04-14-entity-philosophy.md) — "위키 템플릿 3층 모델" 섹션 폐기. 엔티티 철학(Note/Wiki 2-entity) + 노트 split 섹션은 유효
> - [PHASE-PLAN-wiki-enrichment.md](./PHASE-PLAN-wiki-enrichment.md) — 전체 Phase 계획 폐기. 새 Phase 계획은 이 문서 하단 참조

---

## 설계 변천 타임라인

```
2026-04-06  BRAINSTORM 원본 — 나무위키 틀 시스템 조사
2026-04-14 오전  BRAINSTORM wiki-ultra — 3-layer 모델 (Layout / Content / Infobox 분리)
2026-04-14 오전  BRAINSTORM entity-philosophy — Note/Wiki 2-entity 확정 + 3-layer 모델 유지
2026-04-14 저녁  **이 문서** — 컬럼 시스템 + 템플릿 통합 (3-layer 폐기)
```

---

## 통합 모델 — 한 문장 요약

> **"컬럼 렌더러 + 섹션(블록) 배치 = 템플릿"**

3개 레이어(Layout Preset / Content Template / Typed Infobox)로 분리돼 있던 것을 **하나의 템플릿**에 통합.

```typescript
WikiTemplate = {
  id, name, description, icon
  layout: ColumnStructure          // 컬럼 구조 (개수 + 중첩 + 비율)
  titleStyle?: TitleStyleDef       // article.title 렌더 커스텀
  themeColor?: { light, dark }
  sections: SectionPlacement[]     // 섹션들 + 각 섹션이 어느 컬럼에
  infobox: InfoboxDef              // 인포박스 기본 필드
  hatnotes?: HatnoteDef[]
  navbox?: NavboxConfig
}
```

## 핵심 결정사항 (13개)

### 1. Note/Wiki 2-entity 유지 (2026-04-14 재확인)
- 엔티티 통합 영구 폐기. Note.contentJson (단일 TipTap JSON) vs WikiArticle.blocks[] (모듈러 블록) 구조 차이가 차별점
- 상세: [BRAINSTORM-2026-04-14-entity-philosophy.md](./BRAINSTORM-2026-04-14-entity-philosophy.md)

### 2. 렌더러(Layout)는 위키 전용
- 노트엔 레이아웃 개념 없음 (단일 TipTap JSON이라 성립 X)
- 위키만 ColumnStructure 가짐

### 3. Layout Preset 독립 선택지 폐기
- 기존: `layout: "default" | "encyclopedia" | "wiki-color"` string 상수
- 신: `layout: ColumnStructure` (실제 데이터 구조)
- 기존 default → "1컬럼 Blank 템플릿"으로 재해석
- 기존 encyclopedia → "2컬럼 Encyclopedia 템플릿"으로 재해석

### 4. 컬럼 시스템 = 상위 개념, 프리셋은 특정 조합
- "1컬럼 / 2컬럼 / 3컬럼 + themeColor + 섹션 배치" 식
- 사용자가 프리셋에서 시작 → 컬럼 추가/삭제로 커스텀

### 5. 중첩 컬럼 최대 3 depth
- depth 1 (문서 최상위): ✅ 기본
- depth 2 (컬럼 안 컬럼): ✅ 허용
- depth 3 (컬럼 안 컬럼 안 컬럼): ✅ 허용 (마지막)
- depth 4+: ❌ 금지 (경고 + prevent)

### 6. 컬럼 비율 드래그 조절
- react-resizable-panels 활용 (이미 workspace에서 사용 중)
- 경계 드래그로 비율 조절, percent로 persist

### 7. Title은 문서당 1개 고정 (article.title + titleStyle)
- 나무위키/위키피디아 관습: title은 항상 최상단 고정, 컬럼 영역 위
- Title 블록화 폐기 (Add Block 메뉴에 신규 entry 추가하려던 계획 취소)
- Column Heading 블록 폐기 (Section H2로 충분)
- 대신 `WikiArticle.titleStyle?` 속성으로 렌더 커스텀

```typescript
WikiArticle = {
  title: string           // 기존 identity (검색/링크/인덱싱)
  aliases: string[]       // subtitle로 자동 렌더 가능
  titleStyle?: {
    alignment?: "left" | "center"         // 기본: left
    size?: "default" | "large" | "hero"   // hero = cover 스타일
    showAliases?: boolean                 // aliases를 subtitle로
    themeColorBg?: boolean                // themeColor 배경 적용
  }
  layout: ColumnStructure                 // title 아래부터 컬럼 적용
  blocks: WikiBlock[]                     // 기존 유지
  columnAssignments: ...                  // blockId → column path
  ...
}
```

### 8. 노트 템플릿 vs 위키 템플릿 분리
- 노트 템플릿 (NoteTemplate slice): UpNote식 단순 복사 (title + content TipTap JSON)
- 위키 템플릿 (WikiTemplate, 신규): 컬럼 + 섹션 + 인포박스 구조체
- 다른 데이터 쉐입 → 통합 금지

### 9. 노트 split 기능 = must-todo
- UniqueID extension 이미 준비됨 (top-level 23종 영속 ID)
- WikiSplitPage 패턴 재활용 (`components/views/wiki-split-page.tsx` 502줄)
- 상세: [memory/project_note_split_todo.md](../C:/Users/user/.claude/projects/C--Users-user-Desktop-linear-note-plot-/memory/project_note_split_todo.md)

### 10. 섹션 블록 정체성 강화 (optional)
- 기존 section 블록에 attrs 추가 고려:
  - `icon?: string` (emoji)
  - `themeColor?: string` (섹션별 색상 tint)
  - `description?: string` (부제목)
  - `hideNumber?: boolean`

### 11. 사용자 커스텀 템플릿 지원
- "파라미터 조합" 방식 (JSX/코드 주입 X)
- 컬럼 구조 + 섹션 배치 + 인포박스 필드 + themeColor + titleStyle 자유 조합
- `wikiTemplates` slice 신설 (built-in + user-defined)

### 12. 기본 템플릿 8종 (built-in)
| Template | layout | themeColor | sections | infobox fields |
|---|---|---|---|---|
| **Blank** | 1컬럼 | null | 자유 | 없음 |
| **Encyclopedia** | 2컬럼 (본문/인포박스) | null | Overview/Details/See Also | Info (generic) |
| **Person** | 2컬럼 | {amber, orange} | Biography/Works/Legacy | Name/Born/Died/Nationality |
| **Place** | 2컬럼 | {teal, blue} | Overview/History/Geography | Country/Capital/Population |
| **Concept** | 1컬럼 | {purple, violet} | Definition/Origin/Examples | Field/Related |
| **Work** | 2컬럼 | {rose, pink} | Overview/Plot/Characters | Author/Published/Genre |
| **Organization** | 2컬럼 | {gray, slate} | Overview/History/Structure | Founded/HQ/Members |
| **Event** | 1컬럼 | {red, orange} | Background/Course/Aftermath | Date/Location/Participants |

### 13. Tier 1 인포박스 완료
- ✅ 대표 이미지+캡션 (PR #192)
- ✅ 헤더 색상 테마 (PR #194)
- ✅ 접기/펼치기 (PR #192)
- ✅ 섹션 구분 행 (PR #194)
- ✅ 필드 값 리치텍스트 (PR #194)

---

## 데이터 모델 — 완전 스키마

```typescript
/**
 * 컬럼 구조 — 재귀 가능 (중첩 최대 3 depth)
 */
type ColumnStructure = {
  type: "columns"
  direction?: "horizontal" | "vertical"  // 기본 horizontal
  columns: Array<{
    ratio: number                         // flex-grow (1, 2, 3...)
    minWidth?: number                     // 반응형 collapse threshold (px)
    priority?: number                     // 좁은 화면에서 숨김 순서 (낮은 priority부터)
    content: ColumnStructure | { type: "blocks"; blockIds: string[] }
  }>
}

/**
 * 블록이 어느 컬럼에 속하는지
 */
type ColumnPath = string  // "0.1.2" = columns[0].columns[1].columns[2]

/**
 * WikiArticle 확장 (기존 필드에 추가)
 */
interface WikiArticle {
  id: string
  title: string
  aliases: string[]
  
  // ★ 신규 ★
  titleStyle?: {
    alignment?: "left" | "center"
    size?: "default" | "large" | "hero"
    showAliases?: boolean
    themeColorBg?: boolean
  }
  themeColor?: { light: string; dark: string }
  layout: ColumnStructure                 // 기존 string 대체
  columnAssignments: Record<string, ColumnPath>  // blockId → where
  templateId?: string                     // optional 추적
  
  // 기존 유지
  blocks: WikiBlock[]
  sectionIndex: WikiSectionIndex[]
  infobox: WikiInfoboxEntry[]
  categoryIds?: string[]
  referenceIds?: string[]
  fontSize?: number
  mergeHistory?: WikiMergeSnapshot[]
  createdAt: string
  updatedAt: string
}

/**
 * WikiTemplate — 신규 slice
 */
interface WikiTemplate {
  id: string
  name: string
  description: string
  icon?: string              // emoji or Remix icon name
  isBuiltIn: boolean
  
  layout: ColumnStructure
  titleStyle?: WikiArticle["titleStyle"]
  themeColor?: { light: string; dark: string }
  
  sections: Array<{
    title: string
    level: 2 | 3 | 4
    columnPath: ColumnPath        // 어느 컬럼에 들어갈지
    initialBlocks?: WikiBlock[]   // 기본 콘텐츠
    icon?: string                 // 섹션 정체성 강화
    themeColor?: string
    description?: string
  }>
  
  infobox: {
    fields: WikiInfoboxEntry[]     // type: "field" | "section" 지원
    headerColor?: string
    columnPath: ColumnPath         // 인포박스 위치
  }
  
  hatnotes?: Array<{
    type: "about" | "distinguish" | "see_also" | "main" | "further"
    text?: string
    targetId?: string
  }>
  
  navbox?: {
    sourceCategoryId?: string      // 자동 수집
    items?: string[]               // 수동 리스트
  }
  
  createdAt: string
  updatedAt: string
}
```

---

## Phase 계획 (새 버전, PHASE-PLAN-wiki-enrichment.md 대체)

### Phase 0 — 문서 정비 (지금)
- 이 문서 작성 ✅
- 기존 문서들 DEPRECATED 마킹 + 링크
- CONTEXT.md / MEMORY.md / memory 파일 동기화

### Phase 1 — 데이터 모델 + 기본 템플릿
**기간**: 3-4일  
**결과**: 컬럼 구조 + 템플릿 8종 동작 (렌더링은 단순)
- `lib/types.ts` — `ColumnStructure`, `WikiTemplate`, `WikiArticle` 확장
- `lib/store/slices/wiki-templates.ts` — built-in 템플릿 8종 정의
- `lib/store/migrations/vNN-column-layout.ts` — 기존 default/encyclopedia 자동 변환
- `WikiArticle.layout` 기본값 "1컬럼 Blank"
- **렌더는 기본만** (컬럼 개수 그리드, 드래그 없음)
- **새 위키 생성 UX**: 템플릿 선택 다이얼로그 추가

### Phase 2 — 컬럼 렌더러 + titleStyle
**기간**: 2-3일
- `components/wiki-editor/column-renderer.tsx` 신규 — 재귀 ColumnStructure 렌더
- Title 영역 렌더 (article.title + titleStyle) — 컬럼 위 고정
- themeColor CSS variable cascade
- 기존 `wiki-article-view.tsx` + `wiki-article-encyclopedia.tsx`는 → **컬럼 렌더러 호출로 교체**

### Phase 3 — 편집 UX (컬럼 조작)
**기간**: 3-4일
- 컬럼 경계 드래그로 비율 조절 (react-resizable-panels)
- 컬럼 추가/삭제 버튼
- 중첩 3 depth 지원 + 제한 enforcement
- 블록을 컬럼 간 드래그 이동
- 블록 ⋯ 메뉴에서 "다른 컬럼으로 이동"

### Phase 4 — 사용자 커스텀 템플릿 편집기
**기간**: 2-3일
- 설정 → 위키 → 내 템플릿 → [+ 새 템플릿]
- 현재 문서를 "템플릿으로 저장"
- 템플릿 편집 UI (드래그 정렬 + 필드 편집 + 미리보기)
- `wikiTemplates` slice persist

### Phase 5 — 나무위키 리서치 잔여 기능 (wiki-ultra.md 참조)
**기간**: 3-4일 (산발적)
- Hatnote (A-1) — Easy × High
- Ambox 자동 배너 (A-3) — Easy × Medium
- Navbox 자동 (A-4) — Medium × High
- 섹션 정체성 강화 (icon/themeColor/description)
- Callout 12타입 확장

### Phase 6 — 편집 히스토리 (wiki-ultra.md C-1/C-2)
**기간**: 2-3일
- v1: 스냅샷 목록 + 편집 요약
- v2: diff 뷰
- v3: 롤백

### Phase 7 — 노트 split
**기간**: 2-3일
- `components/views/note-split-page.tsx` 신규 (wiki-split-page.tsx 복사 기반)
- `splitNote` 스토어 액션
- UniqueID 활용

---

## 폐기된 아이디어 (기록용)

이번 세션 탐색 중 제안됐다가 폐기된 것들:

- **엔티티 통합 (Alpha/Beta/Gamma)** — Note/WikiArticle 합치기. 2026-04-01 결정 재확인으로 폐기
- **3-layer 모델 (Layout / Content Template / Typed Infobox 분리)** — 위 모델에 통합
- **wiki-color를 독립 레이아웃 프리셋으로 추가** — 컬럼 시스템에 흡수 (2컬럼 + themeColor 템플릿)
- **Title 블록 (Add Block 메뉴 entry)** — title 자유 배치. article.titleStyle로 대체
- **Column Heading 블록** — 컬럼별 이름 블록. Section(H2)로 충분
- **multi-title 허용** — 컬럼마다 title 여러 개. 1개 고정으로 결정

---

## 열린 질문 (미결)

- **ColumnPath 표현 방식** — "0.1.2" string vs Array<number>. 성능 vs 직관
- **기존 blocks[] 자동 마이그레이션 기준** — default layout 문서들을 어느 템플릿에 매칭?
  - heuristic: blocks.length < 5 → Blank, 인포박스 있음 → Encyclopedia, aliases 많음 → Person?
  - 또는 사용자에게 선택시키기 (최초 1회 다이얼로그)
- **반응형 collapse 전략** — priority 기반 자동 + 사용자 override
- **섹션 icon/themeColor 강화 Phase** — Phase 4에 포함 vs 별도 Phase
- **Phase 2의 컬럼 렌더러와 기존 2개 view 파일 관계** — 완전 교체 vs variant 추가?

---

## Sources

- 이번 세션 대화 (Claude Opus 4.6, 2026-04-14 저녁)
- [BRAINSTORM-2026-04-14-wiki-ultra.md](./BRAINSTORM-2026-04-14-wiki-ultra.md) — 실측 CSS 수치 + 디자인 DNA (보존 유효)
- [BRAINSTORM-2026-04-14-entity-philosophy.md](./BRAINSTORM-2026-04-14-entity-philosophy.md) — 엔티티 철학 + 노트 split 섹션 (유효)
- 나무위키 "천간" 문서 스크린샷 (title 위치 레퍼런스)
- 위키피디아 "도널드 트럼프" 문서 스크린샷 (title 위치 레퍼런스)
