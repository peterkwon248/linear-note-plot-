"use client"

import { useState, useRef, useEffect } from "react"
import { RELATION_TYPE_CONFIG, RELATION_TYPES } from "@/lib/relation-helpers"
import type { OntologyFilters } from "./ontology-graph-canvas"
import type { Tag, Label, RelationType } from "@/lib/types"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"

interface OntologyFilterBarProps {
  filters: OntologyFilters
  onChange: (filters: OntologyFilters) => void
  tags: Tag[]
  labels: Label[]
  searchQuery: string
  onSearchChange: (query: string) => void
  searchMatchCount: number | null
  relationTypeCounts: Map<RelationType, number>
}

export function OntologyFilterBar({
  filters,
  onChange,
  tags,
  labels,
  searchQuery,
  onSearchChange,
  searchMatchCount,
  relationTypeCounts,
}: OntologyFilterBarProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [tagSearch, setTagSearch] = useState("")
  const [labelSearch, setLabelSearch] = useState("")
  const [statusSearch, setStatusSearch] = useState("")
  const [relationsSearch, setRelationsSearch] = useState("")

  const closeDropdown = () => {
    setOpenDropdown(null)
    setTagSearch("")
    setLabelSearch("")
    setStatusSearch("")
    setRelationsSearch("")
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        closeDropdown()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleTagToggle = (tagId: string) => {
    const newTagIds = filters.tagIds.includes(tagId)
      ? filters.tagIds.filter((id) => id !== tagId)
      : [...filters.tagIds, tagId]
    onChange({ ...filters, tagIds: newTagIds })
  }

  const handleLabelSelect = (labelId: string | null) => {
    onChange({ ...filters, labelId })
    setOpenDropdown(null)
    setLabelSearch("")
  }

  const handleStatusSelect = (status: "inbox" | "capture" | "permanent" | "all") => {
    onChange({ ...filters, status })
    setOpenDropdown(null)
    setStatusSearch("")
  }

  const handleRelationTypeToggle = (type: RelationType) => {
    if (filters.relationTypes === "all") {
      // Switch from "all" to specific types (all except the clicked one)
      const newTypes = RELATION_TYPES.filter((t) => t !== type)
      onChange({ ...filters, relationTypes: newTypes })
    } else {
      const newTypes = (filters.relationTypes as RelationType[]).includes(type)
        ? (filters.relationTypes as RelationType[]).filter((t) => t !== type)
        : [...(filters.relationTypes as RelationType[]), type]

      if (newTypes.length === RELATION_TYPES.length) {
        onChange({ ...filters, relationTypes: "all" })
      } else {
        onChange({ ...filters, relationTypes: newTypes })
      }
    }
  }

  const handleWikilinksToggle = () => {
    onChange({ ...filters, showWikilinks: !filters.showWikilinks })
  }

  // Get display labels
  const selectedTag = filters.tagIds.length > 0 ? `Tags (${filters.tagIds.length})` : "Tags"
  const selectedLabel = filters.labelId
    ? labels.find((l) => l.id === filters.labelId)?.name ?? "Label"
    : "Label"
  const selectedStatus =
    filters.status === "all"
      ? "Status"
      : filters.status.charAt(0).toUpperCase() + filters.status.slice(1)

  const activeRelationCount =
    filters.relationTypes === "all"
      ? RELATION_TYPES.length
      : (filters.relationTypes as RelationType[]).length
  const selectedRelations =
    activeRelationCount < RELATION_TYPES.length
      ? `Relations (${activeRelationCount})`
      : "Relations"

  return (
    <div ref={dropdownRef} className="flex items-center gap-3 h-10 px-5 border-b border-border">
      {/* Tags Dropdown */}
      <div className="relative">
        <button
          onClick={() => { if (openDropdown === "tags") { closeDropdown() } else { setOpenDropdown("tags") } }}
          className="flex items-center gap-1 text-note px-2.5 py-1 rounded hover:bg-secondary transition-colors text-muted-foreground"
        >
          {selectedTag}
          <CaretDown size={12} weight="regular" />
        </button>
        {openDropdown === "tags" && (
          <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-md shadow-lg p-1 z-50 min-w-max">
            {tags.length === 0 ? (
              <div className="px-2 py-1 text-note text-muted-foreground">No tags</div>
            ) : (
              <>
                <div className="px-1 pb-1">
                  <input
                    type="text"
                    placeholder="Filter..."
                    className="w-full bg-transparent border-b border-border px-2 py-1.5 text-xs outline-none placeholder:text-muted-foreground"
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                </div>
                {tags
                  .filter((tag) => !tagSearch || tag.name.toLowerCase().includes(tagSearch.toLowerCase()))
                  .map((tag) => (
                    <label
                      key={tag.id}
                      className="flex items-center gap-2 px-2 py-1 text-note hover:bg-secondary rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.tagIds.includes(tag.id)}
                        onChange={() => handleTagToggle(tag.id)}
                        className="w-3 h-3"
                      />
                      <span>{tag.name}</span>
                    </label>
                  ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Label Dropdown */}
      <div className="relative">
        <button
          onClick={() => { if (openDropdown === "label") { closeDropdown() } else { setOpenDropdown("label") } }}
          className="flex items-center gap-1 text-note px-2.5 py-1 rounded hover:bg-secondary transition-colors text-muted-foreground"
        >
          {selectedLabel}
          <CaretDown size={12} weight="regular" />
        </button>
        {openDropdown === "label" && (
          <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-md shadow-lg p-1 z-50 min-w-max max-h-80 overflow-y-auto">
            <div className="px-1 pb-1">
              <input
                type="text"
                placeholder="Filter..."
                className="w-full bg-transparent border-b border-border px-2 py-1.5 text-xs outline-none placeholder:text-muted-foreground"
                value={labelSearch}
                onChange={(e) => setLabelSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
            {!labelSearch && (
              <button
                onClick={() => handleLabelSelect(null)}
                className={`block w-full text-left px-2 py-1 text-note rounded hover:bg-secondary ${
                  filters.labelId === null ? "bg-secondary" : ""
                }`}
              >
                All
              </button>
            )}
            {labels
              .filter((label) => !labelSearch || label.name.toLowerCase().includes(labelSearch.toLowerCase()))
              .map((label) => (
                <button
                  key={label.id}
                  onClick={() => handleLabelSelect(label.id)}
                  className={`block w-full text-left px-2 py-1 text-note rounded hover:bg-secondary ${
                    filters.labelId === label.id ? "bg-secondary" : ""
                  }`}
                >
                  {label.name}
                </button>
              ))}
          </div>
        )}
      </div>

      {/* Status Dropdown */}
      <div className="relative">
        <button
          onClick={() => { if (openDropdown === "status") { closeDropdown() } else { setOpenDropdown("status") } }}
          className="flex items-center gap-1 text-note px-2.5 py-1 rounded hover:bg-secondary transition-colors text-muted-foreground"
        >
          {selectedStatus}
          <CaretDown size={12} weight="regular" />
        </button>
        {openDropdown === "status" && (
          <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-md shadow-lg p-1 z-50 min-w-max">
            <div className="px-1 pb-1">
              <input
                type="text"
                placeholder="Filter..."
                className="w-full bg-transparent border-b border-border px-2 py-1.5 text-xs outline-none placeholder:text-muted-foreground"
                value={statusSearch}
                onChange={(e) => setStatusSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
            {(["all", "inbox", "capture", "permanent"] as const)
              .filter((status) => {
                if (!statusSearch) return true
                const label = status === "all" ? "all" : status
                return label.toLowerCase().includes(statusSearch.toLowerCase())
              })
              .map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusSelect(status)}
                  className={`block w-full text-left px-2 py-1 text-note rounded hover:bg-secondary ${
                    filters.status === status ? "bg-secondary" : ""
                  }`}
                >
                  {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
          </div>
        )}
      </div>

      {/* Separator */}
      <div className="w-px h-5 bg-border" />

      {/* Relations Dropdown */}
      <div className="relative">
        <button
          onClick={() => { if (openDropdown === "relations") { closeDropdown() } else { setOpenDropdown("relations") } }}
          className="flex items-center gap-1 text-note px-2.5 py-1 rounded hover:bg-secondary transition-colors text-muted-foreground"
        >
          {selectedRelations}
          <CaretDown size={12} weight="regular" />
        </button>
        {openDropdown === "relations" && (
          <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-md shadow-lg p-1 z-50 min-w-max">
            <div className="px-1 pb-1">
              <input
                type="text"
                placeholder="Filter..."
                className="w-full bg-transparent border-b border-border px-2 py-1.5 text-xs outline-none placeholder:text-muted-foreground"
                value={relationsSearch}
                onChange={(e) => setRelationsSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
            {RELATION_TYPES
              .filter((type) => {
                if (!relationsSearch) return true
                const config = RELATION_TYPE_CONFIG[type]
                return config.label.toLowerCase().includes(relationsSearch.toLowerCase()) ||
                  type.toLowerCase().includes(relationsSearch.toLowerCase())
              })
              .map((type) => {
                const isActive =
                  filters.relationTypes === "all" ||
                  (filters.relationTypes as RelationType[]).includes(type)
                const config = RELATION_TYPE_CONFIG[type]
                const count = relationTypeCounts.get(type) ?? 0

                return (
                  <button
                    key={type}
                    onClick={() => handleRelationTypeToggle(type)}
                    className="flex items-center gap-2 w-full text-left px-2 py-1 text-note rounded hover:bg-secondary cursor-pointer"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: isActive ? config.color : "transparent",
                        border: `1.5px solid ${config.color}`,
                      }}
                    />
                    <span className={isActive ? "" : "text-muted-foreground"}>{config.label}</span>
                    <span className="ml-auto text-2xs text-muted-foreground/50">{count}</span>
                  </button>
                )
              })}
          </div>
        )}
      </div>

      {/* Wikilinks Toggle */}
      <button
        onClick={handleWikilinksToggle}
        className={`text-note px-2.5 py-1 rounded transition-colors ${
          filters.showWikilinks
            ? "bg-secondary hover:bg-secondary/80"
            : "hover:bg-secondary/50"
        }`}
        title="Toggle wikilinks"
      >
        Wiki
      </button>

      {/* Tag Nodes Toggle */}
      <button
        onClick={() => onChange({ ...filters, showTagNodes: !filters.showTagNodes })}
        className={`text-note px-2.5 py-1 rounded transition-colors ${
          filters.showTagNodes
            ? "bg-secondary hover:bg-secondary/80"
            : "hover:bg-secondary/50"
        }`}
        title="Toggle tag nodes"
      >
        Tags
      </button>

      {/* MagnifyingGlass — next to Wiki */}
      <div className="flex items-center">
        <div className="flex items-center bg-secondary/50 rounded-md px-2 py-1">
          <MagnifyingGlass className="text-muted-foreground mr-1.5 shrink-0" size={14} weight="regular" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="MagnifyingGlass nodes…"
            className="bg-transparent text-note text-foreground placeholder:text-muted-foreground/50 outline-none w-36"
          />
          {searchMatchCount !== null && (
            <span className="text-2xs text-muted-foreground/60 ml-1.5 shrink-0">
              {searchMatchCount}
            </span>
          )}
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="ml-1 text-muted-foreground/40 hover:text-muted-foreground shrink-0"
            >
              <PhX size={12} weight="regular" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
