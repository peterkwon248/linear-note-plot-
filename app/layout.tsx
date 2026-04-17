import type { Metadata } from 'next'
import { Geist, Geist_Mono, Merriweather, Noto_Serif_KR, Playfair_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { SettingsSync } from '@/components/settings-sync'
import { BodyProvider } from '@/components/providers/body-provider'
import './globals.css'

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
// Phase 3.1-C: Magazine serif fonts for editorial typography mode
const merriweather = Merriweather({ subsets: ["latin"], weight: ["400", "700"], style: ["normal", "italic"], variable: "--font-merriweather", display: "swap" });
const notoSerifKR = Noto_Serif_KR({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-noto-serif-kr", display: "swap" });
// Phase 3.1-C: Playfair Display for Mag (editorial) mode — high-contrast display serif
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "700", "900"], style: ["normal", "italic"], variable: "--font-playfair", display: "swap" });

export const metadata: Metadata = {
  title: 'Plot',
  description: 'A beautiful note-taking app',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} ${merriweather.variable} ${notoSerifKR.variable} ${playfair.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <SettingsSync />
          <BodyProvider>
            {children}
          </BodyProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
