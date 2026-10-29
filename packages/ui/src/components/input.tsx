import * as React from "react"

import { cn } from "../lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full min-w-0 rounded-md border border-fuchsia-200 bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-fuchsia-700 placeholder:text-fuchsia-400 hover:border-fuchsia-300 focus-visible:outline-none focus-visible:border-fuchsia-500 focus-visible:ring-1 focus-visible:ring-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:text-sm dark:border-fuchsia-900/50 dark:hover:border-fuchsia-800 dark:file:text-fuchsia-300",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }