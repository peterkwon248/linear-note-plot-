# Plot — Project Instructions

## Documentation Rules

### docs/CONTEXT.md 관리 규칙
- **Completed Features**: 최근 5개만 유지. 나머지는 docs/MEMORY.md의 PR 목록으로 위임
- **Implementation Order**: 완료된 항목은 즉시 삭제. 남은 작업만 유지
- **Key Design Decisions**: 유지 (미래 세션에 영향)
- **TODO: Future Work**: 완료 시 삭제
- 세션 끝날 때 CONTEXT.md와 MEMORY.md를 반드시 최신화

### docs/MEMORY.md 관리 규칙
- **Completed PRs**: append only (전체 이력 보존)
- **Ontology Engine**: phase 상태 업데이트 (DONE / IN PROGRESS / TODO)
- **Current Direction**: 향후 작업 순서를 Tier 기반으로 유지
- **Deferred**: 당장 안 하는 것들

## Development

### Build & Test
- `npm run build` — Next.js production build
- `npm run dev` — dev server (port 3002)
- `npm run test` — Vitest

### Stack
- Next.js 16, React 19, TypeScript, Zustand 5, TipTap 3, Tailwind v4
- Store: `lib/store/index.ts` — 20-slice, versioned migration (v69)
- Colors: `lib/colors.ts` — Global color constants (single source of truth)

### Conventions
- Korean communication (casual tone)
- Worktree-based development (branch per session)
- Commit workflow: commit -> push -> PR -> squash merge to main
- Design quality is top priority — Linear-level polish
