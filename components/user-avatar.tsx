"use client"

/**
 * UserAvatar — workspace identity anchor in GlobalTopBar (left cluster).
 *
 * Chunk 2 of 'P' brand mark fix (2026-05-25): the gradient "P" badge that used
 * to live atop the activity bar moves here as the workspace identity anchor.
 * Visual identity preserved via `.a-brand__mark` className reuse (globals.css)
 * — 28×28 rounded-7px, accent gradient, white "P" initial. Aligns precisely
 * with the 28×28 chrome buttons (theme/settings/trash) for h-12 bar harmony.
 *
 * Chunk 3 (deferred): convert to dropdown trigger that absorbs PanelsMenu
 * items + theme + settings/trash links + (future) account/sign out. For now
 * the avatar is purely visual — no click action.
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
