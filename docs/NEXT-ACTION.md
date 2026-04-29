# 🎯 Next Action

> **이 파일은 before-work가 가장 먼저 읽고, after-work가 마지막에 갱신한다.**
> 다음 세션 시작 시 "지금 바로 뭐 해야 하지?"의 답.

---

**Last Updated**: 2026-04-30 (오전) — **Sprint 1.3 머지 완료. 다음은 Sprint 1.4 (Wiki 보드 뷰 + 차트 개선).**

---

## 🆕 다음 컴퓨터에서 시작할 때 (다른 머신 인계)

1. `git pull origin main` — Sprint 1.3 머지 코드 가져오기
2. 새 worktree 생성:
   ```bash
   git worktree add .claude/worktrees/<new-name> -b claude/<new-name>
   cd .claude/worktrees/<new-name>
   npm install  # 첫 worktree 만든 후 한 번
   ```
3. `npm run dev` (port 3002 기본 — 이미 사용 중이면 autoPort)
4. **이 파일 (NEXT-ACTION.md) 읽고 Sprint 1.4 작업 시작**

---

## 🎯 큰 방향 (변경 없음)

**Sync 대신 출시 준비 먼저** — 결정 #3 = (c) Free 출시 후 v2.0에 Sync (6개월~1년 후)

**타임라인**: 자유 — 품질 우선
**플랫폼**: 데스크톱 우선 → 회원 수 충분해지면 모바일 (PWA + TWA)
**Sync**: PRD 보존 ([`docs/SYNC-PRD.md`](./SYNC-PRD.md)). v2.0 시점 활성화

---

## 🚀 Sprint 1.4 (~1주): Wiki 보드 뷰 + 차트 개선 + Knowledge Connectivity

### A. Wiki 보드 뷰

- [ ] `WIKI_VIEW_CONFIG.displayConfig.supportedModes`에 `"board"` 추가 ([lib/view-engine/view-configs.tsx:212](lib/view-engine/view-configs.tsx))
- [ ] View mode toggle UI (List ↔ Board) — Notes 패턴 재활용
- [ ] `WikiBoard` 컴포넌트 신규 (Notes 보드 컴포넌트 참고)
- [ ] **Group by**:
  - default: **Category** (가변, 사용자 정의 — Notes의 status 위치)
  - 옵션: **Tier** (Stub/Article 2-column, "stub 정리" 워크플로)
  - 옵션: **Parent article** (위계)
- [ ] **카드 디자인** (Linear 식 컴팩트):
  - 제목 (bold)
  - Tier badge (Stub / Article)
  - Backlinks 숫자
  - Updated relative
  - (옵션) Categories chip — display properties 토글
- [ ] 카드 **drag → 그룹 변경** (카테고리 변경 지원)

### B. Wiki 컬럼 정비 (List + Board 카드 공유)

- [ ] **Tier** 컬럼/badge (Stub / Article 자동 — `isWikiStub` 기반) ★ 새
- [ ] **Reads** 컬럼 ★ 새
  - `WikiArticle.reads: number` 필드 추가 + store 마이그레이션 (v75 → v76)
  - `openWikiArticle` 호출 시 `reads++` 로직
- [ ] **Created** 컬럼 ★ 새

### C. Wiki 차트 개선

- [ ] **Growth 차트 Article/Stub 분리**
  - New per bucket: stacked bar (Article 보라 + Stub 회색)
  - Cumulative: multi-line (Total / Articles / Stubs)
  - `isWikiStub` 활용 — `lib/insights/timeseries.ts`에 분리 로직 추가
- [ ] **차트 sub-tabs** (`All` / `Articles` / `Stubs`) — Wiki List sub-tabs와 동일 디자인
  - All (default): stacked + multi-line
  - Articles: 단일 색
  - Stubs: 단일 색
- [ ] **Knowledge Connectivity 차트 추가** ★
  - 차트 종류 토글 (`Growth` / `Connectivity`) — 상위 레벨
  - 시간별 wiki article 간 backlinks 합 시각화
  - `cumEdges` 인프라 재활용 ([lib/insights/timeseries.ts:130](lib/insights/timeseries.ts) 이미 부분 계산 중)

UI 계층 (확정):
```
[Growth | Connectivity]                    ← 차트 종류 (상위)
                       [Day Week Month]    ← 시간 단위
[All] [Articles] [Stubs]                   ← 데이터 필터 (Growth만)
─────────────────────────
        차트 영역
```

---

## 🟡 Sprint 1.5 (~3일): Outlinks + 후속

- [ ] **Outlinks 컬럼** (Notes + Wiki 일관 적용)
  - `Note.linksOut`, `WikiArticle.linksOut` 데이터 이미 존재 ([lib/types.ts:270, 344](lib/types.ts))
  - List 컬럼 (Notes + Wiki 양쪽)
  - 보드 카드에도 표시 (옵션, display properties 토글)

---

## 🟡 Sprint 1 P1 미완 (잔존)

- [ ] **Sub-group** (S, 가장 빠른 wins) — 인프라 100% 있음. UI dropdown 추가만
  - 변경: [components/display-panel.tsx](components/display-panel.tsx) Grouping dropdown 옆에 Sub-grouping dropdown
  - 검증: [components/notes-table.tsx](components/notes-table.tsx)에서 `groups[].subGroups` 렌더 확인

---

## 🟡 Sprint 2 (~3주): 핵심 폴리시

(변경 없음 — [docs/TODO.md](./TODO.md) 참조)

- 노트 템플릿 시드 10~20개 (onboarding 강화)
- 온톨로지 메트릭 설명 툴팁
- 캘린더 현황 점검 + 부족분
- Views 업그레이드 (실용적으로)
- Insights 업그레이드 (실용적으로)

---

## 🟢 Sprint 3 (~2주): 데스크톱 출시 자산

(변경 없음 — [docs/TODO.md](./TODO.md) 참조)

- 도메인 결정 + 구매
- 마케팅 사이트 (별도 워크트리)
- Privacy Policy + Terms (sync 없는 버전, 한국 + GDPR)
- 데스크톱 웹 배포

### 🎯 데스크톱 Free 출시

---

## 🟡 Sprint 4: 모바일 추가 (회원 수 충분해진 후)

(변경 없음)

---

## 🚀 Sync v2.0 (출시 후 6개월~1년)

(변경 없음 — `docs/SYNC-PRD.md` 보존)

---

## ✅ 2026-04-30 Sprint 1.3 완료 (PR #228)

| 작업 | 결과 |
|------|------|
| Activity Bar / Sidebar / ViewHeader 아이콘 일치 | ✅ 머지 |
| Wiki Dashboard Display + DetailPanel mode 숨김 | ✅ |
| Knowledge Base 카드 색깔 박스 → 5개 아이콘 | ✅ |
| Quick Capture placeholder 5문구 cycle | ✅ |
| 라이트모드 Wiki contrast (Dashboard + List + Sub-tabs) | ✅ |
| Wiki/Notes List 단일 select ↔ 사이드 패널 동기화 | ✅ |
| Space 전환 시 sidePanelContext clear | ✅ |
| Wiki Article Detail typeof guard (article.layout object 데이터) | ✅ |
| **Wiki List Display Properties 동적 컬럼** (Categories chip + count) | ✅ ★ |
| 빌드 fix: home-view.tsx:41 backlinks → useBacklinksIndex | ✅ ★ (출시 빌드 통과) |

**Store 변경 없음** (v75 유지). 다음 Sprint 1.4의 Reads 필드 추가 시 v76.

---

## 📝 사용자 명시 결정 (2026-04-30 세션)

### 폐기 (영구)

- **Hub Tier 자동 분류** — 사용자 통제 부재로 혼선 위험. Stub/Article 2단계로 충분. Backlinks 정렬로 hub-like 식별 가능
- **Folder 컬럼 (Wiki)** — Categories가 그 역할
- **Words 컬럼 (Wiki)** — 위키는 길이로 분류 안 함. Block count는 Detail 패널에 이미 있음

### 합의 (Sprint 1.4 / 1.5)

- **보드 뷰 default group by**: Category (가변, Notes의 status 위치)
- **Tier**: Stub / Article 2단계만 (`isWikiStub` 기반)
- **Reads**: WikiArticle에 필드 추가, 마이그레이션 v76
- **Knowledge Connectivity 차트**: 추가 OK
- **Growth 차트 Article/Stub 분리 + sub-tabs**: 오버엔지니어링 아님, 추가 OK
- **Outlinks 컬럼**: Notes + Wiki 양쪽 일관 적용 (Phase 3)

### Plot 영구 규칙 재확인

- "시각적 다양성 ≠ Plot 코어" — 단, 명확한 그룹 차원이 있고 사용자가 가치 판단하면 검토 가능 (Wiki 보드 뷰가 좋은 예 — Category 기준)
- 단순/명확/사용자 통제 친화적 (Hub Tier 자동 분류 폐기는 이 규칙 적용)

---

## 🟡 알려진 이슈

- TipTap duplicate extension warnings (link/underline/gapCursor) — 기능 영향 없음
- Hydration mismatch (Radix UI aria-controls ID) — 기능 영향 없음
- ResponsiveContainer (recharts) — React 19/Next 16 환경 → ResizeObserver 패턴 우회 (이미 적용)
- ~~home-view.tsx:41 backlinks tsc 에러~~ → ✅ 2026-04-30 fix (useBacklinksIndex)

---

## 📚 필수 참고

- [`docs/CONTEXT.md`](./CONTEXT.md) — 현재 Plot 상태 + 설계 결정
- [`docs/MEMORY.md`](./MEMORY.md) — 전체 PR 히스토리
- [`docs/TODO.md`](./TODO.md) — Sprint 진행 추적
- [`docs/SYNC-PRD.md`](./SYNC-PRD.md) — Sync v2.0 PRD (보존, 향후 활성화)
- [`docs/SYNC-DESIGN-DECISIONS.md`](./SYNC-DESIGN-DECISIONS.md) — Sync 6개 결정
- [`docs/UI-CONSISTENCY-AUDIT.md`](./UI-CONSISTENCY-AUDIT.md) — UI 일관성 audit (Sprint 1.2)
- [`docs/DESIGN-TOKENS.md`](./DESIGN-TOKENS.md) — 디자인 토큰
