/** Reusable shortcut row — description on the left, keycaps on the right.
 *  Styling matches the existing Settings > Shortcuts page exactly. */

export function ShortcutRow({
  keys,
  description,
}: {
  keys: string[]
  description: string
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-ui text-foreground">{description}</span>
      <div className="flex items-center gap-1">
        {keys.map((key, i) => (
          <kbd
            key={`${key}-${i}`}
            className="inline-flex min-w-[24px] items-center justify-center rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-2xs text-muted-foreground"
          >
            {key}
          </kbd>
        ))}
      </div>
    </div>
  )
}
