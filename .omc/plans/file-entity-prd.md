# File 독립 엔티티 — PRD v0.1

> **Scope**: `Attachment`(파일)를 note-scoped 모델에서 Tag/Label과 동급의 독립 Library 엔티티로 승격. 데이터 모델 강등(`noteId`→`originNote`) + N:M usage 인덱스 + "기존 파일 삽입" 피커 + 삭제 dangling-ref 처리.
> **Trigger**: 2026-05-22 후속 세션 — 글로벌 엔티티 검증 중 "File만 note-scoped 예외" 발견 → File 독립 엔티티 브레인스토밍 (결정 locked). 상세 = `docs/SESSION-LOG.md` 2026-05-22 (후속) entry.
> **Status**: DRAFT v0.2 — Q1(타입명 유지)·Q2(originEntity) 사용자 승인 반영, §2 확정. §7 잔여 2건(usage 인덱스 구현 / Books 접점).

---

## §0. 배경 — 왜 이 PRD인가?

### 0-1. 글로벌 엔티티 중 File만 note-scoped 예외

Plot의 cross-entity 분류 엔티티 — Tag / Label / Category / Sticker (영구 LOCKED #53–#58) — 는 모두 **standalone**이다. 어느 엔티티(Note/Wiki/Book)에도 자유롭게 부여되고, 자기 Library 페이지를 가진다.

File(`Attachment`)만 예외다. `lib/types.ts:997` `Attachment` interface가 `noteId: string` 필드를 가져, 표면적으로 "모든 파일은 노트 하나에 소속"이라는 모델을 강제한다. 하지만 ——

### 0-2. 핵심 발견 — N:M 아키텍처 전제는 이미 충족됨 (코드 검증)

브레인스토밍 중 코드를 확인한 결과, **가장 어려운 부분이 이미 되어 있다**:

**① 콘텐츠는 이미 파일을 ID로 참조한다 — `attachment://` URI 스킴.**
노트/위키 본문은 파일을 FK가 아니라 콘텐츠 내 `attachment://<id>` URL로 참조한다.
- 생성: `shared-editor-config.ts:486,496` / `insert-menu.tsx:83,111` / `wiki-block-renderer.tsx:998`
- 해석: `lib/use-attachment-url.ts` (`parseAttachmentUrl`/`isAttachmentUrl`/`resolveAttachmentUrl`/`useAttachmentUrl`) + `components/editor/ImageNode.tsx:32`

→ 한 파일을 여러 노트가 참조해도 모델이 깨지지 않는다. **N:M 참조의 아키텍처 전제가 이미 구현돼 있다.**

**② `Attachment.noteId`는 이미 신뢰 불가 — vestigial.**
7개 `addAttachment` 호출처가 제각각의 값을 넣는다:

| 호출처 | `noteId` 값 |
|---|---|
| 노트 파일 드롭 (`shared-editor-config.ts:470`) | `noteId ?? ""` |
| insert-menu 이미지/파일 (`insert-menu.tsx:67,97`) | `noteId ?? ""` |
| wiki collection sidebar (`wiki-collection-sidebar.tsx:486`) | 실제 wiki id |
| wiki block 이미지 (`wiki-block-renderer.tsx:1016`) | 실제 wiki id |
| Library 업로드 직접 (`library-view.tsx:758`) | `""` (빈 문자열) |
| Library files 일괄 업로드 (`library-view.tsx:971`) | `"__library__"` sentinel |

"모든 파일은 노트가 소유"라는 불변식은 **이미 깨져 있다**. `noteId`는 빈 문자열, `"__library__"` sentinel, 실제 note id, 실제 wiki id가 뒤섞인 — 출처 힌트 그 이상이 아니다.

> ⚠️ 브레인스토밍 수정: 기존 노트는 "wiki 이미지는 `""`를 넣는다"고 기록했으나, 코드 검증 결과 **wiki 이미지/sidebar는 실제 wiki id를 넣는다**. `noteId`가 note만이 아니라 wiki id도 담는다는 점이 §2-1 `originEntity`(EntityRef) 채택의 근거.

**③ Files Library 뷰 + file entity event가 이미 존재.**
모든 `addAttachment`(`attachments.ts:9`)가 레코드를 만들고, `useFilesView`(`lib/view-engine/use-files-view.ts`)가 전체 레코드를 소스로 본다. 파일은 `{kind:"file"}` entity event(`created`/`trashed`/`untrashed`)도 이미 발화한다 (`attachments.ts:16,31,41`). 파일 활동 사이드바도 이미 `<SoloHistory entity={{kind:"file",...}}/>`로 렌더 (`side-panel-activity.tsx:56`).

### 0-3. 결론 — 풀 리빌드가 아니라 "정직한 정리"

이 작업은 데이터 리빌드가 아니다. **이미 사실상 독립인 것을 모델·네이밍·UI에서 정직하게 인정**하는 수준이다.

---

## §1. 핵심 명제

> `Attachment`를 Tag/Label과 동급의 standalone Library 엔티티로 승격한다.
> - `noteId`(가짜 소유권 FK) → `originEntity`(출처 힌트)로 강등 — 제거 X
> - 콘텐츠 `attachment://` 스캔 기반 **usage 인덱스**로 N:M 참조를 명시화
> - "**기존 파일 삽입**" 피커로 재사용을 1차 시민으로
> - 삭제 시 dangling reference 처리

v1 대상 = Note / Wiki. Books 파일 접점은 fast-follow (§6-3).

---

## §2. 데이터 모델 변경

> **확정 (v0.2, 사용자 승인)** — **Q1**: 내부 타입명은 `Attachment` 유지 (DOM 전역 `File` 충돌 회피 — NoteStatus `keystone`(internal)/"Block"(UI) 선례). UI·개념 라벨만 "File"/"Files". **Q2**: `noteId` → `originEntity: EntityRef | null` — note·wiki origin을 모두 정직하게 표현.

### 2-1. `Attachment.noteId` → `originEntity` 강등

`lib/types.ts:997` `Attachment` (타입명 유지):
```ts
// before
noteId: string
// after
originEntity: EntityRef | null   // 출처 힌트(provenance). 소유권 FK 아님.
                                 // EntityRef = { kind: EntityKind, id: string }
```
- 의미: "이 파일이 처음 업로드/생성된 컨텍스트 엔티티". 없으면 `null`.
- 노트 드롭 → `{kind:"note", id}` / wiki 이미지 → `{kind:"wiki", id}` / Library 직접 업로드·sentinel → `null`.
- **제거하지 않는다** — "이 파일 어디서 왔지"는 유용한 provenance (locked decision).

호출처 변경:
- `addAttachment` 시그니처: `partial.noteId` → `partial.originEntity`. 7개 호출처가 컨텍스트에 맞는 `EntityRef` 또는 `null` 전달 (`noteId ?? ""` → `{kind,id}` 또는 `null`).
- `attachments.ts`의 note-timeline 이벤트 (`appendEvent(partial.noteId, "attachment_added", ...)`): `originEntity?.kind === "note"`일 때만 `appendEvent(originEntity.id, ...)` 발화, 그 외 스킵.

### 2-2. `attachment://` wire format은 **유지**

타입/액션 이름이 바뀌어도 `attachment://<id>` URI 스킴은 그대로 둔다. 이건 **콘텐츠 데이터** — 바꾸면 기존 노트/위키 본문의 모든 파일 참조가 깨진다. 내부 식별자 이름과 wire format은 분리한다.

### 2-3. 마이그레이션 v144 → v145

옛 `noteId`(bare string)는 note·wiki id가 섞여 있어, 마이그레이션 시 `state.notes` / `state.wikiArticles`에 조회해 `kind`를 판정한다. `lib/store/migrate.ts` (v143→v144 패턴 정합, `migrate.ts:1919` 참고):
```ts
// v144 → v145: attachment.noteId(string) → originEntity(EntityRef | null)
if (Array.isArray(state.attachments)) {
  const noteIds = new Set(((state.notes as { id: string }[]) ?? []).map((n) => n.id))
  const wikiIds = new Set(((state.wikiArticles as { id: string }[]) ?? []).map((w) => w.id))
  let touched = 0
  state.attachments = (state.attachments as Record<string, unknown>[]).map((a) => {
    const raw = a.noteId as string | undefined
    let originEntity: { kind: string; id: string } | null = null
    if (raw && raw !== "__library__") {
      if (noteIds.has(raw)) originEntity = { kind: "note", id: raw }
      else if (wikiIds.has(raw)) originEntity = { kind: "wiki", id: raw }
      // 매칭 실패(삭제된 노트 등 stale id) → null
    }
    const { noteId, ...rest } = a
    touched += 1
    return { ...rest, originEntity }
  })
  console.log(`[migrate] v144→v145: ${touched} attachment(s) noteId→originEntity`)
}
```
- `lib/store/index.ts` `version: 144` → `145`.
- `Array.isArray` 가드 + touched count + idempotent (`noteId` 부재 시 `raw=undefined` → `null`).
- stale id(삭제된 노트 참조)는 `null`로 정리 — provenance라 손실 무해.

---

## §3. Usage 인덱스 — N:M 참조 명시화

### 3-1. 콘텐츠 `attachment://` 스캔

"이 파일을 누가 쓰고 있나"는 별도 저장 필드가 아니라 **콘텐츠에서 derive**한다.
- 노트 `contentJson` + 위키 article blocks의 ProseMirror JSON tree를 walk → `attachment://<id>` (image `src` / link `href`) 추출.
- `parseAttachmentUrl` (`use-attachment-url.ts:21`) 재활용. 신규 헬퍼 `extractAttachmentRefs(contentJson): string[]` (`lib/body-helpers.ts`의 `extractBlockLinkContexts` 패턴 정합).
- 결과: 역인덱스 `Map<fileId, EntityRef[]>` — "파일 X를 노트 A, 위키 B가 사용".

### 3-2. perf — memoized derive

- v1 = memoized selector. 노트/위키 콘텐츠 변경 시에만 재계산. 별도 저장 인덱스 X (sync 부담 회피 — derive 우선 원칙).
- 노트 대량 시: File detail panel을 열 때만 lazy 계산하는 fallback 고려 (§7 Q3).

### 3-3. 노출

File detail panel Connections 탭에 "N개 노트/위키에서 사용 중" + 목록. 영구 룰 #21 (Library entity 사이드바 4탭 — Detail/Connections/Activity/Bookmarks — entity-aware) 정합.

---

## §4. "기존 파일 삽입" 피커

현재 파일 삽입은 **항상 새 업로드**다 — 같은 이미지를 5번 붙이면 레코드 5개 + blob 5개. 재사용 경로가 없다.

신규: insert-menu / AddBlockButton에 "**기존 파일에서…**" 옵션.
- 모든 File 레코드를 보여주는 피커 dialog (검색 input + 그리드/리스트).
- 선택 시 새 업로드 없이 `attachment://<existing-id>` 노드만 콘텐츠에 삽입.
- 패턴: TagPicker / WikiPicker 정합 — 검색 input + cmdk (영구 룰 #44).

이 피커가 N:M의 **입구**, usage 인덱스(§3)가 **카운터**다.

---

## §5. 삭제 + Dangling Reference

현재 `removeAttachment`(soft) / `permanentlyDeleteAttachment`(hard) 모두 **사용 중 체크가 없다** (검증됨 — `isAttachmentReferenced` 류 헬퍼 부재). 사용 중 파일을 hard delete → 콘텐츠의 `attachment://<id>`가 dangling → `resolveAttachmentUrl` IDB miss → 깨진 이미지.

v1 대응:
1. **삭제 경고** — hard delete 시 usage 인덱스(§3) 조회 → "이 파일을 N개 노트/위키가 사용 중입니다" 확인 dialog.
2. **soft delete 우선** — trash 경유 2단 삭제 유지. trashed 파일도 blob은 남아 복원 가능 (blob 제거는 hard delete `removeAttachmentBlob`만).
3. **graceful fallback** — `ImageNode.tsx` 등 해석 지점에서 IDB miss 시 깨진 이미지 대신 "파일 없음" placeholder (영구 룰 #73 orphan graceful fallback 정합).

Phase 2: hard delete 시 참조 노트들의 `attachment://` 노드 자동 제거 — 콘텐츠 mutation이라 위험 → 별도.

---

## §6. 범위 / Phasing

### 6-1. v1 (이 PRD)
모델 강등(`noteId`→`originNote`) + v145 마이그레이션 + usage 인덱스(derive) + 삽입 피커 + 삭제 경고 + graceful fallback. 대상 = Note / Wiki.
영구 룰 #6 (UI 변경 ↔ 데이터 모델 변경 분리 PR) — **마이그레이션+모델 PR** / **피커 UI PR** 2개로 분리 권장.

### 6-2. Phase 2 (locked, 후속)
- **content-hash dedup** — 같은 파일 재업로드 시 기존 레코드 재사용.
- hard delete 시 dangling `attachment://` 노드 자동 정리.

### 6-3. Fast-follow
- **Books 파일 접점** — Books smartSources/items의 파일 참조 (현재 접점 거의 없음 — §7 Q5 확인 필요).

---

## §7. Open Questions

1. **usage 인덱스 구현** — pure derive(memoized) vs 저장 역인덱스. v1 derive 권고(§3-2), 노트 대량 시 perf 재평가.
2. **Books 접점** — Books가 실제로 파일을 참조하는 지점이 있는지 코드 확인 (fast-follow 전제 검증, §6-3).

> Q1(타입명 유지)·Q2(`originEntity`)는 v0.2에서 해소 — §2 참조. PR 분할은 영구 룰 #6에 따라 §6-1에서 확정 (마이그레이션+모델 PR / 피커 UI PR).
