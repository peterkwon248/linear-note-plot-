"use client"

import { HomeView } from "@/components/redesign/home/home-view"
import { homeMock } from "@/components/redesign/home/home.mock"

/**
 * Home surface — isolated render of the pure presentational `HomeView` driven
 * by mock data. This is the exact unit handed to Open Design. The wrapper gives
 * the surface a flex height so its internal `flex-1 overflow-y-auto` scrolls
 * (live: provided by the app shell).
 */
export default function HomePreviewPage() {
  return (
    <div className="flex h-[calc(100vh-2.25rem)] flex-col">
      <HomeView vm={homeMock} />
    </div>
  )
}
