import * as React from "react"

import { cn } from "@/lib/utils"

function extractDigits(value: string): string {
  return value.replace(/\D/g, "")
}

function formatCurrencyFromDigits(digits: string): string {
  if (!digits) return ""
  const value = Number(digits) / 100

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

interface CurrencyInputProps extends Omit<React.ComponentProps<"input">, "type" | "inputMode" | "value" | "onChange"> {
  value?: string
  onValueChange?: (value: string) => void
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(({ className, value = "", onValueChange, ...props }, ref) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const digits = extractDigits(event.target.value)
    const formatted = formatCurrencyFromDigits(digits)
    onValueChange?.(formatted)
  }

  return (
    <input
      ref={ref}
      type="text"
      inputMode="numeric"
      data-slot="currency-input"
      value={value}
      onChange={handleChange}
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm file:cursor-pointer",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  )
})

CurrencyInput.displayName = "CurrencyInput"

export { CurrencyInput }
