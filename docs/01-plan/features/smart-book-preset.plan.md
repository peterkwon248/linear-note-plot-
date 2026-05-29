# Smart Book Preset 시스템 + Books More + Books Insights

> **Books More를 Notes/Wiki와 정합** (Pinned/Views/Folders/**More**/Recent). More = **Smart Book**(=Templates의 Books판) + **Insights**.
> 사용자 승인 (2026-05-29): "스마트 북도 본격적으로 구축." 엔진(AutoSource/resolver/sources-section/getBookKind)은 이미 존재 → 갭 = **Preset 시스템**(소스 조합 청사진 저장→적용) + Books More 섹션 + Books Insights.

## 0. 메타
- store version: **v151 → v152** (smartBookPresets slice 추가)
- 브랜치: `claude/smart-book-preset` (PR #490 위키 작업 위 체크포인트 a259061 기반)
- 기존 인프라 재사용: `AutoSource{kind,refId}`(types.ts:185), `lib/books/resolver.ts`(5-kind), `components/books/sources-section.tsx`(소스 picker UI), `getBookKind`(use-books-view), `createBook`/`updateBook`/`addSmartSource`(books slice).

## 1. Smart Book Preset = "Templates의 Books판"
| | Notes | Wiki | Books |
|---|---|---|---|
| More 1번 | Templates (NoteTemplate) | Templates (WikiTemplate) | **Smart Book (SmartBookPreset)** |
| More 2번 | Insights | Insights | **Insights** |

Preset = **재사용 가능한 소스 조합 청사진**. "적용" → 그 소스들로 새 smart book 생성. (예: "받은 노트함" = inbox folder source / "최근 위키" = category source / "태그 모음" = tag source.)

## 2. 데이터 모델 (lib/types.ts) — NoteTemplate 정합
```ts
export interface SmartBookPreset {
  id: string
  name: string
  description?: string
  sources: AutoSource[]        // 청사진 (folder/category/tag/label/sticker)
  pinned: boolean
  trashed?: boolean
  trashedAt?: string | null
  createdAt: string
  updatedAt: string
}
```

## 3. 스토어 (lib/store/slices/smart-book-presets.ts 신규)
- CRUD: `createSmartBookPreset(partial)` / `updateSmartBookPreset(id, patch)` / `deleteSmartBookPreset(id)`(soft) / `restoreSmartBookPreset(id)`.
- **`applySmartBookPreset(presetId): string`** = `const id = createBook(preset.name); updateBook(id, { smartSources: [...preset.sources] }); return id` → 새 smart book id. 호출처가 navigate.
- `lib/store/index.ts` version 152 + slice mount + partialize 포함.
- `lib/store/migrate.ts` v152: `state.smartBookPresets ??= []` (+ onRehydrate defense array 보장, wikiTemplates 패턴).
- `lib/store/seeds.ts`: `SEED_SMART_BOOK_PRESETS` 2~3개 (기존 seed folder/tag/category id 사용 — 유효 refId. 예: tag "Knowledge Management" source).

## 4. 갤러리 뷰 (components/views/smart-book-presets-view.tsx 신규)
- `templates-view.tsx` 패턴 미러: preset 카드 그리드 + 생성/편집 + 빈 상태.
- 생성/편집: name + description + **소스 picker**(sources-section.tsx의 picker 재사용/추출 — folder/category/tag/label/sticker 선택).
- 카드 액션: **"적용"**(applySmartBookPreset → openBook(newId) + /books/{id} 이동) / 편집 / 삭제 / pin.
- 라우트 `app/(app)/books/smart-books/page.tsx` + `table-route.ts` VIEW_ROUTES + inferSpace→"books" + `layout.tsx` keep-alive mount.

## 5. Books More 섹션 (components/linear-sidebar.tsx, books context)
- 현재 Books = Pinned/Views/Folders/Recent (More 없음). **Folders 다음에 More `<Section>` 신설** (wiki More 패턴):
  - "Smart Book" NavLink → `/books/smart-books` (count = presets.length). 아이콘 = smart 글리프(⚡/IconSmartBook 류).
  - "Insights" NavLink → `/books/insights` (IconInsight + sidebar.insights).
- 순서: Pinned → Views → Folders → **More(Smart Book, Insights)** → Recent. (Notes/Wiki 정합.)

## 6. Books Insights (components/views/books-insights-view.tsx + /books/insights)
- wiki-insights-view.tsx 패턴 미러 (ViewHeader + 섹션 카드 + 차트).
- 내용 (북은 status 없음 → **kind 축**): kind breakdown(Smart⚡/Manual✏️/Hybrid✨ count, getBookKind) + 총 책·총 항목 수 + smart-source 건강도(소스 있는 책 수, 평균 소스 수) + reading progress(lastReadItemId 있는 책 수). 차트는 단순 (recharts, ResizeObserver — ResponsiveContainer 금지).
- 라우트 등록(table-route + layout mount, /wiki/insights 패턴 동일).

## 7. i18n (lib/i18n.ts)
- `sidebar.smartBook`("Smart Book"/"스마트 북"), preset 뷰 라벨(생성/적용/소스/빈 상태), books insights 섹션 라벨. EN+KO.

## 8. Must / Must NOT
**Must**: SmartBookPreset 모델+slice+v152 migrate(array 보장)+seeds · 갤러리 뷰+라우트 · Books More(Notes/Wiki 정합) · Books Insights · createBook/updateBook 재사용(merge/split backend처럼 엔진 재사용) · build green/tsc 0/test pass
**Must NOT**: 기존 smart-source 엔진(resolver/sources-section) 재구현 · 북에 status 도입 · 위키/노트 사이드바 변경 · 무관 리팩터

## 9. Success
- [x] Books 사이드바 = Pinned/Views/Folders/More(Smart Book·Insights)/Recent (Notes/Wiki 정합)
- [x] `/books/smart-books` 갤러리: preset 생성(소스 조합)→적용→새 smart book 생성·열림
- [x] `/books/insights` kind breakdown + 메트릭
- [x] build green (Compiled successfully) · tsc --noEmit exit 0 · test 282 pass / 11 pre-existing fail (新 failure 0)
- [ ] Architect APPROVED · preview 런타임 검증 (다음 단계)

## 10. 검증 게이트
`npm run build`(authoritative) + `tsc --noEmit` + `npm run test`(pre-existing 11 제외) + Architect + preview.
