// Plot Book — Types

export type ShellId = "wiki" | "magazine" | "newspaper" | "book" | "blank"

export type TextureType = "none" | "paper" | "newsprint" | "dots" | "linen"

export type FontPair = "default" | "classic" | "modern" | "editorial" | "bauhaus"

export type ChapterStyle = "default" | "roman" | "numeric" | "ornament" | "rule"

export type MarginSize = "narrow" | "standard" | "wide"

export interface Shell {
  id: ShellId
  label: string
  subtitle: string
  bg: string
  fg: string
  texture: TextureType
  bodyFont: string
  displayFont: string
  cols: number
  maxWidth: number
  cardBorder: string
  cardRadius: number
}

export interface ThemeConfig {
  bgColor: string
  texture: TextureType
  cardBorder: string
  fontPair: FontPair
  accentColor: string
  textColor: string
  quoteColor: string
  cols: number
  margins: MarginSize
  chapterStyle: ChapterStyle
}

export interface DecorationConfig {
  ribbon: boolean
  ribbonColor: string
  bookmark: boolean
  ornament: boolean
  flipbook: boolean
}

export interface Block {
  id: string
  type: BlockType
  col: number
  span: number
  row: number
  rowSpan?: number
  text: string
  props?: Record<string, unknown>
}

export type BlockType =
  | "paragraph"
  | "heading"
  | "image"
  | "quote"
  | "divider"
  // wiki
  | "infobox"
  | "toc"
  | "footnote"
  | "hatnote"
  // magazine
  | "masthead"
  | "nameplate"
  | "headline"
  | "deck"
  | "byline"
  | "dropcap"
  | "pullquote"
  // newspaper
  | "flag"
  | "datestrip"
  | "columnrule"
  | "kicker"
  | "jumpline"
  // book
  | "cover"
  | "backcover"
  | "chapter"
  | "ornament"
  | "colophon"
  | "runninghead"

export interface BlockDefinition {
  label: string
  hint: string
  glyph: string
  shells: "*" | ShellId[]
  span: number
}

export interface Page {
  kind: "cover" | "blank" | "titlepage" | "chapter" | "body"
  title?: string
  subtitle?: string
  author?: string
  publisher?: string
  num?: string
  text?: string
  pageNo?: number
}
