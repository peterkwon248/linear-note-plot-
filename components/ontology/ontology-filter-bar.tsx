"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Search, X } from "lucide-react"
import { RELATION_TYPE_CONFIG, RELATION_TYPES } from "@/lib/relation-helpers"
import type { OntologyFilters } from "./ontology-graph-canvas"
import type { Tag, Label, RelationType } from "@/lib/types"

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

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
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
  }

  const handleStatusSelect = (status: "inbox" | "capture" | "permanent" | "all") => {
    onChange({ ...filters, status })
    setOpenDropdown(null)
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
          onClick={() => setOpenDropdown(openDropdown === "tags" ? null : "tags")}
          className="flex items-center gap-1 text-note px-2.5 py-1 rounded hover:bg-secondary transition-colors text-muted-foreground"
        >
          {selectedTag}
          <ChevronDown className="w-3 h-3" />
        </button>
        {openDropdown === "tags" && (
          <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-md shadow-lg p-1 z-50 min-w-max">
            {tags.length === 0 ? (
              <div className="px-2 py-1 text-note text-muted-foreground">No tags</div>
            ) : (
              tags.map((tag) => (
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
              ))
            )}
          </div>
        )}
      </div>

      {/* Label Dropdown */}
      <div className="relative">
        <button
          onClick={() => setOpenDropdown(openDropdown === "label" ? null : "label")}
          className="flex items-center gap-1 text-note px-2.5 py-1 rounded hover:bg-secondary transition-colors text-muted-foreground"
        >
          {selectedLabel}
          <ChevronDown className="w-3 h-3" />
        </button>
        {openDropdown === "label" && (
          <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-md shadow-lg p-1 z-50 min-w-max">
            <button
              onClick={() => handleLabelSelect(null)}
              className={`block w-full text-left px-2 py-1 text-note rounded hover:bg-secondary ${
                filters.labelId === null ? "bg-secondary" : ""
              }`}
            >
              All
            </button>
            {labels.map((label) => (
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
          onClick={() => setOpenDropdown(openDropdown === "status" ? null : "status")}
          className="flex items-center gap-1 text-note px-2.5 py-1 rounded hover:bg-secondary transition-colors text-muted-foreground"
        >
          {selectedStatus}
          <ChevronDown className="w-3 h-3" />
        </button>
        {openDropdown === "status" && (
          <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-md shadow-lg p-1 z-50 min-w-max">
            {(["all", "inbox", "capture", "permanent"] as const).map((status) => (
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
          onClick={() => setOpenDropdown(openDropdown === "relations" ? null : "relations")}
          className="flex items-center gap-1 text-note px-2.5 py-1 rounded hover:bg-secondary transition-colors text-muted-foreground"
        >
          {selectedRelations}
          <ChevronDown className="w-3 h-3" />
        </button>
        {openDropdown === "relations" && (
          <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-md shadow-lg p-1 z-50 min-w-max">
            {RELATION_TYPES.map((type) => {
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

      {/* Search — next to Wiki */}
      <div className="flex items-center">
        <div className="flex items-center bg-secondary/50 rounded-md px-2 py-1">
          <Search className="w-3.5 h-3.5 text-muted-foreground mr-1.5 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search nodes…"
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
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
