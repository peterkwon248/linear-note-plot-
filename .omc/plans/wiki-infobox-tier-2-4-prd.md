# PRD — Wiki Infobox Tier 2-4 본격 고도화

> **Scope**: TODO.md P0-2 명시 4 항목.
> **출처**: `docs/BRAINSTORM-2026-04-14-wiki-ultra.md` (기존 심화 리서치) + 2026-05-18 현재 코드 갭 분석.
> **목표**: 17 preset 기반 인포박스를 "사용자가 직접 늘리고 재활용할 수 있는 살아있는 시스템"으로 확장.
>
> **Out of Scope** (다음 Phase 후보):
> - Hatnote / Ambox 자동 배너 / themeColor 시스템 / 편집 히스토리 (BRAINSTORM Top 7 중 본 PRD 외)
> - subgroup hierarchy (1-level group-header로 충분, over-engineering 회피)

---

## 0. Context

### 현재 구현 상태 (2026-05-18)

| 영역 | 상태 |
|---|---|
| 17 preset (Person/Place/School/Animal/Software/Food/Vehicle/Sport-team 포함) | ✅ |
| 1-level group-header collapse (`type: "group-header"` + localStorage 지속) | ✅ |
| Per-preset header color (rgba 0.65) | ✅ |
| Dropdown portal + viewport flip (PR #359) | ✅ |
| WikiInfobox `kind: "note" \| "wiki"` prop 분기 (BRAINSTORM 선행 0.1 fix) | ✅ |
| Preset switching: 2-way (keep all / clear all) | 🟡 부족 |
| Hero image + caption | ❌ |
| 사용자 커스텀 preset 저장 | ❌ |
| Preset switching 시 값 보존 | ❌ |

### 데이터 모델 (현재)

```typescript
// lib/types.ts:18
interface WikiInfoboxEntry {
  type?: "field" | "group-header"
  key: string
  value: string
  color?: string | null        // group-header bg
  defaultCollapsed?: boolean
}

// lib/types.ts:38
type WikiInfoboxPreset =
  | "custom" | "person" | "character" | "place" | "organization"
  | "work-film" | "work-book" | "work-music" | "work-game"
  | "event" | "concept"
  | "school" | "animal" | "software" | "food" | "vehicle" | "sport-team"

WikiArticle.infobox: WikiInfoboxEntry[]
WikiArticle.infoboxHeaderColor?: string | null
WikiArticle.infoboxPreset?: WikiInfoboxPreset

Note.wikiInfobox: WikiInfoboxEntry[]  // (preset 없음 — Note는 free-form)

WikiTemplate.infobox: WikiInfoboxEntry[]
WikiTemplate.infoboxPreset?: WikiInfoboxPreset
WikiTemplate.infoboxHeaderColor?: string | null
```

---

## 1. 작업 항목 4개 (TODO P0-2 명시)

### Phase 1 — Preset switching partial preserve ⭐ 우선

**문제**: 현재 `wiki-infobox.tsx` AlertDialog 2-way:
- A. Cancel (현재 preset 유지)
- B. Switch + clear all (사용자 데이터 손실)

**개선**: 3-way 옵션
- A. **Cancel** (현재 preset 유지)
- B. **Switch + preserve matching keys** (자동 매핑 — 같은 key는 value 유지, 새 key는 빈 값, 사라진 key는 drop)
- C. **Switch + clear all** (기존 동작 보존)

**구현 핵심**:
- `lib/wiki-infobox-presets.ts`에 helper 추가:
  ```ts
  export function mergePresetWithExisting(
    newPreset: WikiInfoboxPreset,
    existingEntries: WikiInfoboxEntry[],
  ): WikiInfoboxEntry[] {
    const seed = clonePresetEntries(newPreset)
    const valueByKey = new Map(
      existingEntries
        .filter((e) => e.type !== "group-header" && (e.value ?? "").trim() !== "")
        .map((e) => [e.key, e.value]),
    )
    return seed.map((s) =>
      s.type === "group-header" || !valueByKey.has(s.key)
        ? s
        : { ...s, value: valueByKey.get(s.key)! },
    )
  }
  ```
- `wiki-infobox.tsx` AlertDialog 3 버튼 (Cancel / Preserve / Clear)
- Dialog description 개선: "기존 데이터 N개 중 K개가 새 preset과 일치 — 보존 가능"

**파일 변경**: ~2 파일
- `lib/wiki-infobox-presets.ts` (helper 추가)
- `components/editor/wiki-infobox.tsx` (AlertDialog 3 버튼 + handler)

**위험**: 낮음. 데이터 모델 변경 없음, 기존 동작 그대로 보존 (C 옵션).

**검증**: Person preset에 fullname/born 채움 → School preset switch → "1개 일치" 확인 → Preserve 선택 → fullname → "Founded" empty + 기존 값 drop.

---

### Phase 2 — preset별 fields 풍부화 + 그룹핑 polish

**범위**: 기존 17 preset의 fields 풍부화. 1-level group-header 유지 (subgroup 도입 X).

**예시 (Person)**:
```ts
// 현재 9 fields → 15 fields
{
  preset: "person",
  defaultEntries: [
    field("Full name"), field("Born"), field("Died"), field("Nationality"), field("Occupation"),
    groupHeader("Career", { defaultCollapsed: false }),
    field("Notable work"), field("Active period"), field("Employer"), field("Awards"),
    groupHeader("Personal", { defaultCollapsed: true }),
    field("Education"), field("Spouse"), field("Children"), field("Parents"),
    groupHeader("Online", { defaultCollapsed: true }),
    field("Website"),
  ],
}
```

**대상 preset 목록 + 추가 그룹 (제안)**:
| Preset | 현재 | 추가 그룹 | 신규 fields |
|---|---|---|---|
| Person | 9 | Career / Personal / Online | Died, Employer, Awards, Spouse, Children, Parents |
| Place | 8 | Geography / Government | Time zone, Elevation, Climate, Mayor, Demonyms |
| Organization | 9 | Business / Online | Revenue, Subsidiaries, Stock symbol |
| Software | 9 | Technical / Distribution | Operating systems, Languages supported, Size |
| Animal | 9 | Taxonomy / Behavior | Order, Genus, Gestation, Population trend |
| 그 외 12개 | … | … | (별도 검토 — 사용자 review 후 결정) |

**구현**: `lib/wiki-infobox-presets.ts` 한 파일 수정. 데이터 모델 변경 0.

**파일 변경**: 1 파일 (presets.ts)

**위험**: 0. 기존 사용자 데이터 무관 (entries는 user state, preset definition은 seed만).

**검증**: 새 article 생성 → Person preset → 15 fields + 3 그룹 표시 확인.

---

### Phase 3 — Hero Image + Caption

**데이터 모델 결정 (3 옵션 트레이드오프)**:

| 옵션 | 설명 | 장점 | 단점 |
|---|---|---|---|
| **A** | `WikiInfoboxEntry`에 `type: "hero"` variant 추가 | entries 구조 단일, position 자유 | hero가 여러 개 가능 (제한 필요), value 외 url/caption/alt 필드 충돌 |
| **B** ⭐ | 별도 필드 `WikiArticle.infoboxHero?: {url, caption?, alt?}` | 의미 명확, entries 구조 안 건드림, 1개 제한 자연 | 신규 필드 3곳 (Note/WikiArticle/WikiTemplate) |
| C | preset metadata에 hero 포함 (`preset.heroDefault`) | preset 본질 강화 | 사용자 임의 변경 불가 |

**결정**: **옵션 B** — 의미 명확 + 1개 제한 + persist migration 깔끔.

**신규 타입**:
```typescript
interface InfoboxHero {
  url: string
  caption?: string
  alt?: string
}

WikiArticle.infoboxHero?: InfoboxHero
Note.wikiInfoboxHero?: InfoboxHero
WikiTemplate.infoboxHero?: InfoboxHero
```

**Store setters**:
- `setWikiArticleInfoboxHero(articleId, hero | null)`
- `setWikiInfoboxHero(noteId, hero | null)` (note용)
- `setWikiTemplateInfoboxHero(templateId, hero | null)` (template용)

**UI (`wiki-infobox.tsx`)**:
- 인포박스 최상단 `<figure>` slot
- 없을 때: 호버 시 "+ Add hero image" placeholder (editable=true 한정)
- 있을 때: img + italic caption + edit/remove 호버 액션
- Click "+" → ImagePickerDialog (URL input + 향후 file upload 확장 여지)

**Migration**: v139 → v140 (default `undefined`, 사용자 데이터 보존)

**파일 변경**: ~7 파일
- `lib/types.ts` (InfoboxHero type + 3 entity에 optional 필드)
- `lib/store/types.ts` (3 setter signature)
- `lib/store/slices/notes.ts` (setter)
- `lib/store/slices/wiki-articles.ts` (setter)
- `lib/store/slices/wiki-templates.ts` (setter)
- `lib/store/migrate.ts` (v140 entry)
- `lib/store/index.ts` (persist version)
- `components/editor/wiki-infobox.tsx` (hero render + edit UI)
- 신규 `components/editor/infobox-hero-picker.tsx` (URL + caption + alt input dialog)

**위험**: 중. 신규 필드 3곳. Migration 사용자 데이터 영향 0 (default undefined).

**검증**:
- Person article에 hero URL https://example.com/img.jpg + caption "Albert Einstein, 1921" → 인포박스 최상단 figure 렌더
- Encyclopedia 레이아웃에서 동일 렌더 확인
- Remove 후 다시 add → state 정상

---

### Phase 4 — Save as preset (사용자 커스텀 preset)

**범위**: 17 hardcoded preset 외 사용자 자유 정의. 인포박스 footer "Save as preset…" → 다이얼로그.

**데이터 모델**:
```typescript
interface UserInfoboxPreset {
  id: string                   // genId(), e.g. "user-preset-1"
  label: string                // "내 영화 인포박스"
  hint?: string                // "한국 영화용 커스텀"
  defaultHeaderColor: string | null
  defaultEntries: WikiInfoboxEntry[]
  createdAt: number
  updatedAt: number
}

// 신규 slice
interface WikiInfoboxPresetsState {
  userPresets: UserInfoboxPreset[]
}
```

**Type 확장**:
```typescript
// lib/types.ts
// 옵션: hardcoded union + string으로 확장
type WikiInfoboxPreset = WikiInfoboxBuiltinPreset | string
// 또는 union 그대로 유지하고 UserPresetId 별도 ("user:<id>" 접두사 패턴)
```

**결정**: **`type WikiInfoboxPreset = string`** + `WikiInfoboxBuiltinPreset` (현재 enum)을 별도 export. lookup helper가 builtin과 user를 통합 처리.

**Lookup helper 통합** (`lib/wiki-infobox-presets.ts`):
```ts
export function getPresetDefinitionUnified(
  preset: string | undefined,
  userPresets: UserInfoboxPreset[],
): PresetDefinition {
  // 1. builtin lookup
  const builtin = BY_KEY.get(preset as WikiInfoboxBuiltinPreset)
  if (builtin) return builtin
  // 2. user lookup
  const user = userPresets.find((p) => p.id === preset)
  if (user) return userPresetToDefinition(user)
  // 3. fallback
  return BY_KEY.get("custom")!
}
```

**UI 추가**:
- 인포박스 footer 새 액션: "Save as preset…" (editable=true 한정)
- Dialog: label input + hint input (optional) + preview ("8 fields, 2 groups")
- Preset dropdown 섹션 분리:
  - **Built-in** (17개, 현재 정렬)
  - **My Presets** (userPresets, edit/delete 아이콘)
- User preset 우클릭 또는 hover: Edit (label/hint 변경) + Delete (used by N articles 경고)

**Migration**: v140 → v141 (`userPresets: []` 초기화)

**파일 변경**: ~10 파일
- `lib/types.ts` (UserInfoboxPreset + WikiInfoboxPreset 확장)
- `lib/wiki-infobox-presets.ts` (getPresetDefinitionUnified + userPresetToDefinition)
- 신규 `lib/store/slices/wiki-infobox-presets.ts` (slice)
- `lib/store/types.ts` (slice type)
- `lib/store/index.ts` (slice merge + persist version)
- `lib/store/migrate.ts` (v141)
- 신규 `components/editor/save-preset-dialog.tsx` (Save dialog)
- 신규 `components/editor/edit-preset-dialog.tsx` (Edit dialog, 선택)
- `components/editor/wiki-infobox.tsx` (footer menu + dropdown 섹션 분리)
- `lib/store/slices/wiki-articles.ts` + `wiki-templates.ts` (preset string type 호환)
- 신규 onRehydrateStorage defense (PR #358 패턴 정합 — userPresets `[]` 강제)

**위험**: 높음. 데이터 모델 확장 + 신규 slice + type union → string 변경.

**완화**:
- WikiInfoboxBuiltinPreset enum 그대로 유지 (compile-time switch에 사용)
- WikiInfoboxPreset = string으로 union 확장 (runtime lookup용)
- Wiki Template / WikiArticle.infoboxPreset 필드는 string 그대로 (builtin id 또는 user id)
- Migration v141은 default `[]` (사용자 데이터 보존)

**검증**:
- Person preset 1개 수정 (fields 추가) → "Save as preset" → label "내 인물 v2" → 저장
- Dropdown에 "My Presets" 섹션에 표시
- 새 article 생성 → My Presets > 내 인물 v2 선택 → fields 복원
- Delete → "1 article uses this preset, 어떻게?" warning → confirm → delete + 사용처는 entries 보존 (preset만 null 또는 "custom"으로 fallback)

---

## 2. 구현 순서 + PR 분리

### 추천 순서 (위험 낮은 → 높은)

| PR | Phase | 파일 수 | Migration | 위험 | 즉시 가치 |
|---|---|---|---|---|---|
| **PR-A** | **Phase 1** preserve switching | ~2 | X | 낮음 | 즉시 (사용자 데이터 보호) |
| **PR-B** | **Phase 2** preset fields 확장 | 1 | X | 0 | 즉시 (UX 풍부) |
| **PR-C** | **Phase 3** Hero image | ~7 | v140 | 중 | 즉시 (가장 시각적) |
| **PR-D** | **Phase 4** Save as preset | ~10 | v141 | 높음 | 장기 (재사용성) |

### 각 PR 독립 가능 여부

- PR-A: 독립 (현재 코드만 수정)
- PR-B: 독립 (presets.ts 한 파일)
- PR-C: 독립 (신규 필드, 기존 entries 무관)
- PR-D: PR-A에 의존 안 함, PR-C에 의존 안 함 (preset 자체 시스템). 단 PR-C 완료 시 user preset도 hero image 저장 가능 (자연 통합).

순차 진행 권장. 단 PR-A + PR-B는 작아서 한 PR로 묶어도 됨 ("PR-AB").

---

## 3. 사용자 review 필요 항목

1. **Phase 2 preset별 추가 그룹/fields** — 위 예시 (Person 6 추가 / Place 5 추가 등) 적절한가? 17 preset 전부 review 필요 시 별도 PR로 분리?
2. **Phase 3 Hero Image 데이터 모델 옵션 B 동의?** — `WikiArticle.infoboxHero?: {url, caption?, alt?}` 별도 필드.
3. **Phase 4 Save as preset 범위** — Edit dialog 포함? (옵션) 또는 Save + Delete만 (MVP)? sharing 메커니즘 (export/import)?
4. **순서 OK?** — PR-A (preserve) → PR-B (fields) → PR-C (hero) → PR-D (save). 또는 사용자 우선순위 다름?
5. **PR-A + PR-B 묶을지** — 둘 다 작아서 단일 PR도 합리적.

---

## 4. 검증 + 영구 결정 후보

### 검증 체크리스트 (각 PR 머지 전)

- [ ] `npm run build` + `tsc --noEmit` 통과
- [ ] Existing wiki article 1개 (Person preset) → 정상 렌더
- [ ] Encyclopedia 레이아웃에서 동일 렌더 (kind="wiki" 분기 작동)
- [ ] Note 인포박스 (kind="note") 정상 작동 — preset/hero 분기 적절
- [ ] Migration log 출력 확인 (`[migrate] v{n-1}→v{n}`)
- [ ] Hard refresh 후 데이터 유지

### 영구 결정 후보 (PR 머지 후 MEMORY.md LOCKED)

- **#64. Preset switching 3-way (Cancel / Preserve / Clear)**: 데이터 보호 우선, 명시적 동의 (영구 룰).
- **#65. Hero image = 별도 필드 (entries 외)**: 의미 명확 + 1개 제한 자연. 향후 다른 visual asset (banner image 등)도 동일 패턴.
- **#66. UserInfoboxPreset = string id (builtin과 통합)**: hardcoded enum + dynamic id 둘 다 string. lookup helper가 통합 처리.
- **#67. onRehydrateStorage Array defense 패턴**: Phase 4 userPresets도 PR #358 wikiTemplates 패턴 정합 — `Array.isArray` check + 빈 array 강제.

---

## 5. Out of Scope (다음 Phase 후보)

본 PRD에 포함 안 됨. 별도 PRD 또는 P1로 보관:

- **BRAINSTORM #1 Hatnote** — 상위/하위/다른뜻/Main/See-also 배너
- **BRAINSTORM #2 Ambox 자동 배너** — Stub/Orphan/Unsourced 5색 severity
- **BRAINSTORM #4 themeColor 시스템** — `{light, dark}` CSS variable cascade
- **BRAINSTORM #6 편집 히스토리 v1** — WikiArticle.history[] + 편집 요약
- **Subgroup hierarchy** — 인포박스 내부 3-level (현재 1-level group-header로 충분)
- **Preset import/export** — JSON 파일로 공유 (Phase 4 후속)
- **Hero image 다중 (gallery)** — 1개 제한 유지 (사용자 요청 시 별도 검토)

---

## 6. 참고 파일

### 현재 구현
- `lib/types.ts:18, 38, 374, 401-405, 514, 738-740` — Infobox type 정의
- `lib/wiki-infobox-presets.ts` — 17 preset registry
- `lib/wiki-infobox-collapse.ts` — group-header localStorage
- `components/editor/wiki-infobox.tsx` — React 렌더
- `components/editor/infobox-color-picker.tsx` — 색 picker
- `components/editor/infobox-value-renderer.tsx` — value 렌더
- `components/editor/nodes/infobox-node.tsx` — TipTap 노드 (별도 구현체)

### Store
- `lib/store/slices/notes.ts:467` — `setWikiInfobox`
- `lib/store/slices/wiki-articles.ts` — `setWikiArticleInfobox`
- `lib/store/slices/wiki-templates.ts` — wikiTemplate infobox setters
- `lib/store/migrate.ts` — version migrations
- `lib/store/index.ts` — persist version

### Documentation
- `docs/BRAINSTORM-2026-04-14-wiki-ultra.md` — 본 PRD의 base
- `docs/BRAINSTORM-2026-04-06.md` — 원본 나무위키 리서치
- `docs/MEMORY.md:3414-3420` — Tier 2-4 완료 항목 (기존)
- `docs/CONTEXT.md:2181-2196` — P2 Tier 1-4 정의
- `docs/TODO.md:78-87` — P0-2 4 항목 명시

---

**다음 액션**: 사용자 review (위 Section 3 항목 1-5) → 합의 후 PR-A부터 시작.
