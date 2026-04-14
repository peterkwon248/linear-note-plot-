# Plot 엔티티 철학 확정 — Note/Wiki 분리 유지 (2026-04-14)

> 이전 브레인스토밍 [BRAINSTORM-2026-04-14-wiki-ultra.md](./BRAINSTORM-2026-04-14-wiki-ultra.md) 보완.
> 엔티티 통합 vs 분리 논쟁을 종결하고 **분리 유지 + 디자인 강화** 방향으로 확정.

---

## 표류 히스토리

```
2026-03-30  PIVOT #1: 노트앱 → "IKEA식 개인 워크스페이스"
            · 새 페이지 = 템플릿 선택 첫 화면
            · Label 자동 세팅으로 "공간 만든 느낌"
            · 체감 자유도 전략

2026-04-01  PIVOT #2: ROLLBACK ← "노션식 통합 템플릿 폐기"
            · 5개 공간 각자 최적화로 회귀
            · 이유: 통합하려니 추상화 늘어남

2026-04-14  FINAL: "노트/위키 분리 유지 + 위키 디자인 강화"
            · Alpha(완전통합)/Beta(절충)/Gamma(역할태그) 모두 폐기
            · 사용자 명시: "지금 방식도 마음에 든다, 단지 위키 디자인이 약할 뿐"
            · 표류 종결
```

---

## 핵심 결정

### 1. Note / WikiArticle 별도 엔티티 유지

엔티티 통합 논의 폐기. 2026-04-01 결정 재확인.

**Why:**
- 사용자가 분리 상태에 만족
- 통합 리팩토링은 또 롤백 리스크 큼 (2026-04-01 교훈)
- **차별점의 원천은 데이터 구조** — UX로 강제할 필요 없음

### 2. 데이터 구조가 차별점의 근거

```
Note.contentJson: TipTapJSON          // 단일 연속 문서
WikiArticle.blocks: WikiBlock[]       // 모듈러 블록 배열
WikiArticle.sectionIndex: SectionIndex[] // 경량 목차
```

| 특성 | 노트 | 위키 |
|---|---|---|
| 단위 | ProseMirror 노드 (paragraph/heading 등) | WikiBlock (섹션 단위) |
| merge | text concat, lossy, 되돌리기 X | block-level, mergeHistory, unmerge ✅ |
| split | ❌ (만들 수 있음 — must-todo) | blockIds 기반 ✅ |
| 렌더러 (레이아웃 프리셋) | 없음, 만들지 말 것 | default / encyclopedia / wiki-color (TODO) |
| 섹션 단위 조작 | ❌ (단일 JSON 한계) | ✅ 블록 배열 |

### 3. 렌더러(Layout Preset)는 위키 전용

- 사용자 직관: "노트에 렌더러까지 주면 위키와 구별 없어진다" → **정확함**
- 기술 이유: 단일 TipTap JSON에는 "레이아웃" 개념 성립 안 함. 블록 배열이라야 가능.
- 결정: `layout: "default" | "encyclopedia" | "wiki-color"` 는 `WikiArticle`에만

### 4. 템플릿 3층 모델 (위키 전용)

```
Layer 1 — Layout Preset (렌더러)
  default / encyclopedia / wiki-color
  · 문서별 선택, 내용과 독립
  · 본문 배치 + 인포박스 위치 + 섹션 번호 표시 방식

Layer 2 — Content Template (섹션 배치 = 사용자가 말한 "템플릿")
  · 새 위키 생성 시 pre-populate되는 섹션 구조 + 기본 인포박스
  · Person / Place / Concept / Work / Organization / Event / Generic
  · 현재 Plot은 Generic(Overview/Details/See Also) 하나만 하드코딩

Layer 3 — Typed Infobox (C-3)
  · Layer 2의 인포박스 부분만 독립 관리
  · "이 문서 타입을 Person으로" 선택 시 인포박스 필드만 먼저 적용
```

### 5. 노트 템플릿 vs 위키 템플릿 분리

```
노트 템플릿 (NoteTemplate slice 유지):
  · title + content (TipTap JSON) 복사
  · UpNote식 "빈 노트 시드" — 자유 구조
  · 렌더러 X, 블록 배치 X
  · 예: 회의록, 일기, 투두

위키 템플릿 (Content Template 신규):
  · sections[] + infoboxFields[] + defaultLayout?
  · 구조화된 지식의 뼈대 — 나무위키/위키피디아식 "타입"
  · 예: Person, Place, Concept, Work, Organization, Event
```

두 템플릿은 **다른 데이터 쉐입** → 억지로 통합 금지.

---

## Must-TODO: 노트 split 기능

**우선순위:** 위키 디자인 강화 이후 Phase.

**가능한 이유:**
1. UniqueID extension 이미 설치 (`shared-editor-config.ts:361`) — top-level 노드 23종 영속 ID 부여
2. 위키 split UI 패턴 재사용 가능 (`wiki-article-view.tsx` splitMode/selectedBlockIds)
3. ProseMirror 문서 조작 API 충분

**구현 스케치:**
- `splitNote(sourceId, nodeIds, newTitle): string | null` 스토어 액션 (~50줄)
- **UX = WikiSplitPage 패턴 그대로** (`components/views/wiki-split-page.tsx`, 502줄, 2-column Original/New + Shift+Click + Title input)
  - 사용자 명시 요청: "노트 스플리트도 이런 식으로 되면 이상적"
  - `components/views/note-split-page.tsx` 신규 (wiki 템플릿 복사 + TipTap 조작으로 교체)
  - `BlockLabel` → `NodeLabel` 리네임 (heading/paragraph/list/image/table 매핑)
  - `rightBlocks: string[]` — TipTap node attrs.id (UniqueID extension 덕분)
- Unsplit(되돌리기)은 v1 스코프 밖

**난이도:** Medium × 2-3일 × PR 하나

---

## 이번 세션 완료 작업

### Tier 1 인포박스 전체 완료 🎉

1. **Tier 1-2 헤더 색상 테마**
   - 노트 TipTap `InfoboxBlockNode` + 위키 `WikiInfobox` 양쪽 지원
   - 8 프리셋 + 커스텀 color input, rgba 0.35
   - `WikiArticle.infoboxHeaderColor?` (optional, migration 없음)

2. **Default 레이아웃 인포박스 통합**
   - `wiki-article-view.tsx` Aliases 뒤에 WikiInfobox 렌더 (encyclopedia와 동일 center/float-right 분기)
   - `wiki-article-detail-panel.tsx` 사이드바 Infobox 섹션 제거 (중복 해소)

3. **Tier 1-4 섹션 구분 행**
   - `WikiInfoboxEntry.type?: "field" | "section"` optional (backward compat)
   - TipTap `InfoboxRow` 동일. Edit UI "Add section" 버튼
   - full-width bold uppercase + tinted bg

4. **Tier 1-5 필드 값 리치텍스트**
   - `components/editor/infobox-value-renderer.tsx` 신설
   - 4 패턴: `[[wikilink]]`, `[text](url)`, `![alt](url)`, bare `https?://`
   - `isSafeUrl` 보안 (http/https/data:image/)
   - 편집 모드 raw text input 유지, 읽기 모드만 리치 렌더

---

## 다음 우선순위 (확정)

1. **인포박스 편집 엉킴 수정** (Easy, 즉시) — float-right 인포박스 + 본문 heading 클릭 간섭
2. **`wiki-color` 프리셋 추가** (Medium) — 나무위키식 상단 전폭 배치, 3번째 layout 옵션
3. **themeColor cascade (B-2)** (Medium × High) — `WikiArticle.themeColor?: {light, dark}` 인포박스 + 섹션 + Navbox cascade
4. **Hatnote (A-1)** (Easy × High) — 상단 안내 italic
5. **Ambox 자동 배너 (A-3)** (Easy × Medium) — stub/orphan 자동 감지, 좌측 10px 색상 스트립
6. **Navbox 자동 (A-4)** (Medium × High) — 카테고리 기반 하단 박스
7. **타입 인포박스 스키마 (C-3)** (Medium × High) — Layer 2 Content Template 구현
8. **노트 split** (Medium, must-todo) — UniqueID 활용

---

## 결정 번복 방지 조건

2026-04-01 롤백 같은 재발을 막으려면:

- **엔티티 통합 제안 금지** — auto memory에 `project_entity_philosophy.md` 저장됨
- **데이터 구조 차이를 차별점으로 활용** — 노트=연속/위키=모듈 경계 존중
- **UX 단순화 시도 전에 "이게 2026-04-01처럼 또 롤백될까?" 자문**
- **사용자가 만족하고 있는 부분은 건드리지 말 것**

---

## Sources

- [BRAINSTORM-2026-04-06.md](./BRAINSTORM-2026-04-06.md) — 원본 나무위키 리서치
- [BRAINSTORM-2026-04-14-wiki-ultra.md](./BRAINSTORM-2026-04-14-wiki-ultra.md) — 통합 브레인스토밍
- [plot-discussion/09-APP-IDENTITY-PIVOT.md](./plot-discussion/09-APP-IDENTITY-PIVOT.md) — 2026-03-30 IKEA 전략
- [CONTEXT.md](./CONTEXT.md) "노션식 통합 템플릿 폐기 (2026-04-01)" 결정
