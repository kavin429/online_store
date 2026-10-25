import * as React from "react";
import { cn } from "../lib/utils";

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variant === "default" && "bg-green-800 text-white",
        variant === "secondary" && "bg-gray-200 text-gray-800",
        variant === "outline" &&
          "border border-input bg-transparent text-foreground",
        className
      )}
      {...props}
    />
  );
}
