---
session_date: "2026-04-14 22:40 (후속 세션)"
project: "Plot (linear-note-plot-)"
working_directory: "C:/Users/user/Desktop/linear-note-plot-/.claude/worktrees/eloquent-hypatia"
duration_estimate: "~30분 (after-work 이후 ~이번 after-work까지)"
---

## Completed Work

### 코드 — 인포박스 편집 엉킴 UX 수정
- `components/wiki-editor/wiki-article-view.tsx` — 편집 모드일 때 float-right 해제 + 상단 전폭 배치 (`mb-8 max-w-md`)
- `components/wiki-editor/wiki-article-encyclopedia.tsx` — 동일 패턴 통일 (편집 시 전폭, 읽기 시 float 원래대로)
- 해결: 편집 중 Add field/Section 버튼이 본문 heading 클릭 영역과 간섭하는 UX 버그

### 브레인스토밍 — 위키 템플릿 시스템 전면 재설계
**3-layer 모델 폐기 → 통합 WikiTemplate 모델**

사용자 통찰: "컬럼 렌더러 + 섹션 배치 = 템플릿"

핵심 결정:
- `WikiTemplate = { layout: ColumnStructure + titleStyle + themeColor + sections + infobox + hatnotes + navbox }`
- 컬럼: 1/2/3/N 자유, 중첩 최대 3 depth, 드래그 비율 조절
- Title 최상단 고정 (나무위키/위키피디아 관습), `article.title + titleStyle`
- Column Heading 블록 폐기, Section(H2)로 충분
- 기본 템플릿 8종 built-in: Blank / Encyclopedia / Person / Place / Concept / Work / Organization / Event
- 사용자 커스텀 템플릿 (파라미터 조합, JSX 코드 주입 X)
- Phase 1 순서: 타입+템플릿 데이터 먼저, 렌더러는 Phase 2 (철저함 중시, 사용자 선택)

### 문서 정비 (Phase 0 완료)

**신규** (진실의 원천):
- `docs/BRAINSTORM-2026-04-14-column-template-system.md` (450+ 줄)
- `memory/project_column_template_system.md` (auto memory)

**DEPRECATED 배너 + 새 문서 링크**:
- `docs/BRAINSTORM-2026-04-14-wiki-ultra.md` (3-layer 프레임 폐기, 세부 설계 보존)
- `docs/PHASE-PLAN-wiki-enrichment.md` (Phase 계획 전체 폐기)

**부분/전체 업데이트**:
- `docs/BRAINSTORM-2026-04-14-entity-philosophy.md` (3-layer 섹션 교체)
- `docs/CONTEXT.md` (Key Design Decisions + P2 TODO 재작성)
- `docs/MEMORY.md` (세션 의사결정 오전/저녁 확장 + Tier 1-4 섹션 정비)
- `docs/TODO.md` (Phase 1-7 로드맵)
- `docs/NEXT-ACTION.md` (Phase 1 시작점 상세화)
- `docs/SESSION-LOG.md` (오늘 entry)

**Memory 동기화**:
- `memory/project_entity_philosophy.md` (통합 모델 반영)
- `memory/MEMORY.md` (Project Decisions 인덱스)
- `.omc/notepad.md` (완전 재작성, 빌드 이슈 해결 반영)
- `.omc/notepads/general/decisions.md` (저녁 결정 append)

## PR
- **PR #195 main에 squash merge 완료** (merge commit: `9eecca15`, 2026-04-14 22:40 UTC)
- 14 파일, +781 / -178
- 신규: `docs/BRAINSTORM-2026-04-14-column-template-system.md`

## In Progress
- 없음. 모든 작업 완료.

## Remaining Tasks (다음 세션)

### Phase 1 — WikiTemplate 데이터 모델 + 기본 템플릿 8종 (3-4일, 1 PR)

**Cold Resume용 상세 내용**:

1. **데이터 모델** (`lib/types.ts`):
   - `ColumnStructure` 재귀 타입 (columns 배열, ratio/minWidth/priority, 중첩 3 depth 제한)
   - `WikiTemplate` 인터페이스 (layout + titleStyle + themeColor + sections + infobox + hatnotes + navbox)
   - `WikiArticle` 확장:
     - `layout: ColumnStructure` (기존 string "default"/"encyclopedia"/"wiki-color" 교체)
     - `titleStyle?: { alignment, size, showAliases, themeColorBg }`
     - `themeColor?: { light, dark }`
     - `columnAssignments: Record<string, string>` (blockId → columnPath)
     - `templateId?: string`

2. **wikiTemplates slice** (`lib/store/slices/wiki-templates.ts`):
   - Built-in 8종 정의 (Blank / Encyclopedia / Person / Place / Concept / Work / Organization / Event)
   - `getBuiltInTemplates()`, `createTemplate()`, `updateTemplate()`, `deleteTemplate()`, `duplicateTemplate()`

3. **Store migration vNN**:
   - `layout: "default"` → Blank 템플릿 자동 변환
   - `layout: "encyclopedia"` → Encyclopedia 템플릿 자동 변환
   - heuristic: 인포박스 있으면 Encyclopedia, 없으면 Blank
   - 또는 사용자에게 선택시키기 (최초 1회 다이얼로그)

4. **새 위키 생성 UX**:
   - `CreateWikiDialog` 또는 기존 `createWikiArticle` 액션에 `templateId?` 인자 추가
   - 템플릿 선택 갤러리 (카드 그리드)
   - 선택 시 template.sections / template.infobox 기본값으로 prepopulate

### Phase 2-7 (순서대로)
- Phase 2: 컬럼 렌더러 + titleStyle
- Phase 3: 편집 UX (컬럼 드래그, 추가/삭제, 중첩)
- Phase 4: 사용자 커스텀 템플릿 편집기
- Phase 5: 나무위키 잔여 (Hatnote, Ambox, Navbox, 섹션 icon, Callout 12타입)
- Phase 6: 편집 히스토리 + 요약 (v1→v2→v3)
- Phase 7: 노트 split 기능 (WikiSplitPage 패턴 복사)

## Key Decisions
- **컬럼 시스템 = 상위, 프리셋은 특정 조합** (default/encyclopedia는 "1컬럼 Blank" / "2컬럼 Encyclopedia" 템플릿으로 재해석)
- **Title 블록화 폐기** — article.title + titleStyle로 최상단 고정 (나무위키 관습)
- **3-layer 모델 폐기** — 오버엔지니어링으로 판정. 통합 모델로 단순화
- **기존 blocks[] 평면 구조 유지** — 최소 침습. columnAssignments로 배치만 표시
- **Phase 1 철저함 중시** — 타입 먼저 확정, 렌더러는 Phase 2로 분리 (사용자 선택)

## Technical Learnings
- `react-resizable-panels` 이미 workspace에서 사용 중 — 컬럼 비율 드래그에 재활용 가능
- 나무위키/위키피디아 모두 Title 최상단 고정 + 컬럼은 아래 (스크린샷 확인)
- Plot `columnsBlock` (TipTap 블록 레벨)과 문서 레벨 컬럼 시스템은 **다른 레이어** — 공존 가능
- 사용자 커스텀 = "파라미터 조합" 방식이 적절 (JSX 코드 주입은 로컬퍼스트 + 보안 측면에서 불가)

## Blockers / Issues
- 없음. 모든 블록 해소.
- 이전 after-work에서 해결 못 했던 빌드 에러는 PR #194에서 build-fixer로 해결됨

## Environment & Config
- Worktree: `C:/Users/user/Desktop/linear-note-plot-/.claude/worktrees/eloquent-hypatia`
- 브랜치: `claude/eloquent-hypatia`
- Dev server: port 3002
- Store version: v75 (Phase 1에서 v76으로 bump 예정 — WikiArticle 확장)
- Build: GREEN

## Notes for Next Session
1. `/before-work`로 시작하면 auto memory가 로드되어 이 세션 결정 자동 인지
2. **첫 작업 = Phase 1 시작**. `docs/NEXT-ACTION.md` 참조
3. `docs/BRAINSTORM-2026-04-14-column-template-system.md`가 **진실의 원천**. 다른 브레인스토밍 문서는 참조용 (DEPRECATED 배너 있음)
4. 엔티티 통합 제안 금지 (auto memory `project_entity_philosophy.md`)
5. 커밋 타이밍 사용자 통제 (auto memory `feedback_commit_timing.md`)
6. Phase 1은 데이터 모델만. 렌더링은 Phase 2로 분리 — 기존 렌더러 잠깐 유지 OK

## Files Modified (14)
- 2 코드: wiki-article-view.tsx, wiki-article-encyclopedia.tsx
- 신규 진실의 원천: BRAINSTORM-2026-04-14-column-template-system.md
- 6 docs 업데이트: BRAINSTORM*, CONTEXT, MEMORY, TODO, NEXT-ACTION, SESSION-LOG, PHASE-PLAN
- 4 memory: project_entity_philosophy, project_column_template_system (신규), MEMORY.md 인덱스, .omc/notepad.md
- .omc/notepads/general/decisions.md (append)
