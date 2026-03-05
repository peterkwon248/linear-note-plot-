# Plot 성능 아키텍처 리팩토링 (업노트급 10K+ 노트)

## Context

현재 Plot은 모든 노트 데이터(본문 포함)를 하나의 Zustand 스토어 → localStorage에 저장한다.
- localStorage 한도 ~5-10MB → 노트 100-200개면 터짐
- 모든 상태 변경 시 전체 직렬화 (메인 스레드 블로킹)
- 백링크 계산 O(n²), 검색 메인 스레드, 가상화 없음

**목표:** 메타/본문 분리, 가상 스크롤, Worker 검색, 증분 백링크로 10K+ 노트에서도 업노트급 체감 속도 달성.
**설계 원칙:** MiniSearch + Worker (지금), 추상화된 SearchEngine 인터페이스로 나중에 SQLite 교체 가능.

---

## Phase 1: 메타/본문 분리 + IndexedDB (가장 급함)

localStorage 한도 문제 해결. 모든 후속 Phase의 기반.

### 새 파일

| 파일 | 역할 |
|------|------|
| `lib/note-body-store.ts` | IndexedDB 래퍼 (DB: `plot-bodies`, store: `bodies`, keyPath: `id`) |
| `lib/note-body-context.tsx` | React Context — `getBody()`, `getCachedBody()`, `preloadBody()`, `saveBody()`, `getAllBodies()` + LRU 캐시(~200개) |
| `lib/body-helpers.ts` | `extractPreview(content)` → 120자, `extractLinksOut(content)` → [[링크]] 추출, `stripMarkdownForPreview()` |
| `lib/migration-v13.ts` | v12→v13 마이그레이션: 기존 데이터에서 body 분리 → IDB 기록 |
| `components/providers/body-provider.tsx` | NoteBodyContext.Provider (루트 레이아웃에 배치) |

### 타입 변경 (`lib/types.ts`)

```typescript
// 새 타입 추가
interface NoteMeta { /* 기존 25개 필드 - content/contentJson + preview + linksOut */ }
interface NoteBody { id: string; content: string; contentJson: Record<string, unknown> | null }
```

### 스토어 변경 (`lib/store.ts`)

- `notes: Note[]` → `notes: NoteMeta[]` (content/contentJson 제거)
- 각 NoteMeta에 `preview: string` (120자), `linksOut: string[]` (위키링크 목록) 추가
- persist 버전 12 → 13, 마이그레이션: 본문 추출 → IDB 저장, 메타에 preview/linksOut 계산
- `createNote`: body는 IDB에, meta만 Zustand에
- `updateNote`: body 변경 → IDB, preview/linksOut 재계산 → Zustand
- `deleteNote`: IDB에서도 삭제
- `addWikiLink`: async — IDB에서 body 읽기/쓰기
- `getFilteredNotes`/`filterNotesByRoute`: content 검색 → preview 검색으로 대체

### 컴포넌트 변경

| 파일 | 변경 |
|------|------|
| `components/editor/NoteEditorAdapter.tsx` | body를 IDB에서 async 로딩, 스켈레톤 표시 후 TipTap 마운트 |
| `components/note-list.tsx` | `stripMarkdown(note.content)` → `note.preview` |
| `components/note-detail-panel.tsx` | content preview → `note.preview`, 백링크는 `linksOut` 기반으로 전환 |
| `components/note-inspector.tsx` | heading 추출/글자수 → body async 로딩 |
| `app/settings/backup/page.tsx` | export 시 IDB에서 전체 body 로딩 |
| `app/(app)/projects/page.tsx` | `note.content.trim().length > 20` → `note.preview.length > 20` |

### 마이그레이션 전략

1. Zustand `migrate` (동기): notes에서 content/contentJson 추출 → `window.__plotMigrationBodies`에 임시 저장, 메타에 preview/linksOut 계산
2. `BodyProvider` 마운트 시: `__plotMigrationBodies` 감지 → IDB에 batch write → 임시 변수 삭제
3. 완료 전까지 "데이터 마이그레이션 중..." 로딩 표시

### 검증

- [ ] v12 데이터로 리로드 → IDB에 body 생성 확인 (DevTools > Application > IndexedDB)
- [ ] localStorage에 content/contentJson 없음 확인
- [ ] 에디터에서 노트 열기/편집/리로드 → 내용 유지
- [ ] 목록 preview 정상 표시
- [ ] export 정상 동작
- [ ] 새 노트 생성/삭제 정상

---

## Phase 2: 테이블/리스트 가상화

DOM 과부하 해결. 노트 500+ 시 필수.

### 패키지 추가

```bash
npm install @tanstack/react-virtual
```

### 변경 파일

| 파일 | 변경 |
|------|------|
| `components/notes-table.tsx` | `filteredNotes.map()` → `useVirtualizer` (행 높이 44px, overscan 10) |
| `components/note-list.tsx` | 날짜 그룹 + 노트를 flat 리스트로 변환 후 가상화 |

### notes-table.tsx 핵심 변경

```tsx
const parentRef = useRef<HTMLDivElement>(null)
const rowVirtualizer = useVirtualizer({
  count: filteredNotes.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 44,
  overscan: 10,
})
// absolute positioning + translateY로 렌더링
```

### note-list.tsx 핵심 변경

날짜 그룹을 flat item으로 변환:
```typescript
type ListItem = { type: 'header'; label: string } | { type: 'note'; note: NoteMeta }
```
header는 32px, note는 52px로 `estimateSize` 분기.

### 검증

- [ ] 500+ 노트에서 DOM 요소 ~30-50개만 존재 (DevTools Elements)
- [ ] 빠른 스크롤 시 프레임 드롭 없음
- [ ] 윈도우 리사이즈 시 정상 동작

---

## Phase 3: Worker 기반 검색 (MiniSearch)

메인 스레드 검색 블로킹 제거. 추상화된 인터페이스로 SQLite 교체 가능.

### 패키지 변경

```bash
npm install minisearch
npm uninstall fuse.js
```

### 새 파일

| 파일 | 역할 |
|------|------|
| `lib/search/search-engine.ts` | `SearchEngine` 인터페이스 (upsert, remove, search, suggest, rebuild) |
| `lib/search/minisearch-engine.ts` | MiniSearch 구현체 |
| `lib/search/search-worker.ts` | Web Worker 스크립트 (MiniSearchEngine 운용) |
| `lib/search/search-client.ts` | 메인 스레드 클라이언트 (Worker 통신, Promise 래핑) |
| `lib/search/search-provider.tsx` | React Context — `search()`, `isReady` |
| `lib/search/highlight.ts` | `fuzzy-search.ts`에서 하이라이트 유틸 이동 |

### SearchEngine 인터페이스 (핵심)

```typescript
interface SearchEngine {
  upsert(doc: { id: string; title: string; content: string; tags: string[] }): void
  remove(id: string): void
  search(query: string, options?: { limit?: number; fuzzy?: number }): SearchResult[]
  suggest(query: string): string[]
  rebuild(docs: Array<{ id: string; title: string; content: string; tags: string[] }>): void
}
// 나중에 SQLiteFTSEngine implements SearchEngine 으로 교체 가능
```

### 변경/삭제 파일

| 파일 | 변경 |
|------|------|
| `components/search-dialog.tsx` | Fuse.js → `useSearch()` context hook, 검색 async화 |
| `lib/store.ts` | `getFilteredNotes` content 검색 제거 (title + preview만, 전문검색은 search dialog에서) |
| `lib/fuzzy-search.ts` | **삭제** (highlight 유틸은 `search/highlight.ts`로 이동) |

### Worker 초기화 흐름

1. SearchProvider 마운트 → Worker 생성
2. 모든 NoteMeta(title, tags) + NoteBody(content)를 IDB에서 로딩
3. Worker에 `rebuild` 메시지 전송
4. Zustand store 변경 구독 → 증분 `upsert`/`remove`

### 검증

- [ ] DevTools > Sources에서 Web Worker 실행 확인
- [ ] 본문에만 있는 단어 검색 → 결과 표시
- [ ] 새 노트 생성 후 즉시 검색 가능
- [ ] 5000+ 노트에서 100ms 이내 응답
- [ ] fuse.js 번들에서 제거 확인

---

## Phase 4: 증분 백링크 (linksOut 기반)

O(n²) → O(n) 백링크 계산. Phase 1의 `linksOut` 필드 활용.

### 새 파일

| 파일 | 역할 |
|------|------|
| `lib/backlinks-index.ts` | `BacklinksIndex` 클래스 — rebuild, update(증분), countBacklinks, getBacklinkIds |
| `lib/backlinks-context.tsx` | React Context — BacklinksIndex 제공, store 변경 시 증분 업데이트 |

### 핵심 알고리즘

```typescript
// O(n * avgLinks) — 사실상 O(n)
for (const note of notes) {
  for (const link of note.linksOut) {
    const targetId = titleToId.get(link)
    if (targetId) backlinks.get(targetId).add(note.id)
  }
}
```

### 변경 파일

| 파일 | 변경 |
|------|------|
| `lib/backlinks.ts` | `buildBacklinksMap` → BacklinksIndex 위임, `suggestBacklinks` → linksOut 기반 |
| `lib/graph.ts` | `buildAdjacencyList`: `extractWikiLinks(note.content)` → `note.linksOut` |
| `lib/queries/notes.ts` | `countBacklinks` 호출 → BacklinksIndex 파라미터로 전달 |
| `components/notes-table.tsx` | `buildBacklinksMap(notes)` → `useBacklinks().getBacklinksMap()` |
| `components/search-dialog.tsx` | `buildBacklinksMap(notes)` → `useBacklinks().getBacklinksMap()` |
| `components/note-detail-panel.tsx` | 인라인 backlink 계산 → `useBacklinks()` |
| `components/note-inspector.tsx` | `countBacklinks()` → `useBacklinks().countBacklinks()` |
| `components/connections-graph.tsx` | content 스캔 → `note.linksOut` |

### 추가: noteEvents 바운딩

- 노트당 최대 1000개 이벤트로 제한
- 초과분은 IDB로 이동 (선택사항)

### 검증

- [ ] 백링크 카운트가 이전과 동일
- [ ] 5000 노트에서 `getBacklinksMap()` < 10ms
- [ ] 노트에 [[링크]] 추가 → 대상 노트 백링크 즉시 증가
- [ ] 그래프 뷰 링크 정확성
- [ ] content 직접 접근 코드 0개 (grep 확인)

---

## 실행 순서

```
Phase 1 (메타/본문 분리) ← 모든 것의 기반, 최우선
  ├→ Phase 2 (가상화) — 독립, 가장 간단
  ├→ Phase 3 (Worker 검색) — IDB body 접근 필요
  └→ Phase 4 (증분 백링크) — linksOut 필드 필요
```

Phase 2, 3, 4는 Phase 1 완료 후 병렬 진행 가능.

## 의존성 추가 요약

| 패키지 | Phase | 사이즈 |
|--------|-------|--------|
| `idb` (또는 raw IndexedDB) | 1 | ~1KB |
| `@tanstack/react-virtual` | 2 | ~3KB |
| `minisearch` | 3 | ~8KB |
| ~~`fuse.js`~~ (제거) | 3 | -~20KB |
