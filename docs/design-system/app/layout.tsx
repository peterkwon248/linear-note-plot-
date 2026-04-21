import type { Metadata, Viewport } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Plot Book Editor",
  description: "A local-first, Linear-inspired knowledge management editor with wiki, magazine, newspaper, and book shells.",
}

export const viewport: Viewport = {
  themeColor: "#141417",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className="dark bg-[var(--background)]">
      <body className="min-h-screen">{children}</body>
    </html>
  )
}
