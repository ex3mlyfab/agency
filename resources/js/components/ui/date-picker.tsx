import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: Date
  onChange?: (date?: Date) => void
  disabled?: boolean
  className?: string
  placeholder?: string
  fromYear?: number
  toYear?: number
  captionLayout?: "dropdown" | "dropdown-months" | "dropdown-years" | "label"
}

export function DatePicker({
  value,
  onChange,
  disabled,
  className,
  placeholder = "Pick a date",
  fromYear = 1900,
  toYear = new Date().getFullYear() + 10,
  captionLayout = "dropdown",
}: DatePickerProps) {
  const handleSelect = (date: Date | undefined) => {
    onChange?.(date)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleSelect}
          autoFocus
          disabled={disabled}
          captionLayout={captionLayout}
          startMonth={new Date(fromYear, 0)}
          endMonth={new Date(toYear, 0)}
        />
      </PopoverContent>
    </Popover>
  )
}
