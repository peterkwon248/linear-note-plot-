"use client"

import { useEffect, useState, type ReactNode } from "react"

/**
 * Renders children only after the component has mounted on the client.
 *
 * Use this to wrap interactive widgets that produce hydration mismatches
 * because of unstable IDs (e.g. Radix Popover's `aria-controls` references
 * an `id` generated via React.useId(), which can differ between server and
 * client renders during dev / certain Radix versions).
 *
 * Trade-off: the wrapped subtree won't render on the server. For trigger
 * buttons that should remain visible during SSR, prefer rendering the
 * button outside this wrapper and only wrapping the popover content / state
 * machinery.
 */
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: ReactNode
  fallback?: ReactNode
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  if (!mounted) return <>{fallback}</>
  return <>{children}</>
}
