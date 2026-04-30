/**
 * wiki-hierarchy.ts
 *
 * Parent-child article hierarchy helpers.
 * Separate from WikiCategory (DAG multi-parent system).
 * parentArticleId is a single-parent tree relationship.
 */

import type { WikiArticle } from "./types"

interface StoreSnapshot {
  wikiArticles: WikiArticle[]
}

const MAX_DEPTH = 20

/**
 * Return the ancestor chain from direct parent up to root.
 * Stops if a cycle is detected (visited set) or depth exceeds MAX_DEPTH.
 * Does NOT include the article itself.
 */
export function getAncestors(articleId: string, store: StoreSnapshot): WikiArticle[] {
  const ancestors: WikiArticle[] = []
  const visited = new Set<string>([articleId])
  let current = store.wikiArticles.find((a) => a.id === articleId)
  let depth = 0

  while (current?.parentArticleId && depth < MAX_DEPTH) {
    const parentId = current.parentArticleId
    if (visited.has(parentId)) break // cycle guard
    visited.add(parentId)
    const parent = store.wikiArticles.find((a) => a.id === parentId)
    if (!parent) break
    ancestors.push(parent)
    current = parent
    depth++
  }

  return ancestors
}

/**
 * Return direct children of articleId (articles whose parentArticleId === articleId).
 */
export function getChildren(articleId: string, store: StoreSnapshot): WikiArticle[] {
  return store.wikiArticles.filter((a) => a.parentArticleId === articleId)
}

/**
 * Return all descendant IDs (BFS) of articleId, including articleId itself.
 * Uses a visited Set to handle corrupt data cycles.
 */
export function getDescendants(articleId: string, store: StoreSnapshot): Set<string> {
  const visited = new Set<string>([articleId])
  const queue: string[] = [articleId]

  while (queue.length > 0) {
    const current = queue.shift()!
    for (const a of store.wikiArticles) {
      if (a.parentArticleId === current && !visited.has(a.id)) {
        visited.add(a.id)
        queue.push(a.id)
      }
    }
  }

  return visited
}

/**
 * Returns true if setting articleId's parent to candidateParentId would create a cycle.
 * Cycle condition: candidateParentId is a descendant of articleId (or equals articleId).
 */
export function wouldCreateCycle(
  articleId: string,
  candidateParentId: string,
  store: StoreSnapshot,
): boolean {
  if (articleId === candidateParentId) return true
  const descendants = getDescendants(articleId, store)
  return descendants.has(candidateParentId)
}

/* ── Role classification ──────────────────────────────── */

export type WikiArticleRole = "root" | "parent" | "child" | "solo"

/**
 * Classify a wiki article's hierarchical role among all articles.
 *
 * Root   = no parent, has children  (시작점)
 * Parent = has parent, has children (중간 노드, branch)
 * Child  = has parent, no children  (말단)
 * Solo   = no parent, no children   (고립)
 *
 * Roles are mutually exclusive.
 */
export function classifyWikiArticleRole(
  articleId: string,
  store: { wikiArticles: WikiArticle[] },
): WikiArticleRole {
  const article = store.wikiArticles.find((a) => a.id === articleId)
  if (!article) return "solo"
  const hasParent = !!article.parentArticleId
  const hasChildren = store.wikiArticles.some((a) => a.parentArticleId === articleId)
  if (hasParent && hasChildren) return "parent"
  if (hasParent) return "child"
  if (hasChildren) return "root"
  return "solo"
}
