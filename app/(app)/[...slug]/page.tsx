import { CatchAllRoute } from "@/components/views/catch-all-route"

/**
 * Required catch-all for the static-export SPA. Captures the former dynamic
 * routes (/folder/[id], /tag/[id], /label/[id], /books/[id]) plus any other
 * unmatched path. Explicit static pages (/notes, /inbox, …) take priority, so
 * this only receives those dynamic prefixes and genuinely-undefined paths.
 *
 * `output:'export'` requires a `generateStaticParams()` on dynamic segments;
 * returning [] (with dynamicParams=false) satisfies that without emitting any
 * per-id HTML — the route is resolved on the client by CatchAllRoute. The app
 * is an always-mounted SPA, so the real view lives in (app)/layout.tsx.
 *
 * (Optional `[[...slug]]` would also match `/`, colliding with the index
 * (app)/page.tsx — required `[...slug]` matches 1+ segments only.)
 */
export function generateStaticParams() {
  // output:'export' rejects an empty array as "missing" — a dynamic segment
  // must prerender >= 1 path. One placeholder emits a single SPA shell HTML
  // (out/_/index.html) that boots the always-mounted layout; CatchAllRoute
  // resolves the real path at runtime. dev renders /folder/x etc. on demand
  // (dynamicParams default = true), so it is intentionally not set to false.
  return [{ slug: ["_"] }]
}

export default function CatchAllPage() {
  return <CatchAllRoute />
}
