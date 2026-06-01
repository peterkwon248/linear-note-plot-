import Link from "next/link"

/**
 * Shared frame for the redesign previews. Inherits root layout (Pretendard +
 * globals.css + theme). A slim toolbar links back to the surface index.
 */
export default function RedesignPreviewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-border px-4 text-2xs text-muted-foreground">
        <Link href="/preview/redesign" className="font-medium hover:text-foreground">
          Plot Redesign Preview
        </Link>
        <span className="opacity-40">·</span>
        <span>preview-first · 라이브 0 touch</span>
      </div>
      {children}
    </div>
  )
}
