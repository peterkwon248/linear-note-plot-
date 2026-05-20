# TODO

> 우선순위 기반 작업 목록. **P0 = 다음 세션 즉시 시작점** (NEXT-ACTION.md 폐지, 2026-05-12).
> 완료 항목은 즉시 삭제. 자세한 history는 SESSION-LOG.md + MEMORY.md.

**마지막 갱신**: 2026-05-21 — bars-first 3 라운드 refine 완성 (가로 스크롤 + sticky + 시각 효과 풍부화). **시각 검증 + 옵션 C (drag)**가 다음 P0.

---

## 🟣 P0 — 즉시 (cross-machine 진입점, 2026-05-21)

### 1. **🔴 bars-first timeline 시각 검증 + 사용자 OK 시 옵션 C (drag로 plannedDate)** (최우선)

이번 세션에 1+2+3 라운드 모두 적용 + squash merge 완료. **단 사용자 본인 viewport 시각 검증 미완** (after-work 우선 진행 신호로 머지). 다른 컴퓨터에서 가장 먼저 = 시각 검증.

**다음 스텝**:
1. `git pull origin main` + `npm install && npm run dev`
2. **dummy data 추가** — 본인 console에 paste (IDB 비어있으면 9 article + plannedDate 다양):
   ```js
   (() => { const s=window.__plotStore, t=Date.now(), d=(n)=>new Date(t+n*86400000).toISOString();
   const items=[["Q2 Strategy",3],["Summer Trip",7],["Tax Filing",14],["Annual Report",30],["Reading List",5],["Recipes",10],["Side Project",21],["Onboarding",45],["Quick Notes",null]];
   const ids=items.map(([title])=>s.getState().createWikiArticle({title}));
   items.forEach(([,p],i)=>{ if(p!==null) s.getState().setWikiArticlePlannedDate(ids[i],d(p)); });
   return s.getState().wikiArticles.length; })()
   ```
   검증 끝나면 Trash에서 9개 정리.
3. **Wiki → Timeline view mode** 진입 후 Week / Month / Quarter / Year 4 zoom 시각 확인:
   - tick label 안 겹치는지 (특히 Quarter/Year 가로 스크롤)
   - "Now" 라벨 vertical line 우측 5px offset 깨끗 분리
   - 가로 스크롤 시 좌측 article 라벨 column + 상단 axis header sticky 유지
   - Stub 막대 끝 hollow circle / Article 막대 끝 solid
   - 막대 hover → row 전체 highlight + stroke ring + 4-line tooltip
   - Weekend stripe (subtle dim) + Month boundary line (강조)
   - now line gradient (past 0.78 → future 1.0 부드러운 transition)
   - plannedDate horizon 막대 우측 끝 dashed vertical / updatedAt horizon은 solid
4. **시각 검증 결과**:
   - **OK** → 옵션 C (drag로 plannedDate 우측 끝 조정, dnd-kit ~150줄) 별도 PR
   - **NG** → 부족한 부분 fix 라운드 4

**참고 파일**:
- `components/views/wiki-timeline-view.tsx` (1067줄 — 너무 거대, sub-component 분리 후보)
- `lib/wiki-utils.ts` (`safeDate`, `horizonOf`, `getHorizonSource` 헬퍼)
- `lib/store/types.ts:438-441` + `lib/store/slices/wiki-articles.ts:241-258` (plannedDate action)
- `docs/02-design/features/timeline-planning.design.md` (bars-first 설계)

**위험**:
- `window.__plotStore` production 노출 여부 (`grep "__plotStore" lib/`) — dev-only 가드 확인
- wiki-list.tsx +84줄 Timeline 통합이 List/Board view 회귀 안 일으키는지

### 2. **🟡 옵션 C — drag로 plannedDate 우측 끝 조정** (시각 검증 OK 후)

- 막대 우측 끝 grab handle (cursor: `ew-resize`)
- dnd-kit `useDraggable` 또는 native pointer events
- onDragEnd → `setWikiArticlePlannedDate(id, newDate)`
- snap-to-day (pixel → date 변환)
- 새 worktree 권장 (분리 PR)

### 3. **🟡 Ontology graph node 사이드바 동기화** (사용자 의도 미확정)

- Graph node → 4탭 사이드바 (추천) / OntologyDetailPanel / 사이드바 graph mode

### 4. **🟡 Activity events 후속**

- Granular Wiki/Book events wire-up (block_added/item_added 등)
- Label entity events 발화 (tags.ts 패턴 정합)

### 5. **🟡 Books own Views section** (entity-uniformity, 영구 룰 #87 정합)

- `linear-sidebar.tsx` Books section에 own Views section. `SavedView.space "books"`는 이미 union에 있음.

### 6. **🟢 manual smoke 누적**

- 이번 세션: bars-first 3 라운드 (fresh dev 시각 검증 = P0 #1과 통합)
- 이전: PR #373-#391

---

## ✅ 최근 완료

- **2026-05-21**: bars-first timeline 3 라운드 refine 완성 — 막대 정보 컨테이너 + 가로 스크롤 + sticky + 시각 효과 풍부화 (Weekend stripe / Month boundary / hover affordance / Past-Future gradient / horizon source dashed). 단일 거대 PR, +1000/-506, 9 파일.
- **2026-05-20**: PR #391 (chore before-work) + PR #390 (timeline-planning Stage 1 dots, 미완) + PR #389 (gitignore) + PR #388 (docs sync) — 4 PR squash 머지.

---

## Parked / Brainstorm

- **기존 체크박스-todo → Inbox kind 이전 검토** — `lib/todo-index.ts`(노트 본문 체크박스 인덱스)를 독립 "Todos" 기능으로 키우지 말고, Inbox(attention 큐)에 새 `InboxItemKind "task"`로 추가. Home open-loops 통합. timeline-planning 완료 후.
- **wiki-timeline-view.tsx sub-component 분리** — 1067줄 단일 파일. `<TimelineAxis>` / `<TimelineBars>` / `<TimelineGrid>` / `<TimelineTooltip>` 4분할 후보. 옵션 C 후 권장.

---

## 영구 LOCKED 결정 (누적 #88, 후보 #89)

- 최근 (PR #387): #84-#88 — wiki-view-mode 직접 구독 / layout.tsx 정확 매핑 / Save view entity differentiate / Library = hub (view는 sub-entity) / Categories own view.
- 후보 (#89): **planning intent ≠ content activity** — `setWikiArticlePlannedDate`는 `updatedAt` 갱신 안 함. 다음 세션 사용자 OK 시 LOCKED.

전체 영구 룰 #1-#88: docs/MEMORY.md + docs/CONTEXT.md 참조.

---

## Deferred (당장 안 함)

- 다중 기기 sync (Supabase B + E2E + Yjs) — PRD 작성 완료, Phase 1 시작 준비. 사용자 시그널 대기.
- 편집 히스토리 v1 — multi-machine PRD 시점 권장.
- Ambox — Skip 권장 (사용자 시그널 시 재검토).
- SectionTemplate (그룹만 재사용) — MVP 후.
