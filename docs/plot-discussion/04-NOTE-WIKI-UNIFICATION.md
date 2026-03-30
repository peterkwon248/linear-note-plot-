# 노트/위키 통합 엔티티 — 템플릿 기반 타입 결정

> 2026-03-30 대화 기반 정리

## 핵심 질문

> 위키랑 노트를 지금처럼 나누는 게 낫냐?
> 아니면 템플릿에 따라 노트/위키로 나뉘는 게 낫냐?

---

## 현재 구조의 문제

현재 Note와 WikiArticle은 완전 별도 엔티티인데, 데이터 모델이 사실상 같다:

- 둘 다 Label, Tags, Relations 있음
- 둘 다 TipTap 에디터 사용
- 둘 다 IndexedDB에 저장
- 다른 건 메타데이터 필드 몇 개뿐

CONTEXT.md에도 "Note.isWiki는 레거시 — 리팩토링 예정 (30개 파일 96곳 수정 필요)"으로 기록됨.

---

## 결론: 템플릿이 결정하는 구조가 더 낫다

### 제안 구조

```
현재:  Note (엔티티) ←→ WikiArticle (엔티티)  — 별도 저장, 별도 공간
제안:  Note (단일 엔티티) + Label (타입)       — 통합 저장, 뷰로 분리

       ├─ Label: Note:Capture
       ├─ Label: Note:Permanent
       ├─ Label: Wiki:Concept
       ├─ Label: Wiki:Person
       ├─ Label: Wiki:Project
       └─ ...

Activity Bar "Notes" = Label이 Note:*인 것
Activity Bar "Wiki"  = Label이 Wiki:*인 것
```

### 이유 4가지

#### 1) 노트 → 위키 전환이 자연스러워짐

- 현재: 캡처 노트가 위키로 성장하려면 "위키 공간에 새로 만들고 내용 옮기기" 같은 마찰
- 통합: Label만 바꾸면 됨. `Note:Capture` → `Wiki:Concept`으로 전환하는 순간 위키 메타필드 활성화
- 제텔카스텐의 fleeting → permanent → 지식 구조 흐름과 정확히 일치

#### 2) Activity Bar "Notes"와 "Wiki"는 뷰가 됨

- 데이터는 하나의 저장소에 있고, Notes 공간은 `Label이 Note:*인 것` 필터, Wiki 공간은 `Label이 Wiki:*인 것` 필터
- 인라인 DB에서 논의한 "스키마 없는 쿼리 뷰"랑 똑같은 원리

#### 3) 템플릿 시스템이 더 깔끔해짐

기존 설계의 4번째 항목 "위키 구조 템플릿 (Concept/Person/Project/Investment)"이 사실상 "이 노트의 Label을 Wiki:Concept으로 세팅하고, wikiType 필드를 활성화하는" 동작이 됨. 별도 엔티티가 아니라 **템플릿이 노트의 성격을 결정**.

#### 4) 온톨로지/그래프가 통합됨

- 현재: 노트-노트, 위키-위키, 노트-위키 관계를 따로 관리
- 통합: 하나의 엔티티면 관계 시스템 단순화. 그래프 뷰에서 전부 한 공간에 표시

### 시각적 구분 유지 방법

통합하면 "이게 메모인지 정리된 지식인지" 시각적 구분이 약해질 우려가 있으나, 이는 **Label 뱃지나 에디터 상단 표시**로 해결 가능:
- 위키 템플릿이 적용된 노트는 상단에 article/stub 상태 뱃지
- 사이드바에서도 아이콘이 다르게 표시

---

## isWiki 리팩토링과의 관계

현재 TODO P0에 "isWiki 플래그 제거, 30개 파일 96곳 수정"이 남아있으므로, 이 리팩토링 방향을 "템플릿이 Label로 타입 결정 → 뷰로 분리"로 잡는 것이 자연스러움.
