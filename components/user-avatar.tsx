"use client"

/**
 * UserAvatar — workspace identity anchor in GlobalTopBar (left cluster).
 *
 * Chunk 1+2 (2026-05-25): 'P' brand mark moved from activity bar to GlobalTopBar
 * as workspace identity anchor. `.a-brand__mark` className preserves the gradient
 * badge visual (28×28 rounded-7px, space-home→space-wiki gradient, white "P").
 *
 * Chunk 3 → Reverted (2026-05-25): user feedback — PanelsMenu hamburger should
 * stay separate (next to the recently-viewed button) and Settings/Trash should
 * sit in the right cluster alongside the theme toggle. UserAvatar is now a
 * pure visual anchor — no click action. Workspace identity only.
 */

export function UserAvatar() {
  // settings.userName will populate this once a userName field is added
  // (separate chunk). For now, the workspace initial is hardcoded "P" to
  // preserve the existing identity users are familiar with.
  const initial = "P"

  return (
    <div
      className="a-brand__mark shrink-0"
      aria-label="Workspace"
      title="Workspace"
    >
      {initial}
    </div>
  )
}
