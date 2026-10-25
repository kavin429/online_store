import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
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
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
        iconSm: "h-8 w-8 rounded-full",
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
