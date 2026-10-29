import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-fuchsia-600 text-white shadow hover:bg-fuchsia-700 dark:bg-fuchsia-700 dark:hover:bg-fuchsia-600",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-fuchsia-300 bg-transparent text-fuchsia-700 shadow-sm hover:bg-fuchsia-100 hover:text-fuchsia-800 dark:border-fuchsia-800 dark:text-fuchsia-300 dark:hover:bg-fuchsia-950/50 dark:hover:text-fuchsia-200",
        secondary:
          "bg-fuchsia-100 text-fuchsia-900 shadow-sm hover:bg-fuchsia-200 dark:bg-fuchsia-950/50 dark:text-fuchsia-100 dark:hover:bg-fuchsia-900/60",
        ghost:
          "text-fuchsia-700 hover:bg-fuchsia-100 hover:text-fuchsia-900 dark:text-fuchsia-300 dark:hover:bg-fuchsia-950/50 dark:hover:text-fuchsia-100",
        link: "text-fuchsia-600 underline-offset-4 hover:underline dark:text-fuchsia-400",
        shoe: "text-white bg-gradient-to-r from-fuchsia-600 to-fuchsia-500 dark:from-fuchsia-800 dark:to-fuchsia-700 hover:opacity-80 dark:hover:opacity-90 transition",
        shoesecondary:
          "text-white font-semibold bg-gradient-to-r from-fuchsia-500/90 to-fuchsia-400/90 dark:bg-gradient-to-r dark:from-fuchsia-700 dark:to-fuchsia-600 hover:opacity-90 transition-all",
        // hostructive:
        //   "text-white font-semibold bg-red-500 dark:bg-red-800 hover:opacity-90 transition",
        expired:
          "text-white font-semibold bg-red-500 dark:bg-red-800 hover:opacity-90 transition",
        upcoming:
          "text-white font-semibold bg-yellow-500 dark:bg-yellow-800 hover:opacity-90 transition",
        edit:
          "text-fuchsia-500 dark:text-fuchsia-400 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-950/40 hover:text-fuchsia-600 dark:hover:text-fuchsia-300 transition-colors",
        delete:
          "text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-300 transition-colors",
      },
      // Slightly larger touch targets on mobile, original sizes from sm up
      size: {
        default: "h-10 px-4 py-2 sm:h-9",
        sm: "h-9 rounded-md px-3 text-xs sm:h-8",
        lg: "h-11 rounded-md px-6 sm:h-10 sm:px-8",
        icon: "h-10 w-10 sm:h-9 sm:w-9",
        iconSm: "h-9 w-9 rounded-full sm:h-8 sm:w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };