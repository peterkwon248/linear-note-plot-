# Wiki 2-mode 회귀 — Book 비전 폐기 + 디폴트/엔하위키 프리셋 집중

**날짜**: 2026-04-19
**상태**: 전략 대전환 확정 → 재편-A 전 단계 (박스 통합) 착수
**이전 문서**:
- [BRAINSTORM-2026-04-14-wiki-ultra.md](./BRAINSTORM-2026-04-14-wiki-ultra.md) — 원래 2-mode (Default / Encyclopedia) 유지 명시
- [BRAINSTORM-2026-04-16-magazine-layout.md](./BRAINSTORM-2026-04-16-magazine-layout.md) — 폐기 대상 (Magazine Tier/Hero/Pull Quote/Drop cap)
- [BRAINSTORM-2026-04-17-page-identity.md](./BRAINSTORM-2026-04-17-page-identity.md) — 부분 폐기 (Tier 0~1만 유지, 2~5 폐기)

---

## 1. 배경 — 전략 재검토 (2026-04-19)

### 1.1 사용자 관찰

> "나는 책이든 위키든 잡지든 유저가 알아서 디자인 레이아웃을 해서 book의 형태로 알아서 잘 커스터마이징 할 수 있는 앱을 생각했는데, 정작 UI/UX가 복잡해지고 버그도 많아지고, 무엇보다 기존에 상용화된 앱만큼의 퀄리티를 갖추려면 너무 오랜 시간이 걸리고 힘들 거란 결론이 나왔어. 차라리 기존에 디폴트 / 위키 모드를 정교하게 다듬어서 위키에만 집중하고 위키적으로 꾸미는 요소만 키우는 게 낫지 않나."

### 1.2 진단

- **축1 (자유 레이아웃 = book 비전)**: Notion/Framer가 수년간 파 온 영역. 1인 개발이 상용 퀄리티까지 따라가는 데 3-5년. 그 사이 "이도저도 아닌" 구간이 길어지고, 조합 QA 부담(name × themeColor × rule × spanColumns × dropCap × serif × …)이 PR마다 polynomial하게 증가.
- **축2 (자동 지식망 + 제텔카스텐 + Reference)**: Plot만 파는 해자. 같은 시간 투자 시 10배 차이.
- Phase 3.1 Magazine/Tier는 축1 투자. 사용자 체감 "복잡 + 버그"는 당연한 결과.

### 1.3 전환 원칙

> **모드 = 선택지가 아니라 배치 조합의 결과적 이름**.
>
> TOC/Infobox/References 배치 슬롯 조합에 이름을 붙인 것 = 프리셋(Default / Namu). 커스텀 배치도 가능. 프리셋은 빠른 시작점일 뿐.

---

## 2. 결정 1 — 축 전환

**Book 자유 레이아웃 비전 폐기**. Plot은 **위키 집중 + 위키적 꾸밈**만 깊이 판다.

| 이전 | 이후 |
|---|---|
| 책/위키/잡지 다 커버하는 자유 레이아웃 | 위키+디폴트 2-mode 정교화 |
| Magazine Tier 시스템 (0~5) | Tier 0~1만 유지 (테마 색상 수준) |
| Pull Quote/Hero/Drop cap/Serif mix | 전부 폐기 |
| 황금비/5:3/2:3:2 asymmetric 프리셋 | 현재 1/2/3 컬럼 토글만 유지 |

---

## 3. 결정 2 — 메타 슬롯 시스템 (TOC + Infobox + References)

레이아웃은 **3개 메타 슬롯의 배치 조합**으로 결정된다.

### 3.1 슬롯 정의

```ts
WikiArticle.layout = {
  preset: "default" | "namu" | "custom"
  slots: {
    toc?:        { position: "none" | "top" | "left-sticky" | "right-sticky" | "right-dot" }
    infobox?:    { position: "none" | "right-float" | "top-full" | "left-float" }
    references?: { position: "bottom" | "right-sidebar" | "panel-only" }
  }
}
```

- `preset` 선택 시 `slots` 자동 세팅, `"custom"`이면 사용자가 개별 지정.
- TOC 블록은 **폐기** (Phase 2-2-C의 메타→블록 통합 중 TOC 부분 롤백). TOC는 레이아웃 슬롯으로만 존재.
- Infobox도 메타 슬롯으로 환원 (블록 버전 폐기).

### 3.2 프리셋 매핑

| 슬롯 | Default (위키피디아) | Namu (엔하위키) |
|---|---|---|
| TOC | 본문 상단 | 우측 sticky dot-minimap |
| Infobox | 우측 float (22em) | 상단 full-width |
| References | 하단 섹션 | 하단 섹션 + 각주 툴팁 강조 |

---

## 4. 결정 3 — References 하단 박스 통합 (노트+위키 공용)

### 4.1 프레임

Footnote(넘버링된 본문 각주)와 Reference(bibliography)를 **하나의 하단 박스**로 묶는다. 노트와 위키 **모두 동일 컴포넌트** 사용.

### 4.2 통합 박스 구조

```
┌─ (무제목, 박스 경계선만) ────────┐
│  [1] 각주 본문 텍스트 ↩         │
│  [2] 각주 본문 → example.com ↩  │
│  [3] 각주 본문 ↩                │
│  ─── (1px 구분선) ───            │
│  · 사피엔스 — 유발 하라리        │
│  · MDN — developer.mozilla.org   │
└──────────────────────────────────┘
```

### 4.3 렌더 규칙

| 상황 | 박스 | 위쪽 (넘버) | 구분선 | 아래쪽 (점) |
|---|---|---|---|---|
| 둘 다 없음 | 숨김 | — | — | — |
| 각주만 | 표시 | `[1] [2] [3]` | ❌ | 숨김 |
| 참고만 | 표시 | 숨김 | ❌ | `· · ·` |
| 둘 다 | 표시 | `[1] [2]` | ✅ | `· · ·` |

**중복 방지**: Footnote에 이미 연결된 Reference는 아래 점 리스트에서 제외 ("같은 참조원이 두 번 나오지 않는다"). 노트에는 이미 구현돼 있고, 이번에 **위키도 같은 로직 적용**.

### 4.4 명칭

- 박스 제목: **무제목** (구분선 경계만)
- 엔티티 이름: **"Reference" 유지** (Library, Trash filter 등 모두 그대로)
- 삽입 메뉴 "Footnote" / "Reference": 그대로 (건드리지 않음)

### 4.5 기존 UX 영향 = 0

| 레이어 | 변경? |
|---|---|
| Insert/슬래시/멘션 | ❌ |
| footnote-edit-modal | ❌ |
| 사이드바 "References" 탭 | ❌ |
| Trash filter "references" | ❌ |
| Library view | ❌ |
| 본문 하단 렌더 | ✅ (유일한 변경점) |

---

## 5. 결정 4 — 엔티티 이름 유지

박스 제목이 무제목이 된 순간 UI 레이블 충돌이 사라짐. **"Reference" 엔티티 이름 그대로 유지**. 리네임은 이득 < 비용.

---

## 6. 롤백 범위

### 6.1 폐기 확정

- **PR [#208](https://github.com/peterkwon248/linear-note-plot-/pull/208) 🅑 대결정 (메타→블록 통합)** — TOC/Infobox 블록 폐기, 메타 슬롯으로 환원
- **[BRAINSTORM-2026-04-16-magazine-layout.md](./BRAINSTORM-2026-04-16-magazine-layout.md) Phase 3.1-B~F 전체**
  - Phase 3.1-B: Pull Quote 블록, `spanColumns`, `fullBleed`, `dropCap` 폐기
  - Phase 3.1-C: Hero/Divider/Caption 블록 폐기
  - Phase 3.1-D: Serif/Sans 토글, Typography 시스템 폐기
  - Phase 3.1-E: 노트 columnsBlock 확장 폐기
  - Phase 3.1-F: Built-in 재구성 폐기
- **[BRAINSTORM-2026-04-17-page-identity.md](./BRAINSTORM-2026-04-17-page-identity.md) Tier 2~5 폐기**
  - Tier 2 (Card palette 강조) — 유지
  - Tier 3 (Hero/Opening spread) — 폐기
  - Tier 4 (Full-bleed image) — 폐기
  - Tier 5 (Custom template) — Phase 4 이연

### 6.2 유지

- PR [#197](https://github.com/peterkwon248/linear-note-plot-/pull/197): `WikiTemplate` 데이터 모델 (프리셋 저장소로 재활용)
- PR [#198](https://github.com/peterkwon248/linear-note-plot-/pull/198): `ColumnRenderer`, `WikiTitle`, `WikiThemeProvider` 인프라
- PR [#199](https://github.com/peterkwon248/linear-note-plot-/pull/199)~[#201](https://github.com/peterkwon248/linear-note-plot-/pull/201): `WikiArticleRenderer` 통합 (legacy 렌더러 삭제 OK)
- PR [#202](https://github.com/peterkwon248/linear-note-plot-/pull/202): `ColumnPresetToggle` (1/2/3 컬럼)
- PR [#203](https://github.com/peterkwon248/linear-note-plot-/pull/203): 컬럼 비율 드래그 + TOC/Infobox 위치 UI (슬롯 UI로 재활용)
- PR [#204](https://github.com/peterkwon248/linear-note-plot-/pull/204): 블록 컬럼 간 드래그
- PR [#205](https://github.com/peterkwon248/linear-note-plot-/pull/205): 컬럼 추가/삭제

---

## 7. 재편 PR 분할

| PR | 내용 | Migration | 본 문서 근거 |
|---|---|---|---|
| **재편-0 (이번 PR)** | References 하단 박스 통합 (노트+위키 공용 `ReferencesBox`). 독립 완결, 재편-A 이전에 선행 가능 | 0 | §4 |
| **재편-A** | `layout.slots` 스키마 도입. PR #208 🅑 롤백 (TOC/Infobox 블록 → 메타 슬롯 환원) | v81 | §3 |
| **재편-B** | References `position` 옵션 구현 (bottom / right-sidebar / panel-only). 박스 위치 전환 | v82 | §3.1 |
| **재편-C** | 프리셋 2개 (Default / Namu) + Custom 모드 UI. 슬롯 배치 에디터 (PR #203 UI 확장) | 0 | §3.2 |
| **재편-D** | Magazine/Tier 잔재 청소. Phase 3.1-B~F 관련 코드/속성 제거. Page Identity Tier 3~5 제거 | 0 | §6.1 |

---

## 8. 이번 PR (재편-0) 범위

### 8.1 변경 파일

**신규**:
- `components/editor/references-box.tsx` — 공용 presentational 컴포넌트 (UI + 모달 + collapse)
- `components/editor/note-references-container.tsx` — 노트 어댑터
- `components/wiki-editor/wiki-references-container.tsx` — 위키 어댑터

**교체**:
- `components/note-editor.tsx` 또는 `NoteEditorAdapter.tsx` — 호출 지점 교체
- `components/wiki-editor/wiki-article-renderer.tsx` — 호출 지점 교체

**삭제**:
- `components/editor/footnotes-footer.tsx` (`NoteReferencesFooter` 포함)
- `components/wiki-editor/wiki-footnotes-section.tsx` (`WikiReferencesSection` 포함)

### 8.2 설계

**`ReferencesBox` Props**:
```ts
interface ReferencesBoxProps {
  // 넘버링된 각주 (이미 정규화됨)
  footnotes: Array<{
    id: string
    content: string
    contentJson: Record<string, unknown> | null
    referenceId: string | null
    number: number
    count?: number  // 중복 참조 횟수
  }>
  // Bibliography ref ids (각주 제외 필터링된 것)
  bibliographyRefIds: string[]
  editable: boolean
  // 액션 콜백
  onScrollToFootnote?: (id: string) => void
  onEditFootnote?: (id: string) => void
  onAddReference?: () => void
  onRemoveReference?: (refId: string) => void
  onEditReference?: (refId: string) => void
}
```

어댑터는 각자 데이터 수집 책임:
- **NoteReferencesContainer**: editor의 `footnoteRef` 노드 live 수집 + `note.referenceIds` 참조 + 중복 제거
- **WikiReferencesContainer**: `article.blocks` 순회 + IDB `getBlockBody` 로드 + `article.referenceIds` 참조 + 중복 제거

### 8.3 검증

- `npm run build` 성공
- 노트/위키 모두에서 박스 렌더 (각주만 / 참고만 / 둘 다 / 둘 다 없음) 4가지 케이스 확인
- 모달 (검색 / 생성 / 편집) 동작 유지
- `plot:scroll-to-footnote` / `plot:set-all-collapsed` / `plot:open-reference-picker` 이벤트 유지

---

## 9. 이후 과제 (이번 PR 밖)

- 재편-A 착수 (layout.slots 스키마 + 메타→블록 롤백)
- docs/PHASE-PLAN-wiki-enrichment.md 업데이트
- docs/CONTEXT.md + MEMORY.md 재편 반영

---

## 10. 참조

- 원래 2-mode 명시: [BRAINSTORM-2026-04-14-wiki-ultra.md:134](./BRAINSTORM-2026-04-14-wiki-ultra.md) — "현재 Plot 2-mode (Default 인라인 블록 / Encyclopedia float) 유지"
- 폐기 대상 Magazine 카탈로그: [BRAINSTORM-2026-04-16-magazine-layout.md](./BRAINSTORM-2026-04-16-magazine-layout.md) §5
- 유지 대상 Tier 0~1: [BRAINSTORM-2026-04-17-page-identity.md](./BRAINSTORM-2026-04-17-page-identity.md) §3
