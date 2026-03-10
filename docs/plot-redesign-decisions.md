# Plot Redesign — Brainstorming Decisions

## Core Strategy (v2)

> **겉은 Apple Notes, 속은 Zettelkasten.**
>
> 유저는 그저 노트만 쓴다. 앱이 알아서 제텔카스텐을 해준다.
> 수동 설정도 가능하지만, 하지 않아도 자연스럽게 작동한다.
> **유저를 불편하게 하지 않으면서, 그럼에도 작동하는 것.**
>
> 디자인 감도는 Linear, 내부 구성은 전통 노트앱 문법.

### 왜 전략을 선회했나

- Linear: 이슈는 생성 → 처리 → 완료. 자연 소멸 사이클.
- 노트앱: 생성 → 축적 → 축적. 끝이 없음.
- 3섹션 Inbox, Review Queue, Alerts 시스템은 이슈 트래커에 맞는 구조.
- 노트가 수백~수천 개가 되면 과도한 구조가 됨.

### Zettelkasten 매핑

| Zettelkasten | Plot 구현 |
|---|---|
| Fleeting note | Inbox (□ 상태, 폴더 미지정) |
| Literature note | Capture/Reference (▣ 상태) |
| Permanent note | Permanent (☑ 상태) |
| Connection | Wiki-link + Backlink + Related Notes |

---

## Agreed Changes (vs Original Spec)

| # | Topic | Original Spec | v2 Decision |
|---|-------|--------------|----------|
| 1 | Maps | Remove entirely | ✅ Done (Week 1). Route removed |
| 2 | Board → Calendar | Replace Board with Calendar | Agreed. Table `groupBy:status` inherits Board's role |
| 3 | Inbox | 3 sections (Triage/Review/Alerts) | **Inbox = 폴더 미지정 노트 리스트.** 1섹션, 단순 리스트 |
| 4 | Recent | 5 recent notes | ✅ Done (Week 1). Sidebar에 구현 |
| 5 | SRS | Dedicated review card mode | Engine 유지, UI 최소화. 나중에 별도 뷰로 분리 가능 |
| 6 | Status Icons | □ → ▤ → ☑ | ✅ Done (Week 1). □ → ▣ → ☑ |
| 7 | Detail Panel | Merge 2 components, remove clutter | Agreed. Major reduction |
| 8 | Workflow Actions | Buttons in detail panel | Remove. Status dropdown + context menu/shortcuts |
| 9 | Review Queue | Inbox 내 Review 섹션 | **Related Notes에 흡수.** "오래 안 본 노트" 가중치로 자연 복습 |
| 10 | Alerts | Inbox 내 Alerts 섹션 | **삭제.** 리마인더만 남김 |
| 11 | Backlinks | Detail panel에서만 표시 | **에디터 본문 아래 인라인 표시** |
| 12 | Related Notes | 없음 | **자동 추천 3~5개** (태그/링크/키워드 기반) |

---

## 3 Connection Layers (Zettelkasten의 핵심)

### 1. Wiki-link (명시적, 이미 구현됨)
`[[노트 제목]]` — 사용자가 의도적으로 만든 연결.

### 2. Backlinks (역방향, 인라인으로 이동)
에디터에서 노트 본문 아래에 바로 보여줌. 별도 패널을 열 필요 없음.
```
── Backlinks (3) ────────
  ▣ Bayesian Thinking
  □ Decision Framework
  ☑ Research Methods
```

### 3. Related Notes (자동 추천, 새로 구현)
태그 겹침 + wiki-link 공유 + 키워드 유사도 + **"오래 안 본" 가중치** 기반 3~5개 추천.
```
── Related ──────────────
  ▣ Bayesian Thinking     ← 같은 태그
  □ Decision Framework    ← 공통 wiki-link 2개
  ☑ Research Methods      ← 관련 + 45일 전 마지막 열람
```
사용자가 아무것도 안 해도 연결이 보임. 오래된 관련 노트가 자연스럽게 떠오름.
Review Queue의 "복습" 가치가 여기에 흡수됨.

---

## 제거 대상 (v2에서 삭제)

| 시스템 | 현재 위치 | 조치 |
|--------|----------|------|
| Review Queue | `lib/queries/notes.ts` getReviewQueue() | UI 삭제. 스코어링 로직은 Related Notes에 흡수 |
| Alerts | `lib/alerts.ts` computeAlerts() | 삭제 (리마인더는 store에 남김) |
| Alert store slice | `lib/store/slices/alerts.ts` | 삭제 |
| ReviewRow, AlertRow | `components/views/inbox-view.tsx` | 삭제 |
| Inbox 3섹션 구조 | `components/views/inbox-view.tsx` | 단순 리스트로 교체 |
| Triage bar (Keep/Snooze/Trash) | inbox-view.tsx InboxDetailPanel | 유지 (폴더 이동으로 처리) |

---

## Design System Priorities (Impact Order)

1. ~~Border removal + whitespace separation~~ ✅ Done (Week 1)
2. ~~Icon unification (strokeWidth 1.4, opacity 0.6)~~ ✅ Done (Week 1)
3. Color diet (status colors → gray shapes □▣☑) (component work)
4. Brightness-based hierarchy (zinc-100 vs zinc-500) (CSS-level)
5. Empty states (illustration + helpful copy)
6. Hover/selected unification

## Typography (4 levels)

- 12px — meta (dates, counts, badges)
- 13px — body (sidebar, lists, content)
- 16px — section titles (Inbox, Notes headers)
- 20px — page/editor titles

---

## Execution Order (Revised)

- Week 1: ✅ Sidebar Surgery + Design System Foundation
- Week 2: Inbox Simplification + Zettelkasten Layers (backlinks inline, related notes)
- Week 3: NoteRow Redesign + Detail Panel Cleanup
- Week 4: Editor Typography + Search Polish
