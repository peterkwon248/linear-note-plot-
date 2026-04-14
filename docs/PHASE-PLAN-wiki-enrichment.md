# Phase Plan — Wiki Enrichment (인포박스/배너/편집 고도화)

> ## ⚠️ DEPRECATED — 2026-04-14 저녁 재설계
>
> **이 Phase 계획 전체가 폐기됨.** 3-layer 모델 전제로 설계됐는데 프레임이 바뀜.
>
> **새 Phase 계획**: [BRAINSTORM-2026-04-14-column-template-system.md](./BRAINSTORM-2026-04-14-column-template-system.md) 하단 "Phase 계획" 섹션 참조
>
> **새 계획 요약 (Phase 0 → 7)**:
> 1. Phase 0 (현재): 문서 정비
> 2. Phase 1: 데이터 모델 + 기본 템플릿 8종 (ColumnStructure, WikiTemplate)
> 3. Phase 2: 컬럼 렌더러 + titleStyle
> 4. Phase 3: 편집 UX (컬럼 드래그, 추가/삭제, 중첩 3 depth)
> 5. Phase 4: 사용자 커스텀 템플릿 편집기
> 6. Phase 5: 나무위키 잔여 기능 (Hatnote, Ambox, Navbox 등 — 이 문서 기존 Phase 1~4 내용의 재편)
> 7. Phase 6: 편집 히스토리
> 8. Phase 7: 노트 split
>
> **이 문서의 여전히 유효한 내용** (새 Phase 계획에 흡수됨):
> - 0.1 WikiInfobox 저장 버그 → 새 Phase 1에 포함
> - Phase 1의 Hatnote/Ambox 설계 → 새 Phase 5에 포함
> - Phase 2의 themeColor, 섹션 구분 행 → 이미 PR #194에 완료됐거나 새 Phase 2에 포함
> - Phase 3의 타입 인포박스 스키마 → 새 Phase 1 템플릿 시스템에 통합됨
> - Phase 4의 Callout 12타입, Navbox 자동 → 새 Phase 5
>
> 아래 내용은 **히스토리 보존** 목적으로 남겨둠.

> `docs/BRAINSTORM-2026-04-14-wiki-ultra.md`의 Top 7 + 선행 조건을 **실행 단위**로 쪼갠 체크리스트.
> 각 Phase = 1 PR 단위. 각 Phase 내 sub-task = 개별 커밋 단위.
> 작업 중엔 이 문서를 실시간 업데이트 (완료 체크). PDCA Do 단계의 작업 스크립트.

---

## 진행 상태 (실시간 갱신)

- [ ] Phase 0: 선행 조건 (버그 수정 + 리팩토링)
- [ ] Phase 1: 배너 (Hatnote + Ambox)
- [ ] Phase 2: 위키 디자인 (대표 이미지 + themeColor + 섹션 구분 행)
- [ ] Phase 3: 위키 편집 UX (히스토리 + 요약 + 타입 스키마)
- [ ] Phase 4: 보충 (Callout 12타입 + Navbox 자동 + Alias UI)

---

## 🛠 Phase 0 — 선행 조건 (필수 Pre-work)

> 본 Phase는 **버그 수정 + 리팩토링**. 신규 기능 없음. Phase 1 착수 전 반드시 완료.

### 0.1 WikiInfobox 저장 버그 (critical)

**문제**: `wiki-infobox.tsx:17`이 `setWikiInfobox`(Note slice)만 호출. Encyclopedia 레이아웃에서 WikiArticle ID를 Note ID로 전달해 **저장 실패 가능성**.

**변경 파일**:
- `components/editor/wiki-infobox.tsx` — props에 `entityType: "note" | "wiki"` 추가, store action 분기
- `components/views/wiki-article-reader.tsx` — `entityType="wiki"` 전달 확인
- `components/wiki-editor/wiki-article-encyclopedia.tsx` — 동일
- `components/note-editor.tsx:682-692` — `entityType="note"` 전달

**테스트**:
1. Encyclopedia에서 인포박스 row 추가 → 저장 → 페이지 리로드 → row 유지되는지
2. 노트에서 wikiInfobox 편집 → 동일 테스트
3. 두 경로에서 저장 경로 분리 확인 (`setWikiInfobox` vs `setWikiArticleInfobox`)

### 0.2 타입 통일

> 🔴 **Critical Risk**: 기존 문서에 저장된 `InfoboxBlockNode` JSON이 `{label, value}` 형태. 필드명만 바꾸면 기존 인포박스 전부 빈 행으로 보임. **하위호환 adapter 필수**.

**변경**:
- `lib/types.ts` — `InfoboxRow` 삭제. `WikiInfoboxEntry` 단일 타입 유지 (`{key, value, type?}`)
- `components/editor/nodes/infobox-node.tsx:11-14` — `InfoboxRow` → `WikiInfoboxEntry` 교체
- `components/editor/nodes/infobox-node.tsx` 나머지 — `row.label` → `row.key` 일괄 변환
- `Reference.fields` (`lib/types.ts:255`) — 같은 구조지만 Reference는 별개 엔티티로 유지. 통일 X

**명명 결정**: `WikiInfoboxEntry`의 필드명은 `{key, value}` 유지 (Reference.fields와 동일 패턴). 기존 `InfoboxRow`의 `{label, value}`는 `key`를 label로 표시하는 일반 패턴이므로 변경 흡수.

### 0.2.1 하위호환 Adapter (필수, Risk #1 대응)

**문제**: 기존 IDB에 저장된 TipTap contentJson 어딘가에 `InfoboxBlockNode`가 `rows: [{label: "나이", value: "26"}]` 형태로 있음. 필드명 바꾸면 `row.key` 읽을 때 `undefined`.

**선택지**:

**[권장] Option A — TipTap `parseHTML` / `renderHTML` adapter (데이터 마이그레이션 없음)**

`components/editor/nodes/infobox-node.tsx`의 `addAttributes` / `parseHTML` 확장:
```typescript
addAttributes() {
  return {
    rows: {
      default: [],
      parseHTML: (element) => {
        const raw = element.getAttribute("data-rows")
        if (!raw) return []
        try {
          const parsed = JSON.parse(raw)
          if (!Array.isArray(parsed)) return []
          // 하위호환: 기존 `label` 필드도 읽어서 `key`로 정규화
          return parsed.map((r: any) => ({
            key: r.key ?? r.label ?? "",
            value: r.value ?? "",
            type: r.type ?? "field"
          }))
        } catch {
          return []
        }
      },
      renderHTML: (attributes) => ({
        "data-rows": JSON.stringify(attributes.rows)
      })
    }
  }
}
```

**장점**: 기존 문서 건드리지 않음. 문서 저장 시 자동으로 새 필드명으로 재저장.
**단점**: `data-rows` attribute 경유일 때만 동작. TipTap JSON content에 직접 저장되는 경우 추가 처리 필요.

**Option B — One-time Scan Migration (확실한 대신 느림)**

`lib/store/index.ts` migration에서 notes/wikiArticles 전체 contentJson 순회:
```typescript
// migration v75 → v76 (또는 별도 단계)
state => {
  const normalizeInfobox = (node: any): any => {
    if (node.type === "infobox" && Array.isArray(node.attrs?.rows)) {
      node.attrs.rows = node.attrs.rows.map((r: any) => ({
        key: r.key ?? r.label ?? "",
        value: r.value ?? "",
        type: r.type ?? "field"
      }))
    }
    if (Array.isArray(node.content)) {
      node.content.forEach(normalizeInfobox)
    }
    return node
  }
  // 각 note/wikiArticle의 contentJson이 IDB에 저장됨 → BodyProvider hydrate 후 처리 필요
  // 또는 읽기 훅에서 on-the-fly normalize
}
```

**장점**: 완전한 데이터 정합성 보장.
**단점**: 전체 IDB scan — 문서 많으면 느림. `plot-note-bodies` IDB는 partialize 밖이라 직접 접근 필요.

**Option C (Conservative) — 필드명 변경 SKIP, adapter만 추가**

Phase 0에서 `InfoboxRow` / `WikiInfoboxEntry` 공존 유지 + parseHTML adapter만 설치. 필드명 통일은 Phase 2.3 섹션 구분 행 작업 시 `type` 필드 추가하면서 자연스럽게 마무리. **Phase 1~4 안정화 후 별도 cleanup PR**.

**최종 결정**: **Option A + Option C 조합** — parseHTML adapter 설치 + Phase 0에서는 타입 alias로 공존 (`type InfoboxRow = WikiInfoboxEntry` 같은 hack). 필드명 완전 통일은 후속 PR.

**검증 테스트**:
1. v74 IDB dump 불러오기 → 인포박스 있는 문서 열기 → 모든 행 정상 렌더
2. 저장 → 리로드 → 동일하게 렌더 (data corruption 없음)
3. 새 인포박스 추가 → `{key, value, type}` 형태로 저장
4. console에 `r.label` 참조 남은 곳 없는지 (grep 검증)

### 0.3 wiki-to-tiptap.ts 인포박스 변환 개선

**문제**: `wiki-to-tiptap.ts:10` WikiArticle → Note 변환 시 인포박스를 일반 table로 변환.

**변경**: `InfoboxBlockNode` 타입으로 변환하도록 수정. attrs 매핑 (`title`, `rows`) 추가.

### 0.4 Insert 레지스트리 단일화 (파운딩 원칙 #2)

**신규 파일**: `lib/editor/insert-registry.ts`
```typescript
export interface InsertItem {
  id: string
  label: string
  icon: IconComponent
  category: "basic" | "media" | "embed" | "wiki" | "advanced"
  tier: EditorTier[]  // 어느 티어에서 사용 가능한지
  command: (editor: Editor) => void
  keywords: string[]  // 검색 키워드
  shortcut?: string
}

export const INSERT_REGISTRY: InsertItem[] = [
  // 기존 insert-menu.tsx + SlashCommand.tsx + FixedToolbar.tsx에서 통합
]
```

**수정**:
- `components/insert-menu.tsx` — `INSERT_REGISTRY` 필터링으로 변환
- `components/editor/SlashCommand.tsx` — `INSERT_REGISTRY` 검색으로 변환
- `components/editor/toolbar/FixedToolbar.tsx` — `INSERT_REGISTRY` ID 참조로 변환

**검증**: 기존 3곳에서 표시되던 모든 아이템이 동일하게 나타나는지. 각 아이템 실행 결과가 이전과 동일한지.

### Phase 0 Store migration
없음. 순수 리팩토링 + 버그 수정.

### Phase 0 예상 파일 변경 수
- 수정: ~6 파일 (types, wiki-infobox, infobox-node, wiki-to-tiptap, 3곳 insert UI)
- 신규: 1 파일 (insert-registry.ts)

### Phase 0 PR 메시지 제안
```
refactor: Infobox 타입 통일 + WikiInfobox 저장 버그 수정 + Insert 레지스트리 단일화

- InfoboxRow → WikiInfoboxEntry 타입 통일
- WikiInfobox 컴포넌트에 entityType prop 추가 (note/wiki 분리)
- wiki-to-tiptap: WikiArticle → Note 변환 시 InfoboxBlockNode 사용
- Insert 레지스트리 단일화: insert-menu + SlashCommand + FixedToolbar 3곳 통합
```

---

## 🏷 Phase 1 — 배너 (Hatnote + Ambox)

> 축 A. 가장 Easy × 가장 Impact 높은 기능부터.

### 1.1 Hatnote 시스템

**신규 파일**:
- `components/wiki-editor/wiki-hatnote.tsx` — italic indent 1.6em 렌더 컴포넌트
- `components/wiki-editor/wiki-hatnote-editor.tsx` — 편집 패널 (타입 선택 + WikiArticle 검색)

**수정 파일**:
- `lib/types.ts` — `Hatnote` 타입 정의:
  ```typescript
  type HatnoteType = "about" | "for" | "distinguish" | "see-also" | "main" | "further" | "parent-doc" | "child-doc"
  interface Hatnote { id: string; type: HatnoteType; text: string; targetId?: string }
  interface WikiArticle { /* ... */ hatnotes?: Hatnote[] }
  ```
- `lib/store/slices/wiki-articles.ts` — `addHatnote`, `removeHatnote`, `updateHatnote` action
- `lib/store/index.ts` — migration v75 → v76 (`hatnotes: []` backfill)
- `components/wiki-editor/wiki-article-view.tsx` — 최상단 hatnote 렌더 (Default 레이아웃)
- `components/wiki-editor/wiki-article-encyclopedia.tsx` — 동일 (Encyclopedia)
- `lib/wiki-block-utils.ts` — 필요 시 공유 유틸

**CSS**:
- `app/globals.css` — `.plot-hatnote` 클래스:
  ```css
  .plot-hatnote {
    font-style: italic;
    padding-left: 1.6em;
    margin-bottom: 0.5em;
    color: var(--muted-foreground);
    font-size: 0.9em;
  }
  .plot-hatnote + .plot-hatnote { margin-top: -0.25em; }
  ```

**편집 UX**:
- SmartSidePanel Detail 탭에 "Hatnote" 섹션 추가
- "+ Hatnote 추가" 버튼 → 모달 (타입 드롭다운 + 텍스트 입력 + WikiArticle 검색)
- 기존 hatnote 목록 (타입 뱃지 + 텍스트 + 삭제 버튼)

**Hatnote 템플릿 (pre-filled 문구)**:
- `about` → "이 문서는 {text}에 관한 것입니다. 다른 뜻은 [[target]] 참조"
- `for` → "{text}에 대해서는 [[target]] 참조"
- `distinguish` → "{text}과 혼동하지 마세요. → [[target]]"
- `see-also` → "함께 보기: [[target]]"
- `main` → "자세한 내용: [[target]]"
- `further` → "심화: [[target]]"
- `parent-doc` → "상위 문서: [[target]]"
- `child-doc` → "하위 문서: [[target]]"

**테스트**:
1. Hatnote 추가 → 저장 → 리로드 → 유지
2. 8가지 타입 모두 올바른 템플릿 적용
3. targetId WikiArticle로 정상 링크
4. Default/Encyclopedia 양쪽 렌더

**커밋 메시지**: `feat(wiki): Hatnote 시스템 추가 + Store v76`

### 1.2 Ambox 자동 배너

**신규 파일**:
- `components/wiki-editor/wiki-status-banner.tsx` — severity별 좌측 스트립 배너
- `lib/wiki-status-compute.ts` — 자동 계산 로직

**수정 파일**:
- `lib/types.ts`:
  ```typescript
  type WikiCompleteness = "stub" | "draft" | "complete" | "featured"
  interface WikiArticle { /* ... */ completeness?: WikiCompleteness }
  ```
- `lib/store/slices/wiki-articles.ts` — `setCompleteness` action
- `lib/store/index.ts` — migration v76 → v77
- `lib/colors.ts` — Ambox 5색 상수:
  ```typescript
  export const AMBOX_COLORS = {
    notice: "#3366cc",    // 파랑
    delete: "#b32424",    // 빨강
    content: "#f28500",   // 주황
    style: "#ffcc33",     // 노랑
    move: "#9932cc",      // 보라
    protection: "#a2a9b1" // 회색
  }
  ```
- `components/wiki-editor/wiki-article-view.tsx` / `wiki-article-encyclopedia.tsx` — 상단 자동 배너 렌더

**자동 계산 로직** (`lib/wiki-status-compute.ts`):
```typescript
export function computeAutoBanners(article: WikiArticle, stats: {
  backlinksCount: number
  footnotesCount: number
  blocksCount: number
  categoryIds?: string[]
}): AutoBanner[] {
  const banners: AutoBanner[] = []
  if (stats.backlinksCount === 0) banners.push({ type: "orphan", severity: "style" })
  if (stats.footnotesCount === 0 && article.completeness !== "stub") {
    banners.push({ type: "unsourced", severity: "content" })
  }
  if (!stats.categoryIds?.length) banners.push({ type: "uncategorized", severity: "notice" })
  if (article.completeness === "stub" || stats.blocksCount <= 4) {
    banners.push({ type: "stub", severity: "style" })
  }
  if (article.completeness === "featured") {
    banners.push({ type: "featured", severity: "notice", icon: "★" })
  }
  return banners
}
```

**CSS**:
```css
.plot-ambox {
  border: 1px solid var(--border);
  border-left: 10px solid var(--ambox-severity);
  background-color: var(--muted);
  padding: 8px 12px 8px 20px;
  margin: 8px 0;
  border-radius: 6px;      /* Linear 톤 */
  font-size: 0.9em;
}
.plot-ambox__icon { margin-right: 8px; }
```

**편집 UX**:
- SmartSidePanel Detail 탭 "품질" 섹션
- `completeness` 수동 선택 드롭다운 (Stub/Draft/Complete/Featured)
- 자동 배너는 hover tooltip으로 "왜 표시되는지" 설명

### 1.2.1 자동 배너 Settings Toggle (Risk #5 대응 — 기존 문서 시각적 변화 최소화)

> ⚠️ Phase 1.2를 머지하면 기존 위키 문서 위에 **갑자기 주황/노랑 배너**가 나타남. "내가 뭘 건드린 건가" 오해 유발 가능.

**대응**: Settings에 `autoQualityBanners: boolean` toggle 추가. **기본값 false**.

**변경 파일**:
- `lib/store/slices/ui.ts` (or 해당 slice):
  ```typescript
  interface UiSettings { /* ... */ autoQualityBanners: boolean }
  // 기본값: false (기존 사용자에게 배너 안 보이도록)
  ```
- `components/settings/wiki-settings.tsx` (or 유사) — "자동 품질 배너 표시" toggle
- `components/wiki-editor/wiki-status-banner.tsx` — `autoQualityBanners` false면 자동 배너 렌더 스킵. 수동 `completeness` 지정 배너(featured ★ 등)는 항상 표시.

**UX 플로우**:
1. 기존 사용자 Phase 1.2 머지 후에도 **아무 시각 변화 없음**
2. 새 사용자는 Settings에서 "자동 배너" 발견 → 켜면 stub/orphan/unsourced 배너 자동 표시
3. 한 번 켜면 hover tooltip으로 "왜 이 배너가 표시되는지" 설명

**테스트**:
1. 백링크 0인 문서 → orphan 배너 표시
2. 각주 0 + draft 이상 → unsourced 배너
3. 카테고리 없음 → uncategorized 배너
4. 블록 ≤4 → stub 배너 (heuristic `isWikiStub()` 통합)
5. 수동 "featured" → 금색 ★ 배너
6. 조건 해소 시 배너 사라짐

**커밋 메시지**: `feat(wiki): Ambox 자동 배너 시스템 (Stub/Orphan/Unsourced/Uncategorized/Featured) + Store v77`

### Phase 1 예상 파일 변경
- 수정: ~8 파일 (types, wiki-articles slice, store migration, wiki-article-view, encyclopedia, colors, wiki-block-utils, globals.css)
- 신규: ~4 파일 (wiki-hatnote.tsx, wiki-hatnote-editor.tsx, wiki-status-banner.tsx, wiki-status-compute.ts)

---

## 🎨 Phase 2 — 위키 디자인 (대표 이미지 + themeColor + 섹션 구분 행)

> 축 B. 시각적 임팩트 가장 큰 3개 묶음. Store migration 3회.

### 2.1 대표 이미지 + 캡션

**수정 파일**:
- `components/editor/nodes/infobox-node.tsx`:
  - attrs 확장: `heroImage: { url: string; caption?: string; alt?: string } | null`
  - **`addAttributes` default 반드시 `null` 명시** (기존 문서 parse 실패 방지)
  - 렌더러: `heroImage != null`일 때만 상단 `<figure>` 영역 + 이미지 + caption italic 렌더
  - 편집 UX: 이미지 영역 클릭 → URL 입력 팝업 또는 AttachmentSlice 피커
  - `useBlockResize` 훅과 통합 (이미지 크기 조절)
- `lib/store/index.ts` — migration v77 → v78 (기존 InfoboxBlockNode JSON에 heroImage: null backfill)

### 2.1.1 이중 이미지 방지 (Risk #3 대응)

> ⚠️ 기존 사용자가 인포박스 바로 위에 손으로 ImageBlock을 놓은 경우 있음. heroImage 추가 시 **위아래 이미지 2개** 노출.

**대응 UX** (편집 시점 감지):

`infobox-node.tsx`의 heroImage 설정 다이얼로그에서:
```typescript
// 편집 다이얼로그 진입 시 감지 로직
const hasAdjacentImageAbove = (editor: Editor, infoboxPos: number): boolean => {
  const $pos = editor.state.doc.resolve(infoboxPos)
  const prevNode = $pos.nodeBefore
  return prevNode?.type.name === "image" || prevNode?.type.name === "imageBlock"
}
```

**경고 다이얼로그**:
```
⚠️ 위에 이미지 블록이 있습니다
인포박스 heroImage를 추가하면 동일 이미지가 두 번 보일 수 있어요.

- [위 이미지 블록 제거하고 heroImage로 설정] — 자동 처리
- [둘 다 유지] — 의도적이면 이대로
- [취소]
```

**추가 원칙**:
- heroImage는 **optional** (`null` 허용). 기본값 `null`
- 기존 문서 자동 마이그레이션 안 함. 사용자가 명시적 설정할 때만 채움
- Phase 2.1 머지 후 기존 인포박스는 **시각 변화 없음** (heroImage 미지정 = 기존 동작)

**추가 — 노트/위키 `coverImage` 자동 추출 (Scrapbox 4-A)**:
- `lib/types.ts`:
  ```typescript
  interface Note { /* ... */ coverImage?: string }
  interface WikiArticle { /* ... */ coverImage?: string }
  ```
- `lib/editor/cover-image-extract.ts` (신규) — contentJson 파싱해서 첫 ImageBlock src 추출
- 저장 시 훅에서 자동 업데이트
- `components/notes/notes-table.tsx` (board 모드) — coverImage 있으면 썸네일 카드
- `components/wiki/wiki-dashboard.tsx` — 동일
- `components/editor/note-hover-preview.tsx` — 640px 카드 상단에 coverImage 썸네일

**CSS**:
```css
.plot-infobox__hero {
  margin: -8px -8px 8px -8px;    /* 인포박스 패딩 상쇄 */
  position: relative;
}
.plot-infobox__hero-img {
  width: 100%;
  aspect-ratio: 3/2;
  object-fit: cover;
  border-radius: 6px 6px 0 0;
}
.plot-infobox__hero-caption {
  font-style: italic;
  font-size: 0.8em;
  color: var(--muted-foreground);
  padding: 4px 8px;
  text-align: center;
}
```

**커밋 메시지**: `feat(wiki): 인포박스 heroImage + coverImage 자동 추출 + Store v78`

### 2.2 themeColor 시스템

**수정 파일**:
- `lib/types.ts`:
  ```typescript
  interface WikiArticle { /* ... */ themeColor?: { light: string; dark: string } }
  ```
- `lib/store/slices/wiki-articles.ts` — `setThemeColor` action
- `lib/store/index.ts` — migration v78 → v79
- `components/wiki-editor/wiki-article-view.tsx` / `wiki-article-encyclopedia.tsx`:
  - 최상위 wrapper에 `style={{ "--plot-doc-theme": themeColor.light, "--plot-doc-theme-dark": themeColor.dark }}`
- `app/globals.css` — CSS variable cascade (**wrapper scope 필수, Risk #4 대응**):
  ```css
  /* ❌ 금지: :root에 전역 선언하면 Notes/Calendar 등 다른 공간에도 오염
     :root { --plot-doc-theme-active: ... }  ← 절대 사용 금지
  */

  /* ✅ 권장: .plot-wiki-article wrapper 내부에서만 scope 제한 */
  .plot-wiki-article {
    --plot-doc-theme-active: var(--plot-doc-theme, var(--accent));
  }
  .dark .plot-wiki-article {
    --plot-doc-theme-active: var(--plot-doc-theme-dark, var(--accent));
  }
  ```
  이렇게 하면 `.plot-wiki-article` 내부 자손만 themeColor cascade를 받음. Notes/Calendar/Library 등 다른 공간은 기존 `--accent` 사용 — 오염 없음.

- `components/wiki-editor/wiki-article-view.tsx` / `wiki-article-encyclopedia.tsx`:
  - 최상위 wrapper에 `className="plot-wiki-article"` 추가
  - inline style로 `themeColor.light/dark` 주입: `style={{ "--plot-doc-theme": a.themeColor?.light, "--plot-doc-theme-dark": a.themeColor?.dark }}`

- `components/editor/nodes/infobox-node.tsx` — 헤더 배경 `var(--plot-doc-theme-active)`
  - 주의: InfoboxBlockNode가 노트(非위키)에도 쓰이므로, 노트 문서에는 `--plot-doc-theme-active` 정의 없음 → fallback `var(--accent)` 자동 적용
- `components/wiki-editor/wiki-status-banner.tsx` — 옵션으로 themeColor variant
- 신규 파일: `components/wiki-editor/theme-color-picker.tsx` — HSL 피커 + 다크 미리보기
- 신규 파일: `lib/editor/color-tone-adjust.ts` — 채도 -20% + `color-mix()` 자동 생성

**채도 조정 로직**:
```typescript
// lib/editor/color-tone-adjust.ts
export function toneDownColor(hex: string, saturationReduce: number = 20): string {
  const [h, s, l] = hexToHsl(hex)
  return hslToHex(h, Math.max(0, s - saturationReduce), l)
}

export function cssColorMix(color: string, mixColor: string, percent: number): string {
  return `color-mix(in srgb, ${color} ${100 - percent}%, ${mixColor} ${percent}%)`
}
```

**편집 UX**:
- SmartSidePanel Detail 탭 "테마 컬러" 섹션
- 컬러 피커 (light + dark 쌍)
- 프리셋 팔레트 (나무위키 스타일 10색 선별)
- "톤 다운 적용" 체크박스 (채도 -20% 자동)

**CSS 적용 범위** (cascade 경로):
- `.plot-infobox__header` background
- `.plot-infobox__section` background (variant — light mix)
- `.plot-navbox__title` background (Phase 4에서)
- `.plot-ambox--featured` 좌측 스트립 (선택)

**커밋 메시지**: `feat(wiki): themeColor 시스템 + 다크모드 이중 색상 + 채도 조정 + Store v79`

### 2.3 섹션 구분 행 (Infobox 내부)

**수정 파일**:
- `lib/types.ts`:
  ```typescript
  type WikiInfoboxEntryType = "field" | "section"
  interface WikiInfoboxEntry { key: string; value: string; type?: WikiInfoboxEntryType }
  ```
- `lib/store/index.ts` — migration v79 → v80 (기존 entry에 `type: "field"` backfill)
- `components/editor/nodes/infobox-node.tsx`:
  - section 타입일 때 `<tr><td colspan={2} class="plot-infobox__section">{key}</td></tr>` 렌더
  - 편집 UX: 행 추가 시 "일반 필드 / 섹션 구분 행" 선택
  - section 행은 label만 표시 (value 입력 UI 숨김)
- `components/editor/wiki-infobox.tsx` — 동일 처리

**CSS**:
```css
.plot-infobox__section {
  background-color: color-mix(in srgb, var(--plot-doc-theme-active) 30%, var(--muted));
  color: var(--foreground);
  text-align: center;
  font-weight: 700;
  padding: 6px 10px;
  font-size: 0.85em;
  text-transform: uppercase;    /* Linear CAPS 라벨 */
  letter-spacing: 0.05em;
}
```

**편집 UX**:
- 기존 "Add row" 버튼 → 드롭다운으로 확장: "일반 필드 추가" / "섹션 구분 행 추가"
- 섹션 행 hover 시 삭제 버튼 (기존 패턴)
- drag handle로 순서 변경 (기존 dnd-kit 재활용)

**테스트**:
1. 섹션 구분 행 추가 → 저장 → 리로드 → 유지
2. 섹션 행 삭제 → 아래 필드 정상 유지
3. 섹션 행 drag로 순서 변경
4. themeColor 변경 시 섹션 행 배경색 cascade

**커밋 메시지**: `feat(wiki): 인포박스 섹션 구분 행 + Store v80`

### Phase 2 예상 파일 변경
- 수정: ~10 파일
- 신규: ~3 파일

---

## ✏️ Phase 3 — 위키 편집 UX (히스토리 + 요약 + 타입 스키마)

### 3.1 편집 히스토리 v1 + 편집 요약

**수정 파일**:
- `lib/types.ts`:
  ```typescript
  interface HistoryEntry {
    timestamp: number
    snapshotId: string
    summary?: string
    contentJson?: object    // TipTap JSON, IDB 분리 권장
    infoboxSnapshot?: WikiInfoboxEntry[]
    wordCountDelta?: number
  }
  interface WikiArticle { /* ... */ history?: HistoryEntry[] }
  interface Note { /* ... */ history?: HistoryEntry[] }
  ```
- `lib/store/slices/wiki-articles.ts` — `addHistoryEntry`, `getHistoryEntry` action (50개 제한)
- `lib/store/index.ts` — migration v80 → v81
- 신규: `lib/editor/history-snapshot.ts` — throttled 저장 로직 (5분마다 or 편집 요약 강제 시)
- 신규: `components/side-panel/wiki-history-panel.tsx` — 히스토리 타임라인
- `components/side-panel/side-panel-activity.tsx` — History 서브섹션 통합
- 신규: `components/editor/save-with-summary-dialog.tsx` — 저장 시 요약 입력 다이얼로그

**편집 요약 UX**:
- 문서 편집 후 N분 경과 or 명시적 저장 버튼 클릭 → "편집 요약" prompt (optional, skip 가능)
- 예시: "섹션 구분 행 추가", "소속사 변경", "오탈자 수정"
- 빈 summary면 "edit" placeholder로 저장

**히스토리 뷰 UX**:
- SmartSidePanel Activity 탭에 "History" 서브섹션
- 목록: timestamp + summary + wordCountDelta
- 각 항목 클릭 → 스냅샷 내용 미리보기 (읽기 전용 TipTap)
- v2 (후속 Phase): 두 리버전 선택 → diff 뷰 (`diff-match-patch`)
- v3 (후속 Phase): 롤백 버튼

**IDB 분리**:
- contentJson snapshot은 크기가 큼 → 별도 IDB `plot-wiki-history` (Attachment 패턴 참조)
- meta만 Zustand persist

**커밋 메시지**: `feat(wiki): 편집 히스토리 v1 + 편집 요약 필드 + Store v81`

### 3.2 타입 인포박스 스키마

**신규 디렉터리**: `lib/wiki-types/schemas/`
- `person.json`:
  ```json
  {
    "type": "person",
    "label": "인물",
    "icon": "user",
    "defaultFields": [
      { "key": "이름", "type": "field", "value": "" },
      { "key": "출생", "type": "field", "value": "" },
      { "key": "국적", "type": "field", "value": "" },
      { "key": "직업", "type": "field", "value": "" },
      { "type": "section", "key": "경력" },
      { "key": "소속", "type": "field", "value": "" },
      { "key": "주요 작품", "type": "field", "value": "" }
    ],
    "suggestedHatnotes": ["distinguish", "about"]
  }
  ```
- `place.json`, `concept.json`, `work.json`, `organization.json`, `event.json` — 동일 패턴

**신규 파일**:
- `lib/wiki-types/index.ts` — schema loader + export
- `components/wiki-editor/wiki-type-picker.tsx` — 생성 시 타입 선택 UI
- `components/wiki-editor/wiki-type-switcher.tsx` — 기존 문서 타입 변경 (인포박스 merge)

**수정 파일**:
- `lib/types.ts`:
  ```typescript
  type ArticleType = "person" | "place" | "concept" | "work" | "organization" | "event" | "custom"
  interface WikiArticle { /* ... */ articleType?: ArticleType }
  ```
- `lib/store/slices/wiki-articles.ts` — `createWikiArticle(type)` 확장 (기본 필드 pre-populate)
- `lib/store/index.ts` — migration v81 → v82
- `components/wiki/wiki-create-dialog.tsx` (or 유사) — 타입 선택 단계 추가

**편집 UX**:
1. 위키 문서 생성 시 모달:
   - Step 1: 제목 입력
   - Step 2: 타입 선택 (6종 icon grid + "Blank" 옵션)
   - Step 3: 생성 → 해당 타입 기본 필드 자동 삽입
2. 기존 문서 타입 변경: SmartSidePanel Detail 탭에 "Type" 드롭다운

### 3.2.1 타입 전환 시 Merge 원칙 (필수, Risk #2 대응)

> ⚠️ 기존 문서(직접 채운 인포박스 있음)에 나중에 타입 지정할 때, **replace**하면 사용자 데이터 손실. **merge only** 원칙.

**규칙 (코드 주석으로도 남길 것)**:

```typescript
// lib/wiki-types/apply-schema.ts
export function applyTypeSchema(
  existingInfobox: WikiInfoboxEntry[],
  typeSchema: TypeSchema
): WikiInfoboxEntry[] {
  // 1. 기존 entry 전부 보존 (순서도 유지)
  const result = [...existingInfobox]

  // 2. 스키마 기본 필드 중 "기존에 없는 key"만 추가
  //    - 같은 key가 이미 있으면 기존 값 우선 (덮어쓰지 않음)
  //    - section 구분 행은 "같은 위치에 이미 있으면" 스킵
  for (const schemaField of typeSchema.defaultFields) {
    const exists = result.some(e =>
      e.key === schemaField.key && (e.type ?? "field") === (schemaField.type ?? "field")
    )
    if (!exists) {
      // 빈 value로 추가 (사용자가 나중에 채우도록)
      result.push({ ...schemaField, value: schemaField.value ?? "" })
    }
  }

  return result
}
```

**확인 UX**:
- 타입 변경 시 확인 다이얼로그:
  ```
  [타입: Person] 적용
  - 기존 필드 5개는 유지됩니다
  - 새 필드 3개가 추가됩니다: 국적, 직업, 출생일
  - [적용] [취소]
  ```

**절대 금지**:
- 기존 entry 삭제 금지
- 기존 entry value 덮어쓰기 금지
- 타입 변경 후 이전 타입으로 되돌릴 때 새로 추가된 빈 필드 자동 제거 금지 (사용자가 이미 값 채웠을 수 있음)

**테스트**:
1. 빈 인포박스 → Person 타입 적용 → 7개 기본 필드 + section 1개 pre-populate
2. 사용자 직접 채운 필드 5개 있는 문서 → Person 타입 적용 → 기존 5개 유지 + 중복 없는 2-3개만 추가
3. Person → Place 타입 변경 → 기존 Person 필드도 유지 (사용자가 수동 정리)

**sample 확장 경로**:
- v1: 6종 고정 타입
- v2: 사용자 정의 타입 (`lib/wiki-types/user-schemas/` IDB 저장)
- v3: 커뮤니티 공유 스키마 (Phase 밖)

**커밋 메시지**: `feat(wiki): 타입 인포박스 스키마 (Person/Place/Concept/Work/Organization/Event) + Store v82`

### Phase 3 예상 파일 변경
- 수정: ~8 파일
- 신규: ~12 파일 (6 JSON 스키마 + history panel + type picker 등)

---

## 🔧 Phase 4 — 보충 (Callout 12타입 + Navbox 자동 + Alias UI)

### 4.1 Callout 12타입 확장

**수정 파일**:
- `components/editor/nodes/callout-node.tsx` (or 현재 Callout 구현체):
  - attrs: `type: CalloutType` 확장 (12타입)
  - 타입별 아이콘 + 색상 자동
- `lib/colors.ts` — Callout RGB 상수 (Obsidian 참고):
  ```typescript
  export const CALLOUT_COLORS_RGB = {
    note: "68, 138, 255",
    abstract: "0, 188, 212",
    info: "68, 138, 255",
    todo: "68, 138, 255",
    tip: "0, 188, 212",
    success: "0, 200, 83",
    question: "255, 145, 0",
    warning: "255, 145, 0",
    failure: "255, 23, 68",
    danger: "255, 23, 68",
    bug: "255, 23, 68",
    example: "124, 77, 255",
    quote: "158, 158, 158"
  }
  ```
- `app/globals.css`:
  ```css
  .plot-callout {
    --callout-color: var(--callout-rgb-note);
    background-color: rgba(var(--callout-color), 0.1);
    border-left: 4px solid rgb(var(--callout-color));
    padding: 12px 16px;
    border-radius: 6px;
  }
  .dark .plot-callout { background-color: rgba(var(--callout-color), 0.2); }
  .plot-callout[data-type="note"]     { --callout-color: var(--callout-rgb-note); }
  .plot-callout[data-type="warning"]  { --callout-color: var(--callout-rgb-warning); }
  /* ... 12 타입 전부 */
  ```

**편집 UX**:
- Callout 블록 타이틀 클릭 → 타입 드롭다운 (12 + 별칭 총 ~20개 라벨)
- 별칭 입력 시 자동 정규화 (ex: "caution" → "warning")

**커밋 메시지**: `feat(editor): Callout 12타입 변형 시스템`

### 4.2 Navbox 자동 생성 (카테고리 기반)

**신규 파일**:
- `components/editor/nodes/navbox-node.tsx` — TipTap atom 블록 노드 (base 티어)
- `lib/wiki-categories-query.ts` — 카테고리 형제 문서 자동 수집

**수정 파일**:
- `components/editor/core/shared-editor-config.ts` — base 티어에 NavBoxNode 등록
- `lib/editor/insert-registry.ts` — "Navigation Box" 추가

**NavBoxNode attrs**:
```typescript
interface NavBoxAttrs {
  title: string
  items?: string[]            // 수동 — WikiArticle ID 배열
  sourceCategoryId?: string   // 자동 — 지정 시 itemsRuntime 자동 생성
  collapsed?: boolean          // 기본 collapsed (긴 목록)
  layout?: "inline" | "grid"   // 쉼표 나열 vs 그리드
}
```

**렌더링 로직**:
- `sourceCategoryId` 있으면 `wikiCategories.filter(c => c.id === sourceCategoryId)` + 해당 카테고리 형제 wikiArticles 자동 수집
- 수동 `items[]`와 병합 (중복 제거)
- 외곽: `border: 1px solid var(--border); border-radius: 6px;`
- 타이틀 행: `background: var(--plot-doc-theme-active);`
- 그룹 헤더: 카테고리명 (있으면)

**편집 UX**:
- `/navbox` 슬래시 or Insert 메뉴 → 모달:
  - 타이틀 입력
  - "수동 / 자동" 토글
  - 수동: WikiArticle 검색 다중 선택
  - 자동: 카테고리 드롭다운
  - 레이아웃 선택 (인라인 쉼표 / 그리드)

**커밋 메시지**: `feat(editor): NavBox 블록 (base 티어, 카테고리 자동 수집)`

### 4.3 별명(Alias) 관리 UI

**선행 체크**: `WikiArticle.aliases` 필드가 이미 있는지 `lib/types.ts`에서 확인.
- 있으면: UI만 추가 (migration 불필요)
- 없으면: `aliases?: string[]` 추가 + migration

**수정 파일**:
- `components/wiki-editor/wiki-alias-editor.tsx` (신규) — 별명 추가/제거 UI
- `components/side-panel/smart-side-panel.tsx` (or 유사) — Detail 탭에 "별명" 섹션 추가
- `lib/editor/wikilink-resolver.ts` (or 유사) — 링크 해석 시 aliases 포함 검색
- `components/editor/WikilinkSuggestion.tsx` / `MentionSuggestion.tsx` — 드롭다운 검색 시 aliases 매칭

**편집 UX**:
- Detail 탭 "별명" 섹션:
  - 현재 별명 목록 (chip + × 버튼)
  - 입력 필드 "별명 추가" (Enter로 확정)
- 예: "아이유" 문서 → 별명 ["IU", "이지은"]
- `[[IU]]` 입력 → 자동으로 "아이유" 문서에 연결 (wiki: prefix 자동 삽입)

**커밋 메시지**: `feat(wiki): Alias 관리 UI + 링크 해석 통합`

### Phase 4 예상 파일 변경
- 수정: ~8 파일
- 신규: ~4 파일

---

## 📦 Store Migration 요약

| Migration | 추가 필드 | Backfill |
|-----------|----------|---------|
| v75 → v76 | `WikiArticle.hatnotes?: Hatnote[]` | `[]` |
| v76 → v77 | `WikiArticle.completeness?: WikiCompleteness` | undefined |
| v77 → v78 | `InfoboxNode.heroImage`, `Note.coverImage`, `WikiArticle.coverImage` | null |
| v78 → v79 | `WikiArticle.themeColor?: {light, dark}` | undefined |
| v79 → v80 | `WikiInfoboxEntry.type` | `"field"` |
| v80 → v81 | `WikiArticle.history?`, `Note.history?` | `[]` |
| v81 → v82 | `WikiArticle.articleType?` | undefined |
| v82 → v83 (optional) | `WikiArticle.aliases?` (이미 있으면 skip) | `[]` |

**원칙**: 각 PR에 migration 1회만. 순서 꼬임 방지.

---

## 🚀 PR 분할 제안

| PR | 범위 | 크기 | 리뷰 포인트 |
|----|------|-----|-----------|
| **PR-0** | Phase 0 전체 (선행) | 중 | 버그 수정 검증, 3곳 Insert UI 동작 동일성 |
| **PR-1** | Phase 1.1 Hatnote | 중 | Default/Encyclopedia 양쪽 렌더, 8타입 동작 |
| **PR-2** | Phase 1.2 Ambox | 중 | 자동 계산 정확성, severity 5색 |
| **PR-3** | Phase 2.1 대표 이미지 + coverImage | 대 | 노드 schema 변경, 갤러리 뷰 통합 |
| **PR-4** | Phase 2.2 themeColor | 대 | 다크모드 cascade, 채도 조정 로직 |
| **PR-5** | Phase 2.3 섹션 구분 행 | 중 | discriminator + backfill |
| **PR-6** | Phase 3.1 히스토리 v1 + 요약 | 대 | IDB 분리 구조, 저장 throttle |
| **PR-7** | Phase 3.2 타입 스키마 | 대 | JSON 스키마 설계, 생성 UX |
| **PR-8** | Phase 4.1 Callout 12타입 | 소 | CSS variable 시스템 |
| **PR-9** | Phase 4.2 NavBox | 대 | 자동 수집 쿼리, 렌더 성능 |
| **PR-10** | Phase 4.3 Alias UI | 소 | (PR 병합 가능) |

**예상 전체 PR 수**: 9-10개. Phase 2-3이 가장 크고, Phase 1/4는 Easy 묶음.

---

## ⚠️ Risk & Watch Out

### Risk R1 — Store migration 순서 꼬임
- 각 PR = 1 migration 원칙
- 리베이스 시 version 번호 충돌 주의
- migration 테스트: 이전 버전 persist 데이터 로드 → 자동 업그레이드 검증

### Risk R2 — TipTap 노드 schema 변경 시 기존 문서 호환성
- `InfoboxBlockNode.heroImage` 추가 (Phase 2.1) — 기존 문서에는 attrs 없음
- `addAttributes` 기본값 `null` 설정 필수
- 테스트: 구 문서 열어서 에러 없이 렌더되는지

### Risk R3 — CSS cascade 충돌
- `--plot-doc-theme-active` 변수 범위 제한 (`.plot-wiki-article` wrapper에만 적용)
- 기존 accent 색과 충돌 방지
- 다크모드 `.dark` selector 일관성

### Risk R4 — Linear 톤 이탈 가능성
- themeColor에 원색(#FF0000 등) 입력 시 Linear 톤 이탈
- 자동 채도 -20% + `color-mix()` 강제 적용
- 프리셋 팔레트로 유도 (원색 10종 사전 선별)

### Risk R5 — Phase 3.1 히스토리 데이터 크기
- contentJson snapshot은 대형 (MB 단위 가능)
- 50개 제한 (원형 버퍼)
- IDB `plot-wiki-history` 분리 저장
- throttle 5분 or 명시적 저장

### Risk R6 — Phase 4.2 NavBox 자동 쿼리 성능
- 카테고리 수 많으면 쿼리 느릴 수 있음
- `useMemo`로 캐싱
- 필요 시 worker 분리 (기존 FlexSearch 패턴 참조)

---

## ✅ Phase 완료 기준 (Definition of Done)

각 Phase 완료 판정:
- [ ] 모든 sub-task 커밋 완료
- [ ] TypeScript 컴파일 clean (`npm run build` 통과)
- [ ] Store migration 단방향 (이전 버전 → 최신 업그레이드) 테스트 통과
- [ ] Default + Encyclopedia 양쪽 레이아웃에서 동작 확인
- [ ] 다크모드 전환 시 색상 정상
- [ ] 호버 프리뷰/피커 드롭다운에서 정상 동작 (regression)
- [ ] PR 리뷰 승인 + squash merge

---

## 📅 Phase 착수 순서 권장

1. **이번 세션**: Phase 0 (선행 조건) 완료 — 버그 + 리팩토링. 신규 기능 X
2. **다음 세션**: Phase 1.1 Hatnote — 가장 Easy × High
3. **이어서**: Phase 1.2 Ambox → Phase 2.1 대표 이미지 → ...

**세션당 평균 1-2 PR** 예상. Phase 2-3은 분할해서 여러 세션으로.

---

## 🛡 Pre-flight Safety Checklist (Phase 0 착수 전 필수)

> 본 Phase Plan은 "기존 위키 데이터 손상 없이 확장"이 목표. 본 체크리스트는 보수적 안전장치.

### PF-1. IDB 백업 (사용자 직접)

**Phase 0 착수 직전** 반드시 현재 IDB 데이터를 백업:
- Plot의 기존 Settings → "데이터 관리" → Export 기능 활용 (이미 존재 확인 필요)
- 또는 수동 백업:
  1. Chrome DevTools → Application → IndexedDB → `plot-*` 전체 DB
  2. Export 또는 복제
- 파일명 예: `plot-backup-pre-wiki-enrichment-2026-04-14.json`
- **롤백 경로**: Phase 0 중 어떤 이유로든 문제 발생 시 이 백업에서 복구

### PF-2. 각 PR 머지 전 Smoke Test 루틴

```
[Smoke Test 체크리스트]
□ npm run build — 컴파일 clean
□ 기존 위키 문서 5개 랜덤 열기 → 렌더 에러 0
□ 기존 노트 5개 열기 → 인포박스/콜아웃 블록 정상
□ 다크모드 전환 → 색상 정상
□ Expand/Collapse All 동작 정상
□ [[/@]/# 드롭다운 정상 표시
□ 호버 프리뷰 정상
□ fontSize cascade (em) 기존 위키에서 정상
□ IDB 용량 (DevTools > Application) 급증 없음
```

### PF-3. Phase별 Regression 체크

| Phase | Regression 체크 |
|-------|----------------|
| Phase 0 | 기존 인포박스 data → adapter로 `{label} → {key}` 자동 정규화 되는지 (data-rows attribute 경유 검증) |
| Phase 1.1 | Hatnote 없는 문서는 최상단 공백 없음 (기본 hatnotes: []) |
| Phase 1.2 | Settings `autoQualityBanners: false` 기본값이라 기존 문서에 배너 없음 |
| Phase 2.1 | heroImage null 기본값이라 기존 인포박스 상단 공간 없음 |
| Phase 2.2 | themeColor 미지정 문서는 기본 accent 사용, 다른 space(Notes/Calendar)에 CSS 오염 없음 |
| Phase 2.3 | 기존 entry는 `type: "field"` 자동 backfill, 렌더링 동일 |
| Phase 3.1 | History 0개 문서 → Activity 탭 "History" 섹션 빈 상태 처리 |
| Phase 3.2 | 기존 문서 articleType undefined → "Blank" 간주, 자동 필드 추가 없음 |

### PF-4. 데이터 손상 감지 코드 (Early Warning)

`lib/store/index.ts` 각 migration에 sanity check 로그 추가:
```typescript
migrate: (state, version) => {
  const beforeCount = {
    notes: Object.keys(state.notes ?? {}).length,
    wikiArticles: Object.keys(state.wikiArticles ?? {}).length,
    references: Object.keys(state.references ?? {}).length
  }

  // ... migration logic ...

  const afterCount = { /* 동일 필드 재계산 */ }
  if (afterCount.notes !== beforeCount.notes ||
      afterCount.wikiArticles !== beforeCount.wikiArticles) {
    console.error("[Store Migration] Entity count changed!", { beforeCount, afterCount, version })
    // Production: throw? or silent log?
  }
  return state
}
```

**엔티티 수량 보존**을 migration 원칙으로 삼는다. 줄어들면 에러.

### PF-5. 단계별 Dogfooding (권장 흐름)

```
Phase 0 merge → 1-2일 자체 사용 (버그 수정 성격이라 기존 동작 개선됨)
              → 인포박스 편집/저장 반복 테스트
              → 문제 없으면 Phase 1 진입

Phase 1 merge → Settings 자동 배너 off 상태로 1일
              → on으로 토글해서 기존 문서에 배너 자동 표시 확인
              → Hatnote 3-5개 문서에 추가해서 저장 테스트
              → 문제 없으면 Phase 2 진입

... 이후 동일 패턴 (Phase별 1-2일 체류)
```

**속도 vs 안전 트레이드오프**: 빠르게 가고 싶으면 Phase 1~2를 한 세션에 묶고, 안전하게는 각 Phase 별도 세션.

### PF-6. 비상 롤백 플레이북

Phase 중 심각한 데이터 손실 발견 시:

1. **즉시 git revert** 해당 PR (기능 제거 — 데이터는 그대로)
2. Store migration이 이미 실행됐다면:
   - 신규 optional 필드는 남아 있지만 참조 안 하면 무해
   - 삭제/변경된 필드는 **PF-1 백업에서 복원**
3. IDB `plot-*` DB 전체 삭제 → PF-1 백업 Import
4. 브라우저 새로고침 → 이전 상태 복구

---

**참조 문서**:
- `docs/BRAINSTORM-2026-04-14-wiki-ultra.md` — 브레인스토밍 결과 + CSS 수치 덤프
- `docs/BRAINSTORM-2026-04-06.md` — 원본 브레인스토밍 (Section 8/9)
- `docs/CONTEXT.md` line 220-243 — P2 TODO
- `.omc/notepad.md` — Active Tasks
- `.omc/notepads/general/decisions.md` — 아키텍처 결정 로그
