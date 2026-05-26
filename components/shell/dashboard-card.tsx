import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export function DashboardCard({
  eyebrow,
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
  accent = "neutral",
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
  accent?: "neutral" | "violet" | "cyan" | "amber" | "emerald"
}) {
  return (
    <section className={cn("plot-card", className)} data-accent={accent}>
      <div className="plot-card__header">
        <div className="plot-card__copy">
          {eyebrow ? <span className="plot-card__eyebrow">{eyebrow}</span> : null}
          <div className="plot-card__title-row">
            <h2 className="plot-card__title">{title}</h2>
            {action ? <div className="plot-card__action">{action}</div> : null}
          </div>
          {description ? <p className="plot-card__description">{description}</p> : null}
        </div>
      </div>
      <div className={cn("plot-card__body", bodyClassName)}>{children}</div>
    </section>
  )
}
