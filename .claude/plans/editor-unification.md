# Editor Unification Project — Final Plan

## Overview

3개 에디터(노트/위키/템플릿)를 TipTap 기반으로 통합. 툴바 리디자인, 레이아웃 노드, Partial Quote, Merge/Split 풀페이지 개선, 히스토리 시스템 포함.

## Architecture Decision

| | 엔진 | 리치 텍스트 | 구조 관리 | 레이아웃 |
|---|---|---|---|---|
| **노트** | TipTap 단일 문서 | O | X (필요 없음) | 커스텀 노드 (columns, TOC, infobox) |
| **위키** | 블록 시스템 + 블록 안에 TipTap (lazy mount) | O | O (split/merge/move) | 블록 단위 |
| **템플릿** | 노트용 = TipTap, 위키용 = 블록 | O | 대상에 따라 | Notion-style 블록 |

### 핵심 원칙
- 노트: 하나의 TipTap 문서 안에 필요할 때만 블록 노드 삽입 (성능 최적)
- 위키: 블록 시스템 유지, TextBlock만 TipTap으로 업그레이드 (클릭 시 mount, 나가면 unmount → 인스턴스 항상 1~2개)
- 템플릿: 대상(노트/위키)에 따라 에디터 전환

---

## Phase 1: 노트 에디터 리디자인

### 1A — Shared Editor Config 추출
- `components/editor/core/shared-editor-config.ts` 생성
- Extension tier factory:
  - `createEditorConfig('base')` — StarterKit, Table, CodeBlock, Math, Image, Link, Typography, Color, Highlight
  - `createEditorConfig('note')` — base + Wikilink, Hashtag, SlashCommand, WikiQuote, Typewriter
  - `createEditorConfig('wiki')` — base (TextBlock용 경량)
  - `createEditorConfig('template')` — base + VariablePlaceholder
- `TipTapEditor.tsx` → shared config 사용으로 리팩터

### 1B — Title Node 통합
- `components/editor/core/title-node.ts` — TipTap 커스텀 노드
  - `<h1>` 렌더링, 항상 문서 첫 노드
  - Enter → body로 커서 이동
  - Backspace on empty → 삭제 불가
- `NoteEditorAdapter.tsx` 변환 로직
  - Load: 기존 `title` + `contentJson` → title node + content 병합
  - Save: title node → `note.title`, 나머지 → `note.contentJson`
  - 기존 노트 자동 호환 (migration 불필요, load 시 변환)
- `note-editor.tsx` — title `<input>` 제거

### 1C — 툴바 리디자인
- 현재 FixedToolbar (하단) 유지 + 발전 (UpNote 참고)
- Floating bubble toolbar (선택 시) 유지 + 디자인 개선
- Context-aware: note/wiki/template에 따라 버튼셋 변경
- 그룹: Text Format | Block Type | Insert | Alignment | History

### 1D — 노트 커스텀 노드 추가
- **Columns Node** — 2~3열 레이아웃, `/columns`로 삽입
- **TOC Node** — 문서 내 heading 자동 수집, 접기/펼치기, 클릭 시 스크롤
- **Infobox Node** — key/value 편집 가능 테이블, CSS 우측 플로팅
- **NoteEmbed Node** — 다른 노트 읽기 전용 삽입
- 모두 슬래시 커맨드(`/`)로 삽입 가능

---

## Phase 2: 위키 에디터 TipTap 전환

### 2A — TextBlock TipTap 전환
- `wiki-block-renderer.tsx` — TextBlock 변경
  - `<textarea>` → TipTap mini-editor (shared base config)
  - **Lazy mount**: 클릭 시 TipTap mount, 나가면 unmount → 정적 HTML
  - 동시 TipTap 인스턴스 최대 1~2개 (성능 보장)
- Content format: `string` → `{ text: string, json?: TipTapJSON }`
- 기존 plain text → TipTap paragraph로 auto-migrate

### 2B — Block Body Store JSON 지원
- `wiki-block-body-store.ts` 확장
  - `getBlockBody()` → returns `{ text, json? }`
  - `setBlockBody()` → accepts both formats
  - Migration: 기존 string bodies → `{ text: existingContent }` 자동 래핑

### 2C — Contents/Infobox 리사이즈
- width attribute + 드래그 핸들
- 에디터 내에서 크기 조절 가능

---

## Phase 3: 템플릿 에디터 — 블록 레이아웃

### 3A — Template 데이터 모델 확장
```ts
interface NoteTemplate {
  // ... existing fields
  blocks?: TemplateBlock[]
  templateType: 'note' | 'wiki'
}

interface TemplateBlock {
  id: string
  type: 'text' | 'heading' | 'columns' | 'divider' | 'variable' | 'image'
  content?: string       // TipTap JSON
  columns?: TemplateBlock[][]
  width?: string         // '1/2', '1/3', '2/3', 'full'
}
```

### 3B — Block Layout Editor UI
- 드래그 앤 드롭 블록 배치
- 컬럼 레이아웃 (2열, 3열)
- 블록 타입: 텍스트, 제목, 구분선, 변수, 이미지
- 변수 삽입: `{date}`, `{time}`, `{title}` 등

### 3C — Template → Note/Wiki 변환
- `createNoteFromTemplate` — Block layout → TipTap contentJson
- `createWikiFromTemplate` — Block layout → WikiArticle blocks

---

## Phase 4: Partial Quote (WikiQuote 확장)

### 4A — Peek에서 부분 선택 Insert
- `[[노트]]` 클릭 → Peek 열림
- Peek 안에서 원하는 부분 드래그 선택
- "Insert" 클릭 → 현재 에디터에 해당 부분만 삽입
- 원본 노트에 영향 없음 (복사, 이동 아님)

### 4B — Quote 메타데이터 풀셋
```ts
interface WikiQuoteData {
  sourceNoteId: string
  sourceNoteTitle: string
  originalText: string      // 원본 전체 문장 (맥락 파악용)
  quotedText: string        // 실제 가져온 부분
  quotedAt: string          // 가져온 날짜/시간
  sourceHash: string        // 원본 변경 감지용
  context: string           // 앞뒤 1문장 (위치 파악용)
  comment: string           // 왜 인용했는지 개인 메모
}
```
- 원본 변경 시 "변경됨" 알림 가능 (sourceHash 비교)

---

## Phase 5: Merge/Split 풀페이지 개선

### 5A — 노트 Merge 풀페이지
- 현재 작은 모달 → 풀페이지 오버레이
- 왼쪽: 소스 노트들 (heading 있으면 섹션 단위, 없으면 문단 단위 추출)
- 오른쪽: 결과물 (드래그로 순서 변경 + 추가/제거)
- Undo 스냅샷 저장

### 5B — 노트 Split 추가
- 플로팅바 + 우클릭 메뉴에 "Split" 추가
- 클릭 → 풀페이지 오버레이
- 왼쪽: 원본 노트 (섹션/문단 단위 표시)
- 오른쪽: 새 노트 (드래그해서 넣기)
- 확정 시 원본에서 제거 + 새 노트 생성

### 5C — 위키 Merge 개선
- 현재도 풀페이지이나 상세 컨트롤 부족
- 블록 단위 드래그 재배치 + 순서 변경 추가

### 5D — GitMerge 버튼 스타일 수정
- 흰색 → 테마에 맞는 색상

---

## Phase 6: Merge/Split 히스토리 시스템

### 6A — History 데이터 모델
```ts
interface MergeHistory {
  id: string
  type: 'merge' | 'split'
  date: string
  sourceNotes: { id: string, title: string }[]
  targetNote: { id: string, title: string }
  snapshot?: any    // Undo용 스냅샷
  canUndo: boolean
}
```

### 6B — Detail 패널 History 섹션
- 노트 Detail 패널에 "History" 표시
- "Merged from: Note A, Note B (Mar 27)" / "Split from: Note C"
- Undo merge / Re-merge 버튼

### 6C — 필터 + Insights
- Filter에 History 추가: Merged / Split / All
- Insights에 Merge/Split History 탭
- 전체 이력 목록 + Undo/Re-merge 액션

### 6D — 위키도 동일 적용

---

## Phase 7: 기존 버그/개선 (즉시)

- [ ] 플로팅바 Trash 버튼 복구
- [ ] 플로팅바 StatusDropdown 추가
- [ ] 검색 다이얼로그 Priority 필터 제거
- [ ] GitMerge 버튼 색상 수정
- [ ] 빈 노트(한 글자도 안 쓴) 자동 생성 방지
- [ ] `<` `>` 글로벌 화면 네비게이션 개선

---

## Implementation Order

```
Phase 7:  즉시 버그/개선 (이번 세션)
Phase 1A: Shared editor config 추출
Phase 1B: Title node 구현 + 통합
Phase 1C: Toolbar 리디자인 (UpNote 참고)
Phase 1D: 커스텀 노드 (Columns, TOC, Infobox, NoteEmbed)
Phase 2A: Wiki TextBlock → TipTap (lazy mount)
Phase 2B: Block body store JSON 지원
Phase 2C: Contents/Infobox 리사이즈
Phase 3A: Template 데이터 모델 확장
Phase 3B: Block layout editor UI
Phase 3C: Template → Note/Wiki 변환
Phase 4A: Partial Quote Peek UI
Phase 4B: Quote 메타데이터 풀셋
Phase 5A: 노트 Merge 풀페이지
Phase 5B: 노트 Split 풀페이지
Phase 5C: 위키 Merge 개선
Phase 5D: GitMerge 버튼 스타일
Phase 6A: History 데이터 모델
Phase 6B: Detail 패널 History
Phase 6C: 필터 + Insights History
Phase 6D: 위키 History
```

## Risk & Mitigation

| Risk | Mitigation |
|------|-----------|
| 기존 노트 contentJson 호환 | Load 시 자동 변환, 기존 format 그대로 지원 |
| Wiki block body migration | `{ text, json? }` dual format, 기존 string 자동 래핑 |
| Wiki TipTap 다중 인스턴스 성능 | Lazy mount — 클릭 시만 mount, 동시 최대 1~2개 |
| Template block layout 복잡도 | Phase 1,2 완료 후 착수, 단순 블록부터 |
| Merge/Split 데이터 유실 | Undo 스냅샷 필수 저장 |

## NOT in Scope
- Wiki SectionBlock을 TipTap node로 전환 (기존 block 시스템 유지)
- Wiki NoteRefBlock 변경 (현재 구조 유지)
- 에디터 다크모드/테마 변경
- 멀티유저/실시간 협업 (TipTap Cloud 유료)
