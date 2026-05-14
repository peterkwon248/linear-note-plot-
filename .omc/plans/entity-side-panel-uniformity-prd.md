# Entity Side Panel Uniformity PRD

> 작성: 2026-05-14 / Status: DRAFT (사용자 합의 대기)
> Plot의 우측 4탭 사이드바 (Detail / Connections / Activity / Bookmarks)를 모든 entity에 균일한 수준으로 제공하기 위한 단계별 작업 계획.

## 1. 문제 진단 (after PR #322)

Plot의 우측 4탭 사이드바는 모든 entity가 공유하는 골격이지만, entity별 기능 수준이 비대칭:

| Entity | Detail | Connections | Activity | Bookmarks |
|---|---|---|---|---|
| **Note** | Full | Full (Hierarchy / Connected / Discover) | Full (events + comments) | Full (anchor pin) |
| **Wiki** | Full | Mid (Hierarchy / Connected, Discover 없음) | Comments only ("not yet available") | globalBookmarks only |
| **Template** | Full ✅ (PR #322) | Mid ("Used by N") ✅ (PR #322) | "not yet available" ✅ (PR #322) | globalBookmarks + 안내 ✅ (PR #322) |
| **Book** | ❌ **사이드바 자체 없음** | N/A | N/A | N/A |

→ Plot 일관성 원칙 (entity별 Detail은 자유 + 4탭 골격은 공유) 미완성.

## 2. 큰 그림 결정 (영구 LOCKED, 사용자 합의 후)

1. **모든 entity가 4탭 사이드바 보유** — Book 신설
2. **Connections 분류 stats 패턴 통일** — kind & status별 분류:
   - Notes: Stone N / Brick N / Block N
   - Wikis: Stub N / Article N
   - 모든 entity의 Connections에 통일된 카운트 패턴 적용
3. **Activity entity-agnostic 통합** — 통합 `entityEvents` 모델 (entityKind + entityId)
4. **Bookmarks anchor 모든 entity** — `GlobalBookmark.targetKind`에 "template" + "book" 추가 (이미 "note"/"wiki" 지원). 각 entity 본문에서 anchor 추출.

## 3. 비-목표 (Non-goals)

- Detail 탭의 entity별 내용 통일 — 본질 따라 자유 유지 (PR #322 LOCKED 결정)
- Sidebar 골격 자체 변경 (4탭 고정 유지)
- Wiki Discover 추가 (별도 검토)
- Book의 anchor 의미가 약하면 "not yet available"로 단계적 안내 (점진 도입)

## 4. 5 PR 단계별 진행 계획

### PR 2 — Book 사이드바 신설 + Connections 분류 stats (베이스)

**Scope**:
- `sidePanelContext.type`에 `"book"` 추가 (lib/store/types.ts 또는 slice)
- `useSidePanelEntity` book 분기 추가
- 신규 `components/side-panel/book-detail-panel.tsx`:
  - Header: 📚 Book + Kind badge (Smart/Hybrid/Manual) + Pin/Unpin
  - Description (있으면)
  - Dates (Created / Updated)
  - Smart Sources (Smart/Hybrid일 때만, 5종 chip)
  - Chapters (chapter-heading 있을 때만, Outline 역할)
  - Properties (=stats): Total items / Notes / Wikis / Chapters / Smart items / Manual items
  - Reading (lastReadAt 있을 때만): Last read + Resume button
  - Actions: Open in Read mode / Delete book
- `SidePanelDetail` book 분기 추가
- `SidePanelConnections` book 분기 — **Items by kind & status** (이번 PR의 핵심 패턴):
  ```
  📝 Notes: 5
    ⚪ Stone 2 / 🟠 Brick 2 / 🟢 Block 1
  📖 Wikis: 3
    ⚪ Stub 1 / 📄 Article 2
  📑 Chapters: 2

  Smart Sources (Smart/Hybrid):
    📁 folder "Daily Log" → 3 notes
    🏷️ tag "research" → 2 notes
  ```
- `SidePanelActivity` book 분기 — "Book history is not yet available" (위키 패턴)
- `SidePanelBookmarks` book 분기 — globalBookmarks 표시 + "Anchor bookmarks in books are not yet available"
- Books `book-detail-page.tsx`에 toggle panels 추가 + book 클릭 시 sidePanelContext 설정

**데이터 모델 변경**: 없음 (sidePanelContext type 확장만, runtime).

**Risk**: 중간 — 신규 컴포넌트 + 다른 분기들 wire up.

### PR 3 — Connections 분류 stats 모든 entity로 확장

**Scope**:
- PR 2에서 Book에 적용된 "kind & status 분류" 패턴을 다른 entity Connections에 확장:
  - **Note Connections**: backlink 노트 + linking 노트 status 분류 (Stone/Brick/Block)
  - **Wiki Connections**: linking 노트 status 분류 + 카운트
  - **Template Connections**: "Used by N notes"를 status별 분류 (Stone N / Brick N / Block N)
- 공통 `EntityCountByStatus` UI 컴포넌트 추출 가능

**데이터 모델 변경**: 없음 (derive only).

**Risk**: 낮음 — Connections UI 확장만.

### PR 4 — Bookmarks anchor 모든 entity 지원

**Scope**:
- `GlobalBookmark.targetKind`에 `"template"`, `"book"` 추가 (optional 확장, backward compat)
- Template anchors: `extractAnchorsFromContentJson` 재사용 (note와 동일 패턴)
- Wiki anchors: 신규 `extractAnchorsFromWikiBlocks` (blocks 구조 다름 — section/text/note-ref/image 등 traverse)
- Book anchors: 의미 검토 후 도입 여부 결정 (chapter-heading만? items도 anchor?). 최소: chapter-heading.
- 각 entity Bookmarks 탭에 `LocalAnchors` 컴포넌트 추가 (note는 이미 있음, 패턴 일반화)
- pin/unpin 시 globalBookmarks에 추가 (entity-agnostic)

**데이터 모델 변경**: 작음 (optional 필드 확장, 마이그레이션 없음).

**Risk**: 중간 — Wiki blocks용 새 extractor + 4 entity wire up.

### PR 5 — Activity entity-agnostic 통합 (별도 PRD 필수)

**Scope**:
- `noteEvents` slice → `entityEvents` slice 통합:
  ```typescript
  interface EntityEvent {
    id: string
    entityKind: "note" | "wiki" | "template" | "book"
    entityId: string
    type: EntityEventType  // 통합 enum
    at: string
    meta?: Record<string, unknown>
  }
  ```
- 마이그레이션: 기존 `noteEvents`를 `entityEvents`로 변환 (`entityKind: "note"` 백필). Store version 증가.
- 각 entity action 시점에 `appendEvent` wire up (created/updated/opened/trashed/...):
  - Wiki: createWikiArticle / updateWikiArticle / openWikiArticle / trashWikiArticle 등
  - Template: createTemplate / updateTemplate / deleteTemplate / createNoteFromTemplate (Template event + Note event 둘 다)
  - Book: createBook / updateBook / deleteBook / addBookItem / removeBookItem 등
- `ActivityTimeline` entity-agnostic 확장 (entityKind 무관 동작)
- Comments wire up (CommentsByEntity 이미 wiki/note 지원 → template/book 추가)

**데이터 모델 변경**: 큼 — slice 통합 + 마이그레이션.

**Risk**: 높음 — 데이터 모델 변경 + 전 entity wire up + 마이그레이션 검증.

**의무**: 이 PR 진행 전 별도 PRD (`.omc/plans/activity-unification-prd.md`) 작성. 통합 event 모델 + 마이그레이션 + 각 entity wire up 지점 LOCKED.

## 5. 순서 정당화

1. **PR 2 (Book) 먼저** — 가장 명확한 누락. 신설 자체로 가치 크다. Connections 분류 stats 패턴은 Book에서 검증 (현실적인 entity 1개로).
2. **PR 3 (Connections 확장)** — PR 2 패턴을 다른 entity로 횡적 확장. 데이터 모델 X = 안전. 빠른 polish.
3. **PR 4 (Bookmarks anchor)** — 데이터 모델 작은 확장 + 검증된 패턴 (`NoteLocalAnchors`)을 entity-agnostic화. 중간 risk.
4. **PR 5 (Activity 통합)** — 가장 큰 작업. 다른 PR과 독립적이라 마지막. 별도 PRD 필수.

각 PR은 단일 책임 + 데이터 모델 분리 (작업 원칙 #6 정합).

## 6. 영구 결정 (LOCKED, 사용자 합의 후)

- **4탭 골격 모든 entity 공통** (Book 신설로 완성)
- **Detail 내용은 entity 본질 따라 자유** (PR #322 LOCKED 재확인)
- **Connections 분류 stats 패턴**: kind → status 2단 분류 (모든 entity)
- **`GlobalBookmark.targetKind`**: "note" | "wiki" | "template" | "book" (PR 4)
- **`entityEvents`**: entityKind 차원 추가 (PR 5)

## 7. 결정 trigger (사용자 합의 항목)

1. **순서 (PR 2 → 3 → 4 → 5) OK?**
2. **PR 2의 Book Connections 패턴 — 위 예시 그대로?**
3. **PR 4의 Book anchor — chapter-heading만? 또는 더?**
4. **PR 5는 별도 PRD 작성 의무 인정?**
5. **Discover (Wiki/Template에 추가)는 별도 후속 작업?** (본 PRD 범위 외)

## 8. 비고

- `book-entity-prd.md` (기존, 본 폴더) 참고 — Book entity 본질 정의 + Smart Book 데이터 모델
- `smart-book-v2-prd.md` 참고 — Book의 Reading position / Chapter ordering 등
- PR #322 (Template Detail 재설계) — 본 PRD의 Wave 0. 모든 entity 4탭 균일화의 첫 단계.
