# 🎯 Next Action

> **이 파일은 before-work가 가장 먼저 읽고, after-work가 마지막에 갱신한다.**
> 다음 세션 시작 시 "지금 바로 뭐 해야 하지?"의 답.
> 항상 1~3개의 immediate next action만. 큰 그림은 docs/MEMORY.md.

---

**Last Updated**: 2026-04-14 저녁 (PR #194 완료 + 엔티티 철학 확정 + 컬럼 시스템 설계)

## 🎯 다음 세션 시작하면 바로 할 것

### Phase 1 시작 — WikiTemplate 데이터 모델 + 기본 템플릿 8종

**배경**: 2026-04-14 저녁에 "위키 템플릿 통합 모델" 재설계 완료. 3-layer 모델 폐기, 컬럼+섹션배치=템플릿으로 통합.

**진실의 원천**: `docs/BRAINSTORM-2026-04-14-column-template-system.md`

**Phase 1 작업 내용** (3-4일, 1 PR):

1. **데이터 모델 정의** (`lib/types.ts`)
   - `ColumnStructure` — 재귀 (중첩 3 depth 제한) + ratio/minWidth/priority
   - `WikiTemplate` 인터페이스 — layout + titleStyle + themeColor + sections + infobox + hatnotes + navbox
   - `WikiArticle` 확장:
     - `layout: ColumnStructure` (기존 string 대체)
     - `titleStyle?: { alignment, size, showAliases, themeColorBg }`
     - `themeColor?: { light, dark }`
     - `columnAssignments: Record<blockId, columnPath>`
     - `templateId?: string`

2. **wikiTemplates slice 신설** (`lib/store/slices/wiki-templates.ts`)
   - Built-in 8종 정의 (Blank / Encyclopedia / Person / Place / Concept / Work / Organization / Event)
   - `getBuiltInTemplates()` / `getUserTemplates()` / `createTemplate()` / `updateTemplate()` / `deleteTemplate()`

3. **Store migration vNN** (`lib/store/migrations/`)
   - 기존 `layout: "default"` → Blank 템플릿 자동 변환
   - 기존 `layout: "encyclopedia"` → Encyclopedia 템플릿 자동 변환
   - heuristic: 인포박스 있으면 Encyclopedia, 없으면 Blank

4. **새 위키 생성 UX**
   - `CreateWikiDialog` 또는 기존 `createWikiArticle` 액션에 `templateId?` 인자 추가
   - 템플릿 선택 갤러리 (카드 그리드 or 드롭다운)
   - 선택 시 template.sections / template.infobox 기본값으로 prepopulate

**참고 파일:**
- `BRAINSTORM-2026-04-14-column-template-system.md` (진실의 원천)
- `components/wiki-editor/wiki-article-view.tsx` (Default 현재 구조)
- `components/wiki-editor/wiki-article-encyclopedia.tsx` (Encyclopedia 현재 구조)
- `lib/store/slices/wiki-articles.ts` (기존 slice 참고)
- `lib/store/slices/templates.ts` (NoteTemplate slice, 참조용 패턴)

---

## 🧠 멘탈 상태 (잊지 말 것)

- **Store v75** — 22 slices (PR #189에서 v75로 bump). 다음 Phase 1에서 v76으로 bump 예정 (WikiArticle 확장)
- **엔티티 통합 영구 폐기** — Note/Wiki 2-entity 유지. 앞으로 통합 제안 금지 (memory/project_entity_philosophy.md)
- **3-layer 모델 폐기** — WikiTemplate 통합 모델 (컬럼+섹션배치=템플릿)
- **렌더러는 위키 전용** — 노트엔 layout 개념 없음
- **Title 블록화 X** — article.title + titleStyle로 최상단 고정 (나무위키 관습)
- **Column Heading 블록 X** — Section(H2)로 충분
- **노트 split must-todo** — Phase 7에서 처리 (WikiSplitPage 패턴 복사)
- **PR #194까지 완료** — Tier 1 인포박스 전체 (헤더 색상, 섹션 구분 행, 필드 리치텍스트)

## ⚠️ 구현 전 주의사항

- 컬럼 시스템이 **기존 blocks[] 평면 구조를 건드리지 않도록**. blocks[]는 그대로, `columnAssignments`로 배치만 표시
- Store migration은 **기존 문서 손상 없이** default/encyclopedia → 템플릿 변환 필요
- Phase 1은 **데이터 모델만**. 렌더링은 Phase 2로 분리 (당장은 기존 default/encyclopedia 렌더러 유지해도 됨)
- WikiInfobox의 `setWikiInfobox` (Note slice) 버그는 여전히 유효 — Phase 1 중에 같이 수정

## 🚧 보류 (나중에)

- Library FilterPanel — P1
- 노트 전체 접기/펼치기 버튼 — P3
- 인사이트 중앙 허브 — P2
- Phase 5~7 (나무위키 잔여 / 편집 히스토리 / 노트 split) — 컬럼 시스템 구축 이후
