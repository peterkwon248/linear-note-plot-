# Session Notepad (Updated: 2026-05-03 01:30)

## Critical Context

- **Plot 정체성 (영구 디자인 원칙)**: "Gentle by default, powerful when needed"
- **PR #237**: 11 커밋, main 머지 대기 (open). 다음 세션은 fresh worktree 권장
- **이번 세션 = 코드 9 커밋 + 33 디자인 결정** (앞으로 작업 방향 정리)

## Active Tasks (다음 세션 — 우선순위 순)

### 🟢 작은 polish PR (즉시 시작)
- [ ] 마크다운 Phase 1: `---` Enter 패턴 + Highlight + Image embed
- [ ] Linear-style entity navigation (↑/↓ 키)
- [ ] Wiki "Blocks" Display Property
- [ ] Stickers Library만 진입점 (4 space NavLink revert)
- [ ] Notes 사이드바 위계 (Notes ▼ Status 그룹)

### 🟡 중간 PR
- [ ] NoteStatus 리네이밍 Phase 1 (PRD 사전 조사 완료)
- [ ] 마크다운 Phase 2 (Math + Heading anchor)
- [ ] Filter chip 3-part 드롭다운
- [ ] Linear 검색창 패턴

### 🔴 큰 데이터 모델 PR
- [ ] Folder type-strict + N:M
- [ ] Sticker v2 cross-everything
- [ ] Sandbox + Save view 통합
- [ ] Entity-ref WikiBlock 일반화
- [ ] 온톨로지 그래프 노드 확장

### 🟣 v3급 PR (가장 마지막)
- [ ] Book entity (cross-entity, ordered sequence, Activity Bar 7번째)

## 핵심 결정사항 (영구)

### 4사분면 컨테이너 모델
```
                Unordered (collection)    Ordered (sequence)
Type-strict     Folder                    -
Type-free       Sticker                   Book
```

### Page entity 폐기 (atomic 위배), Book entity 채택 (atomic 보존 + sequence)

### Sandbox = 그래프만 / 노트/위키 = 즉시 영구
- Wikilink = 본문에서만, Relation = 그래프에서
- Save view = 보기 + 데이터 staging 함께 영구 (옵션 B 통합)

### Relation 저장 = 본문 contentJson에 직접 embed
- 사용자 첫 번째만 prompt + "기억" 옵션
- 위키: 자동 "See also" 섹션 + entity-ref WikiBlock 일반화

## Technical Learnings (이번 세션)

- **SVG pointer-events 함정**: fillOpacity 낮으면 클릭 통과. `pointerEvents: "all"` 명시 필요
- **useMemo + ref**: `forceRender` 카운터 노출 + deps 추가 (renderTick 패턴)
- **자료구조 = entity 정당화**: Sticker (set) vs Book (sequence)
- **종이책 메타포 함정 회피**: 디지털은 cross-type 자유

## Resume Commands

```bash
# 다음 세션 시작 시
cd C:/Users/user/Desktop/linear-note-plot-
git pull origin main
# 새 worktree 만들기 (claude code 자동)
npm install  # 새 worktree에서

# /before-work 실행
```

## Blockers
- 없음

## 다음 세션 진입 전 점검
1. PR #237 머지 상태 확인
2. main 동기화 (git pull origin main)
3. 새 worktree에서 작은 polish PR 시작 추천
