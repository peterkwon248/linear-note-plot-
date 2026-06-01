# Plot — 데이터 라이프사이클 감사 + 수정 (SPEC) 🔴 출시 전 필수

> 상태: **✅ 완료** (2026-06-01). PR1 삭제 cascade(#508) / PR2 re-seed 1회성 store v154(#509) / PR3 trash UI 좀비(#510) **전부 머지**. 출시 블로커(삭제 데이터 부활) 0. 남은 별도 = comments/folders soft-trash(PR4 후보, schema 변경) · migrate-v107 7개(기존 부채) · turbopack worktree build(`--webpack` 우회).
> 왜 중요: 상용화 = 삭제 정확성(완전 삭제 · orphan 0 · 데이터 부활 0) + 시드 위생. 신뢰 / 저장공간 / GDPR "잊혀질 권리"의 핵심.
> 사용자 강조: "노트뿐 아니라 위키·북도 정말 굉장히 많이 신경 써야 해. 시드데이터와 삭제 문제."

> ⚠️ **2026-06-01 감사 정정**: 아래 "확정 버그 #2(위키 blocks orphan)"는 **오류**였다. `deleteWikiArticle`은 실제로 block body+meta를 둘 다 정리한다 (감사 결과 섹션 참고). 대신 더 많은 진짜 구멍이 드러났다 — 아래 "## 🔬 전수 감사 결과" 참고.

---

## 🔴 확정된 버그 (이번 세션 실측 발견)

1. **re-seed = 삭제 데이터 부활 (전 엔티티)** — `lib/store/index.ts:319`:
   ```js
   // Force re-seed if notes are empty (user deleted all data)
   if (state.notes.length === 0) { state.notes = SEED_NOTES; state.wikiArticles = ...; state.books = ...; }
   ```
   → notes 비면 **notes/wiki/wikiCategories/folders/tags/labels/templates/books/smartBookPresets 전부 부활** + 북 독립 backfill(`:338`). **신규 유저 = 개발 데모 노출** + **유저가 다 지워도 데모 부활(빈 앱 불가)**.

2. **위키 blocks IDB orphan** — `lib/store/slices/wiki-articles.ts:188 deleteWikiArticle`가 `deleteArticleBlocks(articleId)` **미호출** → 위키 영구삭제해도 blocks가 `wiki-block-meta-store`(IDB)에 잔존. (노트는 `deleteNote`→`removeBody`로 정리하는데 위키는 누락 = 불완전 삭제 + 저장 누수.)

---

## 엔티티별 현황 (부분 실측 — 전수는 다음 세션)

| 엔티티 | soft-trash | 영구삭제 시 별도 IDB store 정리 | cascade |
|---|---|---|---|
| 노트 | ✅ | ✅ `deleteNote`→`removeBody`(notes.ts:176) | ✅ 풍부 |
| 위키 | ✅ `trashWikiArticle`(wiki-articles.ts:170) | 🔴 **`deleteArticleBlocks` 누락** | ⚠️ TBD |
| 북 | ✅ | n/a (items 객체 내부) | ⚠️ `entityEvents`만(reverse-ref 누락 가능) |
| 태그/라벨/스티커/폴더/레퍼런스/첨부/코멘트 | TBD | TBD | TBD |

(좋은 소식: trash 모델은 노트/위키/북 다 `trashed` soft-trash로 **통일됨** — 옛 "위키엔 trashed 없음" 주석은 stale.)

---

## ⚠️ 위험지대: "별도 IDB store"를 가진 엔티티 (영구삭제 시 같이 안 지우면 orphan)

| store | 파일 | 정리 함수 | 삭제 시 호출? |
|---|---|---|---|
| 노트 본문 | `lib/note-body-store.ts` | `deleteBody` (helpers `removeBody`) | ✅ (deleteNote:176) |
| 위키 blocks | `lib/wiki-block-meta-store.ts` | `deleteArticleBlocks` (helpers wrapper) | 🔴 **미호출** |
| mention 인덱스 | `lib/mention-index-store.ts` | `removeMentionsForNote` | ⚠️ 확인 필요(removeBody 경유?) |
| 첨부 | (attachments slice + IDB?) | `permanentlyDeleteAttachment` | TBD |

→ **이게 핵심 점검축.** Zustand persist 상태에서만 지우고 별도 IDB store를 안 지우면 "완전 삭제"가 거짓이 됨.

---

## 전수 감사 매트릭스 (다음 세션)

```
엔티티: notes · wiki · books · tags · labels · stickers · folders · references · attachments · comments · (templates/wiki-templates/smart-book-presets)
  ×
축: [① 시드/re-seed] [② soft-trash] [③ 영구삭제 완전성(array)] [④ 별도 IDB store 정리] [⑤ cascade/reverse-ref] [⑥ cross-entity 무결성]
```
각 칸을 ✅/🔴/⚠️로 채워 **구멍 목록** 확정.

---

## 수정 계획 (감사 후)

1. **re-seed 제거 + 1회성/dev-게이트**: "비면 재시드" 삭제 → `hasSeeded` persisted flag (or `NODE_ENV==='development'` / 설정 "데모 불러오기" 버튼). **신규 유저 = 빈 상태**(또는 웰컴 노트 1개 + empty-state UI). `:338` 북 backfill도 동일.
2. **영구삭제 시 별도 IDB store 정리 누락분 wire** (위키 blocks 최우선 + 첨부/mention).
3. **cascade 통일** (reverse-ref: 스티커 멤버십·북 items·relations 등).
4. **회귀 테스트**: 영구삭제 후 (a) array 비고 (b) IDB store도 비고 (c) re-seed 부활 안 하는지.

---

## 다음 액션 (다음 세션 첫 작업)

1. **전수 감사** — 위 매트릭스로 모든 엔티티의 시드/삭제 경로 점검 → 구멍 목록 확정. **엔티티 10+개 × 여러 store라 병렬 멀티에이전트 sweep(workflow) 권장**(exhaustive, fan-out).
2. **수정** (위 계획 1-4) + 회귀 테스트.

## 참고 파일 (file:line)
- `lib/store/index.ts:319,338` (re-seed) · `lib/store/seeds.ts` (시드 데이터)
- `lib/store/slices/notes.ts:133`(deleteNote)`,176`(removeBody) · `wiki-articles.ts:170`(trashWikiArticle)`,188`(deleteWikiArticle — deleteArticleBlocks 누락) · `books.ts:228`(permanentlyDeleteBook)
- `lib/store/helpers.ts:21,60` (removeBody/deleteArticleBlocks 래퍼)
- `lib/{note-body-store,wiki-block-meta-store,mention-index-store}.ts` (별도 IDB stores)
- `lib/store/types.ts` (permanentlyDelete* 액션 시그니처들)
