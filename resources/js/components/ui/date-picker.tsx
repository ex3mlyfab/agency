import * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  id?: string
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
  id,
  value,
  onChange,
  disabled,
  className,
  placeholder = "Select date",
  fromYear = 1900,
  toYear = new Date().getFullYear() + 10,
  captionLayout = "dropdown",
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className={cn(
            "w-full justify-start font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          {value ? value.toLocaleDateString() : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          defaultMonth={value}
          captionLayout={captionLayout}
          startMonth={new Date(fromYear, 0)}
          endMonth={new Date(toYear, 0)}
          onSelect={(date) => {
            onChange?.(date)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
