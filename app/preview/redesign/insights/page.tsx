"use client"

import { InsightsView } from "@/components/redesign/insights/insights-view"
import { insightsMock } from "@/components/redesign/insights/insights.mock"

/**
 * Insights surface — isolated render of the pure presentational `InsightsView`
 * driven by mock data. Open Design 핸드오프 단위.
 *
 * 라이브 앱 셸이 제공하는 flex 높이를 여기서 재현: ViewHeader chrome(~2.25rem)
 * 제외 후 남은 전체 높이 = overflow-y-auto 스크롤 영역.
 */
export default function InsightsPreviewPage() {
  return (
    <div className="flex h-[calc(100vh-2.25rem)] flex-col">
      <InsightsView vm={insightsMock} />
    </div>
  )
}
