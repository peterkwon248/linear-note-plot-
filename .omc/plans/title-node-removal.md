# Title Node Removal — UpNote-Style Title System

## Context

### Original Request
커스텀 `title` 노드를 폐기하고 UpNote 스타일 타이틀 시스템으로 전환.
- 문서 첫 번째 블록의 텍스트가 곧 노트 제목
- H2 헤딩을 기본 타이틀 역할로 사용
- 커스텀 Enter/Backspace 핸들링 전부 제거
- ProseMirror 기본 동작에 위임

### Research Findings

**영향받는 파일 (확인됨):**

| 파일 | 영향 내용 |
|------|-----------|
| `components/editor/core/title-node.ts` | **삭제** — 커스텀 TitleNode 전체 (158줄) |
| `components/editor/core/shared-editor-config.ts` | TitleDocument 제거, TitleNode import 제거, note tier 스키마 변경 |
| `components/editor/NoteEditorAdapter.tsx` | initialContent 구성, handleChange 타이틀 추출 로직 변경 |
| `components/editor/EditorStyles.css` | `h1[data-type="title"]` 스타일 3개 블록 제거, 새 첫 블록 스타일 추가 |
| `lib/store/index.ts` | Store version 64 → 65 |
| `lib/store/migrate.ts` | v65 마이그레이션 블록 추가 (IDB contentJson 변환) |
| `lib/note-body-store.ts` | 변경 없음 (generic put/get, title 무관) |

**영향 없는 파일 (확인됨):**
- `TipTapEditor.tsx` — title 관련 코드 없음
- `lib/store/slices/notes.ts` — Note.title 문자열 인터페이스 유지, 변경 불필요
- `lib/store/slices/maps.ts` — _hydrateNoteBodies는 generic, 변경 불필요
- `lib/editor/insertable-blocks.ts` — "title" keyword는 H1 슬래시커맨드용, 무관
- GlobalDragHandle — 그대로 유지
- 사이드바/노트 리스트/브레드크럼 — Note.title 문자열 읽기만 함

**현재 Store version:** 64

---

## Work Objectives

### Core Objective
커스텀 title 노드 + TitleDocument 스키마를 제거하고, 에디터 첫 번째 블록의 텍스트를 노트 제목으로 사용하는 UpNote 스타일 시스템으로 전환.

### Deliverables
1. title-node.ts 삭제
2. shared-editor-config.ts에서 TitleDocument/TitleNode 제거, doc 스키마를 `block+`로 복원
3. NoteEditorAdapter에서 새 타이틀 추출 로직 (첫 블록 텍스트)
4. IDB 마이그레이션: 기존 `{ type: "title" }` → `{ type: "heading", attrs: { level: 2 } }`
5. CSS 스타일 업데이트

### Definition of Done
- [x] `title` 노드 타입이 코드베이스에서 완전히 제거됨
- [x] 새 노트 생성 시 첫 줄이 H2 헤딩
- [x] 기존 노트 열면 title → H2 헤딩으로 표시됨
- [x] H2에서 텍스트 지우고 Backspace → paragraph로 전환 (ProseMirror 기본)
- [x] Note.title이 에디터 첫 블록 텍스트와 동기화됨
- [x] 빌드 에러 없음 (`npm run build` pass)

---

## Guardrails

### Must Have
- 기존 노트 데이터 무손실 마이그레이션
- Note.title 문자열 인터페이스 유지 (사이드바, 브레드크럼 등 하위 호환)
- GlobalDragHandle 정상 동작 유지
- 에디터 확장들 (SlashCommand, Wikilink, Hashtag 등) 정상 동작

### Must NOT Have
- title 노드에 대한 커스텀 Enter/Backspace 핸들링
- `TitleDocument` (content: "title block+") 스키마
- `data-type="title"` HTML 속성
- H1 강제 — 타이틀은 H2 (H1은 사용자가 본문에서 자유롭게 사용 가능)

---

## Task Flow

```
Phase 1 (스키마 + 노드 제거)
    │
    ├── Task 1.1: title-node.ts 삭제
    ├── Task 1.2: shared-editor-config.ts 수정
    └── Task 1.3: EditorStyles.css 수정
         │
Phase 2 (어댑터 로직 변경)
    │
    ├── Task 2.1: NoteEditorAdapter — initialContent 변환
    └── Task 2.2: NoteEditorAdapter — handleChange 타이틀 추출
         │
Phase 3 (데이터 마이그레이션)
    │
    ├── Task 3.1: Store migration v65 (Zustand persist)
    └── Task 3.2: IDB body migration (plot-note-bodies)
         │
Phase 4 (검증)
    │
    └── Task 4.1: 빌드 + 수동 테스트
```

---

## Detailed TODOs

### Phase 1: 스키마 + 노드 제거

#### Task 1.1: title-node.ts 삭제
- **파일:** `components/editor/core/title-node.ts`
- **작업:** 파일 전체 삭제
- **Acceptance:** 파일이 존재하지 않음

#### Task 1.2: shared-editor-config.ts 수정
- **파일:** `components/editor/core/shared-editor-config.ts`
- **작업:**
  1. `import { TitleNode } from "./title-node"` 삭제 (line 37)
  2. `TitleDocument` Node.create 블록 삭제 (lines 47-51)
  3. `EditorConfigOptions.disableDocument` 제거 (line 163)
  4. note tier case 수정:
     - `createBaseExtensions({ ...options, disableDocument: true })` → `createBaseExtensions(options)` (일반 base 사용)
     - `TitleDocument as Extension` 삭제
     - `TitleNode as Extension` 삭제
  5. `createBaseExtensions`에서 `disableDocument` 관련 로직 삭제 (line 176)
  6. Placeholder 설정에서 `title` 분기 삭제 (line 180)
  7. TextAlign types에서 `"title"` 제거 (line 191)
  8. StarterKit configure에서 `document: false` 조건부 제거
- **Acceptance:** note tier가 StarterKit 기본 doc (`content: "block+"`)을 사용

#### Task 1.3: EditorStyles.css 수정
- **파일:** `components/editor/EditorStyles.css`
- **작업:**
  1. `h1[data-type="title"]` 스타일 블록 삭제 (lines 80-99)
  2. 새 스타일 추가: `.ProseMirror > *:first-child` — 첫 블록 스타일링 (margin-top: 0)
  3. (Optional) `.ProseMirror > h2:first-child` — 타이틀 역할 H2에 약간의 추가 스타일
- **Acceptance:** title 관련 CSS 없음, 첫 블록이 깔끔하게 표시

---

### Phase 2: 어댑터 로직 변경

#### Task 2.1: NoteEditorAdapter — initialContent 변환
- **파일:** `components/editor/NoteEditorAdapter.tsx`
- **작업:**
  1. `initialContent` 함수 전면 수정:
     - 기존: titleNode 생성 → contentJson 앞에 prepend
     - 새: contentJson이 있으면 그대로 사용 (마이그레이션 후 heading 포함됨)
     - contentJson 없고 title + content만 있으면: `[{ type: "heading", attrs: { level: 2 }, content: [...title...] }, ...body...]`
     - 빈 노트: `[{ type: "heading", attrs: { level: 2 } }, { type: "paragraph" }]`
  2. `type === "title"` 체크 제거 (line 196)
  3. titleNode 구성 코드 제거 (lines 188-191)
- **Acceptance:** 에디터에 title 노드 대신 heading level 2가 첫 블록으로 표시

#### Task 2.2: NoteEditorAdapter — handleChange 타이틀 추출
- **파일:** `components/editor/NoteEditorAdapter.tsx`
- **작업:**
  1. `handleChange` 함수의 타이틀 추출 로직 변경:
     - 기존: `doc.content?.[0]?.type === "title"` → 타이틀 추출
     - 새: `doc.content?.[0]` → 첫 번째 블록의 텍스트를 타이틀로 (type 무관)
  2. bodyPlainText 계산도 수정:
     - 기존: title 길이만큼 slice
     - 새: 첫 블록 텍스트 길이만큼 slice (또는 JSON에서 직접 추출)
- **Acceptance:** 첫 블록 텍스트가 Note.title로 저장됨 (heading이든 paragraph든)

---

### Phase 3: 데이터 마이그레이션

#### Task 3.1: Store migration v65
- **파일:** `lib/store/migrate.ts` + `lib/store/index.ts`
- **작업:**
  1. `lib/store/index.ts`에서 `version: 64` → `version: 65`
  2. `lib/store/migrate.ts`에 v65 마이그레이션 블록 추가
  3. 마이그레이션 내용: Zustand persist에는 contentJson이 없으므로 (body separation) 별도 처리 불필요할 수 있음
     - 단, `contentJson: null`인 노트는 body IDB에서 로드되므로 IDB 마이그레이션이 핵심
  4. version bump만으로 충분할 수 있음 — IDB 마이그레이션은 Task 3.2에서 처리
- **Acceptance:** Store version 65로 정상 마이그레이션

#### Task 3.2: IDB body migration (plot-note-bodies)
- **파일:** `lib/store/index.ts` (onRehydrateStorage) 또는 별도 마이그레이션 함수
- **작업:**
  1. `onRehydrateStorage` 또는 app 초기화 시점에서 IDB의 모든 body를 스캔
  2. `contentJson.content[0].type === "title"` 인 경우:
     ```
     { type: "title", content: [...] }
     →
     { type: "heading", attrs: { level: 2 }, content: [...] }
     ```
  3. 변환된 body를 IDB에 다시 저장
  4. 마이그레이션 완료 플래그 저장 (localStorage key: `plot-title-migrated`)
  5. 이미 마이그레이션된 경우 스킵
- **주의사항:**
  - IDB 마이그레이션은 비동기 — app 시작 시 한 번만 실행
  - 대량 노트가 있을 수 있으므로 batch 처리 (`saveBodiesBatch`)
  - `_hydrateNoteBodies` 호출 전에 마이그레이션 완료되어야 함
- **Acceptance:** IDB의 모든 body에서 title 노드가 heading으로 변환됨

---

### Phase 4: 검증

#### Task 4.1: 빌드 + 수동 테스트
- **작업:**
  1. `npm run build` — TypeScript 에러 없음
  2. `npm run dev` — 수동 테스트:
     - 새 노트 생성 → 첫 줄 H2, 타이핑하면 Note.title 동기화
     - 기존 노트 열기 → title → H2로 마이그레이션 확인
     - H2에서 텍스트 삭제 + Backspace → paragraph 전환
     - H2에서 Enter → 다음 줄로 이동 (ProseMirror 기본)
     - 드래그 핸들 정상 동작
     - SlashCommand, Wikilink, Hashtag 정상 동작
     - 사이드바 노트 리스트에서 제목 정상 표시

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| IDB 마이그레이션 중 앱 크래시 → 데이터 반만 변환 | HIGH | 마이그레이션 플래그를 마지막에 설정. 재시작 시 미완료 body만 재처리 |
| 기존 contentJson이 없는 노트 (plain text only) | LOW | NoteEditorAdapter initialContent에서 fallback 처리 이미 있음 |
| 첫 블록이 heading이 아닌 paragraph인 경우 제목 표시 | LOW | 의도된 동작 — 첫 블록 텍스트가 곧 제목 (UpNote 방식) |
| GlobalDragHandle이 title 노드를 특별 처리하고 있을 수 있음 | LOW | 확인 완료 — customNodes에 title 없음, 영향 없음 |
| Placeholder가 title용 빈 문자열 반환하던 것 제거 | LOW | heading/paragraph용 placeholder가 이미 있음 |

---

## Commit Strategy

**Single commit** — 변경 범위가 하나의 논리적 단위 (title 노드 폐기)

```
feat: replace custom title node with UpNote-style first-block title

- Remove TitleNode and TitleDocument custom schema
- Use StarterKit default doc (content: "block+")
- Extract note title from first block text (heading or paragraph)
- New notes start with H2 heading as title
- Migrate IDB bodies: title node → heading level 2
- Store version 64 → 65
```

---

## Success Criteria

1. **제로 title 노드 참조:** codebase에서 `type: "title"` (TipTap 노드 타입) 검색 결과 0건
2. **빌드 성공:** `npm run build` 에러 없음
3. **새 노트:** 첫 줄 H2, Note.title 동기화
4. **기존 노트:** 마이그레이션 후 H2로 정상 표시
5. **ProseMirror 기본 동작:** Enter/Backspace에 커스텀 핸들링 없음
6. **하위 호환:** 사이드바, 브레드크럼, 검색 등 Note.title 소비자 정상 동작
