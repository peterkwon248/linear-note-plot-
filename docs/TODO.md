# TODO

> 우선순위 기반 작업 목록. **P0 = 다음 세션 즉시 시작점** (NEXT-ACTION.md 폐지, 2026-05-12).
> 완료 항목은 즉시 삭제. 자세한 history는 SESSION-LOG.md + MEMORY.md.

**마지막 갱신**: 2026-05-21 (저녁) — timeline 옵션 C drag + event marker chips (Phosphor) + Reticle polish 적용. 사용자 평 "아직은 아쉬운데" → **시각 polish 마무리**가 다음 P0.

---

## 🟣 P0 — 즉시 (cross-machine 진입점, 2026-05-21 저녁)

### 1. **🔴 timeline 시각 추가 polish (사용자 평 "아직은 아쉬운데" 의 후속)** (최우선)

이번 세션에 옵션 C + 마커 chip + Reticle-feel polish 적용했으나 사용자 평 "아직 아쉬운데". 본인 viewport 시각 검증 + 부족분 추가 polish 라운드.

**다음 스텝**:
1. `git pull origin main` + `npm install && npm run dev` (port 3002)
2. **dummy data 추가** — 본인 console에 paste (IDB 비어있으면 6 article + 다양한 이벤트):
   ```js
   (() => { const s=window.__plotStore, now=Date.now(), d=(o)=>new Date(now+o*86400000).toISOString();
   const articles=[["Q2 Strategy",-28,7,[-20,-10,-3]],["Summer Trip",-21,14,[-15,-7]],["Tax Filing",-14,21,[-12,-8,-5,-2]],["Annual Report",-10,null,[-6,-1]],["Recipes",-7,null,[-4]],["Side Project",-3,5,[-1,0]]];
   const ids=articles.map(([t])=>s.getState().createWikiArticle({title:t}));
   s.setState(state=>{
     const u=new Map(ids.map((id,i)=>[id,articles[i]]));
     const newA=state.wikiArticles.map(a=>{const c=u.get(a.id); if(!c)return a; return {...a,createdAt:d(c[1]),updatedAt:d(c[3].at(-1)??c[1]),plannedDate:c[2]!==null?d(c[2]):undefined};});
     const f=state.entityEvents.filter(e=>!ids.includes(e.entity.id));
     let eid=900000; const ne=[];
     ids.forEach((id,i)=>{const [,cr,,ups]=articles[i];
       ne.push({id:`s-${eid++}`,entity:{kind:"wiki",id},type:"created",at:d(cr)});
       ups.forEach(o=>ne.push({id:`s-${eid++}`,entity:{kind:"wiki",id},type:"updated",at:d(o)}));
       ne.push({id:`s-${eid++}`,entity:{kind:"wiki",id},type:"opened",at:d(cr+1)});
       if(i%2===0) ne.push({id:`s-${eid++}`,entity:{kind:"wiki",id},type:"link_added",at:d(cr+2)});
       if(i%3===0) ne.push({id:`s-${eid++}`,entity:{kind:"wiki",id},type:"block_added",at:d(ups[0]??cr)});
       if(i===1) ne.push({id:`s-${eid++}`,entity:{kind:"wiki",id},type:"attachment_added",at:d(cr+3)});
       if(i===3) ne.push({id:`s-${eid++}`,entity:{kind:"wiki",id},type:"relation_added",at:d(ups[0]??cr)});
     });
     return {wikiArticles:newA, entityEvents:[...f,...ne]};
   });
   return `seeded ${ids.length}`;})()
   ```
3. **Wiki Overview → "View all N articles" → Timeline view** → toggles.showStubs ON → Month zoom
4. **시각 검증 포인트**:
   - chip (14px ring + Phosphor 흰 아이콘) 시인성 — created/updated/opened/link/block/relation/attachment 각각 즉시 식별?
   - 막대 drop-shadow + vertical highlight 입체감
   - Now anchor (top dot + label fontWeight 700)
   - Today 컬럼 subtle tint
   - Axis month-start tick bold 위계
   - drag 동작: 막대 우측 끝 hover → ew-resize → drag → 실시간 확장 + dashed cap + live tooltip → drop 후 plannedDate 저장
5. **사용자 평 결과**:
   - **OK** → 다음 작업 (P0 #2~ 진행)
   - **아직 아쉬움** → 추가 polish 후보 a-e (사용자 우선순위 청취):
     - (a) 막대 typography 키움 (title 폰트 11→12, weight 500→600)
     - (b) Now line glow filter 추가 (`feGaussianBlur` 결합)
     - (c) chip border `var(--background)` ring 1px 추가 (어떤 bg에서도 contrast)
     - (d) axis tick "May 18" 같은 long label collision 강화 (특히 Quarter/Year zoom)
     - (e) 사이드 panel처럼 selected article의 이벤트 list separate panel

**참고 파일**:
- `components/views/wiki-timeline-view.tsx` (1500+줄 — 너무 거대, sub-component 분리 후보 / P0 #6)
- `lib/wiki-utils.ts` (safeDate / horizonOf / getHorizonSource)
- `lib/store/slices/wiki-articles.ts:241-258` (`setWikiArticlePlannedDate` action)
- `lib/datalog/helpers.ts:20` (`getEventsForEntity`)
- `lib/types.ts:893-961` (`EntityEvent` / `EntityEventType` 정의)

**위험**:
- `window.__plotStore` production 노출 여부 (`grep "__plotStore" lib/`) — 이전 세션부터 미해결, dev-only 가드 확인
- `showStubs OFF` (기본) → 신규 article 안 보임 → toggle 안내 필요

### 2. **🟡 Ontology graph node 사이드바 동기화** (사용자 의도 미확정)

- Graph node → 4탭 사이드바 (추천) / OntologyDetailPanel / 사이드바 graph mode

### 3. **🟡 Activity events 후속**

- Granular Wiki/Book events wire-up (block_added/item_added 등) — 현재 timeline marker chip 이 wire-up 완료 시 자동 풍부해짐 (#90 chip 패턴은 unknown type fallback 보유)
- Label entity events 발화 (tags.ts 패턴 정합)
- `opened` 이벤트 emit (현재 wiki article은 미emit, 시드로만 표현 가능)

### 4. **🟡 Books own Views section** (entity-uniformity, 영구 룰 #87 정합)

- `linear-sidebar.tsx` Books section에 own Views section. `SavedView.space "books"`는 이미 union에 있음.

### 5. **🟢 manual smoke 누적**

- 이번 세션: 옵션 C drag + 마커 chip + Reticle polish (fresh dev 시각 검증 = P0 #1과 통합)
- 이전: PR #392 (bars-first 3 라운드) + PR #373-#391

### 6. **🟢 wiki-timeline-view.tsx sub-component 분리** (시각 polish 완료 후)

- 1500+ 줄 단일 파일. `<TimelineAxis>` / `<TimelineBars>` / `<TimelineEventMarkers>` / `<TimelineTooltip>` / `<TimelineGrid>` 5분할 후보. 별도 리팩토링 PR.

---

## ✅ 최근 완료

- **2026-05-21 (저녁)**: timeline 옵션 C drag + event marker chips (Phosphor icon inline + filled ring) + Reticle-feel polish — 단일 거대 PR (1 파일 `wiki-timeline-view.tsx`, +526/-50). 4 라운드 누적 (drag → marker 도입 → 도형 다양화 → 도형 폐기 + Phosphor chip). 사용자 평 "아직은 아쉬운데" → P0 #1으로 polish 후속.
- **2026-05-21**: bars-first timeline 3 라운드 refine 완성 (PR #392) — 막대 정보 컨테이너 + 가로 스크롤 + sticky + 시각 효과 풍부화. 단일 거대 PR, +1000/-506, 9 파일.
- **2026-05-20**: PR #391 (chore before-work) + PR #390 (timeline-planning Stage 1 dots) + PR #389 (gitignore) + PR #388 (docs sync).

---

## Parked / Brainstorm

- **기존 체크박스-todo → Inbox kind 이전 검토** — `lib/todo-index.ts`(노트 본문 체크박스 인덱스)를 독립 "Todos" 기능으로 키우지 말고, Inbox(attention 큐)에 새 `InboxItemKind "task"`로 추가. Home open-loops 통합. timeline-planning 완료 후.
- **wiki-timeline-view.tsx sub-component 분리** — 1500+ 줄 단일 파일. `<TimelineAxis>` / `<TimelineBars>` / `<TimelineEventMarkers>` / `<TimelineTooltip>` / `<TimelineGrid>` 5분할 후보. 시각 polish 완료 후 권장 (P0 #6).

---

## 영구 LOCKED 결정 (누적 #88, 후보 #89 / #90)

- 최근 (PR #387): #84-#88 — wiki-view-mode 직접 구독 / layout.tsx 정확 매핑 / Save view entity differentiate / Library = hub (view는 sub-entity) / Categories own view.
- 후보 (#89): **planning intent ≠ content activity** — `setWikiArticlePlannedDate`는 `updatedAt` 갱신 안 함. 다음 세션 사용자 OK 시 LOCKED.
- 후보 (#90): **event markers = icon chip 패턴** — filled colored ring + Phosphor 흰 아이콘 inline (nested SVG). 추상 도형은 작은 사이즈에서 식별 불가 (작업 원칙 #8 reinforce). Gentle ≠ illegible. 사이즈 식별 가능 > 컬러 다양성 > 도형 다양성.

전체 영구 룰 #1-#88: docs/MEMORY.md + docs/CONTEXT.md 참조.

---

## Deferred (당장 안 함)

- 다중 기기 sync (Supabase B + E2E + Yjs) — PRD 작성 완료, Phase 1 시작 준비. 사용자 시그널 대기.
- 편집 히스토리 v1 — multi-machine PRD 시점 권장.
- Ambox — Skip 권장 (사용자 시그널 시 재검토).
- SectionTemplate (그룹만 재사용) — MVP 후.
