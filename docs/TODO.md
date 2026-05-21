# TODO

> 우선순위 기반 작업 목록. **P0 = 다음 세션 즉시 시작점** (NEXT-ACTION.md 폐지, 2026-05-12).
> 완료 항목은 즉시 삭제. 자세한 history는 SESSION-LOG.md + MEMORY.md.

**마지막 갱신**: 2026-05-21 (저녁 후속) — timeline 막대 끝점 재설계 (circle dot → Article 화살촉 / Stub rounded). 사용자 "마음에 든다 이 정도면" → timeline 일단락. 다음 P0 = Ontology graph node 사이드바.

---

## 🟣 P0 — 즉시 (cross-machine 진입점, 2026-05-21 저녁 후속)

### 1. **🟡 Ontology graph node 사이드바 동기화** (최우선, 사용자 의도 미확정)

- Graph node 클릭 → 4탭 사이드바 (Detail/Connections/Activity/Bookmarks — 추천) / OntologyDetailPanel / 사이드바 graph mode 중 택
- 사용자 의향 청취 후 진행 (어느 패턴 원하는지)

### 2. **🟡 Activity events 후속**

- Granular Wiki/Book events wire-up (block_added/item_added 등) — timeline marker chip(#90)이 unknown type fallback 보유라 wire-up 완료 시 자동 풍부해짐
- Label entity events 발화 (tags.ts 패턴 정합)
- `opened` 이벤트 emit (현재 wiki article은 미emit — `lib/store/slices/wiki-articles.ts`는 created/updated/trashed/untrashed만)

### 3. **🟡 Books own Views section** (entity-uniformity, 영구 룰 #87 정합)

- `linear-sidebar.tsx` Books section에 own Views section. `SavedView.space "books"`는 이미 union에 있음.

### 4. **🟢 timeline 추가 polish (사용자 명시 요청 시만)**

timeline은 사용자 "마음에 든다 이 정도면" 으로 일단락. 추가 polish는 사용자가 다시 요청할 때만. 후보 (보류):
- (a) 막대 typography 키움 (title 폰트 11→12, weight 500→600)
- (b) Now line glow filter (`feGaussianBlur` 결합)
- (c) chip border `var(--background)` ring 1px (어떤 bg에서도 contrast)
- (d) axis long label collision 강화 (Quarter/Year zoom)
- (e) selected article 이벤트 list separate panel

### 5. **🟢 wiki-timeline-view.tsx sub-component 분리**

- 1500+ 줄 단일 파일. `<TimelineAxis>` / `<TimelineBars>` / `<TimelineEventMarkers>` / `<TimelineTooltip>` / `<TimelineGrid>` 5분할 후보. 별도 리팩토링 PR.

### 6. **🟢 manual smoke 누적**

- 이번 세션: 옵션 C drag + 마커 chip + Reticle polish + 끝점 재설계 (PR #393 + 끝점 PR)
- 이전: PR #392 (bars-first 3 라운드) + PR #373-#391

**시각 검증 (선택)** — timeline 본인 viewport 확인 시 dummy snippet (SESSION-LOG 직전 entry hook 안 6 article 버전):
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
  });
  return {wikiArticles:newA, entityEvents:[...f,...ne]};
});
return `seeded ${ids.length}`;})()
```
→ Wiki Overview → "View all N articles" → Timeline → toggles.showStubs ON → Month zoom. `window.__plotStore` production 노출 여부 (`grep "__plotStore" lib/`)는 이전 세션부터 미해결 — dev-only 가드 확인 필요.

---

## ✅ 최근 완료

- **2026-05-21 (저녁 후속)**: timeline 막대 끝점 재설계 — 떠 있던 circle status dot 제거 → Article = 막대 끝 solid 화살촉 ▶ / Stub = rounded end. dashed tail 초안 추가 후 사용자 "별론데" → 제거. 단일 파일 +22/-36. 사용자 "마음에 든다 이 정도면" 승인.
- **2026-05-21 (저녁)**: timeline 옵션 C drag + event marker chips (Phosphor icon inline + filled ring) + Reticle-feel polish — 단일 거대 PR #393 (1 파일 `wiki-timeline-view.tsx`, +526/-50). 4 라운드 누적 (drag → marker 도입 → 도형 다양화 → 도형 폐기 + Phosphor chip).
- **2026-05-21**: bars-first timeline 3 라운드 refine 완성 (PR #392) — 막대 정보 컨테이너 + 가로 스크롤 + sticky + 시각 효과 풍부화. 단일 거대 PR, +1000/-506, 9 파일.
- **2026-05-20**: PR #391 (chore before-work) + PR #390 (timeline-planning Stage 1 dots) + PR #389 (gitignore) + PR #388 (docs sync).

---

## Parked / Brainstorm

- **기존 체크박스-todo → Inbox kind 이전 검토** — `lib/todo-index.ts`(노트 본문 체크박스 인덱스)를 독립 "Todos" 기능으로 키우지 말고, Inbox(attention 큐)에 새 `InboxItemKind "task"`로 추가. Home open-loops 통합. timeline-planning 완료 후.
- **wiki-timeline-view.tsx sub-component 분리** — 1500+ 줄 단일 파일. `<TimelineAxis>` / `<TimelineBars>` / `<TimelineEventMarkers>` / `<TimelineTooltip>` / `<TimelineGrid>` 5분할 후보. 시각 polish 완료 후 권장 (P0 #6).

---

## 영구 LOCKED 결정 (누적 #88, 후보 #89 / #90 / #91)

- 최근 (PR #387): #84-#88 — wiki-view-mode 직접 구독 / layout.tsx 정확 매핑 / Save view entity differentiate / Library = hub (view는 sub-entity) / Categories own view.
- 후보 (#89): **planning intent ≠ content activity** — `setWikiArticlePlannedDate`는 `updatedAt` 갱신 안 함. 다음 세션 사용자 OK 시 LOCKED.
- 후보 (#90): **event markers = icon chip 패턴** — filled colored ring + Phosphor 흰 아이콘 inline (nested SVG). 추상 도형은 작은 사이즈에서 식별 불가 (작업 원칙 #8 reinforce). Gentle ≠ illegible. 사이즈 식별 가능 > 컬러 다양성 > 도형 다양성.
- 후보 (#91): **막대 끝점 = status는 도형 자체로** — Article = 막대 끝 화살촉, Stub = rounded end. 떠 있는 dot은 disconnect. horizon source는 막대 위치(future stripe)로 자명 → 별도 마커 폐기 (시각 신호 중복 제거).

전체 영구 룰 #1-#88: docs/MEMORY.md + docs/CONTEXT.md 참조.

---

## Deferred (당장 안 함)

- 다중 기기 sync (Supabase B + E2E + Yjs) — PRD 작성 완료, Phase 1 시작 준비. 사용자 시그널 대기.
- 편집 히스토리 v1 — multi-machine PRD 시점 권장.
- Ambox — Skip 권장 (사용자 시그널 시 재검토).
- SectionTemplate (그룹만 재사용) — MVP 후.
