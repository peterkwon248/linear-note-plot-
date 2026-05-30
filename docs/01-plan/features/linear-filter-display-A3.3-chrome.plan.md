# A3.3 공유 크롬 (Linear 5규칙) 구현 계획

> Track A / A3.3. **승인 완료(2026-05-30)** — architect 분석 기반.
> A3.2 스키마 엔진(main `693a31b`, PR #495) 위에서 `filter-panel`/`display-panel`을 Linear 5규칙 정합.
> 데이터 계약(스키마/어댑터)은 그대로, 두 렌더러의 구조·정렬·divider만 손봄.

## 사용자 결정 (3, 2026-05-30)
1. **필터 카테고리 순서 = 6-category 클러스터 재배열** (workflow→classification→relations→metrics→time→content). 의미 divider 위해. 의도된 visible 순서 변경.
2. **chrome 아이콘 16px** (Linear spec 실측, 현 14px→16). icons.tsx 전역 + 레거시 size.
3. **칩바 "+추가" 지금 일원화** (FilterButton 死코드 제거 + FilterPanel 스키마 기반).

## Linear 5규칙 gap (architect 진단)
| 규칙 | 상태 | gap |
|---|---|---|
| ① 행높이/아이콘 정렬 | ⚠️ | 행높이 OK / 아이콘 **고정폭 박스 부재** + 체크박스·아이콘 좌측 슬롯 x 불일치 |
| ② divider=의미그룹 | ❌ **핵심** | filter 패널 divider 전무. 원인 = **어댑터가 `category`를 FilterCategory로 미전파** |
| ③ 좌우 역할 | ✅ | 대체로 OK |
| ④ 검색 최상단 | ✅ | OK |
| ⑤ opacity 위계 | ⚠️ | 이산 2색(text-muted/foreground) → 0.9/0.7/0.5 사다리 없음. **A3.1 LCH 의존 → 뼈대만** |

## label 발산 판정 (architect)
- `links`(Links/Backlinks) · `updatedAt`(Dates/Updated) · wiki `title`(Aliases/Name): **정당한 컨텍스트 차이 = 유지**. A3.2가 per-surface override로 이미 처리.
- `status`/`folder` 중복 i18n 키(`filter.category.*` vs `display.property.*`): **통합 후보(보류)** — ko/ja 번역 파일 확인 후.
- wiki `wikiTier`(Hierarchy/Tier): 유지(약한 발산, Linear도 필터명≠그룹명 흔함).

## 구현 단계 (E1 → E2/E3)
- **E1 (데이터)** [진행중]: S1 `FilterCategory.category?` 필드 + 어댑터 전파 / S2 스키마 6-클러스터 재배열(filter 순서만, display/sort/group은 *Order로 보존) / 테스트 업데이트.
- **E2 (filter-panel, E1 의존)**: S3 divider 렌더(category 변경점, `showGroupHeader` 패턴 재사용) / S4 아이콘 **16px** + 고정폭 박스 + 좌측 슬롯(체크박스·아이콘) 통일 / S5 opacity 위계 **클래스 뼈대**(값은 A3.1). + `icons.tsx` 14→16 전역.
- **E3 (레거시 M5, 독립)**: S6 `FilterButton` 死코드 제거(+ labels/tags-view import) / 칩바 "+추가"(`FilterMenuItems` 하드코딩) → `FilterPanel` 스키마 기반 일원화. 6 뷰 배선(notes-table/board/grid-shell/timeline-shell, labels-view, tags-view). `FilterFieldContent`/`getFilterGroupKey` 死코드 여부 확정 후 제거. `formatFilterChip` 계열 + FilterChipBar 골격은 보존.
- (선택) S7: display grouping↔ordering divider 정합.

## A3.1 경계
A3.3 = **구조/정렬/divider/opacity 뼈대**까지. 색·opacity 최종값(0.9/0.7/0.5) = A3.1 LCH paired 토큰(`toneClassDual`/`-bg`/`-fg`). `text-foreground` 이산색이 LCH 토큰화 전이라 지금 하드 opacity 박으면 A3.1 재작업.

## 핵심 파일 (architect 실측)
- `components/filter-panel.tsx` — divider 부재(244-279), 아이콘 폭 미고정(256), opacity 이산색(195,262-264)
- `components/display-panel.tsx` — 의미 divider 이미 OK(202,375,425)
- `lib/view-engine/schema/adapter.ts` — `toFilterCategories`(74-92) category **미전파** = ② 핵심
- `lib/view-engine/schema/property-def.ts` — `PropertyCategory`(32-38), per-surface label 필드(105-135) 이미 존재
- `lib/view-engine/view-configs.tsx` — `FilterCategory` 타입(19-28, category 추가 지점), 3 엔티티 generated
- `components/filter-bar.tsx` — `FilterMenuItems`(291) / `FilterButton` 死코드(1127) / 칩바 "+추가"(1250)
- `components/view-header.tsx` — 카논 chrome 진입(filterContent 393 / displayContent 418)

## 검증
A3.3 = **의도적 visible 변경**(divider/순서/아이콘 ↑) → 동등성 아닌: tsc 0 + 테스트(순서·category 반영 후 green) + **preview eval**(DOM divider 존재/아이콘 16px) + **사용자 실화면**.

## 보류/주의
- status/folder i18n 키 통합 = ko/ja 번역(`lib/i18n`) 확인 후 별도.
- `linear-filter-display-schema-engine.plan.md`(A3.2 plan)는 실제 코드보다 뒤처짐(per-surface label 발산 구현 후) → **설계 시 코드 우선**.
