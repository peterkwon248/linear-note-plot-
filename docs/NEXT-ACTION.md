# 🎯 Next Action

> **이 파일은 before-work가 가장 먼저 읽고, after-work가 마지막에 갱신한다.**
> 다음 세션 시작 시 "지금 바로 뭐 해야 하지?"의 답.

---

**Last Updated**: 2026-04-22 — **Hard reset to PR #194 (3f2e54c)**. PR #195-#213 전부 폐기. UI 일관성 방향 전환.

---

## 🔴 2026-04-22 대결정: Hard reset to PR #194

**배경**: Book Pivot이 자기만족 판정받고 먼저 롤백 → 그 후 "위키 시스템 자체도 냅두자"에서 더 나아가 "PR #194 시점이 위키 정점"이라 판단 → 컬럼/Identity/템플릿 전부 롤백.

**폐기** (PR #195 ~ #213):
- WikiTemplate 8 built-in (#197)
- ColumnRenderer / 컬럼 시스템 (#198-#205)
- 메타→블록 통합 (infobox/toc 블록화) (#208)
- Page Identity Tier (#209)
- Book Pivot 5 shell (#211-213)

**유지** (PR #194까지):
- Tier 1 인포박스 전체 (heroImage + 헤더 색상 + 섹션 구분 행 + 리치텍스트 + themeColor)
- Y.Doc PoC + Block Registry 단일화 (#192)
- 각주 / References / Split View / Library / Expand-Collapse / Ontology / Insights
- Default + Encyclopedia 2-layout toggle

---

## ⚠️ 다음 세션 git 주의 (중요)

현재 branch `claude/mystifying-poitras-48b32a`가 **3f2e54c(PR #194)로 hard reset**됨. main은 bd50b00(PR #213)까지 있으니 **시간 역행 상태**.

**문제**: 다음 세션 before-work의 `git merge origin/main -X theirs` 실행 시 → main의 Book Pivot + Column + Identity 코드가 **다시 merge되어 rollback이 자동 취소**됨.

**해결 옵션**:
1. 이 worktree에서 곧 commit + push (branch에 롤백 반영) + PR 만들어 main으로 merge
2. before-work Step 0 수정 (특정 branch는 main 병합 skip)
3. 다음 세션 시작 시 before-work Step 0 수동 건너뛰기

---

## 🎯 다음 세션 시작하면 바로 할 것

### Step 1 — UI 일관성 감사 + 개선

**진짜 pain point**: "ui가 너무 이상함. 일관성 없고" (사용자 2026-04-22 지적).

기능 추가 당분간 보류. 이미 있는 UI의 일관성 정리 우선.

**착수 순서**:
1. `docs/DESIGN-AUDIT.md` 재검토 (있으면)
2. 사용자에게 가장 거슬리는 UI 3-5개 직접 지적 요청
3. `anthropic-skills:design-quality-gate` 스킬 + `designer` 에이전트 활용
4. Phase별 개선 (각 Phase = 1 PR, 작게)

### Step 2 — 설계 안정화 원칙

**2주간 "대결정" 3회 반복 패턴 (2026-04-14~04-21)**:
- 04-14: 컬럼 템플릿 시스템
- 04-17: Page Identity Tier
- 04-21: Book Pivot

→ **전부 구현 직후 폐기**. 2026-04-22 전부 롤백.

**영구 규칙**:
- 큰 방향 전환 전 전체 설계 확정
- Phase 쪼개기 전에 "진짜 이 방향이 맞나?" 자문
- "멋진 레이아웃", "유연한 템플릿", "시각적 다양성" 방향 **제안 금지**
- Plot 코어(지식 관계망, 팔란티어×제텔카스텐)에서 벗어난 방향 **금지**

---

## 🔴 Plot 코어 정체성 (흔들리지 않게)

- Plot = 노트 + 위키 + **지식 관계망** (팔란티어 × 제텔카스텐)
- LLM 없이 **규칙/통계/그래프 알고리즘**
- 시각적 다양성 ≠ Plot 코어

### 이미 구현된 것 (PR #194 기준)
- ✅ 인사이트 허브 (`/insights`, `/graph-insights`, `lib/analysis/engine.ts`)
- ✅ Y.Doc PoC (`lib/y-doc-manager.ts`, in-memory only)
- ✅ Red Link 표시 (위키 Unlinked Mentions)
- ✅ Split View (멀티 패널, PaneContext)
- ✅ 각주 / References / Library / Expand-Collapse
- ✅ 인포박스 Tier 1 (heroImage + 헤더 색상 + 섹션 구분 + 리치텍스트)
- ✅ themeColor 시스템 (문서별 브랜드 컬러)
- ✅ Default + Encyclopedia 2-layout toggle

### 진짜 미구현
- ❌ **노트 Split** (블록 쪼개서 새 노트로, WikiSplitPage 패턴 복사 가능)
- ❌ **Y.Doc 영속화** (y-indexeddb)
- ❌ **Red Link 선택 팝업 UX** (노트/위키 분기)

---

## 📚 필수 참고

- `docs/DESIGN-AUDIT.md` — 전수 디자인 감사 (있으면)
- `anthropic-skills:design-quality-gate` 스킬 — UI 품질 자동 검증
- `designer` 에이전트 — UI 개선 위임
- Claude memory: `feedback_core_alignment.md`, `project_book_pivot_rollback.md`, `feedback_design_before_implementation.md`

## 🟡 알려진 이슈 (pre-existing, 기능 영향 없음)

- phosphor-icons/react/dist/ssr/* 타입 선언 일부 누락 (tsc 경고)
- Hydration mismatch (AppLayout)
- Yjs 중복 import warning
