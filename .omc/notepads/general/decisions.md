# Architectural Decisions

## 2026-03-16
- **Activity UI 삭제, event 인프라 유지**: noteEvents 배열 + datalog 헬퍼 + appendEvent는 Insights 뷰에서 재사용 예정
- **activity-timeline.tsx 유지**: note-inspector의 History 섹션에서 개별 노트 활동 이력 표시에 사용
- **고아 코드 대량 정리**: -3,258줄. 기능 추가 전에 정리하는 것이 코드베이스 건강에 좋음 ("기능 5개의 98점" 철학)
