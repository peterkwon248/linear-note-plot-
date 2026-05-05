---
session_date: "2026-05-05 ~ 2026-05-06"
project: "Plot"
working_directory: "C:\\Users\\user\\Desktop\\linear-note-plot-\\.claude\\worktrees\\trusting-kirch-4eb5f8"
duration_estimate: "~6 hours"
branch: "claude/group-c-d-2-labels"
---

# 다음 세션 (다른 컴퓨터 OK) — Plot 2.0 PRD 진행 중

## 한 줄 요약
**Plot 2.0 진화 PRD 시작. Phase A (코드 정독 + 진화 진단) 완료. 11가지 핵심 결정 확정. Phase B (designer-high에게 완벽한 목업 위임) 직전에 멈춤.**

---

## Completed Work (이번 세션)

### Group C PR-D 시리즈
- **PR #261** v110 — Tags view-engine 통합 (merged)
- **PR #262** v111 — Labels view-engine 통합 (created, after-work에서 머지)

### Hotfix 8개 (PR #262와 함께)
1. `status-icon.tsx` defensive guard — `NOTE_STATUS_COLORS[status]?.css ?? "currentColor"` (crash fix)
2. `notes-table.tsx` — Index 헤더 gap-2 + TH `hideInactiveHint` prop
3. `wiki-list.tsx` — Index gap-2, checkbox w-8, **article icon status color 적용**
4. `templates-table.tsx` — Index gap-2, row gap-2/py-2.5, title gap-2
5. `labels-view.tsx` — row 체크박스 hover-only
6. `tags-view.tsx` — list mode 체크박스 hover-only
7. `stickers-view.tsx` — row 체크박스 hover-only
8. `linear-sidebar.tsx` — Notes context **Folders ↔ Views 순서 변경** (Views 위)

### 🆕 Plot 2.0 진화 PRD — Phase A 완료

**자료 위치**: `C:\Users\user\Desktop\플롯 UI 진화 가이드자료\KakaoTalk_*.png` (20장, 사용자 ChatGPT 목업 영감)

**산출물**:
- `docs/PLOT-CURRENT-STATE-FOR-2.0.md` — 코드베이스 완전 매핑 + 진화 매트릭스 (designer-high 입력용)
- `docs/PLOT-2.0-MOCKUP.html` — 1차 5-화면 prototype (Notes/Wiki/Home/Library/Focus)
- `docs/PLOT-2.0-NOTES.html` — designer-high 1차 정밀화 (Notes 시그니처, 90점)
- `docs/PLOT-2.0-NOTES-FINAL.html` — 정밀화 진행 중 산출물 (참고)

---

## 🔴 다음 세션 (Plot 2.0 Phase B) — 즉시 진행

**designer-high agent에게 위임할 brief 핵심**:
- 입력: `docs/PLOT-CURRENT-STATE-FOR-2.0.md` + 영감 PNG 20장
- 출력: `docs/PLOT-2.0-NOTES-FINAL.html` (또는 새 이름)
- 11가지 결정 모두 반영
- 반응형 + 토글 + ChatGPT 이미지 수준 디자인

**진행 옵션**:
- A) Notes 시그니처 1.5h → 검토 → 나머지 4 화면 (Wiki/Home/Library+Books/Focus) (각 30-40분)
- B) 5 화면 한 번에 4-6h
- C) 메인 agent (나)가 직접 단계적 30분/화면

**제 추천: A**

---

## 11가지 확정 결정 (영구)

| # | 결정 |
|---|---|
| 1 | Activity Bar 7-space (home/notes/wiki/calendar/ontology/library/**books NEW**) |
| 2 | 7-space 새 팔레트 (Books = Rose #fb7185 dark / #e11d48 light) |
| 3 | 분류 4-system → 3-system: Label→**Type**, Category→**Type**(wiki pool), Tag그대로, **Sticker→Pack** |
| 4 | Type rename = UI 레이블만 (코드는 Label 그대로), 별도 PR로 코드 rename |
| 5 | Type 컬럼 Display picker: Hidden / **Icon only (default)** / Text only / Icon+Text |
| 6 | Icon = emoji 먼저 prep, `icon: { type: "emoji"\|"custom", value }` 이중 구조 |
| 7 | Tags 사이드바 **인라인 색 dot** (큰 변화) |
| 8 | Templates 사이드바 승격 ([Note] [Wiki disabled] 탭) |
| 9 | Timeline = ViewMode (별도 ContextKey X) |
| 10 | Detail Panel 5-tab: Detail/Connections/Activity/Bookmarks/**Stats** ("Insights" 아님) |
| 11 | Focus Mode 4-mode + 3-진입점 (단축키 + 버튼 + Settings) |

---

## 보존 영구 결정 (변경 X)

- "Gentle by default, powerful when needed"
- Note/Wiki 2-entity 영구 분리
- 색 정책 4사분면 (Label/Sticker→Pack 필수, Folder/Tag opt-in)
- LLM/API 미사용 (규칙 + 통계 + 그래프)
- Note split = UniqueID 활용
- 사용자 직접 디자인 진행 중 (아이콘/뱃지/로고)

---

## Key Decisions

- **Plot 2.0 = 95% 적용 가능** (기능 손실 0, 80% 표면 + 20% 새 layer)
- **Sticker → Pack** (Bundle 비추, Box는 Inbox/Infobox와 헷갈림, Album 이미지 인상)
- **"Insights" vs "Stats" 분리** — Plot 전체 = Insights, 단일 노트 = Stats
- **반응형 + 패널 토글 필수** (1차 목업에서 빠진 핵심)
- **사용자 자유 권한**: "기존 코드 100% 보존 X, 진화 시 코드 변경 OK" (단 데이터 0 손실 + Note/Wiki 분리는 영구)

---

## Technical Learnings

- **TH 컴포넌트 hideInactiveHint prop**: Title cell의 invisible sort arrow 12px width가 wiki/templates와 다른 간격 유발 → prop으로 Title만 hide
- **체크박스 hover-only 통합 패턴**: `selectionActive || isChecked ? "visible" : "invisible group-hover:visible"` (Templates 패턴)
- **Wiki article icon color** 사용자 직관 = 노트 status icon처럼 색 직접 적용 (회색 placeholder 대체)
- **explore-high agent** = Phase A 적합 (코드 정독 + 미래 진단 동시)
- **designer-high (Opus)** = 1.5-2h 한 화면 정밀화. 5 화면 한 번에 4-6h
- **Plot accent = Indigo (#4f46e5/#818cf8)** — 목업 보라/파랑 색감과 자연 일치

---

## Blockers / Issues
- 없음. Phase B 진행 준비 완료.

---

## Environment & Config

- **OS**: Windows 11
- **Branch**: `claude/group-c-d-2-labels` (PR #262 머지 후 새 브랜치 권장)
- **Store version**: v111
- **Stack**: Next.js 16, React 19, Zustand 5, Tailwind v4, TipTap 3
- **Build**: ✅ tsc clean, ✅ npm run build success

---

## Notes for Next Session

### 다른 컴퓨터에서 시작 시
```bash
git pull origin main
/before-work
```

before-work이 자동으로 읽음:
- `.omc/worklog/latest.md` (이 파일)
- `docs/MEMORY.md` (영구 결정 + PR history)
- `.omc/notepad.md` (Plot 2.0 분석 + 11 결정)
- `docs/PLOT-CURRENT-STATE-FOR-2.0.md` (Phase A 보고서)
- `docs/PLOT-2.0-MOCKUP.html` + `PLOT-2.0-NOTES.html` (1차 시도)

### 첫 행동 (다음 세션)
1. before-work 끝나면 "Plot 2.0 Phase B로 진행할까요?"
2. designer-high에게 Notes 시그니처 위임 (brief는 .omc/notepad.md에 다 있음)
3. 결과 검토 → 나머지 4 화면

### 개인 목업 영감 (참고)
- `C:\Users\user\Desktop\플롯 UI 진화 가이드자료\` (PNG 20장) — 다른 컴퓨터에선 이 경로가 다를 수 있음

### 알아둘 것
- 사용자가 직접 아이콘/뱃지/로고 디자인 진행 중 — 완성되면 Plot에 import 예정
- Pack rename은 v112 마이그레이션 + UI 레이블만 변경 (데이터 그대로)
- 모든 미커밋 변경은 PR #262에 squash merge 묶음 (worktree에서 진행한 진화 작업 전체)
