"use client"

import { useState, useMemo, useRef } from "react"
import { Bell } from "lucide-react"
import { format } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { getSnoozeTime, type SnoozePreset } from "@/lib/queries/notes"

interface RemindPickerProps {
  onSelect: (isoDate: string) => void
  triggerContent?: React.ReactNode
  align?: "start" | "center" | "end"
}

const PRESETS: { key: SnoozePreset; label: string }[] = [
  { key: "3h", label: "Later today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "3-days", label: "In 3 days" },
  { key: "next-week", label: "Next Monday" },
  { key: "1-week", label: "In 1 week" },
]

export function RemindPicker({ onSelect, triggerContent, align = "start" }: RemindPickerProps) {
  const [open, setOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState("10:00")
  const timeRef = useRef<HTMLInputElement>(null)

  const presets = useMemo(() => {
    return PRESETS.map(({ key, label }) => {
      const iso = getSnoozeTime(key)
      const date = new Date(iso)
      let formatted: string
      if (key === "3h") {
        formatted = "Today " + format(date, "h:mm a")
      } else {
        formatted = format(date, "EEE h:mm a")
      }
      return { key, label, formatted, iso }
    })
  }, [])

  function handlePresetClick(iso: string) {
    onSelect(iso)
    setOpen(false)
  }

  function handleSetCustom() {
    if (!selectedDate) return
    const [hours, minutes] = (timeRef.current?.value ?? selectedTime).split(":").map(Number)
    const combined = new Date(selectedDate)
    combined.setHours(hours, minutes, 0, 0)
    onSelect(combined.toISOString())
    setOpen(false)
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {triggerContent ? (
          <span>{triggerContent}</span>
        ) : (
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            aria-label="Set reminder"
          >
            <Bell className="h-4 w-4" />
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent align={align} className="w-[280px] p-3">
        {/* Presets */}
        <div className="flex flex-col gap-0.5">
          {presets.map(({ key, label, formatted, iso }) => (
            <button
              key={key}
              type="button"
              onClick={() => handlePresetClick(iso)}
              className="w-full flex items-center justify-between px-3 py-2 text-[14px] rounded-md hover:bg-secondary transition-colors"
            >
              <span className="text-foreground font-medium">{label}</span>
              <span className="text-muted-foreground text-[12px]">{formatted}</span>
            </button>
          ))}
        </div>

        {/* Separator */}
        <div className="border-t border-border my-2" />

        {/* Custom date section */}
        <div>
          <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider px-3 mb-2">
            Custom
          </p>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={{ before: today }}
            className="p-0"
          />
          <div className="flex items-center gap-2 mt-2 px-1">
            <input
              ref={timeRef}
              type="time"
              defaultValue={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="h-8 w-full rounded-md border border-border bg-background px-2 text-[14px] focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              type="button"
              onClick={handleSetCustom}
              disabled={!selectedDate}
              className="bg-accent text-accent-foreground text-[14px] font-medium rounded-md px-3 py-1.5 hover:bg-accent/80 disabled:opacity-50 whitespace-nowrap transition-colors"
            >
              Set
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
