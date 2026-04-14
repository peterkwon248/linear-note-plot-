---
session_date: "2026-04-14 22:13"
project: "Plot (linear-note-plot-)"
working_directory: "C:/Users/user/Desktop/linear-note-plot-/.claude/worktrees/eloquent-hypatia"
duration_estimate: "~14시간 (before-work 07:00 ~ 22:13)"
---

## Completed Work

### Tier 1 인포박스 전체 완료 🎉
- **Tier 1-2 헤더 색상 테마** — 노트(`components/editor/nodes/infobox-node.tsx`) + 위키(`components/editor/wiki-infobox.tsx`) 양쪽 지원. 8 프리셋 + 커스텀 `<input type="color">` + PaintBucket 팝오버. `WikiArticle.infoboxHeaderColor?: string | null` optional 필드 (lib/types.ts). Migration 불필요
- **Default 레이아웃 인포박스 통합** — `components/wiki-editor/wiki-article-view.tsx`에 `<WikiInfobox>` 렌더 추가 (Aliases 뒤, Category 앞, float-right 280px). 이전엔 Encyclopedia 레이아웃만 지원했음
- **사이드바 Infobox 섹션 제거** — `components/side-panel/wiki-article-detail-panel.tsx` — Default/Encyclopedia 둘 다 본문 inline으로 옮겨져서 사이드바 중복 해소
- **Tier 1-4 섹션 구분 행** — `WikiInfoboxEntry.type?: "field" | "section"` optional. `bg-secondary/40` + bold uppercase + value 숨김. TipTap `InfoboxRow`도 동일. Edit UI에 "Add section" 버튼 (Add field 옆)
- **Tier 1-5 필드 값 리치텍스트** — `components/editor/infobox-value-renderer.tsx` **신규**. 4 패턴 (`[[wikilink]]`, `[text](url)`, `![alt](url)`, bare `https?://`) + `isSafeUrl` 보안 (http/https/data:image/ 경로만). 편집 모드는 raw text input 유지, 읽기 모드만 리치 렌더

### 긴급 버그 수정
- **`components/views/wiki-view.tsx:640`** — 사이드바 Merge/Split/Categories 클릭 시 article view가 계속 남아있던 버그. `isDedicatedModePage` 체크(`wikiViewMode === "merge" || "split" || "category"`) 추가해서 해결. Pre-existing 버그였음 (내 세션 변경과 무관)

### Docs / Memory 체계화
- **`docs/BRAINSTORM-2026-04-14-entity-philosophy.md`** **신규** — 엔티티 철학 확정 + 표류 히스토리 + 노트 split 스케치 + 다음 우선순위
- **`docs/CONTEXT.md`** — Key Design Decisions에 "2-entity 철학" + "3층 모델" + P2 "노트 Split must-todo" 섹션 추가
- **`docs/MEMORY.md`** — Current Direction 최신화(2026-04-14), 세션 의사결정 섹션 신설
- **Auto memory 3 파일 신규**: `project_entity_philosophy.md`, `project_note_split_todo.md` + `MEMORY.md` 인덱스 업데이트 (`C:/Users/user/.claude/projects/C--Users-user-Desktop-linear-note-plot-/memory/`)

## In Progress
- 없음. 모든 코드 변경 완료된 상태.

## Remaining Tasks (Cold Resume용)

### P2 — 위키 디자인 강화 (다음 세션 1순위)
- [ ] **인포박스 편집 엉킴 수정** (Easy, 즉시) — float-right 인포박스 + 본문 heading 클릭 영역 간섭. `components/wiki-editor/wiki-article-view.tsx`에서 infobox wrapper 아래에 `clear: both` 또는 spacing 추가
- [ ] **`wiki-color` 레이아웃 프리셋 추가** (Medium) — 나무위키식 상단 전폭 배치. `WikiArticle.layout: "default" | "encyclopedia" | "wiki-color"` 확장. `wiki-article-view.tsx`에 3번째 분기
- [ ] **themeColor cascade (B-2)** (Medium × High) — `WikiArticle.themeColor?: {light, dark}` + CSS variable로 인포박스 헤더 + 섹션 + Navbox 전체 cascade
- [ ] **Hatnote (A-1)** (Easy × High) — 상단 italic 안내 (`{{About}}`, `{{See also}}`)
- [ ] **Ambox 자동 배너 (A-3)** (Easy × Medium) — stub/orphan 자동 감지 + 좌측 10px 색상 스트립
- [ ] **Navbox 자동 (A-4)** (Medium × High) — 카테고리 기반 하단 관련 문서 박스

### P2 — 타입 인포박스 (C-3, Layer 2)
- [ ] Person/Place/Concept/Work/Organization/Event 6종 스키마 (`lib/wiki-types/schemas/`)
- [ ] 새 위키 생성 시 "타입 선택" 다이얼로그
- [ ] 타입별 기본 섹션 + 인포박스 필드 pre-populate

### Must-TODO — 노트 split 기능
- [ ] UX = **WikiSplitPage 패턴 그대로** (`components/views/wiki-split-page.tsx` 502줄 복사 → TipTap 조작으로 교체)
- [ ] `splitNote(sourceId, nodeIds, newTitle)` 스토어 액션 (`lib/store/slices/notes.ts`, ~50줄)
- [ ] `components/views/note-split-page.tsx` 신규 (BlockLabel → NodeLabel 매핑)
- [ ] UniqueID extension이 이미 top-level 노드 23종에 영속 data-id 부여 중이라 인프라 준비됨 (`shared-editor-config.ts:361`)
- [ ] 난이도 Medium × 2-3일 × PR 하나

### Pre-existing 빌드 에러
- [ ] **`components/editor/block-registry/registry.ts:63`** — `RemixiconComponentType`가 `BlockIcon`에 assignable X (20건 반복, 같은 패턴). PR #192 때부터 있음. Turbopack build 실패 원인. 해결 방법: `icon: TextHOne as BlockIcon` 같은 cast 추가 or `BlockIcon` 타입 정의 확장 (`types.ts`). build-fixer 에이전트 위임 가능

## Key Decisions
- **Note/Wiki 2-entity 철학 확정** (2026-04-14) — 엔티티 통합 논의(Alpha/Beta/Gamma) 전부 폐기. 2026-04-01 "노션식 통합 템플릿 폐기" 결정 재확인. 차별점의 원천 = 데이터 구조 (TipTap JSON vs WikiBlock[])
- **렌더러(Layout Preset)는 위키 전용** — 노트에 주면 차별점 희석. 노트는 단일 TipTap JSON이라 레이아웃 개념 성립 안 함
- **위키 템플릿 3층 모델** — Layer 1 Layout Preset (렌더러) + Layer 2 Content Template (섹션 뼈대, Person/Place 등) + Layer 3 Typed Infobox (C-3). 노트 템플릿 (NoteTemplate slice)은 별개로 유지 (UpNote식 단순 복사)
- **노트 split UX = WikiSplitPage 패턴 그대로** — 사용자 명시 요청: "노트 스플리트도 이런 식으로 되면 이상적"
- **표류 종결** — 3-30 (PIVOT #1 IKEA 전략) → 4-01 (ROLLBACK #2) → 4-14 (FINAL: 분리 유지 + 디자인 강화)

## Technical Learnings
- **UniqueID extension 활용 가능성**: `shared-editor-config.ts:361`에서 top-level 23종 노드에 영속 data-id 자동 부여 중. 노트 split 구현의 기반
- **Next.js webpack dev vs Turbopack build 타입 검증 차이**: dev는 pass인데 prod build는 fail인 경우 있음 (`registry.ts` 에러가 예)
- **WikiInfobox vs InfoboxBlockNode 2중 구현체** — 중장기 통합 TODO (base 티어 단일화)
- **`setWikiInfobox`(Note slice) vs `setWikiArticleInfobox`(WikiArticle slice)** — Encyclopedia 레이아웃의 WikiInfobox는 Note slice를 호출하는 버그 존재 (BRAINSTORM의 선행 0.1)
- **Skill 시스템 본질**: `/after-work` 슬래시 커맨드 = expand된 프롬프트 전달 = Skill tool 재호출도 같은 프롬프트. 실행 주체는 Claude. 사용자 지적으로 확인

## Blockers / Issues
- **빌드 실패**: `components/editor/block-registry/registry.ts:63` TypeScript 에러 (pre-existing, PR #192). 이번 after-work에서 commit/push/merge 스킵됨. 다음 세션에서 빌드 수정 후 커밋

## Environment & Config
- Worktree: `C:/Users/user/Desktop/linear-note-plot-/.claude/worktrees/eloquent-hypatia`
- 브랜치: `claude/eloquent-hypatia`
- Dev server: Next.js 16 webpack, port 3002 (http://localhost:3002)
- Build: Next.js 16 Turbopack — pre-existing TS 에러로 실패 상태
- Store version: v75 (migration 없이 optional 필드만 추가했으므로 bump 불필요)

## Notes for Next Session
1. **before-work 실행하면** auto memory의 `project_entity_philosophy.md` + `project_note_split_todo.md`가 자동 로드됨. 엔티티 통합 제안 금지 기억
2. **빌드 에러 먼저 수정**: `registry.ts` RemixiconComponentType cast 또는 `BlockIcon` 타입 확장. build-fixer 에이전트 위임 권장
3. **빌드 수정 후 커밋**: 이번 세션의 모든 변경(10 파일 수정 + 3 신규)이 아직 커밋 안 됨. `git status`로 확인 후 session: commit
4. **세션 시작 후 dev 서버**: `preview_start` (launch.json에 "dev" 이미 있음)
5. **다음 작업 우선순위**: 인포박스 편집 엉킴 수정 (Easy) → wiki-color 프리셋 (Medium) → themeColor cascade
6. **사용자 피드백 유지**: "커밋 타이밍은 사용자 통제" — 뭔가 끝냈다고 먼저 "커밋하자" 제안 금지 (`feedback_commit_timing.md`)

## Files Modified
- `lib/types.ts` — `WikiArticle.infoboxHeaderColor?`, `WikiInfoboxEntry.type?` 추가
- `components/editor/nodes/infobox-node.tsx` — headerColor attr + HEADER_COLOR_PRESETS + hexToRgba + section row 렌더 + Add row/Add section 2-버튼 + InfoboxValueRenderer 연결 (+234줄)
- `components/editor/wiki-infobox.tsx` — headerColor/onHeaderColorChange props + PaintBucket 팝오버 + Add section + InfoboxValueRenderer 연결 (+259줄)
- `components/editor/infobox-value-renderer.tsx` **신규** — 4 패턴 토크나이저 + 보안 URL 검사 + wikilink resolution
- `components/wiki-editor/wiki-article-encyclopedia.tsx` — headerColor + onHeaderColorChange 연결 (2개 호출 사이트, +18줄)
- `components/wiki-editor/wiki-article-view.tsx` — Default 레이아웃 WikiInfobox inline 렌더 + WikiInfobox import (+41줄)
- `components/side-panel/wiki-article-detail-panel.tsx` — 사이드바 Infobox 섹션 제거 (-19줄)
- `components/views/wiki-view.tsx` — `isDedicatedModePage` 버그 수정 (+9줄)
- `docs/CONTEXT.md` — Key Design Decisions 추가 + P2 TODO에 노트 Split 섹션
- `docs/MEMORY.md` — Current Direction 최신화 + 세션 결정 섹션
- `docs/BRAINSTORM-2026-04-14-entity-philosophy.md` **신규** — 엔티티 철학 확정 문서
- `C:/Users/user/.claude/projects/C--Users-user-Desktop-linear-note-plot-/memory/project_entity_philosophy.md` **신규**
- `C:/Users/user/.claude/projects/C--Users-user-Desktop-linear-note-plot-/memory/project_note_split_todo.md` **신규**
- `C:/Users/user/.claude/projects/C--Users-user-Desktop-linear-note-plot-/memory/MEMORY.md` — Project Decisions 인덱스 추가
