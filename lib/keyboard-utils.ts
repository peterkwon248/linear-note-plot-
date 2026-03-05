/**
 * Canonical guard — returns `true` when the keyboard event target is an
 * editable element (INPUT, TEXTAREA, SELECT, contentEditable) or resides
 * inside an open Radix Dialog / Popper.
 *
 * Shared by the single global-shortcut hook so every shortcut uses the
 * same guard logic.
 */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  ) {
    return true
  }
  if (
    target.closest("[role='dialog']") ||
    target.closest("[data-radix-popper-content-wrapper]")
  ) {
    return true
  }
  return false
}
