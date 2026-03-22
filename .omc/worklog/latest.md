---
session_date: "2026-03-22 19:30"
project: "Plot (linear-note-plot)"
working_directory: "C:\Users\user\Desktop\linear-note-plot-"
duration_estimate: "~5 hours"
---

## Completed Work (2 PRs)

### PR #92: Wiki 리디자인 + 첨부파일 IDB + 시드 데이터
- Wiki 파일 분리 (1500줄→6파일) + Dashboard/List/ArticleReader 리디자인
- 첨부파일: data URL → IDB blob (attachment:// 스킴, useAttachmentUrl 훅)
- Zettelkasten 튜토리얼 시드 9 notes + store v46 마이그레이션
- 카테고리 클릭 필터 + TOC Section/Subsection + Wiki stub 템플릿
- + Add file (WikiCollectionSidebar) + Infobox editable

### PR #93: Wiki Block Editor (Assembly Model) 1~3단계
- WikiArticle + WikiBlock 타입 (lib/types.ts) — Wiki ≠ Note, 별도 엔티티
- createWikiArticlesSlice: 10개 액션 (CRUD + 블록 5종 조작)
- 블록 렌더러: Section(번호+접기+편집)/Text(textarea)/NoteRef(검색+삽입)/Image(업로드)
- WikiArticleView: TOC + 블록 + Infobox 사이드바
- Section 자동 번호 (computeSectionNumbers, TOC↔본문 동기화)
- 시드 WikiArticle 3개 + Note→WikiArticle 자동 라우팅
- Store v48

## Remaining Tasks
- [ ] Wiki Block Editor 후속: 블록 드래그 이동 (dnd-kit), Section 접기/펼치기 구현
- [ ] 기존 isWiki 노트 → WikiArticle 완전 마이그레이션 (레거시 제거)
- [ ] NoteRef lazy load (Intersection Observer)
- [ ] Phosphor Icons 마이그레이션

## Key Decisions
- Wiki = 노트 조립품 (Assembly Model) — 노트는 원재료, 위키는 노트를 블록으로 참조하여 아티클 조립
- 에디터 타입은 isWiki/WikiArticle이 자동 결정 (유저 선택 없음)
- Section 번호는 JS 계산 (useMemo, O(n)) — CSS counter 대신. TOC와 100% 동기화

## Technical Learnings
- Zustand persist partialize로 content가 strip됨 → seed body는 onRehydrate에서 persist
- IDB store name = "plot-zustand" (plot-store 아님)
- React hooks: early return 전에 모든 hooks 호출 필수
- WikiArticle은 Note와 별도 store slice — blocks 배열이 source of truth

## Files Modified (주요)
- components/wiki-editor/wiki-block-renderer.tsx — 신규, 블록 4종 렌더러
- components/wiki-editor/wiki-article-view.tsx — 신규, 전체 아티클 뷰
- lib/store/slices/wiki-articles.ts — 신규, WikiArticle CRUD slice
- lib/types.ts — WikiArticle, WikiBlock, WikiBlockType 타입
- lib/store/seeds.ts — SEED_WIKI_ARTICLES 3개 + 영어 튜토리얼
- lib/store/index.ts — v48, wiki-articles slice 등록
- lib/store/migrate.ts — v47+v48 마이그레이션
- components/views/wiki-view.tsx — WikiArticle 렌더 분기 + 자동 라우팅
- components/views/wiki-dashboard.tsx — WikiArticles 카드 섹션
