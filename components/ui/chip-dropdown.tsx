"use client"

import { useState } from "react"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { Check } from "@phosphor-icons/react/dist/ssr/Check"

export function ChipDropdown<T extends string>({
  value,
  options,
  onChange,
  disabledValues,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  disabledValues?: T[]
}) {
  const [open, setOpen] = useState(false)
  const currentLabel = options.find((o) => o.value === value)?.label ?? value

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-border-subtle bg-surface-overlay text-note font-medium"
      >
        {currentLabel}
        <CaretDown size={10} weight="bold" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 min-w-[140px] rounded-md border border-border-subtle bg-surface-overlay py-1 shadow-lg">
            {options.map((opt) => {
              const disabled = disabledValues?.includes(opt.value)
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    if (!disabled) {
                      onChange(opt.value)
                      setOpen(false)
                    }
                  }}
                  disabled={disabled}
                  className={`flex w-full items-center justify-between px-3 py-1.5 text-note ${
                    disabled
                      ? "text-muted-foreground/30 cursor-not-allowed"
                      : "hover:bg-hover-bg"
                  }`}
                >
                  <span>{opt.label}</span>
                  {value === opt.value && (
                    <span className="text-accent">
                      <Check size={12} weight="bold" />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
