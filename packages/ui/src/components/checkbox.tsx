"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "../lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer grid h-4 w-4 shrink-0 place-content-center rounded-[2px] border border-gray-400 dark:border-gray-300 bg-white shadow-sm",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:bg-white data-[state=checked]:border-fuchsia-500",
      "dark:bg-zinc-900 dark:border-zinc-600 dark:data-[state=checked]:bg-zinc-900 dark:data-[state=checked]:border-fuchsia-500",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center text-fuchsia-500">
      <Check className="h-3.5 w-3.5" strokeWidth={3} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))

Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }