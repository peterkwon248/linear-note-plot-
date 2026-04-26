/**
 * Editor Icon Barrel — Central icon mapping for all editor components.
 *
 * Uses Remix Icon (@remixicon/react) for the editor UI.
 * Non-editor UI (sidebar, navigation) continues to use Phosphor Icons.
 *
 * All icons are re-exported under their original Phosphor names
 * so consuming files only need to change their import path:
 *   BEFORE: import { Plus } from "@phosphor-icons/react/dist/ssr/Plus"
 *   AFTER:  import { Plus } from "@/lib/editor/editor-icons"
 *
 * Note: Remix icons accept `size` (number) and `className` props.
 * They do NOT have a `weight` prop like Phosphor icons.
 */

import {
  // Arrows & Navigation
  RiReplyLine,
  RiArrowGoForwardLine,
  RiArrowGoBackLine,
  RiArrowDownLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiArrowUpLine,
  RiExternalLinkLine,
  RiRefreshLine,
  RiContractLine,
  RiArrowDownSLine,
  RiArrowRightSLine,
  RiExpandUpDownLine,

  // Content & Documents
  RiArticleLine,
  RiAsterisk,
  RiBookLine,
  RiBookOpenLine,
  RiBookmarkLine,
  RiCalendarLine,
  RiFileTextLine,
  RiFileUploadLine,
  RiFolderOpenLine,
  RiFolderLine,
  RiStickyNoteLine,

  // Actions & UI
  RiChat3Line,
  RiCheckLine,
  RiCheckboxCircleLine,
  RiCheckboxLine,
  RiLoader4Line,
  RiContrastLine,
  RiClipboardLine,
  RiFileCopyLine,
  RiDownloadLine,
  RiFormatClear,
  RiEyeLine,
  RiEyeOffLine,
  RiFilterLine,
  RiMoreLine,
  RiDraggable,
  RiSearchLine,
  RiDeleteBinLine,
  RiInboxLine,
  RiCloseLine,
  RiCloseCircleLine,
  RiCheckboxMultipleLine,

  // Code
  RiCodeSSlashLine,
  RiCodeBlock,

  // Layout
  RiLayoutColumnLine,
  RiLayoutLine,
  RiLayoutRowLine,
  RiTableLine,

  // Data & Objects
  RiShapeLine,
  RiDatabase2Line,
  RiGitMergeLine,
  RiGlobalLine,

  // Editing & Formatting
  RiMarkPenLine,
  RiImageLine,
  RiCornerDownLeftLine,
  RiHashtag,
  RiLink,
  RiLinkUnlink,
  RiLinksLine,
  RiListUnordered,
  RiListOrdered,
  RiMapPinLine,
  RiFunctionLine,
  RiSubtractLine,
  RiEditLine,
  RiPaintLine,
  RiAttachmentLine,
  RiPencilLine,
  RiAddLine,
  RiPushpin2Line,
  RiDoubleQuotesL,
  RiScissorsLine,
  RiSortAsc,
  RiSortDesc,
  RiPriceTag3Line,
  RiMegaphoneLine,
  RiCakeLine,
  RiTimerLine,
  RiStarLine,
  RiSparklingLine,
  RiPushpinLine,

  // Settings & Info
  RiSettings3Line,
  RiProfileLine,
  RiInformationLine,
  RiLightbulbLine,
  RiAlertLine,

  // Text Formatting (Remix uses short names without "Line" suffix)
  RiAlignCenter,
  RiAlignJustify,
  RiAlignLeft,
  RiAlignRight,
  RiBold,
  RiHeading,
  RiH1,
  RiH2,
  RiH3,
  RiIndentIncrease,
  RiItalic,
  RiIndentDecrease,
  RiStrikethrough,
  RiSubscript,
  RiSuperscript,
  RiText,
  RiUnderline,
  RiParagraph,
} from "@remixicon/react"

// ---------------------------------------------------------------------------
// Re-exports: Phosphor name → Remix icon
// ---------------------------------------------------------------------------

// Arrows & Navigation
export { RiReplyLine as ArrowBendUpLeft }
export { RiArrowGoForwardLine as ArrowClockwise }
export { RiArrowGoBackLine as ArrowCounterClockwise }
export { RiArrowDownLine as ArrowDown }
export { RiArrowLeftLine as ArrowLeft }
export { RiArrowDownLine as ArrowLineDown }
export { RiArrowLeftLine as ArrowLineLeft }
export { RiArrowRightLine as ArrowLineRight }
export { RiArrowUpLine as ArrowLineUp }
export { RiArrowRightLine as ArrowRight }
export { RiExternalLinkLine as ArrowSquareOut }
export { RiArrowUpLine as ArrowUp }
export { RiRefreshLine as ArrowsClockwise }
export { RiContractLine as ArrowsIn }
export { RiArrowDownSLine as CaretDown }
export { RiArrowRightSLine as CaretRight }
export { RiExpandUpDownLine as CaretUpDown }

// Content & Documents
export { RiArticleLine as Article }
export { RiAsterisk as Asterisk }
export { RiBookLine as Book }
export { RiBookOpenLine as BookOpen }
export { RiBookmarkLine as BookmarkSimple }
export { RiCalendarLine as CalendarBlank }
export { RiCalendarLine as CalendarDots }
export { RiFileTextLine as FileText }
export { RiFileUploadLine as FileArrowUp }
export { RiFolderOpenLine as FolderOpen }
export { RiFolderLine as FolderSimple }
export { RiStickyNoteLine as Note }

// Communication
export { RiChat3Line as Chat }

// Checkmarks & Status
export { RiCheckLine as Check }
export { RiCheckboxCircleLine as CheckCircle }
export { RiCheckboxLine as CheckSquare }
export { RiLoader4Line as CircleDashed }
export { RiContrastLine as CircleHalf }

// Clipboard & Copy
export { RiClipboardLine as ClipboardText }
export { RiFileCopyLine as Copy }

// Code
export { RiCodeSSlashLine as Code }
export { RiCodeBlock as CodeBlock }

// Layout
export { RiLayoutColumnLine as Columns }
export { RiLayoutLine as Layout }
export { RiLayoutRowLine as Rows }
export { RiTableLine as Table }

// Data & Objects
export { RiShapeLine as Cube }
export { RiDatabase2Line as Database }
export { RiGitMergeLine as GitMerge }
export { RiGlobalLine as Globe }

// Drag & Menu
export { RiDraggable as DotsSixVertical }
export { RiMoreLine as DotsThree }

// Actions
export { RiDownloadLine as DownloadSimple }
export { RiFormatClear as Eraser }
export { RiEyeLine as Eye }
export { RiEyeOffLine as EyeSlash }
export { RiFilterLine as Funnel }
export { RiSearchLine as MagnifyingGlass }
export { RiDeleteBinLine as Trash }
export { RiInboxLine as Tray }
export { RiCloseLine as X }
export { RiCloseCircleLine as XCircle }
export { RiScissorsLine as Scissors }

// Selection & Sort
export { RiCheckboxMultipleLine as SelectionAll }
export { RiSortAsc as SortAscending }
export { RiSortDesc as SortDescending }

// Editing
export { RiMarkPenLine as HighlighterCircle }
export { RiProfileLine as IdentificationCard }
export { RiImageLine as Image }
export { RiCornerDownLeftLine as KeyReturn }
export { RiHashtag as Hash }
export { RiLink as Link }
export { RiLinkUnlink as LinkBreak }
export { RiLinksLine as LinkSimple }
export { RiListUnordered as ListBullets }
export { RiListOrdered as ListNumbers }
export { RiMapPinLine as MapPin }
export { RiFunctionLine as MathOperations }
export { RiSubtractLine as Minus }
export { RiEditLine as NotePencil }
export { RiPaintLine as PaintBucket }
export { RiAttachmentLine as Paperclip }
export { RiPencilLine as PencilSimple }
export { RiAddLine as Plus }
export { RiPushpin2Line as PushPin }
export { RiDoubleQuotesL as Quotes }
export { RiMegaphoneLine as Megaphone }
export { RiPriceTag3Line as Tag }
export { RiCakeLine as Cake }
export { RiTimerLine as Timer }
export { RiStarLine as Star }
export { RiSparklingLine as Sparkle }
export { RiPushpinLine as Pushpin }

// Settings & Info
export { RiSettings3Line as GearSix }
export { RiInformationLine as Info }
export { RiLightbulbLine as Lightbulb }
export { RiAlertLine as Warning }

// Text Formatting
export { RiAlignCenter as TextAlignCenter }
export { RiAlignJustify as TextAlignJustify }
export { RiAlignLeft as TextAlignLeft }
export { RiAlignRight as TextAlignRight }
export { RiBold as TextB }
export { RiHeading as TextH }
export { RiH1 as TextHOne }
export { RiH2 as TextHTwo }
export { RiH3 as TextHThree }
export { RiIndentIncrease as TextIndent }
export { RiItalic as TextItalic }
export { RiIndentDecrease as TextOutdent }
export { RiStrikethrough as TextStrikethrough }
export { RiSubscript as TextSubscript }
export { RiSuperscript as TextSuperscript }
export { RiText as TextT }
export { RiUnderline as TextUnderline }
export { RiParagraph as Paragraph }
