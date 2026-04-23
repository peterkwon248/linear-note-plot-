# Plot — Session Log

> 시간순 chronological 세션 기록 (append-only). 직전 세션 멘탈 상태 복원용.
> 가장 최근이 위에. 오래된 세션은 아래로 밀려남.
> Session entry 형식: 날짜 + 머신 + 완료 + 결정 + 다음

---

## 2026-04-23 (Wiki visual polish + Ontology rename + IDB fix)

### 완료
- **Graph → Ontology rename** (5파일): `editor-breadcrumb.tsx`, `linear-sidebar.tsx`, `view-header.tsx`, `secondary-panel-content.tsx`, `ontology-view.tsx` — activity bar는 이미 "Ontology"였음
- **Wiki Encyclopedia TOC 리디자인**: dark-only `white/XX` hardcoded color → 디자인 토큰 (`border-border-subtle`, `bg-secondary/20`, `text-foreground/80`). 라이트/다크 모드 호환
- **두 모드 공통 updatedAt 추가**: 타이틀 아래 "최근 수정: N시간 전" (`shortRelative()` 사용)
- **Default 모드 TOC 조용하게**: "Contents" uppercase → "목차" quiet (`text-[11px] text-muted-foreground/50`), max-width 280→240px
- **IDB fix**: `plot-note-bodies` DB_VERSION 1→2 (corrupted state 복구, bodies store 재생성)
- PR #215 생성 (2 commits)

### 브레인스토밍 & 큰 결정
- **나무위키 스타일 채택**: TOC + updatedAt 위치, categories 인라인 — 두 모드 모두 적용
- **두 모드 병행 유지**: Default (TOC 좌측 aside + Infobox float-right) + Encyclopedia (TOC 박스 inline + Infobox 스택) — 장기적 단일화는 나중에
- **Wiki TOC = 자동 생성** 재확인: section blocks 기반 sectionIndex, TipTap toc-node는 별개
- **Infobox 위치 = 문서 내 유지**: sidebar Detail과 대립하지 않음 (사용자 pain은 없었음)
- **Ontology를 Activity Bar 공간으로 유지**: Display View에 통합 안 함 (사용자 결정)

### 다음
- PR #215 머지
- 사용자에게 "가장 거슬리는 UI 3가지" 구체화 요청
- UI 일관성 감사 계속

### Watch Out
- IDB 에러 1/11 → 0: DB_VERSION 2로 해결됨. 다음 세션 새 브라우저에서도 재현 안 될 것
- `search-dialog.tsx`의 "Graph" 헤딩은 그래프 시각화 커맨드용이라 유지 (Ontology로 바꾸지 않음)
- 기존 hydration mismatch (Radix UI aria-controls ID) — pre-existing, 기능 영향 없음

### 머신
집

---

## 2026-04-22 (집, Hard reset to PR #194 + 도돌이표 자각 + UI 일관성 방향 전환)

### 수행 작업

**Hard reset 실행**:
- `git reset --hard 3f2e54c` — PR #194 commit으로 branch 이동
- PR #195 ~ #213 (2026-04-14 저녁 ~ 2026-04-21) 변경사항 전부 working tree에서 제거
- 삭제된 기능 시스템: WikiTemplate, 컬럼 시스템, 메타→블록화, Page Identity Tier, Book Pivot 5 shell

**docs 정비** (PR #194 시점 원본 + 2026-04-22 공지):
- NEXT-ACTION.md 전면 재작성 (UI 일관성 방향 + Git 주의)
- TODO.md 전면 재작성 (pain point 기준)
- CONTEXT.md, MEMORY.md 상단 롤백 공지 추가
- SESSION-LOG.md 이번 세션 추가

### 의사결정 과정 (사용자 주도)

1. **Book Pivot 자기만족 자각** (세션 초반) — 매거진/뉴스페이퍼/북 5 shell 자기만족 확인. 사용자: "그저 나의, 개발자의 자기만족"
2. **도돌이표 자각** — 2주간 대결정 3회(Column → Identity → Book Pivot) 반복, 구현 직후 폐기
3. **Book Pivot 롤백 진행** → 완료 (executor로 삭제/수정 + tsc/build/tests clean)
4. **위키 자체 재검토** — "위키는 그냥 냅두자" → "색 넣기랑 컬럼시스템 이전으로" → PR #194 hard reset 결정
5. **themeColor 시스템 유지 확정** — α 옵션 선택 (PR #194 상태 그대로)
6. **진짜 pain point 확인** — 사용자: "ui가 너무 이상함. 일관성 없고". 기능 추가보다 UI 일관성 개선 우선

### 핵심 영구 규칙 (자각에서 도출)

- 기능 제안 전 "Plot 코어(지식 관계망, 팔란티어×제텔카스텐)에 부합하나?" 자문
- "멋진 레이아웃", "시각적 다양성" 방향 제안 금지
- 큰 방향 전환 전 전체 설계 확정 (PDCA plan)
- Phase 쪼개기 전에 "진짜 이 방향이 맞나?" 자문
- Claude memory: `feedback_core_alignment.md`, `project_book_pivot_rollback.md`, `feedback_design_before_implementation.md`

### 리서치 수행 (4 병렬 researcher — 결과는 부분적으로만 사용)

- 전통 위키 / PKM 앱 / Notion DB 뷰 / PKM 담론
- Category Board + Health Dashboard 제안 → 사용자 기각 ("Health 별로", "위키는 냅두자")
- 결과: 리서치 통찰은 메모에 저장됐으나 이번 세션엔 구현 안 함

### 다음 세션

- UI 일관성 감사 + 개선
- `docs/DESIGN-AUDIT.md` 5-Phase Design Spine 재검토
- 사용자에게 가장 거슬리는 UI 3-5개 구체화 요청
- design-quality-gate 스킬 + designer 에이전트 활용

### ⚠️ Git 주의

현재 branch `claude/mystifying-poitras-48b32a`가 PR #194 commit(3f2e54c)로 hard reset됨.
main은 PR #213(bd50b00)까지 있어 **시간 역행 상태**.

다음 세션 before-work의 `git merge origin/main -X theirs` 실행 시 **롤백 자동 취소** 가능성 높음.
곧 commit + push + PR 해서 main에 반영 필요 (또는 before-work Step 0 skip).

### 머신
집

---

## 2026-04-13 오후~저녁 (집)

### 완료
- **노트 References 시스템 전체 구현**
  - `Note.referenceIds: string[]` + Store migration v74
  - `addNoteReference` / `removeNoteReference` 액션
  - `NoteReferencesFooter` 전면 확장 — store 연동, 피커 모달 (검색/생성/편집 3모드), +/× 버튼, 중복 제거
  - `/reference` 슬래시 커맨드 + Insert 메뉴 "Reference" 항목
  - `plot:open-reference-picker` 이벤트 기반 API
  - 빈 상태 숨기기 (referenceIds 있을 때만 ▶ REFERENCES 표시)
  - 아이콘 = Book (RiBookLine) — BookmarkSimple→Article→FileText→Book 순서로 결정
- **위키 fontSize cascade (em 기반 전환)**
  - 섹션 타이틀 rem→em 전환: text-2xl→text-[1.5em], text-xl→text-[1.25em], text-lg→text-[1.125em]
  - 메인 타이틀: text-[26px]→text-[1.75em] (Default), text-3xl→text-[1.875em] (Encyclopedia)
  - 각주/참고 헤더: text-base→text-[1em], text-[14px]→text-[0.875em]
  - fontScale을 개별 heading에서 제거 → 섹션 wrapper div.group/section에 적용 (cascade 정상화)
- **위키 텍스트 블록 display 컴팩트**
  - ProseMirror min-height:300px → unset (읽기모드)
  - p margin:0 (읽기모드, prose 오버라이드)
  - `.wiki-text-display` 클래스 추가
- **문서 정합성 복구** — SESSION-LOG, NEXT-ACTION, TODO, MEMORY 전부 stale → 코드 기반 정확히 재작성

### 브레인스토밍 & 큰 결정
- **Footnotes+References 분리 유지** — 이전 세션 논의(합치기)를 번복. 라이브러리 References와 이름 겹쳐도 OK (같은 엔티티, 다른 스코프)
- **불릿 Reference = 문서 레벨 메타데이터** — 인라인 마커 없음, `[[`/`@`에서 안 넣음 (인라인 도구에서 비인라인 결과는 UX 어색)
- **em 기반 fontSize cascade** — 글로벌 Aa 스케일 + 섹션별 개별 fontScale 동시 지원 (CSS em cascade 활용)
- **노트 전체 접기/펼치기 버튼** → P3으로 보류 (섹션 2개뿐이라 지금은 overkill)
- **Reference 아이콘 = Book** — Summary(Article), Bookmark(BookmarkSimple), Embed Wiki(BookOpen) 전부 겹쳐서 최종 RiBookLine 선택

### 다음
- **P1: 위키 레이아웃 프리셋 통합** — Default+Encyclopedia 2개 → 1개 설정 기반 렌더러

### Watch Out
- 위키 아티클 30개+ 생성됨 — 시드/migration 문제 아님, IDB 데이터 문제. 이번 코드 변경과 무관
- fontSize XL < M 버그 있었음 — fontScale inline이 em 클래스를 override하던 문제, wrapper로 이동해서 해결

### 머신
집

---

## 2026-04-12~13 (위키 각주/Reference 대형 세션)

### 완료
- **PR #182**: 위키 각주 시스템 (위키백과 스타일 문서 레벨 각주)
  - WikiFootnotesSection — offset 기반 전체 연번, 양방향 스크롤
  - Default/Encyclopedia 공유 유틸 추출 (~300줄 중복 제거)
  - 위키 텍스트 블록에 [[위키링크 + @멘션 + #해시태그 활성화
  - 드롭다운 아이콘 통일 (IconWiki + stub/article 색상)
- **PR #183**: 위키 텍스트 블록 [[/@ 삽입 버그 수정
  - tippy click-outside 가드 (드롭다운 클릭 시 에디터 닫힘 방지)
  - NoteHoverPreview를 layout.tsx 글로벌로 이동
- **PR #185**: 각주 모달 + References 하단 섹션 + footnote 티어
  - FootnoteEditModal (Title+Content+URL 통합 모달, 이벤트 기반 API)
  - WikiReferencesSection (위키백과 참고문헌 불릿 목록)
  - WikiArticle.referenceIds (문서↔Reference 직접 연결)
  - footnote 에디터 티어 (StarterKit 최소)
  - click-outside 가드 확장 (Radix Portal + role=menu/dialog)
- **PR #187**: 각주/Reference UX 개선
  - 각주 read-only 가드 (editor.isEditable 체크)
  - 위키 footnote 삽입 버그 수정 (FootnoteEditModal role="dialog")
  - Footnotes/References 컴팩트 디자인 (TipTap→텍스트, 토글, 사이즈 통일)
  - 노트 NoteReferencesFooter (기본 collapsed)

### 결정
- **Footnote = "에디터 접점", Reference = "저장소"** 원칙 유지
- **FootnoteEditModal = 글로벌 모달** — layout.tsx 마운트, 이벤트 기반 API
- **위키 각주/참고문헌 = 컴팩트 디자인** — TipTap EditorContent 폐기 → 단순 텍스트
- **Footnotes+References 통합** 다음 세션에서 검토 예정

### 다음
- **P0: 위키 레이아웃 프리셋 통합** — Default+Encyclopedia 2개 → 1개 설정 기반 렌더러

### Watch Out
- after-work 문서 업데이트 불완전했음 — SESSION-LOG, NEXT-ACTION, TODO 전부 stale 상태로 남음

---

## 2026-04-11 (Library + Reference.history)

### 완료
- **PR #181**: Library Overview Bento Grid 리디자인 + Reference.history + Split View edge case 수정
  - Reference.history 수정 이력 자동 기록 (created/edited/linked/unlinked, 50개/Reference 제한)
  - Store v73 migration (Reference.history backfill)

---

## 2026-04-10 (Split-First 완성 대형 세션)

### 완료
- **PR #177**: Split-First Phase 2~5 완료 + Calendar 리뉴얼 + 9개 view 통합 픽스
  - Store cleanup (v72 → v73), Peek 파일/참조 제거
  - SecondaryOpenPicker 다이얼로그 (Cmd+Shift+\)
  - Focus tracking + border-t-accent 시각 피드백
  - Calendar: view-swap 버그, Wiki article 통합, 사이드바 재설계 (미니 캘린더 + Heatmap)
  - 9개 view에 isEditing → WorkspaceEditorArea swap 패턴 + usePaneOpenNote 적용

### 결정
- **🎯 PIVOT: Split-First 복귀** — Peek-First 폐기. Split view + 단일 SmartSidePanel 모델 확정

### 다음
- 위키 레이아웃 프리셋 통합 (P1-4)

---

## 2026-04-09 오후~저녁 (회사)

### 완료
- **크로스노트 북마크 5 Phase** 전부 구현
  - GlobalBookmark store slice + migration v72
  - extractAnchorsFromContentJson 공용 유틸
  - Bookmarks 탭 2섹션 (Pinned + This Note) + Ctrl+Shift+B
  - WikilinkNode anchorId attr + 2단계 앵커 피커
  - 플로팅 TOC 핀 + 앵커 우클릭 Pin to Bookmarks
- **FootnotesFooter 접기/펼치기** — 기본 접힌 상태, [N] 클릭 시 자동 펼침
- **Wiki Sources 클릭 fix** — openNote + setActiveRoute로 네비게이션 정상화
- **Outline 개선** — TipTap JSON 기반, TOC 블록 우선, 헤딩 fallback, 클릭 스크롤
- **ReferencedInBadges dedupe** — 위키 article ID 기준 중복 제거 + secondary 컴팩트 모드
- **Peek-First 아키텍처 Phase 0+1** — 사이드바 단일 책임 (layout.tsx)
  - WorkspaceEditorArea에서 사이드바 코드 전부 제거
  - layout.tsx가 모든 케이스 처리 (단독/스플릿/뷰스플릿/에디터스플릿)
  - hasSplit/hasViewSplit/showSidePanel 명확한 분기

### 브레인스토밍 & 큰 결정
- **Outline = 단순 구조 시각화** — 앵커는 별개 Bookmarks 탭으로 분리
- **사이드바 아키텍처 = A안 (layout.tsx 단일 책임)** — 여러 위치 렌더링 충돌 해결
- 🎯 **Split View 폐기 + Peek 확장 (Peek-First 마이그레이션)** — 가장 큰 방향 결정
  - Phase 0~5로 단계적 진행
  - Peek 지원: Note + Wiki만 (Calendar/Ontology 제외)
  - 사이즈 시스템: Min/Mid/Max + Drag
  - 호버 프리뷰는 유지 (Peek와 별개)
- **워크플로우 개선 결정** — NEXT-ACTION.md + SESSION-LOG.md 도입

### 다음
- **Phase 2: Peek가 Wiki 표시 가능하게** (NEXT-ACTION.md 참조)

### Watch Out
- Reference.history 작업 중간에 멈춤 — Peek 마이그레이션 후 복귀
- 단독 에디터 사이드바 버그 디버깅에 시간 많이 씀 — root cause는 여러 곳에서 사이드바 렌더링 시도 + react-resizable-panels의 id+order 누락

### 머신
회사

---

## 2026-04-08 (이전 세션)

PR #169~171 작업 — Library 고도화, Reference 하이브리드 통합, Trash 뷰 확장 등.
상세는 docs/MEMORY.md PR 목록 참조.
