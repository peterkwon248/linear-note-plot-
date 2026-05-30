# Linear Filter/Display Mirror — A1 추출 spec

> Track A (뷰 표면 리니어 정합)의 A1 산출물. 입력 = 리니어 실제 캡처 ~100장 (`Temp/linear-ref`).
> linear-design-mirror 스킬 Analyze 모드. **이 문서는 A2(tier/큐레이션)·A3(공유 크롬)·A4(priority/hover) 구현의 reference.**
> ⚠️ 픽셀 단위 정확값(행높이·패딩 px)은 스크린샷 측정치 = ~90%. 최종 1px 정합은 사용자 DevTools 캡처로 보강 예정(implementation-specs.md 'DevTools 캡처 대기' 항목).

---

## 1. 드롭다운/패널 chrome spec

### 1-A. "Add Filter" 드롭다운 (filter menu)
구조 (위→아래):
1. **검색 input** — placeholder "Add Filter…" + 우측 단축키 힌트 `F`. (항상 최상단, 타이핑 즉시 필터)
2. **특수 액션** (divider 그룹): `AI filter`, `Advanced filter`
3. **속성 필터** (divider 그룹): Status / Priority / Labels / … — 각 행 = `[아이콘 16px muted] [라벨] … [chevron ›]`. chevron = 서브메뉴 있음.
4. **프로젝트 그룹** (divider): Project / Project properties
5. **메타 그룹** (divider): Subscribers / External source / Content / Links / Template …

**서브메뉴** (속성 행 hover/클릭 시): 2차 팝오버 = 검색 "Filter…" + 옵션 리스트(각 옵션에 해당 아이콘 + 라벨, 일부 우측 카운트 "5 issues").

### 1-B. Display 패널
구조 (위→아래):
1. **뷰모드 세그먼트** — List / Board (/ Timeline) 토글 (상단, 큰 segmented control)
2. **그룹/정렬 행들** — `[라벨(좌, muted)] … [컨트롤(우): chip dropdown ▾ 또는 toggle]`
   - Grouping / Sub-grouping / Group order(서브그룹 시 들여쓰기) / Ordering / Order completed by recency(toggle) / Show sub-issues(toggle)
3. **List options** (섹션 헤더 = 작은 muted caps): Nested sub-issues, Show empty groups … (전부 toggle)
4. **Display properties** (섹션 헤더): pill chip 그리드 (active=채움/밝음, inactive=dim), 줄바꿈 허용
5. **푸터**: `Reset` · `Set default for everyone`

### 1-C. "균형 비결" (사용자가 지적한 폴리시 불균형의 해법)
리니어 드롭다운이 균형 잡힌 이유 = **5가지 규칙**:
1. **균일 행 높이** + **아이콘 컬럼 정렬** (모든 행의 아이콘이 같은 x, 16px, opacity~0.7)
2. **divider = 의미 그룹 경계만** (특수/속성/프로젝트/메타) — 무작위 X
3. **좌: 아이콘+라벨 / 우: chevron 또는 컨트롤** — 좌우 역할 고정
4. **검색 input 최상단** 항상
5. **opacity 계층** (라벨 0.9 / 아이콘 0.7 / 단축키힌트·카운트 0.5) — 색이 아닌 투명도로 위계

→ Plot 적용 시 체크: 행높이 일관? 아이콘 16px·정렬? divider가 의미 단위? 좌우 역할 고정? (현 filter-bar/filter-panel/display-panel 대조 필요 — A3)

### 폰트/토큰 (implementation-specs.md + 측정)
- 폰트: 본문 13px / 라벨 13px / 섹션헤더·카운트·힌트 ~11px / 행높이 ~32px
- 아이콘: 16px(filter/display 행), strokeWidth ~1.5, muted
- 모션: openDelay 짧게(~여느 메뉴), transition 150ms. (Plot 토큰: duration-150)
- 리니어 폰트=Inter/Inter Display → Plot=Geist (유지, 미러는 *치수/리듬* 위주)

---

## 2. 컨텍스트별 옵션 매트릭스 (★ tier 모델 검증)

리니어는 **표면마다 완전히 다른 필터·디스플레이 택소노미**를 줌. "통일된 하나"가 아니라 "엔티티에 맞는 각자".

| 표면 | Filter 옵션 | Display: 그룹/정렬 | List options | Display properties |
|---|---|---|---|---|
| **Issues** | Status, Status type, Assignee, Agent, Creator, **Priority**, Labels, Relations, Suggested label, Dates, Project, Subscribers, External, Content, Links, Template | Grouping, Sub-grouping, Group order, Ordering, Order completed by recency, Show sub-issues | Nested sub-issues, Show empty groups | ID, Status, Assignee, Priority, Project, Due date, Milestone, Labels, Links, Time in status, Created, Updated, PRs |
| **Projects** | Status, **Priority**, Labels, **Lead, Members, Health, Milestones, Initiatives**, Creator, Dates, Relations, Template, Title&summary, Specific project | Grouping, Ordering | **Show closed projects** | Milestones, Summary, Priority, Status, Health, Teams, Lead, Members, Dependencies, Start/Target date, Issues, Created, Updated, Completed, Labels |
| **Inbox** | **Notification type, From**, Project, Issue priority, Issue status type | Ordering(Newest) | **Show snoozed, Show read, Show unread first** | ID, Status and icon |
| **Views** | ≈ Issues (저장된 이슈 쿼리) | ≈ Issues | — | ≈ Issues (커스터마이즈) |

**관찰**:
- Inbox = 알림 중심, **5개로 극소** (Assignee/Labels/Dates 등 작업축 없음). list option도 알림 전용(snoozed/read).
- Projects = **Assignee 대신 Lead/Members, Health, Milestones, Initiatives** (프로젝트 고유축). Issues에 없는 것.
- Issues = 작업 축 풀세트.
- → **표면 = 자기 엔티티의 의미있는 축만.** 억지 통일 0.

### Plot tier 매핑 (이 매트릭스 근거)
| Tier | Plot 표면 | Filter/Display | Linear 근거 |
|---|---|---|---|
| **1 작업** | Notes, Wiki | 풀 (각자 축) | = Issues |
| **2 컬렉션** | Books | 중간 (kind/pinned/dates + 핵심 prop) | = Projects의 축소판 논리 |
| **3 참조 리스트** | Tags, Labels, Categories, Templates, Files, Stickers | **걷어냄** (정렬+검색만) | **리니어는 라벨/템플릿을 settings에서 관리 — 필터/디스플레이 패널 안 붙임** |

- Notes 필터축: Status, **Priority**, Labels, Folder, Tags, Dates, Content, Links (≈ Issues)
- Wiki 필터축: Status, Categories, Links, Reads, Aliases, Parent, Dates (priority 제외 — 지식 엔티티)
- Books 필터축: Kind, Pinned, Dates (+ Smart sources)
- **Priority 배치 결론** (A2 최종 확정, 2026-05-30 사용자 승인): Notes ✅ / **Wiki ✅** (둘 다 status축 보유 → priority 정당) / **Books = Kind + Priority** (status 없이 Kind가 board축, priority 보조 슬롯). ⚠️ A1 잠정안이던 "Wiki✖/Books✖(라인 아래 표)"는 **폐기** — 아래 §2 매트릭스/표가 옛 표기면 이 결론 우선.

---

## 3. Priority 막대 아이콘 (Linear) — SVG geometry

리니어 priority = **3-막대 오름차순 차트** + 2개 특수.

| 레벨 | 모양 | 색 |
|---|---|---|
| No priority | 가로 점선/3 dash `···` (dim) | muted |
| Low | 막대 3개 중 **1번째(가장 낮은)만** 채움, 2·3 dim | fg/muted |
| Medium | 1·2번째 채움, 3 dim | fg |
| High | 3개 **다** 채움 | fg |
| Urgent | **둥근 사각형(채움) + `!`** (막대 아님) | amber/orange |

**SVG 규칙** (16×16 기준, 막대형):
- 막대 3개, 좌→우, **높이 오름차순** (예: 6 / 9.5 / 13px), **폭 ~3px**, **간격 ~2px**, **radius ~1px**, 하단 정렬(baseline 공유)
- 채운 막대 = currentColor, 안 채운 = currentColor opacity ~0.35
- Urgent = `rect` 12×12 rounded(radius~3) fill + 흰/배경색 `!`(세로 바 + dot)
- No priority = 가로 dash 3개 (또는 dim 막대 3개) — 측정 후 택1

→ Plot 구현: `components/property-chips.tsx`의 PriorityBadge / PRIORITY_CONFIG(note-fields.tsx) 아이콘 교체. 현 화살표(ArrowUp/Right/Down) → 막대 SVG. **단 Plot priority enum = none/urgent/high/medium/low (5단계)** 이므로 low/medium/high 매핑 + urgent/none 유지.

---

---

## A2 확정 (LOCKED, 2026-05-30)

### 결정
1. **Tier — Library 유지 + 엔티티별 비례 컨트롤** (location 아닌 "의미축 수" 기준):
   - Tier1 풀: **Notes, Wiki**
   - Tier2 중간: **Books**
   - Library = **핵심 표면 그대로 유지** (settings 이동/삭제 X). 내부 엔티티별: Categories/Files=중간(필터1~2+핵심컬럼), Tags/Labels/Stickers/Templates=경량(검색+정렬+2~3컬럼). "걷어냄" = Issues급 heavy 패널 제거지 surface 제거 아님.
2. **Priority**: Notes ✅ / Wiki ✅ (둘 다 status축 보유 → priority 정당). Books = **Workflow 슬롯을 Kind로 채움 + Priority** (status 없음).
3. **Updated/Created**: 디스플레이 프로퍼티 토글(리스트/카드, 기본 흐리게/off) + 디테일바 항상.
4. **커스텀 상한 = L3 (Linear식)**: L1 표시토글 + L2 Saved Views + L3 값/옵션 커스텀(라벨·태그·폴더·카테고리 생성). **L4(사용자 필드타입 생성) = 안 함** (= FlowBase 몫, Plot 정체성 보존). **스키마는 개발자 큐레이션.**
5. **폰트**: ⏳ Geist 유지 vs Inter 교체 — A3 착수 시 결정 (100% 미러면 Inter).

### 구현 아키텍처 = schema-driven 엔진 (FlowBase 패턴 차용)
엔티티별 typed `PropertyDef[]`(위 6-카테고리) 하나에서 **filter / display / group / sort 자동 생성**. FlowBase의 `isFilterable` + 타입별 위젯 switch 이식 (`components/board/filter-menu.tsx`, `display-menu.tsx` 참조). → 표면 일관성이 **코드 레벨로 강제**(뒤죽박죽 근본 해결). 수작업 per-surface config 폐기.

### FlowBase에서 A3로 흡수할 패턴 (검증된 우위)
- **OKLCH/LCH 색 토큰** (Linear도 LCH 사용) — Plot `lib/colors.ts` flat hex → LCH 마이그 = "100% 리니어" 색 토대
- **paired `-bg`/`-fg` 시맨틱 토큰 + `toneClassDual()` 헬퍼** (라이트/다크 동시 방출, 다크 정합 구조적)
- **제네릭 `setViewOption(view, patch)`** — `setViewState` setter sprawl 제거
- **Saved Views 스냅샷 튜플 + recent filters 자동 메모리**
- 참조 파일: FlowBase `lib/tokens.ts`, `app/globals.css`, `DESIGN-TOKENS.md`, `lib/flowbase-store.ts`

---

## A3 분해 (다음 단계)
- **A3.1 토큰 마이그**: LCH/OKLCH + paired `-bg/-fg` + `toneClassDual` (foundation). 폰트 결정(Geist/Inter) 반영.
- **A3.2 스키마 정의**: 엔티티별 `PropertyDef[]`(6-카테고리) — Notes/Wiki/Books. schema-driven 엔진 기반.
- **A3.3 공유 크롬**: filter 드롭다운 + display 패널을 Linear 5규칙(균일행높이·아이콘정렬·의미divider·좌우역할·opacity위계)으로 재구축 + 스키마에서 생성.
→ 이후 A4(priority 막대 + hover 세로 패널) / A5(grid 잔여 + Tier3 heavy 패널 제거).
