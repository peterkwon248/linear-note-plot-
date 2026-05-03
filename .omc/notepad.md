# Session Notepad (Updated: 2026-05-03 16:10)

## Critical Context

### 영구 원칙 (모든 작업에 적용)
- **디자인 원칙**: "Gentle by default, powerful when needed"
- **작업 원칙**: "정확도 + 버그 위험 최소화" (10가지 규칙 — docs/MEMORY.md 참조)

### 오늘 (2026-05-03) 11 PRs 머지
- 디자인 결정 → 즉시 구현. main에 #237 ~ #247 squash-merged.
- **현재 main HEAD**: #247 (Template PR b — edit UI unification) 머지 직후
- **다음 worktree**: 새로 시작 권장 (이번 worktree는 일단락)

## Active Tasks (다음 세션 — 우선순위 순)

### 🟢 작은 폴리시 (1-3시간)
- [ ] **Template PR c** — template-only views (filter/display + view-engine)
- [ ] **Template PR d** — 시드 템플릿 10-20개 (clean slate, 회의록/일기/투두/Daily/PARA/소설/리서치 등)

### 🟡 중간 (3-5시간)
- [ ] **Wiki template 3-layer** (Layout Preset + Content Template + Typed Infobox) — 위키 데이터 모델 위에 별도 설계
- [ ] **Template seed audit** — `PlotTemplate<T>` 추상화 검토 (인포박스/배너/카테고리/시드 통합 가능성)

### 🔴 큰 작업 (수일)
- [ ] **Group C PR-D** — Tags/Labels/Stickers/Refs/Files view-engine 통합 (5-8 PRs)
- [ ] **§2 Folder type-strict + N:M 마이그레이션** — 큰 PR (cross-everything 임시 폐기)
- [ ] **Smart Book v2** — AutoSource[5] + Sticker source + Hybrid manual/auto + Universal Picker

### 🟣 마지막 (출시 폴리시)
- [ ] **Note UI toolbar** (UpNote-style) — Phase 1: Pin/Focus/Version 5-6 핵심 버튼만, configurable, "Organize..." multi-action (Folder/Tag/Label/Sticker)

### 🟤 마지막에 논의 (결정 보류)
- [ ] **House (계보 시각화)** — 노트 root/parent/children 전체 조망. 사용자 의견: "House" 명칭, 사이드바 More 진입, 노트+위키 둘 다. Claude 냉정 의견: 별도 entity 불필요, Graph view에 lineage mode + hierarchical layout + 사이드바 단축 링크로 대체 가능 (House 90% 커버). 다음 토론 시 결정.

## Polished Decisions (이번 세션)
- **Folder type-strict + N:M** 재확정 (33 §2)
- **Smart Book = AutoSource[]** 5종 (folder/category/tag/label/sticker)
- **Note template = UpNote opt A** (메타 슬림 + 사이드 패널, Smart Template v2 보류)
- **Wiki status 색**: stub=orange, article=emerald, entity=violet
- **Sticker Library only 진입점**

## Blockers
- 없음

## Known Gotchas (다음 세션 주의)
- **Tailwind v4 `border-[1.5px]`** 미적용 → `style={{ borderWidth: "1.5px" }}` 직접
- **라이트모드 alpha** `/30~50` 흰 배경에서 거의 안 보임 → `/60+` 또는 `var(--muted-foreground)` 직접
- **DisplayConfig interface 중복** — display-panel.tsx + view-configs.tsx 두 곳에 정의됨 (향후 통합)
- **architect Opus agent**가 큰 PR (600+ LOC) 검증 시 stall 가능성 — medium 옵션 검토
- **Store version 102** — Sticker.members[] (v101), Template icon/color drop (v102)
- **Plan 문서**: `.omc/plans/template-b-edit-ui-unification.md` 보존 (다음 PR 참고)

## Resume Commands
```bash
# 새 worktree에서 시작 (권장)
cd C:/Users/user/Desktop/linear-note-plot-
git pull origin main
# 새 worktree 만들기 (claude code가 자동)
npm install  # in new worktree
```
