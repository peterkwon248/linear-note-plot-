/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export → out/ for local-first desktop shell (Tauri/Electron).
  // All app data lives client-side (IndexedDB); no server runtime needed.
  // Dynamic routes are unified into a single client-side catch-all so the
  // static export has no per-id pages to pre-render (see app/(app)/[[...slug]]).
  // PRODUCTION ONLY: output:export pins dynamic segments to the exact paths in
  // generateStaticParams (the placeholder `/_`), so /folder/x|/tag/x|… would 500
  // even in dev if applied there. In dev we keep the normal server so the
  // catch-all renders any path on demand; the desktop shell (P1) serves
  // unmatched paths from the exported bundle via SPA fallback.
  output: process.env.NODE_ENV === "production" ? "export" : undefined,
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: import.meta.dirname,
  },
}

export default nextConfig
