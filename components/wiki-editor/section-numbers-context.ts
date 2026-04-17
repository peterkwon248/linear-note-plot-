"use client"

import { createContext } from "react"

/**
 * Phase 3.1-B — Section numbers shared across nested renderers.
 *
 * Lives in its own module so both `wiki-article-renderer` (producer) and
 * `wiki-block-renderer` (consumer via ColumnGroupBlock) can import without
 * creating a circular dependency.
 */
export const SectionNumbersContext = createContext<Map<string, string>>(new Map())
